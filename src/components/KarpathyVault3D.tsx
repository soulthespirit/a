import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Brain,
  Search,
  Sparkles,
  Layers,
  Activity,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Play,
  Pause,
  Filter,
  Zap,
  Cpu,
  Database,
  Eye,
  Info,
  ChevronRight,
  RefreshCw,
  Terminal,
  Crosshair,
  Compass,
  Flame,
  Settings2,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';
import {
  renderVaultHeatmap,
  computeClusterDensities,
  getClusterTelemetry,
  HeatmapConfig,
  HeatmapMetric,
  HeatmapPalette
} from '../utils/vaultHeatmapRenderer';

// ---------------------------------------------------------------------------
// DATA DEFINITIONS & TYPES FOR KARPATHY VAULT
// ---------------------------------------------------------------------------

export type MemoryCategory = 'semantic' | 'episodic' | 'working' | 'tools' | 'latent_hub';

export interface VaultNode {
  id: string;
  label: string;
  category: MemoryCategory;
  chunkSnippet: string;
  vectorDim: number;
  tokens: number;
  baseWeight: number; // 0.0 - 1.0
  currentRecallWeight: number; // dynamic after query
  accessCount: number;
  embeddingPreview: number[];
  // 3D Simulation state
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  pinned?: boolean;
}

export interface VaultEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number; // 0.0 - 1.0 (cosine similarity or attention score)
  isActive: boolean;
  latencyMs: number;
}

// Color schemes matching the warm obsidian & cyber glow palette
export const CATEGORY_COLORS: Record<MemoryCategory, { hex: number; css: string; border: string; glow: string; label: string }> = {
  latent_hub: {
    hex: 0xffd700,
    css: '#ffd700',
    border: 'border-yellow-400',
    glow: 'rgba(255, 215, 0, 0.8)',
    label: 'Latent Centroid'
  },
  semantic: {
    hex: 0x00f3ff,
    css: '#00f3ff',
    border: 'border-cyan-400',
    glow: 'rgba(0, 243, 255, 0.8)',
    label: 'Semantic Knowledge'
  },
  episodic: {
    hex: 0xff8a1f,
    css: '#ff8a1f',
    border: 'border-amber-500',
    glow: 'rgba(255, 138, 31, 0.8)',
    label: 'Episodic Memory'
  },
  working: {
    hex: 0x46e39a,
    css: '#46e39a',
    border: 'border-emerald-400',
    glow: 'rgba(70, 227, 154, 0.8)',
    label: 'Working Context'
  },
  tools: {
    hex: 0xb55fe6,
    css: '#b55fe6',
    border: 'border-purple-400',
    glow: 'rgba(181, 95, 230, 0.8)',
    label: 'Tool Schemas'
  }
};

// Seed Nodes for Karpathy RAG Vault
export const INITIAL_NODES: VaultNode[] = [
  // Latent Hub
  {
    id: 'vault-centroid',
    label: 'Karpathy Vault Centroid',
    category: 'latent_hub',
    chunkSnippet: 'Root latent embedding space manifold (1536-D). Coordinates semantic recall paths across transformer attention heads and vector databases.',
    vectorDim: 1536,
    tokens: 420,
    baseWeight: 0.99,
    currentRecallWeight: 0.99,
    accessCount: 1420,
    embeddingPreview: [0.082, -0.145, 0.312, 0.048, -0.221, 0.518, -0.093, 0.174],
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 12,
    pinned: true
  },

  // Semantic Knowledge Nodes (Andrej Karpathy neural & LLM architecture core)
  {
    id: 'sem-transformer-attn',
    label: 'Multi-Head Attention (Q, K, V)',
    category: 'semantic',
    chunkSnippet: 'Attention is all you need: Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V. Captures pairwise token correlation in parallel heads.',
    vectorDim: 1536,
    tokens: 384,
    baseWeight: 0.94,
    currentRecallWeight: 0.94,
    accessCount: 984,
    embeddingPreview: [0.124, 0.281, -0.054, 0.412, -0.198, 0.334, -0.012, 0.165],
    x: -120,
    y: 60,
    z: 40,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 9
  },
  {
    id: 'sem-nanogpt-bpe',
    label: 'nanoGPT BPE Tokenizer',
    category: 'semantic',
    chunkSnippet: 'Byte Pair Encoding iteratively merges most frequent byte pairs. Compresses vocabulary into 50,257 dense token IDs with zero OOV.',
    vectorDim: 1536,
    tokens: 256,
    baseWeight: 0.88,
    currentRecallWeight: 0.88,
    accessCount: 652,
    embeddingPreview: [-0.045, 0.192, 0.318, -0.089, 0.245, -0.112, 0.405, 0.076],
    x: -160,
    y: -40,
    z: -30,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  },
  {
    id: 'sem-residual-stream',
    label: 'Residual Stream & LayerNorm',
    category: 'semantic',
    chunkSnippet: 'The central highway of the Transformer. Layers read from the residual stream and write back additive updates, preserving gradient fidelity.',
    vectorDim: 1536,
    tokens: 310,
    baseWeight: 0.91,
    currentRecallWeight: 0.91,
    accessCount: 820,
    embeddingPreview: [0.210, -0.114, 0.088, 0.354, -0.276, 0.189, 0.045, -0.134],
    x: -80,
    y: 110,
    z: -60,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  },
  {
    id: 'sem-kv-cache',
    label: 'Paged KV-Cache Attention',
    category: 'semantic',
    chunkSnippet: 'Key-Value caching eliminates quadratic re-computation during auto-regressive generation. Memory blocks are paged dynamically across GPU vRAM.',
    vectorDim: 1536,
    tokens: 340,
    baseWeight: 0.86,
    currentRecallWeight: 0.86,
    accessCount: 740,
    embeddingPreview: [-0.150, 0.340, 0.110, -0.042, 0.290, 0.180, -0.220, 0.095],
    x: -100,
    y: -90,
    z: 70,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  },
  {
    id: 'sem-cosine-index',
    label: 'Vector Cosine Embedding Index',
    category: 'semantic',
    chunkSnippet: 'Normalized inner-product space where distance = 1 - (A · B) / (||A|| ||B||). Enables nearest-neighbor RAG recall in sub-millisecond latencies.',
    vectorDim: 1536,
    tokens: 412,
    baseWeight: 0.96,
    currentRecallWeight: 0.96,
    accessCount: 1150,
    embeddingPreview: [0.380, 0.040, -0.120, 0.450, 0.020, 0.280, -0.190, 0.310],
    x: -40,
    y: -30,
    z: -120,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 9
  },
  {
    id: 'sem-mlp-ffn',
    label: 'Feed-Forward MLP Projection',
    category: 'semantic',
    chunkSnippet: 'Two-layer MLP with GeLU/SwiGLU activation acting as associative memory keys and values, storing factual epistemic associations.',
    vectorDim: 1536,
    tokens: 280,
    baseWeight: 0.79,
    currentRecallWeight: 0.79,
    accessCount: 512,
    embeddingPreview: [0.035, -0.210, 0.145, 0.260, -0.085, 0.340, 0.115, -0.090],
    x: -180,
    y: 30,
    z: 80,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 7
  },

  // Episodic Memory Nodes (Session history, past turns, interaction checkpoints)
  {
    id: 'epi-session-state',
    label: 'Episodic Session Checkpoint',
    category: 'episodic',
    chunkSnippet: 'Current session ID #0be4f92d: 7 active subagents, 5 pipeline stages verified, last user prompt requesting Karpathy Vault 3D integration.',
    vectorDim: 1536,
    tokens: 195,
    baseWeight: 0.92,
    currentRecallWeight: 0.92,
    accessCount: 460,
    embeddingPreview: [0.290, 0.180, -0.310, 0.090, 0.140, -0.080, 0.220, 0.170],
    x: 110,
    y: 70,
    z: 50,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  },
  {
    id: 'epi-user-intent',
    label: 'User Intent Classifier Vector',
    category: 'episodic',
    chunkSnippet: 'Classified intent: 3D Visualization & RAG Memory Inspection. Confidence: 0.984. Priority: Mission Critical. High fidelity UI required.',
    vectorDim: 1536,
    tokens: 160,
    baseWeight: 0.90,
    currentRecallWeight: 0.90,
    accessCount: 390,
    embeddingPreview: [0.180, 0.260, -0.140, 0.380, -0.050, 0.290, 0.110, -0.230],
    x: 130,
    y: -30,
    z: -40,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  },
  {
    id: 'epi-execution-trace',
    label: 'Workflow Execution Trace #482',
    category: 'episodic',
    chunkSnippet: 'Trigger: RUN WORKFLOW → Prompt Parser → Lead Scraper Agent (28ms) → Enrichment (42ms) → Audio Synthesizer chime confirm.',
    vectorDim: 1536,
    tokens: 240,
    baseWeight: 0.84,
    currentRecallWeight: 0.84,
    accessCount: 310,
    embeddingPreview: [-0.090, 0.150, 0.320, -0.180, 0.210, 0.040, -0.160, 0.280],
    x: 150,
    y: 40,
    z: -90,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 7
  },
  {
    id: 'epi-action-cache',
    label: 'Action Confirmation Ledger',
    category: 'episodic',
    chunkSnippet: 'Past verified tool approvals, security rule assertions, and state commutations recorded with cryptographic hashes.',
    vectorDim: 1536,
    tokens: 210,
    baseWeight: 0.76,
    currentRecallWeight: 0.76,
    accessCount: 220,
    embeddingPreview: [0.140, -0.080, 0.260, -0.110, 0.330, 0.190, -0.040, 0.070],
    x: 80,
    y: 120,
    z: -20,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 7
  },

  // Working Context Nodes (Dynamic prompt state, active scratchpad)
  {
    id: 'work-scratchpad',
    label: 'Active Prompt Scratchpad',
    category: 'working',
    chunkSnippet: 'Intermediate chain-of-thought scratchpad: Computing force-directed coordinates in R^3, updating Hooke spring tensions for active edges.',
    vectorDim: 1536,
    tokens: 320,
    baseWeight: 0.89,
    currentRecallWeight: 0.89,
    accessCount: 640,
    embeddingPreview: [0.050, 0.390, -0.120, 0.210, 0.160, -0.280, 0.070, 0.340],
    x: 20,
    y: -120,
    z: 50,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  },
  {
    id: 'work-system-prompt',
    label: 'System Directives & Constraints',
    category: 'working',
    chunkSnippet: 'Zero-pill discipline, warm obsidian aesthetics, real-time interactivity, full viewport integration, soundFx Web Audio synthesis.',
    vectorDim: 1536,
    tokens: 290,
    baseWeight: 0.95,
    currentRecallWeight: 0.95,
    accessCount: 1100,
    embeddingPreview: [0.310, -0.040, 0.180, 0.420, -0.150, 0.230, -0.090, 0.160],
    x: -30,
    y: 130,
    z: 70,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  },
  {
    id: 'work-dag-topology',
    label: 'Active Task DAG Topology',
    category: 'working',
    chunkSnippet: 'Graph dependency node states: Trigger (COMPLETED) → Agent Cluster (DISPATCHED) → Parser (READY) → Output Syncer (PENDING).',
    vectorDim: 1536,
    tokens: 220,
    baseWeight: 0.81,
    currentRecallWeight: 0.81,
    accessCount: 420,
    embeddingPreview: [-0.120, 0.230, 0.080, -0.240, 0.310, 0.170, -0.050, 0.190],
    x: 60,
    y: -90,
    z: -80,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 7
  },

  // Tool Schemas Nodes (API manifests, function calling signatures)
  {
    id: 'tool-workspace-oauth',
    label: 'Google Workspace OAuth Schema',
    category: 'tools',
    chunkSnippet: 'Function declaration: set_up_oauth(scopes, title). Client-side authorization scopes for Drive, Docs, Sheets, and Calendar APIs.',
    vectorDim: 1536,
    tokens: 360,
    baseWeight: 0.77,
    currentRecallWeight: 0.77,
    accessCount: 380,
    embeddingPreview: [-0.210, 0.140, 0.330, -0.070, 0.180, -0.290, 0.110, 0.040],
    x: 70,
    y: -60,
    z: 110,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 7
  },
  {
    id: 'tool-sound-synthesizer',
    label: 'WebAudio Procedural Synthesizer',
    category: 'tools',
    chunkSnippet: 'Procedural dual-oscillator FM chime generator: playTriggerChime(), playNodeSelect() 1420Hz, playDataChirp() telemetry sweep.',
    vectorDim: 1536,
    tokens: 230,
    baseWeight: 0.85,
    currentRecallWeight: 0.85,
    accessCount: 590,
    embeddingPreview: [0.170, -0.250, 0.090, 0.310, 0.140, -0.080, 0.260, -0.190],
    x: -70,
    y: -110,
    z: -70,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 7
  },
  {
    id: 'tool-gemini-client',
    label: '@google/genai Client Bridge',
    category: 'tools',
    chunkSnippet: 'Interface with Gemini 2.5 Flash SDK: streamGenerateContent, systemInstruction, tool declarations, token count telemetry.',
    vectorDim: 1536,
    tokens: 390,
    baseWeight: 0.93,
    currentRecallWeight: 0.93,
    accessCount: 1240,
    embeddingPreview: [0.240, 0.190, -0.060, 0.380, -0.110, 0.440, -0.210, 0.130],
    x: 100,
    y: 10,
    z: 100,
    vx: 0,
    vy: 0,
    vz: 0,
    radius: 8
  }
];

