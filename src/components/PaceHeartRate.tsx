"use client";

import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
}

const SIZE = 300;
const MARGIN = { top: 20, right: 20, bottom: 45, left: 55 };
const W = SIZE - MARGIN.left - MARGIN.right;
const H = SIZE - MARGIN.top - MARGIN.bottom;

const HR_MIN = 80;
const HR_MAX = 200;
const PACE_MIN = 3;
const PACE_MAX = 10;

export default function PaceHeartRate({ activities }: Props) {
  const points = useMemo(() => {
    return activities
      .filter((a) => a.average_heartrate && a.distance > 500)
      .map((a) => {
        const paceMinPerKm = (a.moving_time / 60) / (a.distance / 1000);
        return {
          hr: a.average_heartrate!,
          pace: paceMinPerKm,
        };
      })
      .filter((p) => p.hr >= HR_MIN && p.hr <= HR_MAX && p.pace >= PACE_MIN && p.pace <= PACE_MAX);
  }, [activities]);

  function xScale(pace: number): number {
    return Math.round((MARGIN.left + ((pace - PACE_MIN) / (PACE_MAX - PACE_MIN)) * W) * 100) / 100;
  }

  function yScale(hr: number): number {
    return Math.round((MARGIN.top + ((HR_MAX - hr) / (HR_MAX - HR_MIN)) * H) * 100) / 100;
  }

  const paceTicks = [3, 4, 5, 6, 7, 8, 9, 10];
  const hrTicks = [80, 100, 120, 140, 160, 180, 200];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pace vs Heart Rate</h2>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block">
          {/* Grid lines */}
          {paceTicks.map((p) => (
            <line key={`gx${p}`} x1={xScale(p)} y1={MARGIN.top} x2={xScale(p)} y2={MARGIN.top + H} stroke="#222" strokeWidth={1} />
          ))}
          {hrTicks.map((hr) => (
            <line key={`gy${hr}`} x1={MARGIN.left} y1={yScale(hr)} x2={MARGIN.left + W} y2={yScale(hr)} stroke="#222" strokeWidth={1} />
          ))}

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={xScale(p.pace)}
              cy={yScale(p.hr)}
              r={2.5}
              fill="#4ade80"
              fillOpacity={0.4}
            >
              <title>{`Pace: ${Math.floor(p.pace)}'${String(Math.round((p.pace % 1) * 60)).padStart(2, "0")}"/km, HR: ${Math.round(p.hr)} bpm`}</title>
            </circle>
          ))}

          {/* X axis tick labels */}
          {paceTicks.map((p) => (
            <text key={`lx${p}`} x={xScale(p)} y={MARGIN.top + H + 16} textAnchor="middle" fill="#666" fontSize={10} fontFamily="var(--font-mono)">
              {p}:00
            </text>
          ))}
          {/* X axis title */}
          <text x={MARGIN.left + W / 2} y={SIZE - 4} textAnchor="middle" fill="#555" fontSize={11}>
            pace (min/km)
          </text>

          {/* Y axis tick labels */}
          {hrTicks.map((hr) => (
            <text key={`ly${hr}`} x={MARGIN.left - 10} y={yScale(hr) + 4} textAnchor="end" fill="#666" fontSize={10} fontFamily="var(--font-mono)">
              {hr}
            </text>
          ))}
          {/* Y axis title */}
          <text x={12} y={MARGIN.top + H / 2} textAnchor="middle" fill="#555" fontSize={11} transform={`rotate(-90, 12, ${MARGIN.top + H / 2})`}>
            bpm
          </text>
        </svg>
      </div>
    </div>
  );
}
