"use client";
import { useMemo } from "react";

export interface PricePoint {
  date: string;
  value: number;
}

interface Props {
  data: PricePoint[];
  width?: number;
  height?: number;
}

const SVG_W = 120;
const SVG_H = 32;
const PAD = { top: 4, right: 4, bottom: 4, left: 4 };

function buildPath(points: PricePoint[], width: number, height: number): string {
  if (points.length < 2) return "";
  const values = points.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  return points
    .map((p, i) => {
      const x = PAD.left + (i / (points.length - 1)) * innerW;
      const y = PAD.top + innerH - ((p.value - minV) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function getTrend(points: PricePoint[]): "up" | "down" | "flat" {
  if (points.length < 2) return "flat";
  const first = points[0].value;
  const last = points[points.length - 1].value;
  if (last > first) return "up";
  if (last < first) return "down";
  return "flat";
}

const TREND_COLORS = {
  up: "#16A34A",
  down: "#DC2626",
  flat: "#7c6d5a",
};

const TREND_LABELS = {
  up: "increasing",
  down: "decreasing",
  flat: "flat",
};

export default function Sparkline({ data, width = SVG_W, height = SVG_H }: Props) {
  const path = useMemo(() => buildPath(data, width, height), [data, width, height]);
  const trend = useMemo(() => getTrend(data), [data]);

  if (data.length < 2) return null;

  const values = data.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const last = data[data.length - 1];
  const cx = PAD.left + innerW;
  const cy = PAD.top + innerH - ((last.value - minV) / range) * innerH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Appraisal value trend: ${TREND_LABELS[trend]}`}
      className="inline-block"
      style={{ width, height }}
    >
      {path && (
        <path
          d={path}
          fill="none"
          stroke={TREND_COLORS[trend]}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      <circle cx={cx} cy={cy} r={2.5} fill={TREND_COLORS[trend]} />
    </svg>
  );
}
