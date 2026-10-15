import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  Layers, 
  Trash2, 
  TrendingUp, 
  Terminal, 
  ChevronUp, 
  ChevronDown, 
  Brain, 
  Sparkles, 
  CornerDownLeft, 
  Activity,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { QuickTriggerAction, StreamLogEntry } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

interface BottomConsoleBarProps {
  onExecuteTrigger: (action: QuickTriggerAction) => void;
  executingAction: QuickTriggerAction | null;
  thoughtLatencyMs: number;
  onToggleBlueprint: () => void;
  blueprintOpen: boolean;
  logs: StreamLogEntry[];
  onClearLogs: () => void;
  onSubmitCommand: (cmd: string) => void;
  isStreaming: boolean;
}

export const BottomConsoleBar: React.FC<BottomConsoleBarProps> = ({
  onExecuteTrigger,
  executingAction,
  thoughtLatencyMs,
  onToggleBlueprint,
  blueprintOpen,
  logs,
  onClearLogs,
  onSubmitCommand,
  isStreaming
}) => {
  const [consoleExpanded, setConsoleExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'reasoning' | 'command'>('reasoning');
  const [inputVal, setInputVal] = useState('');
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, consoleExpanded, activeTab]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    soundFx.playClick(1400);
    onSubmitCommand(inputVal.trim());
    setInputVal('');
  };

  const triggers: { action: QuickTriggerAction; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { action: 'DEPLOY AGENTS', icon: <Zap className="w-3.5 h-3.5" />, label: 'Deploy Agents', shortcut: '⌘1' },
    { action: 'SYNC VAULT', icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'Sync Vault', shortcut: '⌘2' },
    { action: 'RUN WORKFLOW', icon: <Layers className="w-3.5 h-3.5" />, label: 'Run Workflow', shortcut: '⌘3' },
    { action: 'PURGE CACHE', icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Purge Cache', shortcut: '⌘4' },
    { action: 'OPTIMIZE PATH', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Optimize Path', shortcut: '⌘5' },
  ];

  const filteredLogs = logs.filter(l => l.mode === activeTab);

  return (
    <div className="absolute bottom-0 inset-x-0 z-30 select-none">
      
      {/* Expandable Console Drawer */}
      {consoleExpanded && (
        <div className="bg-[#090D17]/95 backdrop-blur-2xl border-t border-white/[0.1] h-64 flex flex-col shadow-2xl">
          {/* Console Header Tabs */}
          <div className="px-4 py-2 border-b border-white/[0.08] flex items-center justify-between bg-[#0C1220]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundFx.playClick(900);
                  setActiveTab('reasoning');
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                  activeTab === 'reasoning'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Multi-Agent Reasoning Traces
              </button>
              <button
                onClick={() => {
                  soundFx.playClick(950);
                  setActiveTab('command');
                }}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                  activeTab === 'command'
                    ? 'bg-amber-500/20 text-amber-300 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                CLI Syscalls & Tool Executions
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  soundFx.playClick(800);
                  onClearLogs();
                }}
                className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-white/[0.05] transition-colors"
                title="Clear Logs"
              >
                <Trash className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConsoleExpanded(false)}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monospace Stream Viewport */}
          <div 
            ref={logContainerRef}
            className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-1.5 min-h-0 bg-black/40"
          >
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 hover:bg-white/[0.02] p-1 rounded">
                <span className="text-[10px] text-neutral-500 shrink-0 mt-0.5">
                  [{log.timestamp}]
                </span>
                {log.agentName && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-white/[0.08] text-neutral-300 shrink-0">
                    {log.agentName}
                  </span>
                )}
                <span className={log.type === 'cmd' ? 'text-amber-300' : 'text-neutral-200'}>
                  {log.text}
                </span>
              </div>
            ))}
            {isStreaming && (
              <div className="flex items-center gap-2 text-cyan-400 text-xs py-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Multi-agent reasoning stream flowing...</span>
              </div>
            )}
          </div>

          {/* Prompt input */}
          <form 
            onSubmit={handleCommandSubmit}
            className="p-2 border-t border-white/[0.08] bg-[#0A0E18] flex items-center gap-2"
          >
            <span className="text-cyan-400 font-mono text-xs pl-1 font-bold">
              {activeTab === 'reasoning' ? 'JARVIS>' : '$'}
            </span>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={activeTab === 'reasoning' ? 'Ask multi-agent squad...' : 'Execute CLI command...'}
              className="flex-1 bg-black/40 text-xs font-mono text-white placeholder-neutral-500 px-3 py-1.5 rounded-lg border border-white/[0.08] focus:outline-none focus:border-cyan-500/50"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-mono flex items-center gap-1 transition-colors disabled:opacity-40"
            >
              <CornerDownLeft className="w-3 h-3" />
              <span>RUN</span>
            </button>
          </form>
        </div>
      )}

      {/* Main Command Bar Strip (Always visible at bottom) */}
      <div className="bg-[#0B0F1C]/95 backdrop-blur-xl border-t border-white/[0.1] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        
        {/* Left: Quick Execution Action Pads */}
        <div className="flex items-center gap-2">
          {triggers.map((item) => {
            const isExecuting = executingAction === item.action;
            return (
              <button
                key={item.action}
                onClick={() => {
                  soundFx.playTriggerChime();
                  onExecuteTrigger(item.action);
                }}
                disabled={!!executingAction}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border ${
                  isExecuting
                    ? 'bg-amber-500/20 border-[#FFB300] text-amber-200 animate-pulse'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-neutral-300 hover:text-white'
                } disabled:opacity-50`}
              >
                <span className={isExecuting ? 'text-[#FFB300]' : 'text-neutral-400'}>
                  {item.icon}
                </span>
                <span className="font-mono text-[11px]">{item.label}</span>
                <span className="text-[9px] font-mono text-neutral-500 bg-black/40 px-1 py-0.2 rounded border border-white/[0.05]">
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Cognitive Blueprint Toggle & Console Toggle */}
        <div className="flex items-center gap-2">
          {/* Cognitive Blueprint HUD Button */}
          <button
            onClick={() => {
              soundFx.playClick(1100);
              onToggleBlueprint();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-all border ${
              blueprintOpen
                ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 border-[#FFB300] text-amber-300 shadow-[0_0_15px_rgba(255,179,0,0.3)]'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 hover:text-amber-300'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-[#FFB300]" />
            <span>THE COGNITIVE BLUEPRINT</span>
            <Sparkles className="w-3 h-3 text-[#FFB300]" />
          </button>

          {/* Toggle Terminal Drawer */}
          <button
            onClick={() => {
              soundFx.playClick(1000);
              setConsoleExpanded(!consoleExpanded);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-colors ${
              consoleExpanded
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-neutral-300 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
            {consoleExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

      </div>
    </div>
  );
};
