import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export default function SpiralVisualizer({
  analyser,
  isPlaying,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isPlaying) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const { width, height } = canvas;
    const cx = width / 2;
    const cy = height / 2;
    const innerRadius = 8;
    const bars = 48;

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < bars; i++) {
        const sampleIdx = Math.floor((i / bars) ** 1.3 * dataArray.length);
        const value = dataArray[sampleIdx] / 255;
        const barLength = value * (cx - innerRadius - 2);

        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(angle) * innerRadius;
        const y1 = cy + Math.sin(angle) * innerRadius;
        const x2 = cx + Math.cos(angle) * (innerRadius + barLength);
        const y2 = cy + Math.sin(angle) * (innerRadius + barLength);

        const hue = (i / bars) * 280 + 200; 
        ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.4 + value * 0.6})`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={56}
      height={56}
      className="block"
      aria-hidden="true"
    />
  );
}