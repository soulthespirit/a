import React, { useState } from 'react';
import { 
  Users, 
  Bot, 
  MessageSquare, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  Send
} from 'lucide-react';
import { AgentInfo, AgentId } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

interface SquadTableProps {
  agents: AgentInfo[];
  selectedAgentId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  onOpenChat: (id: AgentId) => void;
  onPingAgent: (id: AgentId) => void;
}

export const SquadTable: React.FC<SquadTableProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onOpenChat,
  onPingAgent
}) => {
  const [filter, setFilter] = useState<'all' | 'executing' | 'active'>('all');

  const filtered = agents.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'executing') return a.status === 'EXECUTING';
    return a.status === 'ACTIVE';
  });

  return (
    <div className="bg-[#0D1117] border border-white/[0.08] rounded-xl overflow-hidden select-none">
      {/* Table Header Controls */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#101520]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              ENTERPRISE SQUAD ORCHESTRATION MATRIX
            </h2>
            <p className="text-[11px] text-neutral-400">
              7 specialized autonomous agents operating with zero founder fatigue
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-xs">
          <button
            onClick={() => {
              soundFx.playClick(900);
              setFilter('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'all' ? 'bg-white/[0.1] text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All (7)
          </button>
          <button
            onClick={() => {
              soundFx.playClick(900);
              setFilter('executing');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'executing' ? 'bg-white/[0.1] text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Executing
          </button>
          <button
            onClick={() => {
              soundFx.playClick(900);
              setFilter('active');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filter === 'active' ? 'bg-white/[0.1] text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Nominal Active
          </button>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/[0.06] bg-black/20 text-neutral-400 font-mono text-[11px]">
              <th className="py-2.5 px-4 font-medium">SPECIALIST / CODENAME</th>
              <th className="py-2.5 px-4 font-medium">MANDATE & DOMAIN</th>
              <th className="py-2.5 px-3 font-medium">STATUS</th>
              <th className="py-2.5 px-3 font-medium">MODEL LOAD</th>
              <th className="py-2.5 px-4 font-medium">CURRENT TASK QUEUE</th>
              <th className="py-2.5 px-4 font-medium text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <tr
                  key={agent.id}
                  onClick={() => {
                    soundFx.playClick(1100);
                    onSelectAgent(agent.id);
                  }}
                  className={`group transition-colors cursor-pointer ${
                    isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Specialist & Codename */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${agent.avatarColor}20`,
                          color: agent.accentColor,
                          border: `1px solid ${agent.avatarColor}40`
                        }}
                      >
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white tracking-tight">
                          {agent.name}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500">
                          {agent.codename}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Mandate & Domain */}
                  <td className="py-3 px-4 max-w-[220px]">
                    <div className="text-neutral-300 font-medium truncate">
                      {agent.role}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      {agent.mandate}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {agent.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    ) : agent.status === 'EXECUTING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        Executing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Verifying
                      </span>
                    )}
                  </td>

                  {/* Model Load Bar */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${agent.loadPercent}%`,
                            backgroundColor: agent.loadPercent > 85 ? '#F43F5E' : agent.loadPercent > 70 ? '#F59E0B' : '#38BDF8'
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-neutral-300 tabular-nums w-8">
                        {agent.loadPercent}%
                      </span>
                    </div>
                  </td>

                  {/* Current Active Task Queue */}
                  <td className="py-3 px-4 max-w-[260px]">
                    <div className="text-neutral-200 text-xs truncate flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-neutral-500 shrink-0" />
                      <span className="truncate">{agent.currentTask}</span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                      Queue: {agent.taskQueueCount} tasks pending · {agent.completedTasks} completed
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playDataChirp();
                          onPingAgent(agent.id);
                        }}
                        className="px-2 py-1 rounded text-[11px] font-mono bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white border border-white/[0.08] transition-colors"
                      >
                        Ping
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playClick(1200);
                          onOpenChat(agent.id);
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
