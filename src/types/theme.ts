export type ModernTheme = 'linear-pro' | 'aerospace' | 'cyber-glass';

export interface ThemeConfig {
  id: ModernTheme;
  name: string;
  tagline: string;
  badge: string;
  bgCanvas: string;
  bgPanel: string;
  bgCard: string;
  borderSubtle: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGlow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  coreStyle: 'vector' | 'industrial' | 'hologram';
}

export const THEMES: Record<ModernTheme, ThemeConfig> = {
  'linear-pro': {
    id: 'linear-pro',
    name: 'Linear Pro Obsidian',
    tagline: 'Minimalist titanium surfaces, razor-sharp ice-blue accents & zero slop',
    badge: 'RECOMMENDED',
    bgCanvas: '#05070A',
    bgPanel: '#0A0D14',
    bgCard: '#0F131D',
    borderSubtle: 'rgba(255, 255, 255, 0.07)',
    accentPrimary: '#38BDF8', // Ice Blue
    accentSecondary: '#818CF8', // Indigo
    accentGlow: 'rgba(56, 189, 248, 0.15)',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    coreStyle: 'vector'
  },
  'aerospace': {
    id: 'aerospace',
    name: 'Industrial Aerospace',
    tagline: 'Teenage Engineering telemetry, safety amber & matte carbon grid',
    badge: 'TECHNICAL',
    bgCanvas: '#090B0E',
    bgPanel: '#0E1217',
    bgCard: '#131820',
    borderSubtle: 'rgba(245, 158, 11, 0.18)',
    accentPrimary: '#F59E0B', // Safety Amber
    accentSecondary: '#10B981', // Emerald
    accentGlow: 'rgba(245, 158, 11, 0.2)',
    textPrimary: '#FAFAF9',
    textSecondary: '#A8A29E',
    textMuted: '#78716C',
    coreStyle: 'industrial'
  },
  'cyber-glass': {
    id: 'cyber-glass',
    name: 'Cybernetic Frosted Glass',
    tagline: 'Deep translucent obsidian glass, refractive borders & subtle luminescence',
    badge: 'AVANT-GARDE',
    bgCanvas: '#040711',
    bgPanel: 'rgba(10, 16, 28, 0.75)',
    bgCard: 'rgba(15, 23, 42, 0.65)',
    borderSubtle: 'rgba(56, 189, 248, 0.2)',
    accentPrimary: '#00F0FF', // Electric Cyan
    accentSecondary: '#A855F7', // Purple
    accentGlow: 'rgba(0, 240, 255, 0.25)',
    textPrimary: '#FFFFFF',
    textSecondary: '#93C5FD',
    textMuted: '#64748B',
    coreStyle: 'hologram'
  }
};
