import React, { useState, useMemo } from 'react';
import { 
  HeartPulse, 
  ChevronDown, 
  Activity, 
  Zap, 
  Shield, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Sliders, 
  Cpu, 
  Layers 
} from 'lucide-react';
import { AgentInfo, AgentId } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

export interface AgentHeartbeatMetrics {
  bpm: number;
  hz: number;
  cycleDurationSec: number;
  stateColor: string;
  activityLabel: string;
  intensity: number;
  accent: string;
  isSynced?: boolean;
}

export interface SyncTelemetry {
  isSyncEnabled: boolean;
  rawSec: number;
  latencyMs: number;
  syncCycleSec: number;
  syncBpm: number;
  syncHz: number;
}

export function computeAgentHeartbeat(
  agent: AgentInfo,
  syncTelemetry?: SyncTelemetry
): AgentHeartbeatMetrics {
  let baseBpm = 60;
  let stateColor = '#46e39a'; // green
  let activityLabel = 'ACTIVE';
  let intensity = 1.0;

  switch (agent.status) {
    case 'EXECUTING':
      baseBpm = 142;
      stateColor = '#ff8a1f'; // warm amber/orange
      activityLabel = 'EXECUTING';
      intensity = 1.35;
      break;
    case 'ACTIVE':
      baseBpm = 96;
      stateColor = '#00F0FF'; // cyan
      activityLabel = 'ACTIVE';
      intensity = 1.1;
      break;
    case 'VERIFYING':
      baseBpm = 74;
      stateColor = '#c084fc'; // purple
      activityLabel = 'VERIFYING';
      intensity = 0.95;
      break;
    case 'IDLE':
    default:
      baseBpm = 48;
      stateColor = '#94a3b8'; // slate
      activityLabel = 'STANDBY';
      intensity = 0.7;
      break;
  }

  // Modulate BPM dynamically with real-time agent load (±25% variation based on live loadPercent)
  const loadFactor = Math.min(100, Math.max(0, agent.loadPercent || 50)) / 100;
  const autonomousBpm = Math.round(baseBpm * (0.8 + 0.4 * loadFactor));
  const autonomousHz = +(autonomousBpm / 60).toFixed(2);
  const autonomousCycleDurationSec = +(60 / autonomousBpm).toFixed(2);

  // If Agent Synchronization is enabled, align flicker frequency to real-time thoughtLatencyMs
  if (syncTelemetry && syncTelemetry.isSyncEnabled) {
    return {
      bpm: syncTelemetry.syncBpm,
      hz: syncTelemetry.syncHz,
      cycleDurationSec: syncTelemetry.syncCycleSec,
      stateColor,
      activityLabel: agent.status === 'EXECUTING' ? 'SYNC • EXEC' : 'SYNCED',
      intensity: agent.status === 'EXECUTING' ? 1.35 : intensity,
      accent: agent.accentColor || agent.avatarColor || stateColor,
      isSynced: true
    };
  }

  return {
    bpm: autonomousBpm,
    hz: autonomousHz,
    cycleDurationSec: autonomousCycleDurationSec,
    stateColor,
    activityLabel,
    intensity,
    accent: agent.accentColor || agent.avatarColor || stateColor,
    isSynced: false
  };
}

interface SquadHealthIndicatorProps {
  agents: AgentInfo[];
  onSelectAgent: (id: AgentId) => void;
  thoughtLatencyMs?: number;
  isSyncEnabled?: boolean;
  onToggleSync?: (enabled: boolean) => void;
  className?: string;
}

