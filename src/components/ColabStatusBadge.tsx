import React from 'react';
import { ColabStatus } from '../types/voice';
import { Cpu, Zap, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ColabStatusBadgeProps {
  status: ColabStatus;
  onConnectClick?: () => void;
  onProbeClick?: () => void;
  isConnecting?: boolean;
  isProbing?: boolean;
}

export const ColabStatusBadge: React.FC<ColabStatusBadgeProps> = ({
  status,
  onConnectClick,
  onProbeClick,
  isConnecting,
  isProbing,
}) => {
  const isCpu = status.gpu?.toLowerCase().includes('cpu');

  return (
    <div className="flex items-center gap-3 bg-vibe-card/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-vibe-border shadow-lg">
      <div className="flex items-center gap-2">
        {status.connected ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCpu ? 'bg-amber-400' : 'bg-vibe-green'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCpu ? 'bg-amber-400' : 'bg-vibe-green'}`}></span>
          </span>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span>
        )}

        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Cpu className={`w-3.5 h-3.5 ${isCpu ? 'text-amber-400' : 'text-vibe-cyan'}`} />
            <span>Colab MCP: {status.gpu || 'Ready to Pair'}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono max-w-[280px] truncate">
            {status.connected ? (status.vramTotal ? `VRAM: ${status.vramTotal}` : status.message || 'GLM-4-Voice Ready') : status.message}
          </span>
        </div>
      </div>

      <div className="h-5 w-px bg-white/10" />

      {status.connected ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={onProbeClick}
            disabled={isProbing}
            title="Probe Colab hardware (Click after switching to A100 GPU in Colab)"
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-lg border border-white/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isProbing ? 'animate-spin text-vibe-cyan' : ''}`} />
            <span>{isProbing ? 'Probing...' : 'Verify GPU'}</span>
          </button>
          <div className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border ${
            isCpu
              ? 'text-amber-300 bg-amber-400/10 border-amber-400/20'
              : 'text-vibe-green bg-vibe-green/10 border-vibe-green/20'
          }`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>{isCpu ? 'CPU (Change in Colab)' : 'Active'}</span>
          </div>
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
