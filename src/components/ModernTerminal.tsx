import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  BrainCircuit, 
  Play, 
  Pause, 
  Trash2, 
  Search, 
  CornerDownLeft, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { StreamLogEntry } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

interface ModernTerminalProps {
  logs: StreamLogEntry[];
  onClearLogs: () => void;
  onSubmitCommand: (cmd: string) => void;
  isStreaming: boolean;
}

export const ModernTerminal: React.FC<ModernTerminalProps> = ({
  logs,
  onClearLogs,
  onSubmitCommand,
  isStreaming
}) => {
  const [tab, setTab] = useState<'reasoning' | 'command'>('reasoning');
  const [paused, setPaused] = useState(false);
  const [inputCmd, setInputCmd] = useState('');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, paused, tab]);

  const filtered = logs.filter(l => {
    if (l.mode !== tab) return false;
    if (search && !l.text.toLowerCase().includes(search.toLowerCase()) && !(l.agentName && l.agentName.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const handleRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;
    soundFx.playClick(1400);
    onSubmitCommand(inputCmd.trim());
    setInputCmd('');
  };

  return (
    <div className="bg-[#0D1117] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col h-full select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-[#101520] flex flex-wrap items-center justify-between gap-3">
        {/* Dual Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-xs">
          <button
            onClick={() => {
              soundFx.playClick(1000);
              setTab('reasoning');
            }}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              tab === 'reasoning'
                ? 'bg-white/[0.1] text-white font-medium'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Reasoning Traces</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick(1050);
              setTab('command');
            }}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-colors ${
              tab === 'command'
                ? 'bg-white/[0.1] text-white font-medium'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>CLI & Execution Calls</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter log output..."
              className="pl-7 pr-2.5 py-1 text-xs bg-black/40 text-neutral-200 placeholder-neutral-500 rounded-lg border border-white/[0.08] focus:outline-none focus:border-white/20 w-36"
            />
          </div>

          <button
            onClick={() => {
              soundFx.playClick(900);
              setPaused(!paused);
            }}
            title={paused ? "Resume Auto-scroll" : "Pause Auto-scroll"}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              paused 
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                : 'bg-white/[0.04] border-white/[0.08] text-neutral-400 hover:text-white'
            }`}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              soundFx.playClick(800);
              onClearLogs();
            }}
            title="Clear Stream"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Monospace Logs Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 p-3.5 overflow-y-auto font-mono text-xs space-y-2 min-h-0 bg-black/50"
      >
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-xs py-10">
            <Terminal className="w-6 h-6 mb-2 opacity-30" />
            <span>No {tab === 'reasoning' ? 'reasoning traces' : 'command logs'} match current filter.</span>
          </div>
        ) : (
          filtered.map((log) => (
            <div 
              key={log.id} 
              className="leading-relaxed flex items-start gap-2.5 hover:bg-white/[0.02] p-1 rounded transition-colors group"
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
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {log.text}
                  </span>
                ) : log.type === 'warn' ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {log.text}
                  </span>
                ) : (
                  <span className="text-neutral-200">{log.text}</span>
                )}
              </div>

              {log.exitCode !== undefined && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  exit {log.exitCode}
                </span>
              )}
            </div>
          ))
        )}

        {isStreaming && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs py-1 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>OM-7 ARC CORE thinking stream incoming...</span>
          </div>
        )}
      </div>

      {/* Input Prompt */}
      <form 
        onSubmit={handleRun}
        className="p-2.5 bg-[#101520] border-t border-white/[0.08] flex items-center gap-2"
      >
        <span className="font-mono text-xs pl-1 font-semibold text-neutral-400">
          {tab === 'reasoning' ? 'JARVIS>' : '$'}
        </span>
        <input
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          placeholder={
            tab === 'reasoning'
              ? 'Dispatch prompt to OM-7 multi-agent core...'
              : 'Enter CLI command (e.g. "vault --sync", "npm test")...'
          }
          className="flex-1 bg-black/40 text-xs font-mono text-neutral-200 placeholder-neutral-500 px-3 py-1.5 rounded-lg border border-white/[0.08] focus:outline-none focus:border-white/20"
        />
        <button
          type="submit"
          disabled={!inputCmd.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-xs font-medium text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
        >
          <CornerDownLeft className="w-3 h-3" />
          <span>Run</span>
        </button>
      </form>
    </div>
  );
};
