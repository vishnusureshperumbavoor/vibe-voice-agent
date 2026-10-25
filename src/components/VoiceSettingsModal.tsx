import React from 'react';
import { VoiceSettings } from '../types/voice';
import { X, Sparkles, Gauge, Music2 } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onSave: (settings: VoiceSettings) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState<VoiceSettings>(settings);

  if (!isOpen) return null;

  const emotions: VoiceSettings['emotion'][] = [
    'natural',
    'cheerful',
    'calm',
    'excited',
    'empathic',
    'whisper',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-vibe-card border border-vibe-border rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-vibe-green" />
          <span>GLM-4-Voice Settings</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Tune vocal nuance, speaking style, and emotion prompting
        </p>

        {/* Emotion Tone Selector */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Vocal Emotion Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {emotions.map((emo) => (
              <button
                key={emo}
                onClick={() => setLocalSettings({ ...localSettings, emotion: emo })}
                className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                  localSettings.emotion === emo
                    ? 'bg-vibe-green text-black border-vibe-green shadow-lg shadow-vibe-green/20'
                    : 'bg-vibe-surface border-vibe-border text-slate-300 hover:border-slate-500'
                }`}
              >
                {emo}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Slider */}
        <div className="mb-5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-vibe-cyan" />
              <span>Speaking Speed</span>
            </span>
            <span className="font-mono text-vibe-cyan">{localSettings.speed}x</span>
          </div>
          <input
            type="range"
            min="0.8"
            max="1.4"
            step="0.05"
            value={localSettings.speed}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, speed: parseFloat(e.target.value) })
            }
            className="w-full accent-vibe-cyan cursor-pointer"
          />
        </div>

        {/* Pitch Slider */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Music2 className="w-4 h-4 text-purple-400" />
              <span>Pitch Modulation</span>
            </span>
            <span className="font-mono text-purple-400">{localSettings.pitch > 0 ? `+${localSettings.pitch}` : localSettings.pitch}</span>
          </div>
          <input
            type="range"
            min="-5"
            max="5"
            step="1"
            value={localSettings.pitch}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, pitch: parseInt(e.target.value) })
            }
            className="w-full accent-purple-400 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(localSettings);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-vibe-green text-black text-xs font-bold shadow-lg shadow-vibe-green/25 hover:brightness-110 active:scale-95 transition-all"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
