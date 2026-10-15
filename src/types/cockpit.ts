export type AgentId = 
  | 'ceo' 
  | 'pm' 
  | 'ba' 
  | 'designer' 
  | 'architect' 
  | 'dev' 
  | 'qa';

export interface AgentInfo {
  id: AgentId;
  name: string;
  codename: string;
  role: string;
  mandate: string;
  status: 'ACTIVE' | 'EXECUTING' | 'VERIFYING' | 'IDLE';
  loadPercent: number;
  taskQueueCount: number;
  currentTask: string;
  completedTasks: number;
  avatarColor: string;
  accentColor: string;
  scheduleLabel: string;
  recentOutput?: string;
}

export interface StreamLogEntry {
  id: string;
  timestamp: string;
  mode: 'reasoning' | 'command';
  agentId?: AgentId;
  agentName?: string;
  text: string;
  type: 'thought' | 'consensus' | 'cmd' | 'output' | 'success' | 'warn' | 'error';
  exitCode?: number;
}

export interface VaultNode {
  id: string;
  name: string;
  partition: 'raw' | 'wiki' | 'outputs';
  path: string;
  sizeKb: number;
  tokens: number;
  lastIndexed: string;
  connections: string[];
  x: number;
  y: number;
  z: number;
  summary: string;
}

export type CockpitTab = 'mission_control' | AgentId;

export type QuickTriggerAction = 
  | 'DEPLOY AGENTS'
  | 'SYNC VAULT'
  | 'RUN WORKFLOW'
  | 'PURGE CACHE'
  | 'OPTIMIZE PATH'
  | 'SYNTHESIZE SQUAD'
  | 'STRESS-TEST CORE'
  | 'PRUNE STALE MEMORY'
  | 'RE-BALANCE LOAD'
  | 'EXECUTE PIPELINE'
  | 'SCAN'
  | 'OPTIMIZE'
  | 'PROTECT'
  | 'RESTORE'
  | 'EVOLVE'
  | 'CUSTOM_CLI';

