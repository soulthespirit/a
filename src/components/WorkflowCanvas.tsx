import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  Zap, 
  Edit3, 
  Bot, 
  Cpu, 
  Database, 
  CheckCircle2, 
  GitBranch, 
  ArrowRight, 
  Sliders, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Terminal,
  ShieldCheck,
  Share2,
  Play,
  Pause,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  Filter,
  Eye,
  RefreshCw,
  Brain,
  X,
  Compass,
  Check,
  Radio,
  FileCode,
  LayoutGrid,
  Columns,
  GripVertical,
  Move
} from 'lucide-react';
import { AgentInfo, AgentId, QuickTriggerAction } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';
import { PipelineEfficiencyChart } from './PipelineEfficiencyChart';

const ITEM_TYPE_NODE = 'WORKFLOW_NODE';

export interface WorkflowExecutionLogEntry {
  id: string;
  timestamp: string;
  deltaMs: number;
  sourceNodeId?: string;
  sourceNodeTitle?: string;
  targetNodeId?: string;
  targetNodeTitle?: string;
  status: 'PENDING' | 'DISPATCHED' | 'PROCESSING' | 'TRANSITIONED' | 'COMPLETED' | 'NOMINAL';
  phaseCategory: 'trigger' | 'prompt' | 'agent' | 'parser' | 'recall' | 'bundle' | 'success';
  message: string;
  payloadBadge?: string;
  modelBadge?: string;
  latencyMs?: number;
}

export interface WorkflowNode {
  id: string;
  stageIndex: number;
  title: string;
  category: 'trigger' | 'prompt' | 'agent' | 'parser' | 'recall' | 'bundle' | 'success';
  subtitle?: string;
  icon: 'zap' | 'edit' | 'bot' | 'database' | 'code' | 'bundle' | 'check';
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'nominal' | 'active' | 'executing' | 'success';
  modelTag?: string;
  agentId?: AgentId;
  payloadSchema?: string;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  label?: string;
  color?: string;
}

export interface WorkflowStageMeta {
  index: number;
  number: string;
  title: string;
  subtitle: string;
  color: string;
  accentBg: string;
  x: number;
  width: number;
}

export const WORKFLOW_STAGES: WorkflowStageMeta[] = [
  {
    index: 0,
    number: '01',
    title: 'Ingestion & Trigger',
    subtitle: 'Event bus & API gateway webhook',
    color: '#ff8a1f',
    accentBg: 'rgba(255, 138, 31, 0.08)',
    x: 50,
    width: 250
  },
  {
    index: 1,
    number: '02',
    title: 'Intent & Prompt Matrix',
    subtitle: 'Context synthesis & multi-agent routing',
    color: '#00F0FF',
    accentBg: 'rgba(0, 240, 255, 0.08)',
    x: 350,
    width: 250
  },
  {
    index: 2,
    number: '03',
    title: '4-Agent Swarm Core',
    subtitle: 'Parallel executive & specialist synthesis',
    color: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.08)',
    x: 650,
    width: 260
  },
  {
    index: 3,
    number: '04',
    title: 'Parsers & Karpathy Recall',
    subtitle: 'JSON schema validation & RAG cosine index',
    color: '#38bdf8',
    accentBg: 'rgba(56, 189, 248, 0.08)',
    x: 960,
    width: 260
  },
  {
    index: 4,
    number: '05',
    title: 'Consensus & Release',
    subtitle: 'Atomic verification & zero founder fatigue',
    color: '#10B981',
    accentBg: 'rgba(16, 185, 129, 0.08)',
    x: 1270,
    width: 260
  }
];

export const NODE_AGENT_THOUGHTS: Record<string, { thought: string; focus: string; schema?: string }> = {
  'node-trigger': {
    thought: 'Monitoring webhook dispatch event bus and synchronizing swarm clock frequency.',
    focus: 'Pipeline Dispatch & Triggers',
    schema: 'payload.event.raw { action: string, origin: "om7_cli" }'
  },
  'node-prompt': {
    thought: 'Decomposing directives into structured context vectors and multi-agent task matrices.',
    focus: 'Prompt Engineering & Intent Matrix',
    schema: 'prompt_v2.json { tokens: 8192, temperature: 0.2 }'
  },
  'node-agent-ceo': {
    thought: 'Evaluating multi-agent consensus thresholds, verifying milestone convergence, and orchestrating execution mandates.',
    focus: 'Executive Orchestration & Consensus',
    schema: 'agent_directives.json { mandate: "strategic_roadmap" }'
  },
  'node-agent-architect': {
    thought: 'Traversing the 1536-D Karpathy Vault latent manifold, auditing graph connectivity, and enforcing C4 boundary contracts.',
    focus: 'C4 Architecture & Latent Manifold',
    schema: 'c4_boundary_spec.json { nodes: 14, edges: 28 }'
  },
  'node-agent-dev': {
    thought: 'Compiling reactive full-stack AST modules, performing inline optimizations, and asserting zero dead code paths.',
    focus: 'TypeScript & AST Code Generation',
    schema: 'ast_bundle.ts { modules: 6, zero_dead_code: true }'
  },
  'node-agent-qa': {
    thought: 'Executing sandboxed regression assertions, checking security boundaries, and verifying zero memory leak invariants.',
    focus: 'Security Sandbox & Boundary Guard',
    schema: 'sandbox_assert.json { exit_code: 0, leaks: 0 }'
  },
  'node-parse-1': {
    thought: 'Validating structured JSON schema conformance, sanitizing payload types, and rejecting malformed token sequences.',
    focus: 'JSON Schema & Structured Parser',
    schema: 'schema_validator.ts { strict_types: true }'
  },
  'node-recall-rag': {
    thought: 'Performing high-speed cosine similarity retrieval across wiki/ and raw/ vector chunks in sub-millisecond latency.',
    focus: 'Karpathy Vault Cosine RAG Recall',
    schema: 'cosine_vector_stream { top_k: 14, threshold: 0.94 }'
  },
  'node-processor-1': {
    thought: 'Normalizing executive telemetry vectors, synchronizing color palettes, and formatting responsive UI data.',
    focus: 'Executive Telemetry Synthesizer',
    schema: 'normalized_telemetry.json { fps: 60, sync: 1.0 }'
  },
  'node-parse-qa': {
    thought: 'Verifying process isolation in sandbox container, checking memory limits, and guaranteeing Exit Code 0.',
    focus: 'Container Sandbox & Exit Code 0',
    schema: 'exit_code_verify.sh { isol_status: "sealed" }'
  },
  'node-bundle': {
    thought: 'Aggregating parallel agent outputs into unified atomic release manifest and preparing final validation checkpoint.',
    focus: 'Multi-Agent Consensus Bundling',
    schema: 'release_manifest.sha256 { atomic_lock: true }'
  },
  'node-success': {
    thought: 'Confirming flawless pipeline execution with 100% test pass rate, verified state commutations, and zero founder fatigue.',
    focus: 'Execution Accomplishment & Telemetry',
    schema: 'pipeline_status { code: 200, status: "NOMINAL" }'
  }
};

