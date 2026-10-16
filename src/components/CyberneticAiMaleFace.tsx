import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, Check, X, Sliders, Zap, Copy, Shield, Cpu, Activity } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

const STORAGE_KEY = 'openmause_ai_core_face_url';
const VISUAL_MODE_KEY = 'openmause_ai_core_visual_mode';
const TINT_KEY = 'openmause_ai_core_tint_mode';
const LASER_STATE_KEY = 'openmause_ai_core_lasers_active';

export type VisualMode = 'neural_cyber_head' | 'custom_image';
export type TintMode = 'cyberpunk_duo' | 'cyber_amber' | 'cyan_matrix' | 'quantum_violet';

interface CyberneticAiMaleFaceProps {
  isBurst?: boolean;
  className?: string;
  onOpenModalExternal?: () => void;
}

export const CyberneticAiMaleFace: React.FC<CyberneticAiMaleFaceProps> = ({
  isBurst = false,
  className = ''
}) => {
  // Visual mode: 'neural_cyber_head' (matches prompt: transparent head, glowing brain, overhead lasers) or 'custom_image'
  const [visualMode, setVisualMode] = useState<VisualMode>(() => {
    return (localStorage.getItem(VISUAL_MODE_KEY) as VisualMode) || 'neural_cyber_head';
  });

  const [customImageUrl, setCustomImageUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  const [tintMode, setTintMode] = useState<TintMode>(() => {
    return (localStorage.getItem(TINT_KEY) as TintMode) || 'cyberpunk_duo';
  });

  const [lasersActive, setLasersActive] = useState<boolean>(() => {
    const saved = localStorage.getItem(LASER_STATE_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(VISUAL_MODE_KEY, visualMode);
  }, [visualMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, customImageUrl);
  }, [customImageUrl]);

  useEffect(() => {
    localStorage.setItem(TINT_KEY, tintMode);
  }, [tintMode]);

  useEffect(() => {
    localStorage.setItem(LASER_STATE_KEY, String(lasersActive));
  }, [lasersActive]);

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file (JPG, PNG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomImageUrl(result);
        setVisualMode('custom_image');
        setImageError(false);
        soundFx.playTriggerChime();
        showNotification('Custom image loaded successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please drop a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomImageUrl(result);
        setVisualMode('custom_image');
        setImageError(false);
        soundFx.playTriggerChime();
        showNotification('Picture applied to AI Core!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;

    setCustomImageUrl(customUrlInput.trim());
    setVisualMode('custom_image');
    setImageError(false);
    setCustomUrlInput('');
    soundFx.playTriggerChime();
    showNotification('Image URL applied!');
  };

  const handleCopyPrompt = () => {
    const promptText = `A futuristic front-facing portrait of a human head, showcasing a highly detailed, glowing brain infused with holographic neural networks, microchips, and embedded electronic circuit boards. Overhead, multiple high-tech robotic lasers and surgical probes point intense beams of light directly into the top of the brain. The entire face and body are semi-transparent, intricately constructed from glowing neon blue and amber data streams, particles, and fiber optic wiring. Cyberpunk digital art style, symmetric composition, dark background with soft bokeh lights, cinematic lighting, 8k resolution.`;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    soundFx.playTriggerChime();
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleResetToNeuralRender = () => {
    setVisualMode('neural_cyber_head');
    soundFx.playClick();
    showNotification('Active: Procedural Cybernetic Brain & Overhead Lasers');
  };

  // Color theme variables based on tintMode
  const getThemeColors = () => {
    switch (tintMode) {
      case 'cyber_amber':
        return {
          primary: '#ff9e00',
          secondary: '#ff5500',
          accent: '#ffd000',
          laserBeam1: '#ffb300',
          laserBeam2: '#ff7700',
          brainGlow: '#ff9e00',
          glowShadow: '0 0 25px rgba(255, 158, 0, 0.7)'
        };
      case 'cyan_matrix':
        return {
          primary: '#00f0ff',
          secondary: '#0088ff',
          accent: '#70ffff',
          laserBeam1: '#00f0ff',
          laserBeam2: '#00c3ff',
          brainGlow: '#00f0ff',
          glowShadow: '0 0 25px rgba(0, 240, 255, 0.7)'
        };
      case 'quantum_violet':
        return {
          primary: '#bd00ff',
          secondary: '#ff0077',
          accent: '#00f0ff',
          laserBeam1: '#bd00ff',
          laserBeam2: '#00f0ff',
          brainGlow: '#c800ff',
          glowShadow: '0 0 25px rgba(189, 0, 255, 0.7)'
        };
      case 'cyberpunk_duo':
      default:
        return {
          primary: '#00f0ff', // neon blue
          secondary: '#ff9e00', // amber
          accent: '#ffe177',
          laserBeam1: '#00f0ff',
          laserBeam2: '#ff9e00',
          brainGlow: '#00e1ff',
          glowShadow: '0 0 30px rgba(0, 240, 255, 0.6)'
        };
    }
  };

  const theme = getThemeColors();

  return (
    <div 
      className={`relative w-full h-full select-none ${className}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Circular HUD Portal Container */}
      <div 
        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center group/face cursor-pointer bg-[#050302]"
        onClick={() => {
          soundFx.playTriggerChime();
        }}
      >
        {/* ======================================================== */}
        {/* 1. ATMOSPHERIC BACKGROUND: SOFT BOKEH LIGHTS & DEPTH     */}
        {/* ======================================================== */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Deep dark obsidian vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#0d141f_0%,#080a0f_50%,#030305_95%)]" />

          {/* Floating Bokeh light orbs */}
          <div className="absolute top-[18%] left-[12%] w-14 h-14 rounded-full bg-[#00f0ff]/15 blur-xl animate-bokeh pointer-events-none" />
          <div className="absolute top-[28%] right-[14%] w-16 h-16 rounded-full bg-[#ff9e00]/15 blur-xl animate-bokeh [animation-delay:2s] pointer-events-none" />
          <div className="absolute bottom-[22%] left-[24%] w-20 h-20 rounded-full bg-[#00f0ff]/10 blur-2xl animate-bokeh [animation-delay:4s] pointer-events-none" />
          <div className="absolute bottom-[20%] right-[20%] w-16 h-16 rounded-full bg-[#ff7700]/12 blur-xl animate-bokeh [animation-delay:1.5s] pointer-events-none" />
        </div>

        {/* ======================================================== */}
        {/* 2. MAIN VISUAL: PROCEDURAL CYBERNETIC NEURAL HEAD        */}
        {/* ======================================================== */}
        {visualMode === 'neural_cyber_head' || (visualMode === 'custom_image' && imageError) ? (
          <div className={`relative w-full h-full flex items-center justify-center transition-transform duration-700 ${isBurst ? 'scale-105' : 'scale-100 group-hover/face:scale-[1.02]'}`}>
            {/* SVG HIGH FIDELITY CYBERNETIC VISUAL RENDERING */}
            <svg
              viewBox="0 0 500 500"
              className="w-full h-full object-contain pointer-events-none filter drop-shadow-[0_0_15px_rgba(0,240,255,0.25)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Glowing Brain Linear & Radial Gradients */}
                <radialGradient id="brainCoreGlow" cx="50%" cy="40%" r="55%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="30%" stopColor={theme.primary} stopOpacity="0.85" />
                  <stop offset="65%" stopColor={theme.secondary} stopOpacity="0.65" />
                  <stop offset="90%" stopColor="#05101a" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="laserBeamCyan" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="15%" stopColor="#80f8ff" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#00f0ff" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#0088ff" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="laserBeamAmber" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="15%" stopColor="#ffe680" stopOpacity="0.95" />
                  <stop offset="70%" stopColor="#ff9e00" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#ff5500" stopOpacity="0.85" />
                </linearGradient>

                <radialGradient id="plasmaImpactGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="40%" stopColor="#70ffff" stopOpacity="0.85" />
                  <stop offset="75%" stopColor="#00f0ff" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                </radialGradient>

                <radialGradient id="plasmaImpactAmber" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="40%" stopColor="#ffe488" stopOpacity="0.85" />
                  <stop offset="75%" stopColor="#ff9e00" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#ff5500" stopOpacity="0" />
                </radialGradient>

                {/* Transparent Head Silhouette Gradient */}
                <linearGradient id="transparentHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#ff9e00" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.4" />
                </linearGradient>

                {/* Laser Glow Filter */}
                <filter id="neonGlowLaser" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur1" />
                  <feGaussianBlur stdDeviation="7" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter id="brainHighGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ------------------------------------------------------------------ */}
              {/* LAYER A: TRANSPARENT TORSO & NECK WITH FIBER OPTIC WIRING          */}
              {/* ------------------------------------------------------------------ */}
              <g className="opacity-75">
                {/* Shoulders & Clavicle Silhouette */}
                <path
                  d="M110 470 C 140 430, 180 410, 210 405 L 210 355 C 210 355, 175 320, 175 270"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1.2"
                  strokeDasharray="4,3"
                  opacity="0.45"
                />
                <path
                  d="M390 470 C 360 430, 320 410, 290 405 L 290 355 C 290 355, 325 320, 325 270"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1.2"
                  strokeDasharray="4,3"
                  opacity="0.45"
                />

                {/* Neck Fiber Optic Conduit Cables */}
                <path d="M220 350 Q 225 390 220 450" fill="none" stroke="#ff9e00" strokeWidth="2" opacity="0.65" />
                <path d="M235 345 Q 240 395 238 465" fill="none" stroke="#00f0ff" strokeWidth="1.8" opacity="0.75" />
                <path d="M250 340 L 250 480" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                <path d="M265 345 Q 260 395 262 465" fill="none" stroke="#00f0ff" strokeWidth="1.8" opacity="0.75" />
                <path d="M280 350 Q 275 390 280 450" fill="none" stroke="#ff9e00" strokeWidth="2" opacity="0.65" />

                {/* Vertical Data Stream Particles descending neck */}
                <circle cx="220" cy="400" r="1.5" fill="#ffaa00" className="animate-pulse" />
                <circle cx="235" cy="430" r="1.8" fill="#00f0ff" className="animate-ping" style={{ animationDuration: '2s' }} />
                <circle cx="265" cy="385" r="1.8" fill="#00f0ff" className="animate-ping" style={{ animationDuration: '2.4s' }} />
                <circle cx="280" cy="420" r="1.5" fill="#ffaa00" className="animate-pulse" />
              </g>

              {/* ------------------------------------------------------------------ */}
              {/* LAYER B: TRANSPARENT CYBERNETIC HEAD / JAWLINE / FACIAL WIREFRAME  */}
              {/* ------------------------------------------------------------------ */}
              <g className="head-silhouette">
                {/* Transparent Glass Cranium Dome */}
                <path
                  d="M165 210 C 150 145, 195 90, 250 88 C 305 90, 350 145, 335 210 C 330 255, 315 295, 295 330 L 250 355 L 205 330 C 185 295, 170 255, 165 210 Z"
                  fill="url(#transparentHeadGrad)"
                  stroke="#00f0ff"
                  strokeWidth="1.8"
                  opacity="0.82"
                />

                {/* Cranium Glass Specular Highlight Arc */}
                <path
                  d="M185 140 C 205 105, 250 95, 290 102"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  opacity="0.65"
                />

                {/* Symmetrical Chiseled Jawline & Chin Outline */}
                <path
                  d="M178 260 L 195 305 L 225 335 L 250 348 L 275 335 L 305 305 L 322 260"
                  fill="none"
                  stroke="#ff9e00"
                  strokeWidth="1.6"
                  opacity="0.85"
                />

                {/* Cheekbone & Brow Contours */}
                <path d="M190 230 Q 220 235 240 248" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.6" />
                <path d="M310 230 Q 280 235 260 248" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.6" />

                {/* Nose Bridge Wireframe */}
                <path d="M250 220 L 246 270 L 250 276 L 254 270 Z" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.65" />

                {/* Lips Wireframe line */}
                <path d="M236 300 Q 250 304 264 300" fill="none" stroke="#ff9e00" strokeWidth="1.2" opacity="0.75" />
                <path d="M242 308 Q 250 312 258 308" fill="none" stroke="#ff9e00" strokeWidth="0.8" opacity="0.55" />

                {/* Piercing Luminous Cybernetic Eyes (Ocular Reticles) */}
                {/* Left Eye */}
                <g transform="translate(216, 230)">
                  <circle cx="0" cy="0" r="10" fill="#001826" stroke="#00f0ff" strokeWidth="1.2" opacity="0.9" />
                  <circle cx="0" cy="0" r="5" fill="#00f0ff" className="animate-eye-pulse" />
                  <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
                  {/* Targeting Crosshairs */}
                  <line x1="-12" y1="0" x2="-8" y2="0" stroke="#00f0ff" strokeWidth="1" />
                  <line x1="8" y1="0" x2="12" y2="0" stroke="#00f0ff" strokeWidth="1" />
                  <line x1="0" y1="-12" x2="0" y2="-8" stroke="#00f0ff" strokeWidth="1" />
                  <line x1="0" y1="8" x2="0" y2="12" stroke="#00f0ff" strokeWidth="1" />
                </g>

                {/* Right Eye */}
                <g transform="translate(284, 230)">
                  <circle cx="0" cy="0" r="10" fill="#001826" stroke="#00f0ff" strokeWidth="1.2" opacity="0.9" />
                  <circle cx="0" cy="0" r="5" fill="#00f0ff" className="animate-eye-pulse" />
                  <circle cx="0" cy="0" r="2.2" fill="#ffffff" />
                  {/* Targeting Crosshairs */}
                  <line x1="-12" y1="0" x2="-8" y2="0" stroke="#00f0ff" strokeWidth="1" />
                  <line x1="8" y1="0" x2="12" y2="0" stroke="#00f0ff" strokeWidth="1" />
                  <line x1="0" y1="-12" x2="0" y2="-8" stroke="#00f0ff" strokeWidth="1" />
                  <line x1="0" y1="8" x2="0" y2="12" stroke="#00f0ff" strokeWidth="1" />
                </g>
              </g>

              {/* ------------------------------------------------------------------ */}
              {/* LAYER C: DETAILED GLOWING BIOLOGICAL BRAIN + MICROCHIPS + CIRCUITS  */}
              {/* ------------------------------------------------------------------ */}
              <g className="glowing-brain-assembly" filter="url(#brainHighGlow)">
                {/* Brain Core Ambient Volumetric Glow */}
                <ellipse cx="250" cy="165" rx="72" ry="54" fill="url(#brainCoreGlow)" opacity="0.9" />

                {/* Cerebral Hemisphere Outer Boundaries */}
                {/* Left Hemisphere */}
                <path
                  d="M246 114 C 205 110, 178 135, 180 170 C 182 200, 210 215, 246 218 Z"
                  fill="#002d4a"
                  fillOpacity="0.45"
                  stroke="#00f0ff"
                  strokeWidth="1.8"
                />
                {/* Right Hemisphere */}
                <path
                  d="M254 114 C 295 110, 322 135, 320 170 C 318 200, 290 215, 254 218 Z"
                  fill="#002d4a"
                  fillOpacity="0.45"
                  stroke="#00f0ff"
                  strokeWidth="1.8"
                />

                {/* Intricate Brain Sulci & Gyri (Fold Lines) - Left Lobe */}
                <path
                  d="M200 135 C 215 142, 225 130, 240 135 M 190 155 C 205 160, 218 150, 235 158 M 195 180 C 210 175, 222 185, 238 180 M 210 198 C 222 194, 232 205, 242 202"
                  fill="none"
                  stroke="#ff9e00"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="animate-pulse"
                />

                {/* Intricate Brain Sulci & Gyri (Fold Lines) - Right Lobe */}
                <path
                  d="M300 135 C 285 142, 275 130, 260 135 M 310 155 C 295 160, 282 150, 265 158 M 305 180 C 290 175, 278 185, 262 180 M 290 198 C 278 194, 268 205, 258 202"
                  fill="none"
                  stroke="#ff9e00"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="animate-pulse"
                />

                {/* Center Longitude Fissure */}
                <line x1="250" y1="112" x2="250" y2="220" stroke="#00f0ff" strokeWidth="2.5" opacity="0.9" />

                {/* Central Embedded AI Microchip (Processor) at Crown of Brain */}
                <g transform="translate(250, 165)">
                  {/* Silicon Chip Die */}
                  <rect x="-18" y="-18" width="36" height="36" rx="3" fill="#03080e" stroke="#ff9e00" strokeWidth="1.8" />
                  {/* Microchip Gold Terminals / Pins */}
                  <line x1="-18" y1="-10" x2="-23" y2="-10" stroke="#ffd000" strokeWidth="1.4" />
                  <line x1="-18" y1="0" x2="-23" y2="0" stroke="#ffd000" strokeWidth="1.4" />
                  <line x1="-18" y1="10" x2="-23" y2="10" stroke="#ffd000" strokeWidth="1.4" />

                  <line x1="18" y1="-10" x2="23" y2="-10" stroke="#ffd000" strokeWidth="1.4" />
                  <line x1="18" y1="0" x2="23" y2="0" stroke="#ffd000" strokeWidth="1.4" />
                  <line x1="18" y1="10" x2="23" y2="10" stroke="#ffd000" strokeWidth="1.4" />

                  {/* Core NPU Logo / Icon */}
                  <rect x="-10" y="-10" width="20" height="20" rx="2" fill="#00f0ff" fillOpacity="0.25" stroke="#00f0ff" strokeWidth="1" />
                  <circle cx="0" cy="0" r="4" fill="#ffffff" className="animate-ping" style={{ animationDuration: '1.6s' }} />
                </g>

                {/* Holographic Neural Network Grid & Embedded Circuit Board Traces */}
                {/* Circuit Traces running across brain cortex */}
                <path
                  d="M227 155 L 200 155 L 190 145 M 227 165 L 185 165 M 227 175 L 205 175 L 195 190"
                  fill="none"
                  stroke="#ffd000"
                  strokeWidth="1.2"
                />
                <path
                  d="M273 155 L 300 155 L 310 145 M 273 165 L 315 165 M 273 175 L 295 175 L 305 190"
                  fill="none"
                  stroke="#ffd000"
                  strokeWidth="1.2"
                />

                {/* Holographic Neural Synapse Nodes (Pulsing Dots) */}
                <g className="neural-nodes">
                  <circle cx="190" cy="145" r="2.8" fill="#00f0ff" className="animate-pulse" />
                  <circle cx="185" cy="165" r="2.8" fill="#ff9e00" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <circle cx="195" cy="190" r="2.8" fill="#00f0ff" className="animate-pulse" style={{ animationDelay: '0.8s' }} />

                  <circle cx="310" cy="145" r="2.8" fill="#00f0ff" className="animate-pulse" />
                  <circle cx="315" cy="165" r="2.8" fill="#ff9e00" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
                  <circle cx="305" cy="190" r="2.8" fill="#00f0ff" className="animate-pulse" style={{ animationDelay: '0.8s' }} />

                  {/* Top Crown Neural Nodes where lasers strike */}
                  <circle cx="215" cy="118" r="3.5" fill="#ffffff" stroke="#00f0ff" strokeWidth="1.5" />
                  <circle cx="240" cy="112" r="4" fill="#ffffff" stroke="#ff9e00" strokeWidth="1.5" />
                  <circle cx="260" cy="112" r="4" fill="#ffffff" stroke="#ff9e00" strokeWidth="1.5" />
                  <circle cx="285" cy="118" r="3.5" fill="#ffffff" stroke="#00f0ff" strokeWidth="1.5" />
                </g>
              </g>

              {/* ------------------------------------------------------------------ */}
              {/* LAYER D: OVERHEAD ROBOTIC LASERS & SURGICAL PROBES SHOOTING BEAMS */}
              {/* ------------------------------------------------------------------ */}
              {lasersActive && (
                <g className="overhead-surgical-lasers" filter="url(#neonGlowLaser)">
                  {/* ============================================================== */}
                  {/* PROBE 1 (OUTER LEFT): Angled ~35 deg shooting Cyan Laser       */}
                  {/* ============================================================== */}
                  <g className="animate-probe-sway">
                    {/* Mechanical Robotic Arm Segment */}
                    <path d="M120 10 L 155 45 L 175 75" fill="none" stroke="#253545" strokeWidth="7" strokeLinecap="round" />
                    <path d="M120 10 L 155 45 L 175 75" fill="none" stroke="#608095" strokeWidth="3" strokeLinecap="round" />
                    {/* Robotic Joint Hinge & Warning Stripe */}
                    <circle cx="155" cy="45" r="5" fill="#0a121a" stroke="#ff9e00" strokeWidth="2" />
                    {/* Laser Emitter Nozzle */}
                    <polygon points="170,72 182,78 178,86 166,80" fill="#0a121a" stroke="#00f0ff" strokeWidth="1.5" />
                    <circle cx="175" cy="80" r="3" fill="#00f0ff" />

                    {/* INTENSE CYAN LASER BEAM SHOOTING FROM PROBE 1 INTO BRAIN */}
                    <line
                      x1="175"
                      y1="80"
                      x2="215"
                      y2="118"
                      stroke="url(#laserBeamCyan)"
                      strokeWidth="3.2"
                      className="animate-laser-beam"
                    />
                    {/* Inner White Core of Laser */}
                    <line x1="175" y1="80" x2="215" y2="118" stroke="#ffffff" strokeWidth="1.2" opacity="0.95" />

                    {/* Impact Plasma Flare on Brain */}
                    <circle cx="215" cy="118" r="10" fill="url(#plasmaImpactGlow)" className="animate-plasma-flare" />
                    <circle cx="215" cy="118" r="3" fill="#ffffff" />
                  </g>

                  {/* ============================================================== */}
                  {/* PROBE 2 (INNER LEFT): Angled ~15 deg shooting Amber Laser      */}
                  {/* ============================================================== */}
                  <g className="animate-probe-sway" style={{ animationDelay: '1s' }}>
                    {/* Mechanical Robotic Arm Segment */}
                    <path d="M195 5 L 210 40 L 225 72" fill="none" stroke="#253545" strokeWidth="6" strokeLinecap="round" />
                    <path d="M195 5 L 210 40 L 225 72" fill="none" stroke="#8095a5" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Joint */}
                    <circle cx="210" cy="40" r="4.5" fill="#0a121a" stroke="#00f0ff" strokeWidth="1.5" />
                    {/* Emitter */}
                    <polygon points="220,68 232,72 228,80 216,76" fill="#0a121a" stroke="#ff9e00" strokeWidth="1.5" />
                    <circle cx="224" cy="76" r="2.8" fill="#ff9e00" />

                    {/* INTENSE AMBER LASER BEAM SHOOTING INTO BRAIN */}
                    <line
                      x1="224"
                      y1="76"
                      x2="240"
                      y2="112"
                      stroke="url(#laserBeamAmber)"
                      strokeWidth="3.4"
                      className="animate-laser-amber"
                    />
                    {/* Inner White Core */}
                    <line x1="224" y1="76" x2="240" y2="112" stroke="#ffffff" strokeWidth="1.4" opacity="0.95" />

                    {/* Impact Plasma Flare on Brain */}
                    <circle cx="240" cy="112" r="12" fill="url(#plasmaImpactAmber)" className="animate-plasma-flare" />
                    <circle cx="240" cy="112" r="3.5" fill="#ffffff" />
                  </g>

                  {/* ============================================================== */}
                  {/* PROBE 3 (OVERHEAD CENTER SURGICAL PROBE): Vertical Dual Beam   */}
                  {/* ============================================================== */}
                  <g>
                    {/* Heavy Overhead Actuator */}
                    <rect x="242" y="0" width="16" height="35" rx="3" fill="#15202b" stroke="#00f0ff" strokeWidth="1.5" />
                    <line x1="244" y1="12" x2="256" y2="12" stroke="#ff9e00" strokeWidth="2" />
                    <line x1="244" y1="20" x2="256" y2="20" stroke="#00f0ff" strokeWidth="2" />
                    {/* Telescoping needle probe */}
                    <line x1="250" y1="35" x2="250" y2="65" stroke="#ffffff" strokeWidth="2.5" />
                    {/* Focus emitter ring */}
                    <circle cx="250" cy="65" r="4" fill="#00f0ff" />

                    {/* INTENSE VERTICAL FOCUSED LASER NEEDLE */}
                    <line
                      x1="250"
                      y1="65"
                      x2="250"
                      y2="110"
                      stroke="#ffffff"
                      strokeWidth="3"
                      className="animate-laser-beam"
                    />
                    <line
                      x1="250"
                      y1="65"
                      x2="250"
                      y2="110"
                      stroke="#00f0ff"
                      strokeWidth="6"
                      opacity="0.5"
                    />
                    {/* Focal Energy Ripple */}
                    <ellipse cx="250" cy="110" rx="14" ry="5" fill="none" stroke="#00f0ff" strokeWidth="1.5" className="animate-ping" />
                    <circle cx="250" cy="110" r="4" fill="#ffffff" />
                  </g>

                  {/* ============================================================== */}
                  {/* PROBE 4 (INNER RIGHT): Angled ~15 deg shooting Amber Laser     */}
                  {/* ============================================================== */}
                  <g className="animate-probe-sway" style={{ animationDelay: '1.5s' }}>
                    {/* Mechanical Robotic Arm Segment */}
                    <path d="M305 5 L 290 40 L 275 72" fill="none" stroke="#253545" strokeWidth="6" strokeLinecap="round" />
                    <path d="M305 5 L 290 40 L 275 72" fill="none" stroke="#8095a5" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Joint */}
                    <circle cx="290" cy="40" r="4.5" fill="#0a121a" stroke="#00f0ff" strokeWidth="1.5" />
                    {/* Emitter */}
                    <polygon points="280,68 268,72 272,80 284,76" fill="#0a121a" stroke="#ff9e00" strokeWidth="1.5" />
                    <circle cx="276" cy="76" r="2.8" fill="#ff9e00" />

                    {/* INTENSE AMBER LASER BEAM SHOOTING INTO BRAIN */}
                    <line
                      x1="276"
                      y1="76"
                      x2="260"
                      y2="112"
                      stroke="url(#laserBeamAmber)"
                      strokeWidth="3.4"
                      className="animate-laser-amber"
                    />
                    {/* Inner White Core */}
                    <line x1="276" y1="76" x2="260" y2="112" stroke="#ffffff" strokeWidth="1.4" opacity="0.95" />

                    {/* Impact Plasma Flare on Brain */}
                    <circle cx="260" cy="112" r="12" fill="url(#plasmaImpactAmber)" className="animate-plasma-flare" />
                    <circle cx="260" cy="112" r="3.5" fill="#ffffff" />
                  </g>

                  {/* ============================================================== */}
                  {/* PROBE 5 (OUTER RIGHT): Angled ~35 deg shooting Cyan Laser      */}
                  {/* ============================================================== */}
                  <g className="animate-probe-sway" style={{ animationDelay: '0.6s' }}>
                    {/* Mechanical Arm */}
                    <path d="M380 10 L 345 45 L 325 75" fill="none" stroke="#253545" strokeWidth="7" strokeLinecap="round" />
                    <path d="M380 10 L 345 45 L 325 75" fill="none" stroke="#608095" strokeWidth="3" strokeLinecap="round" />
                    {/* Joint */}
                    <circle cx="345" cy="45" r="5" fill="#0a121a" stroke="#ff9e00" strokeWidth="2" />
                    {/* Nozzle */}
                    <polygon points="330,72 318,78 322,86 334,80" fill="#0a121a" stroke="#00f0ff" strokeWidth="1.5" />
                    <circle cx="325" cy="80" r="3" fill="#00f0ff" />

                    {/* INTENSE CYAN LASER BEAM SHOOTING FROM PROBE 5 INTO BRAIN */}
                    <line
                      x1="325"
                      y1="80"
                      x2="285"
                      y2="118"
                      stroke="url(#laserBeamCyan)"
                      strokeWidth="3.2"
                      className="animate-laser-beam"
                    />
                    <line x1="325" y1="80" x2="285" y2="118" stroke="#ffffff" strokeWidth="1.2" opacity="0.95" />

                    {/* Impact Plasma Flare on Brain */}
                    <circle cx="285" cy="118" r="10" fill="url(#plasmaImpactGlow)" className="animate-plasma-flare" />
                    <circle cx="285" cy="118" r="3" fill="#ffffff" />
                  </g>
                </g>
              )}

              {/* ------------------------------------------------------------------ */}
              {/* LAYER E: SCANLINE HUD OVERLAY & BIOMETRIC TELEMETRY               */}
              {/* ------------------------------------------------------------------ */}
              <g className="hud-markings opacity-60">
                <circle cx="250" cy="250" r="238" fill="none" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="6,4" />
                <circle cx="250" cy="250" r="215" fill="none" stroke="#ff9e00" strokeWidth="0.6" strokeDasharray="3,6" />
                {/* Horizontal Center Guideline */}
                <line x1="60" y1="250" x2="140" y2="250" stroke="#00f0ff" strokeWidth="0.8" />
                <line x1="360" y1="250" x2="440" y2="250" stroke="#00f0ff" strokeWidth="0.8" />
              </g>
            </svg>
          </div>
        ) : (
          /* ======================================================== */
          /* CUSTOM USER IMAGE RENDER (With Cybernetic Reticles)     */
          /* ======================================================== */
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={customImageUrl}
              alt="Custom AI Core Face"
              onError={() => {
                setImageError(true);
                showNotification('Custom image failed to load. Restoring cybernetic brain render.');
              }}
              className={`w-full h-full object-cover object-[50%_35%] transition-all duration-700 ${
                isBurst ? 'scale-108 brightness-110' : 'scale-100 group-hover/face:scale-103'
              } animate-hologram-glitch`}
            />

            {/* Subtle Vignette Mask blending edges */}
            <div 
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 48%, transparent 42%, rgba(13, 8, 5, 0.45) 58%, rgba(8, 4, 2, 0.88) 72%, rgba(5, 2, 1, 0.98) 84%, #060302 96%)'
              }}
            />

            {/* Glowing Eye Flares */}
            <div className="absolute top-[41%] left-[43%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff] animate-eye-pulse" />
            </div>
            <div className="absolute top-[41%] left-[57%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_12px_#00f0ff] animate-eye-pulse" />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. SWEEPING HOLOGRAPHIC SCAN BEAM                        */}
        {/* ======================================================== */}
        <div className="absolute inset-x-0 h-8 pointer-events-none animate-scan-beam">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_12px_#00f0ff]" />
          <div className="w-full h-6 bg-gradient-to-b from-[#00f0ff]/15 to-transparent blur-sm" />
        </div>

        {/* ======================================================== */}
        {/* 4. DRAG OVER ALERT OVERLAY                               */}
        {/* ======================================================== */}
        {isDragOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md border-2 border-dashed border-[#00f0ff] rounded-full p-4 text-center">
            <Upload className="w-9 h-9 text-[#00f0ff] animate-bounce mb-1" />
            <span className="font-mono text-xs text-white font-bold">DROP IMAGE FILE</span>
            <span className="font-mono text-[9px] text-[#00f0ff]">Set as AI Core portrait</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. HOVER ACTION BUTTON TO CONFIGURE / UPLOAD PICTURE     */}
        {/* ======================================================== */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover/face:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playClick();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 border border-[#ff9e00]/80 text-[#ffe6a3] hover:text-white hover:bg-[#ff9e00]/30 hover:border-[#ff9e00] shadow-[0_0_15px_rgba(255,158,0,0.6)] backdrop-blur-md text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-3 h-3 text-[#00f0ff]" />
            <span>Customize / Upload Image</span>
          </button>
        </div>

        {/* Quick Config Icon Trigger in corner */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            soundFx.playClick();
            setIsModalOpen(true);
          }}
          title="Open AI Core Visual Customizer"
          className="absolute top-1 right-1 z-20 w-6 h-6 rounded-full bg-black/70 border border-[#ff9e00]/40 hover:border-[#ff9e00] text-[#ff9e00] flex items-center justify-center shadow-lg hover:bg-black/90 transition-all opacity-40 hover:opacity-100 cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
        </button>
      </div>

      {/* Feedback Toast Notification */}
      {feedbackMsg && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-md bg-neutral-900/95 border border-[#00f0ff] text-[10px] font-mono text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.5)] backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-top-1">
          {feedbackMsg}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. PICTURE & NEURAL VISUAL CUSTOMIZER MODAL              */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#0a0f16] border border-[#00f0ff]/50 rounded-2xl shadow-[0_0_60px_rgba(0,240,255,0.3)] p-6 overflow-hidden text-neutral-100 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#00f0ff]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff]">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-condensed tracking-wide flex items-center gap-2">
                    AI Core Cybernetic Visualizer
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] font-mono font-normal">
                      SYNAPSE-V4
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-[#a5c9e2]">
                    Cybernetic Brain, Laser Probes & Image Upload Center
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/60 border border-neutral-700 hover:border-[#00f0ff] flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-5">
              {/* Visual Mode Selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#00f0ff] mb-2 font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#00f0ff]" />
                  Active Display Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Mode 1: Procedural Neural Cybernetic Head */}
                  <div
                    onClick={handleResetToNeuralRender}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      visualMode === 'neural_cyber_head'
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                        : 'border-neutral-800 bg-black/50 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Cybernetic Brain & Lasers</span>
                      {visualMode === 'neural_cyber_head' && <Check className="w-4 h-4 text-[#00f0ff]" />}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Matches your prompt: transparent head, glowing brain & surgical laser beams.
                    </span>
                  </div>

                  {/* Mode 2: Custom Image Upload */}
                  <div
                    onClick={() => {
                      if (customImageUrl) {
                        setVisualMode('custom_image');
                        setImageError(false);
                      } else {
                        fileInputRef.current?.click();
                      }
                      soundFx.playClick();
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      visualMode === 'custom_image'
                        ? 'border-[#ff9e00] bg-[#ff9e00]/15 shadow-[0_0_15px_rgba(255,158,0,0.4)]'
                        : 'border-neutral-800 bg-black/50 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">Your Uploaded Image</span>
                      {visualMode === 'custom_image' && <Check className="w-4 h-4 text-[#ff9e00]" />}
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {customImageUrl ? 'Display your uploaded image' : 'Click to select image file'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Direct Image File */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#ff9e00] mb-2 font-semibold">
                  Upload Your Image (JPG, PNG, WEBP)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#00f0ff]/40 hover:border-[#00f0ff] bg-black/40 hover:bg-[#00f0ff]/10 rounded-xl cursor-pointer transition-all text-center group"
                >
                  <Upload className="w-7 h-7 text-[#00f0ff] group-hover:scale-110 transition-transform mb-1.5" />
                  <span className="text-xs font-semibold text-white">
                    Click to Choose Picture from Device
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    or drag & drop your image directly onto the AI Core
                  </span>
                </div>
              </div>

              {/* Or Paste Direct Image URL */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1.5 font-medium">
                  Or Paste Direct Image URL
                </label>
                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/cyber-portrait.png"
                    className="flex-1 px-3 py-1.5 bg-black/60 border border-neutral-700 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-[#00f0ff]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#00f0ff] hover:bg-[#4df4ff] text-black font-semibold text-xs font-mono transition-all cursor-pointer whitespace-nowrap"
                  >
                    Apply URL
                  </button>
                </form>
              </div>

              {/* Laser Beam & Plasma Controls */}
              <div className="p-3 rounded-xl bg-black/50 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#ff9e00]" />
                    Overhead Surgical Lasers
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLasersActive(!lasersActive);
                      soundFx.playClick();
                    }}
                    className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      lasersActive
                        ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_#00f0ff]'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {lasersActive ? 'ACTIVE (FIRING)' : 'STANDBY (OFF)'}
                  </button>
                </div>

                {/* Color Scheme Picker */}
                <div>
                  <span className="block text-[10px] font-mono uppercase text-neutral-400 mb-1.5">
                    Cybernetic Color Palette
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(['cyberpunk_duo', 'cyber_amber', 'cyan_matrix', 'quantum_violet'] as TintMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setTintMode(mode);
                          soundFx.playClick();
                        }}
                        className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase transition-all cursor-pointer ${
                          tintMode === mode
                            ? 'bg-[#ff9e00] text-black font-bold shadow-[0_0_8px_#ff9e00]'
                            : 'bg-black/60 border border-neutral-700 text-neutral-300 hover:text-white'
                        }`}
                      >
                        {mode.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Copy Exact Prompt Card for Midjourney / FLUX */}
              <div className="p-3 rounded-xl bg-[#08121d] border border-[#00f0ff]/30 text-left">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#00f0ff] font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#ff9e00]" />
                    Exact Image-to-Text Prompt
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] text-[10px] font-mono cursor-pointer transition-all"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                </div>
                <p className="text-[10px] font-mono text-neutral-300 leading-relaxed line-clamp-3">
                  "A futuristic front-facing portrait of a human head, showcasing a highly detailed, glowing brain infused with holographic neural networks, microchips, and embedded electronic circuit boards. Overhead, multiple high-tech robotic lasers and surgical probes point intense beams of light directly into the top of the brain..."
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#00f0ff]/30 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToNeuralRender}
                className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-[#00f0ff] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Neural Render</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsModalOpen(false);
                }}
                className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-[#00f0ff] to-[#70ffff] text-black font-bold text-xs uppercase font-mono shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:brightness-110 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
