import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Sparkles, 
  Check, 
  Zap, 
  ArrowRight, 
  Play, 
  Activity, 
  Layers, 
  Radio, 
  MessageSquare, 
  Users, 
  PhoneCall, 
  Calendar, 
  Send, 
  Mail, 
  Database as DbIcon, 
  Workflow
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';
import { QuickTriggerAction } from '../types/cockpit';
import { CyberneticAiMaleFace } from './CyberneticAiMaleFace';

export interface ChannelChipInfo {
  id: string;
  name: string;
  countOrStatus: string;
  side: 'left' | 'right';
  description: string;
  metricLabel: string;
  metricVal: string;
  icon?: React.ReactNode;
}

export const LEFT_CHANNELS: ChannelChipInfo[] = [
  { id: 'content', name: 'CONTENT', countOrStatus: '12 queued', side: 'left', description: 'Editorial AST generation queue', metricLabel: 'Throughput', metricVal: '4.2k wpm' },
  { id: 'support', name: 'SUPPORT', countOrStatus: '148 chats', side: 'left', description: 'Tier-1 omnichannel resolution stream', metricLabel: 'First Response', metricVal: '0.4s' },
  { id: 'leads', name: 'LEADS', countOrStatus: '63 today', side: 'left', description: 'Real-time inbound qualification funnel', metricLabel: 'Conv. Rate', metricVal: '28.4%' },
  { id: 'voice', name: 'VOICE', countOrStatus: '9 calls', side: 'left', description: 'Low-latency conversational WebRTC audio', metricLabel: 'MOS Score', metricVal: '4.85' },
  { id: 'scheduler', name: 'SCHEDULER', countOrStatus: '21 booked', side: 'left', description: 'Autonomous executive diary synthesis', metricLabel: 'Sync Lag', metricVal: '12ms' },
];

export const RIGHT_CHANNELS: ChannelChipInfo[] = [
  { id: 'telegram', name: 'TELEGRAM', countOrStatus: 'live', side: 'right', description: 'Direct MTProto protocol bridge', metricLabel: 'Ping', metricVal: '18ms' },
  { id: 'whatsapp', name: 'WHATSAPP', countOrStatus: 'live', side: 'right', description: 'Cloud API webhook verified session', metricLabel: 'Uptime', metricVal: '100%' },
  { id: 'email', name: 'EMAIL', countOrStatus: 'live', side: 'right', description: 'IMAP/SMTP transactional mail dispatcher', metricLabel: 'Delivery', metricVal: '99.8%' },
  { id: 'crm', name: 'CRM', countOrStatus: 'synced', side: 'right', description: 'Bidirectional contact & deal sync', metricLabel: 'Last Sync', metricVal: '0.8s ago' },
  { id: 'database', name: 'DATABASE', countOrStatus: 'healthy', side: 'right', description: 'Karpathy vector manifold & relational vault', metricLabel: 'Pool Health', metricVal: '100%' },
];

export const PIPELINE_STAGES = [
  { index: 0, title: 'TRIGGER', subtitle: 'New message', badge: 'EVENT IN' },
  { index: 1, title: 'ROUTE', subtitle: 'Pick agent', badge: 'SWARM ROUTE' },
  { index: 2, title: 'PROCESS', subtitle: 'Reason + recall', badge: 'CORE SYNTHESIS' },
  { index: 3, title: 'RESPOND', subtitle: 'Send reply', badge: 'DISPATCH OUT' },
  { index: 4, title: 'LEARN', subtitle: 'Update memory', badge: 'VAULT UPDATE' },
];

interface UnifiedCoreIntelligenceSectionProps {
  activePipeStep: number;
  onSelectPipeStep: (step: number) => void;
  executingAction?: QuickTriggerAction | null;
  onExecuteAction?: (action: QuickTriggerAction) => void;
  onFilterChannel?: (channelName: string) => void;
  activeChannelFilter?: string | null;
  className?: string;
}