const INITIAL_RAW_NODES: Omit<WorkflowNode, 'x' | 'y'>[] = [
  // Stage 0: Ingestion & Trigger
  {
    id: 'node-trigger',
    stageIndex: 0,
    title: 'Executes Workflow',
    category: 'trigger',
    subtitle: 'Webhook Dispatch Bus',
    icon: 'zap',
    agentId: 'ceo',
    width: 230,
    height: 94,
    status: 'nominal',
    payloadSchema: 'input.raw_event'
  },
  // Stage 1: Intent & Prompt Matrix
  {
    id: 'node-prompt',
    stageIndex: 1,
    title: 'Create User Prompt',
    category: 'prompt',
    subtitle: 'Trigger Vector Engine',
    icon: 'edit',
    agentId: 'pm',
    width: 230,
    height: 94,
    status: 'nominal',
    modelTag: 'Gemini 3.8 Flash',
    payloadSchema: 'prompt_v2.json'
  },
  // Stage 2: 4-Agent Swarm Core
  {
    id: 'node-agent-ceo',
    stageIndex: 2,
    title: 'CEO Genesis Core',
    category: 'agent',
    subtitle: 'Enterprise Orchestration',
    modelTag: 'Gemini 3.8 Flash',
    agentId: 'ceo',
    icon: 'bot',
    width: 235,
    height: 96,
    status: 'nominal',
    payloadSchema: 'mandates.proto'
  },
  {
    id: 'node-agent-architect',
    stageIndex: 2,
    title: 'System Architect',
    category: 'agent',
    subtitle: 'C4 & Karpathy Vault',
    modelTag: 'Gemini 3.8 Flash',
    agentId: 'architect',
    icon: 'bot',
    width: 235,
    height: 96,
    status: 'nominal',
    payloadSchema: 'c4_boundary.json'
  },
  {
    id: 'node-agent-dev',
    stageIndex: 2,
    title: 'Senior Dev Full-Stack',
    category: 'agent',
    subtitle: 'Zero Dead Code',
    modelTag: 'Gemini 3.8 Flash',
    agentId: 'dev',
    icon: 'bot',
    width: 235,
    height: 96,
    status: 'nominal',
    payloadSchema: 'ast_bundle.ts'
  },
  {
    id: 'node-agent-qa',
    stageIndex: 2,
    title: 'QA Auditor Guard',
    category: 'agent',
    subtitle: 'Safe Boundary Guard',
    modelTag: 'Drive C: Guard',
    agentId: 'qa',
    icon: 'bot',
    width: 235,
    height: 96,
    status: 'nominal',
    payloadSchema: 'sandbox_test.json'
  },
  // Stage 3: Parsers & Karpathy Recall
  {
    id: 'node-parse-1',
    stageIndex: 3,
    title: 'Structured Output Parsed',
    category: 'parser',
    subtitle: 'JSON Schema Validation',
    icon: 'code',
    agentId: 'ba',
    width: 235,
    height: 94,
    status: 'nominal',
    payloadSchema: 'json_schema_v2'
  },
  {
    id: 'node-recall-rag',
    stageIndex: 3,
    title: 'Karpathy RAG Recall',
    category: 'recall',
    subtitle: 'wiki/ & raw/ Cosine Index',
    icon: 'database',
    agentId: 'architect',
    width: 235,
    height: 94,
    status: 'nominal',
    payloadSchema: '14 vectors (0.94 sim)'
  },
  {
    id: 'node-processor-1',
    stageIndex: 3,
    title: 'Executive Synthesizer',
    category: 'parser',
    subtitle: 'Vector Normalizer',
    icon: 'code',
    agentId: 'designer',
    width: 235,
    height: 94,
    status: 'nominal',
    payloadSchema: 'normalized_ui.json'
  },
  {
    id: 'node-parse-qa',
    stageIndex: 3,
    title: 'Sandbox Boundary Guard',
    category: 'parser',
    subtitle: 'Exit Code 0 Verification',
    icon: 'code',
    agentId: 'qa',
    width: 235,
    height: 94,
    status: 'nominal',
    payloadSchema: 'exit_code: 0'
  },
  // Stage 4: Consensus & Release
  {
    id: 'node-bundle',
    stageIndex: 4,
    title: 'Bundle Processed Data',
    category: 'bundle',
    subtitle: 'Multi-Agent Consensus',
    icon: 'bundle',
    agentId: 'pm',
    width: 235,
    height: 96,
    status: 'nominal',
    payloadSchema: 'release.sha256'
  },
  {
    id: 'node-success',
    stageIndex: 4,
    title: 'Success Status Generated',
    category: 'success',
    subtitle: 'Zero Founder Fatigue',
    icon: 'check',
    agentId: 'ceo',
    width: 235,
    height: 96,
    status: 'success',
    payloadSchema: '200 OK • COMPLETE'
  }
];

// Helper to compute neat, non-overlapping coordinates based on dynamic stageIndex
function computeStageCoordinates(nodeList: Omit<WorkflowNode, 'x' | 'y'>[]): WorkflowNode[] {
  const result: WorkflowNode[] = [];
  
  WORKFLOW_STAGES.forEach((stage) => {
    const stageNodes = nodeList.filter(n => n.stageIndex === stage.index);
    const count = stageNodes.length;
    
    stageNodes.forEach((node, idx) => {
      let y = 220;
      if (count === 1) {
        y = 215;
      } else if (count === 2) {
        y = 150 + idx * 140;
      } else if (count === 3) {
        y = 90 + idx * 130;
      } else if (count === 4) {
        y = 50 + idx * 125;
      } else {
        const spacing = Math.min(125, Math.max(90, 430 / count));
        const startY = Math.max(45, (525 - count * spacing) / 2);
        y = startY + idx * spacing;
      }

      const x = stage.x + Math.max(10, Math.round((stage.width - node.width) / 2));
      result.push({
        ...node,
        x,
        y
      });
    });
  });

  return result;
}

interface WorkflowCanvasProps {
  agents: AgentInfo[];
  executingAction: QuickTriggerAction | null;
  onSelectAgent: (id: AgentId) => void;
  onExecuteWorkflow: () => void;
  thoughtLatencyMs?: number;
}

// -----------------------------------------------------------------------------
// DRAGGABLE NODE CARD COMPONENT (React-DND)
// -----------------------------------------------------------------------------
interface DraggableNodeCardProps {
  node: WorkflowNode;
  assignedAgent: AgentInfo;
  isSelected: boolean;
  isNodeActive: boolean;
  isHovered: boolean;
  onSelectNode: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const DraggableNodeCard: React.FC<DraggableNodeCardProps> = ({
  node,
  assignedAgent,
  isSelected,
  isNodeActive,
  isHovered,
  onSelectNode,
  onMouseEnter,
  onMouseLeave
}) => {
  const isTrigger = node.category === 'trigger';
  const isSuccess = node.category === 'success';

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: ITEM_TYPE_NODE,
    item: { id: node.id, stageIndex: node.stageIndex, title: node.title },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [node.id, node.stageIndex, node.title]);

