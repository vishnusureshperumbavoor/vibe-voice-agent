import { useState, useEffect, useRef, useCallback } from 'react';
import { AgentState, ColabStatus, ChatMessage, VoiceSettings } from '../types/voice';

interface VoiceSocketOptions {
  onAudioChunkReceived?: (chunkB64: string) => void;
  onInterrupted?: () => void;
}

export function useVoiceSocket({ onAudioChunkReceived, onInterrupted }: VoiceSocketOptions = {}) {
  const [agentState, setAgentState] = useState<AgentState>('disconnected');
  const [colabStatus, setColabStatus] = useState<ColabStatus>({
    connected: false,
    status: 'not_connected',
    message: 'Colab not connected yet',
    modelReady: false,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/voice`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setAgentState('idle');
      console.log('Voice agent WebSocket connected to FastAPI');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'colab_status') {
          setColabStatus(data.payload);
        } else if (data.type === 'agent_state') {
          setAgentState(data.state);
        } else if (data.type === 'audio_chunk') {
          if (onAudioChunkReceived) {
            onAudioChunkReceived(data.chunk);
          }
          setAgentState('speaking');
        } else if (data.type === 'transcript') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: data.sender || 'agent',
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              emotion: data.emotion,
            },
          ]);
        } else if (data.type === 'interrupt') {
          if (onInterrupted) onInterrupted();
          setAgentState('listening');
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      setAgentState('disconnected');
      wsRef.current = null;
      // Auto-reconnect after 3s
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, 3000);
      }
    };
  }, [onAudioChunkReceived, onInterrupted]);

  const sendAudioChunk = useCallback((base64PCM: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'audio_chunk',
          chunk: base64PCM,
        })
      );
    }
  }, []);

  const sendTextPrompt = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'user',
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      wsRef.current.send(
        JSON.stringify({
          type: 'text_input',
          text,
        })
      );
      setAgentState('thinking');
    }
  }, []);

  const sendInterrupt = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'interrupt' }));
    }
    if (onInterrupted) onInterrupted();
    setAgentState('listening');
  }, [onInterrupted]);

  const updateSettings = useCallback((settings: VoiceSettings) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'update_settings',
          settings,
        })
      );
    }
  }, []);

  useEffect(() => {
    connect();
    // Fetch initial Colab status on mount
    fetch('/api/colab/status')
      .then((res) => res.json())
      .then((data) => setColabStatus(data))
      .catch((err) => console.warn('Could not fetch initial Colab status:', err));

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return {
    agentState,
    setAgentState,
    colabStatus,
    setColabStatus,
    messages,
    sendAudioChunk,
    sendTextPrompt,
    sendInterrupt,
    updateSettings,
    reconnect: connect,
  };
}
