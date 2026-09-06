import React, { useEffect, useRef, useState } from "react";

interface CardProps {
  href: string;
  delay?: number;
  children: React.ReactNode;
}

export function Card({ href, delay = 0, children }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(false);
  const [pressed, setPressed] = useState(false);
  const ref = useRef<HTMLAnchorElement | null>(null);
  const shimmerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);


   const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;

    const clamp = (v: number, from: number, to: number) =>
      Math.max(-to, Math.min(to, (v / from) * to));

    if (shimmerRef.current) {
      shimmerRef.current.style.transform = `translate(${clamp(dx, 150, 30)}px, ${clamp(dy, 60, 15)}px)`;
    }
  };

  const handleMouseLeave = () => {
    if (shimmerRef.current) shimmerRef.current.style.transform = "translate(0, 0)";
    setHovered(false);
    setPressed(false);
  };

  return (
    <a
       ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className={inView ? "rise-slow" : ""}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        padding: "20px 36px",
        borderRadius: "4px",
        background: hovered
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderColor: hovered
          ? "rgba(255,255,255,0.22)"
          : "rgba(255,255,255,0.1)",
        textDecoration: "none",
        cursor: "pointer",
        outline: "none",
        overflow: "hidden",
        flex: 1,
        minWidth: 0,
        opacity: inView ? undefined : 0,
        animationDelay: `${delay * 1000}ms`,
        scale: pressed ? 0.97 : 1,
        transition:
          "background 0.35s ease, border-color 0.35s ease, scale 0.15s ease",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-100%",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
          opacity: 0.4,
          animation: "grain 0.5s steps(1) infinite",
          pointerEvents: "none",
        }}
      />
     <div
        ref={shimmerRef}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 160px 80px at 50% 50%, rgba(255,255,255,0.07), transparent)",
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease, transform 0.15s ease-out",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          right: "10%",
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      />
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(
              child as React.ReactElement<{ hovered?: boolean }>,
              { hovered },
            )
          : child,
      )}
    <div
        style={{
          marginLeft: "auto",
          color: "rgba(255,255,255,0.7)",
          fontSize: "18px",
          lineHeight: 1,
          flexShrink: 0,
          transform: hovered ? "translateX(4px)" : "translateX(0)",
          opacity: hovered ? 1 : 0.25,
          transition: "transform 0.25s ease-out, opacity 0.25s ease-out",
        }}
      >
        →
      </div>
    </a>
  );
}