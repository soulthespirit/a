import { AgentInfo, StreamLogEntry, VaultNode } from '../types/cockpit';

export const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'ceo',
    name: 'Chief of Staff / CEO',
    codename: 'Pearl / Genesis',
    role: 'Enterprise Orchestration & Zero Founder Fatigue',
    mandate: 'Autonomous strategic delegation, calendar de-conflicting, and final executive green-lighting.',
    status: 'ACTIVE',
    loadPercent: 74,
    taskQueueCount: 3,
    currentTask: 'Re-routing legal redline approval to external counsel pipeline',
    completedTasks: 184,
    avatarColor: '#4F46E5', // Indigo
    accentColor: '#818CF8',
    scheduleLabel: 'now',
    recentOutput: 'Legal redlines merged. Board prep block preserved for 14:00.'
  },
  {
    id: 'pm',
    name: 'Project Manager',
    codename: 'SprintMaster OM-1',
    role: 'Phase-Gated Sprints & SOPs',
    mandate: 'Sprint pacing, blocker triage, milestone gatekeeping, and autonomous task handoffs.',
    status: 'EXECUTING',
    loadPercent: 88,
    taskQueueCount: 5,
    currentTask: 'Locking Phase 4 deliverables & syncing linear sprint burndown',
    completedTasks: 312,
    avatarColor: '#10B981', // Emerald
    accentColor: '#34D399',
    scheduleLabel: 'Weekdays at 9:00 AM',
    recentOutput: 'Sprint 14 telemetry verified. Zero blocking items.'
  },
  {
    id: 'ba',
    name: 'Business Analyst',
    codename: 'VectorScope BA-3',
    role: 'Market Intelligence & Video Benchmarks',
    mandate: 'Competitive scraping, pricing matrix normalization, and customer cohort telemetry.',
    status: 'ACTIVE',
    loadPercent: 62,
    taskQueueCount: 2,
    currentTask: 'Ingesting 2026 Q3 enterprise AI pricing benchmarks into raw/',
    completedTasks: 97,
    avatarColor: '#06B6D4', // Cyan
    accentColor: '#22D3EE',
    scheduleLabel: 'Every 30 minutes',
    recentOutput: 'Ingested 42 pricing tiers across top 5 AI agent frameworks.'
  },
  {
    id: 'designer',
    name: 'UI/UX Designer',
    codename: 'Aura Token Architect',
    role: 'Design Tokens & Visual Architecture',
    mandate: 'Enforcing zero-pill anti-slop typography, 60-30-10 palette balance, and HUD micro-interactions.',
    status: 'ACTIVE',
    loadPercent: 54,
    taskQueueCount: 1,
    currentTask: 'Auditing 2026 Mission Control HUD corner brackets and canvas bloom',
    completedTasks: 143,
    avatarColor: '#EC4899', // Pink
    accentColor: '#F472B6',
    scheduleLabel: 'Weekdays at 8:00 AM',
    recentOutput: 'Contrast ratios verified at 8.4:1 across dark obsidian canvas.'
  },
  {
    id: 'architect',
    name: 'System Architect',
    codename: 'Karpathy Core C4',
    role: 'C4 Architecture & Karpathy Vault',
    mandate: 'Memory graph partitioning, schema integrity, and vector indexing efficiency.',
    status: 'EXECUTING',
    loadPercent: 91,
    taskQueueCount: 4,
    currentTask: 'Optimizing cosine distance indexing on 8.4M node RAG constellation',
    completedTasks: 420,
    avatarColor: '#F59E0B', // Amber
    accentColor: '#FBBF24',
    scheduleLabel: 'Mondays at 9:00 AM',
    recentOutput: 'Drive E:\\\\ knowledge partition rebuilt in 420ms.'
  },
  {
    id: 'dev',
    name: 'Senior Dev',
    codename: 'ZeroDeadCode-0',
    role: 'Full-Stack Implementation & Zero Dead Code',
    mandate: 'TypeScript strict typing, high-efficiency Web Audio synthesis, and low-latency canvas pipelines.',
    status: 'EXECUTING',
    loadPercent: 82,
    taskQueueCount: 6,
    currentTask: 'Building procedural Web Audio HUD frequency oscillator',
    completedTasks: 589,
    avatarColor: '#3B82F6', // Blue
    accentColor: '#60A5FA',
    scheduleLabel: 'Continuous',
    recentOutput: 'Compiled 18 HUD components. Zero lint warnings. Exit 0.'
  },
  {
    id: 'qa',
    name: 'QA Auditor',
    codename: 'SafeBoundary Guard',
    role: 'Exit Code 0 & Drive C: Safe Boundary Guard',
    mandate: 'Sanbox isolation guardrails, memory leak defense, and zero-dead-code invariant checks.',
    status: 'VERIFYING',
    loadPercent: 43,
    taskQueueCount: 2,
    currentTask: 'Validating Drive C: sandbox containment & exit code 0 status',
    completedTasks: 814,
    avatarColor: '#10B981', // Emerald
    accentColor: '#6EE7B7',
    scheduleLabel: 'Mondays at 6:00 AM',
    recentOutput: 'All sandbox boundaries intact. 0 anomalies detected.'
  }
];