// Initial Edges with RAG Cosine Recall Weighting
const INITIAL_EDGES: VaultEdge[] = [
  // Centroid Radial Recall Paths
  { id: 'e-cen-trans', sourceId: 'vault-centroid', targetId: 'sem-transformer-attn', relation: 'COSINE_MATCH', weight: 0.94, isActive: true, latencyMs: 8.2 },
  { id: 'e-cen-cosine', sourceId: 'vault-centroid', targetId: 'sem-cosine-index', relation: 'DIRECT_INDEX', weight: 0.97, isActive: true, latencyMs: 4.1 },
  { id: 'e-cen-session', sourceId: 'vault-centroid', targetId: 'epi-session-state', relation: 'EPISODIC_GROUNDING', weight: 0.91, isActive: true, latencyMs: 6.5 },
  { id: 'e-cen-sys', sourceId: 'vault-centroid', targetId: 'work-system-prompt', relation: 'CONSTRAINT_ATTENTION', weight: 0.95, isActive: true, latencyMs: 5.4 },
  { id: 'e-cen-gemini', sourceId: 'vault-centroid', targetId: 'tool-gemini-client', relation: 'API_DISPATCH', weight: 0.93, isActive: true, latencyMs: 7.8 },

  // Semantic Cross-Connections
  { id: 'e-trans-res', sourceId: 'sem-transformer-attn', targetId: 'sem-residual-stream', relation: 'HIGHWAY_INJECTION', weight: 0.92, isActive: true, latencyMs: 5.1 },
  { id: 'e-trans-kv', sourceId: 'sem-transformer-attn', targetId: 'sem-kv-cache', relation: 'PAGED_ATTENTION', weight: 0.89, isActive: true, latencyMs: 6.2 },
  { id: 'e-trans-nano', sourceId: 'sem-transformer-attn', targetId: 'sem-nanogpt-bpe', relation: 'TOKEN_EMBEDDING', weight: 0.83, isActive: false, latencyMs: 9.4 },
  { id: 'e-res-mlp', sourceId: 'sem-residual-stream', targetId: 'sem-mlp-ffn', relation: 'FEED_FORWARD_PROJ', weight: 0.87, isActive: false, latencyMs: 8.6 },
  { id: 'e-cosine-nano', sourceId: 'sem-cosine-index', targetId: 'sem-nanogpt-bpe', relation: 'VOCAB_LOOKUP', weight: 0.78, isActive: false, latencyMs: 11.2 },

  // Episodic to Working Context Recall
  { id: 'e-sess-intent', sourceId: 'epi-session-state', targetId: 'epi-user-intent', relation: 'INTENT_ALIGNMENT', weight: 0.93, isActive: true, latencyMs: 4.9 },
  { id: 'e-intent-scratch', sourceId: 'epi-user-intent', targetId: 'work-scratchpad', relation: 'REASONING_SPARK', weight: 0.88, isActive: true, latencyMs: 7.1 },
  { id: 'e-sess-trace', sourceId: 'epi-session-state', targetId: 'epi-execution-trace', relation: 'DAG_LOGGING', weight: 0.82, isActive: false, latencyMs: 12.0 },
  { id: 'e-trace-dag', sourceId: 'epi-execution-trace', targetId: 'work-dag-topology', relation: 'STATE_TRANSITION', weight: 0.85, isActive: false, latencyMs: 9.8 },
  { id: 'e-sess-action', sourceId: 'epi-session-state', targetId: 'epi-action-cache', relation: 'HASH_VERIFICATION', weight: 0.75, isActive: false, latencyMs: 14.5 },

  // Working Context to Tool Schemas
  { id: 'e-scratch-gemini', sourceId: 'work-scratchpad', targetId: 'tool-gemini-client', relation: 'LLM_INFERENCE', weight: 0.91, isActive: true, latencyMs: 16.4 },
  { id: 'e-dag-sound', sourceId: 'work-dag-topology', targetId: 'tool-sound-synthesizer', relation: 'TELEMETRY_CHIME', weight: 0.79, isActive: false, latencyMs: 3.2 },
  { id: 'e-intent-oauth', sourceId: 'epi-user-intent', targetId: 'tool-workspace-oauth', relation: 'PERMISSION_SCOPE', weight: 0.76, isActive: false, latencyMs: 8.4 },
  { id: 'e-sys-gemini', sourceId: 'work-system-prompt', targetId: 'tool-gemini-client', relation: 'SYSTEM_INSTRUCTION', weight: 0.94, isActive: true, latencyMs: 5.8 },
  { id: 'e-kv-scratch', sourceId: 'sem-kv-cache', targetId: 'work-scratchpad', relation: 'CACHE_RECALL', weight: 0.84, isActive: true, latencyMs: 6.9 }
];

