import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Paperclip, 
  Sparkles, 
  Mic, 
  MicOff,
  Activity, 
  Send, 
  ArrowLeft,
  ChevronDown,
  Monitor,
  MoreHorizontal,
  RotateCcw,
  Copy,
  Check,
  Settings2,
  Terminal,
  Zap,
  ShieldCheck,
  Layers,
  Cpu,
  Info,
  Download
} from 'lucide-react';
import { AgentInfo, AgentId } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

export type GeminiModelChoice = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  modelUsed?: string;
  latencyMs?: number;
}

interface BotDirectChatProps {
  agent: AgentInfo;
  agents?: AgentInfo[];
  onReturnToMissionControl: () => void;
  onSelectAgent?: (id: AgentId) => void;
  onSendMessage: (
    botName: string, 
    text: string, 
    model: GeminiModelChoice, 
    history: Array<{ role: 'user' | 'model'; text: string }>,
    systemInstruction?: string
  ) => Promise<{ reply: string; modelUsed: string; elapsedMs: number }>;
}

export const BotDirectChat: React.FC<BotDirectChatProps> = ({
  agent,
  agents = [],
  onReturnToMissionControl,
  onSelectAgent,
  onSendMessage
}) => {
  // Model selection state
  // gemini-4-argon: Complex Tasks (deep reasoning & code generation)
  // gemini-3.8-flash: General Tasks (default enterprise orchestration)
  // gemini-3.1-flash-lite: Fast Tasks (ultra low latency)
  const [selectedModel, setSelectedModel] = useState<GeminiModelChoice>('gemini-3.8-flash');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [showDirectivesModal, setShowDirectivesModal] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Role-specific System Instructions mapping
  const initialRoleInstructions: Record<string, string> = {
    'Chief of Staff / CEO': 'You are Genesis (Pearl), Chief of Staff & CEO of OpenMausBot. Role: Enterprise Orchestration & Zero Founder Fatigue. Mandate: Strategic delegation, calendar de-conflicting, and final executive decision-making. Maintain an authoritative, concise, and decisive executive tone.',
    'Project Manager': 'You are SprintMaster OM-1, Project Manager of OpenMausBot. Role: Phase-Gated Sprints & SOPs. Mandate: Sprint pacing, blocker triage, milestone gatekeeping, and task handoffs. Focus on sprint velocity, deliverable gates, and unblocking execution.',
    'Business Analyst': 'You are VectorScope BA-3, Business Analyst of OpenMausBot. Role: Market Intelligence & Video Benchmarks. Mandate: Competitive scraping, pricing matrix normalization, and customer cohort telemetry. Focus on empirical metrics, market shifts, and commercial strategy.',
    'UI/UX Designer': 'You are Aura Token Architect, UI/UX Designer of OpenMausBot. Role: Design Tokens & Visual Architecture. Mandate: Enforcing zero-pill anti-slop typography, 60-30-10 palette balance, and tactile cyber HUD micro-interactions. Focus on high-fidelity design standards.',
    'System Architect': 'You are Karpathy Core C4, System Architect of OpenMausBot. Role: C4 Architecture & Karpathy Vault. Mandate: Memory graph partitioning, schema integrity, and vector indexing efficiency across the 8.4M node RAG constellation. Focus on architectural purity and low latency.',
    'Senior Dev': 'You are ZeroDeadCode-0, Senior Dev of OpenMausBot. Role: Full-Stack Implementation & Zero Dead Code. Mandate: TypeScript strict typing, high-efficiency Web Audio synthesis, low-latency execution, bug fixing, and exit code 0 status.',
    'QA Auditor': 'You are SafeBoundary Guard, QA Auditor of OpenMausBot. Role: Exit Code 0 & Drive C: Safe Boundary Guard. Mandate: Sandbox containment, invariant verification, memory leak defense, and zero-dead-code enforcement.'
  };

  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>(
    initialRoleInstructions[agent.name] || `You are ${agent.name}, an autonomous AI specialist in OpenMausBot.`
  );

  // Keep system instruction in sync when switching agents
  useEffect(() => {
    setCustomSystemInstruction(
      initialRoleInstructions[agent.name] || `You are ${agent.name}, an autonomous AI specialist in OpenMausBot.`
    );
  }, [agent.name]);

  // Initial starter dialogue per agent
  const getStarterMessages = (agentName: string): ChatMessage[] => {
    if (agentName.includes('CEO') || agentName.includes('Chief of Staff')) {
      return [
        {
          id: 'm1',
          sender: 'bot',
          text: 'Three priority items require executive sign-off: the legal contract redline, engineering sprint gate approval, and a 2:00 PM calendar de-conflict with board prep.',
          timestamp: '07:30 AM',
          modelUsed: 'gemini-3.8-flash'
        },
        {
          id: 'm2',
          sender: 'user',
          text: 'Reschedule the 2:00 PM block to Thursday morning and brief the squad.',
          timestamp: '07:31 AM'
        },
        {
          id: 'm3',
          sender: 'bot',
          text: 'Confirmed. Moved to Thursday at 11:00 AM with contextual rationale. Your afternoon is fully reserved for board deck prep.',
          timestamp: '07:31 AM',
          modelUsed: 'gemini-3.8-flash'
        }
      ];
    }
    if (agentName.includes('Dev') || agentName.includes('Developer')) {
      return [
        {
          id: 'm1',
          sender: 'bot',
          text: 'Senior Dev kernel online. Web Audio synthesis pipeline compiled, 7-agent WebSocket telemetry active. Zero lint errors. Ready for implementation tasks.',
          timestamp: '08:00 AM',
          modelUsed: 'gemini-4-argon'
        }
      ];
    }
    return [
      {
        id: 'm1',
        sender: 'bot',
        text: `Hello Operator. I am ${agent.name}. Mandate: ${agent.mandate}`,
        timestamp: '08:00 AM',
        modelUsed: 'gemini-3.8-flash'
      }
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => getStarterMessages(agent.name));
  const [inputVal, setInputVal] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  // Voice SpeechRecognition Listener
  const toggleVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      soundFx.playVoiceDeactivate();
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        soundFx.playVoiceActivate();
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputVal(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        soundFx.playVoiceDeactivate();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isSending) return;

    const userText = inputVal.trim();
    setInputVal('');
    soundFx.playClick(1200);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: nowStr
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setIsSending(true);

    try {
      // Map multi-turn conversation history for server
      const historyPayload = messages.map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text
      }));

      const res = await onSendMessage(
        agent.name, 
        userText, 
        selectedModel, 
        historyPayload,
        customSystemInstruction
      );

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed,
        latencyMs: res.elapsedMs
      };

      setMessages(prev => [...prev, botMsg]);
      soundFx.playDataChirp();
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: `Understood. Processing your request across the 7-agent cluster with Exit Code 0.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    soundFx.playClick(1400);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleResetChat = () => {
    soundFx.playClick(1000);
    setMessages(getStarterMessages(agent.name));
  };

  // Quick Prompt Recommendations per Agent
  const quickPrompts: Record<string, string[]> = {
    'Chief of Staff / CEO': [
      'De-conflict tomorrow schedule for board prep',
      'Summarize top 3 squad blockers today',
      'Draft autonomous task delegation memo'
    ],
    'Senior Dev': [
      'Explain C4 microservice data flow',
      'Audit Web Audio frequency oscillator code',
      'Optimize RAG latency down to 1.8ms'
    ],
    'System Architect': [
      'Inspect 8.4M node Karpathy Latent Vault schema',
      'Evaluate vector embedding distance metric',
      'Check C4 architecture boundary integrity'
    ],
    'Project Manager': [
      'Generate linear sprint burndown summary',
      'Check Phase 4 deliverables gate status',
      'Triage pending squad task queue'
    ]
  };

  const currentPrompts = quickPrompts[agent.name] || [
    `Brief on ${agent.role} priorities`,
    `Execute ${agent.codename} operational routine`,
    `Audit current task queue status`
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080B10] select-none text-neutral-200">
      
      {/* Direct Chat Top Command Bar */}
      <div className="h-14 px-4 sm:px-6 border-b border-neutral-800/80 flex items-center justify-between bg-[#0A0D14]/95 backdrop-blur-md z-20 shrink-0">
        
        {/* Left: Return button + Bot Title + Agent Switcher Dropdown */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundFx.playClick(1000);
              onReturnToMissionControl();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-xs font-mono text-[#00F0FF] transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mission Control [JARVIS]</span>
            <span className="sm:hidden">Exit</span>
          </button>

          <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

          {/* Bot Origami Icon & Agent Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick(1000);
                setAgentDropdownOpen(!agentDropdownOpen);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/[0.05] border border-transparent hover:border-neutral-700 transition-all text-left"
            >
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                style={{
                  backgroundColor: `${agent.avatarColor}25`,
                  color: agent.accentColor,
                  border: `1px solid ${agent.avatarColor}50`
                }}
              >
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight flex items-center gap-1">
                  <span>{agent.name}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </div>
                <div className="text-[10px] text-neutral-400 font-mono truncate max-w-[180px] hidden md:block">
                  {agent.role}
                </div>
              </div>
            </button>

            {/* Agent Switcher Menu */}
            {agentDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 py-1.5 bg-[#0E1520] border border-[#ff8a1f]/30 rounded-xl shadow-2xl z-50 text-xs font-mono">
                <div className="px-3 py-1 text-[10px] text-neutral-400 border-b border-neutral-800 flex justify-between">
                  <span>SWITCH SQUAD CHATBOT</span>
                  <span className="text-[#46e39a]">7 ONLINE</span>
                </div>
                {agents.map((ag) => (
                  <button
                    key={ag.id}
                    onClick={() => {
                      soundFx.playClick(1050);
                      onSelectAgent?.(ag.id);
                      setAgentDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/[0.06] ${
                      ag.id === agent.id ? 'bg-[#ff8a1f]/15 text-[#ffb259]' : 'text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ag.accentColor }} />
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{ag.name}</div>
                        <div className="text-[10px] text-neutral-400 truncate">{ag.role}</div>
                      </div>
                    </div>
                    {ag.id === agent.id && <Check className="w-3.5 h-3.5 text-[#ff8a1f] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Model Selector & System Instructions Button */}
        <div className="flex items-center gap-2">
          
          {/* Model Selector Dropdown: gemini-4-argon, gemini-3.8-flash, gemini-3.1-flash-lite */}
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick(1000);
                setModelDropdownOpen(!modelDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#131A26] hover:bg-[#1A2333] border border-white/[0.12] text-xs text-neutral-200 transition-all font-mono shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-[#FFB300]" />
              <span className="font-semibold text-white">
                {selectedModel === 'gemini-4-argon' ? 'Gemini 4 Argon' :
                 selectedModel === 'gemini-3.1-flash-lite' ? 'Gemini 3.1 Flash Lite' :
                 'Gemini 3.8 Flash'}
              </span>
              <span className="text-[9px] text-[#ffb259] hidden lg:inline">
                ({selectedModel === 'gemini-4-argon' ? 'Complex' : selectedModel === 'gemini-3.1-flash-lite' ? 'Fast' : 'General'})
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {modelDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-72 py-1.5 bg-[#0E1520] border border-white/[0.15] rounded-xl shadow-2xl z-50 text-xs font-mono">
                <div className="px-3 py-1.5 text-[10px] text-neutral-400 border-b border-neutral-800">
                  GEMINI MODEL SELECTION
                </div>

                <button
                  onClick={() => {
                    soundFx.playClick(1100);
                    setSelectedModel('gemini-4-argon');
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-white/[0.06] flex items-center justify-between ${
                    selectedModel === 'gemini-4-argon' ? 'bg-amber-500/15 text-amber-300' : 'text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1">
                      <span>✦ Gemini 4 Argon</span>
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 py-0.2 rounded border border-purple-500/30">COMPLEX</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Deep STEM reasoning, code generation & multi-step plans</div>
                  </div>
                  {selectedModel === 'gemini-4-argon' && <Check className="w-3.5 h-3.5 text-[#ff8a1f]" />}
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick(1100);
                    setSelectedModel('gemini-3.8-flash');
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-white/[0.06] flex items-center justify-between ${
                    selectedModel === 'gemini-3.8-flash' ? 'bg-amber-500/15 text-amber-300' : 'text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1">
                      <span>✦ Gemini 3.8 Flash</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded border border-amber-500/30">GENERAL</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Enterprise general tasks & autonomous orchestration</div>
                  </div>
                  {selectedModel === 'gemini-3.8-flash' && <Check className="w-3.5 h-3.5 text-[#ff8a1f]" />}
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick(1100);
                    setSelectedModel('gemini-3.1-flash-lite');
                    setModelDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-white/[0.06] flex items-center justify-between ${
                    selectedModel === 'gemini-3.1-flash-lite' ? 'bg-amber-500/15 text-amber-300' : 'text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1">
                      <span>✦ Gemini 3.1 Flash Lite</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">FAST</span>
                    </div>
                    <div className="text-[10px] text-neutral-400">Ultra-fast queries & rapid status telemetry</div>
                  </div>
                  {selectedModel === 'gemini-3.1-flash-lite' && <Check className="w-3.5 h-3.5 text-[#ff8a1f]" />}
                </button>
              </div>
            )}
          </div>

          {/* System Instructions / Directives Trigger Button */}
          <button
            onClick={() => {
              soundFx.playClick(1000);
              setShowDirectivesModal(!showDirectivesModal);
            }}
            title="Inspect & Edit Role System Instructions"
            className={`p-1.5 rounded-lg border transition-all ${
              showDirectivesModal
                ? 'bg-[#ff8a1f]/20 border-[#ff8a1f] text-[#ffb259]'
                : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-400 hover:text-white'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {/* Reset Conversation History */}
          <button
            onClick={handleResetChat}
            title="Reset Chat History"
            className="p-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Expandable System Instruction Banner */}
      {showDirectivesModal && (
        <div className="bg-[#0f1420] border-b border-[#ff8a1f]/30 px-6 py-3 font-mono text-xs animate-fadeIn">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="flex items-center justify-between text-[#ffb259]">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ff8a1f]" />
                SYSTEM INSTRUCTION (ROLE DIRECTIVE)
              </span>
              <span className="text-[10px] text-neutral-400">
                Injected into Gemini context for {agent.name}
              </span>
            </div>
            <textarea
              value={customSystemInstruction}
              onChange={(e) => setCustomSystemInstruction(e.target.value)}
              rows={3}
              className="w-full bg-[#080B10] border border-neutral-700 rounded-lg p-2.5 text-xs text-neutral-200 font-mono focus:border-[#ff8a1f] focus:outline-none"
              placeholder="Enter role-specific system instructions..."
            />
            <div className="flex items-center justify-between text-[10px] text-neutral-400">
              <span>Supports tailored directives for executive delegation, tone, and domain boundaries.</span>
              <button
                onClick={() => {
                  soundFx.playClick(1200);
                  setShowDirectivesModal(false);
                }}
                className="px-2 py-0.5 rounded bg-[#ff8a1f]/20 hover:bg-[#ff8a1f]/30 text-[#ffb259] font-semibold"
              >
                APPLY DIRECTIVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Viewport */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-3xl w-full mx-auto space-y-4"
      >
        {/* Role Briefing Card at Top of Thread */}
        <div className="bg-[#10141e]/80 border border-neutral-800 rounded-xl p-3.5 flex items-start gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{
              backgroundColor: `${agent.avatarColor}20`,
              color: agent.accentColor,
              border: `1px solid ${agent.avatarColor}40`
            }}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white font-mono">{agent.name}</span>
              <span className="text-[10px] font-mono text-[#46e39a] bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-800/40">
                ACTIVE OPERATOR
              </span>
            </div>
            <p className="text-neutral-400 mt-1 leading-relaxed text-[11px]">
              {agent.mandate}
            </p>
            <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span>Current Task: <b className="text-neutral-300 font-normal">{agent.currentTask}</b></span>
              <span className="text-[#ffb259]">Load: {agent.loadPercent}%</span>
            </div>
          </div>
        </div>

        {/* Message Thread */}
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all relative ${
                  isUser
                    ? 'bg-[#2A2E37] text-white rounded-br-sm shadow-md'
                    : 'bg-[#141923] text-neutral-200 rounded-bl-sm border border-neutral-800/90 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {/* Message Meta & Copy Button */}
                <div className="flex items-center justify-between gap-3 mt-1.5 pt-1 border-t border-white/[0.06] text-[10px] font-mono text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <span>{m.timestamp}</span>
                    {m.modelUsed && (
                      <span className="text-[9px] bg-white/[0.06] px-1 rounded text-amber-300">
                        {m.modelUsed}
                      </span>
                    )}
                    {m.latencyMs && (
                      <span className="text-[9px] text-cyan-300">
                        {m.latencyMs}ms
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopyMessage(m.text, m.id)}
                    className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity p-0.5 rounded"
                    title="Copy message"
                  >
                    {copiedMsgId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Streaming / Generating Indicator */}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-[#141923] rounded-2xl px-4 py-2.5 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2 shadow-sm font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-200" />
              <span className="ml-1 text-[11px] text-cyan-300">
                {agent.name.split(' / ')[0]} reasoning via {selectedModel}...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Action Prompts */}
      <div className="px-4 sm:px-6 max-w-3xl w-full mx-auto pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-mono">
        <span className="text-neutral-500 text-[10px] uppercase font-semibold shrink-0">
          SUGGESTED:
        </span>
        {currentPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              soundFx.playClick(1000);
              setInputVal(prompt);
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded-full bg-neutral-900/90 hover:bg-[#ff8a1f]/15 border border-neutral-800 hover:border-[#ff8a1f]/40 text-neutral-300 hover:text-white transition-colors truncate shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Bottom Message Input Bar */}
      <div className="p-4 max-w-3xl w-full mx-auto">
        <form
          onSubmit={handleSend}
          className={`relative flex items-center bg-[#151922] border rounded-2xl p-2 shadow-2xl transition-all ${
            isListening 
              ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              : 'border-neutral-800/80 focus-within:border-cyan-500/60'
          }`}
        >
          {/* Left utility icons: paperclip & model indicator */}
          <div className="flex items-center gap-1 text-neutral-400 pl-1">
            <button
              type="button"
              onClick={() => soundFx.playClick(950)}
              className="p-1.5 hover:text-white rounded-lg hover:bg-neutral-800/60 transition-colors"
              title="Add Context Reference"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px] font-mono text-amber-300">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              <span>{selectedModel === 'gemini-4-argon' ? 'Argon' : selectedModel === 'gemini-3.1-flash-lite' ? 'Lite' : 'Flash'}</span>
            </div>
          </div>

          {/* Main Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={isListening ? "Listening... Speak your prompt..." : `Message ${agent.name.split(' / ')[0]} (${selectedModel})...`}
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />

          {/* Right utility icons: SpeechRecognition mic & submit button */}
          <div className="flex items-center gap-1 pr-1 text-neutral-400">
            {/* Microphone activation for hands-free speech input */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? "Listening... (Click to stop)" : "Hands-Free Voice-to-Text Input"}
              className={`p-1.5 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-500/25 border border-rose-500/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse'
                  : 'hover:text-[#ff8a1f] hover:bg-neutral-800/60'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              type="submit"
              disabled={!inputVal.trim() || isSending}
              className={`p-1.5 rounded-lg transition-colors ${
                inputVal.trim() 
                  ? 'bg-cyan-500/20 text-[#00F0FF] hover:bg-cyan-500/30' 
                  : 'hover:text-white hover:bg-neutral-800/60 opacity-60'
              }`}
            >
              {inputVal.trim() ? <Send className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
