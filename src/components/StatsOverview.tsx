"use client";

import { SportType } from "@/lib/process";

interface Props {
  totalDistance: number;
  totalDuration: number;
  totalElevation: number;
  totalActivities: number;
  sportType: SportType;
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

export default function StatsOverview({ totalDistance, totalDuration, totalElevation, totalActivities, sportType }: Props) {
  const activityLabel = sportType === "Ride" ? "Total Rides" : sportType === "All" ? "Total Activities" : "Total Runs";
  const stats = [
    { label: "Total Distance", value: `${formatNumber(totalDistance)}`, unit: "km" },
    { label: "Total Duration", value: `${formatNumber(totalDuration)}`, unit: "hrs" },
    { label: "Total Elevation", value: `${formatNumber(totalElevation)}`, unit: "m" },
    { label: activityLabel, value: `${formatNumber(totalActivities)}`, unit: "" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
            {s.value}
            {s.unit && <span className="text-lg md:text-xl font-normal text-neutral-400 ml-1">{s.unit}</span>}
          </div>
          <div className="text-sm text-neutral-500 mt-1 uppercase tracking-wider">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
