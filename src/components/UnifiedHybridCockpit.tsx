import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  Zap, 
  Check,
  CheckCircle2, 
  Layers, 
  Play, 
  Pause, 
  Trash2, 
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  Activity,
  Cpu,
  Radio,
  Sparkles,
  Bot,
  MessageSquare,
  Brain,
  HeartPulse,
  ChevronDown,
  AlertTriangle,
  Flame,
  Crosshair,
  Grid
} from 'lucide-react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { KarpathyVault3D } from './KarpathyVault3D';
import { CognitiveBlueprintHUD } from './CognitiveBlueprintHUD';
import { SquadHealthIndicator } from './SquadHealthIndicator';
import { PipelineBottleneckAlertOverlay } from './PipelineBottleneckAlertOverlay';
import { TacticalDroneOverlay } from './TacticalDroneOverlay';
import { ThoughtLatencyRealtimeChart } from './ThoughtLatencyRealtimeChart';
import { AgentClusterHeatmapD3 } from './AgentClusterHeatmapD3';
import { UnifiedCoreIntelligenceSection } from './UnifiedCoreIntelligenceSection';
import { AgentInfo, AgentId, QuickTriggerAction, StreamLogEntry, VaultNode } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

interface UnifiedHybridCockpitProps {
  agents: AgentInfo[];
  streamLogs: StreamLogEntry[];
  vaultNodes: VaultNode[];
  thoughtLatencyMs: number;
  executingAction: QuickTriggerAction | null;
  onExecuteTrigger: (action: QuickTriggerAction) => void;
  onSelectAgent: (id: AgentId) => void;
  onOpenDirectChat?: (id: AgentId) => void;
  onSubmitCommand: (cmd: string) => void;
  onClearLogs: () => void;
  isStreaming: boolean;
  activeStageView?: 'canvas' | 'hologram' | 'hybrid' | 'karpathy' | 'heatmap';
  onStageViewChange?: (view: 'canvas' | 'hologram' | 'hybrid' | 'karpathy' | 'heatmap') => void;
  highlightVaultNodeId?: string | null;
}

