import React, { useEffect, useRef, useState } from 'react';
import { 
  Database, 
  FolderGit2, 
  HardDrive, 
  Network, 
  Sparkles, 
  RotateCw, 
  Eye, 
  FileText, 
  X,
  Layers,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { VaultNode } from '../types/cockpit';
import { ModernTheme, THEMES } from '../types/theme';
import { soundFx } from '../utils/audioSynthesizer';

interface RagVaultExplorerProps {
  nodes: VaultNode[];
  onSelectNode: (node: VaultNode) => void;
  selectedNode: VaultNode | null;
  onReindexNode: (nodeId: string) => void;
  theme: ModernTheme;
}

export const RagVaultExplorer: React.FC<RagVaultExplorerProps> = ({
  nodes,
  onSelectNode,
  selectedNode,
  onReindexNode,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePartition, setActivePartition] = useState<'all' | 'raw' | 'wiki' | 'outputs'>('all');
  const [autoRotate, setAutoRotate] = useState(true);
  const [inspectDrawerOpen, setInspectDrawerOpen] = useState(false);
  const currentTheme = THEMES[theme];

  const rotRef = useRef({ x: 0.3, y: 0.4 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(1.1);

  const filteredNodes = nodes.filter(n => {
    if (activePartition === 'all') return true;
    return n.partition === activePartition;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 400;
      const height = canvas.height = canvas.parentElement?.clientHeight || 280;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 300 * zoomRef.current;

      if (autoRotate && !isDraggingRef.current) {
        rotRef.current.y += 0.005;
      }

      const rx = rotRef.current.x;
      const ry = rotRef.current.y;

      interface ProjectedNode {
        node: VaultNode;
        pX: number;
        pY: number;
        pZ: number;
        scale: number;
        visible: boolean;
      }

      const projected: ProjectedNode[] = filteredNodes.map(node => {
        const cosY = Math.cos(ry);
        const sinY = Math.sin(ry);
        const x1 = node.x * cosY + node.z * sinY;
        const z1 = -node.x * sinY + node.z * cosY;

        const cosX = Math.cos(rx);
        const sinX = Math.sin(rx);
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const distance = 250 + z2;
        const scale = fov / (distance > 10 ? distance : 10);
        const pX = cx + x1 * scale;
        const pY = cy + y2 * scale;

        return {
          node,
          pX,
          pY,
          pZ: z2,
          scale,
          visible: distance > 20
        };
      });

      projected.sort((a, b) => a.pZ - b.pZ);

      // Clean hairline connections
      ctx.lineWidth = 1;
      projected.forEach(item => {
        if (!item.visible) return;
        item.node.connections.forEach(connId => {
          const target = projected.find(p => p.node.id === connId);
          if (target && target.visible) {
            const alpha = Math.max(0.06, Math.min(0.25, (item.scale + target.scale) * 0.12));
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            
            ctx.beginPath();
            ctx.moveTo(item.pX, item.pY);
            ctx.lineTo(target.pX, target.pY);
            ctx.stroke();
          }
        });
      });

      // Render precision point-cloud nodes
      projected.forEach(item => {
        if (!item.visible) return;

        const isSelected = selectedNode?.id === item.node.id;
        const baseRadius = (item.node.partition === 'wiki' ? 4.5 : item.node.partition === 'outputs' ? 5.5 : 3.5) * (item.scale * 0.8);
        const radius = Math.max(2.5, Math.min(10, baseRadius));

        ctx.fillStyle = isSelected
          ? '#FFFFFF'
          : item.node.partition === 'raw' 
          ? '#F59E0B' 
          : item.node.partition === 'wiki' 
          ? currentTheme.accentPrimary 
          : '#10B981';

        ctx.beginPath();
        ctx.arc(item.pX, item.pY, isSelected ? radius * 1.4 : radius, 0, Math.PI * 2);
        ctx.fill();

        // Node outline for crisp definition
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (item.scale > 0.85 || isSelected) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
          ctx.fillText(item.node.name.slice(0, 16), item.pX + radius + 4, item.pY + 3);
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [filteredNodes, selectedNode, autoRotate, currentTheme]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastMouseRef.current.x;
    const deltaY = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    rotRef.current.y += deltaX * 0.008;
    rotRef.current.x += deltaY * 0.008;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fov = 300 * zoomRef.current;
    const rx = rotRef.current.x;
    const ry = rotRef.current.y;

    let closestNode: VaultNode | null = null;
    let minDist = 20;

    filteredNodes.forEach(node => {
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = node.x * cosY + node.z * sinY;
      const z1 = -node.x * sinY + node.z * cosY;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = node.y * cosX - z1 * sinX;
      const z2 = node.y * sinX + z1 * cosX;

      const distance = 250 + z2;
      const scale = fov / (distance > 10 ? distance : 10);
      const pX = cx + x1 * scale;
      const pY = cy + y2 * scale;

      const d = Math.hypot(pX - clickX, pY - clickY);
      if (d < minDist) {
        minDist = d;
        closestNode = node;
      }
    });

    if (closestNode) {
      soundFx.playNodeSelect();
      onSelectNode(closestNode);
      setInspectDrawerOpen(true);
    }
  };

  return (
    <div 
      className="flex flex-col h-full rounded-xl border overflow-hidden select-none relative transition-colors duration-300"
      style={{
        backgroundColor: currentTheme.bgPanel,
        borderColor: currentTheme.borderSubtle
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2"
        style={{ borderColor: currentTheme.borderSubtle }}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: currentTheme.accentPrimary }} />
          <h2 className="text-xs font-semibold tracking-wide text-white font-hud">
            KARPATHY RAG MEMORY VAULT
          </h2>
          <span className="text-[10px] font-mono text-neutral-400">
            DRIVE E:\
          </span>
        </div>

        {/* Partition Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-[10px] font-mono">
          <button
            onClick={() => {
              soundFx.playClick(950);
              setActivePartition('all');
            }}
            className={`px-2 py-0.5 rounded transition-colors ${
              activePartition === 'all' ? 'bg-white/[0.1] text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            ALL
          </button>
          <button
            onClick={() => {
              soundFx.playClick(950);
              setActivePartition('raw');
            }}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              activePartition === 'raw' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            raw/
          </button>
          <button
            onClick={() => {
              soundFx.playClick(950);
              setActivePartition('wiki');
            }}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              activePartition === 'wiki' ? 'bg-white/[0.1] text-white font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTheme.accentPrimary }} />
            wiki/
          </button>
          <button
            onClick={() => {
              soundFx.playClick(950);
              setActivePartition('outputs');
            }}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              activePartition === 'outputs' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            outputs/
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative flex-1 min-h-[180px] bg-black/40 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-grab active:cursor-grabbing"
        />

        {/* Orbit Controls */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/[0.08] text-xs">
          <button
            onClick={() => {
              soundFx.playClick(1000);
              setAutoRotate(!autoRotate);
            }}
            title={autoRotate ? "Pause 3D Orbit" : "Resume 3D Orbit"}
            className={`p-1 rounded ${autoRotate ? 'text-white' : 'text-neutral-500'}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </button>
          <button
            onClick={() => {
              soundFx.playClick(1100);
              zoomRef.current = Math.min(2.0, zoomRef.current + 0.15);
            }}
            className="px-1.5 py-0.5 font-mono text-[11px] text-neutral-400 hover:text-white"
          >
            +
          </button>
          <button
            onClick={() => {
              soundFx.playClick(900);
              zoomRef.current = Math.max(0.6, zoomRef.current - 0.15);
            }}
            className="px-1.5 py-0.5 font-mono text-[11px] text-neutral-400 hover:text-white"
          >
            -
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/[0.08] text-[10px] font-mono">
          <div className="flex items-center gap-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>raw/</span>
          </div>
          <div className="flex items-center gap-1 text-white">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTheme.accentPrimary }} />
            <span>wiki/</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>outputs/</span>
          </div>
        </div>

        {/* Node Drawer */}
        {inspectDrawerOpen && selectedNode && (
          <div className="absolute inset-y-0 right-0 w-64 bg-[#0A0D14]/95 backdrop-blur-xl border-l border-white/[0.1] p-3 flex flex-col justify-between shadow-2xl z-20">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
                  NODE METADATA
                </span>
                <button
                  onClick={() => setInspectDrawerOpen(false)}
                  className="text-neutral-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2.5 space-y-2">
                <div>
                  <div className="text-xs font-semibold text-white truncate">
                    {selectedNode.name}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400 truncate">
                    {selectedNode.path}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-black/40 p-2 rounded border border-white/[0.06]">
                  <div>
                    <span className="text-neutral-500">SIZE:</span>
                    <span className="text-white ml-1">{selectedNode.sizeKb} KB</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">TOKENS:</span>
                    <span className="text-white ml-1">{(selectedNode.tokens / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-neutral-500">INDEXED:</span>
                    <span className="text-neutral-300 ml-1">{selectedNode.lastIndexed}</span>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-300 bg-black/30 p-2 rounded border border-white/[0.06] leading-relaxed">
                  {selectedNode.summary}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  soundFx.playDataChirp();
                  onReindexNode(selectedNode.id);
                }}
                className="w-full py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-xs font-mono text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>RE-INDEX NODE</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vitals */}
      <div 
        className="px-3 py-2 bg-black/40 border-t flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-neutral-400"
        style={{ borderColor: currentTheme.borderSubtle }}
      >
        <div className="flex items-center gap-3">
          <span>ACCESS: <strong className="text-emerald-400">98.6%</strong></span>
          <span className="text-neutral-600">·</span>
          <span>NODES: <strong className="text-white">8.4M+</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <HardDrive className="w-3 h-3 text-neutral-500" />
          <span>DRIVE E:\ 142.8 GB / 500 GB (28.5%)</span>
        </div>
      </div>
    </div>
  );
};
