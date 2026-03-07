"use client";

import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
}

export default function IndoorOutdoor({ activities }: Props) {
  const stats = useMemo(() => {
    let indoor = 0;
    let outdoor = 0;
    for (const a of activities) {
      if (a.trainer || a.sport_type?.startsWith("Virtual")) {
        indoor++;
      } else {
        outdoor++;
      }
    }
    const total = indoor + outdoor;
    return {
      indoor,
      outdoor,
      total,
      indoorPct: total > 0 ? Math.round((indoor / total) * 100) : 0,
      outdoorPct: total > 0 ? Math.round((outdoor / total) * 100) : 0,
    };
  }, [activities]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Indoor vs Outdoor</h2>
      {/* Bar */}
      <div className="flex rounded-full overflow-hidden h-6 mb-4">
        {stats.outdoorPct > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold"
            style={{
              width: `${stats.outdoorPct}%`,
              backgroundColor: "#4ade80",
              color: "#000",
              fontFamily: "var(--font-mono)",
            }}
          >
            {stats.outdoorPct}%
          </div>
        )}
        {stats.indoorPct > 0 && (
          <div
            className="flex items-center justify-center text-xs font-semibold"
            style={{
              width: `${stats.indoorPct}%`,
              backgroundColor: "#525252",
              color: "#fff",
              fontFamily: "var(--font-mono)",
            }}
          >
            {stats.indoorPct}%
          </div>
        )}
      </div>
      {/* Labels */}
      <div className="flex justify-between text-sm">
        <div>
          <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: "#4ade80" }} />
          <span className="text-neutral-400">Outdoor</span>
          <span className="ml-2 font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{stats.outdoor}</span>
        </div>
        <div>
          <span className="inline-block w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: "#525252" }} />
          <span className="text-neutral-400">Indoor</span>
          <span className="ml-2 font-semibold" style={{ fontFamily: "var(--font-mono)" }}>{stats.indoor}</span>
        </div>
      </div>
    </div>
  );
}
