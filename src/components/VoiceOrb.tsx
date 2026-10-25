import React, { useEffect, useRef } from 'react';
import { AgentState } from '../types/voice';

interface VoiceOrbProps {
  state: AgentState;
  userLevel: number;
  aiLevel: number;
  onClick?: () => void;
}

export const VoiceOrb: React.FC<VoiceOrbProps> = ({ state, userLevel, aiLevel, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      phase += 0.04;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Determine colors and intensity based on state
      let color1 = '#00d679'; // Green (default / listening)
      let color2 = '#00f2fe'; // Cyan
      let baseRadius = 80;
      let activeLevel = 0;

      if (state === 'listening') {
        color1 = '#00d679';
        color2 = '#10b981';
        activeLevel = userLevel;
      } else if (state === 'speaking') {
        color1 = '#8b5cf6'; // Purple
        color2 = '#ec4899'; // Pink
        activeLevel = aiLevel;
      } else if (state === 'thinking') {
        color1 = '#f59e0b'; // Amber
        color2 = '#f43f5e'; // Red-orange
        activeLevel = 0.5 + Math.sin(phase * 3) * 0.3;
      } else if (state === 'disconnected') {
        color1 = '#475569';
        color2 = '#334155';
        activeLevel = 0;
      }

      const radius = baseRadius + activeLevel * 45;

      // Outer ambient glow
      const glowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.8);
      glowGrad.addColorStop(0, color1 + '55');
      glowGrad.addColorStop(0.6, color2 + '22');
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Deforming multi-harmonic organic orb shape
      ctx.save();
      ctx.beginPath();
      const points = 64;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave1 = Math.sin(angle * 4 + phase) * (8 + activeLevel * 20);
        const wave2 = Math.cos(angle * 7 - phase * 1.5) * (5 + activeLevel * 14);
        const r = radius + wave1 + wave2;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Inner Core Gradient
      const orbGrad = ctx.createRadialGradient(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.1, centerX, centerY, radius);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.3, color2);
      orbGrad.addColorStop(0.8, color1);
      orbGrad.addColorStop(1, '#05070a');
      ctx.fillStyle = orbGrad;
      ctx.shadowColor = color1;
      ctx.shadowBlur = 30 + activeLevel * 40;
      ctx.fill();
      ctx.restore();

      // Concentric sound ring
      if (activeLevel > 0.05) {
        ctx.save();
        ctx.strokeStyle = color1 + '66';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.35 + Math.sin(phase * 2) * 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, userLevel, aiLevel]);

  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none group transition-transform active:scale-95"
    >
      <canvas
        ref={canvasRef}
        width={360}
        height={360}
        className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] max-w-full drop-shadow-2xl"
      />
      {/* Center status pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-semibold tracking-wider uppercase text-slate-300 shadow-xl flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            state === 'listening'
              ? 'bg-vibe-green animate-ping'
              : state === 'speaking'
              ? 'bg-purple-400 animate-pulse'
              : state === 'thinking'
              ? 'bg-amber-400 animate-spin'
              : 'bg-slate-500'
          }`}
        />
        <span>{state}</span>
      </div>
    </div>
  );
};
