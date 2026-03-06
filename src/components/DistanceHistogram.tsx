"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
  isRide: boolean;
}

export default function DistanceHistogram({ activities, isRide }: Props) {
  const data = useMemo(() => {
    const ranges = isRide
      ? [
          [0, 10, "0-10"],
          [10, 20, "10-20"],
          [20, 30, "20-30"],
          [30, 50, "30-50"],
          [50, 80, "50-80"],
          [80, 120, "80-120"],
          [120, 999, "120+"],
        ] as const
      : [
          [0, 3, "0-3"],
          [3, 5, "3-5"],
          [5, 7, "5-7"],
          [7, 10, "7-10"],
          [10, 15, "10-15"],
          [15, 21, "15-21"],
          [21, 30, "21-30"],
          [30, 999, "30+"],
        ] as const;

    return ranges.map(([min, max, label]) => ({
      range: `${label} km`,
      count: activities.filter((a) => {
        const km = a.distance / 1000;
        return km >= min && km < max;
      }).length,
    }));
  }, [activities, isRide]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Distance Distribution</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#111", border: "1px solid #282828", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              labelStyle={{ color: "#888", fontSize: 12, marginBottom: 4 }}
              itemStyle={{ color: "#e5e5e5", fontSize: 13 }}
              formatter={(value: number) => [`${value}`, "Count"]}
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
