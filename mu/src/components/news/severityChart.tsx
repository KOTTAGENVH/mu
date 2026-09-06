"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  RadarController,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { inter } from "@/app/fonts";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
);

const severity_order = ["critical", "high", "medium", "low", "none"] as const;

const label_of = (k: string) => k.charAt(0).toUpperCase() + k.slice(1);

interface Props {
  bySeverity: Record<string, number>;
  chart_type?: "bar" | "radar";
}

function SeverityChart({ bySeverity, chart_type = "bar" }: Props) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const chart = useRef<Chart | null>(null);
  const [themeTick, setThemeTick] = useState(0);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setThemeTick((t) => t + 1);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;

    const styles = getComputedStyle(document.documentElement);
    const foreground =
      styles.getPropertyValue("--foreground").trim() || "#171717";
    const muted = `${foreground}66`;
    const grid = `${foreground}1a`;

    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const severity_colors: Record<string, string> = {
      critical: "#f97316",
      high: "#ef4444",
      medium: dark ? "#eab308" : "#ca8a04",
      low: "#3b82f6",
      none: "#94a3b8",
    };

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const keys = severity_order.filter((k) => (bySeverity?.[k] ?? 0) > 0);
    const values = keys.map((k) => bySeverity[k] ?? 0);

    chart.current = new Chart(node, {
      type: chart_type,
      data: {
        labels: keys.map(label_of),
        datasets: [
          {
            label: "Advisories",
            data: values,
            backgroundColor:
              chart_type === "radar"
                ? "#3b82f633"
                : keys.map((k) => `${severity_colors[k]}cc`),
            borderColor:
              chart_type === "radar"
                ? "#3b82f6"
                : keys.map((k) => severity_colors[k]),
            borderWidth: chart_type === "radar" ? 2 : 0,
            pointBackgroundColor: keys.map((k) => severity_colors[k]),
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: chart_type === "bar" ? "y" : "x",
        animation: reduced ? false : { duration: 400 },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            backgroundColor: dark ? "#ededed" : "#171717",
            titleColor: dark ? "#0a0a0a" : "#ffffff",
            bodyColor: dark ? "#0a0a0a" : "#ffffff",
            callbacks: {
              label: (ctx) => `${ctx.formattedValue} advisories`,
            },
          },
        },
        scales:
          chart_type === "radar"
            ? {
                r: {
                  beginAtZero: true,
                  grid: { color: grid },
                  angleLines: { color: grid },
                  pointLabels: {
                    color: muted,
                    font: { size: 11, family: inter.style.fontFamily },
                  },
                  ticks: { display: false, backdropColor: "transparent" },
                },
              }
            : {
                x: {
                  beginAtZero: true,
                  grid: { color: grid },
                  border: { display: false },
                  ticks: { color: muted, font: { size: 11 }, precision: 0 },
                },
                y: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: { color: muted, font: { size: 12 } },
                },
              },
      },
    });

    return () => {
      chart.current?.destroy();
      chart.current = null;
    };
  }, [bySeverity, chart_type, themeTick]);

  return (
    <div className="h-56 sm:h-64">
      <canvas ref={canvas} role="img" aria-label="Advisories by severity" />
    </div>
  );
}

export default SeverityChart;
