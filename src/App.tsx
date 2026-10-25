import React, { useState, useCallback } from 'react';
import { VoiceOrb } from './components/VoiceOrb';
import { ColabStatusBadge } from './components/ColabStatusBadge';
import { AudioVisualizer } from './components/AudioVisualizer';
import { ConversationFeed } from './components/ConversationFeed';
import { ControlBar } from './components/ControlBar';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useVoiceSocket } from './hooks/useVoiceSocket';
import { VoiceSettings } from './types/voice';
import { Sparkles, MessageSquare, Mic, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [micLevel, setMicLevel] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'orb' | 'feed'>('orb');
  const [isConnectingColab, setIsConnectingColab] = useState(false);
  const [isProbingGpu, setIsProbingGpu] = useState(false);
  const [isDisconnectingColab, setIsDisconnectingColab] = useState(false);

  const [settings, setSettings] = useState<VoiceSettings>({
    emotion: 'natural',
    speed: 1.0,
    pitch: 0,
    voiceId: 'glm-4-voice',
    sampleRate: 24000,
  });

  const { isPlaying, playerLevel, queueAudioChunk, stopAll } = useAudioPlayer();

  const handleAudioChunkReceived = useCallback((chunkB64: string) => {
    queueAudioChunk(chunkB64);
  }, [queueAudioChunk]);

  const handleInterrupted = useCallback(() => {
    stopAll();
  }, [stopAll]);

  const {
    agentState,
    setAgentState,
    colabStatus,
    setColabStatus,
    messages,
    sendAudioChunk,
    sendTextPrompt,
    sendInterrupt,
    updateSettings,
  } = useVoiceSocket({
    onAudioChunkReceived: handleAudioChunkReceived,
    onInterrupted: handleInterrupted,
  });

  const { isRecording, startRecording, stopRecording } = useAudioRecorder({
    onAudioChunk: (b64) => {
      sendAudioChunk(b64);
      setAgentState('listening');
    },
    onAudioLevel: setMicLevel,
  });

  const handleToggleMic = () => {
    if (isRecording) {
      stopRecording();
      setAgentState('idle');
    } else {
      startRecording();
      setAgentState('listening');
    }
  };

  const handleInterrupt = () => {
    stopAll();
    sendInterrupt();
  };

  const handleConnectColab = async () => {
    setIsConnectingColab(true);
    try {
      const res = await fetch('/api/colab/connect', { method: 'POST' });
      const data = await res.json();
      console.log('Connect Colab response:', data);
      if (data) setColabStatus(data);
    } catch (err) {
      console.error('Failed to connect to Colab:', err);
    } finally {
      setIsConnectingColab(false);
    }
  };

  const handleProbeGpu = async () => {
    setIsProbingGpu(true);
    try {
      const res = await fetch('/api/colab/probe-gpu', { method: 'POST' });
      const data = await res.json();
      console.log('Probe GPU response:', data);
      if (data) setColabStatus(data);
    } catch (err) {
      console.error('Failed to probe Colab GPU:', err);
    } finally {
      setIsProbingGpu(false);
    }
  };

  const handleDisconnectColab = async () => {
    setIsDisconnectingColab(true);
    try {
      const res = await fetch('/api/colab/disconnect', { method: 'POST' });
      const data = await res.json();
      console.log('Disconnect Colab response:', data);
      if (data) setColabStatus(data);
    } catch (err) {
      console.error('Failed to disconnect Colab:', err);
    } finally {
      setIsDisconnectingColab(false);
    }
  };

  const handleSaveSettings = (newSettings: VoiceSettings) => {
    setSettings(newSettings);
    updateSettings(newSettings);
  };

  return (
    <div className="relative flex flex-col h-screen w-screen bg-vibe-dark text-slate-100 overflow-hidden font-sans">
      {/* Dynamic Background Cyber Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-vibe-green/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-vibe-border bg-vibe-dark/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-vibe-green to-vibe-cyan p-0.5 shadow-lg shadow-vibe-green/20">
            <div className="w-full h-full bg-vibe-dark rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-vibe-green" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Vibe Voice Agent</span>
              <span className="text-[10px] font-mono uppercase bg-vibe-green/15 text-vibe-green px-2 py-0.5 rounded-full border border-vibe-green/30">
                GLM-4-Voice
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              End-to-End Speech-to-Speech Architecture
            </p>
          </div>
        </div>

        {/* Colab MCP Connection Badge */}
        <ColabStatusBadge
          status={colabStatus}
          onConnectClick={handleConnectColab}
          onProbeClick={handleProbeGpu}
          onDisconnectClick={handleDisconnectColab}
          isConnecting={isConnectingColab}
          isProbing={isProbingGpu}
          isDisconnecting={isDisconnectingColab}
        />
      </header>

      {/* Main View Area: Tab toggle on Mobile/Desktop */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 py-2 overflow-hidden">
        {/* View Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-vibe-card/80 backdrop-blur-md rounded-2xl border border-white/10 mt-2">
          <button
            onClick={() => setActiveTab('orb')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'orb'
                ? 'bg-vibe-green text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Voice Orb</span>
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'feed'
                ? 'bg-vibe-green text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Dialogue Stream</span>
            {messages.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-slate-200 flex items-center justify-center">
                {messages.length}
              </span>
            )}
          </button>
        </div>

        {/* Center Canvas / Content */}
        <div className="flex-1 w-full max-w-4xl flex items-center justify-center overflow-hidden my-2">
          {activeTab === 'orb' ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <VoiceOrb
                state={agentState}
                userLevel={micLevel}
                aiLevel={playerLevel}
                onClick={handleToggleMic}
              />
              <AudioVisualizer
                level={agentState === 'speaking' ? playerLevel : micLevel}
                color={agentState === 'speaking' ? '#a855f7' : '#00d679'}
                barsCount={32}
              />
              <p className="text-xs text-slate-400 font-mono tracking-wide">
                {isRecording
                  ? 'Listening to microphone... Speak freely'
                  : 'Tap the orb or microphone button to speak'}
              </p>
            </div>
          ) : (
            <div className="w-full h-full max-h-[60vh] bg-vibe-card/60 rounded-3xl border border-vibe-border shadow-2xl overflow-hidden flex flex-col">
              <ConversationFeed messages={messages} />
            </div>
          )}
        </div>

        {/* Floating Bottom Control Bar */}
        <ControlBar
          agentState={agentState}
          isRecording={isRecording}
          onToggleMic={handleToggleMic}
          onInterrupt={handleInterrupt}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSendText={sendTextPrompt}
        />
      </main>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
