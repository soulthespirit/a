import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Cpu, 
  Maximize2, 
  Minimize2, 
  Pause, 
  Play, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { AgentInfo, QuickTriggerAction } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

export interface PipelineEfficiencyDataPoint {
  time: string;           // e.g. "14:28:12"
  shortTime: string;      // e.g. "12s"
  speed: number;          // Execution Speed (ops/s)
  load: number;           // Swarm Load (%)
  latencyMs: number;      // Thought Latency (ms)
  efficiency: number;     // Efficiency Index (%)
  activeAgents: number;   // Currently active agents
}

export interface PipelineEfficiencyChartProps {
  agents: AgentInfo[];
  executingAction?: QuickTriggerAction | null;
  isSimulating?: boolean;
  thoughtLatencyMs?: number;
  className?: string;
  defaultExpanded?: boolean;
}

export const PipelineEfficiencyChart: React.FC<PipelineEfficiencyChartProps> = ({
  agents = [],
  executingAction = null,
  isSimulating = false,
  thoughtLatencyMs = 1820,
  className = '',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState<20 | 35 | 50>(20);
  const [activeMetricTab, setActiveMetricTab] = useState<'both' | 'speed' | 'load'>('both');

  // Compute live current agent load
  const currentAvgLoad = useMemo(() => {
    if (!agents || agents.length === 0) return 38;
    const total = agents.reduce((sum, a) => sum + (a.loadPercent || 0), 0);
    return Math.round(total / agents.length);
  }, [agents]);

  // Compute live active agent count
  const activeAgentCount = useMemo(() => {
    if (!agents || agents.length === 0) return 4;
    return agents.filter(a => a.status === 'ACTIVE' || a.status === 'EXECUTING').length;
  }, [agents]);

  // Generate initial historical seed data
  const [chartData, setChartData] = useState<PipelineEfficiencyDataPoint[]>(() => {
    const seed: PipelineEfficiencyDataPoint[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 1500);
      const hours = String(t.getHours()).padStart(2, '0');
      const mins = String(t.getMinutes()).padStart(2, '0');
      const secs = String(t.getSeconds()).padStart(2, '0');
      const timeStr = `${hours}:${mins}:${secs}`;
      const shortStr = `${secs}s`;

      // Fluctuate baseline speed between 170 and 260 ops/s
      const baseSpeed = 195 + Math.sin(i * 0.4) * 35 + (Math.random() * 20 - 10);
      // Fluctuate baseline load between 30% and 52%
      const baseLoad = 38 + Math.cos(i * 0.35) * 12 + (Math.random() * 8 - 4);
      const efficiency = Math.min(99.4, Math.max(86.0, 96.5 + (baseSpeed / 300) * 3 - (baseLoad / 100) * 4));

      seed.push({
        time: timeStr,
        shortTime: shortStr,
        speed: Math.round(baseSpeed),
        load: Math.round(baseLoad),
        latencyMs: Math.round(1750 + Math.random() * 140),
        efficiency: parseFloat(efficiency.toFixed(1)),
        activeAgents: 4
      });
    }
    return seed;
  });

  // Real-time dynamic updates interval
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setChartData(prevData => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const timeStr = `${hours}:${mins}:${secs}`;
        const shortStr = `${secs}s`;

        // Execution speed boosts when executing or simulating
        const isSurge = Boolean(executingAction || isSimulating);
        const surgeFactor = isSurge ? 1.65 + Math.random() * 0.4 : 1.0;
        
        // Base speed derived from thoughtLatencyMs & active agents
        const latencySec = thoughtLatencyMs > 0 ? (thoughtLatencyMs > 100 ? thoughtLatencyMs / 1000 : thoughtLatencyMs) : 1.8;
        const cadenceSpeed = Math.round((220 / Math.max(0.8, latencySec)) * surgeFactor + (Math.random() * 24 - 12));
        const speed = Math.max(85, Math.min(580, cadenceSpeed));

        // Load derived from agents load + burst
        const loadBurst = isSurge ? 28 + Math.round(Math.random() * 15) : 0;
        const load = Math.min(98, Math.max(15, currentAvgLoad + loadBurst + Math.round(Math.random() * 6 - 3)));

        // Efficiency index calculation: higher speed with balanced load yields high efficiency
        // If load exceeds 85%, efficiency slightly throttles (penalty)
        const loadPenalty = load > 85 ? (load - 85) * 0.4 : 0;
        const speedBonus = (speed / 350) * 4;
        const rawEff = 94.2 + speedBonus - loadPenalty + (Math.random() * 1.5 - 0.75);
        const efficiency = parseFloat(Math.min(99.8, Math.max(82.0, rawEff)).toFixed(1));

        const newPoint: PipelineEfficiencyDataPoint = {
          time: timeStr,
          shortTime: shortStr,
          speed,
          load,
          latencyMs: Math.round(thoughtLatencyMs),
          efficiency,
          activeAgents: isSurge ? 7 : activeAgentCount
        };

        const updated = [...prevData, newPoint];
        if (updated.length > windowSize) {
          return updated.slice(updated.length - windowSize);
        }
        return updated;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isLive, executingAction, isSimulating, currentAvgLoad, activeAgentCount, thoughtLatencyMs, windowSize]);

  // Current latest telemetry point
  const latestPoint = chartData[chartData.length - 1] || {
    time: '--:--:--',
    shortTime: '--',
    speed: 210,
    load: currentAvgLoad,
    latencyMs: 1820,
    efficiency: 96.5,
    activeAgents: 4
  };

  // Speed vs Load Ratio
  const speedLoadRatio = useMemo(() => {
    if (latestPoint.load === 0) return '0.0';
    return (latestPoint.speed / latestPoint.load).toFixed(1);
  }, [latestPoint.speed, latestPoint.load]);

  // Efficiency health state
  const efficiencyStatus = useMemo(() => {
    if (latestPoint.efficiency >= 95) {
      return { label: 'OPTIMAL', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/30' };
    }
    if (latestPoint.efficiency >= 90) {
      return { label: 'NOMINAL', color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/30' };
    }
    return { label: 'BALANCING', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/30' };
  }, [latestPoint.efficiency]);

  // Custom Dark Futuristic Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as PipelineEfficiencyDataPoint;

    return (
      <div className="bg-[#090D18]/95 backdrop-blur-md border border-[#ff8a1f]/40 p-2.5 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.85)] font-mono text-xs min-w-[180px]">
        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08]">
          <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#ff8a1f]" />
            {data.time}
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
            data.efficiency >= 95 ? 'text-emerald-400 bg-emerald-950/70 border-emerald-500/30' : 'text-amber-400 bg-amber-950/70 border-amber-500/30'
          }`}>
            {data.efficiency}% EFF
          </span>
        </div>

        <div className="space-y-1 text-[11px]">
          {/* Execution Speed */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#ffb259] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#ff8a1f]" />
              Speed:
            </span>
            <span className="text-white font-bold">
              {data.speed} <span className="text-neutral-400 text-[9px]">ops/s</span>
            </span>
          </div>

          {/* Agent Load */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#00f0ff] flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#00f0ff]" />
              Agent Load:
            </span>
            <span className="text-white font-bold">
              {data.load}%
            </span>
          </div>

          {/* Active Agents */}
          <div className="flex items-center justify-between gap-3 text-[10px] text-neutral-400 pt-1 border-t border-white/[0.05]">
            <span>Active Swarm:</span>
            <span className="text-cyan-300 font-semibold">{data.activeAgents}/7 Agents</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`relative transition-all duration-300 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {!isExpanded ? (
        /* Collapsed Compact HUD Pill */
        <div className="flex items-center gap-2.5 bg-[#0A0E1A]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#ff8a1f]/35 shadow-[0_4px_20px_rgba(0,0,0,0.6)] text-xs">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#ff8a1f] animate-pulse" />
            <span className="font-condensed font-bold tracking-wider text-white text-[11px]">
              PIPELINE EFFICIENCY
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="text-[#ffb259] font-bold">
              {latestPoint.speed} ops/s
            </span>
            <span className="text-neutral-600">vs</span>
            <span className="text-[#00f0ff] font-bold">
              {latestPoint.load}% load
            </span>
          </div>

          <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${efficiencyStatus.color} ${efficiencyStatus.bg} ${efficiencyStatus.border}`}>
            {latestPoint.efficiency}% {efficiencyStatus.label}
          </span>

          <button
            onClick={() => {
              soundFx.playClick(1050);
              setIsExpanded(true);
            }}
            className="p-1 rounded bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors"
            title="Expand Pipeline Efficiency Chart"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Expanded Floating HUD Card */
        <div className="w-[440px] max-w-[95vw] bg-[#080C16]/95 backdrop-blur-xl border border-[#ff8a1f]/35 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#050810] border-b border-[#ff8a1f]/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#ff8a1f]/15 border border-[#ff8a1f]/30 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-[#ff8a1f]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-condensed font-bold tracking-wider text-white text-xs uppercase">
                    PIPELINE EFFICIENCY
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isLive ? 'animate-ping' : ''}`} />
                    {isLive ? 'LIVE' : 'PAUSED'}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-neutral-400">
                  Execution Speed vs. Agent Load Correlation
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 text-xs">
              {/* Play / Pause toggle */}
              <button
                onClick={() => {
                  soundFx.playClick(isLive ? 700 : 1100);
                  setIsLive(!isLive);
                }}
                title={isLive ? 'Pause live stream' : 'Resume live stream'}
                className={`p-1 rounded text-[10px] font-mono transition-colors ${
                  isLive ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/30' : 'text-neutral-400 hover:text-white bg-white/[0.05]'
                }`}
              >
                {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              </button>

              {/* Reset History */}
              <button
                onClick={() => {
                  soundFx.playClick(800);
                  setChartData(prev => prev.slice(prev.length - 5));
                }}
                title="Reset Chart Buffer"
                className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>

              {/* Window Size Selector */}
              <div className="flex items-center bg-[#0d1322] rounded p-0.5 border border-white/[0.08] text-[9px] font-mono">
                {([20, 35, 50] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => {
                      soundFx.playClick(950);
                      setWindowSize(size);
                    }}
                    className={`px-1.5 py-0.2 rounded transition-colors ${
                      windowSize === size ? 'bg-[#ff8a1f]/20 text-[#ffb259] font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {size}s
                  </button>
                ))}
              </div>

              {/* Minimize */}
              <button
                onClick={() => {
                  soundFx.playClick(900);
                  setIsExpanded(false);
                }}
                title="Minimize Chart"
                className="p-1 rounded text-neutral-400 hover:text-white transition-colors ml-1"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Real-time KPI Stats Banner */}
          <div className="grid grid-cols-3 gap-2 px-3 py-2 bg-[#070B14] border-b border-white/[0.06] text-center">
            {/* KPI 1: Speed */}
            <div className="bg-[#0D1424] rounded-lg p-1.5 border border-[#ff8a1f]/20">
              <div className="text-[9px] font-mono text-neutral-400 uppercase flex items-center justify-center gap-1">
                <Zap className="w-2.5 h-2.5 text-[#ff8a1f]" />
                Speed
              </div>
              <div className="text-base font-bold font-condensed text-[#ffb259] leading-tight mt-0.5">
                {latestPoint.speed} <span className="text-[10px] font-mono text-neutral-400 font-normal">ops/s</span>
              </div>
              <div className="text-[8px] font-mono text-emerald-400">
                +{(latestPoint.speed * 0.08).toFixed(0)} vs baseline
              </div>
            </div>

            {/* KPI 2: Load */}
            <div className="bg-[#0D1424] rounded-lg p-1.5 border border-[#00f0ff]/20">
              <div className="text-[9px] font-mono text-neutral-400 uppercase flex items-center justify-center gap-1">
                <Cpu className="w-2.5 h-2.5 text-[#00f0ff]" />
                Swarm Load
              </div>
              <div className="text-base font-bold font-condensed text-[#00f0ff] leading-tight mt-0.5">
                {latestPoint.load}%
              </div>
              <div className="text-[8px] font-mono text-neutral-400">
                {latestPoint.activeAgents}/7 Active Nodes
              </div>
            </div>

            {/* KPI 3: Efficiency */}
            <div className={`bg-[#0D1424] rounded-lg p-1.5 border ${efficiencyStatus.border}`}>
              <div className="text-[9px] font-mono text-neutral-400 uppercase flex items-center justify-center gap-1">
                <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                Efficiency
              </div>
              <div className={`text-base font-bold font-condensed ${efficiencyStatus.color} leading-tight mt-0.5`}>
                {latestPoint.efficiency}%
              </div>
              <div className="text-[8px] font-mono text-[#ffb259]">
                Ratio {speedLoadRatio}x
              </div>
            </div>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center justify-between px-3 py-1 bg-[#090E1B] border-b border-white/[0.04] text-[10px] font-mono">
            <span className="text-neutral-500">LINE OVERLAY:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundFx.playClick(1000);
                  setActiveMetricTab('both');
                }}
                className={`px-2 py-0.5 rounded transition-all ${
                  activeMetricTab === 'both' 
                    ? 'bg-white/[0.1] text-white font-bold border border-white/[0.15]' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Speed & Load
              </button>
              <button
                onClick={() => {
                  soundFx.playClick(1000);
                  setActiveMetricTab('speed');
                }}
                className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  activeMetricTab === 'speed' 
                    ? 'bg-[#ff8a1f]/20 text-[#ffb259] font-bold border border-[#ff8a1f]/40' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a1f]" />
                Speed Only
              </button>
              <button
                onClick={() => {
                  soundFx.playClick(1000);
                  setActiveMetricTab('load');
                }}
                className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                  activeMetricTab === 'load' 
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] font-bold border border-[#00f0ff]/40' 
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                Load Only
              </button>
            </div>
          </div>

          {/* Recharts Line Chart Container */}
          <div className="p-2.5 h-[175px] w-full select-none">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis 
                  dataKey="shortTime" 
                  stroke="#4b5563" 
                  tick={{ fill: '#6b7280', fontSize: 9, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#ffffff15' }}
                />
                
                {/* Left Y-Axis: Execution Speed */}
                {(activeMetricTab === 'both' || activeMetricTab === 'speed') && (
                  <YAxis 
                    yAxisId="speed"
                    orientation="left"
                    stroke="#ff8a1f"
                    domain={[0, 600]}
                    tick={{ fill: '#ffb259', fontSize: 9, fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#ff8a1f40' }}
                    unit=" ops"
                  />
                )}

                {/* Right Y-Axis: Agent Load (%) */}
                {(activeMetricTab === 'both' || activeMetricTab === 'load') && (
                  <YAxis 
                    yAxisId="load"
                    orientation="right"
                    stroke="#00f0ff"
                    domain={[0, 100]}
                    tick={{ fill: '#00f0ff', fontSize: 9, fontFamily: 'monospace' }}
                    tickLine={{ stroke: '#00f0ff40' }}
                    unit="%"
                  />
                )}

                <Tooltip content={<CustomChartTooltip />} />

                {/* Speed Line */}
                {(activeMetricTab === 'both' || activeMetricTab === 'speed') && (
                  <Line 
                    yAxisId="speed"
                    type="monotone"
                    dataKey="speed"
                    name="Speed"
                    stroke="#ff8a1f"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#ff8a1f', stroke: '#ffffff', strokeWidth: 1.5 }}
                    isAnimationActive={false}
                  />
                )}

                {/* Load Line */}
                {(activeMetricTab === 'both' || activeMetricTab === 'load') && (
                  <Line 
                    yAxisId="load"
                    type="monotone"
                    dataKey="load"
                    name="Load"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#00f0ff', stroke: '#ffffff', strokeWidth: 1.5 }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-3 py-1 bg-[#050810] border-t border-white/[0.06] text-[9px] font-mono text-neutral-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-[#ff8a1f] rounded-full inline-block" />
                <span className="text-[#ffb259]">Execution Speed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-[#00f0ff] rounded-full inline-block" />
                <span className="text-[#00f0ff]">Swarm Load</span>
              </span>
            </div>

            <span className="text-emerald-400 font-semibold">
              DYNAMIC RECHARTS HARNESS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
