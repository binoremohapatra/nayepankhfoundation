/**
 * MusicVisualizer.tsx
 * A subtle speaking-state visualizer that complements the light-mode NGO design.
 * Renders animated frequency bars when the AI assistant is speaking.
 * No external dependencies — uses the global window.musicAnalyzer if available.
 */
import { useEffect, useRef } from 'react';

interface MusicVisualizerProps {
  isActive: boolean;
}

export const MusicVisualizer = ({ isActive }: MusicVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    if (!ctx) return;

    const analyzer = (window as any).musicAnalyzer;

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dataArray: number[] = analyzer
        ? analyzer.getFrequencyData()
        : Array.from({ length: 20 }, () => Math.random() * 60 + 20);

      const barCount = Math.min(dataArray.length, 24);
      const barW     = (canvas.width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        const barH = (dataArray[i] / 255) * canvas.height;
        const x    = i * (barW + 2);
        const y    = canvas.height - barH;

        // NayePankh green gradient bars
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
        grad.addColorStop(1, 'rgba(22, 163, 74, 0.4)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200/80 shadow-sm">
      <canvas
        ref={canvasRef}
        width={64}
        height={20}
        className="block"
      />
      <span className="text-xs font-semibold text-slate-600 tracking-wide">Speaking</span>
    </div>
  );
};
