'use client';
import { useEffect, useRef, useState } from 'react';
import { healthColor } from '@/lib/design-tokens';

interface DataPoint {
  date: string;       // ISO date string
  value: number;      // bps, 10_000 = 1.0
}

interface TooltipState {
  x: number;
  y: number;
  point: DataPoint;
}

interface Props {
  value: number;          // current bps value (single-point mode)
  history?: DataPoint[];  // optional time-series for chart mode
  loading?: boolean;      // when true, renders skeleton placeholder
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function HistoryChart({ history }: { history: DataPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const max = Math.max(...history.map((p) => p.value), 20_000);
  const W = 100; // percentage-based viewport
  const TW = 144;

  function hideTooltip() {
    setTooltip(null);
    setActiveIndex(null);
  }

  function showTooltipForIndex(index: number) {
    const container = containerRef.current;
    const point = history[index];
    if (!container || !point) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 1;
    const px = (index / (history.length - 1 || 1)) * W;
    const x = Math.min(Math.max((px / W) * width, TW / 2), width - TW / 2);
    const y = 16;

    setTooltip({ x, y, point });
    setActiveIndex(index);
  }

  function show(e: React.MouseEvent<SVGCircleElement> | React.TouchEvent<SVGCircleElement>, point: DataPoint, idx: number) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    let x = clientX - rect.left;
    let y = clientY - rect.top;

    x = Math.min(Math.max(x, TW / 2), rect.width - TW / 2);
    y = y < 68 + 8 ? y + 12 : y - 68 - 8;

    setTooltip({ x, y, point });
    setActiveIndex(idx);
  }

  function focusPoint(index: number) {
    const target = circleRefs.current[index];
    if (target) target.focus();
  }

  function handlePointKeyDown(event: React.KeyboardEvent<SVGCircleElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showTooltipForIndex(index);
      return;
    }

    if (event.key === "Escape") {
      hideTooltip();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      const prev = index - 1;
      if (prev >= 0) focusPoint(prev);
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      const next = index + 1;
      if (next < history.length) focusPoint(next);
      return;
    }
  }

  return (
    <div ref={containerRef} className="relative mt-4 h-28 select-none" onMouseLeave={hideTooltip}>
      <svg viewBox={`0 0 ${W} 100`} preserveAspectRatio="none" className="w-full h-full" aria-label="Health factor history chart" role="img">
        {/* baseline */}
        <line x1="0" y1="50" x2={W} y2="50" style={{ stroke: 'var(--token-border-strong)' }} strokeOpacity="0.08" strokeWidth="0.5" />

        {/* polyline */}
        <polyline
          fill="none"
          style={{ stroke: 'var(--token-accent)' }}
          strokeWidth="1.5"
          strokeLinejoin="round"
          points={history
            .map((p, i) => {
              const px = (i / (history.length - 1 || 1)) * W;
              const py = 100 - (p.value / max) * 90;
              return `${px},${py}`;
            })
            .join(" ")}
        />

        {/* interactive data points */}
        {history.map((point, i) => {
          const px = (i / (history.length - 1 || 1)) * W;
          const py = 100 - (point.value / max) * 90;
          const color = healthColor(point.value);
          const isActive = activeIndex === i;
          return (
            <circle
              key={i}
              ref={(el) => {
                circleRefs.current[i] = el;
              }}
              tabIndex={0}
              role="button"
              aria-label={`${formatDate(point.date)} health ${(point.value / 10_000).toFixed(2)}x, ${point.value.toLocaleString()} bps`}
              cx={px}
              cy={py}
              r={isActive ? 3 : 2}
              fill={isActive ? color : 'var(--token-accent)'}
              stroke={isActive ? color : 'var(--token-surface-raised)'}
              strokeWidth={isActive ? 0 : 0.8}
              className={mounted ? "motion-safe:animate-[fadeIn_0.6s_ease-out]" : ""}
              style={{ 
                cursor: "pointer", 
                transition: "r 0.15s",
                animationDelay: `${i * 50}ms`,
                opacity: mounted ? 1 : 0
              }}
              onMouseEnter={(e) => show(e, point, i)}
              onTouchStart={(e) => {
                e.preventDefault();
                show(e, point, i);
              }}
              onTouchEnd={() => setTimeout(() => hideTooltip(), 2000)}
              onFocus={() => showTooltipForIndex(i)}
              onBlur={hideTooltip}
              onKeyDown={(e) => handlePointKeyDown(e, i)}
            />
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl bg-[color:var(--token-surface-raised)] text-[color:var(--token-text)] text-xs px-3 py-2 shadow-lg border border-[color:var(--token-border)]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateX(-50%)",
            minWidth: "9rem",
          }}
          role="tooltip"
        >
          <p className="font-semibold">{formatDate(tooltip.point.date)}</p>
          <p>
            Health: <span className="font-mono">{(tooltip.point.value / 10_000).toFixed(2)}x</span>
          </p>
          <p>
            Value: <span className="font-mono">{tooltip.point.value.toLocaleString()} bps</span>
          </p>
        </div>
      )}
    </div>
  );
}

