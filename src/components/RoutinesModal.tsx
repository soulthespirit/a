import React from 'react';
import { 
  X, 
  Calendar, 
  Zap, 
  Grid, 
  Clock, 
  CheckCircle2, 
  Play, 
  Settings,
  ExternalLink
} from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

interface RoutinesModalProps {
  type: 'routines' | 'triggers' | 'apps' | null;
  onClose: () => void;
}

export const RoutinesModal: React.FC<RoutinesModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-[#0C121D] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0E1624] border-b border-cyan-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'routines' ? (
              <Calendar className="w-4 h-4 text-cyan-400" />
            ) : type === 'triggers' ? (
              <Zap className="w-4 h-4 text-amber-400" />
            ) : (
              <Grid className="w-4 h-4 text-purple-400" />
            )}
            <h3 className="text-sm font-bold text-white font-hud tracking-wide uppercase">
              {type === 'routines' ? 'Scheduled Routines' : type === 'triggers' ? 'Automated Triggers' : 'Installed Apps & Integrations'}
            </h3>
          </div>
          <button
            onClick={() => {
              soundFx.playClick(900);
              onClose();
            }}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {type === 'routines' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#111827] border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Daily Executive Triage</div>
                  <div className="text-[11px] text-neutral-400 font-mono">Chief of Staff • Every morning at 07:30</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#111827] border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">RAG Vault Vector Re-index</div>
                  <div className="text-[11px] text-neutral-400 font-mono">System Architect • Every 2 hours</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#111827] border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Market Scraping & Benchmark Sync</div>
                  <div className="text-[11px] text-neutral-400 font-mono">Business Analyst • Every 30 minutes</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SCHEDULED
                </span>
              </div>
            </div>
          )}

          {type === 'triggers' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#111827] border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">On Git Push → Run QA Safety Audit</div>
                  <div className="text-[11px] text-neutral-400 font-mono">Triggers QA Auditor & Senior Dev verify loop</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WATCHING
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#111827] border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">On Calendar Conflict → Autonomous Reschedule</div>
                  <div className="text-[11px] text-neutral-400 font-mono">Triggers CEO Pearl de-conflict solver</div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ARMED
                </span>
              </div>
            </div>
          )}

          {type === 'apps' && (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#111827] border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-hud">
                    OM
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">OpenMausBot Desktop Runtime</div>
                    <div className="text-[11px] text-neutral-400">Core Native Shell v2026.4</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-cyan-300">CONNECTED</span>
              </div>

              <div className="p-3 rounded-xl bg-[#111827] border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-hud">
                    G
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Google GenAI Pro Engine</div>
                    <div className="text-[11px] text-neutral-400">Gemini 3.8 Flash SDK</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-300">ACTIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#0A0E18] border-t border-neutral-800/80 flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick(900);
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
