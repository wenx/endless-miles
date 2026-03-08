"use client";

import { StravaActivity } from "@/types/strava";
import { SportType } from "@/lib/process";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
  sportType: SportType;
}

function formatPace(seconds: number, meters: number): string {
  const minPerKm = (seconds / 60) / (meters / 1000);
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}'${sec.toString().padStart(2, "0")}" /km`;
}

function formatSpeed(seconds: number, meters: number): string {
  const kmh = (meters / 1000) / (seconds / 3600);
  return `${kmh.toFixed(1)} km/h`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function TopRuns({ activities, sportType }: Props) {
  const isRun = sportType === "Run";
  const topByDistance = useMemo(
    () => [...activities].sort((a, b) => b.distance - a.distance).slice(0, 10),
    [activities]
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Top 10 Longest {isRun ? "Runs" : sportType === "Ride" ? "Rides" : "Activities"}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-500 text-left">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4 text-right">Distance</th>
              <th className="py-2 pr-4 text-right">Duration</th>
              <th className="py-2 text-right">{isRun ? "Pace" : "Speed"}</th>
            </tr>
          </thead>
          <tbody>
            {topByDistance.map((a, i) => (
              <tr key={a.id} className="border-t border-neutral-800">
                <td className="py-2 pr-4 text-neutral-500">{i + 1}</td>
                <td className="py-2 pr-4 text-neutral-400" style={{ fontFamily: "var(--font-mono)" }}>{a.start_date_local.slice(0, 10)}</td>
                <td className="py-2 pr-4" style={{ fontFamily: "var(--font-pixel)" }}>{a.name}</td>
                <td className="py-2 pr-4 text-right font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{(a.distance / 1000).toFixed(2)} km</td>
                <td className="py-2 pr-4 text-right text-neutral-400" style={{ fontFamily: "var(--font-mono)" }}>{formatDuration(a.moving_time)}</td>
                <td className="py-2 text-right text-neutral-400" style={{ fontFamily: "var(--font-mono)" }}>
                  {isRun ? formatPace(a.moving_time, a.distance) : formatSpeed(a.moving_time, a.distance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