// SVG arc gauge: 180° half-circle, radius 80, cx=100, cy=100
const CX = 100;
const CY = 100;
const R = 80;
const STROKE = 16;

// Zones: 0–50% danger, 50–75% warning, 75–100% safe
// Full arc spans 180° (π radians), left to right
function polarToXY(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(rad),
    y: CY + R * Math.sin(rad),
  };
}

function arcPath(startDeg: number, endDeg: number) {
  const s = polarToXY(startDeg);
  const e = polarToXY(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
}

// The gauge spans from 180° (left) to 0° (right) going counter-clockwise visually
// In SVG coords: start=180°, end=0°, but we draw left→right so start=-180, end=0 mapped:
// We use the bottom half: 180° → 0° (going left to right via the top)
// Simpler: gauge arc from 180° to 0° (top arc). Angles in standard math coords.

// Map value fraction [0,1] to arc: 0 = leftmost (180°), 1 = rightmost (0°)
// Going from 180° down to 0° counter-clockwise means decreasing angle
function valueToAngle(frac: number): number {
  return 180 - frac * 180; // 180° at 0, 0° at 1
}

const ZONES = [
  { start: 0, end: 0.5, color: '#DC2626', label: 'Danger' },
  { start: 0.5, end: 0.75, color: '#D97706', label: 'Warning' },
  { start: 0.75, end: 1, color: '#16A34A', label: 'Safe' },
];

/**
 * SkeletonHealthGauge — arc-shaped skeleton placeholder.
 * Matches the live gauge dimensions exactly (viewBox "20 20 160 90").
 */
export function SkeletonHealthGauge() {
  return (
    <div
      className="flex flex-col items-center w-full"
      aria-busy="true"
      aria-label="Loading health gauge"
      data-testid="health-gauge-skeleton"
    >
      <svg viewBox="20 20 160 90" className="w-full max-w-xs" aria-hidden="true">
        {/* Background track skeleton */}
        <path
          d={arcPath(180, 0)}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="skeleton-shimmer"
          style={{ stroke: 'var(--color-skeleton-base)' }}
        />
        {/* Needle placeholder */}
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - (R - STROKE / 2)}
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ stroke: 'var(--color-skeleton-base)' }}
        />
        <circle cx={CX} cy={CY} r={5} style={{ fill: 'var(--color-skeleton-base)' }} />
        {/* Value text placeholder */}
        <rect
          x={CX - 18}
          y={CY + 9}
          width={36}
          height={12}
          rx={4}
          className="skeleton-shimmer"
          style={{ fill: 'var(--color-skeleton-base)' }}
        />
      </svg>
      {/* Label placeholder */}
      <div
        className="skeleton-shimmer mt-1 rounded"
        style={{ width: '3.5rem', height: '1rem', background: 'var(--color-skeleton-base)' }}
        aria-hidden="true"
      />
    </div>
  );
}

