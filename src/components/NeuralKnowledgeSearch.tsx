import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, 
  Brain, 
  Sparkles, 
  X, 
  ChevronRight, 
  ArrowRight, 
  Zap, 
  Layers, 
  Database, 
  Cpu, 
  Compass, 
  Flame,
  CornerDownLeft,
  Command,
  Mic,
  MicOff,
  Volume2,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Radio,
  ExternalLink
} from 'lucide-react';
import { 
  INITIAL_NODES, 
  CATEGORY_COLORS, 
  PRESET_QUERIES, 
  VaultNode, 
  MemoryCategory 
} from './KarpathyVault3D';
import { soundFx } from '../utils/audioSynthesizer';
import { QuickTriggerAction } from '../types/cockpit';

interface NeuralKnowledgeSearchProps {
  onNavigateToVault?: (nodeId: string, query?: string) => void;
  onExecuteTrigger?: (action: QuickTriggerAction) => void;
  onSubmitCommand?: (cmd: string) => void;
  onOpenModal?: (type: 'routines' | 'triggers' | 'apps') => void;
  className?: string;
}

interface ScoredNode {
  node: VaultNode;
  score: number; // 0.0 - 1.0
  matchedTokens: string[];
}

interface DetectedCommandInfo {
  name: string;
  actionType: 'trigger' | 'modal' | 'vault' | 'clear' | 'cli';
  triggerKey?: QuickTriggerAction;
  modalKey?: 'routines' | 'triggers' | 'apps';
}

