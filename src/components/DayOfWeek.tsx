"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DayOfWeek({ activities }: Props) {
  const data = useMemo(() => {
    const counts = Array(7).fill(0);
    const distances = Array(7).fill(0);
    for (const a of activities) {
      const [y, m, d] = a.start_date_local.slice(0, 10).split("-").map(Number);
      const day = new Date(y, m - 1, d).getDay();
      counts[day]++;
      distances[day] += a.distance / 1000;
    }
    return DAYS.map((label, i) => ({
      day: label,
      avgDistance: counts[i] > 0 ? Math.round((distances[i] / counts[i]) * 10) / 10 : 0,
      count: counts[i],
    }));
  }, [activities]);

  const maxAvg = Math.max(...data.map((d) => d.avgDistance));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Avg Distance by Day</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} unit=" km" />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#111", border: "1px solid #282828", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              labelStyle={{ color: "#888", fontSize: 12, marginBottom: 4 }}
              itemStyle={{ color: "#e5e5e5", fontSize: 13 }}
              formatter={(value, name) => {
                if (name === "avgDistance") return [`${value} km`, "Avg Distance"];
                return [`${value}`, String(name)];
              }}
            />
            <Bar dataKey="avgDistance" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.avgDistance === maxAvg ? "#f97316" : "#525252"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