export const INITIAL_STREAM_LOGS: StreamLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '03:49:12',
    mode: 'reasoning',
    agentId: 'ceo',
    agentName: 'CEO (Pearl)',
    text: '[Orchestration] Evaluating multi-agent daily priority queue. 3 critical founder touchpoints isolated.',
    type: 'thought'
  },
  {
    id: 'log-2',
    timestamp: '03:49:15',
    mode: 'reasoning',
    agentId: 'architect',
    agentName: 'System Architect',
    text: '[Vault Sync] RAG memory graph cosine cluster recalculation completed across 8,421,904 nodes.',
    type: 'consensus'
  },
  {
    id: 'log-3',
    timestamp: '03:49:22',
    mode: 'command',
    agentId: 'dev',
    agentName: 'Senior Dev',
    text: '$ git status --porcelain && npm run typecheck',
    type: 'cmd',
    exitCode: 0
  },
  {
    id: 'log-4',
    timestamp: '03:49:24',
    mode: 'command',
    agentId: 'dev',
    agentName: 'Senior Dev',
    text: '✓ All TypeScript declarations verified. Zero dead code identified in bundle.',
    type: 'output',
    exitCode: 0
  },
  {
    id: 'log-5',
    timestamp: '03:49:31',
    mode: 'reasoning',
    agentId: 'qa',
    agentName: 'QA Auditor',
    text: '[Guardrail] Drive C:\\\\ isolation bounds verified against unauthorized writes. Status: SECURE.',
    type: 'success'
  },
  {
    id: 'log-6',
    timestamp: '03:49:40',
    mode: 'reasoning',
    agentId: 'pm',
    agentName: 'Project Manager',
    text: '[Sprint Pulse] Phase 4 gate requirements met: 7/7 specialist threads reporting nominal latency.',
    type: 'consensus'
  },
  {
    id: 'log-7',
    timestamp: '03:49:45',
    mode: 'command',
    agentId: 'architect',
    agentName: 'System Architect',
    text: '$ vault-cli --partition wiki/ --reindex --depth 3',
    type: 'cmd',
    exitCode: 0
  },
  {
    id: 'log-8',
    timestamp: '03:49:48',
    mode: 'command',
    agentId: 'architect',
    agentName: 'System Architect',
    text: 'Indexed 1,420 wiki markdown blocks. Average query latency 0.42ms.',
    type: 'output',
    exitCode: 0
  }
];

