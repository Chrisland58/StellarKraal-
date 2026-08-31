'use client';

import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentPage } from '@/store/adminSlice';
import { AppDispatch } from '@/store/store';
import AdminLayout from '@/components/AdminLayout';
import Card from '@/components/Card';

// ─── Mock Data ────────────────────────────────────────────────────────────────

/** Generate 30 days of daily loan origination counts ending today. */
function generateLineData(): { date: string; loans: number }[] {
  const data: { date: string; loans: number }[] = [];
  const today = new Date(2026, 7, 29); // 2026-08-29 (month is 0-indexed)
  const seedValues = [
    3, 7, 5, 12, 8, 4, 9, 15, 11, 6, 10, 14, 7, 3, 18, 13, 5, 9, 16, 8,
    12, 4, 7, 20, 11, 6, 14, 9, 3, 10,
  ];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    data.push({ date: `${month}/${day}`, loans: seedValues[29 - i] });
  }
  return data;
}

const lineData = generateLineData();

const pieData: { label: string; value: number; color: string }[] = [
  { label: 'Active', value: 42, color: '#16a34a' },
  { label: 'Repaid', value: 89, color: '#2563eb' },
  { label: 'Liquidated', value: 7, color: '#dc2626' },
];

const barData: { type: string; value: number }[] = [
  { type: 'Cattle', value: 120000 },
  { type: 'Goats', value: 45000 },
  { type: 'Sheep', value: 32000 },
  { type: 'Pigs', value: 18000 },
];

// ─── Derived KPI values ───────────────────────────────────────────────────────

const totalLoans = pieData.reduce((sum, d) => sum + d.value, 0);
const activeLoans = pieData.find((d) => d.label === 'Active')?.value ?? 0;
const totalCollateralValue = barData.reduce((sum, d) => sum + d.value, 0);
const avgDailyOriginations =
  Math.round((lineData.reduce((sum, d) => sum + d.loans, 0) / lineData.length) * 10) / 10;

// ─── LineChart ────────────────────────────────────────────────────────────────

interface LineDataPoint {
  date: string;
  loans: number;
}

function LineChart({ data }: { data: LineDataPoint[] }) {
  const WIDTH = 600;
  const HEIGHT = 200;
  const PADDING = { top: 20, right: 20, bottom: 40, left: 40 };

  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map((d) => d.loans), 1);

  // Map data to SVG coordinates
  const points = data.map((d, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * chartW,
    y: PADDING.top + chartH - (d.loans / maxVal) * chartH,
    date: d.date,
    loans: d.loans,
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // X-axis tick indices: every 7 days (0, 6, 13, 20, 27, 29)
  const xTickIndices = [0, 6, 13, 20, 27, 29];

  // Y-axis ticks: 0, 25%, 50%, 75%, 100% of maxVal
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    value: Math.round(frac * maxVal),
    y: PADDING.top + chartH - frac * chartH,
  }));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ minWidth: '340px' }}
        aria-label="Line chart of daily loan originations over the past 30 days"
        role="img"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick.value}
            x1={PADDING.left}
            y1={tick.y}
            x2={PADDING.left + chartW}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeDasharray="4 2"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={tick.value}
            x={PADDING.left - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="10"
            fill="#6b7280"
          >
            {tick.value}
          </text>
        ))}

        {/* Y-axis line */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
        />

        {/* X-axis line */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + chartH}
          x2={PADDING.left + chartW}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
        />

        {/* Area fill under the line */}
        <polygon
          points={[
            `${points[0].x},${PADDING.top + chartH}`,
            ...points.map((p) => `${p.x},${p.y}`),
            `${points[points.length - 1].x},${PADDING.top + chartH}`,
          ].join(' ')}
          fill="#eab30820"
        />

        {/* Polyline */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#d97706"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data point dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#d97706" />
        ))}

        {/* X-axis labels */}
        {xTickIndices.map((idx) => (
          <text
            key={idx}
            x={points[idx].x}
            y={PADDING.top + chartH + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7280"
          >
            {data[idx].date}
          </text>
        ))}

        {/* X-axis title */}
        <text
          x={PADDING.left + chartW / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
        >
          Date (MM/DD)
        </text>

        {/* Y-axis title */}
        <text
          x={10}
          y={PADDING.top + chartH / 2}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
          transform={`rotate(-90, 10, ${PADDING.top + chartH / 2})`}
        >
          Loans
        </text>
      </svg>
    </div>
  );
}

// ─── PieChart ─────────────────────────────────────────────────────────────────

interface PieDataPoint {
  label: string;
  value: number;
  color: string;
}

