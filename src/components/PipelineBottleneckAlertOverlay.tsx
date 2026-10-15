import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Zap, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  X, 
  RefreshCw, 
  Sliders, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

interface PipelineBottleneckAlertOverlayProps {
  thoughtLatencyMs: number;
  thresholdSeconds?: number;
  onOptimize?: () => void;
  onFlush?: () => void;
  onOverrideLatency?: (latSec: number) => void;
  activeOverride?: number | null;
  onClearOverride?: () => void;
}

export const PipelineBottleneckAlertOverlay: React.FC<PipelineBottleneckAlertOverlayProps> = ({
  thoughtLatencyMs,
  thresholdSeconds = 0.8,
  onOptimize,
  onFlush,
  onOverrideLatency,
  activeOverride = null,
  onClearOverride
}) => {
  // Normalize latency: if > 25, treat as milliseconds, else seconds
  const currentLatencySec = activeOverride !== null 
    ? activeOverride 
    : (thoughtLatencyMs > 25 ? thoughtLatencyMs / 1000 : thoughtLatencyMs);

  const isBottleneck = currentLatencySec > thresholdSeconds;
  const prevBottleneckRef = useRef(false);

  // User state with persistent preference in sessionStorage
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('om7_bottleneck_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('om7_bottleneck_minimized') === 'true';
    } catch {
      return false;
    }
  });
  const [showSimControls, setShowSimControls] = useState(false);

  const handleMinimize = () => {
    soundFx.playClick(900);
    setIsMinimized(true);
    try {
      sessionStorage.setItem('om7_bottleneck_minimized', 'true');
    } catch {}
  };

  const handleDismiss = () => {
    soundFx.playClick(850);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('om7_bottleneck_dismissed', 'true');
    } catch {}
  };

  const handleRestoreFromMinimized = () => {
    soundFx.playClick(1100);
    setIsDismissed(false);
    setIsMinimized(false);
    try {
      sessionStorage.removeItem('om7_bottleneck_minimized');
      sessionStorage.removeItem('om7_bottleneck_dismissed');
    } catch {}
  };

  // Play warning chime when bottleneck threshold is crossed for the first time
  // Do NOT reopen or spam audio if the user already chose to minimize or dismiss!
  useEffect(() => {
    if (isBottleneck && !prevBottleneckRef.current) {
      if (!isMinimized && !isDismissed) {
        soundFx.playWarningAlert();
      }
    }
    prevBottleneckRef.current = isBottleneck;
  }, [isBottleneck, isMinimized, isDismissed]);

  // Delta calculations
  const excessSec = Math.max(0, currentLatencySec - thresholdSeconds);
  const degradationPct = Math.round((currentLatencySec / thresholdSeconds - 1) * 100);
  const severityLevel = currentLatencySec > 1.4 ? 'CRITICAL' : currentLatencySec > 0.8 ? 'ELEVATED' : 'NOMINAL';

  return (
    <>
      {/* 1. PERIMETER HAZARD VIGNETTE & WARNING PULSE (Only when alert is not minimized or dismissed) */}
      {isBottleneck && !isDismissed && !isMinimized && (
        <div 
          className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-500"
          style={{
            boxShadow: 'inset 0 0 60px rgba(239, 68, 68, 0.22), inset 0 0 120px rgba(255, 60, 0, 0.12)',
            border: '2px solid rgba(239, 68, 68, 0.45)'
          }}
        >
          {/* Top & Bottom flashing warning scanlines */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
          
          {/* Tactical Corner Hazard Reticles */}
          <div className="absolute top-2 left-2 text-[10px] font-mono font-bold text-rose-400/80 tracking-widest bg-black/60 px-2 py-0.5 rounded border border-rose-500/30">
            [SYS_WARN // LATENCY_BREACH]
          </div>
          <div className="absolute top-2 right-2 text-[10px] font-mono font-bold text-rose-400/80 tracking-widest bg-black/60 px-2 py-0.5 rounded border border-rose-500/30">
            [THRESH_LIMIT: 0.80s]
          </div>
        </div>
      )}

      {/* 2. FLOATING HUD CHIP (Stationary, calm, unobtrusive docked pill when minimized) */}
      {isBottleneck && isMinimized && !isDismissed && (
        <div className="fixed bottom-4 right-4 z-50 transition-all duration-300">
          <div className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl bg-[#140808]/95 border border-rose-500/70 text-white shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="text-left font-condensed pr-1">
              <span className="font-bold tracking-wider text-rose-300 text-[11px] block leading-tight">
                BOTTLENECK DOCKED ({currentLatencySec.toFixed(2)}s)
              </span>
              <span className="text-[10px] font-mono text-neutral-400 block leading-tight">
                Budget 0.80s • Minimized
              </span>
            </div>
            
            <button
              onClick={handleRestoreFromMinimized}
              className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px] font-bold tracking-wide uppercase border border-rose-500/40 transition-colors"
              title="Expand full bottleneck modal"
            >
              EXPAND
            </button>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              title="Dismiss completely"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 3. PRIMARY VISUAL ALERT OVERLAY MODAL / HUD BANNER */}
      {isBottleneck && !isDismissed && !isMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div 
            className="w-full max-w-2xl bg-[#0d0707]/98 border-2 border-rose-500/80 rounded-2xl p-4 sm:p-5 shadow-[0_0_60px_rgba(244,63,94,0.35)] text-white font-barlow relative overflow-hidden animate-fadeIn"
            role="alert"
            aria-live="assertive"
          >
            {/* Top Hazard Warning Stripe */}
            <div 
              className="absolute top-0 inset-x-0 h-1.5"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #b91c1c 10px, #b91c1c 20px)'
              }}
            />

            {/* Header: Title, Severity Badge & Close/Minimize Controls */}
            <div className="flex items-start justify-between gap-3 pt-1 pb-3 border-b border-rose-500/25">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] shrink-0 animate-pulse">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-condensed font-bold text-lg sm:text-xl tracking-wider uppercase text-white flex items-center gap-2">
                      <span>PIPELINE BOTTLENECK DETECTED</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500 text-black shadow-sm">
                      {severityLevel} ALERT
                    </span>
                  </div>
                  <p className="text-xs text-rose-200/80 font-mono mt-0.5">
                    Real-time execution latency <span className="text-rose-400 font-bold">{currentLatencySec.toFixed(2)}s</span> breached safe threshold limit of <span className="text-white font-semibold">0.80s</span>.
                  </p>
                </div>
              </div>

              {/* Action Window Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleMinimize}
                  title="Minimize to HUD"
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDismiss}
                  title="Acknowledge / Dismiss Alert"
                  className="p-1.5 rounded-lg bg-white/[0.06] hover:bg-rose-500/30 text-neutral-400 hover:text-rose-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
              <div className="p-2.5 rounded-xl bg-black/50 border border-rose-500/30 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">CURRENT LATENCY</span>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  {currentLatencySec.toFixed(2)}s
                </div>
                <span className="text-[10px] font-mono text-rose-300/80">
                  {Math.round(currentLatencySec * 1000)}ms execution
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">TARGET BUDGET</span>
                <div className="text-2xl font-bold font-mono text-[#46e39a] mt-1">
                  {thresholdSeconds.toFixed(2)}s
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  {Math.round(thresholdSeconds * 1000)}ms max ceiling
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-rose-500/30 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">BUDGET DEFICIT</span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  +{excessSec.toFixed(2)}s
                </div>
                <span className="text-[10px] font-mono text-amber-300/80">
                  +{degradationPct}% latency lag
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">PIPELINE STATUS</span>
                <div className="text-xl font-bold font-condensed tracking-wider text-rose-400 mt-1">
                  CONGESTED
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  3 stages throttle
                </span>
              </div>
            </div>

            {/* Diagnostic Breakdown */}
            <div className="p-3 rounded-xl bg-[#140a0a] border border-rose-500/25 mb-3.5">
              <div className="text-xs font-semibold font-condensed tracking-wider text-rose-300 uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>IDENTIFIED BOTTLENECK CHOKEPOINTS</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">STAGE TRACE</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/[0.05]">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>Multi-Agent Swarm Consensus (OM-7 Architect)</span>
                  </div>
                  <span className="text-rose-400 font-bold">~440ms delay</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/[0.05]">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Karpathy Vault 3D Force-Directed RAG Projection</span>
                  </div>
                  <span className="text-amber-300 font-bold">~290ms delay</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-white/[0.05]">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    <span>Token Serialization & Execution Log Buffer</span>
                  </div>
                  <span className="text-neutral-300 font-semibold">~150ms delay</span>
                </div>
              </div>
            </div>

            {/* Interactive Benchmark Simulator (Collapsible) */}
            <div className="mb-3.5 p-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowSimControls(!showSimControls)}
                  className="flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#ff8a1f]" />
                  <span className="font-semibold">TEST LATENCY BENCHMARK SLIDER</span>
                  <span className="text-[10px] text-neutral-500">
                    ({showSimControls ? 'Hide controls' : 'Adjust threshold test values'})
                  </span>
                </button>
                {activeOverride !== null && onClearOverride && (
                  <button
                    onClick={() => {
                      soundFx.playClick(1000);
                      onClearOverride();
                    }}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset to Live Feed</span>
                  </button>
                )}
              </div>

              {showSimControls && (
                <div className="mt-2.5 pt-2 border-t border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Simulate Pipeline Latency:</span>
                    <span className={`font-bold font-mono ${currentLatencySec > 0.8 ? 'text-rose-400' : 'text-[#46e39a]'}`}>
                      {currentLatencySec.toFixed(2)}s ({Math.round(currentLatencySec * 1000)}ms)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="2.50"
                    step="0.05"
                    value={currentLatencySec}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (onOverrideLatency) onOverrideLatency(val);
                    }}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                  />
                  {/* Preset quick test buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[
                      { label: '0.45s (Fast)', val: 0.45, safe: true },
                      { label: '0.70s (Safe)', val: 0.70, safe: true },
                      { label: '0.85s (Bottleneck)', val: 0.85, safe: false },
                      { label: '1.20s (Warning)', val: 1.20, safe: false },
                      { label: '1.95s (Critical)', val: 1.95, safe: false },
                    ].map((p) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          soundFx.playClick(p.safe ? 1200 : 700);
                          if (onOverrideLatency) onOverrideLatency(p.val);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                          Math.abs(currentLatencySec - p.val) < 0.04
                            ? p.safe 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                              : 'bg-rose-500/30 text-rose-300 border-rose-500 font-bold'
                            : 'bg-white/[0.04] text-neutral-400 border-white/[0.08] hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tactical Mitigation Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-rose-500/20">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    soundFx.playClick(1300);
                    if (onOptimize) onOptimize();
                    // If currently overridden above 0.8, pull it to optimal 0.65s
                    if (activeOverride !== null && onOverrideLatency) {
                      onOverrideLatency(0.65);
                    }
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-condensed font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>OPTIMIZE PIPELINE</span>
                </button>

                <button
                  onClick={() => {
                    soundFx.playClick(1100);
                    if (onFlush) onFlush();
                    if (activeOverride !== null && onOverrideLatency) {
                      onOverrideLatency(0.55);
                    }
                  }}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 text-neutral-200 text-xs font-condensed font-semibold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
                  <span>FLUSH QUEUES & RE-SYNC</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs font-mono">
                <button
                  onClick={handleMinimize}
                  className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/70 border border-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  MINIMIZE
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 transition-colors"
                >
                  ACKNOWLEDGE (DISMISS)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
