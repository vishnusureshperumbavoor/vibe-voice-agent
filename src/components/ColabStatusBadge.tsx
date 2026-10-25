import React from 'react';
import { ColabStatus } from '../types/voice';
import { Cpu, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ColabStatusBadgeProps {
  status: ColabStatus;
  onConnectClick?: () => void;
  isConnecting?: boolean;
}

export const ColabStatusBadge: React.FC<ColabStatusBadgeProps> = ({ status, onConnectClick, isConnecting }) => {
  return (
    <div className="flex items-center gap-3 bg-vibe-card/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-vibe-border shadow-lg">
      <div className="flex items-center gap-2">
        {status.connected ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vibe-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-vibe-green"></span>
          </span>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Cpu className="w-3.5 h-3.5 text-vibe-cyan" />
            <span>Colab MCP: {status.gpu || 'A100 / L4'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {status.connected ? (status.vramTotal ? `VRAM: ${status.vramTotal}` : 'GLM-4-Voice Ready') : status.message}
          </span>
        </div>
      </div>

      <div className="h-5 w-px bg-white/10" />

      {status.connected ? (
        <div className="flex items-center gap-1 text-[11px] font-medium text-vibe-green bg-vibe-green/10 px-2 py-0.5 rounded-lg border border-vibe-green/20">
          <CheckCircle2 className="w-3 h-3" />
          <span>Active</span>
        </div>
      ) : (
        <button
          onClick={onConnectClick}
          disabled={isConnecting}
          className="flex items-center gap-1 text-[11px] font-semibold text-vibe-cyan bg-vibe-cyan/10 hover:bg-vibe-cyan/20 px-2.5 py-1 rounded-lg border border-vibe-cyan/30 transition-all active:scale-95 disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Pairing...</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Connect Colab</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
