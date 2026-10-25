import { useState, useRef, useCallback } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const [playerLevel, setPlayerLevel] = useState(0);

  const initContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx({ sampleRate: 24000 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const queueAudioChunk = useCallback((base64Data: string) => {
    const ctx = initContext();
    try {
      // Decode base64 to Int16Array
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);

      // Convert Int16Array to Float32Array AudioBuffer (24kHz Mono)
      const audioBuffer = ctx.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      let sumSq = 0;
      for (let i = 0; i < int16Array.length; i++) {
        const floatVal = int16Array[i] / 32768.0;
        channelData[i] = floatVal;
        sumSq += floatVal * floatVal;
      }

      // Calculate approximate RMS level for visualizer
      const rms = Math.sqrt(sumSq / int16Array.length);
      setPlayerLevel(Math.min(1, rms * 3.5));

      // Schedule seamless audio playback
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      const currentTime = ctx.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime + 0.05; // tiny buffer headroom
      }

      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      setIsPlaying(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsPlaying(false);
          setPlayerLevel(0);
        }
      };
    } catch (err) {
      console.error('Error queuing audio chunk in player:', err);
    }
  }, [initContext]);

  // Instant interruption
  const stopAll = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    });
    activeSourcesRef.current = [];
    if (audioContextRef.current) {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsPlaying(false);
    setPlayerLevel(0);
  }, []);

  return {
    isPlaying,
    playerLevel,
    queueAudioChunk,
    stopAll,
  };
}