// Preset simulated queries for testing RAG recall
export const PRESET_QUERIES = [
  { label: 'Query Transformer Attention & KV-Cache', query: 'Attention QKV and KV-cache retrieval paths' },
  { label: 'Search Episodic Turn & Intent History', query: 'Session state, user intent vectors, and past turns' },
  { label: 'Inspect System Prompts & Working Memory', query: 'System directives and active scratchpad reasoning' },
  { label: 'Verify Tool Declarations & Synthesizer', query: 'Tool schema manifests, OAuth scopes, and WebAudio' },
  { label: 'Nearest-Neighbors Vector Cosine Manifold', query: 'Compute cosine distance across 1536-dimensional space' }
];

export interface KarpathyVault3DProps {
  onClose?: () => void;
  fullScreen?: boolean;
  initialSelectedNodeId?: string | null;
}

export const KarpathyVault3D: React.FC<KarpathyVault3DProps> = ({
  onClose,
  fullScreen = false,
  initialSelectedNodeId = null
}) => {
  // Container & Three.js Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const reqAnimRef = useRef<number | null>(null);

  // Mesh Mapping Refs for fast updates
  const nodeMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const haloMeshMap = useRef<Map<string, THREE.Mesh>>(new Map());
  const edgeLineMap = useRef<Map<string, THREE.Line>>(new Map());
  const photonParticlesRef = useRef<THREE.Points | null>(null);

  // Simulation Data State
  const [nodes, setNodes] = useState<VaultNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<VaultEdge[]>(INITIAL_EDGES);

  // Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId || 'vault-centroid');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [minWeightThreshold, setMinWeightThreshold] = useState<number>(0.70);
  const [isSimulatingPhysics, setIsSimulatingPhysics] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotateSpeed, setRotateSpeed] = useState<number>(0.8);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // Sync initialSelectedNodeId when it changes externally
  useEffect(() => {
    if (initialSelectedNodeId) {
      setSelectedNodeId(initialSelectedNodeId);
      const targetNode = nodes.find(n => n.id === initialSelectedNodeId);
      if (targetNode && cameraRef.current && controlsRef.current) {
        controlsRef.current.target.set(targetNode.x, targetNode.y, targetNode.z);
        cameraRef.current.position.set(targetNode.x + 80, targetNode.y + 60, targetNode.z + 160);
        controlsRef.current.update();
      }
    }
  }, [initialSelectedNodeId, nodes]);

  // 2D Intensity Heatmap Overlay State & Canvas Ref
  const heatmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [heatmapConfig, setHeatmapConfig] = useState<HeatmapConfig>({
    enabled: true,
    metric: 'composite',
    palette: 'thermal',
    gain: 0.85,
    radiusMultiplier: 1.0,
    showContours: true,
    showPeakLabels: true,
    blendMode: 'screen'
  });
  const heatmapConfigRef = useRef<HeatmapConfig>(heatmapConfig);
  heatmapConfigRef.current = heatmapConfig;

  const [showHeatmapSettings, setShowHeatmapSettings] = useState<boolean>(false);

  // Compute 3D cluster spatial densities & extract live telemetry
  const densityMap = useMemo(() => computeClusterDensities(nodes), [nodes]);
  const densityMapRef = useRef<Map<string, number>>(densityMap);
  densityMapRef.current = densityMap;

  const clusterTelemetry = useMemo(() => getClusterTelemetry(nodes, densityMap), [nodes, densityMap]);

  // RAG Query State
  const [queryInput, setQueryInput] = useState<string>('Attention QKV and KV-cache retrieval paths');
  const [isRecalling, setIsRecalling] = useState<boolean>(false);
  const [lastRecallTelemetry, setLastRecallTelemetry] = useState<{
    latencyMs: number;
    recalledCount: number;
    meanSimilarity: number;
    topNodeLabel: string;
  }>({
    latencyMs: 14.8,
    recalledCount: 8,
    meanSimilarity: 0.924,
    topNodeLabel: 'Multi-Head Attention (Q, K, V)'
  });

  // Selected Node Details memo
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  // Connected edges for the selected node
  const selectedNodeEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges.filter(e => e.sourceId === selectedNodeId || e.targetId === selectedNodeId);
  }, [edges, selectedNodeId]);

  // Active recall paths count
  const activeRecallCount = useMemo(() => {
    return edges.filter(e => e.isActive && e.weight >= minWeightThreshold).length;
  }, [edges, minWeightThreshold]);

  // Mean similarity across active recall paths
  const meanActiveWeight = useMemo(() => {
    const active = edges.filter(e => e.isActive);
    if (!active.length) return 0.85;
    const sum = active.reduce((acc, curr) => acc + curr.weight, 0);
    return Number((sum / active.length).toFixed(3));
  }, [edges]);

  // ---------------------------------------------------------------------------
  // FORCE-DIRECTED PHYSICS ENGINE (3D Euler Integration)
  // ---------------------------------------------------------------------------
  const stepPhysics = useCallback(() => {
    if (!isSimulatingPhysics) return;

    // Simulation parameters
    const kRepel = 2400; // Electrostatic repulsion constant
    const kSpring = 0.045; // Spring attraction constant
    const restLength = 110; // Default edge rest length
    const centerGravity = 0.003; // Pull toward center
    const damping = 0.88; // Velocity drag

    // 1. Repulsion between all node pairs (O(N^2))
    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dz = n2.z - n1.z;
        const distSq = dx * dx + dy * dy + dz * dz + 100; // softening factor
        const dist = Math.sqrt(distSq);

        const force = kRepel / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        if (!n1.pinned) {
          n1.vx -= fx;
          n1.vy -= fy;
          n1.vz -= fz;
        }
        if (!n2.pinned) {
          n2.vx += fx;
          n2.vy += fy;
          n2.vz += fz;
        }
      }
    }

    // 2. Spring attraction along edges (modulated by recall weight)
    const nodeMap = new Map<string, VaultNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const source = nodeMap.get(edge.sourceId);
      const target = nodeMap.get(edge.targetId);
      if (!source || !target) continue;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dz = target.z - source.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

      // Higher weight = tighter spring attraction (closer semantic proximity in latent space)
      const adjustedRestLength = restLength * (1.2 - edge.weight * 0.4);
      const displacement = dist - adjustedRestLength;
      const springStrength = kSpring * (0.8 + edge.weight * 0.5);

      const fx = (dx / dist) * displacement * springStrength;
      const fy = (dy / dist) * displacement * springStrength;
      const fz = (dz / dist) * displacement * springStrength;

      if (!source.pinned) {
        source.vx += fx;
        source.vy += fy;
        source.vz += fz;
      }
      if (!target.pinned) {
        target.vx -= fx;
        target.vy -= fy;
        target.vz -= fz;
      }
    }

    // 3. Center gravity, velocity update, and position integration
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.pinned) continue;

      // Pull toward origin (0, 0, 0)
      n.vx -= n.x * centerGravity;
      n.vy -= n.y * centerGravity;
      n.vz -= n.z * centerGravity;

      // Damping
      n.vx *= damping;
      n.vy *= damping;
      n.vz *= damping;

      // Position update
      n.x += n.vx;
      n.y += n.vy;
      n.z += n.vz;

      // Soft spherical containment radius (350)
      const r = Math.sqrt(n.x * n.x + n.y * n.y + n.z * n.z);
      if (r > 320) {
        const factor = 320 / r;
        n.x *= factor;
        n.y *= factor;
        n.z *= factor;
        n.vx *= -0.5;
        n.vy *= -0.5;
        n.vz *= -0.5;
      }
    }
  }, [nodes, edges, isSimulatingPhysics]);

  // ---------------------------------------------------------------------------
  // THREE.JS INITIALIZATION & LIFECYCLE
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060403, 0.0012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 3000);
    camera.position.set(0, 140, 420);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    if (heatmapCanvasRef.current) {
      heatmapCanvasRef.current.width = width;
      heatmapCanvasRef.current.height = height;
    }

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 140;
    controls.maxDistance = 1100;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = rotateSpeed;
    controlsRef.current = controls;

    // 5. Lighting: Warm Obsidian & Cyber Glow
    const ambientLight = new THREE.AmbientLight(0x181008, 1.8);
    scene.add(ambientLight);

    const amberLight = new THREE.PointLight(0xff8a1f, 4.5, 700);
    amberLight.position.set(120, 180, 160);
    scene.add(amberLight);

    const cyanLight = new THREE.PointLight(0x00f3ff, 3.8, 600);
    cyanLight.position.set(-160, -120, -100);
    scene.add(cyanLight);

    const goldCoreLight = new THREE.PointLight(0xffd700, 5.0, 400);
    goldCoreLight.position.set(0, 0, 0);
    scene.add(goldCoreLight);

    // 6. Deep Space Background Starfield (400 shimmering latent points)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 450;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 1600;
      starPositions[i + 1] = (Math.random() - 0.5) * 1600;
      starPositions[i + 2] = (Math.random() - 0.5) * 1600;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x9a8878,
      size: 1.8,
      transparent: true,
      opacity: 0.45
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 7. Node Meshes & Wireframe Halos
    nodeMeshMap.current.clear();
    haloMeshMap.current.clear();

    nodes.forEach(node => {
      const catConfig = CATEGORY_COLORS[node.category];

      // Inner Sphere
      const sphereGeo = new THREE.SphereGeometry(node.radius, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: catConfig.hex,
        emissive: catConfig.hex,
        emissiveIntensity: node.id === 'vault-centroid' ? 0.75 : 0.45,
        roughness: 0.25,
        metalness: 0.6
      });
      const nodeMesh = new THREE.Mesh(sphereGeo, sphereMat);
      nodeMesh.position.set(node.x, node.y, node.z);
      nodeMesh.userData = { nodeId: node.id };
      scene.add(nodeMesh);
      nodeMeshMap.current.set(node.id, nodeMesh);

      // Outer Translucent Wireframe Icosahedron Halo
      const haloGeo = new THREE.IcosahedronGeometry(node.radius * 1.55, 1);
      const haloMat = new THREE.MeshBasicMaterial({
        color: catConfig.hex,
        wireframe: true,
        transparent: true,
        opacity: node.id === 'vault-centroid' ? 0.6 : 0.25
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(node.x, node.y, node.z);
      scene.add(haloMesh);
      haloMeshMap.current.set(node.id, haloMesh);
    });

    // 8. Edges with Recall Path Lines
    edgeLineMap.current.clear();
    const nodeLookup = new Map<string, VaultNode>();
    nodes.forEach(n => nodeLookup.set(n.id, n));

    edges.forEach(edge => {
      const src = nodeLookup.get(edge.sourceId);
      const tgt = nodeLookup.get(edge.targetId);
      if (!src || !tgt) return;

      const points = [
        new THREE.Vector3(src.x, src.y, src.z),
        new THREE.Vector3(tgt.x, tgt.y, tgt.z)
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      // Line color based on active state and weight
      const lineColor = edge.isActive ? 0xff8a1f : 0x4a3a2e;
      const lineMat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: edge.isActive ? Math.min(0.95, edge.weight * 1.1) : 0.22,
        linewidth: edge.isActive ? 2 : 1
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      edgeLineMap.current.set(edge.id, line);
    });

    // 9. Traveling Photon Particles along Active Recall Edges
    const photonCount = 60;
    const photonGeo = new THREE.BufferGeometry();
    const photonPositions = new Float32Array(photonCount * 3);
    const photonColors = new Float32Array(photonCount * 3);

    for (let i = 0; i < photonCount; i++) {
      photonPositions[i * 3] = 0;
      photonPositions[i * 3 + 1] = 0;
      photonPositions[i * 3 + 2] = 0;

      // Bright amber/gold or cyan photons
      const isCyan = i % 2 === 0;
      photonColors[i * 3] = isCyan ? 0.0 : 1.0;
      photonColors[i * 3 + 1] = isCyan ? 0.95 : 0.54;
      photonColors[i * 3 + 2] = isCyan ? 1.0 : 0.12;
    }

    photonGeo.setAttribute('position', new THREE.BufferAttribute(photonPositions, 3));
    photonGeo.setAttribute('color', new THREE.BufferAttribute(photonColors, 3));

    const photonMat = new THREE.PointsMaterial({
      size: 4.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const photonPoints = new THREE.Points(photonGeo, photonMat);
    scene.add(photonPoints);
    photonParticlesRef.current = photonPoints;

    // 10. Raycasting for Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshMap.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.nodeId as string;
        setHoveredNodeId(hitId);
        container.style.cursor = 'pointer';
      } else {
        setHoveredNodeId(null);
        container.style.cursor = 'grab';
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(nodeMeshMap.current.values());
      const intersects = raycaster.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.nodeId as string;
        setSelectedNodeId(hitId);
        soundFx.playNodeSelect();
      }
    };

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // 11. Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          if (heatmapCanvasRef.current) {
            heatmapCanvasRef.current.width = w;
            heatmapCanvasRef.current.height = h;
          }
        }
      }
    });
    resizeObserver.observe(container);

    // 12. Animation Render Loop
    let animId: number = 0;
    let clock = new THREE.Clock();
    let photonPhase = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Step physics
      stepPhysics();

      // Update Mesh Positions from physics nodes
      nodes.forEach(node => {
        const mesh = nodeMeshMap.current.get(node.id);
        const halo = haloMeshMap.current.get(node.id);
        if (mesh) {
          mesh.position.set(node.x, node.y, node.z);
        }
        if (halo) {
          halo.position.set(node.x, node.y, node.z);
          // Rotate wireframe halos gently
          halo.rotation.x = elapsed * 0.4;
          halo.rotation.y = elapsed * 0.6;
        }
      });

      // Update Edges Geometry
      const currentLookup = new Map<string, VaultNode>();
      nodes.forEach(n => currentLookup.set(n.id, n));

      edges.forEach(edge => {
        const line = edgeLineMap.current.get(edge.id);
        const src = currentLookup.get(edge.sourceId);
        const tgt = currentLookup.get(edge.targetId);
        if (line && src && tgt) {
          const positions = line.geometry.attributes.position as THREE.BufferAttribute;
          if (positions) {
            positions.setXYZ(0, src.x, src.y, src.z);
            positions.setXYZ(1, tgt.x, tgt.y, tgt.z);
            positions.needsUpdate = true;
          }
        }
      });

      // Update Traveling Photons along active edges
      photonPhase = (photonPhase + delta * 0.8) % 1.0;
      const activeEdges = edges.filter(e => e.isActive && e.weight >= minWeightThreshold);

      if (photonParticlesRef.current && activeEdges.length > 0) {
        const positions = photonParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < photonCount; i++) {
          const edgeIndex = i % activeEdges.length;
          const targetEdge = activeEdges[edgeIndex];
          const src = currentLookup.get(targetEdge.sourceId);
          const tgt = currentLookup.get(targetEdge.targetId);

          if (src && tgt) {
            // Calculate interpolation factor with phase offset
            const offset = (i / photonCount + photonPhase) % 1.0;
            const px = src.x + (tgt.x - src.x) * offset;
            const py = src.y + (tgt.y - src.y) * offset;
            const pz = src.z + (tgt.z - src.z) * offset;
            positions.setXYZ(i, px, py, pz);
          }
        }
        positions.needsUpdate = true;
      }

      // Rotate starfield slowly
      starField.rotation.y = elapsed * 0.015;

      // Update OrbitControls
      controls.update();

      // Render Three.js Scene
      renderer.render(scene, camera);

      // Render 2D Intensity Heatmap Overlay (synced with camera projection & physics)
      if (heatmapCanvasRef.current && cameraRef.current) {
        renderVaultHeatmap({
          canvas: heatmapCanvasRef.current,
          camera: cameraRef.current,
          nodes,
          densityMap: densityMapRef.current,
          config: heatmapConfigRef.current,
          elapsed
        });
      }
    };

    animate();
    reqAnimRef.current = animId;

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);

      // Dispose Three.js objects
      starGeo.dispose();
      starMat.dispose();
      photonGeo.dispose();
      photonMat.dispose();

      nodeMeshMap.current.forEach(mesh => {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
      haloMeshMap.current.forEach(halo => {
        halo.geometry.dispose();
        (halo.material as THREE.Material).dispose();
      });
      edgeLineMap.current.forEach(line => {
        line.geometry.dispose();
        (line.material as THREE.Material).dispose();
      });

      controls.dispose();
      renderer.dispose();
    };
  }, [nodes, edges, minWeightThreshold, autoRotate, rotateSpeed, stepPhysics]);

  // Sync AutoRotate setting to controls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = rotateSpeed;
    }
  }, [autoRotate, rotateSpeed]);

  // Update Highlight materials when selectedNodeId or hoveredNodeId changes
  useEffect(() => {
    nodeMeshMap.current.forEach((mesh, id) => {
      const isSelected = id === selectedNodeId;
      const isHovered = id === hoveredNodeId;
      const targetNode = nodes.find(n => n.id === id);
      if (!targetNode) return;

      const catConfig = CATEGORY_COLORS[targetNode.category];
      const mat = mesh.material as THREE.MeshStandardMaterial;

      if (isSelected) {
        mat.emissive.setHex(0xffffff);
        mat.emissiveIntensity = 0.95;
        mesh.scale.set(1.4, 1.4, 1.4);
      } else if (isHovered) {
        mat.emissive.setHex(catConfig.hex);
        mat.emissiveIntensity = 0.8;
        mesh.scale.set(1.25, 1.25, 1.25);
      } else {
        mat.emissive.setHex(catConfig.hex);
        mat.emissiveIntensity = id === 'vault-centroid' ? 0.75 : 0.45;
        mesh.scale.set(1.0, 1.0, 1.0);
      }
    });

    // Update halo wireframe opacity
    haloMeshMap.current.forEach((halo, id) => {
      const isSelected = id === selectedNodeId;
      const isHovered = id === hoveredNodeId;
      const mat = halo.material as THREE.MeshBasicMaterial;

      if (isSelected) {
        mat.opacity = 0.85;
        halo.scale.set(1.45, 1.45, 1.45);
      } else if (isHovered) {
        mat.opacity = 0.65;
        halo.scale.set(1.25, 1.25, 1.25);
      } else {
        mat.opacity = id === 'vault-centroid' ? 0.5 : 0.22;
        halo.scale.set(1.0, 1.0, 1.0);
      }
    });

    // Highlight edges connected to selected or hovered node
    edgeLineMap.current.forEach((line, id) => {
      const edge = edges.find(e => e.id === id);
      if (!edge) return;

      const isConnectedToSelected = selectedNodeId && (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId);
      const isConnectedToHovered = hoveredNodeId && (edge.sourceId === hoveredNodeId || edge.targetId === hoveredNodeId);
      const mat = line.material as THREE.LineBasicMaterial;

      if (isConnectedToSelected) {
        mat.color.setHex(0xffffff);
        mat.opacity = 0.98;
      } else if (isConnectedToHovered) {
        mat.color.setHex(0x00f3ff);
        mat.opacity = 0.90;
      } else if (edge.isActive && edge.weight >= minWeightThreshold) {
        mat.color.setHex(0xff8a1f);
        mat.opacity = Math.min(0.9, edge.weight);
      } else {
        mat.color.setHex(0x38281d);
        mat.opacity = 0.18;
      }
    });
  }, [selectedNodeId, hoveredNodeId, nodes, edges, minWeightThreshold]);

  // ---------------------------------------------------------------------------
  // INTERACTIVE ACTIONS & RECALL SIMULATOR
  // ---------------------------------------------------------------------------
  const handleTriggerRecall = (customQuery?: string) => {
    const q = customQuery || queryInput;
    setIsRecalling(true);
    soundFx.playTriggerChime();

    const startTime = performance.now();

    // Simulate RAG cosine similarity scoring and re-weighting
    setTimeout(() => {
      const qLower = q.toLowerCase();

      // Dynamically calculate similarity scores for nodes
      const updatedNodes = nodes.map(node => {
        let boost = 0.0;
        const textToMatch = `${node.label} ${node.chunkSnippet} ${node.category}`.toLowerCase();
        const keywords = qLower.split(' ').filter(w => w.length > 2);

        keywords.forEach(kw => {
          if (textToMatch.includes(kw)) {
            boost += 0.12;
          }
        });

        // Add small stochastic variation for realism
        const newWeight = Math.min(0.99, Math.max(0.40, node.baseWeight * (0.85 + boost + (Math.random() - 0.5) * 0.08)));
        return {
          ...node,
          currentRecallWeight: Number(newWeight.toFixed(3)),
          accessCount: boost > 0 ? node.accessCount + 1 : node.accessCount
        };
      });

      // Update edges: high-similarity nodes activate recall paths
      const updatedEdges = edges.map(edge => {
        const srcNode = updatedNodes.find(n => n.id === edge.sourceId);
        const tgtNode = updatedNodes.find(n => n.id === edge.targetId);

        const avgNodeWeight = ((srcNode?.currentRecallWeight || 0.7) + (tgtNode?.currentRecallWeight || 0.7)) / 2;
        const newEdgeWeight = Number(Math.min(0.98, Math.max(0.35, edge.weight * 0.4 + avgNodeWeight * 0.6)).toFixed(3));
        const shouldBeActive = newEdgeWeight >= minWeightThreshold;

        return {
          ...edge,
          weight: newEdgeWeight,
          isActive: shouldBeActive,
          latencyMs: Number((4 + Math.random() * 12).toFixed(1))
        };
      });

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setIsRecalling(false);

      const endTime = performance.now();
      const latency = Number((endTime - startTime + 8.5).toFixed(1));

      // Calculate telemetry
      const activeList = updatedEdges.filter(e => e.isActive);
      const meanSim = activeList.length
        ? Number((activeList.reduce((acc, c) => acc + c.weight, 0) / activeList.length).toFixed(3))
        : 0.88;

      // Highest recalled node
      const topNode = [...updatedNodes].sort((a, b) => b.currentRecallWeight - a.currentRecallWeight)[0];

      setLastRecallTelemetry({
        latencyMs: latency,
        recalledCount: activeList.length,
        meanSimilarity: meanSim,
        topNodeLabel: topNode ? topNode.label : 'Centroid'
      });

      soundFx.playDataChirp();
    }, 450);
  };

  // Reset Camera View
  const handleResetCamera = () => {
    soundFx.playClick(1200);
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 140, 420);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Focus Camera onto Selected Node
  const handleFocusNode = (node: VaultNode) => {
    soundFx.playClick(1400);
    setSelectedNodeId(node.id);
    if (cameraRef.current && controlsRef.current) {
      const targetVec = new THREE.Vector3(node.x, node.y, node.z);
      controlsRef.current.target.copy(targetVec);
      // Position camera offset from node
      cameraRef.current.position.set(node.x + 80, node.y + 60, node.z + 160);
      controlsRef.current.update();
    }
  };

  // Filtered nodes based on category filter
  const visibleNodes = useMemo(() => {
    if (categoryFilter === 'all') return nodes;
    return nodes.filter(n => n.category === categoryFilter);
  }, [nodes, categoryFilter]);

  return (
    <div className={`relative w-full h-full flex flex-col bg-[#070503] select-none overflow-hidden ${fullScreen ? 'fixed inset-0 z-50' : ''}`}>
      
      {/* Top Vault HUD Header Bar */}
      <div className="z-20 flex flex-wrap items-center justify-between px-3.5 py-2 bg-[#0c0805]/95 border-b border-[#ff8a1f]/30 backdrop-blur-md gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#ff8a1f]/15 border border-[#ff8a1f]/40 text-[#ff8a1f] shadow-[0_0_12px_rgba(255,138,31,0.4)]">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-condensed font-bold text-sm tracking-wider text-white">
                KARPATHY VAULT
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#ff8a1f]/20 text-[#ffb259] border border-[#ff8a1f]/40">
                3D RAG LATENT GRAPH
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#9a8878]">
              Force-directed semantic memory recall paths & attention weights
            </p>
          </div>
        </div>

        {/* Live Vault Telemetry Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-[#140c06] px-2.5 py-1 rounded border border-[#ff8a1f]/25 text-[#9a8878]">
            <Layers className="w-3 h-3 text-[#ff8a1f]" />
            <span>NODES: <b className="text-white">{nodes.length}</b></span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#140c06] px-2.5 py-1 rounded border border-[#00f3ff]/25 text-[#9a8878]">
            <Activity className="w-3 h-3 text-[#00f3ff]" />
            <span>ACTIVE PATHS: <b className="text-cyan-300">{activeRecallCount}</b></span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#140c06] px-2.5 py-1 rounded border border-emerald-500/25 text-[#9a8878]">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>MEAN COSINE: <b className="text-emerald-400">{meanActiveWeight}</b></span>
          </div>

          {/* 2D Intensity Heatmap HUD Toggle & Controls */}
          <div className="flex items-center gap-1 border-l border-[#ff8a1f]/25 pl-2">
            <button
              onClick={() => {
                soundFx.playClick(1100);
                setHeatmapConfig(prev => ({ ...prev, enabled: !prev.enabled }));
              }}
              title={heatmapConfig.enabled ? 'Disable 2D Heatmap Overlay' : 'Enable 2D Heatmap Overlay'}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono transition-all ${
                heatmapConfig.enabled
                  ? 'bg-[#ff8a1f]/20 border-[#ff8a1f] text-[#ffb259] shadow-[0_0_12px_rgba(255,138,31,0.35)]'
                  : 'bg-[#140c06] border-neutral-800 text-[#9a8878] hover:border-neutral-700'
              }`}
            >
              <Flame className={`w-3 h-3 ${heatmapConfig.enabled ? 'text-[#ff8a1f] animate-pulse' : 'text-[#6a5848]'}`} />
              <span>HEATMAP 2D: <b className={heatmapConfig.enabled ? 'text-amber-400 font-bold' : 'text-neutral-500'}>{heatmapConfig.enabled ? 'ON' : 'OFF'}</b></span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick(1000);
                setShowHeatmapSettings(!showHeatmapSettings);
              }}
              title="Configure Heatmap Metrics, Palette & Contours"
              className={`p-1 rounded border transition-all ${
                showHeatmapSettings
                  ? 'bg-[#ff8a1f] text-black border-[#ff8a1f]'
                  : 'bg-[#1c120a] text-[#9a8878] hover:text-white border-[#ff8a1f]/30'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Controls: Reset Camera, Drawer Toggle */}
          <div className="flex items-center gap-1 ml-1 border-l border-neutral-800 pl-2">
            <button
              onClick={handleResetCamera}
              title="Reset 3D Camera"
              className="p-1 rounded bg-[#1c120a] hover:bg-[#ff8a1f]/20 text-[#9a8878] hover:text-white border border-[#ff8a1f]/30 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                soundFx.playClick(1000);
                setIsDrawerOpen(!isDrawerOpen);
              }}
              title={isDrawerOpen ? 'Close Memory Inspector' : 'Open Memory Inspector'}
              className={`p-1 rounded border transition-all ${
                isDrawerOpen
                  ? 'bg-[#ff8a1f] text-black border-[#ff8a1f]'
                  : 'bg-[#1c120a] text-[#9a8878] hover:text-white border-[#ff8a1f]/30'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                title="Close Karpathy Vault"
                className="p-1 rounded bg-[#1c120a] hover:bg-rose-500/20 text-[#9a8878] hover:text-rose-400 border border-neutral-700 transition-all ml-1"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main 3D Stage Area */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        
        {/* Three.js Canvas Container */}
        <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

        {/* 2D Intensity Heatmap Canvas Overlay (Memory Cluster Density & Access Frequency) */}
        <canvas
          ref={heatmapCanvasRef}
          className={`absolute inset-0 w-full h-full z-[1] pointer-events-none transition-opacity duration-300 ${
            heatmapConfig.enabled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            mixBlendMode: heatmapConfig.blendMode === 'screen' ? 'screen' : 'plus-lighter'
          }}
        />

        {/* Top Left Floating RAG Query & Recall Trigger Bar */}
        <div className="absolute top-3 left-3 z-10 w-80 max-w-[calc(100vw-24px)] flex flex-col gap-1.5 pointer-events-auto">
          <div className="bg-[#0e0a07]/92 border border-[#ff8a1f]/35 rounded-lg p-2.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono tracking-wider text-[#ffb259] flex items-center gap-1 font-semibold">
                <Search className="w-3 h-3 text-[#ff8a1f]" />
                ACTIVE RAG RECALL QUERY
              </span>
              <span className="text-[9px] font-mono text-[#9a8878]">
                {lastRecallTelemetry.latencyMs}ms
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={queryInput}
                onChange={e => setQueryInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTriggerRecall()}
                placeholder="Query latent memory..."
                className="flex-1 bg-[#18110b] border border-[#ff8a1f]/30 focus:border-[#ff8a1f] rounded px-2 py-1 text-xs text-white font-mono placeholder:text-neutral-600 outline-none"
              />
              <button
                onClick={() => handleTriggerRecall()}
                disabled={isRecalling}
                className="px-2.5 py-1 rounded bg-[#ff8a1f] hover:bg-[#ffb259] text-[#120802] font-condensed font-bold text-xs tracking-wider flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(255,138,31,0.5)] disabled:opacity-50"
              >
                {isRecalling ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Zap className="w-3 h-3 fill-current" />
                )}
                <span>RECALL</span>
              </button>
            </div>

            {/* Quick Preset Queries Pills */}
            <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-0.5 scrollbar-none">
              {PRESET_QUERIES.map((pq, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQueryInput(pq.query);
                    handleTriggerRecall(pq.query);
                  }}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap bg-[#1a120b] hover:bg-[#ff8a1f]/20 text-[#c8b8a8] hover:text-white border border-[#ff8a1f]/20 hover:border-[#ff8a1f]/50 transition-colors"
                >
                  {pq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div className="flex items-center gap-1 bg-[#0e0a07]/85 border border-[#ff8a1f]/20 rounded-md p-1 backdrop-blur-md overflow-x-auto scrollbar-none text-[9px] font-mono">
            <span className="text-[#9a8878] px-1 flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" />
            </span>
            {[
              { id: 'all', label: 'ALL CHUNKS' },
              { id: 'semantic', label: 'SEMANTIC' },
              { id: 'episodic', label: 'EPISODIC' },
              { id: 'working', label: 'WORKING' },
              { id: 'tools', label: 'TOOLS' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  soundFx.playClick(1050);
                  setCategoryFilter(cat.id);
                }}
                className={`px-1.5 py-0.5 rounded uppercase transition-colors whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-[#ff8a1f] text-black font-bold shadow-sm'
                    : 'text-[#9a8878] hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Left Floating Physics & Camera Controls HUD */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-auto bg-[#0e0a07]/90 border border-[#ff8a1f]/25 rounded-lg px-3 py-1.5 backdrop-blur-md text-[10px] font-mono shadow-lg">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                soundFx.playClick(900);
                setIsSimulatingPhysics(!isSimulatingPhysics);
              }}
              title={isSimulatingPhysics ? 'Freeze Force-Directed Physics' : 'Resume Physics Simulation'}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#18110b] hover:bg-[#ff8a1f]/20 text-[#ffb259] border border-[#ff8a1f]/30"
            >
              {isSimulatingPhysics ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              <span>{isSimulatingPhysics ? 'PHYSICS ON' : 'PAUSED'}</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick(950);
                setAutoRotate(!autoRotate);
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                autoRotate
                  ? 'bg-[#ff8a1f]/20 text-[#ffb259] border-[#ff8a1f]/40'
                  : 'bg-[#18110b] text-[#9a8878] border-neutral-800'
              }`}
            >
              <Compass className="w-2.5 h-2.5" />
              <span>ORBIT {autoRotate ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="h-3 w-px bg-neutral-800" />

          {/* Weight Threshold Slider */}
          <div className="flex items-center gap-1.5">
            <Sliders className="w-2.5 h-2.5 text-[#ff8a1f]" />
            <span className="text-[#9a8878]">MIN WEIGHT:</span>
            <input
              type="range"
              min="0.30"
              max="0.95"
              step="0.05"
              value={minWeightThreshold}
              onChange={e => setMinWeightThreshold(parseFloat(e.target.value))}
              className="w-16 accent-[#ff8a1f] cursor-pointer"
            />
            <span className="text-white font-bold">{minWeightThreshold.toFixed(2)}</span>
          </div>

          <div className="h-3 w-px bg-neutral-800" />

          {/* Quick Heatmap Metric Mode Selector */}
          <div className="flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-[#ff8a1f]" />
            <span className="text-[#9a8878]">HEAT:</span>
            {(['composite', 'density', 'access', 'recall'] as HeatmapMetric[]).map(m => (
              <button
                key={m}
                onClick={() => {
                  soundFx.playClick(1050);
                  setHeatmapConfig(prev => ({ ...prev, metric: m, enabled: true }));
                }}
                className={`px-1.5 py-0.5 rounded uppercase text-[8px] font-mono transition-all ${
                  heatmapConfig.enabled && heatmapConfig.metric === m
                    ? 'bg-[#ff8a1f] text-black font-bold shadow-sm'
                    : 'bg-[#18110b] text-[#9a8878] hover:text-white border border-[#ff8a1f]/20'
                }`}
              >
                {m === 'composite' ? 'ALL' : m}
              </button>
            ))}
          </div>
        </div>

        {/* 2D Intensity Heatmap Legend & Cluster Telemetry Overlay */}
        {heatmapConfig.enabled && (
          <div className={`absolute bottom-3 ${isDrawerOpen ? 'right-88' : 'right-3'} z-10 pointer-events-auto bg-[#0a0705]/92 border border-[#ff8a1f]/30 rounded-lg p-2.5 shadow-2xl backdrop-blur-md font-mono text-[9px] max-w-xs transition-all duration-300 animate-fadeIn`}>
            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-[#ff8a1f]/20">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-[#ff8a1f] animate-pulse" />
                <span className="text-white font-condensed font-bold text-xs tracking-wider">
                  MEMORY HEATMAP
                </span>
                <span className="px-1 py-0.2 rounded text-[8px] uppercase bg-[#ff8a1f]/20 text-[#ffb259] border border-[#ff8a1f]/30">
                  {heatmapConfig.metric}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setHeatmapConfig(prev => ({ ...prev, showContours: !prev.showContours }))}
                  title={heatmapConfig.showContours ? 'Hide Topo Contours' : 'Show Topo Contours'}
                  className={`px-1.5 py-0.5 rounded text-[8px] transition-colors border ${
                    heatmapConfig.showContours
                      ? 'bg-[#ff8a1f]/20 text-[#ffb259] border-[#ff8a1f]/40 font-bold'
                      : 'bg-[#140c06] text-neutral-500 border-neutral-800'
                  }`}
                >
                  CONTOUR
                </button>
                <button
                  onClick={() => setHeatmapConfig(prev => ({ ...prev, showPeakLabels: !prev.showPeakLabels }))}
                  title={heatmapConfig.showPeakLabels ? 'Hide Peak Badges' : 'Show Peak Badges'}
                  className={`px-1.5 py-0.5 rounded text-[8px] transition-colors border ${
                    heatmapConfig.showPeakLabels
                      ? 'bg-[#ff8a1f]/20 text-[#ffb259] border-[#ff8a1f]/40 font-bold'
                      : 'bg-[#140c06] text-neutral-500 border-neutral-800'
                  }`}
                >
                  PEAKS
                </button>
              </div>
            </div>

            {/* Thermal Intensity Gradient Bar */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center justify-between text-[8px] text-[#9a8878]">
                <span>0% SPARSE</span>
                <span>50% MEDIAN</span>
                <span>100% PEAK CLUSTER</span>
              </div>
              <div
                className="w-full h-2 rounded-sm border border-neutral-800 shadow-inner"
                style={{
                  background:
                    heatmapConfig.palette === 'cyber'
                      ? 'linear-gradient(to right, #0c0a18, #8b5cf6, #46e39a, #00f3ff, #ffffff)'
                      : heatmapConfig.palette === 'plasma'
                      ? 'linear-gradient(to right, #140a1e, #6366f1, #d946ef, #f43f5e, #ffffff)'
                      : 'linear-gradient(to right, #280a05, #dc2626, #ff8a1f, #ffd700, #ffffe6)'
                }}
              />
            </div>

            {/* Cluster Density Telemetry Data */}
            <div className="grid grid-cols-2 gap-1 text-[8.5px] text-[#9a8878] border-t border-neutral-800/80 pt-1.5">
              <div>
                <span className="block text-[#6a5848]">PEAK HOTSPOT:</span>
                <span className="text-amber-400 font-bold truncate block" title={clusterTelemetry.peakNodeLabel}>
                  {clusterTelemetry.peakNodeLabel}
                </span>
              </div>
              <div>
                <span className="block text-[#6a5848]">MAX ACCESS HITS:</span>
                <span className="text-white font-bold block">
                  {clusterTelemetry.peakAccessCount.toLocaleString()} calls
                </span>
              </div>
              <div>
                <span className="block text-[#6a5848]">MAX CLUSTER DENSITY:</span>
                <span className="text-cyan-300 font-bold block">
                  {clusterTelemetry.maxClusterDensity}% in 3D
                </span>
              </div>
              <div>
                <span className="block text-[#6a5848]">MEAN READ FREQ:</span>
                <span className="text-emerald-400 font-bold block">
                  ~{clusterTelemetry.meanAccessCount} hits/node
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Heatmap Advanced Configuration Popover */}
        {showHeatmapSettings && (
          <div className="absolute top-14 right-3 z-30 w-80 bg-[#0e0a07]/95 border border-[#ff8a1f]/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl font-mono text-xs pointer-events-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#ff8a1f]/20">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#ff8a1f]" />
                <span className="font-condensed font-bold text-sm tracking-wider text-white">
                  HEATMAP 2D CONFIGURATION
                </span>
              </div>
              <button
                onClick={() => setShowHeatmapSettings(false)}
                className="text-[#9a8878] hover:text-white p-0.5 rounded hover:bg-neutral-800"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Metric Mode */}
              <div>
                <span className="text-[10px] text-[#ffb259] font-bold block mb-1">
                  HEAT INTENSITY METRIC
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                  {[
                    { id: 'composite', label: 'COMPOSITE', desc: 'Cluster Density + Access Hits' },
                    { id: 'density', label: 'CLUSTER DENSITY', desc: '3D Proximity Manifold' },
                    { id: 'access', label: 'ACCESS FREQ', desc: 'Total Memory Read Hits' },
                    { id: 'recall', label: 'ACTIVE RECALL', desc: 'Real-time Cosine Query Weight' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        soundFx.playClick(1050);
                        setHeatmapConfig(prev => ({ ...prev, metric: m.id as HeatmapMetric }));
                      }}
                      className={`p-1.5 rounded text-left border transition-all ${
                        heatmapConfig.metric === m.id
                          ? 'bg-[#ff8a1f]/20 border-[#ff8a1f] text-white'
                          : 'bg-[#140c06] border-neutral-800 text-[#9a8878] hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-bold text-amber-300">{m.label}</div>
                      <div className="text-[8px] text-[#9a8878] line-clamp-1">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <span className="text-[10px] text-[#ffb259] font-bold block mb-1">
                  COLOR PALETTE
                </span>
                <div className="grid grid-cols-3 gap-1 text-[9px]">
                  {[
                    { id: 'thermal', label: 'THERMAL', bar: 'from-amber-600 via-orange-500 to-yellow-300' },
                    { id: 'cyber', label: 'CYBER', bar: 'from-indigo-600 via-emerald-500 to-cyan-300' },
                    { id: 'plasma', label: 'PLASMA', bar: 'from-purple-600 via-pink-500 to-rose-300' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        soundFx.playClick(1100);
                        setHeatmapConfig(prev => ({ ...prev, palette: p.id as HeatmapPalette }));
                      }}
                      className={`p-1.5 rounded text-center border transition-all ${
                        heatmapConfig.palette === p.id
                          ? 'bg-[#ff8a1f]/20 border-[#ff8a1f] text-white'
                          : 'bg-[#140c06] border-neutral-800 text-[#9a8878] hover:border-neutral-700'
                      }`}
                    >
                      <div className="font-bold text-[9px] mb-1">{p.label}</div>
                      <div className={`h-1.5 w-full rounded bg-gradient-to-r ${p.bar}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders: Gain and Radius */}
              <div className="space-y-2 border-t border-neutral-800 pt-2 text-[10px]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#9a8878]">THERMAL GAIN / OPACITY:</span>
                    <span className="text-white font-bold">{Math.round(heatmapConfig.gain * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={heatmapConfig.gain}
                    onChange={e => setHeatmapConfig(prev => ({ ...prev, gain: parseFloat(e.target.value) }))}
                    className="w-full accent-[#ff8a1f] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#9a8878]">KERNEL SPREAD RADIUS:</span>
                    <span className="text-white font-bold">{heatmapConfig.radiusMultiplier.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={heatmapConfig.radiusMultiplier}
                    onChange={e => setHeatmapConfig(prev => ({ ...prev, radiusMultiplier: parseFloat(e.target.value) }))}
                    className="w-full accent-[#ff8a1f] cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 border-t border-neutral-800 pt-2 text-[9px]">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#c8b8a8]">
                  <input
                    type="checkbox"
                    checked={heatmapConfig.showContours}
                    onChange={e => setHeatmapConfig(prev => ({ ...prev, showContours: e.target.checked }))}
                    className="accent-[#ff8a1f]"
                  />
                  <span>ISO CONTOURS</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[#c8b8a8]">
                  <input
                    type="checkbox"
                    checked={heatmapConfig.showPeakLabels}
                    onChange={e => setHeatmapConfig(prev => ({ ...prev, showPeakLabels: e.target.checked }))}
                    className="accent-[#ff8a1f]"
                  />
                  <span>PEAK BADGES</span>
                </label>
              </div>

              {/* Blend Mode toggle */}
              <div className="flex items-center justify-between text-[9px] border-t border-neutral-800 pt-2 text-[#9a8878]">
                <span>BLEND MODE:</span>
                <div className="flex items-center gap-1">
                  {(['screen', 'lighter'] as const).map(bm => (
                    <button
                      key={bm}
                      onClick={() => setHeatmapConfig(prev => ({ ...prev, blendMode: bm }))}
                      className={`px-1.5 py-0.5 rounded uppercase ${
                        heatmapConfig.blendMode === bm
                          ? 'bg-[#ff8a1f] text-black font-bold'
                          : 'bg-[#18110b] text-[#9a8878]'
                      }`}
                    >
                      {bm}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Hover Node Tooltip Card (follows hover) */}
        {hoveredNodeId && (
          <div className="absolute bottom-14 left-3 z-10 pointer-events-none bg-[#0a0705]/95 border border-[#00f3ff]/50 rounded-lg p-2 shadow-2xl backdrop-blur-md max-w-xs animate-fadeIn">
            {(() => {
              const hNode = nodes.find(n => n.id === hoveredNodeId);
              if (!hNode) return null;
              const catConfig = CATEGORY_COLORS[hNode.category];
              return (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-condensed font-bold text-xs text-white truncate">
                      {hNode.label}
                    </span>
                    <span 
                      className="px-1 py-0.5 rounded text-[8px] font-mono uppercase"
                      style={{ color: catConfig.css, backgroundColor: `${catConfig.css}20` }}
                    >
                      {catConfig.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#b8a898] font-mono mt-1 line-clamp-2">
                    {hNode.chunkSnippet}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#9a8878] mt-1.5 border-t border-neutral-800 pt-1">
                    <span>WEIGHT: <b className="text-amber-400">{hNode.currentRecallWeight}</b></span>
                    <span>DIM: <b className="text-cyan-300">{hNode.vectorDim}d</b></span>
                    <span>CLICKS TO SELECT</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Right Side Drawer: Memory Chunk Deep Inspector */}
        {isDrawerOpen && selectedNode && (
          <div className="absolute top-0 right-0 bottom-0 z-20 w-84 max-w-[85vw] bg-[#0c0805]/95 border-l border-[#ff8a1f]/30 shadow-2xl backdrop-blur-xl flex flex-col pointer-events-auto animate-fadeIn">
            
            {/* Inspector Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#ff8a1f]/20 bg-[#120c08]">
              <div className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-[#ff8a1f]" />
                <span className="font-condensed font-bold text-xs tracking-wider text-white">
                  CHUNK DEEP INSPECTOR
                </span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-[#9a8878] hover:text-white p-0.5 rounded hover:bg-neutral-800 transition-colors"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>

            {/* Inspector Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs scrollbar-thin">
              
              {/* Selected Node Header Card */}
              <div className="p-2.5 rounded-lg bg-[#160e08] border border-[#ff8a1f]/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-condensed font-bold text-sm text-white">
                    {selectedNode.label}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide font-bold"
                    style={{
                      color: CATEGORY_COLORS[selectedNode.category].css,
                      backgroundColor: `${CATEGORY_COLORS[selectedNode.category].css}22`
                    }}
                  >
                    {CATEGORY_COLORS[selectedNode.category].label}
                  </span>
                </div>
                <div className="text-[10px] text-[#9a8878] mb-2">
                  NODE ID: <span className="text-white">{selectedNode.id}</span>
                </div>

                {/* Recall Weight Meter */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[#9a8878]">RECALL ATTENTION WEIGHT:</span>
                    <span className="text-amber-400 font-bold">{selectedNode.currentRecallWeight}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0705] rounded-full overflow-hidden border border-neutral-800">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${selectedNode.currentRecallWeight * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Text Chunk Payload */}
              <div>
                <span className="text-[10px] text-[#ffb259] font-semibold tracking-wider uppercase block mb-1">
                  RETRIEVED TEXT PAYLOAD (RAG CHUNK)
                </span>
                <div className="p-2.5 rounded bg-[#090604] border border-neutral-800 text-[11px] text-[#d8c8b8] leading-relaxed">
                  {selectedNode.chunkSnippet}
                </div>
              </div>

              {/* Embedding Vector Sample Preview */}
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-[#00f3ff] font-semibold tracking-wider uppercase">
                    LATENT EMBEDDING ({selectedNode.vectorDim}-D)
                  </span>
                  <span className="text-[#9a8878]">{selectedNode.tokens} tokens</span>
                </div>
                <div className="p-2 rounded bg-[#090604] border border-[#00f3ff]/20 font-mono text-[9px] text-cyan-300 grid grid-cols-4 gap-1">
                  {selectedNode.embeddingPreview.map((val, i) => (
                    <div key={i} className="bg-cyan-950/40 p-1 rounded border border-cyan-800/30 text-center">
                      {val > 0 ? `+${val.toFixed(3)}` : val.toFixed(3)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Recall Paths & Weights */}
              <div>
                <span className="text-[10px] text-[#ffb259] font-semibold tracking-wider uppercase block mb-1">
                  ACTIVE RECALL PATHS ({selectedNodeEdges.length})
                </span>
                <div className="space-y-1.5">
                  {selectedNodeEdges.map(edge => {
                    const otherId = edge.sourceId === selectedNode.id ? edge.targetId : edge.sourceId;
                    const otherNode = nodes.find(n => n.id === otherId);
                    if (!otherNode) return null;

                    return (
                      <div 
                        key={edge.id}
                        onClick={() => handleFocusNode(otherNode)}
                        className={`p-1.5 rounded border transition-all cursor-pointer hover:scale-[1.02] ${
                          edge.isActive 
                            ? 'bg-[#18110a] border-[#ff8a1f]/40 hover:border-[#ff8a1f]'
                            : 'bg-[#0d0906] border-neutral-800 hover:border-neutral-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-white font-condensed font-semibold truncate">
                            {otherNode.label}
                          </span>
                          <span className="text-amber-400 font-bold ml-1">
                            {edge.weight}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[8px] text-[#9a8878] mt-0.5">
                          <span className="font-mono text-[8px] uppercase">{edge.relation}</span>
                          <span className="text-cyan-400">{edge.latencyMs}ms</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleFocusNode(selectedNode)}
                  className="flex-1 py-1.5 rounded bg-[#1c120a] hover:bg-[#ff8a1f]/20 text-[#ffb259] border border-[#ff8a1f]/30 font-condensed font-bold text-xs tracking-wider flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  <span>FOCUS CAMERA</span>
                </button>

                <button
                  onClick={() => handleTriggerRecall(selectedNode.label)}
                  className="flex-1 py-1.5 rounded bg-[#ff8a1f] hover:bg-[#ffb259] text-black font-condensed font-bold text-xs tracking-wider flex items-center justify-center gap-1 transition-colors shadow-[0_0_10px_rgba(255,138,31,0.4)]"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>RECALL PATH</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
