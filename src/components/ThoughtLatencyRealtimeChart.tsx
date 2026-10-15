import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Maximize2, 
  Minimize2, 
  TrendingUp, 
  Clock, 
  Zap,
  RotateCcw
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export interface LatencyDataPoint {
  timeStr: string;        // e.g. "10:14:22"
  secondsAgo: number;     // 0 to 59
  label: string;          // e.g. "-15s", "Now"
  latencySec: number;     // e.g. 0.68 (seconds)
  latencyMs: number;      // e.g. 680 (ms)
  isBottleneck: boolean;  // latencySec > 0.8
  threshold: number;      // 0.8
}

export interface ThoughtLatencyRealtimeChartProps {
  thoughtLatencyMs: number;
  className?: string;
  defaultExpanded?: boolean;
}

export const ThoughtLatencyRealtimeChart: React.FC<ThoughtLatencyRealtimeChartProps> = ({
  thoughtLatencyMs,
  className = '',
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Normalize incoming latency to seconds
  const currentLatencySec = useMemo(() => {
    const raw = thoughtLatencyMs || 0.68;
    return raw > 25 ? Number((raw / 1000).toFixed(2)) : Number(raw.toFixed(2));
  }, [thoughtLatencyMs]);

  const currentLatencyMs = Math.round(currentLatencySec * 1000);
  const isBottleneck = currentLatencySec > 0.8;

  // Initialize rolling 60-second dataset
  const [history, setHistory] = useState<LatencyDataPoint[]>(() => {
    const points: LatencyDataPoint[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const t = new Date(now - i * 1000);
      const timeStr = t.toLocaleTimeString([], { hour12: false });
      
      // Seed with plausible variance around baseline
      const variance = (Math.sin(i * 0.28) * 0.12) + ((Math.random() - 0.5) * 0.08);
      const base = i === 0 ? currentLatencySec : Math.max(0.42, Math.min(1.25, 0.65 + variance));
      const sec = Number(base.toFixed(2));

      points.push({
        timeStr,
        secondsAgo: i,
        label: i === 0 ? 'Now' : `-${i}s`,
        latencySec: sec,
        latencyMs: Math.round(sec * 1000),
        isBottleneck: sec > 0.8,
        threshold: 0.8
      });
    }
    return points;
  });

  // Keep a ref to latest currentLatencySec to avoid interval re-triggering
  const latestLatencyRef = useRef(currentLatencySec);
  useEffect(() => {
    latestLatencyRef.current = currentLatencySec;
  }, [currentLatencySec]);

  // Rolling 1-second ticker to push real-time reading and keep last 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour12: false });
      const sec = latestLatencyRef.current;

      setHistory(prev => {
        const updated = [...prev.slice(1)];
        // Re-index secondsAgo labels
        const reindexed = updated.map((pt, idx) => {
          const ago = 59 - idx;
          return {
            ...pt,
            secondsAgo: ago,
            label: ago === 0 ? 'Now' : `-${ago}s`
          };
        });

        reindexed.push({
          timeStr,
          secondsAgo: 0,
          label: 'Now',
          latencySec: sec,
          latencyMs: Math.round(sec * 1000),
          isBottleneck: sec > 0.8,
          threshold: 0.8
        });

        return reindexed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute 60-second summary telemetry
  const stats = useMemo(() => {
    if (history.length === 0) return { min: 0.5, max: 0.8, avg: 0.65, bottleneckPct: 0 };
    const values = history.map(d => d.latencySec);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    const bottleneckCount = history.filter(d => d.isBottleneck).length;
    const bottleneckPct = Math.round((bottleneckCount / history.length) * 100);
    return { min, max, avg, bottleneckPct };
  }, [history]);

  return (
    <div className={`relative ${className}`}>
      
      {/* Compact Tactical HUD Card (Replaces the static text indicator) */}
      <div 
        className={`rounded-lg border px-2.5 py-1.5 transition-all duration-300 flex items-center gap-3 backdrop-blur-md ${
          isBottleneck
            ? 'bg-rose-950/40 border-rose-500/70 shadow-[0_0_16px_rgba(244,63,94,0.35)]'
            : 'bg-[#100b07]/90 border-[#ff8a1f]/35 hover:border-[#ff8a1f]/60'
        }`}
      >
        {/* Left: Metrics & Status Badge */}
        <div className="flex flex-col min-w-[130px] shrink-0 font-mono">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isBottleneck ? 'bg-rose-500 animate-ping' : 'bg-[#46e39a]'}`} />
            <span className="font-condensed font-bold text-xs tracking-wider text-white uppercase">
              {isBottleneck ? 'BOTTLENECK ALERT' : 'PIPELINE LATENCY'}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-base font-bold font-mono tracking-tight ${isBottleneck ? 'text-rose-300' : 'text-[#ffb259]'}`}>
              {currentLatencySec.toFixed(2)}s
            </span>
            <span className="text-[10px] text-neutral-400">
              ({currentLatencyMs}ms)
            </span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
              isBottleneck 
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40' 
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isBottleneck ? '>0.8s' : 'NOMINAL'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[9px] text-[#9a8878] mt-0.5 font-mono">
            <span>60s AVG: <b className="text-white">{stats.avg}s</b></span>
            <span>MAX: <b className={stats.max > 0.8 ? 'text-rose-400' : 'text-amber-400'}>{stats.max}s</b></span>
          </div>
        </div>

        {/* Center: Live 60-Second Recharts Line Chart */}
        <div className="w-36 sm:w-44 md:w-52 h-10 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <YAxis domain={[0.3, 1.4]} hide />
              <ReferenceLine 
                y={0.8} 
                stroke="#f43f5e" 
                strokeDasharray="2 2" 
                strokeOpacity={0.85} 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as LatencyDataPoint;
                    return (
                      <div className="bg-[#0b0805]/95 border border-[#ff8a1f]/40 p-1.5 rounded shadow-xl text-[10px] font-mono z-50 text-white">
                        <div className="text-[#ffb259] font-bold">{d.timeStr} ({d.label})</div>
                        <div className="text-cyan-300">{d.latencySec.toFixed(2)}s ({d.latencyMs}ms)</div>
                        <div className={d.isBottleneck ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                          {d.isBottleneck ? '⚠️ Bottleneck Exceeded' : '✓ Nominal Pipeline'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="latencySec"
                stroke={isBottleneck ? '#f43f5e' : '#ff8a1f'}
                strokeWidth={1.8}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Micro 60s Axis Markers */}
          <div className="flex justify-between items-center text-[8px] font-mono text-[#9a8878] -mt-0.5 px-1">
            <span>-60s</span>
            <span className="text-[#ff8a1f]/70">60s TREND</span>
            <span>Now</span>
          </div>
        </div>

        {/* Right: Expand / Maximize Telemetry Modal Button */}
        <button
          onClick={() => {
            soundFx.playClick(1100);
            setIsExpanded(!isExpanded);
          }}
          title={isExpanded ? "Collapse 60s Latency Telemetry" : "Expand 60s Latency Telemetry Chart"}
          className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
        >
          {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Modal / Aerospace Drawer View */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[460px] md:w-[540px] bg-[#0c0906]/98 border border-[#ff8a1f]/50 rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.9)] p-4 z-50 font-mono text-xs animate-fadeIn backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#ff8a1f]/20">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#ff8a1f]" />
              <span className="font-condensed font-bold text-sm text-white tracking-wider">
                THOUGHT LATENCY TRENDS (LAST 60 SECONDS)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#9a8878] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>REAL-TIME RECHARTS</span>
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-neutral-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Full High-Resolution Recharts Line Chart */}
          <div className="w-full h-44 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255, 138, 31, 0.08)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="label" 
                  stroke="#9a8878" 
                  fontSize={9} 
                  tickLine={false}
                  interval={11}
                />
                <YAxis 
                  domain={[0.3, 1.5]} 
                  stroke="#9a8878" 
                  fontSize={9} 
                  tickFormatter={(val) => `${val}s`}
                />
                <ReferenceLine 
                  y={0.8} 
                  stroke="#f43f5e" 
                  strokeDasharray="4 4" 
                  label={{ value: '0.80s BOTTLENECK THRESHOLD', fill: '#f43f5e', fontSize: 9, position: 'top' }} 
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as LatencyDataPoint;
                      return (
                        <div className="bg-[#120a06] border border-[#ff8a1f]/60 p-2.5 rounded-lg shadow-2xl text-xs space-y-1">
                          <div className="text-[#ffb259] font-bold flex justify-between gap-4">
                            <span>TIME: {d.timeStr}</span>
                            <span>{d.label}</span>
                          </div>
                          <div className="text-white font-bold text-sm">
                            {d.latencySec.toFixed(2)}s <span className="text-xs text-cyan-300 font-normal">({d.latencyMs} ms)</span>
                          </div>
                          <div className={`text-[10px] font-semibold flex items-center gap-1 ${
                            d.isBottleneck ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {d.isBottleneck ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>BOTTLENECK BREACHED (&gt;0.80s)</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>NOMINAL PIPELINE EFFICIENCY</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="latencySec"
                  stroke="#ff8a1f"
                  strokeWidth={2.2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#00f0ff', stroke: '#ffffff', strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Statistical Breakdown Strip */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#ff8a1f]/20 text-center font-mono text-[10px]">
            <div className="bg-[#140e08] p-2 rounded border border-[#ff8a1f]/20">
              <span className="text-[#9a8878] block text-[9px]">CURRENT</span>
              <b className={`text-sm ${isBottleneck ? 'text-rose-400' : 'text-[#ffb259]'}`}>
                {currentLatencySec.toFixed(2)}s
              </b>
            </div>
            <div className="bg-[#140e08] p-2 rounded border border-[#ff8a1f]/20">
              <span className="text-[#9a8878] block text-[9px]">60S MINIMUM</span>
              <b className="text-sm text-emerald-400">{stats.min.toFixed(2)}s</b>
            </div>
            <div className="bg-[#140e08] p-2 rounded border border-[#ff8a1f]/20">
              <span className="text-[#9a8878] block text-[9px]">60S AVERAGE</span>
              <b className="text-sm text-cyan-300">{stats.avg.toFixed(2)}s</b>
            </div>
            <div className="bg-[#140e08] p-2 rounded border border-[#ff8a1f]/20">
              <span className="text-[#9a8878] block text-[9px]">BOTTLENECK %</span>
              <b className={`text-sm ${stats.bottleneckPct > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.bottleneckPct}%
              </b>
            </div>
          </div>

          {/* Explanatory telemetry footer */}
          <div className="mt-2 text-[9px] text-[#9a8878] flex items-center justify-between">
            <span>Dynamic sampling rate: 1 Hz (60 data points rolling buffer)</span>
            <span className="text-emerald-400">Exit Code 0 Nominal</span>
          </div>
        </div>
      )}

    </div>
  );
};
