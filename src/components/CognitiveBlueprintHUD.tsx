import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Brain, 
  Orbit, 
  Activity, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Compass, 
  Sparkles,
  Layers,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

interface CognitiveBlueprintHUDProps {
  isOpen: boolean;
  onClose: () => void;
  thoughtLatencyMs: number;
}

export const CognitiveBlueprintHUD: React.FC<CognitiveBlueprintHUDProps> = ({
  isOpen,
  onClose,
  thoughtLatencyMs
}) => {
  const brainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spiralCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<string>('cognize');

  // Render Golden Holographic Brain & Light Conduits on Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = brainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width = 380;
      const height = canvas.height = 260;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = 100;
      phase += 0.03;

      // Draw Golden Neural Brain Synapse Mesh
      const nodeCount = 42;
      const brainNodes: { x: number; y: number; r: number }[] = [];

      for (let i = 0; i < nodeCount; i++) {
        const u = (i / nodeCount) * Math.PI * 2;
        // Dual hemisphere shape
        const hemiOffset = (i % 2 === 0 ? 1 : -1) * 14;
        const radiusX = 48 + Math.cos(u * 2) * 12;
        const radiusY = 38 + Math.sin(u * 3) * 8;
        const x = cx + hemiOffset + Math.cos(u) * radiusX;
        const y = cy + Math.sin(u) * radiusY;
        brainNodes.push({ x, y, r: 2 + Math.sin(phase + i) * 1 });
      }

      // Draw Synaptic Connectors
      ctx.lineWidth = 1;
      for (let i = 0; i < brainNodes.length; i++) {
        for (let j = i + 1; j < brainNodes.length; j++) {
          const d = Math.hypot(brainNodes[i].x - brainNodes[j].x, brainNodes[i].y - brainNodes[j].y);
          if (d < 38) {
            ctx.strokeStyle = `rgba(255, 179, 0, ${0.4 - d / 100})`;
            ctx.beginPath();
            ctx.moveTo(brainNodes[i].x, brainNodes[i].y);
            ctx.lineTo(brainNodes[j].x, brainNodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw Glowing Brain Synapse Points
      brainNodes.forEach((n) => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFB300';
        ctx.fillStyle = '#FFE082';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Central Golden Pillar Light Beams radiating downward
      const beamTargetY = height - 10;
      const pillarPositions = [
        cx - 120, // Collect
        cx - 60,  // Connect
        cx,       // Cognize (Center)
        cx + 60,  // Convert
        cx + 120  // Create
      ];

      pillarPositions.forEach((px, idx) => {
        const gradient = ctx.createLinearGradient(cx, cy + 45, px, beamTargetY);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.7)');
        gradient.addColorStop(0.5, 'rgba(255, 170, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 220, 100, 0.8)');

        ctx.lineWidth = idx === 2 ? 2.5 : 1.5;
        ctx.strokeStyle = gradient;

        // Flowing spline wave downward
        ctx.beginPath();
        ctx.moveTo(cx, cy + 45);
        ctx.bezierCurveTo(
          cx + (px - cx) * 0.2, cy + 110,
          px - (px - cx) * 0.1, cy + 130,
          px, beamTargetY
        );
        ctx.stroke();

        // Radiating ground beacon dot
        ctx.fillStyle = '#FFD54F';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFA000';
        ctx.beginPath();
        ctx.arc(px, beamTargetY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  // Render Spiral Neural Star Map Canvas (Bottom Left from image)
  useEffect(() => {
    if (!isOpen) return;
    const canvas = spiralCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const renderSpiral = () => {
      const size = 130;
      canvas.width = size;
      canvas.height = size;
      const cx = size / 2;
      const cy = size / 2;

      ctx.clearRect(0, 0, size, size);
      angle += 0.008;

      const starCount = 180;
      for (let i = 0; i < starCount; i++) {
        // Logarithmic spiral r = a * e^(b*theta)
        const theta = (i * 0.14) + angle;
        const r = 2.5 * Math.pow(theta, 0.95);
        if (r > cx - 6) continue;

        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;

        const brightness = Math.min(1, 0.2 + (i / starCount) * 0.8);
        ctx.fillStyle = `rgba(255, 215, 120, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, (i % 7 === 0) ? 1.8 : 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(renderSpiral);
    };

    renderSpiral();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-[#070A12]/95 backdrop-blur-2xl border-l border-[#FFB300]/25 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-y-auto select-none transition-all">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0B0F1A]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-[#FFB300]">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-widest font-mono flex items-center gap-2">
              <span>THE COGNITIVE BLUEPRINT</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                OM-7
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">
              Architecting Intelligence • Delivering Impact
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            soundFx.playClick(900);
            onClose();
          }}
          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Blueprint Canvas Area */}
      <div className="p-4 space-y-4">
        
        {/* Golden Neural Brain Hologram + Light Conduits */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#0E1322] to-[#080B14] border border-[#FFB300]/30 p-3 shadow-[inset_0_0_30px_rgba(255,179,0,0.06)] flex flex-col items-center">
          
          {/* Orbiting Satellite Telemetry Nodes (From image) */}
          <div className="w-full flex justify-between text-[10px] font-mono text-neutral-400 px-2 pt-1">
            <span className="flex items-center gap-1 text-amber-300">
              <Orbit className="w-3 h-3 text-[#FFB300]" />
              STRATEGIC INTELLIGENCE
            </span>
            <span className="text-cyan-300">
              DATA ECOSYSTEM: 8.4M
            </span>
          </div>

          <canvas ref={brainCanvasRef} className="block my-1" />

          {/* 5 Strategic Conduit Pillars (From image) */}
          <div className="w-full grid grid-cols-5 gap-1 pt-2 border-t border-white/[0.06] text-center">
            {[
              { id: 'collect', label: 'COLLECT', desc: 'Data from every touchpoint' },
              { id: 'connect', label: 'CONNECT', desc: 'Unify & enrich data' },
              { id: 'cognize', label: 'COGNIZE', desc: 'AI-driven reasoning' },
              { id: 'convert', label: 'CONVERT', desc: 'Strategic actions' },
              { id: 'create', label: 'CREATE', desc: 'Zero fatigue scale' }
            ].map((p) => {
              const isSelected = selectedPillar === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    soundFx.playClick(1100);
                    setSelectedPillar(p.id);
                  }}
                  className={`p-1 rounded-lg transition-all ${
                    isSelected ? 'bg-amber-500/20 text-[#FFB300] font-bold' : 'hover:bg-white/[0.04] text-neutral-400'
                  }`}
                >
                  <div className="text-[10px] font-mono tracking-wider">
                    {p.label}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="w-full text-center text-[10px] text-neutral-400 mt-1 font-mono">
            {selectedPillar === 'collect' && "Data ingestion from every customer touchpoint and tool."}
            {selectedPillar === 'connect' && "Multi-agent vector embedding unification across wiki/ and raw/."}
            {selectedPillar === 'cognize' && "Autonomous reasoning, cognitive debate, and phase-gate verification."}
            {selectedPillar === 'convert' && "Translating synthesized insights into deterministic exit-0 operations."}
            {selectedPillar === 'create' && "Zero founder fatigue through autonomous execution loops."}
          </div>
        </div>

        {/* Bottom Split (From image): Neural Star Map + Radar Target */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Neural Star Map (Spiral Galaxy Constellation) */}
          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/[0.08] flex flex-col items-center text-center">
            <span className="text-[10px] font-mono tracking-widest text-amber-300 mb-1 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-[#FFB300]" />
              NEURAL STAR MAP
            </span>
            <canvas ref={spiralCanvasRef} className="block my-1 rounded-full" />
            <span className="text-[9px] font-mono text-neutral-500">
              8,421,904 Vector Nodes
            </span>
          </div>

          {/* Mission Radar (Customer at the Center from image) */}
          <div className="p-3 rounded-xl bg-[#0D121F] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 mb-1 flex items-center gap-1 font-semibold">
                <Compass className="w-3 h-3 text-[#00F0FF]" />
                MISSION AT CENTER
              </span>
              <p className="text-[11px] text-neutral-300 mt-2 leading-relaxed">
                "We don't just build systems. We design the future of your autonomous business."
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-white/[0.06] space-y-1 text-[10px] font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Fatigue Guard:</span>
                <span className="text-emerald-400">100% SECURE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Drive C: Sandbox:</span>
                <span className="text-cyan-300">CONTAINED</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Vitals */}
      <div className="p-3 bg-[#070A12] border-t border-white/[0.08] flex items-center justify-between text-[10px] font-mono text-neutral-400">
        <span>INTELLIGENCE BEYOND DATA</span>
        <span className="text-amber-400">LATENCY: {thoughtLatencyMs.toFixed(1)}ms</span>
      </div>
    </div>
  );
};
