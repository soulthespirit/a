import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  BrainCircuit, 
  Play, 
  Pause, 
  Trash2, 
  Send, 
  Filter, 
  CheckCircle, 
  AlertTriangle,
  CornerDownLeft,
  Search
} from 'lucide-react';
import { StreamLogEntry } from '../types/cockpit';
import { ModernTheme, THEMES } from '../types/theme';
import { soundFx } from '../utils/audioSynthesizer';

interface ReasoningCLIStreamProps {
  logs: StreamLogEntry[];
  onClearLogs: () => void;
  onSubmitCommand: (cmd: string) => void;
  isStreaming: boolean;
  theme: ModernTheme;
}

export const ReasoningCLIStream: React.FC<ReasoningCLIStreamProps> = ({
  logs,
  onClearLogs,
  onSubmitCommand,
  isStreaming,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'reasoning' | 'command'>('reasoning');
  const [isPaused, setIsPaused] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const currentTheme = THEMES[theme];

  useEffect(() => {
    if (!isPaused && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [logs, isPaused, activeTab]);

  const filteredLogs = logs.filter(log => {
    if (log.mode !== activeTab) return false;
    if (!searchTerm) return true;
    return log.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.agentName && log.agentName.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    soundFx.playClick(1400);
    onSubmitCommand(commandInput.trim());
    setCommandInput('');
  };

  return (
    <div 
      className="flex flex-col h-full rounded-xl border overflow-hidden select-none transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.bgPanel,
        borderColor: currentTheme.borderSubtle
      }}
    >
      {/* Terminal Mode Switcher */}
      <div 
        className="px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2"
        style={{ borderColor: currentTheme.borderSubtle }}
      >
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => {
              soundFx.playClick(1000);
              setActiveTab('reasoning');
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'reasoning'
                ? 'bg-white/[0.1] text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" style={{ color: currentTheme.accentPrimary }} />
            <span>AI REASONING</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick(1050);
              setActiveTab('command');
            }}
            className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all ${
              activeTab === 'command'
                ? 'bg-white/[0.1] text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" style={{ color: currentTheme.accentSecondary }} />
            <span>COMMANDS</span>
          </button>
        </div>

        {/* Filter & Controls */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-6 pr-2 py-0.5 text-[11px] bg-black/40 text-neutral-200 placeholder-neutral-500 rounded border border-white/[0.08] focus:outline-none focus:border-white/20 w-24 sm:w-32"
            />
          </div>

          <button
            onClick={() => {
              soundFx.playClick(900);
              setIsPaused(!isPaused);
            }}
            className={`p-1 rounded text-xs border ${
              isPaused 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-white/[0.05] border-white/[0.08] text-neutral-400 hover:text-white'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick(800);
              onClearLogs();
            }}
            className="p-1 rounded text-neutral-400 hover:text-rose-400 bg-white/[0.05] border border-white/[0.08] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 p-3 overflow-y-auto font-mono text-xs space-y-2 min-h-0 bg-black/50"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs py-8">
            <Terminal className="w-5 h-5 mb-2 opacity-30" />
            <span>No logs match current filter.</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="leading-relaxed flex items-start gap-2 hover:bg-white/[0.03] p-1 rounded transition-colors"
            >
              <span className="text-[10px] text-neutral-500 tabular-nums shrink-0 mt-0.5">
                [{log.timestamp}]
              </span>

              {log.agentName && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0 bg-white/[0.06] text-neutral-300 border border-white/[0.08]">
                  {log.agentName}
                </span>
              )}

              <div className="flex-1 min-w-0 break-words">
                {log.type === 'cmd' ? (
                  <span className="text-amber-300 font-semibold">{log.text}</span>
                ) : log.type === 'output' ? (
                  <span className="text-neutral-300">{log.text}</span>
                ) : log.type === 'success' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 shrink-0" />
                    {log.text}
                  </span>
                ) : (
                  <span className="text-neutral-200">{log.text}</span>
                )}
              </div>

              {log.exitCode !== undefined && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  exit {log.exitCode}
                </span>
              )}
            </div>
          ))
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 text-xs py-1 animate-pulse" style={{ color: currentTheme.accentPrimary }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTheme.accentPrimary }} />
            <span>OM-7 ARC CORE streaming...</span>
          </div>
        )}
      </div>

      {/* Terminal Input */}
      <form 
        onSubmit={handleSubmit}
        className="p-2 bg-black/40 border-t flex items-center gap-2"
        style={{ borderColor: currentTheme.borderSubtle }}
      >
        <span className="font-mono text-xs pl-1 font-semibold text-neutral-400">
          {activeTab === 'reasoning' ? 'JARVIS>' : '$'}
        </span>
        <input
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder={
            activeTab === 'reasoning'
              ? 'Query ARC CORE...'
              : 'Enter command (e.g. "vault --sync")...'
          }
          className="flex-1 bg-black/40 text-xs font-mono text-neutral-200 placeholder-neutral-500 px-3 py-1.5 rounded-lg border border-white/[0.08] focus:outline-none focus:border-white/20"
        />
        <button
          type="submit"
          disabled={!commandInput.trim()}
          className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-xs font-mono text-white flex items-center gap-1 transition-all disabled:opacity-40"
        >
          <CornerDownLeft className="w-3 h-3" />
          <span className="hidden sm:inline">RUN</span>
        </button>
      </form>
    </div>
  );
};
