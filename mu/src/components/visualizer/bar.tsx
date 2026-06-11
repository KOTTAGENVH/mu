import { useEffect, useRef } from "react";

interface Props {
  analyser: AnalyserNode | null;
  bars?: number;
}

export default function BarsVisualizer({
  analyser,
  bars = 24,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const { width, height } = canvas;
    const isDark = () => document.documentElement.classList.contains("dark");

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      const dark = isDark();
      const barWidth = width / bars;
      const gap = 2;

      for (let i = 0; i < bars; i++) {
        const sampleIdx = Math.floor((i / bars) ** 1.4 * dataArray.length);
        const value = dataArray[sampleIdx] / 255;
        const barHeight = Math.max(2, value * height);

        ctx.fillStyle = dark
          ? `rgba(255, 255, 255, 1)`
          : `rgba(30, 30, 30, ${0.5 + value * 0.5})`;

        ctx.beginPath();
        ctx.roundRect(
          i * barWidth + gap / 2,
          height - barHeight,
          barWidth - gap,
          barHeight,
          2,
        );
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, bars]);


  return (
    <canvas
      ref={canvasRef}
      width={80}
      height={56}
      className="block"
      aria-hidden="true"
    />
  );
}
