export default function WaveformBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationPlayState: isPlaying ? "running" : "paused",
          }}
          className="w-[3px] rounded-full bg-white/70 animate-[waveform_0.8s_ease-in-out_infinite_alternate]"
        />
      ))}
      <style>{`
        @keyframes waveform {
          0%   { height: 4px; }
          25%  { height: 14px; }
          50%  { height: 8px; }
          75%  { height: 18px; }
          100% { height: 6px; }
        }
      `}</style>
    </div>
  );
}
