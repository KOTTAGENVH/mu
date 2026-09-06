import React, { useEffect, useRef, useState } from "react";
import { Card } from "./btnCard";
import { GitHubContent } from "./githubContent";
import { CoffeeContent } from "./coffeeContent";

function SourceAndSupport() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

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
  return (
    <div
      id="source"
      className="flex h-auto w-full items-center justify-center bg-transparent p-6 md:p-10"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "860px",
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}
      >
        <p
          className={inView ? "fade-in" : ""}
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "10px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
            marginBottom: "20px",
            paddingTop: "2px",
            opacity: inView ? undefined : 0,
          }}
        >
          Links
        </p>
        <div
          className={inView ? "grow-x" : ""}
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            transformOrigin: "left",
            marginBottom: "2px",
            transform: inView ? undefined : "scaleX(0)",
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Card href="https://github.com/KOTTAGENVH/mu" delay={0.1}>
            <GitHubContent />
          </Card>
          <Card href="https://www.nowenkottage.com/mu?page=1" delay={0.2}>
            <CoffeeContent />
          </Card>
        </div>
        <div
          className={inView ? "grow-x" : ""}
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.08)",
            transformOrigin: "right",
            marginTop: "2px",
            animationDelay: "300ms",
            transform: inView ? undefined : "scaleX(0)",
          }}
        />
      </div>
    </div>
  );
}

export default SourceAndSupport;
