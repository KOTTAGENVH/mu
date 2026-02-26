import React, { useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform
} from "framer-motion";

interface CardProps {
  href: string;
  delay?: number;
  children: React.ReactNode;
}

export function Card({ href, delay = 0, children }: CardProps) {
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const shimmerX = useTransform(mouseX, [-150, 150], [-30, 30]);
  const shimmerY = useTransform(mouseY, [-60, 60], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.97 }}
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
        transition: "background 0.35s ease, border-color 0.35s ease",
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
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 160px 80px at 50% 50%, rgba(255,255,255,0.07), transparent)",
          x: shimmerX,
          y: shimmerY,
          pointerEvents: "none",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
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
      <motion.div
        animate={{ x: hovered ? 4 : 0, opacity: hovered ? 1 : 0.25 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          marginLeft: "auto",
          color: "rgba(255,255,255,0.7)",
          fontSize: "18px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        →
      </motion.div>
    </motion.a>
  );
}
