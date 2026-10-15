import React, { useState } from 'react';
import { Sparkles, Sliders, Check, Eye, Layers, ShieldCheck, Palette, Info } from 'lucide-react';
import { ModernTheme, THEMES } from '../types/theme';
import { soundFx } from '../utils/audioSynthesizer';

interface DesignSampleSwitcherProps {
  currentTheme: ModernTheme;
  onSelectTheme: (theme: ModernTheme) => void;
}

export const DesignSampleSwitcher: React.FC<DesignSampleSwitcherProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const themeList: ModernTheme[] = ['linear-pro', 'aerospace', 'cyber-glass'];

  return (
    <div className="w-full bg-[#080B10] border-b border-white/[0.08] px-4 py-2 select-none z-30 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Design Sample Switcher Headline */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-sky-400">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white tracking-tight flex items-center gap-2">
              <span>VISUAL DESIGN SAMPLE SHOWCASE</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                LIVE INTERACTIVE
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Click any sample below to see the entire cockpit instantly re-styled in real time:
            </p>
          </div>
        </div>

        {/* Center/Right: The 3 Design Sample Switcher Cards */}
        <div className="flex items-center gap-2">
          {themeList.map((themeId) => {
            const config = THEMES[themeId];
            const isSelected = currentTheme === themeId;

            return (
              <button
                key={themeId}
                onClick={() => {
                  soundFx.playClick(1300);
                  onSelectTheme(themeId);
                }}
                className={`relative px-3 py-1.5 rounded-lg text-left transition-all border flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-white/[0.08] border-white/20 text-white shadow-lg shadow-black/40'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.06] text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {/* Visual Swatch Pill */}
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-transform"
                  style={{
                    backgroundColor: config.accentPrimary,
                    boxShadow: isSelected ? `0 0 8px ${config.accentPrimary}` : 'none'
                  }}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium tracking-tight whitespace-nowrap text-white">
                      {config.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-sky-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 hidden sm:block truncate">
                    {config.badge}
                  </div>
                </div>

                {isSelected && (
                  <div 
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ backgroundColor: config.accentPrimary }}
                  />
                )}
              </button>
            );
          })}

          {/* Toggle Design Specs Drawer */}
          <button
            onClick={() => {
              soundFx.playClick(900);
              setDetailsOpen(!detailsOpen);
            }}
            title="Inspect design specifications & anti-slop rules"
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-400 hover:text-white transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Design Specification Details */}
      {detailsOpen && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-neutral-300 bg-white/[0.01] p-3 rounded-lg">
          <div className="space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Sample 1: Linear Pro Obsidian
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Eliminates cartoon gradients. Uses 1px top specular hairlines, pure dark titanium surfaces, razor-sharp ice-blue laser accents, and ultra-crisp tabular numbers.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Sample 2: Industrial Aerospace
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Teenage Engineering / flight telemetry style. High-density monospace columns, tactile hardware switches, safety amber gauges, and structured C4 data matrices.
            </p>
          </div>

          <div className="space-y-1">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Sample 3: Cybernetic Frosted Glass
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Ultra-modern glassmorphic depth (`backdrop-blur-2xl`), subtle edge specular reflections, and diffused dark ambient luminescence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
