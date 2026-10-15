import React, { useEffect, useRef, useState } from 'react';
import { 
  Zap, 
  Cpu, 
  RefreshCw, 
  Layers, 
  Trash2, 
  TrendingUp, 
  Compass, 
  Activity,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { QuickTriggerAction } from '../types/cockpit';
import { ModernTheme, THEMES } from '../types/theme';
import { soundFx } from '../utils/audioSynthesizer';

interface ArcCoreHeroProps {
  onExecuteTrigger: (action: QuickTriggerAction) => void;
  executingAction: QuickTriggerAction | null;
  thoughtLatencyMs: number;
  theme: ModernTheme;
}

export const ArcCoreHero: React.FC<ArcCoreHeroProps> = ({
  onExecuteTrigger,
  executingAction,
  thoughtLatencyMs,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coreCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [waveMode, setWaveMode] = useState<'sine' | 'fft' | 'spike'>('sine');
  const currentTheme = THEMES[theme];

  // 1. Interactive Live Precision Oscilloscope Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 800;
      const height = canvas.height = 130;

      ctx.clearRect(0, 0, width, height);

      // Clean hairline horizontal coordinate grid
      ctx.strokeStyle = theme === 'aerospace' 
        ? 'rgba(245, 158, 11, 0.08)' 
        : 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 15; y < height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical micro-dividers
      for (let x = 40; x < width; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const centerY = height / 2;
      ctx.lineWidth = executingAction ? 2.0 : 1.2;

      // Color based on theme
      const strokeColor = executingAction
        ? currentTheme.accentPrimary
        : theme === 'aerospace'
        ? 'rgba(245, 158, 11, 0.8)'
        : theme === 'linear-pro'
        ? 'rgba(56, 189, 248, 0.85)'
        : 'rgba(0, 240, 255, 0.85)';

      ctx.strokeStyle = strokeColor;
      ctx.beginPath();

      const speed = executingAction ? 0.07 : 0.028;
      phase += speed;

      for (let x = 0; x < width; x += 2) {
        const normX = x / width;
        let yOffset = 0;

        if (waveMode === 'sine') {
          const primary = Math.sin(normX * 14 - phase) * 18;
          const harmonic = Math.sin(normX * 28 + phase * 1.4) * 6;
          const microNoise = (Math.random() - 0.5) * (executingAction ? 4 : 1.5);
          yOffset = primary + harmonic + microNoise;
        } else if (waveMode === 'fft') {
          const step = Math.floor(normX * 24);
          yOffset = Math.sin(step + phase) * 22 + (Math.random() - 0.5) * 6;
        } else {
          const spikeFreq = Math.sin(normX * 6 - phase);
          yOffset = Math.pow(Math.max(0, spikeFreq), 10) * 32 * (Math.sin(normX * 40) > 0 ? 1 : -1);
        }

        const y = centerY + yOffset;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [executingAction, waveMode, theme, currentTheme]);

  // 2. Vector Precision Arc Core Canvas (360° calibrated dial)
  useEffect(() => {
    const canvas = coreCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const renderCore = () => {
      const size = 110;
      canvas.width = size;
      canvas.height = size;
      const cx = size / 2;
      const cy = size / 2;

      ctx.clearRect(0, 0, size, cy * 2);

      angle += executingAction ? 0.04 : 0.008;

      // Outer calibrated 360-degree tick circle
      const rOuter = 48;
      const tickCount = 60; // 6 degree steps
      ctx.lineWidth = 1;

      for (let i = 0; i < tickCount; i++) {
        const tickAngle = (i / tickCount) * Math.PI * 2 + angle;
        const isMajor = i % 5 === 0;
        const tickLength = isMajor ? 5 : 2.5;

        const x1 = cx + Math.cos(tickAngle) * (rOuter - tickLength);
        const y1 = cy + Math.sin(tickAngle) * (rOuter - tickLength);
        const x2 = cx + Math.cos(tickAngle) * rOuter;
        const y2 = cy + Math.sin(tickAngle) * rOuter;

        ctx.strokeStyle = isMajor
          ? (theme === 'aerospace' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.7)')
          : 'rgba(255, 255, 255, 0.15)';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Middle Segmented Vector Arc
      const rMid = 38;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = theme === 'aerospace' ? '#F59E0B' : currentTheme.accentPrimary;

      // Draw two counter-rotating arc segments
      ctx.beginPath();
      ctx.arc(cx, cy, rMid, -angle * 1.5, -angle * 1.5 + Math.PI * 0.75);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, rMid, -angle * 1.5 + Math.PI, -angle * 1.5 + Math.PI * 1.75);
      ctx.stroke();

      // Inner Core Circle
      const rInner = 22;
      ctx.fillStyle = theme === 'aerospace' ? '#181E29' : '#0B1018';
      ctx.beginPath();
      ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme === 'aerospace' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();

      // Precision Cardinal Crosshairs
      ctx.lineWidth = 1;
      ctx.strokeStyle = theme === 'aerospace' ? '#F59E0B' : currentTheme.accentPrimary;

      ctx.beginPath();
      ctx.moveTo(cx - 8, cy);
      ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8);
      ctx.lineTo(cx, cy + 8);
      ctx.stroke();

      animId = requestAnimationFrame(renderCore);
    };

    renderCore();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [executingAction, theme, currentTheme]);

  const handleTriggerClick = (action: QuickTriggerAction) => {
    soundFx.playTriggerChime();
    onExecuteTrigger(action);
  };

  const triggers: { action: QuickTriggerAction; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { action: 'DEPLOY AGENTS', icon: <Zap className="w-3.5 h-3.5" />, label: 'DEPLOY AGENTS', shortcut: '⌘1' },
    { action: 'SYNC VAULT', icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'SYNC VAULT', shortcut: '⌘2' },
    { action: 'RUN WORKFLOW', icon: <Layers className="w-3.5 h-3.5" />, label: 'RUN WORKFLOW', shortcut: '⌘3' },
    { action: 'PURGE CACHE', icon: <Trash2 className="w-3.5 h-3.5" />, label: 'PURGE CACHE', shortcut: '⌘4' },
    { action: 'OPTIMIZE PATH', icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'OPTIMIZE PATH', shortcut: '⌘5' },
  ];

  return (
    <section 
      className="relative w-full border-b px-4 py-3.5 overflow-hidden select-none transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.bgPanel,
        borderColor: currentTheme.borderSubtle
      }}
    >
      {/* Background High-Precision Oscilloscope Canvas */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Main Vector Hero Grid */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5">
        
        {/* Left: Telemetry Data Callout */}
        <div className="flex flex-col gap-2 min-w-[220px]">
          <div 
            className="p-2.5 rounded-lg border transition-all"
            style={{
              backgroundColor: currentTheme.bgCard,
              borderColor: currentTheme.borderSubtle
            }}
          >
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <Cpu className="w-3 h-3" style={{ color: currentTheme.accentPrimary }} />
                OM-7 ARC CORE
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-2.5 h-2.5" />
                NOMINAL
              </span>
            </div>

            <div className="text-lg font-bold font-hud tracking-wide text-white mt-1">
              AI SYNERGY: 100%
            </div>

            <div className="text-[11px] font-mono text-neutral-400 mt-1 flex items-center justify-between">
              <span>Google AI Pro Pipeline</span>
              <span className="font-semibold" style={{ color: currentTheme.accentPrimary }}>
                {thoughtLatencyMs.toFixed(1)}ms
              </span>
            </div>
          </div>

          {/* Technical Hardware Specs */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400 px-1">
            <span>FREQ: <strong className="text-white">142.8 GHz</strong></span>
            <span className="text-neutral-600">·</span>
            <span>COHERENCE: <strong className="text-white">0.998</strong></span>
            <span className="text-neutral-600">·</span>
            <button
              onClick={() => {
                soundFx.playClick(1100);
                setWaveMode(waveMode === 'sine' ? 'fft' : waveMode === 'fft' ? 'spike' : 'sine');
              }}
              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/[0.05] hover:bg-white/[0.1] text-neutral-200 border border-white/[0.08] transition-colors"
            >
              {waveMode.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Center: Precision Vector Dial Arc Core */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <canvas ref={coreCanvasRef} className="block" />
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-[9px] font-mono font-bold tracking-tighter text-white">
                OM-7
              </span>
              <span className="text-[8px] font-mono text-neutral-400">
                CORE
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tier-1 Quick Triggers (Linear-style tactile pads) */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[10px] font-mono tracking-wider text-neutral-400 font-semibold px-1 flex items-center justify-between">
            <span>TIER-1 QUICK TRIGGERS</span>
            <span className="text-neutral-500 font-normal">SHORTCUTS ACTIVE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {triggers.map((item) => {
              const isExecuting = executingAction === item.action;
              return (
                <button
                  key={item.action}
                  onClick={() => handleTriggerClick(item.action)}
                  disabled={!!executingAction}
                  className={`group px-3 py-2 rounded-lg font-mono text-[11px] font-medium tracking-tight transition-all border flex flex-col items-center justify-center gap-1 relative ${
                    isExecuting
                      ? 'bg-white/[0.15] border-white/40 text-white'
                      : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.08] hover:border-white/20 text-neutral-200 hover:text-white'
                  } disabled:opacity-50`}
                >
                  <div 
                    className="p-1 rounded transition-colors"
                    style={{ color: isExecuting ? currentTheme.accentPrimary : undefined }}
                  >
                    {item.icon}
                  </div>
                  <span className="truncate whitespace-nowrap font-medium text-[10px]">
                    [{item.label}]
                  </span>
                  <span className="text-[9px] text-neutral-500 font-mono">
                    {item.shortcut}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