export const NeuralKnowledgeSearch: React.FC<NeuralKnowledgeSearchProps> = ({
  onNavigateToVault,
  onExecuteTrigger,
  onSubmitCommand,
  onOpenModal,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  // Voice-to-Text Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [executedCommandBanner, setExecutedCommandBanner] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const commandTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check Web Speech API availability on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const hasSpeech = !!(win.SpeechRecognition || win.webkitSpeechRecognition);
    setSpeechSupported(hasSpeech);
  }, []);

  // Global Keyboard Shortcut: Cmd+K, Ctrl+K or '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundFx.playClick(1200);
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        soundFx.playClick(1200);
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voice Command Evaluator
  const evaluateVoiceCommand = useCallback((spokenText: string): boolean => {
    const clean = spokenText.toLowerCase().trim().replace(/[.,!?;:]/g, '');
    
    // Command Dictionary Matchers
    const commandMap: { regex: RegExp; info: DetectedCommandInfo }[] = [
      {
        regex: /^(deploy agents?|deploy squad|launch agents?|deploy)$/i,
        info: { name: 'DEPLOY AGENTS', actionType: 'trigger', triggerKey: 'DEPLOY AGENTS' }
      },
      {
        regex: /^(sync vault|sync memory|synchronize vault|sync)$/i,
        info: { name: 'SYNC VAULT', actionType: 'trigger', triggerKey: 'SYNC VAULT' }
      },
      {
        regex: /^(run workflow|execute workflow|start workflow|workflow)$/i,
        info: { name: 'RUN WORKFLOW', actionType: 'trigger', triggerKey: 'RUN WORKFLOW' }
      },
      {
        regex: /^(purge cache|clear cache|purge memory|flush cache)$/i,
        info: { name: 'PURGE CACHE', actionType: 'trigger', triggerKey: 'PURGE CACHE' }
      },
      {
        regex: /^(optimize path|optimize pipeline|optimize)$/i,
        info: { name: 'OPTIMIZE PATH', actionType: 'trigger', triggerKey: 'OPTIMIZE PATH' }
      },
      {
        regex: /^(open routines|show routines|routines|view routines)$/i,
        info: { name: 'ROUTINES MODAL', actionType: 'modal', modalKey: 'routines' }
      },
      {
        regex: /^(open triggers|show triggers|triggers|automation triggers)$/i,
        info: { name: 'TRIGGERS MODAL', actionType: 'modal', modalKey: 'triggers' }
      },
      {
        regex: /^(open apps|show apps|apps|connected apps|integrations)$/i,
        info: { name: 'APPS MODAL', actionType: 'modal', modalKey: 'apps' }
      },
      {
        regex: /^(explore vault|open vault|3d vault|explore in 3d|vault centroid)$/i,
        info: { name: '3D MEMORY VAULT', actionType: 'vault' }
      },
      {
        regex: /^(clear search|clear input|reset search|clear)$/i,
        info: { name: 'CLEAR SEARCH', actionType: 'clear' }
      }
    ];

    for (const item of commandMap) {
      if (item.regex.test(clean)) {
        soundFx.playVoiceSuccess();
        setExecutedCommandBanner(`Voice Command Executed: ${item.info.name}`);

        if (commandTimeoutRef.current) clearTimeout(commandTimeoutRef.current);
        commandTimeoutRef.current = setTimeout(() => {
          setExecutedCommandBanner(null);
        }, 3600);

        if (item.info.actionType === 'trigger' && item.info.triggerKey && onExecuteTrigger) {
          onExecuteTrigger(item.info.triggerKey);
        } else if (item.info.actionType === 'modal' && item.info.modalKey && onOpenModal) {
          onOpenModal(item.info.modalKey);
        } else if (item.info.actionType === 'vault' && onNavigateToVault) {
          onNavigateToVault('vault-centroid');
          setIsOpen(false);
        } else if (item.info.actionType === 'clear') {
          setQuery('');
        }

        return true;
      }
    }

    return false;
  }, [onExecuteTrigger, onOpenModal, onNavigateToVault]);

  // Toggle Voice-to-Text Listener
  const toggleListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
      setVoiceError('Web Speech API is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      setIsOpen(true);
      return;
    }

    if (isListening) {
      // Stop listening
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch {
        // ignore
      }
      setIsListening(false);
      setInterimTranscript('');
      soundFx.playVoiceDeactivate();
      return;
    }

    // Start listening
    try {
      setVoiceError(null);
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
        soundFx.playVoiceActivate();
        setIsOpen(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalText += item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }

        const currentSpoken = (finalText || interimText).trim();
        if (currentSpoken) {
          setInterimTranscript(currentSpoken);
          setQuery(currentSpoken);
          setIsOpen(true);

          // Evaluate for hands-free system commands
          const wasCommand = evaluateVoiceCommand(currentSpoken);
          if (wasCommand && finalText) {
            // If executed, we can stop or keep listening
            setTimeout(() => {
              setInterimTranscript('');
            }, 1200);
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission blocked. Please allow microphone access in browser settings.');
        } else if (event.error === 'no-speech') {
          // Silence, keep listener alive without loud error
        } else {
          setVoiceError(`Voice recognition: ${event.error}`);
        }
        setIsListening(false);
        soundFx.playVoiceDeactivate();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to start microphone listener';
      setVoiceError(errMsg);
      setIsListening(false);
    }
  }, [isListening, evaluateVoiceCommand]);

  // Clean up recognition instance on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (commandTimeoutRef.current) {
        clearTimeout(commandTimeoutRef.current);
      }
    };
  }, []);

  // Compute Search Matches & Semantic Ranking
  const searchResults = useMemo<ScoredNode[]>(() => {
    const cleanQuery = query.trim().toLowerCase();
    const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);

    // Filter by category first if chosen
    const candidateNodes = selectedCategory === 'all' 
      ? INITIAL_NODES 
      : INITIAL_NODES.filter(n => n.category === selectedCategory);

    if (queryTokens.length === 0) {
      // Return top nodes sorted by access frequency and base weight
      return candidateNodes
        .slice()
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 7)
        .map(node => ({
          node,
          score: Number((node.baseWeight * 0.95).toFixed(3)),
          matchedTokens: []
        }));
    }

    const scored: ScoredNode[] = [];

    for (const node of candidateNodes) {
      let score = 0;
      const matchedTokens: string[] = [];
      const labelLower = node.label.toLowerCase();
      const snippetLower = node.chunkSnippet.toLowerCase();
      const idLower = node.id.toLowerCase();
      const categoryLower = node.category.toLowerCase();

      // Check each token
      for (const token of queryTokens) {
        let tokenMatched = false;

        // Exact match in label: high weight
        if (labelLower === token) {
          score += 45;
          tokenMatched = true;
        } else if (labelLower.includes(token)) {
          score += 30;
          tokenMatched = true;
        }

        // Match in snippet: medium weight
        if (snippetLower.includes(token)) {
          score += 20;
          tokenMatched = true;
        }

        // Match in ID or category
        if (idLower.includes(token) || categoryLower.includes(token)) {
          score += 15;
          tokenMatched = true;
        }

        if (tokenMatched) {
          matchedTokens.push(token);
        }
      }

      // If at least one token matched or query is partial
      if (matchedTokens.length > 0) {
        const accessBoost = Math.min(15, (node.accessCount / 1420) * 15);
        const weightBoost = node.currentRecallWeight * 10;
        const totalRaw = score + accessBoost + weightBoost;
        const normScore = Math.min(0.99, Number((0.65 + (totalRaw / 150) * 0.34).toFixed(3)));

        scored.push({
          node,
          score: normScore,
          matchedTokens
        });
      }
    }

    return scored.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [query, selectedCategory]);

  // Handle keyboard navigation inside search list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % searchResults.length);
      soundFx.playClick(900);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
      soundFx.playClick(900);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = searchResults[selectedIndex];
      if (selected) {
        handleInspectNode(selected.node.id);
      }
    }
  };

  const handleInspectNode = (nodeId: string) => {
    soundFx.playNodeSelect();
    setIsOpen(false);
    onNavigateToVault?.(nodeId, query);
  };

  const handleSelectPresetQuery = (presetQuery: string) => {
    soundFx.playDataChirp();
    setQuery(presetQuery);
    inputRef.current?.focus();
  };

  // Helper to highlight query matches in snippet
  const renderHighlightedText = (text: string, matchedTokens: string[]) => {
    if (!matchedTokens.length || !query.trim()) {
      return <span>{text}</span>;
    }

    const escaped = matchedTokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    if (!escaped) return <span>{text}</span>;

    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <mark key={i} className="bg-[#ff8a1f]/30 text-amber-200 font-semibold px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      
      {/* Search Input Trigger Bar with Hands-Free Voice Listener Button */}
      <div 
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0a0d16]/90 border transition-all duration-200 ${
          isListening
            ? 'border-rose-500 shadow-[0_0_18px_rgba(244,63,94,0.4)] bg-[#120a0d]'
            : isOpen 
              ? 'border-[#ff8a1f] shadow-[0_0_15px_rgba(255,138,31,0.25)] bg-[#0c101c]' 
              : 'border-white/[0.12] hover:border-[#ff8a1f]/50 hover:bg-[#0e1322]'
        }`}
      >
        <Brain className={`w-3.5 h-3.5 shrink-0 transition-colors ${
          isListening 
            ? 'text-rose-400 animate-pulse' 
            : isOpen 
              ? 'text-[#ff8a1f] animate-pulse' 
              : 'text-[#ffb259]'
        }`} />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            soundFx.playClick(1100);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening... Speak command or search..." : "Neural Knowledge Search..."}
          className="w-40 sm:w-48 md:w-56 lg:w-64 bg-transparent text-xs text-white placeholder:text-neutral-500 font-mono outline-none truncate"
        />

        {/* Real-time Hands-Free Microphone Activation Button */}
        <button
          type="button"
          onClick={toggleListening}
          title={
            !speechSupported
              ? "Speech Recognition not supported in this browser (Use Chrome/Edge/Safari)"
              : isListening
                ? "Voice Listener ACTIVE (Click to stop microphone)"
                : "Voice-to-Text Listener (Click to speak hands-free commands or search)"
          }
          className={`relative p-1 rounded-md transition-all flex items-center gap-1 shrink-0 ${
            isListening
              ? 'bg-rose-500/25 border border-rose-500/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
              : !speechSupported
                ? 'opacity-40 text-neutral-600 cursor-not-allowed'
                : 'text-neutral-400 hover:text-[#ff8a1f] hover:bg-white/[0.08]'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              {/* Dynamic Equalizer Waveform Bars */}
              <div className="flex items-center gap-0.5 h-3.5 px-0.5">
                <span className="w-0.5 bg-rose-400 rounded-full voice-wave-bar-1" />
                <span className="w-0.5 bg-rose-400 rounded-full voice-wave-bar-2" />
                <span className="w-0.5 bg-rose-400 rounded-full voice-wave-bar-3" />
                <span className="w-0.5 bg-rose-400 rounded-full voice-wave-bar-4" />
              </div>
            </>
          ) : (
            <Mic className="w-3.5 h-3.5" />
          )}
        </button>

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setInterimTranscript('');
              inputRef.current?.focus();
            }}
            className="text-neutral-500 hover:text-white p-0.5 rounded transition-colors shrink-0"
            title="Clear Search"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[9px] font-mono text-neutral-400 shrink-0">
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </div>
        )}
      </div>

      {/* Voice Command Executed Notification Banner */}
      {executedCommandBanner && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 text-[10px] font-mono px-3 py-1.5 rounded-lg shadow-xl flex items-center justify-between z-50 animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-bounce" />
            <span className="font-semibold">{executedCommandBanner}</span>
          </div>
          <button 
            onClick={() => setExecutedCommandBanner(null)} 
            className="text-emerald-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Insights Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[480px] sm:w-[560px] max-w-[94vw] bg-[#0c0906]/98 border border-[#ff8a1f]/40 rounded-xl shadow-[0_12px_36px_rgba(0,0,0,0.85)] backdrop-blur-xl z-50 overflow-hidden text-xs font-mono animate-fadeIn">
          
          {/* Live Voice Listener HUD Banner when SpeechRecognition is active */}
          {isListening && (
            <div className="px-3.5 py-2.5 bg-rose-950/40 border-b border-rose-500/40 flex flex-col gap-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-300">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <span className="font-bold font-condensed tracking-wider text-xs">
                    HANDS-FREE VOICE-TO-TEXT ACTIVE
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    LISTENING
                  </span>
                </div>

                <button
                  onClick={toggleListening}
                  className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 text-[9px] flex items-center gap-1 transition-colors"
                >
                  <MicOff className="w-2.5 h-2.5" />
                  <span>STOP MIC</span>
                </button>
              </div>

              {/* Spoken transcript preview */}
              <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded border border-rose-500/20 text-[11px] text-rose-100 font-mono">
                <Volume2 className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">
                  {interimTranscript ? `"${interimTranscript}"` : 'Listening for your voice... speak now'}
                </span>
              </div>

              {/* Hands-free Voice Command Quick Tips */}
              <div className="flex items-center gap-1.5 flex-wrap text-[9px] text-rose-200/80 pt-0.5">
                <span className="text-rose-400 font-semibold">VOICE COMMANDS:</span>
                {[
                  { label: '"Deploy Agents"', action: () => onExecuteTrigger?.('DEPLOY AGENTS') },
                  { label: '"Sync Vault"', action: () => onExecuteTrigger?.('SYNC VAULT') },
                  { label: '"Run Workflow"', action: () => onExecuteTrigger?.('RUN WORKFLOW') },
                  { label: '"Purge Cache"', action: () => onExecuteTrigger?.('PURGE CACHE') },
                  { label: '"Routines"', action: () => onOpenModal?.('routines') }
                ].map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundFx.playVoiceSuccess();
                      cmd.action();
                    }}
                    className="px-1.5 py-0.2 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 transition-colors"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice Error Notice if blocked or unsupported */}
          {voiceError && (
            <div className="px-3.5 py-2 bg-amber-950/60 border-b border-amber-500/30 text-amber-200 text-[10px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{voiceError}</span>
              </div>
              <button 
                onClick={() => setVoiceError(null)} 
                className="text-amber-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Dropdown Header: Title & Category Filters */}
          <div className="px-3.5 py-2.5 bg-[#140e08] border-b border-[#ff8a1f]/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#ff8a1f]/15 border border-[#ff8a1f]/40 text-[#ff8a1f]">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-condensed font-bold text-white tracking-wider text-xs">
                  <span>NEURAL RAG RETRIEVAL</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    KARPATHY VAULT
                  </span>
                </div>
                <div className="text-[9px] text-[#9a8878]">
                  Sub-millisecond cosine search across 21 high-dimensional memory embeddings
                </div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-[#0a0705] p-0.5 rounded-md border border-[#ff8a1f]/20 text-[9px]">
              {[
                { id: 'all', label: 'ALL' },
                { id: 'semantic', label: 'SEM' },
                { id: 'episodic', label: 'EPI' },
                { id: 'working', label: 'WORK' },
                { id: 'tools', label: 'TOOL' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    soundFx.playClick(1000);
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-1.5 py-0.5 rounded transition-all uppercase ${
                    selectedCategory === cat.id
                      ? 'bg-[#ff8a1f] text-black font-bold shadow-sm'
                      : 'text-[#9a8878] hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Queries (when query is short or empty) */}
          {!query && (
            <div className="px-3.5 py-2 bg-[#0e0a06] border-b border-neutral-800/80">
              <div className="text-[9px] text-[#9a8878] mb-1.5 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#ff8a1f]" />
                  QUICK INSIGHT PROMPTS:
                </span>
                <span className="text-[9px] text-neutral-500">
                  Tip: Click mic to speak hands-free
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_QUERIES.map((pq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPresetQuery(pq.query)}
                    className="px-2 py-0.5 rounded text-[9px] bg-[#160f0a] hover:bg-[#ff8a1f]/20 text-[#c8b8a8] hover:text-white border border-[#ff8a1f]/20 hover:border-[#ff8a1f]/50 transition-colors truncate max-w-full"
                  >
                    {pq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If user spoke or typed a custom CLI command, offer one-click run */}
          {query.trim().length > 0 && onSubmitCommand && (
            <div className="px-3.5 py-1.5 bg-[#100d14] border-b border-purple-500/20 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-purple-300">
                <Terminal className="w-3 h-3 text-purple-400" />
                <span>Execute command in Kernel:</span>
                <span className="font-mono text-white bg-black/40 px-1.5 py-0.5 rounded border border-purple-500/30 truncate max-w-[200px]">
                  $ {query}
                </span>
              </div>
              <button
                onClick={() => {
                  soundFx.playTriggerChime();
                  onSubmitCommand(query);
                  setIsOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 border border-purple-500/40 font-mono text-[9px] flex items-center gap-1 transition-colors"
              >
                <span>RUN CLI</span>
                <CornerDownLeft className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {/* Search Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 font-mono text-xs">
                <Brain className="w-6 h-6 mx-auto mb-2 text-neutral-600 animate-pulse" />
                <div>No matching knowledge chunks found in latent manifold.</div>
                <div className="text-[10px] text-neutral-600 mt-1">
                  Try speaking "deploy agents", "sync vault", or searching "transformer", "kv-cache", "intent"
                </div>
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const node = item.node;
                const catConfig = CATEGORY_COLORS[node.category];
                const isSelected = idx === selectedIndex;
                const isExpanded = expandedInsightId === node.id;

                return (
                  <div
                    key={node.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`rounded-lg border transition-all duration-150 p-2.5 ${
                      isSelected
                        ? 'bg-[#181008] border-[#ff8a1f]/60 shadow-[0_0_12px_rgba(255,138,31,0.2)]'
                        : 'bg-[#100b07] border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {/* Header: Label, Category, Relevance Score */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: catConfig.css }} 
                        />
                        <span className="font-condensed font-bold text-xs text-white truncate">
                          {node.label}
                        </span>
                        <span 
                          className="px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider font-semibold shrink-0"
                          style={{ color: catConfig.css, backgroundColor: `${catConfig.css}18` }}
                        >
                          {catConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          {Math.round(item.score * 100)}% MATCH
                        </span>
                      </div>
                    </div>

                    {/* Quick Insight Knowledge Snippet */}
                    <div className="text-[11px] text-[#cfbeae] leading-relaxed mb-2 font-sans pl-3 border-l-2 border-[#ff8a1f]/30">
                      {renderHighlightedText(node.chunkSnippet, item.matchedTokens)}
                    </div>

                    {/* Telemetry Chips & Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono pt-1.5 border-t border-neutral-800/80">
                      <div className="flex items-center gap-2 text-[#9a8878]">
                        <span>ACCESS: <b className="text-amber-400">{node.accessCount.toLocaleString()}</b></span>
                        <span>TOKENS: <b className="text-white">{node.tokens}</b></span>
                        <span>DIM: <b className="text-cyan-300">{node.vectorDim}d</b></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpandedInsightId(isExpanded ? null : node.id)}
                          className="px-2 py-0.5 rounded text-[9px] bg-[#140d07] hover:bg-[#ff8a1f]/20 text-[#ffb259] border border-[#ff8a1f]/30 transition-colors"
                        >
                          {isExpanded ? 'LESS DETAILS' : 'QUICK INSIGHT'}
                        </button>

                        <button
                          onClick={() => handleInspectNode(node.id)}
                          className="px-2.5 py-0.5 rounded bg-[#ff8a1f] hover:bg-[#ffb259] text-black font-condensed font-bold text-[10px] tracking-wider flex items-center gap-1 transition-all shadow-[0_0_8px_rgba(255,138,31,0.4)]"
                        >
                          <span>INSPECT IN 3D</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Epistemic Vector Preview */}
                    {isExpanded && (
                      <div className="mt-2.5 p-2 rounded bg-[#090604] border border-neutral-800 text-[9px] space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between text-[#ffb259]">
                          <span className="font-semibold">LATENT EMBEDDING SAMPLE (1536-D):</span>
                          <span className="text-[#9a8878]">Attention Weight: {node.currentRecallWeight}</span>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 font-mono text-[8px] text-cyan-300">
                          {node.embeddingPreview.map((val, i) => (
                            <div key={i} className="bg-cyan-950/40 p-1 rounded border border-cyan-800/30 text-center">
                              {val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                            </div>
                          ))}
                        </div>
                        <div className="text-[10px] text-neutral-400 italic">
                          💡 Quick Insight: Force-directed manifold automatically pulls correlated memory chunks along attention edges with sub-millisecond retrieval latency.
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer: Keyboard Hints & 3D Direct Jump */}
          <div className="px-3.5 py-2 bg-[#120c07] border-t border-[#ff8a1f]/20 flex items-center justify-between text-[9px] text-[#9a8878]">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-neutral-800 rounded text-neutral-300">↑↓</kbd> Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-neutral-800 rounded text-neutral-300">↵</kbd> Select & Inspect
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.2 bg-neutral-800 rounded text-neutral-300">Esc</kbd> Close
              </span>
            </div>

            <button
              onClick={() => {
                soundFx.playClick(1200);
                setIsOpen(false);
                onNavigateToVault?.('vault-centroid');
              }}
              className="text-[#ffb259] hover:text-white flex items-center gap-1 underline font-semibold transition-colors"
            >
              <span>Explore Full 3D Vault</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
