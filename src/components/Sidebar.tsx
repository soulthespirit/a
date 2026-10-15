import React, { useState } from 'react';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  Calendar, 
  Zap, 
  Grid, 
  Pin, 
  Activity,
  Bot as BotIcon,
  Laptop
} from 'lucide-react';
import { AgentInfo, AgentId, CockpitTab } from '../types/cockpit';
import { soundFx } from '../utils/audioSynthesizer';

interface SidebarProps {
  agents: AgentInfo[];
  activeTab: CockpitTab;
  onSelectTab: (tab: CockpitTab) => void;
  onOpenModal: (type: 'routines' | 'triggers' | 'apps') => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  agents,
  activeTab,
  onSelectTab,
  onOpenModal
}) => {
  const [botsAccordionOpen, setBotsAccordionOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (tab: CockpitTab) => {
    soundFx.playClick(1100);
    onSelectTab(tab);
  };

  return (
    <aside className="w-[256px] min-w-[256px] h-screen bg-[#0A0E15] border-r border-cyan-950/30 flex flex-col justify-between select-none z-20">
      {/* Top Section */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* macOS Window Controls & Computer Picker */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between">
          {/* Window control dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-black/20 hover:opacity-80 cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-black/20 hover:opacity-80 cursor-pointer" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-black/20 hover:opacity-80 cursor-pointer" />
          </div>

          {/* Computer Picker Dropdown */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => soundFx.playClick(800)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/60 transition-colors"
            >
              <Laptop className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-medium text-[12px]">This computer</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
            <button 
              onClick={() => soundFx.playClick(1200)}
              title="Add bot or connection"
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sleek Dark Pill Search Bar */}
        <div className="px-3 py-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#121620] text-neutral-200 placeholder-neutral-500 rounded-lg border border-neutral-800/80 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-xs text-neutral-500 hover:text-neutral-300"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ⭐ PINNED OVERVIEW SECTION */}
        <div className="px-3 pt-2 pb-1.5">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold tracking-wider text-cyan-400/90 font-hud">
            <div className="flex items-center gap-1.5">
              <Pin className="w-3 h-3 text-[#00F0FF] fill-[#00F0FF]/30 rotate-45" />
              <span>PINNED OVERVIEW</span>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-cyan-300 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-ping" />
              LIVE
            </span>
          </div>

          {/* Mission Control [JARVIS] Pinned Item */}
          <button
            onClick={() => handleSelect('mission_control')}
            className={`w-full mt-1 px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left transition-all relative ${
              activeTab === 'mission_control'
                ? 'bg-gradient-to-r from-cyan-950/60 to-cyan-900/30 border border-[#00F0FF]/40 text-white shadow-[0_0_15px_rgba(0,240,255,0.18)]'
                : 'text-neutral-300 hover:bg-neutral-800/40 hover:text-white border border-transparent'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              activeTab === 'mission_control' 
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_8px_rgba(0,240,255,0.4)]' 
                : 'bg-neutral-800 text-neutral-400'
            }`}>
              <Activity className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white tracking-tight truncate">
                  Mission Control
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                  JARVIS
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/70 truncate">
                OM-7 Arc Core • 7 Agents
              </p>
            </div>

            {activeTab === 'mission_control' && (
              <div className="w-1.5 h-4 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF] absolute right-1.5" />
            )}
          </button>
        </div>

        {/* Separator */}
        <div className="px-4 py-1">
          <div className="h-px bg-neutral-800/60" />
        </div>

        {/* Collapsible Bots List Accordion */}
        <div className="flex-1 min-h-0 px-3 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-1.5 text-xs text-neutral-400">
            <button
              onClick={() => setBotsAccordionOpen(!botsAccordionOpen)}
              className="flex items-center gap-1 font-medium hover:text-neutral-200 transition-colors"
            >
              <span>Bots</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${botsAccordionOpen ? '' : '-rotate-90'}`} />
            </button>
            <span className="text-[10px] font-mono text-neutral-500">7 active</span>
          </div>

          {botsAccordionOpen && (
            <div className="space-y-1 mt-1">
              {filteredAgents.map((agent) => {
                const isActive = activeTab === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelect(agent.id)}
                    className={`w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left transition-all group ${
                      isActive
                        ? 'bg-neutral-800/90 text-white border border-neutral-700'
                        : 'text-neutral-300 hover:bg-neutral-800/40 hover:text-white'
                    }`}
                  >
                    {/* Bot Origami Icon with distinct color */}
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${agent.avatarColor}25`,
                        color: agent.accentColor,
                        border: `1px solid ${agent.avatarColor}50`
                      }}
                    >
                      <BotIcon className="w-4 h-4" />
                    </div>

                    {/* Bot Name and Schedule Subtitle */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-neutral-200 truncate group-hover:text-white">
                          {agent.name.split(' / ')[0]}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                          {agent.scheduleLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {agent.currentTask}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation: Routines, Triggers, Apps */}
      <div className="p-3 border-t border-neutral-800/70 bg-[#080B10]/80">
        <div className="space-y-0.5">
          <button 
            onClick={() => {
              soundFx.playClick(900);
              onOpenModal('routines');
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-colors"
          >
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span className="font-medium">Routines</span>
          </button>

          <button 
            onClick={() => {
              soundFx.playClick(950);
              onOpenModal('triggers');
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-400/80" />
            <span className="font-medium">Triggers</span>
          </button>

          <button 
            onClick={() => {
              soundFx.playClick(1000);
              onOpenModal('apps');
            }}
            className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800/50 transition-colors"
          >
            <Grid className="w-4 h-4 text-cyan-400/80" />
            <span className="font-medium">Apps</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