export const UnifiedHybridCockpit: React.FC<UnifiedHybridCockpitProps> = ({
  agents,
  streamLogs,
  vaultNodes,
  thoughtLatencyMs,
  executingAction,
  onExecuteTrigger,
  onSelectAgent,
  onOpenDirectChat,
  onSubmitCommand,
  onClearLogs,
  isStreaming,
  activeStageView,
  onStageViewChange,
  highlightVaultNodeId
}) => {
  // Canvas refs
  const hologramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const logScrollRef = useRef<HTMLDivElement | null>(null);

  // Stage View Mode: 'hybrid' | 'hologram' | 'canvas' | 'karpathy' | 'heatmap' (Karpathy Vault 3D & D3 Heatmap)
  const [stageView, setStageView] = useState<'canvas' | 'hologram' | 'hybrid' | 'karpathy' | 'heatmap'>(activeStageView || 'hybrid');

  // Sync external stage view changes (e.g. from Neural Knowledge Search)
  useEffect(() => {
    if (activeStageView) {
      setStageView(activeStageView);
    }
  }, [activeStageView]);

  const handleSetStageView = (newView: 'canvas' | 'hologram' | 'hybrid' | 'karpathy' | 'heatmap') => {
    setStageView(newView);
    onStageViewChange?.(newView);
  };

  const [rightColumnTab, setRightColumnTab] = useState<'heatmap' | 'health'>('heatmap');
  const [waveMode, setWaveMode] = useState<'sine' | 'fft' | 'spike'>('sine');
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [showDroneOverlay, setShowDroneOverlay] = useState(true);
  const [isLogPaused, setIsLogPaused] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  // Expanded full-width stage mode (default true for cool, large workspace)
  const [isStageExpanded, setIsStageExpanded] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  // Live Metrics & Counters
  const [activeChats, setActiveChats] = useState(532);
  const [tasksToday, setTasksToday] = useState(18247);
  const [recentTokens, setRecentTokens] = useState(420);
  const [measuredLatency, setMeasuredLatency] = useState(thoughtLatencyMs || 0.68);
  const [memoryContacts, setMemoryContacts] = useState(8412);
  const [memoryNotes, setMemoryNotes] = useState(26950);

  // Uptime and Sync Clock
  const [uptimeSeconds, setUptimeSeconds] = useState(4820);
  const [syncTime, setSyncTime] = useState(new Date().toLocaleTimeString([], { hour12: false }));

  // Pipeline execution animation step (0 to 4)
  const [activePipeStep, setActivePipeStep] = useState(0);

  // Real-time Insights rolling area data
  const [insightData, setInsightData] = useState<number[]>([
    45, 52, 60, 58, 64, 72, 68, 75, 80, 78, 85, 82, 88, 91, 86, 
    89, 94, 92, 90, 85, 88, 92, 95, 91, 87, 89, 93, 96, 94, 91
  ]);

  // Real-time Intents Distribution
  const [intentDistribution, setIntentDistribution] = useState([
    { label: 'Product information', pct: 24.5 },
    { label: 'Pricing inquiry', pct: 18.7 },
    { label: 'Technical support', pct: 16.2 },
    { label: 'Order status', pct: 12.1 },
    { label: 'Appointment booking', pct: 9.8 },
  ]);

  // Latency override for interactive benchmarking and testing
  const [latencyOverride, setLatencyOverride] = useState<number | null>(null);

  // Effective latency calculation (normalized to seconds)
  const effectiveLatencyMs = latencyOverride !== null ? latencyOverride : thoughtLatencyMs;
  const effectiveLatencySec = useMemo(() => {
    return effectiveLatencyMs > 25 ? effectiveLatencyMs / 1000 : effectiveLatencyMs;
  }, [effectiveLatencyMs]);

  const isBottleneckBreached = effectiveLatencySec > 0.8;

  // Pulse animation duration synced to real-time effective latency
  const pulseDurationSec = useMemo(() => {
    return Math.max(0.35, Math.min(3.5, effectiveLatencySec || 1.8));
  }, [effectiveLatencySec]);

  const pulseFrequencyHz = useMemo(() => {
    return Number((1 / pulseDurationSec).toFixed(2));
  }, [pulseDurationSec]);

  // Channel-filtered activity stream logs
  const filteredStreamLogs = useMemo(() => {
    if (!channelFilter) return streamLogs;
    const term = channelFilter.toLowerCase();
    return streamLogs.filter(l => 
      l.text.toLowerCase().includes(term) || 
      (l.agentName && l.agentName.toLowerCase().includes(term))
    );
  }, [streamLogs, channelFilter]);

  // Auto-scroll log unless paused
  useEffect(() => {
    if (!isLogPaused && logScrollRef.current) {
      logScrollRef.current.scrollTop = logScrollRef.current.scrollHeight;
    }
  }, [filteredStreamLogs, isLogPaused]);

  // Clock & Uptime ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
      setSyncTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Uptime (HH:MM:SS)
  const formattedUptime = useMemo(() => {
    const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(uptimeSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [uptimeSeconds]);

  // Continuous background simulation for living sparklines & area chart
  useEffect(() => {
    const interval = setInterval(() => {
      // Shift real-time insight points
      const nextVal = Math.round(70 + Math.random() * 26);
      setInsightData(prev => [...prev.slice(1), nextVal]);

      // Micro-fluctuations on memory & intents
      setMemoryContacts(prev => prev + (Math.random() > 0.6 ? 1 : 0));
      setMemoryNotes(prev => prev + (Math.random() > 0.4 ? 2 : 0));

      setIntentDistribution(prev => prev.map(item => ({
        ...item,
        pct: Number((item.pct + (Math.random() - 0.5) * 0.4).toFixed(1))
      })));
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  // Automation Pipeline Step Sequence
  useEffect(() => {
    // When executing an action, step rapidly
    const speed = executingAction || isStreaming ? 400 : 1200;
    const interval = setInterval(() => {
      setActivePipeStep(step => (step + 1) % 5);
    }, speed);

    return () => clearInterval(interval);
  }, [executingAction, isStreaming]);

  // Generate SVG Sparkline polyline string
  const generateSparkline = (data: number[], width = 100, height = 26) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = (max - min) || 1;
    const pts = data.map((val, idx) => {
      const x = ((idx / (data.length - 1)) * width).toFixed(1);
      const y = (height - 3 - ((val - min) / range) * (height - 6)).toFixed(1);
      return `${x},${y}`;
    });
    return pts.join(' L');
  };

  // Pre-baked sparkline datasets for KPI and agents
  const kpiSparkData = useMemo(() => ({
    chats: [40, 48, 45, 52, 60, 58, 64, 70, 68, 74, 80, 85, 82, 88],
    tasks: [30, 42, 50, 48, 55, 62, 70, 75, 72, 80, 88, 92, 90, 95],
    agents: [90, 90, 95, 90, 95, 95, 100, 100, 100, 100, 100, 100],
    replies: [60, 65, 72, 70, 78, 85, 80, 88, 94, 90, 95, 98, 96, 100],
    response: [80, 75, 68, 62, 58, 52, 48, 45, 42, 40, 38, 36, 35, 34],
    uptime: [99, 99, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
  }), []);

  // Top KPI Card Data
  const kpis = useMemo(() => [
    {
      title: 'ACTIVE CHATS',
      value: activeChats.toLocaleString(),
      delta: executingAction ? '+18% surge' : '+12% vs avg',
      data: kpiSparkData.chats
    },
    {
      title: 'TASKS TODAY',
      value: tasksToday.toLocaleString(),
      delta: '+23.6% vs yesterday',
      data: kpiSparkData.tasks
    },
    {
      title: 'AGENTS ONLINE',
      value: `${agents.length} / ${agents.length}`,
      delta: 'All healthy',
      data: kpiSparkData.agents
    },
    {
      title: 'REPLIES / MIN',
      value: (24875 + Math.floor(recentTokens * 1.5)).toLocaleString(),
      delta: '~415 per sec',
      data: kpiSparkData.replies
    },
    {
      title: 'AVG RESPONSE',
      value: `${effectiveLatencySec.toFixed(2)}s`,
      delta: isBottleneckBreached ? '⚠️ Bottleneck (>0.8s)' : 'Real-time nominal',
      data: kpiSparkData.response
    },
    {
      title: 'UPTIME',
      value: '99.99%',
      delta: 'Operational',
      data: kpiSparkData.uptime
    }
  ], [activeChats, tasksToday, agents.length, recentTokens, effectiveLatencySec, isBottleneckBreached, executingAction, kpiSparkData]);

  // Handle Quick Action Trigger
  const handleAction = async (action: QuickTriggerAction) => {
    soundFx.playTriggerChime();
    setActiveChats(prev => prev + 14);
    setTasksToday(prev => prev + 1);

    const start = performance.now();
    await onExecuteTrigger(action);
    const elapsed = (performance.now() - start) / 1000;
    setMeasuredLatency(Math.max(0.35, elapsed));
    setRecentTokens(340 + Math.floor(Math.random() * 200));

    setTimeout(() => {
      setActiveChats(prev => Math.max(520, prev - 14));
    }, 2800);
  };

  // Handle Command Form Submission
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    soundFx.playClick(1400);

    const cmd = commandInput.trim();
    setCommandInput('');
    setTasksToday(prev => prev + 1);

    const start = performance.now();
    await onSubmitCommand(cmd);
    const elapsed = (performance.now() - start) / 1000;
    setMeasuredLatency(Math.max(0.35, elapsed));
  };

  // =========================================================================
  // HIGH-PRECISION HYBRID ARC CORE & 28-TENDRIL FIBER-OPTIC OSCILLOSCOPE CANVAS
  // =========================================================================
  useEffect(() => {
    const canvas = hologramCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    let phase = 0;

    const renderCoreHologram = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 720;
      const height = canvas.height = canvas.parentElement?.clientHeight || 460;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(88, width * 0.16, height * 0.22);
      
      const speed = executingAction || isStreaming ? 0.024 : 0.010;
      angle += speed;
      phase += (speed * 1.5) / (pulseDurationSec || 1.8);

      // -----------------------------------------------------------------------
      // A. BACKGROUND HIGH-PRECISION COORDINATE GRID
      // -----------------------------------------------------------------------
      ctx.strokeStyle = 'rgba(255, 138, 31, 0.07)';
      ctx.lineWidth = 1;
      for (let y = 16; y < height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let x = 32; x < width; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // -----------------------------------------------------------------------
      // B. REAL-TIME OSCILLOSCOPE SWEEP WAVEFORM (Dynamic by waveMode)
      // -----------------------------------------------------------------------
      const waveGrad = ctx.createLinearGradient(0, 0, width, 0);
      waveGrad.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
      waveGrad.addColorStop(0.2, 'rgba(0, 240, 255, 0.45)');
      waveGrad.addColorStop(0.5, 'rgba(255, 179, 0, 0.85)');
      waveGrad.addColorStop(0.8, 'rgba(0, 240, 255, 0.45)');
      waveGrad.addColorStop(1, 'rgba(0, 240, 255, 0.08)');

      ctx.strokeStyle = waveGrad;
      ctx.lineWidth = executingAction || isStreaming ? 2.2 : 1.4;
      ctx.beginPath();

      for (let x = 0; x < width; x += 2) {
        const normX = x / width;
        let yOffset = 0;

        if (waveMode === 'sine') {
          const primary = Math.sin(normX * 14 - phase * 3) * 18;
          const harmonic = Math.sin(normX * 28 + phase * 4) * 6;
          const microNoise = (Math.random() - 0.5) * (executingAction ? 4 : 1.5);
          yOffset = primary + harmonic + microNoise;
        } else if (waveMode === 'fft') {
          const step = Math.floor(normX * 32);
          yOffset = Math.sin(step + phase * 4) * 24 + (Math.random() - 0.5) * 5;
        } else {
          // Spike Mode
          const spikeFreq = Math.sin(normX * 6 - phase * 3);
          yOffset = Math.pow(Math.max(0, spikeFreq), 10) * 38 * (Math.sin(normX * 36) > 0 ? 1 : -1);
        }

        const wy = cy + yOffset;
        if (x === 0) {
          ctx.moveTo(x, wy);
        } else {
          ctx.lineTo(x, wy);
        }
      }
      ctx.stroke();

      // -----------------------------------------------------------------------
      // C. 28 RADIATING CURVED FIBER-OPTIC NEURAL TENDRILS WITH SPARKS
      // -----------------------------------------------------------------------
      const strandCount = 28;
      for (let i = 0; i < strandCount; i++) {
        const isLeft = i % 2 === 0;
        const indexInSide = Math.floor(i / 2);
        const sideCount = strandCount / 2;
        const normY = (indexInSide / (sideCount - 1)) * 2 - 1; // -1 to 1

        const startX = cx + (isLeft ? -R * 0.72 : R * 0.72);
        const startY = cy + normY * 20;
        const endX = isLeft ? 18 : width - 18;
        const endY = cy + normY * (height * 0.44);

        // Curved cubic bezier control points with breathing sine wave
        const cp1x = cx + (isLeft ? -135 : 135);
        const cp1y = startY + Math.sin(phase + i * 0.7) * 8;
        const cp2x = isLeft ? 110 : width - 110;
        const cp2y = endY + Math.cos(phase * 1.4 + i * 0.7) * 8;

        // Radiant golden-to-amber fiber-optic gradient
        const strandGrad = ctx.createLinearGradient(startX, startY, endX, endY);
        strandGrad.addColorStop(0, 'rgba(255, 240, 160, 0.95)');
        strandGrad.addColorStop(0.35, 'rgba(255, 179, 0, 0.65)');
        strandGrad.addColorStop(0.75, 'rgba(255, 138, 31, 0.32)');
        strandGrad.addColorStop(1, 'rgba(255, 90, 0, 0.12)');

        ctx.strokeStyle = strandGrad;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();

        // Traveling photon spark along each strand
        const t = (phase * 0.38 + i * 0.14) % 1;
        const invT = 1 - t;
        const sparkX = Math.pow(invT, 3) * startX + 3 * Math.pow(invT, 2) * t * cp1x + 3 * invT * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * endX;
        const sparkY = Math.pow(invT, 3) * startY + 3 * Math.pow(invT, 2) * t * cp1y + 3 * invT * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * endY;

        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 9;
        ctx.shadowColor = '#FFB300';
        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 1.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // -----------------------------------------------------------------------
      // D. VOLUMETRIC DUAL AMBER & CYAN ENERGY HALO
      // -----------------------------------------------------------------------
      const haloRadius = R * 1.42 + Math.sin(phase * 2) * 4;
      const haloGrad = ctx.createRadialGradient(cx, cy, R * 0.45, cx, cy, haloRadius + 15);
      haloGrad.addColorStop(0, 'rgba(255, 179, 0, 0.42)');
      haloGrad.addColorStop(0.45, 'rgba(0, 240, 255, 0.16)');
      haloGrad.addColorStop(0.85, 'rgba(255, 138, 31, 0.08)');
      haloGrad.addColorStop(1, 'rgba(255, 138, 31, 0)');

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, haloRadius + 15, 0, Math.PI * 2);
      ctx.fill();

      // -----------------------------------------------------------------------
      // E. 360-DEGREE CALIBRATED PRECISION VECTOR TICKS (Aerospace dial)
      // -----------------------------------------------------------------------
      const rTicks = R + 14;
      const tickCount = 60;
      ctx.lineWidth = 1;

      for (let i = 0; i < tickCount; i++) {
        const tickAngle = (i / tickCount) * Math.PI * 2 + angle;
        const isMajor = i % 5 === 0;
        const tickLen = isMajor ? 7 : 3.5;

        const x1 = cx + Math.cos(tickAngle) * (rTicks - tickLen);
        const y1 = cy + Math.sin(tickAngle) * (rTicks - tickLen);
        const x2 = cx + Math.cos(tickAngle) * rTicks;
        const y2 = cy + Math.sin(tickAngle) * rTicks;

        ctx.strokeStyle = isMajor
          ? (i % 10 === 0 ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255, 179, 0, 0.85)')
          : 'rgba(255, 255, 255, 0.22)';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // -----------------------------------------------------------------------
      // F. COUNTER-ROTATING SEGMENTED VECTOR ARCS
      // -----------------------------------------------------------------------
      // Outer segmented ring with line dash [6, 4]
      ctx.strokeStyle = 'rgba(255, 179, 0, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, R + 4, angle * 1.2, angle * 1.2 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Mid counter-rotating segmented vector arc (dual cyan arcs)
      const rMid = R - 4;
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#00F0FF';
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, rMid, -angle * 1.6, -angle * 1.6 + Math.PI * 0.72);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, rMid, -angle * 1.6 + Math.PI, -angle * 1.6 + Math.PI * 1.72);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner dashed golden telemetry ring
      ctx.strokeStyle = 'rgba(255, 179, 0, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.75, angle * 0.8, angle * 0.8 + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // -----------------------------------------------------------------------
      // G. MULTI-STOP RADIANT CENTER CORE DISC
      // -----------------------------------------------------------------------
      const discR = R * 0.56;
      const discGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, discR);
      discGrad.addColorStop(0, '#FFFBE6');
      discGrad.addColorStop(0.25, '#FFB300');
      discGrad.addColorStop(0.65, '#FF8F00');
      discGrad.addColorStop(0.88, '#E65100');
      discGrad.addColorStop(1, '#1A0C04');

      ctx.fillStyle = discGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, discR, 0, Math.PI * 2);
      ctx.fill();

      // Disc golden rim
      ctx.strokeStyle = '#FFE082';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#FFB300';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // -----------------------------------------------------------------------
      // H. PRECISION CARDINAL CROSSHAIRS
      // -----------------------------------------------------------------------
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#FFE082';
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy);
      ctx.lineTo(cx + 9, cy);
      ctx.moveTo(cx, cy - 9);
      ctx.lineTo(cx, cy + 9);
      ctx.stroke();

      // -----------------------------------------------------------------------
      // I. CENTER CORE TYPOGRAPHY
      // -----------------------------------------------------------------------
      ctx.fillStyle = '#080502';
      ctx.font = 'bold 11px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AI CORE', cx, cy - 3);

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#2A1404';
      ctx.fillText('NOVA ENGINE', cx, cy + 9);

      animId = requestAnimationFrame(renderCoreHologram);
    };

    renderCoreHologram();
    return () => cancelAnimationFrame(animId);
  }, [executingAction, isStreaming, waveMode, pulseDurationSec]);

  // Channel chips for Stage Left & Right
  const leftChips = [
    { name: 'CONTENT', desc: '12 queued' },
    { name: 'SUPPORT', desc: '148 chats' },
    { name: 'LEADS', desc: '63 today' },
    { name: 'VOICE', desc: '9 calls' },
    { name: 'SCHEDULER', desc: '21 booked' },
  ];

  const rightChips = [
    { name: 'TELEGRAM', desc: 'live' },
    { name: 'WHATSAPP', desc: 'live' },
    { name: 'EMAIL', desc: 'live' },
    { name: 'CRM', desc: 'synced' },
    { name: 'DATABASE', desc: 'healthy' },
  ];

  // 5 Pipeline Stages
  const pipelineStages = [
    { title: 'TRIGGER', desc: 'New message' },
    { title: 'ROUTE', desc: 'Pick agent' },
    { title: 'PROCESS', desc: 'Reason + recall' },
    { title: 'RESPOND', desc: 'Send reply' },
    { title: 'LEARN', desc: 'Update memory' },
  ];

  return (
    <div className="flex-1 w-full h-full relative overflow-y-auto bg-[#060504] text-[#f3e9df] font-barlow select-none p-3 sm:p-4">
      
      {/* ========================================================= */}
      {/* 1. TOP HEADER                                             */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 mb-3.5 pb-2 border-b border-[#ff8a1f]/20">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-condensed tracking-tight leading-none text-white">
            OPEN MAUSE <em className="not-italic text-[#ff8a1f] drop-shadow-[0_0_24px_rgba(255,138,31,0.55)]">BOT</em>
          </h1>
          <p className="text-[#9a8878] text-xs sm:text-sm mt-1">
            Your AI operator. One core, every channel, always on.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#9a8878] flex-wrap">
          {/* Dynamic Squad Health & Granular Agent Heartbeat Indicator with Agent Synchronization */}
          <SquadHealthIndicator
            agents={agents}
            onSelectAgent={onSelectAgent}
            thoughtLatencyMs={effectiveLatencyMs}
          />

          {/* Real-Time Thought Latency Recharts Line Chart (Last 60 Seconds) */}
          <ThoughtLatencyRealtimeChart 
            thoughtLatencyMs={effectiveLatencyMs} 
          />

          <span className="flex items-center gap-1.5 text-white">
            <span className="w-2 h-2 rounded-full bg-[#46e39a] shadow-[0_0_8px_#46e39a] animate-pulse" />
            <b className="font-semibold text-white">CORE ONLINE</b>
          </span>
          <span>
            UPTIME <b className="text-white font-medium">{formattedUptime}</b>
          </span>
          <span>
            SYNC <b className="text-white font-medium">{syncTime}</b>
          </span>
          <button
            onClick={() => {
              soundFx.playClick(1200);
              setBlueprintOpen(true);
            }}
            className="px-2.5 py-1 rounded bg-[#ff8a1f]/10 hover:bg-[#ff8a1f]/20 border border-[#ff8a1f]/35 hover:border-[#ff8a1f] text-[#ffb259] text-xs font-condensed tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-[#ff8a1f]" />
            <span>BLUEPRINT</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. 6-KPI CARDS WITH REAL-TIME SVG SPARKLINES              */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3.5">
        {kpis.map((k, idx) => (
          <div key={idx} className="panel-tactical p-3 flex flex-col justify-between">
            <small className="font-mono text-[10px] text-[#9a8878] uppercase tracking-wider block">
              {k.title}
            </small>
            <div className="text-2xl font-bold font-condensed leading-tight my-0.5 text-white">
              {k.value}
            </div>
            <div className="text-[11px] font-mono text-[#46e39a]">
              {k.delta}
            </div>
            <div className="w-full h-6 mt-1">
              <svg viewBox="0 0 100 26" preserveAspectRatio="none" className="w-full h-full">
                <path 
                  d={`M${generateSparkline(k.data, 100, 26)}`}
                  fill="none" 
                  stroke="#ff8a1f" 
                  strokeWidth="1.5" 
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 3. THREE-COLUMN MASTER GRID                               */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3.5">
        
        {/* ------------------------------------------------------- */}
        {/* LEFT COLUMN: LIVE WAVES, CONVERSATIONS, MEMORY (3 COLS) */}
        {/* ------------------------------------------------------- */}
        <div className={`${isStageExpanded ? 'col-span-12 lg:col-span-6' : 'lg:col-span-3'} flex flex-col gap-3 transition-all duration-300`}>
          
          {/* Section: Live Agent Waves */}
          <section className="panel-tactical p-3.5">
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex justify-between items-center mb-2.5">
              <span>LIVE AGENT WAVES</span>
              <span className="font-mono text-[11px] text-[#9a8878] font-normal tracking-normal">{agents.length} ACTIVE</span>
            </h2>

            <div className="space-y-1.5 divide-y divide-[#ff8a1f]/10">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  onClick={() => {
                    soundFx.playClick(1050);
                    onSelectAgent(agent.id);
                  }}
                  className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs hover:bg-[#ff8a1f]/5 px-1 rounded transition-colors cursor-pointer"
                  title={`Click to select ${agent.name}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#46e39a]" />
                    <span className="text-white truncate font-medium">{agent.name.split(' ')[0]}</span>
                  </div>

                  <div className="w-16 h-5 shrink-0">
                    <svg viewBox="0 0 70 20" preserveAspectRatio="none" className="w-full h-full">
                      <path 
                        d={`M${generateSparkline([agent.loadPercent - 10, agent.loadPercent + 5, agent.loadPercent - 4, agent.loadPercent + 8, agent.loadPercent], 70, 20)}`}
                        fill="none" 
                        stroke="#ff8a1f" 
                        strokeWidth="1.3" 
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <b className="font-mono text-[12px] text-[#ffb259] font-medium w-8 text-right">
                      {agent.loadPercent}%
                    </b>
                    {onOpenDirectChat && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDirectChat(agent.id);
                        }}
                        className="p-1 hover:text-cyan-300 text-neutral-500 rounded hover:bg-white/[0.08] transition-colors"
                        title={`Chat with ${agent.name}`}
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Conversation Types Donut */}
          <section className="panel-tactical p-3.5">
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex justify-between items-center mb-2.5">
              <span>CONVERSATION TYPES</span>
              <span className="font-mono text-[11px] text-[#9a8878] font-normal tracking-normal">DISTRIBUTION</span>
            </h2>

            <div className="flex items-center gap-3.5">
              {/* Donut Ring with conic gradient */}
              <div 
                className="w-24 h-24 rounded-full relative shrink-0 flex items-center justify-center"
                style={{
                  background: 'conic-gradient(#ff8a1f 0% 38%, #ffb259 38% 66%, #5b8cff 66% 81%, #9b6bff 81% 91%, rgba(255,255,255,0.12) 91% 100%)'
                }}
              >
                <div className="absolute inset-2 bg-[#120c08] rounded-full flex items-center justify-center">
                  <i className="not-italic font-condensed font-bold text-xl text-white">1.2k</i>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1 text-xs text-[#9a8878] leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[#ff8a1f]" />
                  <span>Sales <b className="text-white font-medium">38%</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[#ffb259]" />
                  <span>Support <b className="text-white font-medium">28%</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[#5b8cff]" />
                  <span>Booking <b className="text-white font-medium">15%</b></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm bg-[#9b6bff]" />
                  <span>Upsell <b className="text-white font-medium">10%</b></span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Memory Telemetry */}
          <section className="panel-tactical p-3.5">
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex justify-between items-center mb-2.5">
              <span>MEMORY</span>
              <span className="font-mono text-[11px] text-[#9a8878] font-normal tracking-normal">RAG VAULT</span>
            </h2>

            <div className="text-xs text-[#9a8878] space-y-1 leading-relaxed font-barlow">
              <div className="flex justify-between">
                <span>Contacts remembered</span>
                <b className="text-white font-mono font-medium">{memoryContacts.toLocaleString()}</b>
              </div>
              <div className="flex justify-between">
                <span>Notes stored</span>
                <b className="text-white font-mono font-medium">{memoryNotes.toLocaleString()}</b>
              </div>
              <div className="flex justify-between">
                <span>Recall accuracy</span>
                <b className="text-[#46e39a] font-mono font-medium">97.4%</b>
              </div>
              <div className="flex justify-between">
                <span>Learning rate</span>
                <b className="text-[#ffb259] font-mono font-medium">+3.1% / week</b>
              </div>
            </div>

            <button
              onClick={() => handleAction('SYNC VAULT')}
              className="mt-2.5 w-full py-1 rounded bg-[#ff8a1f]/10 hover:bg-[#ff8a1f]/20 border border-[#ff8a1f]/30 text-[#ffb259] text-xs font-condensed tracking-wider font-semibold transition-colors"
            >
              SYNC MEMORY VAULT
            </button>
          </section>

        </div>

        {/* ------------------------------------------------------- */}
        {/* CENTER COLUMN: STAGE WITH EMBEDDED WORKFLOW CANVAS (FULL-WIDTH EXPANDED) */}
        {/* ------------------------------------------------------- */}
        <div className={`${isStageExpanded ? 'col-span-12 lg:col-span-12 order-first' : 'lg:col-span-6'} flex flex-col gap-3 transition-all duration-300`}>
          
          {/* Specific Full-Width Section on top of Intelligence Stage (Unified Core Intelligence & AI Core) */}
          <UnifiedCoreIntelligenceSection
            activePipeStep={activePipeStep}
            onSelectPipeStep={(step) => {
              setActivePipeStep(step);
            }}
            executingAction={executingAction}
            onExecuteAction={handleAction}
            onFilterChannel={(chan) => setChannelFilter(chan || null)}
            activeChannelFilter={channelFilter}
          />

          {/* Main Stage Panel (Full-Width Expanded) */}
          <section className={`panel-tactical p-3 sm:p-4 flex flex-col ${isStageExpanded ? 'min-h-[660px]' : 'min-h-[490px]'} w-full relative overflow-hidden shadow-2xl transition-all duration-300`}>
            
            {/* Stage Header with View Mode Switcher & Waveform Mode Selector */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#ff8a1f]/20 z-20">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#ff8a1f]" />
                  <span>INTELLIGENCE STAGE</span>
                </span>
                <span className="text-[10px] font-mono text-[#9a8878] hidden sm:inline">
                  • {stageView === 'hologram' ? 'CORE STAGE' : stageView === 'hybrid' ? 'HYBRID FUSION' : 'WORKFLOW CANVAS'}
                </span>
                {isBottleneckBreached && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/60 text-rose-300 font-mono text-[10px] animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    <span className="font-bold">BOTTLENECK ({effectiveLatencySec.toFixed(2)}s)</span>
                  </div>
                )}
              </div>

              {/* View & Waveform Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Wave Mode Selector */}
                <div className="flex items-center gap-1 bg-[#0e0906] p-0.5 rounded-lg border border-[#ff8a1f]/25 text-[10px] font-mono">
                  <span className="text-neutral-500 px-1 text-[9px]">OSCILLOSCOPE:</span>
                  {(['sine', 'fft', 'spike'] as const).map((wm) => (
                    <button
                      key={wm}
                      onClick={() => {
                        soundFx.playClick(1150);
                        setWaveMode(wm);
                      }}
                      className={`px-1.5 py-0.5 rounded uppercase font-semibold transition-colors ${
                        waveMode === wm
                          ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {wm}
                    </button>
                  ))}
                </div>

                {/* Stage View Mode Selector */}
                <div className="flex items-center gap-1 bg-[#0e0906] p-0.5 rounded-lg border border-[#ff8a1f]/20">
                  <button
                    onClick={() => {
                      soundFx.playClick(1100);
                      handleSetStageView('hologram');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-condensed tracking-wider transition-colors ${
                      stageView === 'hologram' 
                        ? 'bg-[#ff8a1f] text-[#120802] font-bold shadow-[0_0_10px_rgba(255,138,31,0.6)]' 
                        : 'text-[#9a8878] hover:text-white'
                    }`}
                  >
                    CORE STAGE
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick(1100);
                      handleSetStageView('hybrid');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-condensed tracking-wider transition-colors ${
                      stageView === 'hybrid' 
                        ? 'bg-[#ff8a1f] text-[#120802] font-bold shadow-[0_0_10px_rgba(255,138,31,0.6)]' 
                        : 'text-[#9a8878] hover:text-white'
                    }`}
                  >
                    HYBRID FUSION
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick(1100);
                      handleSetStageView('canvas');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-condensed tracking-wider transition-colors ${
                      stageView === 'canvas' 
                        ? 'bg-[#ff8a1f] text-[#120802] font-bold shadow-[0_0_10px_rgba(255,138,31,0.6)]' 
                        : 'text-[#9a8878] hover:text-white'
                    }`}
                  >
                    WORKFLOW CANVAS
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playTriggerChime();
                      handleSetStageView('karpathy');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-condensed tracking-wider flex items-center gap-1 transition-all ${
                      stageView === 'karpathy' 
                        ? 'bg-[#ff8a1f] text-[#120802] font-bold shadow-[0_0_12px_rgba(255,138,31,0.7)]' 
                        : 'text-[#ffb259] hover:text-white hover:bg-[#ff8a1f]/20'
                    }`}
                  >
                    <Brain className="w-3 h-3 text-cyan-300 animate-pulse" />
                    <span>KARPATHY VAULT (3D)</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playTriggerChime();
                      handleSetStageView('heatmap');
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-condensed tracking-wider flex items-center gap-1 transition-all ${
                      stageView === 'heatmap' 
                        ? 'bg-[#ff8a1f] text-[#120802] font-bold shadow-[0_0_12px_rgba(255,138,31,0.7)]' 
                        : 'text-[#ffb259] hover:text-white hover:bg-[#ff8a1f]/20'
                    }`}
                  >
                    <Grid className="w-3 h-3 text-[#ff8a1f]" />
                    <span>7×7 HEATMAP (D3)</span>
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playClick(1150);
                      setShowDroneOverlay(!showDroneOverlay);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-condensed tracking-wider flex items-center gap-1 transition-all ${
                      showDroneOverlay 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.35)]' 
                        : 'text-[#9a8878] hover:text-white'
                    }`}
                    title="Toggle OpenMausBot Tactical Drone Topographical Map Overlay"
                  >
                    <Crosshair className="w-3 h-3 text-cyan-400" />
                    <span>DRONE RECON</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    soundFx.playClick(1200);
                    setIsStageExpanded(prev => !prev);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-condensed tracking-wider flex items-center gap-1 transition-all ${
                    isStageExpanded 
                      ? 'bg-[#ff8a1f] text-[#120802] font-bold shadow-[0_0_10px_rgba(255,138,31,0.6)]' 
                      : 'text-[#9a8878] hover:text-white bg-white/[0.05]'
                  }`}
                  title={isStageExpanded ? 'Restore 3-column cockpit layout' : 'Expand stage to full width'}
                >
                  {isStageExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  <span>{isStageExpanded ? 'FULL WIDTH' : 'EXPAND'}</span>
                </button>

                <button
                  onClick={() => handleAction('RUN WORKFLOW')}
                  disabled={executingAction !== null}
                  className="px-2.5 py-1 rounded bg-[#ff8a1f] hover:bg-[#ffb259] text-[#160b02] text-xs font-condensed font-bold tracking-wider flex items-center gap-1 transition-all shadow-[0_0_12px_rgba(255,138,31,0.4)]"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>RUN WORKFLOW</span>
                </button>
              </div>
            </div>

            {/* Stage Body (Expanded & Spacious) */}
            <div className={`flex-1 w-full ${isStageExpanded ? 'min-h-[560px] lg:h-[640px]' : 'h-[420px]'} relative overflow-hidden rounded-xl bg-[#090604]/95 border border-[#ff8a1f]/20 shadow-inner transition-all duration-300`}>
              
              {/* Background Hologram Canvas (rendered in hologram or hybrid mode) */}
              <div 
                className={`absolute inset-0 z-0 transition-opacity duration-300 ${
                  stageView === 'canvas' || stageView === 'karpathy' ? 'opacity-0 pointer-events-none' : stageView === 'hybrid' ? 'opacity-85' : 'opacity-100'
                }`}
              >
                <canvas ref={hologramCanvasRef} className="w-full h-full block" />

                {/* Left side communication channel chips */}
                <div className="absolute left-2.5 top-0 bottom-0 flex flex-col justify-between py-4 z-10 w-28 pointer-events-auto">
                  {leftChips.map((chip, i) => (
                    <div 
                      key={i} 
                      onClick={() => soundFx.playClick(950 + i * 50)}
                      className="bg-[#0e0906]/92 border border-[#ff8a1f]/30 hover:border-[#ff8a1f] rounded-lg p-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <b className="font-condensed text-[12px] text-white tracking-wider">{chip.name}</b>
                        <i className="w-1.5 h-1.5 rounded-full bg-[#46e39a] shadow-[0_0_5px_#46e39a]" />
                      </div>
                      <span className="font-mono text-[9px] text-[#9a8878]">{chip.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Top Center Subtitle Banner */}
                <div className="absolute top-2.5 inset-x-0 flex flex-col items-center pointer-events-none text-center z-10">
                  <div className="text-[10px] font-mono tracking-widest text-[#ffb259] flex items-center justify-center gap-1.5 bg-[#0e0906]/80 px-3 py-0.5 rounded-full border border-[#ff8a1f]/20">
                    <Sparkles className="w-3 h-3 text-[#ff8a1f]" />
                    <span>UNIFIED AI INTELLIGENCE LAYER</span>
                    <Sparkles className="w-3 h-3 text-[#ff8a1f]" />
                  </div>
                  <p className="text-[9px] text-[#9a8878] font-mono mt-0.5">
                    Understanding • Reasoning • Responding
                  </p>
                </div>

                {/* Center Core HUD Halo & CSS-Animated Pulse Aura */}
                <div 
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center z-10"
                  style={{
                    animation: `arcCoreOscilloscopePulse ${pulseDurationSec}s ease-in-out infinite`
                  }}
                >
                  <div 
                    className="w-44 h-44 rounded-full border border-[#ff8a1f]/30 flex items-center justify-center"
                    style={{
                      animation: `arcCoreRingPulse ${pulseDurationSec}s ease-in-out infinite`
                    }}
                  >
                    <div className="w-36 h-36 rounded-full border border-cyan-400/25 flex flex-col items-center justify-center">
                      <div className="font-condensed font-bold text-3xl tracking-widest text-white drop-shadow-[0_0_24px_rgba(255,138,31,0.85)] leading-tight">
                        AI CORE
                      </div>
                      <small className="font-mono text-[9px] text-[#ffb259] font-medium tracking-wide">
                        NOVA ENGINE
                      </small>
                    </div>
                  </div>
                </div>

                {/* Bottom Center Telemetry Callout Pill */}
                <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none z-10 px-4">
                  <div className="flex items-center gap-2 bg-[#0e0906]/90 px-3 py-1 rounded-full border border-[#ff8a1f]/30 text-[10px] font-mono shadow-lg">
                    <Radio className="w-3 h-3 text-[#ff8a1f] animate-pulse" />
                    <span className="text-[#ffb259] font-semibold">532 STREAMS</span>
                    <span className="text-neutral-600">|</span>
                    <span className="text-white">142.8 GHz</span>
                    <span className="text-neutral-600">|</span>
                    <span className="text-cyan-300 font-bold">{measuredLatency.toFixed(1)}ms</span>
                    <span className="text-neutral-600">|</span>
                    <span className="text-[#ffb259] font-bold">{pulseFrequencyHz} Hz</span>
                    <span className="text-neutral-600">|</span>
                    <span className="text-[#46e39a]">100% NOMINAL</span>
                  </div>
                </div>

                {/* Right side communication channel chips */}
                <div className="absolute right-2.5 top-0 bottom-0 flex flex-col justify-between py-4 z-10 w-28 pointer-events-auto">
                  {rightChips.map((chip, i) => (
                    <div 
                      key={i} 
                      onClick={() => soundFx.playClick(950 + i * 50)}
                      className="bg-[#0e0906]/92 border border-[#ff8a1f]/30 hover:border-[#ff8a1f] rounded-lg p-1.5 shadow-sm transition-all hover:scale-105 cursor-pointer text-right"
                    >
                      <div className="flex items-center justify-between">
                        <i className="w-1.5 h-1.5 rounded-full bg-[#46e39a] shadow-[0_0_5px_#46e39a]" />
                        <b className="font-condensed text-[12px] text-white tracking-wider">{chip.name}</b>
                      </div>
                      <span className="font-mono text-[9px] text-[#9a8878]">{chip.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Embedded Interactive Workflow Canvas (rendered in canvas or hybrid mode) */}
              {(stageView === 'canvas' || stageView === 'hybrid') && (
                <div className="absolute inset-0 z-10 w-full h-full">
                  <WorkflowCanvas
                    agents={agents}
                    executingAction={executingAction}
                    onSelectAgent={onSelectAgent}
                    onExecuteWorkflow={() => handleAction('RUN WORKFLOW')}
                    thoughtLatencyMs={effectiveLatencyMs}
                  />
                </div>
              )}

              {/* Karpathy Vault 3D Interactive Force-Directed Graph */}
              {stageView === 'karpathy' && (
                <div className="absolute inset-0 z-20 w-full h-full animate-fadeIn">
                  <KarpathyVault3D initialSelectedNodeId={highlightVaultNodeId} />
                </div>
              )}

              {/* D3-based 7x7 Agent Cluster Heatmap Stage View */}
              {stageView === 'heatmap' && (
                <div className="absolute inset-0 z-20 w-full h-full p-2 bg-[#090604] overflow-auto animate-fadeIn flex items-center justify-center">
                  <AgentClusterHeatmapD3
                    agents={agents}
                    onSelectAgent={onSelectAgent}
                    isStageMode={true}
                    className="w-full max-w-[620px] shadow-2xl"
                  />
                </div>
              )}

              {/* Tactical Drone Overlay (Wireframe Topographical Map & Real-Time OpenMausBot GPS) */}
              {showDroneOverlay && (
                <TacticalDroneOverlay
                  defaultCorner="bottom-right"
                  pulseLatencySec={pulseDurationSec}
                  onTargetSet={() => {
                    handleAction('OPTIMIZE PATH');
                  }}
                />
              )}

            </div>

          </section>

        </div>

        {/* ------------------------------------------------------- */}
        {/* RIGHT COLUMN: INSIGHTS, TOP INTENTS, SYSTEM HEALTH (3C) */}
        {/* ------------------------------------------------------- */}
        <div className={`${isStageExpanded ? 'col-span-12 lg:col-span-6' : 'lg:col-span-3'} flex flex-col gap-3 transition-all duration-300`}>
          
          {/* Section: Real-Time Insights SVG Area Chart */}
          <section className="panel-tactical p-3.5">
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex justify-between items-center mb-2">
              <span>REAL-TIME INSIGHTS</span>
              <span className="font-mono text-[11px] text-[#9a8878] font-normal tracking-normal">30 MIN</span>
            </h2>

            {/* SVG Area Chart */}
            <div className="w-full h-24 my-1">
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="w-full h-full">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff8a1f" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#ff8a1f" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {/* Area Fill */}
                <path 
                  d={`M0,100 L0,${100 - insightData[0]} ${insightData.map((v, i) => `L${(i * (300 / (insightData.length - 1))).toFixed(1)},${(100 - v).toFixed(1)}`).join(' ')} L300,100 Z`}
                  fill="url(#areaGrad)"
                />
                {/* Line Stroke */}
                <path 
                  d={`M0,${100 - insightData[0]} ${insightData.map((v, i) => `L${(i * (300 / (insightData.length - 1))).toFixed(1)},${(100 - v).toFixed(1)}`).join(' ')}`}
                  fill="none" 
                  stroke="#ff8a1f" 
                  strokeWidth="1.8" 
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* Micro Metrics Row */}
            <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#ff8a1f]/15 text-center font-condensed">
              <div>
                <div className="text-xl font-bold text-[#ffb259]">82%</div>
                <span className="text-[11px] text-[#9a8878] block">Engagement</span>
              </div>
              <div>
                <div className="text-xl font-bold text-[#ffb259]">91%</div>
                <span className="text-[11px] text-[#9a8878] block">Resolved</span>
              </div>
              <div>
                <div className="text-xl font-bold text-[#ffb259]">4.8</div>
                <span className="text-[11px] text-[#9a8878] block">Satisfaction</span>
              </div>
            </div>
          </section>

          {/* Section: Top Intents */}
          <section className="panel-tactical p-3.5">
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex justify-between items-center mb-2.5">
              <span>TOP INTENTS</span>
              <span className="font-mono text-[11px] text-[#9a8878] font-normal tracking-normal">VOLUME</span>
            </h2>

            <div className="space-y-2 text-xs">
              {intentDistribution.map((it, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center text-white font-medium mb-1">
                    <span className="truncate pr-2">{it.label}</span>
                    <b className="font-mono text-[#ffb259] font-normal">{it.pct}%</b>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#ff8a1f] to-[#ffb259] transition-all duration-700"
                      style={{ width: `${Math.min(100, it.pct * 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: 7x7 Heatmap / System Health Tabbed Panel */}
          <section className="panel-tactical p-3.5">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ff8a1f]/20">
              <div className="flex items-center gap-1 bg-[#090604] p-0.5 rounded border border-[#ff8a1f]/20 text-[10px] font-mono">
                <button
                  onClick={() => {
                    soundFx.playClick(1000);
                    setRightColumnTab('heatmap');
                  }}
                  className={`px-2 py-0.5 rounded uppercase font-semibold transition-colors flex items-center gap-1 ${
                    rightColumnTab === 'heatmap'
                      ? 'bg-[#ff8a1f] text-black font-bold shadow-sm'
                      : 'text-[#9a8878] hover:text-white'
                  }`}
                >
                  <Grid className="w-2.5 h-2.5" />
                  <span>7×7 HEATMAP</span>
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick(1000);
                    setRightColumnTab('health');
                  }}
                  className={`px-2 py-0.5 rounded uppercase font-semibold transition-colors flex items-center gap-1 ${
                    rightColumnTab === 'health'
                      ? 'bg-[#ff8a1f] text-black font-bold shadow-sm'
                      : 'text-[#9a8878] hover:text-white'
                  }`}
                >
                  <Activity className="w-2.5 h-2.5" />
                  <span>HEALTH (100%)</span>
                </button>
              </div>

              <button
                onClick={() => {
                  soundFx.playTriggerChime();
                  handleSetStageView('heatmap');
                }}
                className="text-[9px] font-mono text-[#ffb259] hover:text-white flex items-center gap-0.5"
                title="Expand 7x7 Heatmap to Intelligence Stage"
              >
                <span>STAGE</span>
                <Maximize2 className="w-2.5 h-2.5" />
              </button>
            </div>

            {rightColumnTab === 'heatmap' ? (
              <AgentClusterHeatmapD3
                agents={agents}
                onSelectAgent={onSelectAgent}
              />
            ) : (
              <div className="flex items-center gap-4 py-1">
                {/* Health Ring Gauge */}
                <div 
                  className="w-20 h-20 rounded-full relative shrink-0 flex items-center justify-center"
                  style={{
                    background: 'conic-gradient(#46e39a 0% 100%, rgba(255,255,255,0.07) 0%)'
                  }}
                >
                  <div className="absolute inset-2 bg-[#120c08] rounded-full flex items-center justify-center">
                    <i className="not-italic font-condensed font-bold text-lg text-white">100%</i>
                  </div>
                </div>

                {/* Health Checklist */}
                <ul className="text-xs text-[#9a8878] space-y-1 font-barlow">
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#46e39a]">✓</span>
                    <span className="text-white">AI engine</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#46e39a]">✓</span>
                    <span className="text-white">Voice channels</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#46e39a]">✓</span>
                    <span className="text-white">Integrations</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#46e39a]">✓</span>
                    <span className="text-white">Security firewall</span>
                  </li>
                </ul>
              </div>
            )}
          </section>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM CHASSIS: LIVE ACTIVITY & COMMANDS DECK          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left: Live Activity Streaming Log (7 cols) */}
        <section className="lg:col-span-7 panel-tactical p-3.5 flex flex-col h-56">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ff8a1f]/20 shrink-0">
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase flex items-center gap-2">
              <span>LIVE ACTIVITY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff8a1f] animate-ping" />
              <span className="font-mono text-[10px] text-[#9a8878] font-normal tracking-normal">
                STREAMING ({filteredStreamLogs.length}{channelFilter ? ` · ${channelFilter}` : ''})
              </span>
            </h2>

            <div className="flex items-center gap-2 text-xs font-mono">
              {channelFilter && (
                <button
                  onClick={() => setChannelFilter(null)}
                  className="px-1.5 py-0.5 rounded bg-[#ff8a1f]/20 border border-[#ff8a1f]/40 text-[#ffb259] text-[9px] hover:text-white"
                  title="Clear channel filter"
                >
                  FILTER: {channelFilter} ×
                </button>
              )}
              <button
                onClick={() => setIsLogPaused(!isLogPaused)}
                className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 text-[10px] flex items-center gap-1"
              >
                {isLogPaused ? <Play className="w-3 h-3 text-[#46e39a]" /> : <Pause className="w-3 h-3 text-[#ffb259]" />}
                <span>{isLogPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>
              <button
                onClick={onClearLogs}
                className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white text-[10px]"
              >
                CLEAR
              </button>
            </div>
          </div>

          <div 
            ref={logScrollRef}
            className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed pr-1 select-text"
          >
            {filteredStreamLogs.length === 0 ? (
              <div className="text-neutral-500 py-6 text-center italic">
                {channelFilter 
                  ? `No events matching channel "${channelFilter}". Click other channels or clear filter.`
                  : 'Awaiting incoming channel events and multi-agent reasoning traces...'}
              </div>
            ) : (
              filteredStreamLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <b className="text-[#ffb259] shrink-0 font-medium">{log.timestamp}</b>
                  {log.agentName && (
                    <span className="text-[#5b8cff] shrink-0 font-semibold">[{log.agentName}]</span>
                  )}
                  <span className={`${
                    log.type === 'cmd' ? 'text-cyan-300 font-bold' :
                    log.type === 'error' ? 'text-[#ff5d6c]' :
                    log.type === 'success' || log.type === 'consensus' ? 'text-[#46e39a]' :
                    'text-[#f3e9df]'
                  }`}>
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right: Commands Action Deck & Input Form (5 cols) */}
        <section className="lg:col-span-5 panel-tactical p-3.5 flex flex-col justify-between h-56">
          <div>
            <h2 className="text-sm font-semibold font-condensed tracking-widest text-[#ffb259] uppercase mb-2">
              COMMANDS & OPERATIONAL TRIGGERS
            </h2>

            {/* Quick Trigger Action Buttons */}
            <div className="grid grid-cols-5 gap-1.5 mb-2 font-condensed">
              {(['SCAN', 'OPTIMIZE', 'PROTECT', 'RESTORE', 'EVOLVE'] as QuickTriggerAction[]).map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleAction(cmd)}
                  disabled={executingAction !== null}
                  className={`py-1.5 px-1 rounded text-xs font-semibold tracking-wider transition-all border ${
                    executingAction === cmd 
                      ? 'bg-[#ff8a1f] text-[#120802] border-[#ff8a1f] shadow-[0_0_10px_rgba(255,138,31,0.6)]' 
                      : 'bg-[#ff8a1f]/10 hover:bg-[#ff8a1f]/20 border-[#ff8a1f]/30 text-white hover:border-[#ff8a1f]'
                  }`}
                >
                  {cmd}
                </button>
              ))}
            </div>

            {/* Secondary Action Row */}
            <div className="grid grid-cols-3 gap-1.5 mb-2 font-condensed text-[11px]">
              <button
                onClick={() => handleAction('DEPLOY AGENTS')}
                disabled={executingAction !== null}
                className="py-1 px-2 rounded bg-black/40 hover:bg-[#ff8a1f]/15 border border-[#ff8a1f]/20 hover:border-[#ff8a1f]/40 text-[#f3e9df] flex items-center justify-center gap-1"
              >
                <Zap className="w-3 h-3 text-[#ff8a1f]" />
                <span>DEPLOY AGENTS</span>
              </button>
              <button
                onClick={() => handleAction('RUN WORKFLOW')}
                disabled={executingAction !== null}
                className="py-1 px-2 rounded bg-black/40 hover:bg-[#ff8a1f]/15 border border-[#ff8a1f]/20 hover:border-[#ff8a1f]/40 text-[#f3e9df] flex items-center justify-center gap-1"
              >
                <Play className="w-3 h-3 text-[#ff8a1f]" />
                <span>RUN WORKFLOW</span>
              </button>
              <button
                onClick={() => handleAction('SYNC VAULT')}
                disabled={executingAction !== null}
                className="py-1 px-2 rounded bg-black/40 hover:bg-[#ff8a1f]/15 border border-[#ff8a1f]/20 hover:border-[#ff8a1f]/40 text-[#f3e9df] flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-[#ff8a1f]" />
                <span>SYNC VAULT</span>
              </button>
            </div>
          </div>

          {/* Interactive Command Form */}
          <form onSubmit={handleCommandSubmit} className="flex gap-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Type a command or natural query..."
              className="flex-1 min-w-0 bg-[#0c0806] border border-[#ff8a1f]/35 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-[#9a8878] focus:outline-none focus:border-[#ff8a1f] focus:ring-1 focus:ring-[#ff8a1f]"
            />
            <button
              type="submit"
              disabled={!commandInput.trim() || executingAction !== null}
              className="px-4 py-2 bg-[#ff8a1f] hover:bg-[#ffb259] disabled:opacity-50 text-[#1a0d02] font-condensed font-bold text-xs tracking-wider rounded-lg transition-colors shrink-0 shadow-sm"
            >
              SEND
            </button>
          </form>
        </section>

      </div>

      {/* ========================================================= */}
      {/* 5. COGNITIVE BLUEPRINT HUD DRAWER MODAL                   */}
      {/* ========================================================= */}
      <CognitiveBlueprintHUD
        isOpen={blueprintOpen}
        onClose={() => setBlueprintOpen(false)}
        thoughtLatencyMs={effectiveLatencyMs}
      />

      {/* ========================================================= */}
      {/* 6. PIPELINE BOTTLENECK VISUAL ALERT OVERLAY (> 0.8s)       */}
      {/* ========================================================= */}
      <PipelineBottleneckAlertOverlay
        thoughtLatencyMs={effectiveLatencyMs}
        thresholdSeconds={0.8}
        onOptimize={() => handleAction('OPTIMIZE')}
        onFlush={() => handleAction('SYNC VAULT')}
        onOverrideLatency={(val) => setLatencyOverride(val)}
        activeOverride={latencyOverride}
        onClearOverride={() => setLatencyOverride(null)}
      />

    </div>
  );
};