export const SquadHealthIndicator: React.FC<SquadHealthIndicatorProps> = ({
  agents,
  onSelectAgent,
  thoughtLatencyMs = 1.8,
  isSyncEnabled: propSyncEnabled,
  onToggleSync,
  className = ''
}) => {
  const [expanded, setExpanded] = useState(false);
  const [hoveredAgentId, setHoveredAgentId] = useState<AgentId | null>(null);
  const [internalSyncEnabled, setInternalSyncEnabled] = useState(false);

  // Determine whether sync is active (controlled or uncontrolled)
  const syncActive = propSyncEnabled !== undefined ? propSyncEnabled : internalSyncEnabled;

  const handleToggleSync = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextVal = !syncActive;
    if (nextVal) {
      soundFx.playClick(1480);
    } else {
      soundFx.playClick(820);
    }
    if (onToggleSync) {
      onToggleSync(nextVal);
    } else {
      setInternalSyncEnabled(nextVal);
    }
  };

  // Convert real-time thoughtLatencyMs into normalized latency & synced frequency metrics
  const syncTelemetry: SyncTelemetry = useMemo(() => {
    // Normalize thoughtLatencyMs: if > 25, interpret as milliseconds, otherwise as seconds
    const rawSec = thoughtLatencyMs > 25 ? thoughtLatencyMs / 1000 : (thoughtLatencyMs || 1.8);
    // Clamp to realistic rhythm range [0.3s - 3.5s]
    const clampedSec = Math.max(0.3, Math.min(3.5, rawSec));
    const syncCycleSec = Number(clampedSec.toFixed(2));
    const syncBpm = Math.round(60 / syncCycleSec);
    const syncHz = Number((1 / syncCycleSec).toFixed(2));
    const latencyMs = Math.round(rawSec * 1000);

    return {
      isSyncEnabled: syncActive,
      rawSec,
      latencyMs,
      syncCycleSec,
      syncBpm,
      syncHz
    };
  }, [thoughtLatencyMs, syncActive]);

  // Dynamic Squad Health: Real-time Average Load Percentage Across All 7 Agents
  const squadStats = useMemo(() => {
    const totalCount = agents.length || 7;
    const totalLoad = agents.reduce((sum, a) => sum + (a.loadPercent || 0), 0);
    const avgLoad = totalCount > 0 ? Math.round(totalLoad / totalCount) : 0;

    let statusLabel = 'NOMINAL';
    let statusTone = '#46e39a'; // emerald green
    let strokeGrad = ['#46e39a', '#22c55e'];

    if (avgLoad > 80) {
      statusLabel = 'SURGE LOAD';
      statusTone = '#ff4757'; // warning coral/red
      strokeGrad = ['#ff6b81', '#ff4757'];
    } else if (avgLoad > 65) {
      statusLabel = 'ELEVATED';
      statusTone = '#ffb259'; // warm amber
      strokeGrad = ['#ff8a1f', '#ffb259'];
    }

    // Average heartbeat rate across agents
    const heartbeats = agents.map(a => computeAgentHeartbeat(a, syncTelemetry));
    const avgBpm = heartbeats.length > 0 
      ? Math.round(heartbeats.reduce((s, h) => s + h.bpm, 0) / heartbeats.length) 
      : (syncActive ? syncTelemetry.syncBpm : 84);
    const avgHz = Number((avgBpm / 60).toFixed(2));

    return {
      avgLoad,
      totalCount,
      statusLabel,
      statusTone,
      strokeGrad,
      avgBpm,
      avgHz
    };
  }, [agents, syncTelemetry, syncActive]);

  // Compute individual heartbeat metrics for all agents (respecting sync setting)
  const agentHeartbeats = useMemo(() => {
    const map = new Map<AgentId, AgentHeartbeatMetrics>();
    agents.forEach(agent => {
      map.set(agent.id, computeAgentHeartbeat(agent, syncTelemetry));
    });
    return map;
  }, [agents, syncTelemetry]);

  return (
    <div className={`relative ${className}`}>
      {/* Main Squad Health Tactical Module */}
      <div className={`flex items-center gap-2 p-1.5 rounded-lg bg-[#0e0906] border transition-all shadow-sm ${
        syncActive 
          ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.22)]' 
          : 'border-[#ff8a1f]/35 hover:border-[#ff8a1f] hover:shadow-[0_0_18px_rgba(255,138,31,0.25)]'
      }`}>
        
        {/* Clickable Header & Circular Progress Bar */}
        <button
          onClick={() => {
            soundFx.playClick(1300);
            setExpanded(prev => !prev);
          }}
          className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
          title="Squad Health • Click to toggle 7-Agent Heartbeat & Workload Matrix"
        >
          {/* Circular Progress Bar */}
          <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 48 48" className="w-10 h-10">
              <defs>
                <linearGradient id="squadHealthRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={syncActive ? '#00F0FF' : squadStats.strokeGrad[0]} />
                  <stop offset="100%" stopColor={syncActive ? '#0284c7' : squadStats.strokeGrad[1]} />
                </linearGradient>
                <filter id="squadRingGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Track Circle */}
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3.5"
              />
              {/* Dynamic Circular Progress Ring */}
              <circle
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="url(#squadHealthRingGrad)"
                strokeWidth="3.5"
                strokeDasharray="113.1"
                strokeDashoffset={113.1 * (1 - Math.min(100, Math.max(0, squadStats.avgLoad)) / 100)}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
                filter="url(#squadRingGlow)"
                style={{
                  transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease'
                }}
              />
              {/* Centered Average Load Percentage */}
              <text
                x="24"
                y="28"
                textAnchor="middle"
                fill="#ffffff"
                className="font-mono font-bold"
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                {squadStats.avgLoad}%
              </text>
            </svg>
          </div>

          {/* Indicator Header & Status */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span 
                className="w-1.5 h-1.5 rounded-full animate-ping"
                style={{ backgroundColor: syncActive ? '#00F0FF' : squadStats.statusTone }} 
              />
              <span className="text-[11px] font-condensed tracking-wider font-bold text-white uppercase flex items-center gap-1">
                <HeartPulse className={`w-3 h-3 ${syncActive ? 'text-cyan-400' : 'text-[#ff8a1f]'}`} />
                <span>SQUAD HEALTH</span>
                <ChevronDown className={`w-3 h-3 text-[#ff8a1f] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9a8878] mt-0.5">
              <span style={{ color: syncActive ? '#00F0FF' : squadStats.statusTone }} className="font-semibold">
                {syncActive ? 'LATENCY SYNC' : squadStats.statusLabel}
              </span>
              <span className="text-white/30">•</span>
              <span>{squadStats.totalCount} AGENTS</span>
              <span className="text-white/30">•</span>
              <span className="text-[#ffb259] font-medium">{squadStats.avgLoad}% LOAD</span>
            </div>
          </div>
        </button>

        {/* Separator */}
        <div className="w-[1px] h-8 bg-white/10 hidden sm:block mx-1" />

        {/* Agent Synchronization Toggle Button (Compact Header Control) */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={handleToggleSync}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all duration-200 cursor-pointer border select-none ${
              syncActive
                ? 'bg-cyan-950/70 text-cyan-300 border-cyan-400/80 shadow-[0_0_14px_rgba(0,240,255,0.35)] hover:bg-cyan-900/80 hover:border-cyan-300'
                : 'bg-black/40 text-[#9a8878] hover:text-white border-white/10 hover:border-white/25 hover:bg-white/5'
            }`}
            title={`Agent Synchronization: ${syncActive ? 'ACTIVE (Aligned to thoughtLatencyMs)' : 'OFF (Autonomous Heartbeats)'} • Click to toggle frequency lock`}
          >
            <RefreshCw 
              className={`w-3 h-3 transition-transform ${syncActive ? 'text-cyan-400 animate-spin' : 'text-[#9a8878]'}`} 
              style={{ animationDuration: syncActive ? `${syncTelemetry.syncCycleSec * 2}s` : '0s' }} 
            />
            <span className="tracking-wide">SYNC</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
              syncActive ? 'bg-cyan-400/25 text-cyan-200' : 'bg-white/5 text-[#9a8878]'
            }`}>
              {syncActive ? `${syncTelemetry.latencyMs}ms` : 'OFF'}
            </span>
          </button>
        </div>

        {/* Granular Agent Heartbeat Synapse Strip (7 Agent Nodes) */}
        <div className="relative hidden sm:flex items-center gap-1.5 pl-1 py-0.5">
          {/* Synchronized Processing Flow Rail (Active when Agent Synchronization is ON) */}
          {syncActive && (
            <div 
              className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #00F0FF 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: `swarmSyncFlow ${syncTelemetry.syncCycleSec}s linear infinite`,
                filter: 'drop-shadow(0 0 4px #00F0FF)'
              }}
            />
          )}

          {agents.map(agent => {
            const metrics = agentHeartbeats.get(agent.id) || computeAgentHeartbeat(agent, syncTelemetry);
            const isHovered = hoveredAgentId === agent.id;

            // Micro Monogram for the node
            const monogram = agent.name
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2);

            return (
              <div
                key={agent.id}
                className="relative group/node"
                onMouseEnter={() => setHoveredAgentId(agent.id)}
                onMouseLeave={() => setHoveredAgentId(null)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playClick(1000 + metrics.bpm * 3);
                    onSelectAgent(agent.id);
                  }}
                  className={`relative w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer bg-black/40 border ${
                    syncActive 
                      ? 'border-cyan-500/40 hover:border-cyan-300' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{
                    borderColor: isHovered ? metrics.accent : undefined
                  }}
                  title={`${agent.name} (${metrics.activityLabel}) • ${metrics.bpm} BPM • ${agent.loadPercent}% Load`}
                >
                  {/* Varying-Frequency Halo Ripple Ring (frequency aligned to thoughtLatencyMs when sync is active) */}
                  <span
                    className="absolute inset-0 rounded-md pointer-events-none"
                    style={{
                      border: `1.5px solid ${syncActive ? '#00F0FF' : metrics.accent}`,
                      animation: `agentHaloPulse ${metrics.cycleDurationSec}s infinite ease-out`
                    }}
                  />

                  {/* Granular Heartbeat Flicker Node Core (flicker frequency dynamically synced to thoughtLatencyMs) */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: metrics.accent,
                      color: metrics.accent,
                      boxShadow: syncActive 
                        ? `0 0 10px #00F0FF` 
                        : `0 0 8px ${metrics.accent}`,
                      animation: `agentHeartbeatFlicker ${metrics.cycleDurationSec}s infinite ease-in-out`
                    }}
                  />

                  {/* Micro Initial Monogram */}
                  <span className="absolute -bottom-1 -right-0.5 text-[8px] font-mono font-bold leading-none text-[#ffb259] bg-black/80 px-0.5 rounded">
                    {monogram}
                  </span>
                </button>

                {/* Subtle Hover Tooltip with Granular Heartbeat & Sync Telemetry */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/node:flex flex-col items-center pointer-events-none z-50">
                  <div className="px-2.5 py-1.5 rounded-lg bg-[#0b0805]/95 border border-[#ff8a1f]/60 shadow-[0_4px_20px_rgba(0,0,0,0.85)] backdrop-blur-md text-[10px] font-mono whitespace-nowrap text-white flex flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-3 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: metrics.accent }} />
                        <span>{agent.name}</span>
                      </div>
                      {syncActive && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                          SYNCED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[#9a8878] text-[9px] mt-0.5">
                      <span style={{ color: syncActive ? '#00F0FF' : metrics.stateColor }} className="font-semibold uppercase">
                        {metrics.activityLabel}
                      </span>
                      <span>•</span>
                      <span className="text-[#ffb259] font-bold">{metrics.bpm} BPM</span>
                      <span>({metrics.hz} Hz)</span>
                      <span>•</span>
                      <span>{agent.loadPercent}% LOAD</span>
                    </div>
                    {syncActive && (
                      <div className="text-[8px] text-cyan-400 font-mono flex items-center gap-1 border-t border-white/10 pt-1 mt-0.5">
                        <Radio className="w-2.5 h-2.5 animate-pulse" />
                        <span>Resonating with thought latency ({syncTelemetry.latencyMs}ms)</span>
                      </div>
                    )}
                  </div>
                  <div className="w-1.5 h-1.5 bg-[#0b0805] border-r border-b border-[#ff8a1f]/60 rotate-45 -mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive 7-Agent Workload & Biometric Heartbeat Matrix Flyout */}
      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[95vw] bg-[#0c0805]/98 border border-[#ff8a1f]/45 rounded-xl p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.92)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Flyout Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#ff8a1f]/20">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-[#ff8a1f] animate-pulse" />
              <div>
                <span className="text-xs font-condensed font-bold tracking-wider text-white uppercase block leading-tight">
                  7-AGENT SQUAD HEALTH & HEARTBEAT MATRIX
                </span>
                <span className="text-[10px] font-mono text-[#9a8878]">
                  Granular Activity State & Dynamic Oscillator
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#ff8a1f]/15 border border-[#ff8a1f]/30 text-[#ffb259]">
                AVG {squadStats.avgLoad}% LOAD
              </span>
              <span className="text-[9px] font-mono text-[#9a8878] mt-0.5">
                SWARM ~{squadStats.avgBpm} BPM
              </span>
            </div>
          </div>

          {/* Dedicated Agent Synchronization Toggle Banner */}
          <div className={`p-2.5 rounded-lg mb-3 border transition-all ${
            syncActive 
              ? 'bg-cyan-950/40 border-cyan-500/50 shadow-[0_0_16px_rgba(0,240,255,0.18)]' 
              : 'bg-white/[0.02] border-white/10 hover:border-white/20'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center border transition-all ${
                  syncActive 
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]' 
                    : 'bg-black/50 border-white/10 text-[#9a8878]'
                }`}>
                  <RefreshCw 
                    className={`w-3.5 h-3.5 ${syncActive ? 'animate-spin' : ''}`} 
                    style={{ animationDuration: syncActive ? `${syncTelemetry.syncCycleSec * 2}s` : '0s' }} 
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-condensed">
                      AGENT SYNCHRONIZATION
                    </span>
                    <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                      syncActive ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40' : 'bg-white/5 text-[#9a8878]'
                    }`}>
                      {syncActive ? 'PROCESSING FLOW LOCK' : 'AUTONOMOUS'}
                    </span>
                  </div>
                  <p className="text-[9.5px] font-mono text-[#9a8878] leading-tight mt-0.5">
                    Align heartbeat flicker frequency across all 7 agents with real-time thoughtLatencyMs
                  </p>
                </div>
              </div>

              {/* Interactive Sliding Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleSync}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  syncActive ? 'bg-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.6)]' : 'bg-white/15'
                }`}
                title="Toggle Agent Synchronization"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    syncActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Sync Telemetry Readout & Flow Visualizer */}
            {syncActive ? (
              <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>MASTER LATENCY: <b className="text-white">{syncTelemetry.latencyMs}ms</b> ({syncTelemetry.rawSec.toFixed(2)}s)</span>
                  </div>
                  <div className="text-[#9a8878]">
                    RESONANCE: <b className="text-cyan-300">{syncTelemetry.syncBpm} BPM</b> • {syncTelemetry.syncHz} Hz
                  </div>
                </div>

                {/* Processing Flow Wave Rail */}
                <div className="relative h-2 w-full bg-black/60 rounded-full overflow-hidden border border-cyan-500/30">
                  <div 
                    className="absolute inset-0 w-[200%] h-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, #00F0FF 40%, #ff8a1f 60%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: `swarmSyncFlow ${syncTelemetry.syncCycleSec}s linear infinite`
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-[#9a8878]">
                <span>Status: Independent agent frequencies active</span>
                <span>Latency reference: {syncTelemetry.latencyMs}ms</span>
              </div>
            )}
          </div>

          {/* Granular Agent Heartbeat Rows */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {agents.map((agent) => {
              const metrics = agentHeartbeats.get(agent.id) || computeAgentHeartbeat(agent, syncTelemetry);

              return (
                <div 
                  key={agent.id}
                  onClick={() => {
                    soundFx.playClick(1000 + metrics.bpm * 3);
                    onSelectAgent(agent.id);
                    setExpanded(false);
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 group cursor-pointer border ${
                    syncActive
                      ? 'bg-white/[0.02] hover:bg-cyan-950/20 border-white/[0.05] hover:border-cyan-500/40'
                      : 'bg-white/[0.02] hover:bg-[#ff8a1f]/10 border-white/[0.05] hover:border-[#ff8a1f]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    
                    {/* Left: Agent Biometric Heartbeat Node Visual */}
                    <div className="flex items-center gap-2 min-w-0">
                      
                      {/* Node Orb with Synchronized or Granular Varying-Frequency Flicker */}
                      <div className="relative w-6 h-6 rounded-md bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                        {/* Dynamic Outer Ripple Ring */}
                        <span 
                          className="absolute inset-0 rounded-md pointer-events-none"
                          style={{
                            border: `1.5px solid ${syncActive ? '#00F0FF' : metrics.accent}`,
                            animation: `agentHaloPulse ${metrics.cycleDurationSec}s infinite ease-out`
                          }}
                        />
                        {/* Granular Flickering Core Dot */}
                        <span 
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: metrics.accent,
                            color: metrics.accent,
                            boxShadow: syncActive 
                              ? `0 0 10px #00F0FF` 
                              : `0 0 10px ${metrics.accent}`,
                            animation: `agentHeartbeatFlicker ${metrics.cycleDurationSec}s infinite ease-in-out`
                          }}
                        />
                      </div>

                      {/* Agent Identity & Role */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-semibold text-xs truncate group-hover:text-[#ffb259] transition-colors">
                            {agent.name}
                          </span>
                          <span 
                            className="text-[9px] font-mono px-1 py-0.2 rounded font-bold uppercase"
                            style={{ 
                              color: syncActive ? '#00F0FF' : metrics.stateColor,
                              backgroundColor: syncActive ? 'rgba(0, 240, 255, 0.12)' : `${metrics.stateColor}15`,
                              border: syncActive ? '1px solid rgba(0, 240, 255, 0.3)' : `1px solid ${metrics.stateColor}30`
                            }}
                          >
                            {metrics.activityLabel}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono text-[#9a8878] truncate">
                          {agent.codename} • {agent.role}
                        </div>
                      </div>
                    </div>

                    {/* Right: Live Heartbeat BPM & Activity Readout */}
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-white">
                        <HeartPulse 
                          className={`w-3 h-3 ${syncActive ? 'text-cyan-400' : 'text-[#ff8a1f]'}`} 
                          style={{
                            animation: `agentHeartbeatFlicker ${metrics.cycleDurationSec}s infinite ease-in-out`
                          }}
                        />
                        <span className={syncActive ? 'text-cyan-300' : 'text-[#ffb259]'}>{metrics.bpm}</span>
                        <span className="text-[9px] text-[#9a8878] font-normal">BPM</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#9a8878]">
                        {metrics.hz} Hz • {metrics.cycleDurationSec}s
                      </span>
                    </div>
                  </div>

                  {/* Middle row: Granular EKG Trace Visual + Load Progress */}
                  <div className="grid grid-cols-12 gap-2 items-center mt-1">
                    {/* SVG EKG Oscilloscope Waveform (synchronized with thoughtLatencyMs when sync is active) */}
                    <div className="col-span-5 h-5 bg-black/60 rounded px-1 flex items-center border border-white/5 overflow-hidden">
                      <svg viewBox="0 0 100 20" className="w-full h-full preserve-3d">
                        {/* Static faint baseline */}
                        <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                        {/* Dynamic Heartbeat Waveform synchronized with frequency */}
                        <path
                          d="M 0 10 L 20 10 L 26 8 L 30 12 L 35 10 L 42 2 L 48 18 L 53 10 L 58 12 L 64 10 L 100 10"
                          fill="none"
                          stroke={syncActive ? '#00F0FF' : metrics.accent}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            filter: `drop-shadow(0 0 3px ${syncActive ? '#00F0FF' : metrics.accent})`,
                            animation: `ekgTraceSweep ${metrics.cycleDurationSec}s infinite linear`
                          }}
                        />
                      </svg>
                    </div>

                    {/* Agent Real-time Load Bar */}
                    <div className="col-span-7 flex flex-col gap-0.5">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-[#9a8878] truncate max-w-[120px]">{agent.currentTask}</span>
                        <span className="font-bold text-white shrink-0">{agent.loadPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${agent.loadPercent}%`,
                            backgroundColor: agent.loadPercent > 80 
                              ? '#ff4757' 
                              : agent.loadPercent > 65 
                              ? '#ff8a1f' 
                              : '#46e39a'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer status readout */}
          <div className="mt-2.5 pt-2 border-t border-[#ff8a1f]/15 flex items-center justify-between text-[10px] font-mono text-[#9a8878]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: syncActive ? '#00F0FF' : squadStats.statusTone }} />
              <span>Squad Status: <b style={{ color: syncActive ? '#00F0FF' : squadStats.statusTone }}>
                {syncActive ? 'LATENCY SYNCHRONIZED' : squadStats.statusLabel}
              </b></span>
            </div>
            <button 
              onClick={handleToggleSync}
              className="text-[#ffb259] hover:underline cursor-pointer"
            >
              {syncActive ? 'Disable Sync' : 'Enable Sync'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
