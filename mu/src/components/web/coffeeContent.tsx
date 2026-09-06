import { CoffeeIcon } from "./coffeeIcon";

export function CoffeeContent({ hovered }: { hovered?: boolean }) {
  return (
    <>
      <div
        style={{
          position: "relative",
          width: "28px",
          height: "36px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-14px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "4px",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="steam-particle"
              style={{
                width: "2px",
                height: "8px",
                borderRadius: "2px",
                background: "rgba(255,255,255,0.4)",
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>
        <CoffeeIcon
          size={28}
          style={{
            position: "absolute",
            bottom: 0,
            color: hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)",
            transition: "color 0.35s ease",
          }}
        />
      </div>

      <div
        style={{
          width: "1px",
          height: "28px",
          background: "rgba(255,255,255,0.12)",
          flexShrink: 0,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "10px",
            letterSpacing: "0.2em",
            textTransform: "uppercase" as const,
            color: hovered ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
            transition: "color 0.35s ease",
          }}
        >
          Read the blog
        </span>
        <span
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(13px, 4vw, 22px)",
            fontWeight: 400,
            color: hovered
              ? "rgba(255,255,255,0.95)"
              : "rgba(255,255,255,0.65)",
            transition: "color 0.35s ease",
          }}
        >
          MU
        </span>
      </div>
    </>
  );
}
