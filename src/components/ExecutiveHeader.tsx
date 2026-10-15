import React from 'react';
import { 
  Zap, 
  Cpu, 
  RefreshCw, 
  Layers, 
  Trash2, 
  TrendingUp, 
  Activity, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  Radio
} from 'lucide-react';
import { QuickTriggerAction } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

interface ExecutiveHeaderProps {
  onExecuteTrigger: (action: QuickTriggerAction) => void;
  executingAction: QuickTriggerAction | null;
  thoughtLatencyMs: number;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({
  onExecuteTrigger,
  executingAction,
  thoughtLatencyMs
}) => {
  const triggers: { action: QuickTriggerAction; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { action: 'DEPLOY AGENTS', icon: <Zap className="w-3.5 h-3.5" />, label: 'Deploy Agents', shortcut: '⌘1' },
    { action: 'SYNC VAULT', icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'Sync Vault', shortcut: '⌘2' },
    { action: 'RUN WORKFLOW', icon: <Layers className="w-3.5 h-3.5" />, label: 'Run Workflow', shortcut: '⌘3' },
    { action: 'PURGE CACHE', icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Purge Cache', shortcut: '⌘4' },
    { action: 'OPTIMIZE PATH', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Optimize Path', shortcut: '⌘5' },
  ];

  return (
    <div className="bg-[#0D1117] border-b border-white/[0.08] p-4 select-none">
      {/* Top Row: 4 Clean Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
        
        {/* KPI 1: OM-7 Core Synergy */}
        <div className="bg-[#121722] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.12] transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              OM-7 Core Synergy
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% NOMINAL
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-white tracking-tight">
              142.8 <span className="text-xs font-normal text-neutral-400">GHz</span>
            </span>
            <span className="text-xs font-mono text-cyan-300">
              {thoughtLatencyMs.toFixed(1)}ms Latency
            </span>
          </div>
          <div className="mt-2 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 w-full" />
          </div>
        </div>

        {/* KPI 2: Karpathy RAG Index */}
        <div className="bg-[#121722] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.12] transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Karpathy RAG Index
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              98.6% ACCURACY
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-white tracking-tight">
              8,421,904 <span className="text-xs font-normal text-neutral-400">nodes</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">
              Drive E:\ (142.8 GB)
            </span>
          </div>
          <div className="mt-2 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 w-[28.5%]" />
          </div>
        </div>

        {/* KPI 3: Autonomous Task Throughput */}
        <div className="bg-[#121722] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.12] transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Task Throughput
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              EXIT CODE 0
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-white tracking-tight">
              2,384 <span className="text-xs font-normal text-neutral-400">tasks</span>
            </span>
            <span className="text-xs font-mono text-emerald-300">
              0 Anomalies
            </span>
          </div>
          <div className="mt-2 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 w-full" />
          </div>
        </div>

        {/* KPI 4: Zero Founder Fatigue Shield */}
        <div className="bg-[#121722] border border-white/[0.06] rounded-xl p-3 hover:border-white/[0.12] transition-colors">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1.5 font-medium text-neutral-300">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Founder Fatigue Guard
            </span>
            <span className="text-[10px] font-mono text-indigo-300">
              AUTONOMOUS
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-bold text-white tracking-tight">
              100% <span className="text-xs font-normal text-neutral-400">active</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">
              Drive C: Safe Sandbox
            </span>
          </div>
          <div className="mt-2 w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 w-full" />
          </div>
        </div>

      </div>

      {/* Bottom Row: Executive Action Command Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#121722]/80 border border-white/[0.06] rounded-xl p-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white tracking-tight">
            QUICK EXECUTION:
          </span>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Directly orchestrate multi-agent squads and memory vault
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all border ${
                  isExecuting
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 animate-pulse'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-white/20 text-neutral-200 hover:text-white'
                } disabled:opacity-50`}
              >
                <span className={isExecuting ? 'text-cyan-300' : 'text-neutral-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                <span className="text-[10px] font-mono text-neutral-500 bg-black/40 px-1 py-0.2 rounded border border-white/[0.06]">
                  {item.shortcut}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
