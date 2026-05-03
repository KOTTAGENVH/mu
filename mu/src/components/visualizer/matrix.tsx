import { useEffect, useRef } from "react";

interface Props {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

const CHARS = "0123456789アイウエオカキクケコサシスセソタチツテトナニヌネノ";
const COLS = 8;
const FONT_SIZE = 9;

interface Stream {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  length: number;
  opacity: number;
}

export default function MatrixVisualizer({ analyser, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamsRef = useRef<Stream[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const colWidth = canvas.width / COLS;

    streamsRef.current = Array.from({ length: COLS }, (_, i) => ({
      x: i * colWidth + colWidth / 2,
      y: Math.random() * -canvas.height,
      speed: 0.8 + Math.random() * 1.2,
      chars: Array.from(
        { length: 12 },
        () => CHARS[Math.floor(Math.random() * CHARS.length)],
      ),
      length: 4 + Math.floor(Math.random() * 5),
      opacity: 0.5,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser || !isPlaying) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const { width, height } = canvas;
    const isDark = () => document.documentElement.classList.contains("dark");

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);

      const bandSize = Math.floor(dataArray.length / COLS);

      ctx.clearRect(0, 0, width, height);
      ctx.font = `bold ${FONT_SIZE}px monospace`;
      ctx.textAlign = "center";

      const dark = isDark();

      streamsRef.current.forEach((stream, col) => {
        const band = dataArray.slice(col * bandSize, (col + 1) * bandSize);
        const energy = band.reduce((a, b) => a + b, 0) / band.length / 255;

        const speed = stream.speed * (1 + energy * 3);
        stream.y += speed;

        if (stream.y - stream.length * FONT_SIZE > height) {
          stream.y = -FONT_SIZE;
          stream.speed = 0.8 + Math.random() * 1.2;
          stream.length = 4 + Math.floor(Math.random() * 5);
          stream.chars = Array.from(
            { length: 12 },
            () => CHARS[Math.floor(Math.random() * CHARS.length)],
          );
        }

        if (Math.random() < 0.08 + energy * 0.15) {
          const idx = Math.floor(Math.random() * stream.chars.length);
          stream.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        for (let j = 0; j < stream.length; j++) {
          const charY = stream.y - j * FONT_SIZE;
          if (charY < 0 || charY > height) continue;

          const charIdx = j % stream.chars.length;
          const char = stream.chars[charIdx];

          const trailT = 1 - j / stream.length;
          const alpha = trailT * (0.5 + energy * 0.5);

          if (j === 0) {
            ctx.shadowBlur = 4 + energy * 8;
            ctx.shadowColor = dark
              ? `rgba(180,255,180,${alpha})`
              : `rgba(0,120,0,${alpha})`;
            ctx.fillStyle = dark
              ? `rgba(220,255,220,${alpha})`
              : `rgba(0,80,0,${alpha})`;
          } else {
            ctx.shadowBlur = 0;
            const green = dark
              ? Math.round(180 * trailT)
              : Math.round(140 * trailT);
            ctx.fillStyle = dark
              ? `rgba(0,${green + 75},0,${alpha})`
              : `rgba(0,${green},0,${alpha})`;
          }

          ctx.fillText(char, stream.x, charY);
        }

        ctx.shadowBlur = 0;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isPlaying]);

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
