"use client";

import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
}

const SIZE = 240;
const CENTER = SIZE / 2;
const OUTER_R = 100;
const INNER_R = 40;

function polarToXY(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [Math.round((CENTER + r * Math.cos(rad)) * 100) / 100, Math.round((CENTER + r * Math.sin(rad)) * 100) / 100];
}

function arcPath(startAngle: number, endAngle: number, innerR: number, outerR: number): string {
  const [x1, y1] = polarToXY(startAngle, outerR);
  const [x2, y2] = polarToXY(endAngle, outerR);
  const [x3, y3] = polarToXY(endAngle, innerR);
  const [x4, y4] = polarToXY(startAngle, innerR);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4} Z`;
}

export default function TimeOfDay({ activities }: Props) {
  const data = useMemo(() => {
    const hours = Array(24).fill(0);
    for (const a of activities) {
      const h = parseInt(a.start_date_local.slice(11, 13), 10);
      hours[h]++;
    }
    return hours;
  }, [activities]);

  const maxCount = Math.max(...data);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Time of Day</h2>
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Hour segments */}
          {data.map((count, hour) => {
            const startAngle = (hour / 24) * 360;
            const endAngle = ((hour + 1) / 24) * 360;
            const intensity = maxCount > 0 ? count / maxCount : 0;
            const r = INNER_R + (OUTER_R - INNER_R) * intensity;
            return (
              <path
                key={hour}
                d={arcPath(startAngle, endAngle, INNER_R, r)}
                fill="#4ade80"
                fillOpacity={count > 0 ? intensity * 0.8 + 0.2 : 0.05}
                stroke="#000"
                strokeWidth={1}
              >
                <title>{`${hour}:00 — ${count} activities`}</title>
              </path>
            );
          })}

          {/* Hour labels */}
          {[0, 3, 6, 9, 12, 15, 18, 21].map((hour) => {
            const angle = (hour / 24) * 360;
            const [x, y] = polarToXY(angle, OUTER_R + 14);
            return (
              <text
                key={hour}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#666"
                fontSize={11}
                fontFamily="var(--font-mono)"
              >
                {hour}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
