import React, { useState } from 'react';
import { Mic, MicOff, Square, Settings2, Keyboard, Send } from 'lucide-react';
import { AgentState } from '../types/voice';

interface ControlBarProps {
  agentState: AgentState;
  isRecording: boolean;
  onToggleMic: () => void;
  onInterrupt: () => void;
  onOpenSettings: () => void;
  onSendText: (text: string) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  agentState,
  isRecording,
  onToggleMic,
  onInterrupt,
  onOpenSettings,
  onSendText,
}) => {
  const [showTextPrompt, setShowTextPrompt] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendText(textInput.trim());
    setTextInput('');
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-xl mx-auto px-4 pb-6">
      {/* Optional Quick Text Input Drawer */}
      {showTextPrompt && (
        <form
          onSubmit={handleTextSubmit}
          className="w-full flex items-center gap-2 bg-vibe-card/95 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-2xl animate-fadeIn"
        >
          <input
            type="text"
            placeholder="Type your message if you cannot speak..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="flex-1 bg-transparent px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-vibe-green text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Main Floating Pill Dock */}
      <div className="flex items-center gap-4 bg-vibe-card/90 backdrop-blur-xl px-5 py-3 rounded-full border border-vibe-border shadow-2xl">
        {/* Toggle Text Input */}
        <button
          onClick={() => setShowTextPrompt(!showTextPrompt)}
          title="Toggle Text Prompt"
          className={`p-3 rounded-full text-slate-300 hover:text-white transition-all ${
            showTextPrompt ? 'bg-white/15 text-white' : 'hover:bg-white/10'
          }`}
        >
          <Keyboard className="w-5 h-5" />
        </button>

        {/* Primary Microphone Button */}
        <button
          onClick={onToggleMic}
          className={`relative p-5 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center active:scale-95 ${
            isRecording
              ? 'bg-rose-500 text-white shadow-rose-500/50 hover:bg-rose-600'
              : 'bg-vibe-green text-black shadow-vibe-green/40 hover:bg-emerald-400'
          }`}
        >
          {isRecording && (
            <span className="absolute inset-0 rounded-full animate-ping bg-rose-500 opacity-40"></span>
          )}
          {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>

        {/* Interrupt Button (Barge-in) */}
        <button
          onClick={onInterrupt}
          disabled={agentState !== 'speaking'}
          title="Interrupt AI Speech"
          className="p-3 rounded-full text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <Square className="w-5 h-5 fill-current" />
        </button>

        <div className="h-6 w-px bg-white/10" />

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          title="Voice Settings"
          className="p-3 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
