import React, { useState } from 'react';
import { 
  Users, 
  Bot, 
  MessageSquare, 
  Radio, 
  Activity, 
  CheckCircle, 
  Clock, 
  Zap,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { AgentInfo, AgentId } from '../types/cockpit';
import { ModernTheme, THEMES } from '../types/theme';
import { soundFx } from '../utils/audioSynthesizer';

interface SquadTelemetryProps {
  agents: AgentInfo[];
  selectedAgentId: AgentId | null;
  onSelectAgent: (id: AgentId) => void;
  onOpenChat: (id: AgentId) => void;
  onPingAgent: (id: AgentId) => void;
  theme: ModernTheme;
}

export const SquadTelemetry: React.FC<SquadTelemetryProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onOpenChat,
  onPingAgent,
  theme
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const currentTheme = THEMES[theme];

  const filteredAgents = agents.filter(agent => {
    if (filterStatus === 'all') return true;
    return agent.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const getStatusBadge = (status: AgentInfo['status']) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="text-[10px] font-mono font-medium text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Active
          </span>
        );
      case 'EXECUTING':
        return (
          <span 
            className="text-[10px] font-mono font-medium flex items-center gap-1.5"
            style={{ color: currentTheme.accentPrimary }}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full animate-ping" 
              style={{ backgroundColor: currentTheme.accentPrimary }}
            />
            Executing
          </span>
        );
      case 'VERIFYING':
        return (
          <span className="text-[10px] font-mono font-medium text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Verifying
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
            Idle
          </span>
        );
    }
  };

  return (
    <div 
      className="flex flex-col h-full rounded-xl border overflow-hidden select-none transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.bgPanel,
        borderColor: currentTheme.borderSubtle
      }}
    >
      {/* Module Header */}
      <div 
        className="px-4 py-2.5 border-b flex items-center justify-between"
        style={{ borderColor: currentTheme.borderSubtle }}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
          <h2 className="text-xs font-semibold tracking-wide text-white font-hud">
            7-AGENT SQUAD TELEMETRY
          </h2>
          <span className="text-[10px] font-mono text-neutral-400">
            {filteredAgents.length}/7 ACTIVE
          </span>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-0.5 rounded-md border border-white/[0.06]">
          {['all', 'active', 'executing'].map((f) => (
            <button
              key={f}
              onClick={() => {
                soundFx.playClick(1000);
                setFilterStatus(f);
              }}
              className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded transition-colors ${
                filterStatus === f
                  ? 'bg-white/[0.1] text-white font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Modern High-Density Data Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/[0.04]">
        {filteredAgents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => {
                soundFx.playClick(1200);
                onSelectAgent(agent.id);
              }}
              className={`p-3 transition-colors cursor-pointer group ${
                isSelected 
                  ? 'bg-white/[0.06] border-l-2' 
                  : 'hover:bg-white/[0.03]'
              }`}
              style={{
                borderLeftColor: isSelected ? currentTheme.accentPrimary : undefined
              }}
            >
              {/* Row Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
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

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white tracking-tight truncate">
                        {agent.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
                        {agent.codename}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {agent.role}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(agent.status)}
                </div>
              </div>

              {/* Task info */}
              <div className="mt-2 text-[11px] text-neutral-300 flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-white/[0.04]">
                <Activity className="w-3 h-3 text-neutral-500 shrink-0" />
                <span className="truncate flex-1 text-neutral-300">{agent.currentTask}</span>
                <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                  Q: {agent.taskQueueCount}
                </span>
              </div>

              {/* Load Bar & Actions */}
              <div className="mt-2 flex items-center justify-between gap-4">
                <div className="flex-1 max-w-[180px] flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500">LOAD</span>
                  <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${agent.loadPercent}%`,
                        backgroundColor: agent.loadPercent > 85 ? '#F43F5E' : agent.loadPercent > 70 ? '#F59E0B' : currentTheme.accentPrimary
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-300 tabular-nums">
                    {agent.loadPercent}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playDataChirp();
                      onPingAgent(agent.id);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 border border-white/[0.08] transition-colors"
                  >
                    PING
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundFx.playClick(1100);
                      onOpenChat(agent.id);
                    }}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.1] flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-2.5 h-2.5" />
                    <span>CHAT</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Module Footer */}
      <div 
        className="px-3 py-2 bg-black/40 border-t flex items-center justify-between text-[10px] font-mono text-neutral-400"
        style={{ borderColor: currentTheme.borderSubtle }}
      >
        <span className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3 h-3" />
          Safe Boundary Guard Active
        </span>
        <span>Drive C: Nominal</span>
      </div>
    </div>
  );
};