export default function HealthGauge({ value, history, loading }: Props) {
  if (loading) {
    return <SkeletonHealthGauge />;
  }
  const frac = Math.min(value / 20_000, 1); // cap at 200% (2.0x)
  const displayValue = (value / 10_000).toFixed(2);
  const color = healthColor(value);
  const label = value >= 15_000 ? 'Safe' : value >= 10_000 ? 'Warning' : 'Danger';

  const prevValueRef = useRef<number>(value);
  const [flash, setFlash] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev !== value) {
      setDirection(value > prev ? 'up' : 'down');
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1000);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [value]);

  // Animate needle via ref to avoid re-renders
  const needleRef = useRef<SVGLineElement>(null);
  const progressRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const targetAngle = valueToAngle(frac);
    const targetRad = (targetAngle * Math.PI) / 180;
    const nx = CX + (R - STROKE / 2) * Math.cos(targetRad);
    const ny = CY + (R - STROKE / 2) * Math.sin(targetRad);

    if (needleRef.current) {
      needleRef.current.setAttribute('x2', String(nx));
      needleRef.current.setAttribute('y2', String(ny));
    }

    // Animate progress arc stroke-dashoffset
    if (progressRef.current) {
      const arcLength = Math.PI * R; // half circumference
      const filledLength = frac * arcLength;
      progressRef.current.style.strokeDasharray = `${arcLength}`;
      progressRef.current.style.strokeDashoffset = `${arcLength - filledLength}`;
    }
  }, [frac]);

  const needleAngle = valueToAngle(frac);
  const needleRad = (needleAngle * Math.PI) / 180;
  const nx = CX + (R - STROKE / 2) * Math.cos(needleRad);
  const ny = CY + (R - STROKE / 2) * Math.sin(needleRad);

  return (
    <div
      className={`flex flex-col items-center w-full ${flash ? 'motion-safe:animate-[flashHighlight_1s_ease-out]' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Health factor: ${displayValue}x, ${label}${direction !== 'none' ? `, changed ${direction}` : ''}`}
    >
      <svg viewBox="20 20 160 90" className="w-full max-w-xs" aria-hidden="true">
        {/* Background track */}
        <path
          d={arcPath(180, 0)}
          fill="none"
          style={{ stroke: 'var(--token-border)' }}
          strokeWidth={STROKE}
          strokeLinecap="round"
        />

        {/* Color zone arcs */}
        {ZONES.map((z) => (
          <path
            key={z.label}
            d={arcPath(valueToAngle(z.start), valueToAngle(z.end))}
            fill="none"
            stroke={z.color}
            strokeWidth={STROKE}
            opacity={0.25}
          />
        ))}

        {/* Filled progress arc — animated via useEffect */}
        <path
          ref={progressRef}
          d={arcPath(180, 0)}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="motion-reduce:transition-none"
          style={{
            strokeDasharray: `${Math.PI * R}`,
            strokeDashoffset: `${Math.PI * R * (1 - frac)}`,
            transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.6s ease-out',
          }}
        />

        {/* Needle */}
        <line
          ref={needleRef}
          x1={CX}
          y1={CY}
          x2={nx}
          y2={ny}
          strokeWidth={2.5}
          strokeLinecap="round"
          className="motion-reduce:transition-none"
          style={{ stroke: 'var(--token-text)', transition: 'x2 0.6s ease-out, y2 0.6s ease-out' }}
        />
        <circle cx={CX} cy={CY} r={5} style={{ fill: 'var(--token-text)' }} />

        {/* Numeric value */}
        <text x={CX} y={CY + 18} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
          {displayValue}x
        </text>

        {/* Direction indicator */}
        {direction !== 'none' && (
          <text
            x={CX + 28}
            y={CY + 10}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill={flash ? '#D97706' : color}
            className={flash ? 'motion-safe:animate-[fadeOut_1s_ease-out]' : ''}
            aria-hidden="true"
          >
            {direction === 'up' ? '▲' : '▼'}
          </text>
        )}
      </svg>

      {/* Label below */}
      <span className="text-sm font-semibold mt-1" style={{ color }}>
        {label}
      </span>

      {/* Flash overlay for accessibility */}
      {flash && (
        <span className="sr-only" aria-live="polite">
          Health factor {direction === 'up' ? 'increased' : 'decreased'} to {displayValue}x
        </span>
      )}

      {/* Optional history chart */}
      {history && history.length > 0 && <HistoryChart history={history} />}
    </div>
  );
}
