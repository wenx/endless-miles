"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
}

const ZONES = [
  { name: "Recovery", min: 0, max: 120, color: "#60a5fa" },
  { name: "Easy", min: 120, max: 140, color: "#4ade80" },
  { name: "Aerobic", min: 140, max: 155, color: "#facc15" },
  { name: "Threshold", min: 155, max: 170, color: "#f97316" },
  { name: "Max", min: 170, max: 999, color: "#ef4444" },
];

export default function HeartRateZones({ activities }: Props) {
  const data = useMemo(() => {
    const counts = ZONES.map(() => 0);
    for (const a of activities) {
      if (!a.average_heartrate) continue;
      const hr = a.average_heartrate;
      for (let i = 0; i < ZONES.length; i++) {
        if (hr >= ZONES[i].min && hr < ZONES[i].max) {
          counts[i]++;
          break;
        }
      }
    }
    return ZONES.map((z, i) => ({
      zone: z.name,
      count: counts[i],
      color: z.color,
    }));
  }, [activities]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Heart Rate Zones</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="zone" tick={{ fontSize: 11, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#111", border: "1px solid #282828", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              labelStyle={{ color: "#888", fontSize: 12, marginBottom: 4 }}
              itemStyle={{ color: "#e5e5e5", fontSize: 13 }}
              formatter={(value) => [`${value}`, "Activities"]}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
