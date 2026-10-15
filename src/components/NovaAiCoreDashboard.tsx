import React, { useEffect, useRef, useState } from 'react';
import { 
  PhoneCall, 
  Activity, 
  Users, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Globe, 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  ShieldCheck, 
  Sparkles,
  Radio,
  Cpu,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export const NovaAiCoreDashboard: React.FC = () => {
  const coreCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pulseTick, setPulseTick] = useState(0);

  // 1. Centerpiece: Circular AI CORE (Nova Engine) with Radiating Golden Fiber-Optic Tendrils
  useEffect(() => {
    const canvas = coreCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const renderCore = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 540;
      const height = canvas.height = 360;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      phase += 0.02;

      // Draw 24 radiating curved fiber-optic neural strands (Left & Right)
      const strandCount = 28;
      for (let i = 0; i < strandCount; i++) {
        const isLeft = i % 2 === 0;
        const indexInSide = Math.floor(i / 2);
        const sideCount = strandCount / 2;
        const normY = (indexInSide / (sideCount - 1)) * 2 - 1; // -1 to 1

        const startX = cx + (isLeft ? -52 : 52);
        const startY = cy + normY * 18;
        const endX = isLeft ? 15 : width - 15;
        const endY = cy + normY * 140;

        // Curved bezier control points
        const cp1x = cx + (isLeft ? -130 : 130);
        const cp1y = startY + Math.sin(phase + i) * 6;
        const cp2x = isLeft ? 110 : width - 110;
        const cp2y = endY + Math.cos(phase * 1.5 + i) * 6;

        // Golden fiber-optic gradient
        const grad = ctx.createLinearGradient(startX, startY, endX, endY);
        grad.addColorStop(0, 'rgba(255, 220, 100, 0.9)');
        grad.addColorStop(0.4, 'rgba(255, 179, 0, 0.6)');
        grad.addColorStop(1, 'rgba(255, 140, 0, 0.25)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();

        // Traveling spark along strand
        const t = (phase * 0.4 + i * 0.15) % 1;
        const invT = 1 - t;
        const sparkX = Math.pow(invT, 3) * startX + 3 * Math.pow(invT, 2) * t * cp1x + 3 * invT * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * endX;
        const sparkY = Math.pow(invT, 3) * startY + 3 * Math.pow(invT, 2) * t * cp1y + 3 * invT * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * endY;

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFB300';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw Circular AI Core Outer Energy Halo
      const haloRadius = 58 + Math.sin(phase * 2) * 3;
      const haloGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, haloRadius + 20);
      haloGrad.addColorStop(0, 'rgba(255, 179, 0, 0.4)');
      haloGrad.addColorStop(0.6, 'rgba(255, 140, 0, 0.15)');
      haloGrad.addColorStop(1, 'rgba(255, 179, 0, 0)');

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, haloRadius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Outer Concentric Golden Ring with Segmented Dashes
      ctx.strokeStyle = 'rgba(255, 179, 0, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, 54, phase, phase + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner Core Disc
      const discGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 46);
      discGrad.addColorStop(0, '#FFF8E1');
      discGrad.addColorStop(0.3, '#FFB300');
      discGrad.addColorStop(0.8, '#FF8F00');
      discGrad.addColorStop(1, '#1A1208');

      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 46, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center Core Typography
      ctx.fillStyle = '#080502';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI CORE', cx, cy - 4);

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#3E2723';
      ctx.fillText('NOVA ENGINE', cx, cy + 9);

      animId = requestAnimationFrame(renderCore);
    };

    renderCore();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // 2. Data Streams Multi-Layer Sinusoidal Waves Canvas (Center Bottom)
  useEffect(() => {
    const canvas = streamCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let wavePhase = 0;

    const renderStreams = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 400;
      const height = canvas.height = 90;

      ctx.clearRect(0, 0, width, height);
      wavePhase += 0.035;

      const layers = [
        { color: 'rgba(255, 179, 0, 0.7)', amp: 16, freq: 0.02, speed: 1.0 },
        { color: 'rgba(255, 215, 64, 0.5)', amp: 12, freq: 0.03, speed: 1.4 },
        { color: 'rgba(0, 240, 255, 0.4)', amp: 18, freq: 0.018, speed: 0.8 },
      ];

      layers.forEach((layer) => {
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let x = 0; x < width; x += 4) {
          const y = height / 2 + Math.sin(x * layer.freq + wavePhase * layer.speed) * layer.amp + Math.cos(x * 0.01) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      animId = requestAnimationFrame(renderStreams);
    };

    renderStreams();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Top KPI metrics
  const topMetrics = [
    { label: 'ACTIVE CALLS', value: '532', spark: '86% load', color: 'text-amber-400' },
    { label: 'CALLS TODAY', value: '18,247', spark: '+23.6% vs yesterday', color: 'text-white' },
    { label: 'CONCURRENT CAPACITY', value: '1,000+', spark: 'Live interactions', color: 'text-cyan-400' },
    { label: 'AI RESPONSES / MIN', value: '24,875', spark: '~415 / sec', color: 'text-amber-300' },
    { label: 'UPTIME', value: '99.99%', spark: 'All Systems Operational', color: 'text-emerald-400' },
    { label: 'AVG. RESPONSE TIME', value: '0.68s', spark: 'Real-time performance', color: 'text-cyan-300' },
  ];

  // Live Call Waves list (from image)
  const callWaves = [
    { name: 'Wave 1', val: 86 },
    { name: 'Wave 2', val: 74 },
    { name: 'Wave 3', val: 91 },
    { name: 'Wave 4', val: 68 },
    { name: 'Wave 5', val: 77 },
    { name: 'Wave 48', val: 73 },
    { name: 'Wave 49', val: 81 },
    { name: 'Wave 50', val: 90 },
  ];

  // Conversation types donut distribution
  const convTypes = [
    { label: 'Sales Inquiries', pct: 38, color: '#FFB300' },
    { label: 'Customer Support', pct: 28, color: '#00F0FF' },
    { label: 'Appointments', pct: 15, color: '#818CF8' },
    { label: 'Upsell / Cross-sell', pct: 10, color: '#F472B6' },
    { label: 'Onboarding', pct: 6, color: '#34D399' },
    { label: 'Other', pct: 3, color: '#94A3B8' },
  ];

  // Top intents detected
  const topIntents = [
    { label: 'Product Information', pct: 24.5 },
    { label: 'Pricing Inquiry', pct: 18.7 },
    { label: 'Technical Support', pct: 16.2 },
    { label: 'Order Status', pct: 12.1 },
    { label: 'Appointment Booking', pct: 9.8 },
    { label: 'Other', pct: 18.7 },
  ];

  // AI Capabilities checkmarks
  const capabilities = [
    'Natural Language Understanding',
    'Real-time Speech Processing',
    'Contextual Memory & RAG',
    'Intent Recognition',
    'Sentiment Analysis',
    'Smart Agent Routing',
    'Auto-Resolution Loop',
    'Multi-language Support'
  ];

  return (
    <div className="w-full h-full bg-[#050811] text-[#E2E8F0] p-4 overflow-y-auto select-none space-y-4">
      
      {/* 1. Header Headline matching image: One AI. Unlimited Conversations. */}
      <div className="flex flex-col items-center justify-center text-center pt-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>One AI. Unlimited Conversations.</span>
          <span className="w-2 h-2 rounded-full bg-[#FFB300] animate-ping" />
        </h1>
        <p className="text-xs text-neutral-400 mt-1 font-medium">
          Powering hundreds of concurrent calls. Real-time. Intelligent. Effortless.
        </p>
      </div>

      {/* 2. Top Row: 6 High-Density KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {topMetrics.map((m, idx) => (
          <div 
            key={idx} 
            className="p-3 rounded-xl bg-[#0C121E]/90 border border-white/[0.08] hover:border-[#FFB300]/40 transition-colors shadow-sm"
          >
            <div className="text-[10px] font-mono text-neutral-400 truncate">
              {m.label}
            </div>
            <div className={`text-xl font-bold font-mono tracking-tight mt-1 ${m.color}`}>
              {m.value}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
              {m.spark}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Cockpit Grid: Left Column, Centerpiece AI Core, Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* LEFT COLUMN: Live Call Waves & Conversation Types (3 cols) */}
        <div className="lg:col-span-3 space-y-3.5 flex flex-col">
          
          {/* Live Call Waves */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08] flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">LIVE CALL WAVES</h3>
                <p className="text-[10px] text-neutral-400">Hundreds of conversations. One unified intelligence.</p>
              </div>
              <Activity className="w-4 h-4 text-[#FFB300]" />
            </div>

            <div className="mt-2.5 space-y-1.5 font-mono text-xs">
              {callWaves.map((w, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-white/[0.03] text-neutral-300">
                  <span className="text-[11px] text-neutral-400">{w.name}</span>
                  {/* Mini-sparkline wave simulation */}
                  <div className="flex items-center gap-0.5 w-24 h-3">
                    {[1, 3, 2, 4, 3, 5, 2, 4].map((h, i) => (
                      <span 
                        key={i} 
                        className="flex-1 bg-amber-400/60 rounded-full"
                        style={{ height: `${(h / 5) * 100}%` }}
                      />
                    ))}
                  </div>
                  <span className="text-amber-400 font-bold">{w.val}</span>
                </div>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-between text-xs font-mono">
              <div>
                <span className="text-neutral-500 text-[10px] block">Total Active Waves</span>
                <span className="text-white font-bold">50+</span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 text-[10px] block">Total Active Calls</span>
                <span className="text-[#FFB300] font-bold">532</span>
              </div>
            </div>
          </div>

          {/* Conversation Types Donut */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08]">
            <h3 className="text-xs font-bold text-white tracking-wide mb-2 flex items-center justify-between">
              <span>CONVERSATION TYPES</span>
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            </h3>

            <div className="space-y-1.5 text-[11px]">
              {convTypes.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-neutral-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="truncate">{c.label}</span>
                  </div>
                  <span className="font-semibold text-white">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide">SENTIMENT</h3>
              <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                78%
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">Positive Sentiment</p>
            </div>
            <div className="space-y-1 text-[10px] font-mono text-neutral-400">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Positive: 78%</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-300">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <span>Neutral: 16%</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Negative: 6%</span>
              </div>
            </div>
          </div>

        </div>

        {/* CENTER COLUMN: AI Core Nova Engine & Data Streams / Global Map (6 cols) */}
        <div className="lg:col-span-6 space-y-3.5 flex flex-col">
          
          {/* Circular AI Core Showcase */}
          <div className="p-4 rounded-xl bg-gradient-to-b from-[#0E1424] via-[#090D18] to-[#070A14] border border-[#FFB300]/40 shadow-[0_0_35px_rgba(255,179,0,0.12)] flex flex-col items-center relative overflow-hidden">
            
            {/* Top Subtitle banner */}
            <div className="text-center pb-1">
              <div className="text-xs font-bold font-mono tracking-widest text-[#FFB300] flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>UNIFIED AI INTELLIGENCE LAYER</span>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                Understanding • Reasoning • Responding
              </p>
            </div>

            {/* Canvas for Nova Core & Tendrils */}
            <div className="w-full flex justify-center py-2 relative">
              <canvas ref={coreCanvasRef} className="block max-w-full" />
            </div>

            {/* Bottom Stream Callout */}
            <div className="w-full flex items-center justify-between pt-2 border-t border-white/[0.08] text-[10px] font-mono text-neutral-400">
              <span className="text-[#FFB300] flex items-center gap-1">
                <Radio className="w-3 h-3 text-[#FFB300] animate-pulse" />
                LIVE CONCURRENT STREAMS: 532
              </span>
              <span>NOVA ENGINE v26.4</span>
            </div>
          </div>

          {/* Data Streams Sinusoidal Wave Mesh */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08]">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">DATA STREAMS</h3>
                <p className="text-[10px] text-neutral-400">Millions of data points processed in real-time</p>
              </div>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>

            <canvas ref={streamCanvasRef} className="w-full block my-1" />

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/[0.06] text-center text-xs font-mono">
              <div>
                <span className="text-neutral-500 text-[10px] block">DATA POINTS / SEC</span>
                <span className="text-white font-bold">128,945</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">STREAMS ACTIVE</span>
                <span className="text-[#FFB300] font-bold">247</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">EVENTS PROCESSED</span>
                <span className="text-white font-bold">3.7M</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[10px] block">ERROR RATE</span>
                <span className="text-emerald-400 font-bold">0.01%</span>
              </div>
            </div>
          </div>

          {/* Global Activity Map (Dotted SVG & Regional Metrics) */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08]">
            <div className="flex items-center justify-between pb-1.5">
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">GLOBAL ACTIVITY MAP</h3>
                <p className="text-[10px] text-neutral-400">Live conversations around the world</p>
              </div>
              <Globe className="w-4 h-4 text-[#FFB300]" />
            </div>

            <div className="flex items-center justify-between text-xs font-mono py-2">
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between w-36"><span className="text-neutral-400">North America</span><span className="text-white font-bold">178</span></div>
                <div className="flex justify-between w-36"><span className="text-neutral-400">South America</span><span className="text-white font-bold">42</span></div>
                <div className="flex justify-between w-36"><span className="text-neutral-400">Europe</span><span className="text-white font-bold">126</span></div>
                <div className="flex justify-between w-36"><span className="text-neutral-400">Asia</span><span className="text-white font-bold">147</span></div>
                <div className="flex justify-between w-36"><span className="text-neutral-400">Australia</span><span className="text-white font-bold">21</span></div>
              </div>

              <div className="text-right space-y-2 border-l border-white/[0.08] pl-4">
                <div>
                  <span className="text-neutral-500 text-[10px] block">ACTIVE COUNTRIES</span>
                  <span className="text-white text-base font-bold">62</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block">CITIES ACTIVE</span>
                  <span className="text-[#FFB300] text-base font-bold">310</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] block">TIME ZONE COVERAGE</span>
                  <span className="text-cyan-400 text-xs font-bold">24 / 7</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Insights, Top Intents, AI Capabilities, Health (3 cols) */}
        <div className="lg:col-span-3 space-y-3.5 flex flex-col">
          
          {/* Real-Time Insights */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08]">
            <h3 className="text-xs font-bold text-white tracking-wide">REAL-TIME INSIGHTS</h3>
            <p className="text-[10px] text-neutral-400 mb-2">Live performance across all conversations</p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1 border-t border-white/[0.06]">
              <div>
                <span className="text-neutral-500 text-[9px] block truncate">ENGAGEMENT</span>
                <span className="text-white font-bold text-sm">82%</span>
                <span className="text-[9px] text-emerald-400 block">+12.4%</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[9px] block truncate">RESOLUTION</span>
                <span className="text-white font-bold text-sm">91%</span>
                <span className="text-[9px] text-emerald-400 block">+8.7%</span>
              </div>
              <div>
                <span className="text-neutral-500 text-[9px] block truncate">SATISFACTION</span>
                <span className="text-[#FFB300] font-bold text-sm">4.8/5</span>
                <span className="text-[9px] text-emerald-400 block">+0.3</span>
              </div>
            </div>
          </div>

          {/* Top Intents Detected */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08]">
            <h3 className="text-xs font-bold text-white tracking-wide mb-2">TOP INTENTS DETECTED</h3>
            <div className="space-y-2 text-xs font-mono">
              {topIntents.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-neutral-300 truncate">{item.label}</span>
                    <span className="text-white font-semibold">{item.pct}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/[0.08] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-[#FFB300] rounded-full"
                      style={{ width: `${item.pct * 3.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Capabilities list */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08]">
            <h3 className="text-xs font-bold text-white tracking-wide mb-2 flex items-center justify-between">
              <span>AI CAPABILITIES</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </h3>
            <div className="space-y-1 text-[11px] font-mono text-neutral-300">
              {capabilities.map((cap, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-[#FFB300] shrink-0" />
                  <span className="truncate">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health Score */}
          <div className="p-3.5 rounded-xl bg-[#0B0F1B] border border-white/[0.08] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide">SYSTEM HEALTH</h3>
              <p className="text-[10px] text-neutral-400 mb-1">All systems optimal</p>
              <div className="space-y-0.5 text-[10px] font-mono text-neutral-300">
                <div className="text-emerald-400 flex items-center gap-1">✓ AI Engine</div>
                <div className="text-emerald-400 flex items-center gap-1">✓ Voice Processing</div>
                <div className="text-emerald-400 flex items-center gap-1">✓ Data Streams</div>
                <div className="text-emerald-400 flex items-center gap-1">✓ Security Bounds</div>
              </div>
            </div>

            <div className="w-20 h-20 rounded-full border-4 border-emerald-400/80 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <span className="text-lg font-bold text-white font-mono">100%</span>
              <span className="text-[8px] font-mono text-neutral-400">HEALTH</span>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Branding matching image */}
      <div className="text-center pt-3 pb-2 border-t border-white/[0.08] text-xs font-bold tracking-widest text-[#FFB300] font-mono">
        Nova AI Operating System • OpenMausBot Enterprise Edition
      </div>
    </div>
  );
};