export const INITIAL_VAULT_NODES: VaultNode[] = [
  // raw/ partition (Unstructured / Ingested)
  {
    id: 'node-raw-1',
    name: 'client_discovery_call_2026.txt',
    partition: 'raw',
    path: 'raw/transcripts/client_discovery_call_2026.txt',
    sizeKb: 148,
    tokens: 38200,
    lastIndexed: '2026-10-14 02:15',
    connections: ['node-wiki-1', 'node-wiki-2'],
    x: -80,
    y: 40,
    z: -30,
    summary: 'Audio transcription containing executive requirements for OpenMausBot zero-fatigue workflow.'
  },
  {
    id: 'node-raw-2',
    name: 'market_intelligence_q3.json',
    partition: 'raw',
    path: 'raw/benchmarks/market_intelligence_q3.json',
    sizeKb: 310,
    tokens: 72400,
    lastIndexed: '2026-10-14 01:40',
    connections: ['node-wiki-3'],
    x: -120,
    y: -50,
    z: 20,
    summary: 'Raw competitive vector embeddings across 14 enterprise multi-agent frameworks.'
  },
  {
    id: 'node-raw-3',
    name: 'hardware_telemetry_dump.log',
    partition: 'raw',
    path: 'raw/telemetry/hardware_telemetry_dump.log',
    sizeKb: 890,
    tokens: 184000,
    lastIndexed: '2026-10-14 03:00',
    connections: ['node-wiki-4'],
    x: -60,
    y: -90,
    z: -60,
    summary: 'Neural coprocessor power draw and thermal profiles under continuous 7-agent load.'
  },

  // wiki/ partition (Synthesized Living Knowledge)
  {
    id: 'node-wiki-1',
    name: 'architecture_c4_system.md',
    partition: 'wiki',
    path: 'wiki/architecture/architecture_c4_system.md',
    sizeKb: 84,
    tokens: 21900,
    lastIndexed: '2026-10-14 03:22',
    connections: ['node-raw-1', 'node-out-1', 'node-out-2'],
    x: 10,
    y: 20,
    z: 10,
    summary: 'Living C4 architectural definition for OpenMausBot OM-7 Arc Core and multi-agent IPC bus.'
  },
  {
    id: 'node-wiki-2',
    name: 'squad_sop_protocols_v4.md',
    partition: 'wiki',
    path: 'wiki/operations/squad_sop_protocols_v4.md',
    sizeKb: 62,
    tokens: 14800,
    lastIndexed: '2026-10-14 02:50',
    connections: ['node-raw-1', 'node-out-1'],
    x: 40,
    y: -40,
    z: 50,
    summary: 'Standard operating procedures for autonomous handoffs between CEO, PM, and Senior Dev.'
  },
  {
    id: 'node-wiki-3',
    name: 'design_tokens_hud_2026.json',
    partition: 'wiki',
    path: 'wiki/design/design_tokens_hud_2026.json',
    sizeKb: 45,
    tokens: 9800,
    lastIndexed: '2026-10-14 03:30',
    connections: ['node-out-3'],
    x: 60,
    y: 60,
    z: -40,
    summary: 'Electric Cyan (#00F0FF), Arc Amber (#FFAA00), and obsidian color token specifications.'
  },
  {
    id: 'node-wiki-4',
    name: 'sandbox_boundary_rules.md',
    partition: 'wiki',
    path: 'wiki/security/sandbox_boundary_rules.md',
    sizeKb: 38,
    tokens: 8400,
    lastIndexed: '2026-10-14 01:10',
    connections: ['node-raw-3'],
    x: -20,
    y: 80,
    z: 40,
    summary: 'Drive C: read-only containment guarantees and exit code 0 automated verification invariants.'
  },

  // outputs/ partition (Approved Deliverables)
  {
    id: 'node-out-1',
    name: 'executive_board_briefing_q4.pdf',
    partition: 'outputs',
    path: 'outputs/briefings/executive_board_briefing_q4.pdf',
    sizeKb: 1240,
    tokens: 31000,
    lastIndexed: '2026-10-13 18:00',
    connections: ['node-wiki-1', 'node-wiki-2'],
    x: 110,
    y: -20,
    z: -10,
    summary: 'Final signed board deck on zero-fatigue enterprise scaling and operational autonomy.'
  },
  {
    id: 'node-out-2',
    name: 'openmaus_mission_control_v2.bundle',
    partition: 'outputs',
    path: 'outputs/builds/openmaus_mission_control_v2.bundle',
    sizeKb: 3450,
    tokens: 68000,
    lastIndexed: '2026-10-14 03:45',
    connections: ['node-wiki-1'],
    x: 90,
    y: 70,
    z: 30,
    summary: 'Production-ready JARVIS Mission Control distribution payload for OpenMausBot desktop runtime.'
  },
  {
    id: 'node-out-3',
    name: 'design_system_tokens_export.css',
    partition: 'outputs',
    path: 'outputs/tokens/design_system_tokens_export.css',
    sizeKb: 28,
    tokens: 5200,
    lastIndexed: '2026-10-14 03:15',
    connections: ['node-wiki-3'],
    x: 130,
    y: 30,
    z: -50,
    summary: 'Compiled CSS variables and Tailwind utility mapping for OpenMausBot native desktop client.'
  }
];
