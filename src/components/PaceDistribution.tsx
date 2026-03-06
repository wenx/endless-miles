"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
  isRun: boolean;
}

function formatPace(minPerKm: number): string {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}'${sec.toString().padStart(2, "0")}"`;
}

export default function PaceDistribution({ activities, isRun }: Props) {
  const data = useMemo(() => {
    if (isRun) {
      // Pace distribution (min/km)
      const buckets = new Map<string, number>();
      for (const a of activities) {
        if (a.distance < 500) continue;
        const paceMinPerKm = (a.moving_time / 60) / (a.distance / 1000);
        const bucket = Math.floor(paceMinPerKm * 2) / 2;
        const label = formatPace(bucket);
        buckets.set(label, (buckets.get(label) || 0) + 1);
      }
      return Array.from(buckets.entries())
        .map(([pace, count]) => ({ label: pace, count }))
        .sort((a, b) => a.label.localeCompare(b.label))
        .filter((_, i, arr) => i >= 2 && i < arr.length - 1);
    } else {
      // Speed distribution (km/h) for cycling
      const buckets = new Map<string, number>();
      for (const a of activities) {
        if (a.distance < 500) continue;
        const speedKmh = (a.distance / 1000) / (a.moving_time / 3600);
        const bucket = Math.floor(speedKmh / 2) * 2; // 2 km/h buckets
        const label = `${bucket}`;
        buckets.set(label, (buckets.get(label) || 0) + 1);
      }
      return Array.from(buckets.entries())
        .map(([label, count]) => ({ label: `${label} km/h`, count }))
        .sort((a, b) => parseInt(a.label) - parseInt(b.label))
        .filter((d) => d.count >= 2);
    }
  }, [activities, isRun]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{isRun ? "Pace" : "Speed"} Distribution</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 12, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#111", border: "1px solid #282828", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              labelStyle={{ color: "#888", fontSize: 12, marginBottom: 4 }}
              itemStyle={{ color: "#e5e5e5", fontSize: 13 }}
              formatter={(value) => [`${value}`, "Count"]}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => {
                const maxCount = Math.max(...data.map((d) => d.count));
                return <Cell key={i} fill={entry.count === maxCount ? "#f97316" : "#525252"} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
