import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Cpu, 
  Zap, 
  Activity, 
  Play, 
  Pause, 
  RefreshCw, 
  RotateCcw,
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Bot,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { AgentInfo, AgentId } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

export interface AgentResourceAllocation {
  id: AgentId;
  name: string;
  codename: string;
  role: string;
  shortRole: string;
  avatarColor: string;
  accentColor: string;
  cpuLoad: number;        // CPU thread utilization % (0-100)
  gpuLoad: number;        // GPU tensor/vRAM compute utilization % (0-100)
  vramGb: number;         // Allocated GPU memory in GB
  balanceRatio: number;   // CPU / GPU ratio
  status: string;
  currentTask: string;
  rawLoad: number;        // baseline load from agent
}

export interface SystemResourceAllocationChartProps {
  agents: AgentInfo[];
  onSelectAgent?: (id: AgentId) => void;
  className?: string;
  defaultExpanded?: boolean;
}

export const SystemResourceAllocationChart: React.FC<SystemResourceAllocationChartProps> = ({
  agents = [],
  onSelectAgent,
  className = '',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'grouped' | 'stacked' | 'balance'>('grouped');
  const [lastTickTime, setLastTickTime] = useState<string>('');
  const [tickCount, setTickCount] = useState<number>(0);

  // Micro-variance state for the top 3 agents, updated on the 2s interval
  const [varianceSeed, setVarianceSeed] = useState<{ [key: string]: { cpuDelta: number; gpuDelta: number } }>({});

  // 1. Identify Top 3 Most Active Agents by loadPercent & status
  const top3Agents = useMemo(() => {
    if (!agents || agents.length === 0) return [];
    return [...agents]
      .sort((a, b) => {
        // Priority to EXECUTING/ACTIVE, then load percent
        const aScore = (a.status === 'EXECUTING' ? 30 : a.status === 'ACTIVE' ? 15 : 0) + (a.loadPercent || 0);
        const bScore = (b.status === 'EXECUTING' ? 30 : b.status === 'ACTIVE' ? 15 : 0) + (b.loadPercent || 0);
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [agents]);

  // 2. Real-time 2-second update ticker (updates CPU/GPU load balance every 2 seconds)
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date();
      setLastTickTime(now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setTickCount(c => c + 1);

      // Generate realistic CPU/GPU micro-fluctuations every 2 seconds
      const newDeltas: { [key: string]: { cpuDelta: number; gpuDelta: number } } = {};
      top3Agents.forEach((agent) => {
        // Dynamic balance fluctuation (-4% to +4%)
        const cpuDelta = Math.floor(Math.random() * 9) - 4;
        const gpuDelta = Math.floor(Math.random() * 11) - 5;
        newDeltas[agent.id] = { cpuDelta, gpuDelta };
      });
      setVarianceSeed(newDeltas);
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive, top3Agents]);

  // 3. Compute structured chart data for the Top 3 Agents
  const allocationData = useMemo<AgentResourceAllocation[]>(() => {
    return top3Agents.map(agent => {
      const deltas = varianceSeed[agent.id] || { cpuDelta: 0, gpuDelta: 0 };
      const base = agent.loadPercent || 50;

      // Realistic CPU load (typically high during parsing/AST/logic)
      const cpuLoad = Math.max(25, Math.min(98, base + (agent.id === 'dev' ? 4 : agent.id === 'architect' ? -2 : 1) + deltas.cpuDelta));
      
      // Realistic GPU load (tensor parallel heads & latent embedding memory)
      const gpuLoad = Math.max(30, Math.min(99, Math.round(base * 1.06 + (agent.id === 'architect' ? 8 : agent.id === 'dev' ? 6 : -3) + deltas.gpuDelta)));

      // Allocated vRAM in GB (proportional to GPU load)
      const vramGb = Number((4.2 + (gpuLoad / 100) * 11.4).toFixed(1));

      // Balance ratio (CPU / GPU)
      const balanceRatio = Number((cpuLoad / (gpuLoad || 1)).toFixed(2));

      // Short role label
      const shortRole = agent.role.split(' ')[0] || agent.role;

      return {
        id: agent.id,
        name: agent.name,
        codename: agent.codename,
        role: agent.role,
        shortRole,
        avatarColor: agent.avatarColor || '#ff8a1f',
        accentColor: agent.accentColor || '#ff8a1f',
        cpuLoad,
        gpuLoad,
        vramGb,
        balanceRatio,
        status: agent.status,
        currentTask: agent.currentTask || 'Active logic compute cycle',
        rawLoad: base
      };
    });
  }, [top3Agents, varianceSeed]);

  // Aggregate telemetry across the top 3 agents
  const aggregateMetrics = useMemo(() => {
    if (allocationData.length === 0) {
      return { avgCpu: 0, avgGpu: 0, totalVram: 0, overallRatio: 1.0 };
    }
    const sumCpu = allocationData.reduce((acc, d) => acc + d.cpuLoad, 0);
    const sumGpu = allocationData.reduce((acc, d) => acc + d.gpuLoad, 0);
    const sumVram = allocationData.reduce((acc, d) => acc + d.vramGb, 0);
    return {
      avgCpu: Math.round(sumCpu / allocationData.length),
      avgGpu: Math.round(sumGpu / allocationData.length),
      totalVram: Number(sumVram.toFixed(1)),
      overallRatio: Number((sumCpu / (sumGpu || 1)).toFixed(2))
    };
  }, [allocationData]);

  // Custom Cyberpunk Tooltip for the Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: AgentResourceAllocation = payload[0].payload;
      return (
        <div className="bg-[#0B101C]/95 backdrop-blur-xl border border-[#ff8a1f]/40 p-2.5 rounded-xl shadow-2xl font-mono text-xs z-50 pointer-events-none min-w-[210px] animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <span 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: data.accentColor }} 
              />
              <span className="font-condensed font-bold text-white text-xs">
                {data.name}
              </span>
              <span className="text-[9px] text-[#ffb259] px-1 rounded bg-[#ff8a1f]/20">
                {data.codename}
              </span>
            </div>
            <span className="text-[9px] text-neutral-400 uppercase">
              {data.status}
            </span>
          </div>

          {/* CPU / GPU Breakdown */}
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-cyan-300">
                <Cpu className="w-3 h-3" />
                <span>CPU THREADS:</span>
              </span>
              <span className="font-bold text-cyan-300 font-mono">
                {data.cpuLoad}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[#ffb259]">
                <Zap className="w-3 h-3 text-[#ff8a1f]" />
                <span>GPU TENSORS:</span>
              </span>
              <span className="font-bold text-[#ffb259] font-mono">
                {data.gpuLoad}%
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06] text-neutral-400 text-[9px]">
              <span>vRAM ALLOCATION:</span>
              <span className="text-white font-bold">{data.vramGb} GB / 16 GB</span>
            </div>

            <div className="flex items-center justify-between text-neutral-400 text-[9px]">
              <span>BALANCE EQUILIBRIUM:</span>
              <span className={`font-bold ${
                data.balanceRatio > 1.15 ? 'text-cyan-300' :
                data.balanceRatio < 0.85 ? 'text-[#ffb259]' :
                'text-emerald-400'
              }`}>
                {data.balanceRatio}x ({data.balanceRatio > 1.05 ? 'CPU Bound' : data.balanceRatio < 0.95 ? 'GPU Bound' : 'Equilibrium'})
              </span>
            </div>

            <div className="text-[9px] text-neutral-500 italic truncate pt-1 border-t border-white/[0.04]">
              Task: {data.currentTask}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`panel-tactical p-3 flex flex-col relative overflow-hidden transition-all duration-200 ${className}`}>
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#ff8a1f]/20 z-10">
        
        {/* Title & Live Status */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#ff8a1f]/15 border border-[#ff8a1f]/40 text-[#ff8a1f] shadow-[0_0_10px_rgba(255,138,31,0.3)]">
            <Cpu className="w-3.5 h-3.5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase">
                SYSTEM RESOURCE ALLOCATION
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[#ff8a1f]/20 text-[#ffb259] border border-[#ff8a1f]/35 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full bg-[#ff8a1f] ${isLive ? 'animate-ping' : ''}`} />
                <span>2.0S TICK</span>
              </span>
            </div>
            <div className="text-[10px] text-[#9a8878] font-mono flex items-center gap-1.5">
              <span>CPU/GPU load balance across top 3 most active agents</span>
              {lastTickTime && (
                <span className="text-neutral-500">• Synced {lastTickTime}</span>
              )}
            </div>
          </div>
        </div>

        {/* Aggregate Telemetry Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="hidden sm:flex items-center gap-1.5 bg-[#140c06] px-2 py-0.5 rounded border border-cyan-500/25 text-[#9a8878]">
            <span className="w-2 h-2 rounded-sm bg-cyan-400" />
            <span>AVG CPU: <b className="text-cyan-300 font-bold">{aggregateMetrics.avgCpu}%</b></span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-[#140c06] px-2 py-0.5 rounded border border-[#ff8a1f]/25 text-[#9a8878]">
            <span className="w-2 h-2 rounded-sm bg-[#ff8a1f]" />
            <span>AVG GPU: <b className="text-amber-400 font-bold">{aggregateMetrics.avgGpu}%</b></span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 bg-[#140c06] px-2 py-0.5 rounded border border-emerald-500/25 text-[#9a8878]">
            <Scale className="w-3 h-3 text-emerald-400" />
            <span>RATIO: <b className="text-emerald-400 font-bold">{aggregateMetrics.overallRatio}x</b></span>
          </div>

          {/* Controls: Mode Switcher, Pause/Resume, Minimize */}
          <div className="flex items-center gap-1 ml-1 border-l border-neutral-800 pl-2">
            
            {/* View Mode Selector */}
            <div className="flex items-center bg-[#0e0906] p-0.5 rounded border border-[#ff8a1f]/20 text-[9px]">
              <button
                onClick={() => {
                  soundFx.playClick(1050);
                  setViewMode('grouped');
                }}
                className={`px-1.5 py-0.5 rounded uppercase font-bold transition-colors ${
                  viewMode === 'grouped' ? 'bg-[#ff8a1f] text-black' : 'text-[#9a8878] hover:text-white'
                }`}
                title="Grouped Dual Bar View (CPU & GPU side-by-side)"
              >
                DUAL
              </button>
              <button
                onClick={() => {
                  soundFx.playClick(1050);
                  setViewMode('stacked');
                }}
                className={`px-1.5 py-0.5 rounded uppercase font-bold transition-colors ${
                  viewMode === 'stacked' ? 'bg-[#ff8a1f] text-black' : 'text-[#9a8878] hover:text-white'
                }`}
                title="Stacked Load Profile"
              >
                STACK
              </button>
            </div>

            {/* Live Ticker Toggle */}
            <button
              onClick={() => {
                soundFx.playClick(isLive ? 900 : 1200);
                setIsLive(!isLive);
              }}
              title={isLive ? 'Pause 2-second real-time ticker' : 'Resume 2-second real-time ticker'}
              className={`p-1 rounded border transition-colors ${
                isLive
                  ? 'bg-[#18110b] border-[#ff8a1f]/40 text-[#ffb259] hover:bg-[#ff8a1f]/20'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              }`}
            >
              {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              onClick={() => {
                soundFx.playClick(1000);
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded bg-[#18110b] border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart Body */}
      {isExpanded && (
        <div className="flex-1 flex flex-col gap-2 animate-fadeIn">
          
          {/* Top 3 Agent Mini Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            {allocationData.map((agentData, idx) => (
              <div
                key={agentData.id}
                onClick={() => {
                  soundFx.playClick(1100 + idx * 100);
                  onSelectAgent?.(agentData.id);
                }}
                className="p-2 rounded-lg bg-[#0e0906]/90 border border-[#ff8a1f]/20 hover:border-[#ff8a1f]/60 hover:bg-[#140e0a] transition-all cursor-pointer group"
              >
                {/* Agent Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: agentData.accentColor }} 
                    />
                    <span className="font-condensed font-bold text-white truncate text-xs group-hover:text-amber-300 transition-colors">
                      {agentData.name}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#ffb259] bg-[#ff8a1f]/15 px-1 rounded font-bold shrink-0">
                    #{idx + 1} ACTIVE
                  </span>
                </div>

                {/* CPU / GPU Micro Meter Bars */}
                <div className="space-y-1 text-[9px] pt-1 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <Cpu className="w-2.5 h-2.5" /> CPU:
                    </span>
                    <span className="font-bold text-cyan-300">{agentData.cpuLoad}%</span>
                  </div>
                  <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-700" 
                      style={{ width: `${agentData.cpuLoad}%` }} 
                    />
                  </div>

                  <div className="flex items-center justify-between text-neutral-400 mt-1">
                    <span className="flex items-center gap-1 text-[#ffb259]">
                      <Zap className="w-2.5 h-2.5 text-[#ff8a1f]" /> GPU:
                    </span>
                    <span className="font-bold text-amber-400">{agentData.gpuLoad}%</span>
                  </div>
                  <div className="w-full h-1 bg-black rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 rounded-full transition-all duration-700" 
                      style={{ width: `${agentData.gpuLoad}%` }} 
                    />
                  </div>
                </div>

                {/* Subtext info */}
                <div className="flex items-center justify-between text-[8px] text-[#9a8878] mt-1.5 pt-1 border-t border-neutral-800/60">
                  <span>vRAM: <b className="text-white">{agentData.vramGb}GB</b></span>
                  <span className={agentData.balanceRatio > 1.05 ? 'text-cyan-400' : 'text-amber-400'}>
                    Ratio: {agentData.balanceRatio}x
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Recharts Bar Chart Viewport */}
          <div className="w-full h-44 sm:h-52 mt-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={allocationData}
                margin={{ top: 12, right: 14, left: -16, bottom: 0 }}
                barGap={6}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#c8b8a8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
                />

                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#8a7868', fontSize: 9, fontFamily: 'monospace' }}
                  tickFormatter={(val) => `${val}%`}
                  tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                  axisLine={{ stroke: 'rgba(255, 255, 255, 0.15)' }}
                />

                <Tooltip content={<CustomBarTooltip />} />

                {/* High Compute Warning Threshold (85%) */}
                <ReferenceLine 
                  y={85} 
                  stroke="#ef4444" 
                  strokeDasharray="4 4" 
                  label={{ 
                    value: 'THERMAL CEILING (85%)', 
                    fill: '#ef4444', 
                    fontSize: 8, 
                    position: 'insideTopRight',
                    fontFamily: 'monospace'
                  }} 
                />

                {/* CPU Utilization Bar */}
                <Bar 
                  dataKey="cpuLoad" 
                  name="CPU Thread Load" 
                  fill="#00F0FF" 
                  radius={[4, 4, 0, 0]} 
                  stackId={viewMode === 'stacked' ? 'a' : undefined}
                  animationDuration={600}
                >
                  {allocationData.map((entry, index) => (
                    <Cell 
                      key={`cell-cpu-${index}`} 
                      fill={entry.cpuLoad > 85 ? '#ff4d6d' : '#00F0FF'} 
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>

                {/* GPU Utilization Bar */}
                <Bar 
                  dataKey="gpuLoad" 
                  name="GPU Tensor Compute" 
                  fill="#FFB300" 
                  radius={[4, 4, 0, 0]} 
                  stackId={viewMode === 'stacked' ? 'a' : undefined}
                  animationDuration={600}
                >
                  {allocationData.map((entry, index) => (
                    <Cell 
                      key={`cell-gpu-${index}`} 
                      fill={entry.gpuLoad > 85 ? '#f59e0b' : '#ff8a1f'} 
                      fillOpacity={0.9}
                    />
                  ))}
                </Bar>

                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ paddingBottom: 6, fontSize: 10, fontFamily: 'monospace' }}
                  formatter={(value) => <span className="text-[#c8b8a8]">{value}</span>}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Footer Telemetry strip */}
          <div className="flex flex-wrap items-center justify-between text-[9px] font-mono text-[#9a8878] pt-1.5 border-t border-[#ff8a1f]/15">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>CPU Multi-Thread Queue (ARM64 / x86_64)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ff8a1f]" />
                <span>GPU Tensor Cores (FP16 / INT8 Attention)</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-500">TICK #{tickCount}</span>
              <span className="text-emerald-400 font-bold">100% HARDWARE BALANCED</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
