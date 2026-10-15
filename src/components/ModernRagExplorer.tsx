import React, { useState } from 'react';
import { 
  Database, 
  FileText, 
  FolderTree, 
  HardDrive, 
  Search, 
  Sparkles, 
  Layers, 
  Share2, 
  CheckCircle2, 
  ExternalLink,
  Tag
} from 'lucide-react';
import { VaultNode } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

interface ModernRagExplorerProps {
  nodes: VaultNode[];
  selectedNode: VaultNode | null;
  onSelectNode: (node: VaultNode) => void;
  onReindexNode: (nodeId: string) => void;
}

export const ModernRagExplorer: React.FC<ModernRagExplorerProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  onReindexNode
}) => {
  const [partitionFilter, setPartitionFilter] = useState<'all' | 'raw' | 'wiki' | 'outputs'>('all');
  const [search, setSearch] = useState('');

  const filtered = nodes.filter(n => {
    if (partitionFilter !== 'all' && n.partition !== partitionFilter) return false;
    if (search && !n.name.toLowerCase().includes(search.toLowerCase()) && !n.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-[#0D1117] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col h-full select-none">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] bg-[#101520] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Database className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">
              KARPATHY RAG MEMORY VAULT
            </h2>
            <p className="text-[11px] text-neutral-400">
              Drive E:\ · 8.4M+ indexed knowledge nodes
            </p>
          </div>
        </div>

        {/* Partition Tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.06] text-xs">
          <button
            onClick={() => {
              soundFx.playClick(900);
              setPartitionFilter('all');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              partitionFilter === 'all' ? 'bg-white/[0.1] text-white font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              soundFx.playClick(900);
              setPartitionFilter('raw');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              partitionFilter === 'raw' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            raw/
          </button>
          <button
            onClick={() => {
              soundFx.playClick(900);
              setPartitionFilter('wiki');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              partitionFilter === 'wiki' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            wiki/
          </button>
          <button
            onClick={() => {
              soundFx.playClick(900);
              setPartitionFilter('outputs');
            }}
            className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              partitionFilter === 'outputs' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            outputs/
          </button>
        </div>
      </div>

      {/* Search & Storage Meter */}
      <div className="px-4 py-2 border-b border-white/[0.06] bg-black/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memory documents..."
            className="w-full pl-8 pr-3 py-1 bg-black/40 text-neutral-200 placeholder-neutral-500 rounded-lg border border-white/[0.08] focus:outline-none focus:border-white/20 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
          <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
          <span>DRIVE E:\ 142.8 GB / 500 GB (28.5%)</span>
        </div>
      </div>

      {/* Documents List & Selected Inspector Split */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
        {/* Document Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filtered.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                onClick={() => {
                  soundFx.playNodeSelect();
                  onSelectNode(node);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/[0.08] border-white/20 shadow-md'
                    : 'bg-[#121722]/80 hover:bg-[#161D2A] border-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-4 h-4 shrink-0 ${
                      node.partition === 'raw' ? 'text-amber-400' :
                      node.partition === 'wiki' ? 'text-cyan-400' : 'text-emerald-400'
                    }`} />
                    <span className="font-semibold text-white text-xs truncate">
                      {node.name}
                    </span>
                  </div>

                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                    node.partition === 'raw' ? 'bg-amber-500/10 text-amber-300' :
                    node.partition === 'wiki' ? 'bg-cyan-500/10 text-cyan-300' : 'bg-emerald-500/10 text-emerald-300'
                  }`}>
                    {node.partition}/
                  </span>
                </div>

                <div className="text-[11px] text-neutral-400 mt-1.5 line-clamp-2">
                  {node.summary}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-white/[0.04]">
                  <span>{node.sizeKb} KB · {(node.tokens / 1000).toFixed(1)}k tokens</span>
                  <span>Indexed: {node.lastIndexed}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Document Details Inspector */}
        {selectedNode && (
          <div className="w-full md:w-64 p-3.5 bg-black/30 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  MEMORY DOCUMENT INSPECTOR
                </span>
                <h3 className="text-sm font-semibold text-white mt-1">
                  {selectedNode.name}
                </h3>
                <div className="text-[10px] font-mono text-neutral-500 mt-0.5 break-all">
                  {selectedNode.path}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Partition:</span>
                  <span className="text-neutral-200">{selectedNode.partition}/</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">File Size:</span>
                  <span className="text-neutral-200">{selectedNode.sizeKb} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Embedding Tokens:</span>
                  <span className="text-neutral-200">{selectedNode.tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Last Synced:</span>
                  <span className="text-neutral-200">{selectedNode.lastIndexed}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-neutral-500 block mb-1">
                  SEMANTIC EXTRACT:
                </span>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-neutral-300 leading-relaxed">
                  {selectedNode.summary}
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={() => {
                  soundFx.playDataChirp();
                  onReindexNode(selectedNode.id);
                }}
                className="w-full py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.1] text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Re-index Vector Node</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