  return (
    <div
      ref={(el) => {
        if (el) dragRef(el);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectNode();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
        opacity: isDragging ? 0.35 : 1
      }}
      className={`workflow-interactive-card absolute pointer-events-auto rounded-xl p-3 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all duration-200 border ${
        isDragging
          ? 'ring-2 ring-amber-400 border-dashed border-amber-400 shadow-2xl scale-95'
          : isSelected
          ? 'bg-[#152338] border-[#00F0FF] shadow-[0_0_24px_rgba(0,240,255,0.45)] ring-1 ring-[#00F0FF]'
          : isNodeActive
          ? 'bg-[#18263D] border-[#00F0FF] shadow-[0_0_28px_rgba(0,240,255,0.6)] scale-[1.02]'
          : isHovered
          ? 'bg-[#121B2C] border-amber-400/60 shadow-[0_0_18px_rgba(245,158,11,0.25)] scale-[1.01]'
          : isTrigger
          ? 'bg-[#101724] border-amber-500/40 hover:border-amber-400'
          : isSuccess
          ? 'bg-[#0E1C1A] border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
          : 'bg-[#0D1522] border-white/[0.08] hover:border-white/20'
      }`}
    >
      {/* Top row: Drag grip, category icon, title, and assigned agent avatar */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="text-neutral-500 hover:text-amber-400 transition-colors cursor-grab -ml-0.5" title="Drag node to reorder between stage swimlanes">
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${assignedAgent?.accentColor || '#ff8a1f'}18`,
              borderColor: `${assignedAgent?.accentColor || '#ff8a1f'}40`
            }}
          >
            {node.icon === 'zap' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
            {node.icon === 'edit' && <Edit3 className="w-3.5 h-3.5 text-cyan-400" />}
            {node.icon === 'bot' && <Bot className="w-3.5 h-3.5" style={{ color: assignedAgent?.accentColor }} />}
            {node.icon === 'database' && <Database className="w-3.5 h-3.5 text-purple-400" />}
            {node.icon === 'code' && <Cpu className="w-3.5 h-3.5 text-sky-400" />}
            {node.icon === 'bundle' && <Layers className="w-3.5 h-3.5 text-amber-400" />}
            {node.icon === 'check' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          </div>

          <div className="min-w-0">
            <div className="font-medium text-xs text-slate-100 truncate">
              {node.title}
            </div>
            <div className="text-[10px] text-neutral-400 truncate">
              {node.subtitle}
            </div>
          </div>
        </div>

        {/* Agent Codename badge */}
        <span 
          className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase shrink-0"
          style={{
            color: assignedAgent?.accentColor || '#ff8a1f',
            backgroundColor: `${assignedAgent?.accentColor || '#ff8a1f'}15`,
            border: `1px solid ${assignedAgent?.accentColor || '#ff8a1f'}30`
          }}
        >
          {assignedAgent?.codename || 'OM-7'}
        </span>
      </div>

      {/* Bottom row: Payload schema / Model tag and latency */}
      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-white/[0.05] text-[10px] font-mono">
        <span className="text-neutral-400 truncate max-w-[125px]">
          {node.modelTag || node.payloadSchema || 'Nominal AST'}
        </span>
        <span className="text-amber-400 tabular-nums shrink-0">
          {isNodeActive ? 'RUNNING' : isSuccess ? 'EXIT 0' : 'READY'}
        </span>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// DROPPABLE STAGE SWIMLANE COLUMN (React-DND)
// -----------------------------------------------------------------------------
interface DroppableStageSwimlaneProps {
  stage: WorkflowStageMeta;
  onDropNode: (nodeId: string, targetStageIndex: number) => void;
  nodeCount: number;
}

const DroppableStageSwimlane: React.FC<DroppableStageSwimlaneProps> = ({
  stage,
  onDropNode,
  nodeCount
}) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
    accept: ITEM_TYPE_NODE,
    drop: (item: { id: string; stageIndex: number }) => {
      onDropNode(item.id, stage.index);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [stage.index, onDropNode]);

  const isActiveDrop = isOver && canDrop;

  return (
    <div
      ref={(el) => {
        if (el) dropRef(el);
      }}
      style={{
        left: `${stage.x}px`,
        top: '10px',
        width: `${stage.width}px`,
        height: '525px'
      }}
      className={`absolute rounded-2xl border transition-all duration-200 flex flex-col justify-between p-3.5 ${
        isActiveDrop
          ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.4)] z-20 pointer-events-auto'
          : canDrop
          ? 'bg-white/[0.03] border-dashed border-amber-400/50 pointer-events-auto'
          : 'bg-[#0A101C]/40 border-white/[0.04] pointer-events-none'
      }`}
    >
      {/* Stage Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] pointer-events-none">
        <div className="flex items-center gap-2">
          <span 
            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{ 
              color: stage.color, 
              backgroundColor: stage.accentBg 
            }}
          >
            {stage.number}
          </span>
          <span className="font-condensed font-bold text-sm tracking-wide text-slate-200 uppercase">
            {stage.title}
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-500">
          {nodeCount} {nodeCount === 1 ? 'NODE' : 'NODES'}
        </span>
      </div>

      {/* Middle Drop Prompt indicator when dragging over */}
      {isActiveDrop && (
        <div className="my-auto p-4 rounded-xl border border-dashed border-cyan-400 bg-cyan-900/30 flex flex-col items-center justify-center text-center animate-pulse pointer-events-none">
          <Move className="w-5 h-5 text-cyan-300 mb-1" />
          <span className="font-condensed font-bold text-xs tracking-wider text-cyan-200 uppercase">
            DROP TO REASSIGN
          </span>
          <span className="text-[10px] font-mono text-cyan-400">
            Stage {stage.number} • {stage.title}
          </span>
        </div>
      )}

      {/* Quiet Stage Subtitle Kicker at the bottom */}
      <div className="pt-2 border-t border-white/[0.04] text-[10px] font-mono text-neutral-500 truncate pointer-events-none">
        {stage.subtitle}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN WORKFLOW CANVAS INNER COMPONENT
// -----------------------------------------------------------------------------
const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({
  agents,
  executingAction,
  onSelectAgent,
  onExecuteWorkflow,
  thoughtLatencyMs = 680
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logListRef = useRef<HTMLDivElement | null>(null);

  // Raw nodes state to support dynamic drag-and-drop reordering between stages
  const [nodeList, setNodeList] = useState<Omit<WorkflowNode, 'x' | 'y'>[]>(INITIAL_RAW_NODES);

  // Compute neat stage coordinates whenever nodeList changes
  const nodes = useMemo(() => {
    return computeStageCoordinates(nodeList).map(n => ({
      ...n,
      status: executingAction ? ('executing' as const) : n.status
    }));
  }, [nodeList, executingAction]);

  // Dual view mode
  const [viewMode, setViewMode] = useState<'swimlane' | 'accordion'>('swimlane');

  // Pan & Zoom
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [zoom, setZoom] = useState(0.88);
  const isDraggingRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  // Node selection & detail inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Accordion expanded stages
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: false,
    4: false
  });

  // Secondary Tools drawers
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [isEfficiencyDrawerOpen, setIsEfficiencyDrawerOpen] = useState(false);
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [logFilter, setLogFilter] = useState<'ALL' | 'TRANSITIONS' | 'AGENTS' | 'SUCCESS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTransition, setActiveTransition] = useState<{ from: string; to: string } | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  // Real-time stage completion tracking (0 to 4)
  const [completedStages, setCompletedStages] = useState<number[]>([0, 1, 2, 3, 4]);

  const activeStageIndex = useMemo(() => {
    if (!activeNodeId) return null;
    const targetNode = nodes.find(n => n.id === activeNodeId);
    return targetNode ? targetNode.stageIndex : null;
  }, [activeNodeId, nodes]);

  // Execution Telemetry Log
  const [executionLogs, setExecutionLogs] = useState<WorkflowExecutionLogEntry[]>([
    {
      id: 'log-seed-1',
      timestamp: '14:20:01.104',
      deltaMs: 0,
      sourceNodeId: 'node-trigger',
      sourceNodeTitle: 'Executes Workflow',
      targetNodeId: 'node-prompt',
      targetNodeTitle: 'Create User Prompt',
      status: 'TRANSITIONED',
      phaseCategory: 'trigger',
      message: 'Workflow Trigger ingested: om7_cli input received on vector bus',
      payloadBadge: 'input.raw_event',
      modelBadge: 'OM-7 Event Gateway'
    },
    {
      id: 'log-seed-2',
      timestamp: '14:20:01.148',
      deltaMs: 44,
      sourceNodeId: 'node-prompt',
      sourceNodeTitle: 'Create User Prompt',
      targetNodeId: 'node-agent-ceo',
      targetNodeTitle: 'CEO Genesis Core',
      status: 'TRANSITIONED',
      phaseCategory: 'prompt',
      message: 'Synthesized context embeddings; fan-out to CEO & Specialist Squad',
      payloadBadge: '8k tokens',
      modelBadge: 'Gemini 3.8 Flash'
    },
    {
      id: 'log-seed-3',
      timestamp: '14:20:01.216',
      deltaMs: 68,
      sourceNodeId: 'node-agent-ceo',
      sourceNodeTitle: 'CEO Genesis Core',
      targetNodeId: 'node-parse-1',
      targetNodeTitle: 'Structured Output Parsed',
      status: 'TRANSITIONED',
      phaseCategory: 'agent',
      message: 'Strategic roadmap emitted; JSON schema validated with exit 0',
      payloadBadge: 'json_schema_v2',
      modelBadge: 'Gemini 3.8 Flash'
    },
    {
      id: 'log-seed-4',
      timestamp: '14:20:01.325',
      deltaMs: 109,
      sourceNodeId: 'node-recall-rag',
      sourceNodeTitle: 'Karpathy RAG Data Recall',
      targetNodeId: 'node-processor-1',
      targetNodeTitle: 'Executive Synthesizer',
      status: 'TRANSITIONED',
      phaseCategory: 'recall',
      message: 'Retrieved 14 wiki/ memory vectors with >0.94 cosine similarity',
      payloadBadge: '14 vectors',
      modelBadge: 'RAG Cosine Index'
    },
    {
      id: 'log-seed-5',
      timestamp: '14:20:01.442',
      deltaMs: 137,
      sourceNodeId: 'node-bundle',
      sourceNodeTitle: 'Bundle Processed Data',
      targetNodeId: 'node-success',
      targetNodeTitle: 'Success Status Generated',
      status: 'COMPLETED',
      phaseCategory: 'success',
      message: 'Workflow execution nominal: zero founder fatigue achieved',
      payloadBadge: 'STATUS: 200 OK',
      modelBadge: 'OM-7 Arc Core'
    }
  ]);

  // Format precise timestamp
  const formatPreciseTimestamp = (date: Date = new Date()) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  // ---------------------------------------------------------------------------
  // REACT-DND HANDLER: MOVE NODE TO TARGET STAGE
  // ---------------------------------------------------------------------------
  const handleMoveNodeToStage = useCallback((nodeId: string, targetStageIndex: number) => {
    setNodeList((prev) => {
      const targetNode = prev.find(n => n.id === nodeId);
      if (!targetNode || targetNode.stageIndex === targetStageIndex) return prev;

      const oldStageIndex = targetNode.stageIndex;
      const targetStageMeta = WORKFLOW_STAGES[targetStageIndex];

      soundFx.playActionConfirm();

      // Log event
      const logEntry: WorkflowExecutionLogEntry = {
        id: `dnd-${Date.now()}`,
        timestamp: formatPreciseTimestamp(new Date()),
        deltaMs: 0,
        sourceNodeId: nodeId,
        sourceNodeTitle: targetNode.title,
        status: 'TRANSITIONED',
        phaseCategory: 'trigger',
        message: `DND Reorder: Moved [${targetNode.title}] from Stage 0${oldStageIndex + 1} to Stage 0${targetStageIndex + 1} (${targetStageMeta.title})`,
        payloadBadge: `STAGE: 0${targetStageIndex + 1}`,
        modelBadge: 'Swarm Orchestrator'
      };
      setExecutionLogs(logs => [...logs, logEntry]);

      return prev.map(n => n.id === nodeId ? { ...n, stageIndex: targetStageIndex } : n);
    });
  }, []);

  // Reset to default stage layout
  const handleResetLayout = () => {
    soundFx.playClick(900);
    setNodeList(INITIAL_RAW_NODES);
    handleAutoFit();
  };

  // Connections
  const connections: WorkflowConnection[] = useMemo(() => [
    { from: 'node-trigger', to: 'node-prompt', color: '#ff8a1f' },
    { from: 'node-prompt', to: 'node-agent-ceo', color: '#00F0FF' },
    { from: 'node-prompt', to: 'node-agent-architect', color: '#00F0FF' },
    { from: 'node-prompt', to: 'node-agent-dev', color: '#00F0FF' },
    { from: 'node-prompt', to: 'node-agent-qa', color: '#00F0FF' },
    { from: 'node-agent-ceo', to: 'node-parse-1', color: '#ff8a1f' },
    { from: 'node-agent-architect', to: 'node-recall-rag', color: '#00F0FF' },
    { from: 'node-agent-dev', to: 'node-recall-rag', color: '#00F0FF' },
    { from: 'node-agent-dev', to: 'node-processor-1', color: '#a855f7' },
    { from: 'node-agent-qa', to: 'node-parse-qa', color: '#10B981' },
    { from: 'node-parse-1', to: 'node-bundle', color: '#ff8a1f' },
    { from: 'node-recall-rag', to: 'node-processor-1', color: '#00F0FF' },
    { from: 'node-processor-1', to: 'node-bundle', color: '#38bdf8' },
    { from: 'node-parse-qa', to: 'node-bundle', color: '#10B981' },
    { from: 'node-bundle', to: 'node-success', color: '#10B981' }
  ], []);

  // AUTO-FIT ENGINE
  const handleAutoFit = useCallback(() => {
    if (!containerRef.current) return;
    const cWidth = containerRef.current.clientWidth || 900;
    const cHeight = containerRef.current.clientHeight || 480;

    const pipelineWidth = 1540;
    const pipelineHeight = 540;

    const scaleX = (cWidth - 60) / pipelineWidth;
    const scaleY = (cHeight - 70) / pipelineHeight;
    const optimalZoom = Math.min(1.15, Math.max(0.42, Math.min(scaleX, scaleY)));

    const optimalPanX = Math.round((cWidth - pipelineWidth * optimalZoom) / 2);
    const optimalPanY = Math.round((cHeight - pipelineHeight * optimalZoom) / 2) + 10;

    setZoom(Number(optimalZoom.toFixed(2)));
    setPan({ x: Math.max(20, optimalPanX), y: Math.max(15, optimalPanY) });
    soundFx.playClick(1100);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoFit();
    }, 150);

    const handleResize = () => {
      handleAutoFit();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [handleAutoFit]);

  const focusNode = (nodeId?: string) => {
    if (!nodeId) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !containerRef.current) return;
    const cWidth = containerRef.current.clientWidth || 800;
    const cHeight = containerRef.current.clientHeight || 500;
    const targetX = cWidth / 2 - (node.x + node.width / 2) * zoom;
    const targetY = cHeight / 2 - (node.y + node.height / 2) * zoom;
    setPan({ x: targetX, y: targetY });
    setSelectedNodeId(nodeId);
    soundFx.playClick(1300);
  };

  // SIMULATION ENGINE
  const runWorkflowSimulation = (customTriggerName?: string) => {
    if (isSimulating) return;
    setIsSimulating(true);
    setCompletedStages([]);
    soundFx.playActionConfirm();

    const triggerLabel = customTriggerName || (executingAction ? executingAction.toUpperCase() : 'MANUAL TASK EXECUTION');
    const startTime = performance.now();

    const pipelineSteps = [
      {
        from: 'node-trigger',
        fromTitle: 'Executes Workflow',
        to: 'node-prompt',
        toTitle: 'Create User Prompt',
        status: 'DISPATCHED' as const,
        phase: 'trigger' as const,
        msg: `Dispatched [${triggerLabel}] input event into Prompt Engine`,
        badge: 'input.raw_event',
        model: 'OM-7 Event Gateway',
        delay: 150
      },
      {
        from: 'node-prompt',
        fromTitle: 'Create User Prompt',
        to: 'node-agent-ceo',
        toTitle: 'CEO Genesis Core',
        status: 'PROCESSING' as const,
        phase: 'prompt' as const,
        msg: `Synthesized vector prompt with 8k token context window`,
        badge: 'prompt_v2.json',
        model: 'Gemini 3.8 Flash',
        delay: 480
      },
      {
        from: 'node-prompt',
        fromTitle: 'Create User Prompt',
        to: 'node-agent-architect',
        toTitle: 'System Architect',
        status: 'PROCESSING' as const,
        phase: 'agent' as const,
        msg: `Dispatched parallel C4 architecture & Karpathy RAG query`,
        badge: 'c4_schema.json',
        model: 'Gemini 3.8 Flash',
        delay: 820
      },
      {
        from: 'node-agent-architect',
        fromTitle: 'System Architect',
        to: 'node-recall-rag',
        toTitle: 'Karpathy RAG Data Recall',
        status: 'TRANSITIONED' as const,
        phase: 'recall' as const,
        msg: `Memory recall active: querying wiki/ and raw/ vector vaults`,
        badge: 'rag.query_vector',
        model: 'Cosine Indexer',
        delay: 1180
      },
      {
        from: 'node-agent-ceo',
        fromTitle: 'CEO Genesis Core',
        to: 'node-parse-1',
        toTitle: 'Structured Output Parsed',
        status: 'TRANSITIONED' as const,
        phase: 'parser' as const,
        msg: `CEO emitted strategic directives; JSON structure verified`,
        badge: 'parse_ok: 100%',
        model: 'Schema Engine',
        delay: 1520
      },
      {
        from: 'node-recall-rag',
        fromTitle: 'Karpathy RAG Data Recall',
        to: 'node-processor-1',
        toTitle: 'Executive Synthesizer',
        status: 'TRANSITIONED' as const,
        phase: 'parser' as const,
        msg: `RAG memories (14 docs) merged with executive synthesis stream`,
        badge: 'context.merged',
        model: 'Vector Normalizer',
        delay: 1900
      },
      {
        from: 'node-processor-1',
        fromTitle: 'Executive Synthesizer',
        to: 'node-bundle',
        toTitle: 'Bundle Processed Data',
        status: 'TRANSITIONED' as const,
        phase: 'bundle' as const,
        msg: `Aggregating multi-agent deliverables into consensus bundle`,
        badge: 'bundle.sha256',
        model: 'Consensus Arbiter',
        delay: 2350
      },
      {
        from: 'node-bundle',
        fromTitle: 'Bundle Processed Data',
        to: 'node-success',
        toTitle: 'Success Status Generated',
        status: 'COMPLETED' as const,
        phase: 'success' as const,
        msg: `Workflow execution nominal: verified zero dead code`,
        badge: 'EXIT CODE 0',
        model: 'Bioluminescent Core',
        delay: 2800
      }
    ];

    pipelineSteps.forEach((step, index) => {
      setTimeout(() => {
        const currentElapsed = Math.round(performance.now() - startTime);
        setActiveTransition({ from: step.from, to: step.to });
        setActiveNodeId(step.to);

        // Update completed stages dynamically as steps progress
        const tgtNode = nodes.find(n => n.id === step.to);
        if (tgtNode) {
          setCompletedStages(prev => {
            const next = new Set(prev);
            for (let s = 0; s < tgtNode.stageIndex; s++) {
              next.add(s);
            }
            return Array.from(next);
          });
        }

        const newLogEntry: WorkflowExecutionLogEntry = {
          id: `exec-${Date.now()}-${index}`,
          timestamp: formatPreciseTimestamp(new Date()),
          deltaMs: currentElapsed,
          sourceNodeId: step.from,
          sourceNodeTitle: step.fromTitle,
          targetNodeId: step.to,
          targetNodeTitle: step.toTitle,
          status: step.status,
          phaseCategory: step.phase,
          message: step.msg,
          payloadBadge: step.badge,
          modelBadge: step.model,
          latencyMs: Math.round(25 + Math.random() * 45)
        };

        setExecutionLogs(prev => [...prev, newLogEntry]);
        soundFx.playDataChirp();

        if (index === pipelineSteps.length - 1) {
          setTimeout(() => {
            setActiveTransition(null);
            setActiveNodeId(null);
            setIsSimulating(false);
            setCompletedStages([0, 1, 2, 3, 4]);
            soundFx.playAlert();
          }, 700);
        }
      }, step.delay);
    });
  };

  useEffect(() => {
    if (executingAction) {
      runWorkflowSimulation(executingAction);
    }
  }, [executingAction]);

  useEffect(() => {
    if (isAutoScroll && logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight;
    }
  }, [executionLogs, isAutoScroll]);

  const filteredLogs = useMemo(() => {
    return executionLogs.filter(entry => {
      if (logFilter === 'TRANSITIONS' && entry.status !== 'TRANSITIONED' && entry.status !== 'DISPATCHED') return false;
      if (logFilter === 'AGENTS' && entry.phaseCategory !== 'agent') return false;
      if (logFilter === 'SUCCESS' && entry.status !== 'COMPLETED') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMsg = entry.message.toLowerCase().includes(q);
        const matchesSrc = entry.sourceNodeTitle?.toLowerCase().includes(q);
        const matchesTgt = entry.targetNodeTitle?.toLowerCase().includes(q);
        const matchesBadge = entry.payloadBadge?.toLowerCase().includes(q);
        if (!matchesMsg && !matchesSrc && !matchesTgt && !matchesBadge) return false;
      }
      return true;
    });
  }, [executionLogs, logFilter, searchQuery]);

  // CANVAS CONDUITS & PHOTONS
  useEffect(() => {
    if (viewMode !== 'swimlane') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particleOffset = 0;

    const render = () => {
      const width = canvas.width = canvas.parentElement?.clientWidth || 1200;
      const height = canvas.height = canvas.parentElement?.clientHeight || 600;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      const speed = executingAction || isSimulating ? 0.022 : 0.006;
      particleOffset = (particleOffset + speed) % 1;

      connections.forEach((conn) => {
        const fromNode = nodes.find(n => n.id === conn.from);
        const toNode = nodes.find(n => n.id === conn.to);
        if (!fromNode || !toNode) return;

        const isConnActive = activeTransition && 
          activeTransition.from === conn.from && 
          activeTransition.to === conn.to;

        const startX = fromNode.x + fromNode.width;
        const startY = fromNode.y + fromNode.height / 2;
        const endX = toNode.x;
        const endY = toNode.y + toNode.height / 2;

        const deltaX = Math.abs(endX - startX) * 0.45;
        const cp1x = startX + Math.max(35, deltaX);
        const cp1y = startY;
        const cp2x = endX - Math.max(35, deltaX);
        const cp2y = endY;

        ctx.strokeStyle = isConnActive ? 'rgba(0, 240, 255, 0.45)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isConnActive ? 2.5 : 1.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
        ctx.stroke();

        if (isConnActive) {
          ctx.strokeStyle = '#00F0FF';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 12;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        const pT = (particleOffset) % 1;
        const invT = 1 - pT;
        const px = Math.pow(invT, 3) * startX + 
                   3 * Math.pow(invT, 2) * pT * cp1x + 
                   3 * invT * Math.pow(pT, 2) * cp2x + 
                   Math.pow(pT, 3) * endX;
        const py = Math.pow(invT, 3) * startY + 
                   3 * Math.pow(invT, 2) * pT * cp1y + 
                   3 * invT * Math.pow(pT, 2) * cp2y + 
                   Math.pow(pT, 3) * endY;

        ctx.fillStyle = conn.color || '#ff8a1f';
        ctx.shadowColor = conn.color || '#ff8a1f';
        ctx.shadowBlur = isConnActive ? 14 : 7;
        ctx.beginPath();
        ctx.arc(px, py, isConnActive ? 3.8 : 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [pan, zoom, executingAction, isSimulating, activeTransition, nodes, connections, viewMode]);

  // DRAG BACKGROUND CANVAS
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.workflow-interactive-card')) return;
    isDraggingRef.current = true;
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(z => Math.max(0.4, Math.min(1.8, Number((z * zoomFactor).toFixed(2)))));
  };

  const toggleAccordionStage = (stageIdx: number) => {
    soundFx.playClick(1050);
    setExpandedStages(prev => ({
      ...prev,
      [stageIdx]: !prev[stageIdx]
    }));
  };

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const selectedAgent = useMemo(() => {
    if (!selectedNode?.agentId) return null;
    return agents.find(a => a.id === selectedNode.agentId) || null;
  }, [agents, selectedNode]);

  const selectedThoughtMeta = useMemo(() => {
    if (!selectedNode) return null;
    return NODE_AGENT_THOUGHTS[selectedNode.id] || {
      thought: `Executing runtime cycles for ${selectedNode.title}.`,
      focus: selectedNode.subtitle || selectedNode.title,
      schema: selectedNode.payloadSchema
    };
  }, [selectedNode]);

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full select-none overflow-hidden bg-[#060B11] text-[#E1E7EE]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(12, 20, 32, 0.7) 0%, rgba(6, 11, 17, 1) 100%),
          radial-gradient(circle, rgba(245, 158, 11, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 28px 28px'
      }}
    >
      {/* =======================================================================
          TOP MODERN CONTROL BAR: Clean, uncrowded HUD toolbar
      ======================================================================== */}
      <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between gap-3 pointer-events-none">
        {/* Left: View Mode Toggle & Primary Simulation Controls */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0A101D]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/[0.08] shadow-xl">
          {/* Segmented View Mode Switch: Swimlanes vs Accordion */}
          <div className="flex items-center gap-1 p-0.5 bg-black/40 rounded-lg border border-white/[0.05]">
            <button
              onClick={() => {
                soundFx.playClick(1100);
                setViewMode('swimlane');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-condensed font-semibold tracking-wider transition-all ${
                viewMode === 'swimlane'
                  ? 'bg-[#ff8a1f] text-[#0A101D] shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Columns className="w-3 h-3" />
              <span>SWIMLANES</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick(1050);
                setViewMode('accordion');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-condensed font-semibold tracking-wider transition-all ${
                viewMode === 'accordion'
                  ? 'bg-[#ff8a1f] text-[#0A101D] shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>5 SEQUENTIAL PHASES</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

          {/* Trigger Simulation Button */}
          <button
            onClick={() => runWorkflowSimulation()}
            disabled={isSimulating}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-condensed font-bold tracking-wider transition-all ${
              isSimulating
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : 'bg-[#ff8a1f] hover:bg-[#ffb259] text-[#120802] shadow-[0_0_14px_rgba(255,138,31,0.4)]'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isSimulating ? 'EXECUTING PIPELINE...' : 'RUN PIPELINE'}</span>
          </button>

          {/* Reset Layout to Default Button */}
          <button
            onClick={handleResetLayout}
            title="Reset dragged nodes back to default 5 stages"
            className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Camera Controls (Auto-fit & Zoom) & Slide-out Drawer Triggers */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#0A101D]/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/[0.08] shadow-xl text-xs">
          {viewMode === 'swimlane' && (
            <>
              {/* 1-Click Auto-Fit Viewport */}
              <button
                onClick={handleAutoFit}
                title="Auto-Fit all 5 stages to container"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.06] hover:bg-[#ff8a1f]/20 hover:text-[#ffb259] border border-white/[0.06] text-neutral-300 transition-colors font-condensed font-semibold tracking-wide"
              >
                <Compass className="w-3 h-3 text-[#ff8a1f]" />
                <span>AUTO-FIT</span>
              </button>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-black/30 px-1 py-0.5 rounded border border-white/[0.05]">
                <button
                  onClick={() => {
                    soundFx.playClick(900);
                    setZoom(z => Math.max(0.4, Number((z - 0.1).toFixed(2))));
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-neutral-300"
                >
                  -
                </button>
                <span className="font-mono text-[10px] text-amber-400 w-8 text-center tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => {
                    soundFx.playClick(1000);
                    setZoom(z => Math.min(1.6, Number((z + 0.1).toFixed(2))));
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-neutral-300"
                >
                  +
                </button>
              </div>

              <div className="w-[1px] h-4 bg-white/10 mx-0.5" />
            </>
          )}

          {/* Efficiency Drawer Trigger */}
          <button
            onClick={() => {
              soundFx.playClick(1050);
              setIsEfficiencyDrawerOpen(prev => !prev);
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-condensed font-semibold tracking-wider transition-colors ${
              isEfficiencyDrawerOpen
                ? 'bg-[#ff8a1f]/25 text-[#ffb259] border border-[#ff8a1f]/40'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Toggle Real-Time Pipeline Efficiency Line Chart Drawer"
          >
            <Activity className="w-3 h-3 text-[#ff8a1f]" />
            <span>EFFICIENCY</span>
          </button>

          {/* Execution Logs Drawer Trigger */}
          <button
            onClick={() => {
              soundFx.playClick(1000);
              setIsLogDrawerOpen(prev => !prev);
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-condensed font-semibold tracking-wider transition-colors ${
              isLogDrawerOpen
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Toggle Real-Time Execution Log Drawer"
          >
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>LOGS ({executionLogs.length})</span>
          </button>
        </div>
      </div>

      {/* =======================================================================
          VIEW MODE 1: SPACIOUS HORIZONTAL SWIMLANES CANVAS (WITH REACT-DND)
      ======================================================================== */}
      {viewMode === 'swimlane' && (
        <div className="absolute inset-0 w-full h-full">
          {/* HTML5 Canvas for Bezier Conduits & Photons */}
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full pointer-events-none z-0" 
          />

          {/* Pan & Zoom Transformed Container for Stage Swimlanes and Cards */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Droppable Stage Swimlanes Columns */}
            {WORKFLOW_STAGES.map((stage) => {
              const stageNodesCount = nodes.filter(n => n.stageIndex === stage.index).length;
              return (
                <DroppableStageSwimlane
                  key={stage.index}
                  stage={stage}
                  onDropNode={handleMoveNodeToStage}
                  nodeCount={stageNodesCount}
                />
              );
            })}

            {/* Draggable Workflow Interactive Node Cards */}
            {nodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isNodeActive = activeNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;

              const targetAgentId = node.agentId || 'ceo';
              const assignedAgent = agents.find(a => a.id === targetAgentId) || agents[0];

              return (
                <DraggableNodeCard
                  key={node.id}
                  node={node}
                  assignedAgent={assignedAgent}
                  isSelected={isSelected}
                  isNodeActive={isNodeActive}
                  isHovered={isHovered}
                  onSelectNode={() => {
                    soundFx.playClick(1200);
                    setSelectedNodeId(node.id);
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* =======================================================================
          VIEW MODE 2: FIVE EQUAL FULL-WIDTH SEQUENTIAL PHASE CARDS (NO COLLAPSE)
      ======================================================================== */}
      {viewMode === 'accordion' && (
        <div className="absolute inset-0 pt-16 pb-8 px-4 sm:px-6 overflow-y-auto z-10 scrollbar-thin scrollbar-thumb-neutral-800">
          <div className="w-full space-y-3 pb-16">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-1 border-b border-white/[0.08]">
              <div>
                <h2 className="text-lg font-bold font-condensed tracking-wide text-white uppercase flex items-center gap-2">
                  <span>SEQUENTIAL 5-PHASE PIPELINE ARCHITECTURE</span>
                  <span className="text-xs font-mono text-amber-400 font-normal">
                    5 EQUAL PHASES • {nodes.length} NODES
                  </span>
                </h2>
                <p className="text-xs text-neutral-400">
                  Full-width non-collapsing multi-agent pipeline with strict input/output contracts and real-time execution specs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ALL PHASES SYNCHRONIZED</span>
                </span>
              </div>
            </div>

            {/* CSS Grid: 5 equal full-width columns, consistent vertical alignment, items-stretch, NO COLLAPSING */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 w-full items-stretch">
              {WORKFLOW_STAGES.map((stage) => {
                const stageNodes = nodes.filter(n => n.stageIndex === stage.index);
                const isPhaseActive = isSimulating && activeStageIndex === stage.index;
                const isPhaseComplete = completedStages.includes(stage.index) && !isPhaseActive;

                return (
                  <div 
                    key={stage.index}
                    className={`rounded-xl border bg-[#0A101C]/90 overflow-hidden shadow-lg flex flex-col justify-between h-full transition-all duration-300 ${
                      isPhaseActive 
                        ? 'border-amber-400 shadow-[0_0_24px_rgba(255,138,31,0.35)] ring-1 ring-amber-400/50' 
                        : isPhaseComplete 
                        ? 'border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                        : 'border-white/[0.08]'
                    }`}
                  >
                    {/* Phase Header */}
                    <div className={`p-3.5 border-b border-white/[0.06] transition-colors ${
                      isPhaseActive ? 'bg-amber-950/25' : isPhaseComplete ? 'bg-emerald-950/20' : 'bg-black/30'
                    }`}>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span 
                          className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                          style={{ color: stage.color, backgroundColor: stage.accentBg }}
                        >
                          PHASE {stage.number}
                        </span>

                        {/* Real-time status visual indicator (glowing ring for Active, checkmark for Complete) */}
                        {isPhaseActive ? (
                          <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/60 px-2 py-0.5 rounded-full shadow-[0_0_14px_rgba(255,138,31,0.5)]">
                            <div className="relative flex items-center justify-center w-3.5 h-3.5">
                              <span className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-80" />
                              <span className="relative w-3.5 h-3.5 rounded-full bg-amber-400/30 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_8px_#ff8a1f]">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                              ACTIVE
                            </span>
                          </div>
                        ) : isPhaseComplete ? (
                          <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/50 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center text-emerald-300">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                              COMPLETE
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 rounded-full">
                            <div className="w-3.5 h-3.5 rounded-full border border-neutral-600 flex items-center justify-center text-[9px] font-mono text-neutral-500">
                              •
                            </div>
                            <span className="text-[10px] font-mono font-medium text-neutral-400 uppercase tracking-wider">
                              READY
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-condensed font-bold text-base text-white tracking-wide uppercase truncate">
                          {stage.title}
                        </h3>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                          {stageNodes.length} {stageNodes.length === 1 ? 'NODE' : 'NODES'}
                        </span>
                      </div>

                      <p className="text-[11px] text-neutral-400 font-barlow line-clamp-2 mt-0.5 leading-snug">
                        {stage.subtitle}
                      </p>
                    </div>

                    {/* Phase Nodes Body (Permanently open, no accordion collapse) */}
                    <div className="p-3 flex-1 flex flex-col gap-2.5 bg-black/10 overflow-y-auto">
                      {stageNodes.map((node) => {
                        const assignedAgent = agents.find(a => a.id === node.agentId) || agents[0];
                        const thoughtMeta = NODE_AGENT_THOUGHTS[node.id];
                        const isSelected = selectedNodeId === node.id;

                        return (
                          <div
                            key={node.id}
                            onClick={() => {
                              setSelectedNodeId(node.id);
                              soundFx.playClick(1200);
                            }}
                            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                              isSelected
                                ? 'bg-[#152338] border-cyan-400 shadow-[0_0_14px_rgba(0,240,255,0.3)]'
                                : 'bg-[#0E1522] border-white/[0.06] hover:border-amber-400/50 hover:bg-[#121C2E]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <div className="font-medium text-xs text-slate-100 truncate">
                                  {node.title}
                                </div>
                                <div className="text-[10px] text-neutral-400 truncate">
                                  {node.subtitle}
                                </div>
                              </div>

                              <span 
                                className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase shrink-0"
                                style={{
                                  color: assignedAgent.accentColor,
                                  backgroundColor: `${assignedAgent.accentColor}20`
                                }}
                              >
                                {assignedAgent.name.split(' ')[0]}
                              </span>
                            </div>

                            <p className="text-[11px] text-neutral-300 font-mono bg-black/40 p-1.5 rounded border border-white/[0.03] line-clamp-2 leading-relaxed">
                              {thoughtMeta?.thought || 'Active AST execution stream.'}
                            </p>

                            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/[0.04]">
                              <span className="truncate max-w-[120px] text-cyan-300">
                                {node.payloadSchema}
                              </span>
                              <span className="text-amber-400 shrink-0">
                                READY
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Phase Footer Contract */}
                    <div className="px-3.5 py-2 border-t border-white/[0.06] bg-black/40 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span className="text-neutral-500">LATENCY BUDGET</span>
                      <span className="text-amber-400 font-semibold tabular-nums">~28ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          RIGHT-HAND NODE INSPECTOR DRAWER
      ======================================================================== */}
      {selectedNode && (
        <div className="absolute top-16 right-4 bottom-14 z-30 w-84 sm:w-96 bg-[#090F1A]/95 backdrop-blur-xl border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col p-4 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/[0.08]">
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                STAGE 0{selectedNode.stageIndex + 1} INSPECTOR
              </span>
              <h3 className="text-base font-bold text-white leading-tight mt-0.5">
                {selectedNode.title}
              </h3>
              <p className="text-xs text-neutral-400">
                {selectedNode.subtitle}
              </p>
            </div>

            <button
              onClick={() => setSelectedNodeId(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Assigned Agent Box */}
          {selectedAgent && (
            <div className="mt-3 p-3 rounded-xl border border-white/[0.08] bg-black/30 flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md font-bold text-sm"
                style={{
                  backgroundColor: `${selectedAgent.accentColor}25`,
                  borderColor: selectedAgent.accentColor,
                  color: selectedAgent.accentColor
                }}
              >
                {selectedAgent.codename}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-condensed font-bold text-white text-sm">
                    {selectedAgent.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    LOAD: {selectedAgent.loadPercent}%
                  </span>
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {selectedAgent.role}
                </div>
              </div>
            </div>
          )}

          {/* Reasoning / Execution Focus Stream */}
          <div className="mt-3 flex-1 flex flex-col min-h-0">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span>COGNITIVE DIRECTIVE & INTENT</span>
            </span>

            <div className="flex-1 overflow-y-auto p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-neutral-200 leading-relaxed space-y-2">
              <p className="text-amber-200/90">
                "{selectedThoughtMeta?.thought}"
              </p>

              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[10px] text-neutral-400 uppercase">Focus Domain:</div>
                <div className="text-cyan-300 font-semibold">{selectedThoughtMeta?.focus}</div>
              </div>

              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[10px] text-neutral-400 uppercase">Payload Contract:</div>
                <pre className="text-[10px] text-emerald-300 font-mono bg-black/50 p-2 rounded mt-1 overflow-x-auto">
                  {selectedThoughtMeta?.schema || selectedNode.payloadSchema || 'std::vector<payload>'}
                </pre>
              </div>

              {/* Quick stage move in inspector */}
              <div className="pt-2 border-t border-white/[0.06]">
                <div className="text-[10px] text-neutral-400 uppercase mb-1.5">Reassign Stage:</div>
                <div className="grid grid-cols-5 gap-1">
                  {WORKFLOW_STAGES.map((stg) => (
                    <button
                      key={stg.index}
                      onClick={() => handleMoveNodeToStage(selectedNode.id, stg.index)}
                      className={`py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                        selectedNode.stageIndex === stg.index
                          ? 'bg-amber-400 text-black'
                          : 'bg-white/[0.06] text-neutral-300 hover:bg-white/[0.12]'
                      }`}
                    >
                      {stg.number}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center gap-2">
            {selectedAgent && (
              <button
                onClick={() => {
                  onSelectAgent(selectedAgent.id);
                  soundFx.playNodeSelect();
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-condensed font-bold tracking-wider text-white border border-white/[0.08] transition-colors"
              >
                OPEN TELEMETRY
              </button>
            )}

            <button
              onClick={() => runWorkflowSimulation(selectedNode.title)}
              disabled={isSimulating}
              className="flex-1 py-1.5 px-3 rounded-lg bg-[#ff8a1f] hover:bg-[#ffb259] text-xs font-condensed font-bold tracking-wider text-[#120802] transition-colors shadow-md"
            >
              RUN FROM HERE
            </button>
          </div>
        </div>
      )}

      {/* =======================================================================
          SLIDE-OUT DRAWER 1: PIPELINE EFFICIENCY CHART
      ======================================================================== */}
      {isEfficiencyDrawerOpen && (
        <div className="absolute top-16 right-4 z-40 w-96 max-w-[calc(100vw-2rem)] bg-[#090F1A]/95 backdrop-blur-xl border border-[#ff8a1f]/30 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#ff8a1f]" />
              <span className="font-condensed font-bold text-sm text-white uppercase tracking-wider">
                REAL-TIME PIPELINE EFFICIENCY
              </span>
            </div>
            <button
              onClick={() => setIsEfficiencyDrawerOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <PipelineEfficiencyChart
            agents={agents}
            executingAction={executingAction}
            isSimulating={isSimulating}
            thoughtLatencyMs={thoughtLatencyMs}
          />
        </div>
      )}

      {/* =======================================================================
          SLIDE-OUT DRAWER 2: REAL-TIME EXECUTION LOG DRAWER
      ======================================================================== */}
      {isLogDrawerOpen && (
        <div 
          className={`absolute inset-x-4 bottom-2 z-40 bg-[#070D18]/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col transition-all duration-200 ${
            isLogExpanded ? 'h-[360px]' : 'h-[230px]'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.08] bg-black/30 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="font-condensed font-bold text-xs tracking-wider text-white uppercase">
                REAL-TIME WORKFLOW EXECUTION STREAM
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                {filteredLogs.length} EVENTS
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                {(['ALL', 'TRANSITIONS', 'AGENTS', 'SUCCESS'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      soundFx.playClick(1050);
                      setLogFilter(f);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      logFilter === f 
                        ? 'bg-[#ff8a1f] text-[#0B101D] font-bold' 
                        : 'text-neutral-400 hover:text-white bg-white/[0.04]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/[0.08] w-28 sm:w-36">
                <Search className="w-2.5 h-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter logs..."
                  className="w-full bg-transparent text-[10px] text-white focus:outline-none placeholder-neutral-500 font-mono"
                />
              </div>

              <button
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                title={`Auto-scroll: ${isAutoScroll ? 'ON' : 'OFF'}`}
                className={`p-1 rounded text-[10px] font-mono ${
                  isAutoScroll ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/30' : 'text-neutral-500 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setExecutionLogs([])}
                className="p-1 rounded text-neutral-400 hover:text-red-400"
                title="Clear Logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsLogExpanded(!isLogExpanded)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                {isLogExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsLogDrawerOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div 
            ref={logListRef}
            className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-neutral-700"
          >
            {filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500 text-xs font-mono">
                No execution events recorded. Trigger pipeline execution to stream live events.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isHighlight = activeTransition && 
                  activeTransition.from === log.sourceNodeId && 
                  activeTransition.to === log.targetNodeId;

                return (
                  <div
                    key={log.id}
                    onClick={() => focusNode(log.targetNodeId || log.sourceNodeId)}
                    title="Click to focus node on canvas"
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      isHighlight
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                        : 'bg-[#0B1321] hover:bg-[#101A2C] border-white/[0.04] hover:border-[#ff8a1f]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-semibold">[{log.timestamp}]</span>
                        <span className="text-neutral-500">+{log.deltaMs}ms</span>
                        <span className="text-cyan-300 font-semibold">{log.sourceNodeTitle} ➔ {log.targetNodeTitle}</span>
                      </div>
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                        log.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        log.status === 'TRANSITIONED' ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30' :
                        'bg-neutral-800 text-neutral-300'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-300 font-barlow mt-1">
                      <span>{log.message}</span>
                      {log.payloadBadge && (
                        <span className="text-cyan-400 font-mono text-[9px] bg-cyan-950/50 px-1 py-0.2 rounded">
                          {log.payloadBadge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          BOTTOM QUIET HUD STATUS STRIP
      ======================================================================== */}
      <div className="absolute bottom-2 left-4 z-20 flex items-center gap-3 text-[11px] font-mono text-neutral-400 bg-[#0A101D]/80 backdrop-blur-md px-3 py-1 rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200 font-semibold">PIPELINE NOMINAL</span>
        </div>
        <span className="text-neutral-600">|</span>
        <span className="text-cyan-300 font-medium">DRAG & DROP ACTIVE</span>
        <span className="text-neutral-600">|</span>
        <span className="text-amber-400">LATENCY: {thoughtLatencyMs}ms</span>
      </div>
    </div>
  );
};

// Top-level exported component wrapped with DndProvider
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <WorkflowCanvasInner {...props} />
    </DndProvider>
  );
};
