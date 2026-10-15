import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, RefreshCw, Sparkles, Check, X, Sliders, Eye } from 'lucide-react';
import { soundFx } from '../utils/audioSynthesizer';

export interface FacePreset {
  id: string;
  name: string;
  url: string;
  tag: string;
}

export const FACE_PRESETS: FacePreset[] = [
  {
    id: 'cyber_male_1',
    name: 'Sleek Cyber Android',
    url: '/avatars/male_portrait_1.jpg',
    tag: 'Sentient Core'
  },
  {
    id: 'neon_male_1',
    name: 'Neon Cyberpunk',
    url: '/avatars/neon_male_1.jpg',
    tag: 'Quantum Flux'
  },
  {
    id: 'cyber_male_2',
    name: 'Digital Neural Human',
    url: '/avatars/cyber_male_2.jpg',
    tag: 'Bio-Digital'
  },
  {
    id: 'cyber_male_3',
    name: 'Tactical Operative',
    url: '/avatars/cyber_male_3.jpg',
    tag: 'Defense Grid'
  }
];

const STORAGE_KEY = 'openmause_ai_core_face_url';
const TINT_KEY = 'openmause_ai_core_tint_mode';

export type TintMode = 'cyber_amber' | 'cyan_matrix' | 'natural' | 'deep_neon';

interface CyberneticAiMaleFaceProps {
  isBurst?: boolean;
  className?: string;
  onOpenModalExternal?: () => void;
}

