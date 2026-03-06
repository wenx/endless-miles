"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { YearSummary } from "@/types/strava";
import { SportType } from "@/lib/process";

type Metric = "distance" | "elevation";

interface Props {
  data: YearSummary[];
  sportType: SportType;
}

export default function YearlyChart({ data, sportType }: Props) {
  const [metric, setMetric] = useState<Metric>("distance");

  const dataKey = metric === "distance" ? "totalDistance" : "totalElevation";
  const unit = metric === "distance" ? " km" : " m";
  const label = metric === "distance" ? "Distance" : "Elevation";
  const maxVal = Math.max(...data.map((d) => d[dataKey]));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Annual {label}</h2>
        <div className="flex gap-1">
          {([["distance", "Mileage"], ["elevation", "Elevation"]] as const).map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                metric === key
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="year" tick={{ fontSize: 13, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#999", fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} unit={unit} width={80} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{ background: "#111", border: "1px solid #282828", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              labelStyle={{ color: "#888", fontSize: 12, marginBottom: 4 }}
              itemStyle={{ color: "#e5e5e5", fontSize: 13 }}
              formatter={(value) => [`${Number(value).toLocaleString()}${unit}`, label]}
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.year}
                  fill={entry[dataKey] === maxVal ? "#f97316" : "#525252"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4 text-center text-sm">
        {data.map((y) => (
          <div key={y.year} className="bg-neutral-900 rounded-lg p-3">
            <div className="text-neutral-500">{y.year}</div>
            <div className="font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{y.totalActivities} {sportType === "Ride" ? "rides" : sportType === "All" ? "activities" : "runs"}</div>
            <div className="text-neutral-400" style={{ fontFamily: "var(--font-mono)" }}>{y.totalDuration} hrs</div>
          </div>
        ))}
      </div>
    </div>
  );
}