export const UnifiedCoreIntelligenceSection: React.FC<UnifiedCoreIntelligenceSectionProps> = ({
  activePipeStep,
  onSelectPipeStep,
  executingAction,
  onExecuteAction,
  onFilterChannel,
  activeChannelFilter,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const midRef = useRef<HTMLDivElement | null>(null);
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [hoveredChipId, setHoveredChipId] = useState<string | null>(null);
  const [isCoreBurst, setIsCoreBurst] = useState(false);

  // Dynamic animation loop for the concentric rotating rings & Bezier conduits
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const mid = midRef.current;
    if (!canvas || !container || !mid) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let R = 110;

    interface NodePoint {
      id: string;
      x: number;
      y: number;
      l: boolean;
    }

    interface PhotonParticle {
      node: NodePoint;
      t: number;
      v: number;
      color: string;
    }

    let nodes: NodePoint[] = [];
    let particles: PhotonParticle[] = [];

    const handleResize = () => {
      const b = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = b.width;
      H = b.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const m = mid.getBoundingClientRect();
      cx = m.left + m.width / 2 - b.left;
      cy = m.top + m.height / 2 - b.top;
      R = Math.min(135, Math.max(85, m.width * 0.38));

      // Query all rendered chip elements to calculate exact socket positions
      const chipEls = container.querySelectorAll<HTMLElement>('[data-chip-side]');
      nodes = Array.from(chipEls).map((c) => {
        const q = c.getBoundingClientRect();
        const isLeft = c.dataset.chipSide === 'left';
        return {
          id: c.dataset.chipId || '',
          x: isLeft ? q.right - b.left : q.left - b.left,
          y: q.top + q.height / 2 - b.top,
          l: isLeft
        };
      });

      // Spawn flowing photons
      particles = [];
      nodes.forEach((n) => {
        const count = 7;
        for (let k = 0; k < count; k++) {
          particles.push({
            node: n,
            t: Math.random(),
            v: 0.003 + Math.random() * 0.0045,
            color: n.l ? '#ff8a1f' : '#46e39a'
          });
        }
      });
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cubic Bezier curve formula between chip anchor and AI core center
    const getBezierPoint = (n: NodePoint, t: number): [number, number] => {
      const s = n.l ? -1 : 1;
      const p0: [number, number] = [cx, cy];
      const p1: [number, number] = [cx + s * W * 0.14, cy];
      const p2: [number, number] = [n.x - s * W * 0.16, n.y];
      const p3: [number, number] = [n.x, n.y];
      const u = 1 - t;
      const xVal = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
      const yVal = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
      return [xVal, yVal];
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, W, H);

      // 1. Draw glowing Bezier conduit guidelines
      nodes.forEach((n) => {
        const isSelected = selectedChipId === n.id;
        const isHovered = hoveredChipId === n.id;
        
        ctx.beginPath();
        for (let t = 0; t <= 1.001; t += 0.04) {
          const pt = getBezierPoint(n, t);
          if (t === 0) ctx.moveTo(pt[0], pt[1]);
          else ctx.lineTo(pt[0], pt[1]);
        }
        
        if (isSelected || isHovered) {
          ctx.strokeStyle = 'rgba(255, 138, 31, 0.7)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#ff8a1f';
          ctx.shadowBlur = 10;
        } else {
          ctx.strokeStyle = 'rgba(255, 138, 31, 0.22)';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 2. Animate and draw flowing photons
      particles.forEach((p) => {
        p.t += p.v;
        if (p.t > 1) p.t = 0;
        const pt = getBezierPoint(p.node, p.t);
        const opacity = Math.max(0.2, 1 - Math.abs(p.t - 0.5) * 1.4);
        
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], p.node.l ? 2.2 : 2.0, 0, Math.PI * 2);
        ctx.fillStyle = p.node.l 
          ? `rgba(255, 178, 89, ${opacity})`
          : `rgba(70, 227, 154, ${opacity})`;
        ctx.shadowColor = p.node.l ? '#ff8a1f' : '#46e39a';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 3. Central Radial Golden Bloom
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.35);
      grad.addColorStop(0, 'rgba(255, 150, 40, 0.55)');
      grad.addColorStop(0.55, 'rgba(255, 110, 10, 0.14)');
      grad.addColorStop(1, 'rgba(255, 110, 10, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 4. Concentric Rotating Holographic Circles
      const rings: Array<{ rScale: number; color: string; width: number; dash: number[]; speed: number }> = [
        { rScale: 1.0, color: '#ff8a1f', width: 3, dash: [70, 20, 10, 20], speed: 1 },
        { rScale: 0.82, color: '#e8c27a', width: 1.5, dash: [3, 9], speed: -1.4 },
        { rScale: 0.64, color: '#ff8a1f', width: 1, dash: [], speed: 0 }
      ];

      rings.forEach((ring) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle * ring.speed);
        ctx.beginPath();
        ctx.arc(0, 0, R * ring.rScale, 0, Math.PI * 2);
        ctx.setLineDash(ring.dash);
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width;
        ctx.shadowColor = ring.color;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();
      });

      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      angle += 0.007;
      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, [selectedChipId, hoveredChipId]);

  const handleChipClick = (chip: ChannelChipInfo) => {
    soundFx.playClick(1150);
    const newSelected = selectedChipId === chip.id ? null : chip.id;
    setSelectedChipId(newSelected);
    if (onFilterChannel) {
      onFilterChannel(newSelected ? chip.name : '');
    }
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      
      {/* =========================================================================
          TOP UNIFIED CORE INTELLIGENCE STAGE (MATCHING SCREENSHOT)
      ========================================================================= */}
      <section 
        className="relative bg-gradient-to-b from-[#20140c]/80 to-[#160f0a]/90 border border-[#ff8a1f]/30 rounded-xl p-3 sm:p-4 backdrop-blur-md shadow-2xl overflow-hidden"
        style={{
          boxShadow: '0 0 30px rgba(255, 138, 31, 0.08), inset 0 0 40px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Tactical Corner Bracket Accents (Top-Left & Bottom-Right) */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff8a1f] rounded-tl-xl pointer-events-none z-30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff8a1f] rounded-br-xl pointer-events-none z-30" />

        {/* Section Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ff8a1f]/20 relative z-20">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff8a1f]" />
              <span>UNIFIED CORE INTELLIGENCE</span>
            </span>
            <span className="text-[10px] font-mono text-[#9a8878] hidden sm:inline">
              • 10 SYNCHRONIZED CHANNELS • 60 FPS HOLOGRAPHIC CONDUIT
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#46e39a]/10 border border-[#46e39a]/30 text-[#46e39a] text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#46e39a] shadow-[0_0_6px_#46e39a] animate-pulse" />
              <span>CORE ONLINE</span>
            </span>
            {selectedChipId && (
              <button
                onClick={() => {
                  soundFx.playClick(900);
                  setSelectedChipId(null);
                  if (onFilterChannel) onFilterChannel('');
                }}
                className="text-[10px] text-amber-400 hover:text-white underline cursor-pointer"
              >
                CLEAR FILTER
              </button>
            )}
          </div>
        </div>

        {/* Core Stage Body with Bezier Canvas & Surrounding Channels */}
        <div 
          ref={containerRef}
          className="relative min-h-[460px] sm:min-h-[480px] w-full grid grid-cols-1 md:grid-cols-[160px_1fr_160px] gap-3 items-center justify-between p-2 select-none overflow-hidden"
        >
          {/* Hardware-accelerated HTML5 Bezier Particle Canvas */}
          <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          />

          {/* LEFT CHANNELS COLUMN: Content, Support, Leads, Voice, Scheduler */}
          <div className="relative z-10 flex flex-col justify-between h-full gap-2.5 py-1">
            {LEFT_CHANNELS.map((chip) => {
              const isSelected = selectedChipId === chip.id;
              const isHovered = hoveredChipId === chip.id;

              return (
                <div
                  key={chip.id}
                  data-chip-side="left"
                  data-chip-id={chip.id}
                  onClick={() => handleChipClick(chip)}
                  onMouseEnter={() => setHoveredChipId(chip.id)}
                  onMouseLeave={() => setHoveredChipId(null)}
                  className={`bg-[#0e0906]/92 border rounded-lg px-2.5 py-2 transition-all cursor-pointer relative shadow-md group ${
                    isSelected
                      ? 'border-[#ff8a1f] shadow-[0_0_16px_rgba(255,138,31,0.5)] scale-105 bg-[#180f0a]'
                      : isHovered
                      ? 'border-[#ff8a1f]/80 bg-[#140c08] scale-102'
                      : 'border-[#ff8a1f]/25 hover:border-[#ff8a1f]/60'
                  }`}
                  title={`${chip.name}: ${chip.description}`}
                >
                  <div className="flex items-center justify-between">
                    <b className="block font-condensed font-semibold text-sm text-white tracking-wider">
                      {chip.name}
                    </b>
                    <i className="w-1.5 h-1.5 rounded-full bg-[#46e39a] shadow-[0_0_6px_#46e39a]" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#9a8878] mt-0.5">
                    <span>{chip.countOrStatus}</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">{chip.metricVal}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CENTER: HOLOGRAPHIC AI CORE */}
          <div 
            ref={midRef}
            className="relative z-10 flex flex-col items-center justify-center text-center py-8 min-h-[300px] pointer-events-auto"
          >
            <div 
              onClick={() => {
                soundFx.playTriggerChime();
                setIsCoreBurst(true);
                setTimeout(() => setIsCoreBurst(false), 900);
              }}
              title="Click to pulse AI Core Swarm"
              className={`group relative w-72 h-72 sm:w-80 sm:h-80 md:w-[350px] md:h-[350px] rounded-full flex flex-col items-center justify-between p-5 transition-all duration-500 cursor-pointer select-none ${
                isCoreBurst ? 'scale-105' : 'hover:scale-[1.03]'
              }`}
            >
              {/* Layer 1: Ambient Outer Glow Halo with Breathing Animation */}
              <div className="absolute -inset-4 sm:-inset-6 rounded-full bg-radial from-[#ff8a1f]/25 via-[#ff8a1f]/5 to-transparent blur-xl pointer-events-none animate-core-breathe" />

              {/* Layer 2: Outer Spinning Segmented Cybernetic Ring (Clockwise) */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#ff8a1f]/50 pointer-events-none animate-[spin_26s_linear_infinite] shadow-[0_0_20px_rgba(255,138,31,0.35)]">
                {/* 4 Cardinal Glowing Satellite Nodes */}
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#ff8a1f] shadow-[0_0_10px_#ff8a1f]" />
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#46e39a] shadow-[0_0_10px_#46e39a]" />
                <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#e8c27a] shadow-[0_0_8px_#e8c27a]" />
                <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#ff8a1f] shadow-[0_0_8px_#ff8a1f]" />
              </div>

              {/* Layer 3: Counter-Rotating Fine Precision Ring (Counter-Clockwise) */}
              <div className="absolute inset-2.5 sm:inset-3 rounded-full border border-amber-400/25 border-t-amber-400/80 border-b-amber-400/80 pointer-events-none animate-spin-reverse">
                <span className="absolute top-1/4 -right-1 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#ffb259]" />
                <span className="absolute bottom-1/4 -left-1 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#ffb259]" />
              </div>

              {/* Layer 4: Tactical Reticle Crosshairs (Quadrant HUD Ticks) */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#ff8a1f]/80 pointer-events-none" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#ff8a1f]/80 pointer-events-none" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#ff8a1f]/80 pointer-events-none" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#ff8a1f]/80 pointer-events-none" />

              {/* Layer 5: Glowing Core Reactor Disc & Inner Radial Gradient */}
              <div 
                className="absolute inset-4 sm:inset-5 rounded-full bg-gradient-to-b from-[#25160d]/95 via-[#160d07]/95 to-[#0b0604]/98 border border-[#ff8a1f]/60 backdrop-blur-md transition-all duration-300 group-hover:border-[#ff8a1f] overflow-hidden"
                style={{
                  boxShadow: isCoreBurst
                    ? '0 0 55px rgba(255, 138, 31, 0.75), inset 0 0 45px rgba(255, 138, 31, 0.5)'
                    : '0 0 35px rgba(255, 138, 31, 0.4), inset 0 0 30px rgba(255, 138, 31, 0.25)'
                }}
              >
                {/* Subtle Radar/Conic Sweep Layer */}
                <div className="absolute inset-0 rounded-full opacity-35 bg-[radial-gradient(circle_at_center,rgba(255,138,31,0.5)_0%,transparent_70%)] animate-[pulse_4s_ease-in-out_infinite]" />
              </div>

              {/* Layer 5.5: PHOTOREALISTIC HOLOGRAPHIC MALE CYBERNETIC AI FACE IN THE MIDDLE */}
              <div className="absolute inset-4 sm:inset-5 flex items-center justify-center z-10 overflow-hidden rounded-full pointer-events-auto">
                <CyberneticAiMaleFace isBurst={isCoreBurst} />
              </div>

              {/* Layer 6: TOP TACTICAL HUD EYEBROW */}
              <div className="relative z-20 flex flex-col items-center pt-2 pointer-events-none">
                <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/80 border border-[#ff8a1f]/60 backdrop-blur-md shadow-[0_0_12px_rgba(255,138,31,0.4)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a1f] animate-ping" />
                  <span className="font-mono text-[9px] sm:text-[10px] text-[#ffb259] font-bold tracking-[0.2em] uppercase">
                    UNIFIED INTELLIGENCE
                  </span>
                </div>
              </div>

              {/* Layer 7: BOTTOM TACTICAL CORE BADGE */}
              <div className="relative z-20 flex flex-col items-center pb-2 pointer-events-none">
                {/* Sleek Minimal AI CORE Tag leaving face unobstructed */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-[#ff8a1f]/60 backdrop-blur-md shadow-[0_0_16px_rgba(255,138,31,0.5)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#46e39a] opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#46e39a]" />
                  </span>
                  <span className="font-condensed font-black tracking-widest text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ffe3b3] to-[#ff8a1f] drop-shadow-[0_0_8px_rgba(255,138,31,0.8)]">
                    AI CORE
                  </span>
                  <span className="text-neutral-500 font-mono text-[9px]">|</span>
                  <span className="text-[9px] font-mono text-[#e8c27a] font-medium tracking-wider">
                    SENTIENT OM-7
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CHANNELS COLUMN: Telegram, WhatsApp, Email, CRM, Database */}
          <div className="relative z-10 flex flex-col justify-between h-full gap-2.5 py-1">
            {RIGHT_CHANNELS.map((chip) => {
              const isSelected = selectedChipId === chip.id;
              const isHovered = hoveredChipId === chip.id;

              return (
                <div
                  key={chip.id}
                  data-chip-side="right"
                  data-chip-id={chip.id}
                  onClick={() => handleChipClick(chip)}
                  onMouseEnter={() => setHoveredChipId(chip.id)}
                  onMouseLeave={() => setHoveredChipId(null)}
                  className={`bg-[#0e0906]/92 border rounded-lg px-2.5 py-2 transition-all cursor-pointer relative shadow-md group ${
                    isSelected
                      ? 'border-[#ff8a1f] shadow-[0_0_16px_rgba(255,138,31,0.5)] scale-105 bg-[#180f0a]'
                      : isHovered
                      ? 'border-[#ff8a1f]/80 bg-[#140c08] scale-102'
                      : 'border-[#ff8a1f]/25 hover:border-[#ff8a1f]/60'
                  }`}
                  title={`${chip.name}: ${chip.description}`}
                >
                  <div className="flex items-center justify-between">
                    <b className="block font-condensed font-semibold text-sm text-white tracking-wider">
                      {chip.name}
                    </b>
                    <i className="w-1.5 h-1.5 rounded-full bg-[#46e39a] shadow-[0_0_6px_#46e39a]" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#9a8878] mt-0.5">
                    <span className="text-emerald-400">{chip.countOrStatus}</span>
                    <span className="text-[10px] text-neutral-400 font-normal">{chip.metricVal}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =======================================================================
            BOTTOM AUTOMATION PIPELINE (5 STAGES WITH CONNECTOR LINES)
        ======================================================================== */}
        <div className="mt-3 pt-3 border-t border-[#ff8a1f]/20 relative z-20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex items-center gap-2">
              <span>AUTOMATION PIPELINE</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a1f] animate-ping" />
            </h2>
            <span className="font-mono text-[11px] text-[#9a8878] tracking-normal">
              EVENT → RESULT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
            {PIPELINE_STAGES.map((st, i) => {
              const isActive = activePipeStep === i;
              const isPast = i < activePipeStep;

              return (
                <div
                  key={st.index}
                  onClick={() => {
                    soundFx.playClick(1000 + i * 100);
                    onSelectPipeStep(i);
                  }}
                  className={`relative border rounded-lg p-2.5 transition-all cursor-pointer select-none ${
                    isActive
                      ? 'border-[#ff8a1f] bg-[#ff8a1f]/15 shadow-[0_0_18px_rgba(255,138,31,0.35)_inset,0_0_14px_rgba(255,138,31,0.25)] ring-1 ring-[#ff8a1f]/60'
                      : isPast
                      ? 'border-emerald-500/35 bg-emerald-950/20 hover:border-emerald-500/60'
                      : 'border-[#ff8a1f]/20 bg-[#0e0906]/70 hover:border-[#ff8a1f]/50'
                  }`}
                >
                  {/* Subtle Dashed Connector Line between sequential stages on desktop */}
                  {i > 0 && (
                    <div className="hidden sm:block absolute -left-2 top-1/2 -translate-y-1/2 w-2 border-t border-dashed border-[#ff8a1f]/50 pointer-events-none" />
                  )}

                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] text-[#9a8878]">
                      0{st.index + 1}
                    </span>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 uppercase px-1.5 py-0.2 rounded-full bg-amber-400/20 border border-amber-400/60 shadow-[0_0_8px_rgba(255,138,31,0.5)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        ACTIVE
                      </span>
                    ) : isPast ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 uppercase">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        DONE
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-neutral-500 uppercase">
                        STANDBY
                      </span>
                    )}
                  </div>

                  <b className={`block font-condensed text-base font-semibold tracking-wide ${isActive ? 'text-[#ffb259]' : 'text-white'}`}>
                    {st.title}
                  </b>
                  <span className="text-[12px] text-[#9a8878] font-barlow block mt-0.5">
                    {st.subtitle}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </section>

    </div>
  );
};
