import React from 'react';

interface AudioVisualizerProps {
  level: number;
  color?: string;
  barsCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  level,
  color = '#00d679',
  barsCount = 28,
}) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-10 px-4">
      {Array.from({ length: barsCount }).map((_, idx) => {
        // Multi-frequency wave pattern
        const factor = Math.sin((idx / barsCount) * Math.PI);
        const dynamicHeight = Math.max(4, Math.min(36, factor * level * 42 + Math.random() * level * 10));
        return (
          <div
            key={idx}
            className="w-1 rounded-full transition-all duration-75"
            style={{
              height: `${dynamicHeight}px`,
              backgroundColor: color,
              opacity: 0.25 + (dynamicHeight / 36) * 0.75,
              boxShadow: level > 0.05 ? `0 0 8px ${color}66` : 'none',
            }}
          />
        );
      })}
    </div>
  );
};
