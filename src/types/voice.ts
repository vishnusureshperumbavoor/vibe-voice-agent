export type AgentState = 'disconnected' | 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ColabStatus {
  connected: boolean;
  status: 'not_connected' | 'pairing' | 'connected' | 'disconnected' | 'error';
  message: string;
  gpu?: string;
  vramTotal?: string;
  vramUsed?: string;
  modelReady: boolean;
  latencyMs?: number;
  verifiedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  emotion?: string;
  duration?: number;
  audioBlobUrl?: string;
}

export interface VoiceSettings {
  emotion: 'natural' | 'cheerful' | 'calm' | 'excited' | 'empathic' | 'whisper';
  speed: number; // 0.8 to 1.4
  pitch: number; // -5 to +5
  voiceId: string;
  sampleRate: number; // 16000 or 24000
}
