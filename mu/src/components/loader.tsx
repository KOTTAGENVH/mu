"use client";

function Loader() {
  return (
    <svg
      className="mb-4 w-28 h-48"
      viewBox="0 0 200 200"
      role="img"
      aria-labelledby="loader-title"
    >
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>

        <g className="text-black/30 dark:text-white/30">
          <circle
            cx="100"
            cy="100"
            r="60"
            fill="url(#g1)"
            filter="url(#blur)"
          />
        </g>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes dash {
            0% { stroke-dasharray: 1, 300; stroke-dashoffset: 0; }
            50% { stroke-dasharray: 200, 300; stroke-dashoffset: -100; }
            100% { stroke-dasharray: 1, 300; stroke-dashoffset: -260; }
          }
        `}</style>
      </defs>
      
      <g className="text-black/30 dark:text-white/30">
        <circle cx="100" cy="100" r="60" fill="url(#g1)" filter="url(#blur)" />
      </g>

      <g
        className="origin-center motion-reduce:animate-none motion-reduce:transition-none"
        style={{
          animation: "spin 1.2s linear infinite",
        }}
      >
        <circle
          cx="100"
          cy="100"
          r="52"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          style={{
            strokeDasharray: "120 200",
            animation: "dash 1.5s ease-in-out infinite",
          }}
          className="text-black/60 dark:text-white/60"
        />
      </g>
      <g className="text-black/60 dark:text-white/60">
        <path
          d="M30 80 l6 0 m-3 -3 l0 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M165 70 l6 0 m-3 -3 l0 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M55 145 l8 0 m-4 -4 l0 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default Loader;