export const CyberneticAiMaleFace: React.FC<CyberneticAiMaleFaceProps> = ({
  isBurst = false,
  className = ''
}) => {
  const [faceUrl, setFaceUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || FACE_PRESETS[0].url;
  });

  const [tintMode, setTintMode] = useState<TintMode>(() => {
    return (localStorage.getItem(TINT_KEY) as TintMode) || 'cyber_amber';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, faceUrl);
  }, [faceUrl]);

  useEffect(() => {
    localStorage.setItem(TINT_KEY, tintMode);
  }, [tintMode]);

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFaceUrl(result);
        setImageError(false);
        soundFx.playTriggerChime();
        showNotification('Picture updated successfully!');
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
        setFaceUrl(result);
        setImageError(false);
        soundFx.playTriggerChime();
        showNotification('Picture updated successfully!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setFaceUrl(customUrlInput.trim());
    setCustomUrlInput('');
    setImageError(false);
    soundFx.playTriggerChime();
    showNotification('Image URL loaded!');
  };

  const handleResetDefault = () => {
    setFaceUrl(FACE_PRESETS[0].url);
    setImageError(false);
    soundFx.playClick();
    showNotification('Reset to default cyber android');
  };

  // Color grade filter classes based on tint mode
  const getFilterStyle = () => {
    switch (tintMode) {
      case 'cyber_amber':
        return {
          filter: 'contrast(1.15) brightness(0.95) saturate(1.2)'
        };
      case 'cyan_matrix':
        return {
          filter: 'contrast(1.2) brightness(0.9) hue-rotate(160deg) saturate(1.3)'
        };
      case 'deep_neon':
        return {
          filter: 'contrast(1.25) brightness(1.05) saturate(1.4)'
        };
      case 'natural':
      default:
        return {
          filter: 'contrast(1.05) brightness(0.98)'
        };
    }
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Underlying Radial Glow */}
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-700 blur-2xl pointer-events-none ${
          isBurst 
            ? 'bg-radial from-[#ff8a1f]/50 via-[#ff8a1f]/20 to-transparent scale-110' 
            : 'bg-radial from-[#ff8a1f]/30 via-[#ff8a1f]/10 to-transparent'
        }`}
      />

      {/* 2. REAL PHOTOREALISTIC MALE FACE CONTAINER */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full group/face"
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* The Male Face Photograph */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={imageError ? FACE_PRESETS[0].url : faceUrl}
            alt="AI Core Sentient Male Face"
            onError={() => {
              setImageError(true);
              showNotification('Failed to load image. Using default portrait.');
            }}
            style={getFilterStyle()}
            className={`w-full h-full object-cover object-[50%_35%] transition-all duration-700 ${
              isBurst ? 'scale-108 brightness-110' : 'scale-100 group-hover/face:scale-103'
            } animate-hologram-glitch`}
          />
        </div>

        {/* Seamless Edge Feathering (Vignette) so photo blends into the core sphere */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 48%, transparent 42%, rgba(13, 8, 5, 0.45) 58%, rgba(8, 4, 2, 0.88) 72%, rgba(5, 2, 1, 0.98) 84%, #060302 96%)'
          }}
        />

        {/* Holographic Duotone Color Veil */}
        {tintMode === 'cyber_amber' && (
          <div className="absolute inset-0 rounded-full mix-blend-color pointer-events-none bg-gradient-to-t from-[#ff8a1f]/35 via-transparent to-[#ffb259]/20" />
        )}
        {tintMode === 'cyan_matrix' && (
          <div className="absolute inset-0 rounded-full mix-blend-color pointer-events-none bg-gradient-to-t from-[#00f0ff]/30 via-transparent to-[#00f0ff]/15" />
        )}
        {tintMode === 'deep_neon' && (
          <div className="absolute inset-0 rounded-full mix-blend-overlay pointer-events-none bg-gradient-to-b from-[#ff8a1f]/20 via-transparent to-[#00f0ff]/25" />
        )}

        {/* Fine Scanlines Layer */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 240, 255, 0.25) 3px, rgba(0, 240, 255, 0.25) 4px)'
          }}
        />

        {/* Vertical Sweeping Holographic Laser Beam */}
        <div className="absolute inset-x-0 h-10 pointer-events-none animate-scan-beam">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_12px_#00f0ff]" />
          <div className="w-full h-8 bg-gradient-to-b from-[#00f0ff]/20 to-transparent blur-sm" />
        </div>

        {/* 3. CYBERNETIC OCULAR TARGETING RETICLES (Glowing Eyes Flares) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Relative eye coordinates calibrated to portrait framing */}
          {/* Left Eye Flare */}
          <div 
            className="absolute top-[41%] left-[43%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className={`w-2 h-2 rounded-full ${isBurst ? 'bg-white shadow-[0_0_18px_#ff8a1f]' : 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]'} animate-eye-pulse`} />
            <div className="absolute -inset-1 rounded-full border border-[#00f0ff]/60 animate-ping opacity-40" />
          </div>

          {/* Right Eye Flare */}
          <div 
            className="absolute top-[41%] left-[57%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className={`w-2 h-2 rounded-full ${isBurst ? 'bg-white shadow-[0_0_18px_#ff8a1f]' : 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff]'} animate-eye-pulse`} />
            <div className="absolute -inset-1 rounded-full border border-[#00f0ff]/60 animate-ping opacity-40" />
          </div>
        </div>

        {/* 4. TACTICAL HUD RETICLE BRACKETS & METRICS OVERLAY */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
          {/* Top HUD markers */}
          <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-mono tracking-widest text-[#ffb259]/80 px-2 pt-1">
            <span className="flex items-center gap-1 drop-shadow-[0_0_4px_rgba(255,178,89,0.8)]">
              <span className="w-1 h-1 rounded-full bg-[#46e39a] animate-pulse" />
              SYS:SENTIENT
            </span>
            <span className="text-[#00f0ff]/90 drop-shadow-[0_0_4px_rgba(0,240,255,0.8)]">
              BIOMETRIC:LOCKED
            </span>
          </div>

          {/* Center Crosshairs & Subtle Facial Grid Marks */}
          <div className="relative w-full flex items-center justify-center opacity-60">
            {/* Horizontal centerline */}
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#ff8a1f]/60 to-transparent" />
          </div>

          {/* Bottom HUD markers */}
          <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-mono tracking-widest text-neutral-400 px-2 pb-1">
            <span className="text-[#ff8a1f]/90">NEURAL:99.8%</span>
            <span className="text-[#46e39a]/90">SYNC:120Hz</span>
          </div>
        </div>

        {/* Drag Over Overlay Alert */}
        {isDragOver && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md border-2 border-dashed border-[#ff8a1f] rounded-full p-4 text-center">
            <Upload className="w-8 h-8 text-[#ff8a1f] animate-bounce mb-1" />
            <span className="font-mono text-xs text-white font-bold">DROP IMAGE HERE</span>
            <span className="font-mono text-[9px] text-[#ffb259]">Instant update AI Core face</span>
          </div>
        )}

        {/* 5. HOVER ACTION BUTTON TO CHANGE / UPLOAD PICTURE */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover/face:opacity-100 transition-opacity duration-300 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundFx.playClick();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 border border-[#ff8a1f]/80 text-[#ffe6a3] hover:text-white hover:bg-[#ff8a1f]/30 hover:border-[#ff8a1f] shadow-[0_0_15px_rgba(255,138,31,0.6)] backdrop-blur-md text-[10px] font-mono font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-3 h-3 text-[#ff8a1f]" />
            <span>Change Picture</span>
          </button>
        </div>
      </div>

      {/* Quick Permanent Customizer Trigger Pill in corner if hovered */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          soundFx.playClick();
          setIsModalOpen(true);
        }}
        title="Customize AI Core Face Picture"
        className="absolute top-1 right-1 z-20 w-6 h-6 rounded-full bg-black/70 border border-[#ff8a1f]/40 hover:border-[#ff8a1f] text-[#ff8a1f] flex items-center justify-center shadow-lg hover:bg-black/90 transition-all opacity-40 hover:opacity-100 cursor-pointer"
      >
        <Sliders className="w-3 h-3" />
      </button>

      {/* Feedback Toast Notification */}
      {feedbackMsg && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-md bg-neutral-900/95 border border-[#ff8a1f] text-[10px] font-mono text-[#ffe6a3] shadow-[0_0_15px_rgba(255,138,31,0.5)] backdrop-blur-md whitespace-nowrap animate-in fade-in slide-in-from-top-1">
          {feedbackMsg}
        </div>
      )}

      {/* 6. PICTURE CUSTOMIZER / UPLOAD MODAL */}
      {isModalOpen && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#140c08] border border-[#ff8a1f]/60 rounded-2xl shadow-[0_0_50px_rgba(255,138,31,0.4)] p-6 overflow-hidden text-neutral-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#ff8a1f]/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ff8a1f]/20 border border-[#ff8a1f] flex items-center justify-center text-[#ff8a1f]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-condensed tracking-wide">
                    AI Core Face Picture
                  </h3>
                  <p className="text-[11px] font-mono text-[#e8c27a]">
                    Upload your exact picture or select a high-res preset
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/60 border border-neutral-700 hover:border-[#ff8a1f] flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="mt-5 space-y-5">
              {/* Option A: Upload Direct File */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#ffb259] mb-2">
                  1. Upload Picture File (JPG, PNG, WEBP)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#ff8a1f]/50 hover:border-[#ff8a1f] bg-black/40 hover:bg-[#ff8a1f]/10 rounded-xl cursor-pointer transition-all text-center group"
                >
                  <Upload className="w-7 h-7 text-[#ff8a1f] group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-xs font-semibold text-white">
                    Click to Choose Picture from Device
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 mt-0.5">
                    or drag & drop your image file here
                  </span>
                </div>
              </div>

              {/* Option B: Preset Photorealistic Faces */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#ffb259] mb-2">
                  2. Or Select High-Definition Cinematic Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FACE_PRESETS.map((preset) => {
                    const isSelected = faceUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setFaceUrl(preset.url);
                          setImageError(false);
                          soundFx.playClick();
                          showNotification(`Switched to ${preset.name}`);
                        }}
                        className={`relative rounded-xl border overflow-hidden cursor-pointer group transition-all p-1 flex flex-col items-center ${
                          isSelected
                            ? 'border-[#ff8a1f] bg-[#ff8a1f]/20 shadow-[0_0_15px_rgba(255,138,31,0.4)]'
                            : 'border-neutral-800 bg-black/40 hover:border-neutral-600 hover:bg-black/70'
                        }`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-[#ff8a1f]/40 mb-1.5">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover object-[50%_35%] group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white text-center leading-tight line-clamp-1">
                          {preset.name}
                        </span>
                        <span className="text-[8px] font-mono text-[#e8c27a] mt-0.5">
                          {preset.tag}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#ff8a1f] text-black flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Option C: Enter Image URL */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-[#ffb259] mb-1.5">
                  3. Or Paste Direct Image URL
                </label>
                <form onSubmit={handleUrlSubmit} className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-picture.png"
                    className="flex-1 px-3 py-1.5 bg-black/60 border border-neutral-700 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff8a1f]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#ff8a1f] hover:bg-[#ffa742] text-black font-semibold text-xs font-mono transition-all cursor-pointer whitespace-nowrap"
                  >
                    Apply URL
                  </button>
                </form>
              </div>

              {/* Holographic Color Grade / Tint Switcher */}
              <div className="pt-2 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="block text-[10px] font-mono uppercase text-neutral-400">
                    Holographic Grading
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {(['cyber_amber', 'cyan_matrix', 'deep_neon', 'natural'] as TintMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setTintMode(mode);
                          soundFx.playClick();
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase transition-all cursor-pointer ${
                          tintMode === mode
                            ? 'bg-[#ff8a1f] text-black font-bold shadow-[0_0_8px_#ff8a1f]'
                            : 'bg-black/60 border border-neutral-700 text-neutral-300 hover:text-white'
                        }`}
                      >
                        {mode.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-[#ff8a1f] transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-[#ff8a1f]/30 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsModalOpen(false);
                }}
                className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-[#ff8a1f] to-[#ffa742] text-black font-bold text-xs uppercase font-mono shadow-[0_0_15px_rgba(255,138,31,0.4)] hover:brightness-110 cursor-pointer"
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
