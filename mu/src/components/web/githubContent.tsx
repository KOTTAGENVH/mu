import { Github } from "lucide-react";

export function GitHubContent({ hovered }: { hovered?: boolean }) {
  return (
    <>
      <Github
        size={26}
        style={{
          flexShrink: 0,
          color: hovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)",
          transition: "color 0.35s ease",
        }}
      />
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
          Open Source
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
          View source on GitHub
        </span>
      </div>
    </>
  );
}
