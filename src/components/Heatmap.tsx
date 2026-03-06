"use client";

import { DayData } from "@/types/strava";
import { useMemo, useState, useRef, useEffect } from "react";

interface Props {
  data: Map<string, DayData>;
  startYear: number;
  endYear: number;
}

function getColor(distance: number): string {
  if (distance === 0) return "#1a1a1a";
  if (distance < 3) return "#2d4a22";
  if (distance < 5) return "#3a6b2a";
  if (distance < 8) return "#4a8c34";
  if (distance < 12) return "#5aad3e";
  if (distance < 16) return "#6cce48";
  return "#7def52";
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

const MIN_CELL = 4;
const GAP = 2;

export default function Heatmap({ data, startYear, endYear }: Props) {
  const [selectedYear, setSelectedYear] = useState(endYear);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(12);

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

  // Responsive cell size
  useEffect(() => {
    function calc() {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth;
      const numWeeks = weeks.length;
      const size = Math.floor((availableWidth - (numWeeks - 1) * GAP) / numWeeks);
      setCellSize(Math.max(MIN_CELL, size));
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [weeks.length]);

  const col = cellSize + GAP;

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

  return (
    <div ref={containerRef} className="overflow-x-auto">
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

      {/* Month labels */}
      <div style={{ height: 18, position: "relative" }}>
        {monthLabels.map((m) => (
          <span
            key={m.label}
            className="text-xs text-neutral-500"
            style={{ position: "absolute", left: m.weekIndex * col }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: GAP, width: "100%" }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP, flex: 1 }}>
              {week.map((day, di) => {
                if (!day)
                  return <div key={di} style={{ aspectRatio: "1", width: "100%" }} />;
                const d = data.get(day);
                const dist = d?.distance || 0;
                return (
                  <div
                    key={day}
                    style={{
                      aspectRatio: "1",
                      width: "100%",
                      backgroundColor: getColor(dist),
                      borderRadius: 2,
                    }}
                    title={`${day}: ${dist > 0 ? dist.toFixed(1) + " km" : "Rest day"}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 text-xs text-neutral-500">
        <span>Less</span>
        {[0, 3, 5, 8, 12, 16].map((v) => (
          <div
            key={v}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: getColor(v),
              borderRadius: 2,
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
