import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronDown, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  MoreHorizontal,
  Radio,
  Bot,
  Calendar,
  Zap,
  Grid,
  Check
} from 'lucide-react';
import { AgentInfo, CockpitTab, QuickTriggerAction } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';
import { NeuralKnowledgeSearch } from './NeuralKnowledgeSearch';

interface TopHeaderProps {
  currentViewTitle: string;
  isMissionControl: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  audioVolume: number;
  onChangeVolume: (vol: number) => void;
  agents?: AgentInfo[];
  activeTab?: CockpitTab;
  onSelectTab?: (tab: CockpitTab) => void;
  onOpenModal?: (type: 'routines' | 'triggers' | 'apps') => void;
  onNavigateToVault?: (nodeId: string, query?: string) => void;
  onExecuteTrigger?: (action: QuickTriggerAction) => void;
  onSubmitCommand?: (cmd: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentViewTitle,
  isMissionControl,
  isFullscreen,
  onToggleFullscreen,
  audioEnabled,
  onToggleAudio,
  audioVolume,
  onChangeVolume,
  agents = [],
  activeTab = 'mission_control',
  onSelectTab,
  onOpenModal,
  onNavigateToVault,
  onExecuteTrigger,
  onSubmitCommand
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [soundMenuOpen, setSoundMenuOpen] = useState(false);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);