/** Compute an SVG arc path string for a pie slice.
 *  cx, cy: center; r: radius; startAngle, endAngle in radians */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy + r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function PieChart({ data }: { data: PieDataPoint[] }) {
  const cx = 100;
  const cy = 100;
  const r = 80;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Build slices
  let currentAngle = -Math.PI / 2; // start at top
  const slices = data.map((d) => {
    const sliceAngle = (d.value / total) * 2 * Math.PI;
    const start = currentAngle;
    const end = currentAngle + sliceAngle;
    currentAngle = end;
    return { ...d, start, end };
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg
        viewBox="0 0 200 200"
        width="200"
        height="200"
        aria-label="Pie chart showing distribution of Active, Repaid, and Liquidated loans"
        role="img"
        style={{ flexShrink: 0 }}
      >
        {slices.map((slice, i) => (
          <path
            key={i}
            d={arcPath(cx, cy, r, slice.start, slice.end)}
            fill={slice.color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* Legend */}
      <ul className="flex flex-col gap-2 pt-2" role="list">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: d.color }}
              aria-hidden="true"
            />
            <span className="text-brown dark:text-cream font-medium">{d.label}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {d.value} ({Math.round((d.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────

interface BarDataPoint {
  type: string;
  value: number;
}

function BarChart({ data }: { data: BarDataPoint[] }) {
  const WIDTH = 400;
  const HEIGHT = 200;
  const PADDING = { top: 20, right: 20, bottom: 50, left: 60 };

  const chartW = WIDTH - PADDING.left - PADDING.right;
  const chartH = HEIGHT - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  // Round up to a nice number for the y-axis max
  const niceMax = Math.ceil(maxVal / 20000) * 20000;

  const barWidth = (chartW / data.length) * 0.6;
  const gap = chartW / data.length;

  // Y-axis ticks: 5 steps
  const ySteps = 4;
  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => ({
    value: Math.round((i / ySteps) * niceMax),
    y: PADDING.top + chartH - (i / ySteps) * chartH,
  }));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ minWidth: '300px' }}
        aria-label="Bar chart showing total collateral value per animal type"
        role="img"
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick.value}
            x1={PADDING.left}
            y1={tick.y}
            x2={PADDING.left + chartW}
            y2={tick.y}
            stroke="#e5e7eb"
            strokeDasharray="4 2"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={tick.value}
            x={PADDING.left - 6}
            y={tick.y + 4}
            textAnchor="end"
            fontSize="9"
            fill="#6b7280"
          >
            {tick.value >= 1000 ? `${tick.value / 1000}k` : tick.value}
          </text>
        ))}

        {/* Y-axis line */}
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
        />

        {/* X-axis line */}
        <line
          x1={PADDING.left}
          y1={PADDING.top + chartH}
          x2={PADDING.left + chartW}
          y2={PADDING.top + chartH}
          stroke="#d1d5db"
        />

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.value / niceMax) * chartH;
          const x = PADDING.left + i * gap + (gap - barWidth) / 2;
          const y = PADDING.top + chartH - barH;
          return (
            <g key={d.type}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                fill="#d97706"
                rx="3"
                ry="3"
              />
              {/* Value label on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#92400e"
                fontWeight="600"
              >
                {d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
              </text>
              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={PADDING.top + chartH + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {d.type}
              </text>
            </g>
          );
        })}

        {/* Y-axis title */}
        <text
          x={12}
          y={PADDING.top + chartH / 2}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
          transform={`rotate(-90, 12, ${PADDING.top + chartH / 2})`}
        >
          Value (USD)
        </text>

        {/* X-axis title */}
        <text
          x={PADDING.left + chartW / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
        >
          Animal Type
        </text>
      </svg>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StatisticsPage() {
  const dispatch = useDispatch<AppDispatch>();

  const pageData = useMemo(
    () => ({
      pageName: 'Statistics',
      routePath: 'statistics',
    }),
    []
  );

  useEffect(() => {
    dispatch(setCurrentPage(pageData));
  }, [dispatch, pageData]);

  return (
    <AdminLayout>
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card header={<h3 className="font-semibold text-brown dark:text-cream">Total Loans</h3>}>
          <p className="text-3xl font-bold text-gold">{totalLoans}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">All time</p>
        </Card>

        <Card header={<h3 className="font-semibold text-brown dark:text-cream">Active Loans</h3>}>
          <p className="text-3xl font-bold text-green-600">{activeLoans}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Currently open</p>
        </Card>

        <Card
          header={
            <h3 className="font-semibold text-brown dark:text-cream">Total Collateral Value</h3>
          }
        >
          <p className="text-3xl font-bold text-gold">
            ${(totalCollateralValue / 1000).toFixed(0)}k
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">USD across all animals</p>
        </Card>

        <Card
          header={
            <h3 className="font-semibold text-brown dark:text-cream">Avg Daily Originations</h3>
          }
        >
          <p className="text-3xl font-bold text-gold">{avgDailyOriginations}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Past 30 days</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Line Chart */}
        <Card
          className="lg:col-span-2"
          header={
            <h3 className="font-semibold text-brown dark:text-cream">
              Daily Loan Originations — Past 30 Days
            </h3>
          }
        >
          <LineChart data={lineData} />
        </Card>

        {/* Pie Chart */}
        <Card
          header={
            <h3 className="font-semibold text-brown dark:text-cream">Loan Status Distribution</h3>
          }
        >
          <PieChart data={pieData} />
        </Card>

        {/* Bar Chart */}
        <Card
          header={
            <h3 className="font-semibold text-brown dark:text-cream">
              Collateral Value by Animal Type
            </h3>
          }
        >
          <BarChart data={barData} />
        </Card>
      </div>
    </AdminLayout>
  );
}
