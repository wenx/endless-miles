"use client";

import { DayData } from "@/types/strava";
import { useMemo, useState } from "react";

interface Props {
  data: Map<string, DayData>;
  startYear: number;
  endYear: number;
}

function getOpacity(distance: number, maxDist: number): number {
  if (distance === 0) return 0;
  return (distance / maxDist) * 0.8 + 0.2;
}

function getDaysInYear(year: number) {
  const days: string[] = [];
  const d = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  while (d <= end) {
    days.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
    d.setDate(d.getDate() + 1);
  }
  return days;
}

const CELL = 14;
const GAP = 3;
const STEP = CELL + GAP;
const MONTH_LABEL_HEIGHT = 18;

export default function Heatmap({ data, startYear, endYear }: Props) {
  const [selectedYear, setSelectedYear] = useState(endYear);

  const years = useMemo(() => {
    const arr = [];
    for (let y = startYear; y <= endYear; y++) arr.push(y);
    return arr;
  }, [startYear, endYear]);

  const days = useMemo(() => getDaysInYear(selectedYear), [selectedYear]);
  const firstDayOfWeek = new Date(selectedYear, 0, 1).getDay();

  const weeks: (string | null)[][] = useMemo(() => {
    const result: (string | null)[][] = [];
    let currentWeek: (string | null)[] = Array(firstDayOfWeek).fill(null);
    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      result.push(currentWeek);
    }
    return result;
  }, [days, firstDayOfWeek]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let m = 0; m < 12; m++) {
      const firstDay = `${selectedYear}-${String(m + 1).padStart(2, "0")}-01`;
      const weekIdx = weeks.findIndex((w) => w.includes(firstDay));
      if (weekIdx >= 0) labels.push({ label: months[m], weekIndex: weekIdx });
    }
    return labels;
  }, [weeks, selectedYear]);

  const yearDays = days.filter((d) => data.has(d));
  const yearDist = yearDays.reduce((s, d) => s + (data.get(d)?.distance || 0), 0);
  const maxDist = useMemo(() => {
    let max = 0;
    for (const d of days) {
      const v = data.get(d)?.distance || 0;
      if (v > max) max = v;
    }
    return max || 1;
  }, [days, data]);

  const svgWidth = weeks.length * STEP - GAP;
  const svgHeight = 7 * STEP - GAP + MONTH_LABEL_HEIGHT;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Activity Heatmap</h2>
        <div className="flex flex-wrap gap-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                y === selectedYear
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="text-sm text-neutral-500 mb-3">
        <span style={{ fontFamily: "var(--font-mono)" }}>{yearDays.length}</span> active days · <span style={{ fontFamily: "var(--font-mono)" }}>{Math.round(yearDist)}</span> km
      </div>

      {/* Scrollable SVG heatmap */}
      <div className="overflow-x-auto pb-2">
        <svg width={svgWidth} height={svgHeight} className="block">
          {/* Month labels */}
          {monthLabels.map((m) => (
            <text
              key={m.label}
              x={m.weekIndex * STEP}
              y={12}
              fill="#666"
              fontSize={11}
              fontFamily="var(--font-sans)"
            >
              {m.label}
            </text>
          ))}

          {/* Day cells */}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) return null;
              const d = data.get(day);
              const dist = d?.distance || 0;
              return (
                <rect
                  key={day}
                  x={wi * STEP}
                  y={di * STEP + MONTH_LABEL_HEIGHT}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  fill={dist > 0 ? "#4ade80" : "#1a1a1a"}
                  fillOpacity={dist > 0 ? getOpacity(dist, maxDist) : 1}
                >
                  <title>{`${day}: ${dist > 0 ? dist.toFixed(1) + " km" : "Rest day"}`}</title>
                </rect>
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
        <span>Less</span>
        {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((opacity, i) => (
          <svg key={i} width={CELL} height={CELL}>
            <rect
              width={CELL}
              height={CELL}
              rx={2}
              fill={i === 0 ? "#1a1a1a" : "#4ade80"}
              fillOpacity={i === 0 ? 1 : opacity}
            />
          </svg>
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