  return (
    <header className="h-12 min-h-12 px-3.5 bg-[#080B14]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between select-none z-30 shrink-0">
      {/* Left Zone: Window Controls, Logo, View Nav & Agent Switcher */}
      <div className="flex items-center gap-3 text-xs">
        {/* macOS Window Controls */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-white/[0.08]">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/20 hover:opacity-80 cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/20 hover:opacity-80 cursor-pointer" />
          <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/20 hover:opacity-80 cursor-pointer" />
        </div>

        {/* Brand & Mission Control Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onSelectTab) {
                soundFx.playClick(1200);
                onSelectTab('mission_control');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isMissionControl
                ? 'bg-[#ff8a1f]/20 border border-[#ff8a1f]/50 text-white shadow-[0_0_12px_rgba(255,138,31,0.35)]'
                : 'hover:bg-white/[0.06] text-neutral-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#ff8a1f] animate-pulse" />
            <span className="font-condensed tracking-wider font-bold text-sm">OPEN MAUSE <span className="text-[#ff8a1f]">BOT</span></span>
          </button>
        </div>

        {/* Agent Switcher Dropdown */}
        {agents.length > 0 && onSelectTab && (
          <div className="relative">
            <button
              onClick={() => {
                soundFx.playClick(1000);
                setAgentDropdownOpen(!agentDropdownOpen);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-neutral-300 transition-all font-mono"
            >
              <Bot className="w-3.5 h-3.5 text-[#ff8a1f]" />
              <span>{isMissionControl ? 'Swarm Agents (7)' : currentViewTitle}</span>
              <ChevronDown className="w-3 h-3 text-neutral-500" />
            </button>

            {agentDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 py-1.5 bg-[#0E1520] border border-[#ff8a1f]/30 rounded-xl shadow-2xl z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-mono text-neutral-400 border-b border-neutral-800 flex justify-between">
                  <span>SWARM AGENT MATRIX</span>
                  <span className="text-[#46e39a]">7 ONLINE</span>
                </div>

                <button
                  onClick={() => {
                    onSelectTab('mission_control');
                    setAgentDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/[0.06] ${
                    isMissionControl ? 'bg-[#ff8a1f]/15 text-[#ffb259]' : 'text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff8a1f]" />
                    <span className="font-semibold text-white">JARVIS Mission Control</span>
                  </div>
                  {isMissionControl && <Check className="w-3.5 h-3.5 text-[#ff8a1f]" />}
                </button>

                <div className="h-[1px] bg-neutral-800 my-1" />

                {agents.map((ag) => (
                  <button
                    key={ag.id}
                    onClick={() => {
                      onSelectTab(ag.id);
                      setAgentDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-white/[0.06] ${
                      activeTab === ag.id ? 'bg-[#ff8a1f]/15 text-[#ffb259]' : 'text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ag.accentColor || ag.avatarColor || '#ff8a1f' }} />
                      <div className="truncate">
                        <div className="font-medium text-white truncate">{ag.name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono truncate">{ag.role}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#ffb259] shrink-0">{ag.loadPercent}%</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Modal Launcher Buttons */}
        {onOpenModal && (
          <div className="hidden md:flex items-center gap-1 border-l border-white/[0.08] pl-2 font-mono text-[11px]">
            <button
              onClick={() => {
                soundFx.playClick(1050);
                onOpenModal('routines');
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Autonomous Routines"
            >
              <Calendar className="w-3 h-3 text-[#ffb259]" />
              <span>Routines</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick(1050);
                onOpenModal('triggers');
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Automation Triggers"
            >
              <Zap className="w-3 h-3 text-[#ff8a1f]" />
              <span>Triggers</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick(1050);
                onOpenModal('apps');
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Connected Apps & Integrations"
            >
              <Grid className="w-3 h-3 text-cyan-400" />
              <span>Apps</span>
            </button>
            <button
              onClick={() => {
                soundFx.playClick(1150);
                onSelectTab?.('ceo');
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
              title="Open Gemini Chatbot (Multi-Turn Agent Chat)"
            >
              <Bot className="w-3 h-3 text-amber-400" />
              <span>Gemini Chat</span>
            </button>
          </div>
        )}

        {isMissionControl && (
          <div className="hidden lg:flex items-center gap-2 ml-2 px-2 py-0.5 rounded bg-black/40 border border-[#ff8a1f]/20 text-[10px] font-mono text-neutral-300">
            <Radio className="w-3 h-3 text-[#ff8a1f] animate-pulse" />
            <span className="text-[#ffb259]">UNIFIED HYBRID CORE</span>
            <span className="text-neutral-600">|</span>
            <span>142.8 GHz</span>
            <span className="text-neutral-600">|</span>
            <span className="text-cyan-300">1.8ms</span>
          </div>
        )}
      </div>

      {/* Center Zone: Global Neural Knowledge Search (Karpathy RAG Memory Vault) */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-2 flex justify-center z-40">
        <NeuralKnowledgeSearch 
          onNavigateToVault={onNavigateToVault} 
          onExecuteTrigger={onExecuteTrigger}
          onSubmitCommand={onSubmitCommand}
          onOpenModal={onOpenModal}
          className="w-full max-w-sm sm:max-w-md" 
        />
      </div>

      {/* Right Zone: Model Pill & Utility Controls */}
      <div className="flex items-center gap-2.5">
        {/* Active Model Dropdown Pill */}
        <div className="relative">
          <button
            onClick={() => {
              soundFx.playClick(1000);
              setModelDropdownOpen(!modelDropdownOpen);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#131A26] hover:bg-[#1A2333] border border-white/[0.1] text-xs text-neutral-200 transition-all"
          >
            <Sparkles className="w-3 h-3 text-[#FFB300]" />
            <span className="font-medium text-white">Gemini 3.8 Flash</span>
            <span className="text-[10px] text-neutral-400 font-mono">(Google AI Pro)</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {modelDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 py-1.5 bg-[#0E1520] border border-white/[0.15] rounded-xl shadow-2xl z-50 text-xs">
              <div className="px-3 py-1 text-[10px] font-mono text-neutral-400 border-b border-neutral-800">
                ACTIVE REASONING ENGINE
              </div>
              <button 
                onClick={() => setModelDropdownOpen(false)}
                className="w-full px-3 py-2 text-left flex items-center justify-between bg-amber-500/10 text-amber-300"
              >
                <div>
                  <div className="font-semibold text-white">✦ Gemini 3.8 Flash</div>
                  <div className="text-[10px] text-neutral-400">Low-latency thinking (1.8ms)</div>
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">ACTIVE</span>
              </button>
            </div>
          )}
        </div>

        {/* Futuristic Audio HUD Synthesizer Toggle */}
        <div className="relative">
          <button
            onClick={() => {
              onToggleAudio();
              soundFx.playClick(audioEnabled ? 700 : 1200);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setSoundMenuOpen(!soundMenuOpen);
            }}
            title={audioEnabled ? "Futuristic HUD Audio: ON (Right click for volume)" : "Futuristic HUD Audio: MUTED"}
            className={`p-1.5 rounded-lg border transition-all ${
              audioEnabled 
                ? 'bg-amber-500/20 border-amber-500/40 text-[#FFB300]' 
                : 'bg-neutral-800/60 border-neutral-700/60 text-neutral-500'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {soundMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 p-2.5 bg-[#0E1520] border border-white/[0.15] rounded-xl shadow-2xl z-50 text-xs">
              <div className="flex items-center justify-between text-[11px] mb-2 font-mono text-amber-300">
                <span>HUD VOLUME</span>
                <span>{Math.round(audioVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="w-full accent-[#FFB300]"
              />
            </div>
          )}
        </div>

        {/* Fullscreen / Display Mode Toggle */}
        <button
          onClick={() => {
            soundFx.playClick(1100);
            onToggleFullscreen();
          }}
          title={isFullscreen ? "Exit Fullscreen" : "Maximize Cockpit"}
          className="p-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-400 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* More Options */}
        <button
          onClick={() => soundFx.playClick(900)}
          className="p-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-400 hover:text-white transition-colors"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
