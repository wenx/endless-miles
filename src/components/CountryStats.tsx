"use client";

import { StravaActivity } from "@/types/strava";
import { useMemo } from "react";

interface Props {
  activities: StravaActivity[];
}

const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);
const RIDE_TYPES = new Set(["Ride", "VirtualRide", "GravelRide", "EBikeRide", "MountainBikeRide"]);

const TZ_TO_COUNTRY: Record<string, [string, string]> = {
  "Asia/Shanghai": ["🇨🇳", "China"],
  "Asia/Hong_Kong": ["🇭🇰", "Hong Kong"],
  "Asia/Macau": ["🇲🇴", "Macau"],
  "Asia/Tokyo": ["🇯🇵", "Japan"],
  "Asia/Singapore": ["🇸🇬", "Singapore"],
  "Asia/Kuala_Lumpur": ["🇲🇾", "Malaysia"],
  "Asia/Bangkok": ["🇹🇭", "Thailand"],
  "Asia/Brunei": ["🇨🇳", "China"],
  "Asia/Thimphu": ["🇧🇹", "Bhutan"],
  "Asia/Chita": ["🇨🇳", "China"],
  "Antarctica/Casey": ["🇨🇳", "China"],
  "America/Los_Angeles": ["🇺🇸", "USA"],
  "America/Creston": ["🇨🇦", "Canada"],
  "America/Edmonton": ["🇨🇦", "Canada"],
  "Europe/Rome": ["🇮🇹", "Italy"],
  "Europe/Istanbul": ["🇹🇷", "Turkey"],
  "Africa/Algiers": ["🇹🇳", "Tunisia"],
  "Africa/Tunis": ["🇹🇳", "Tunisia"],
};

function getCountry(timezone?: string): [string, string] {
  if (!timezone) return ["🌍", "Unknown"];
  // timezone format: "(GMT+08:00) Asia/Shanghai"
  const tz = timezone.split(") ")[1];
  if (tz && TZ_TO_COUNTRY[tz]) return TZ_TO_COUNTRY[tz];
  return ["🌍", tz || "Unknown"];
}

export default function CountryStats({ activities }: Props) {
  const countryData = useMemo(() => {
    const map = new Map<string, { flag: string; runs: number; rides: number; distance: number }>();
    for (const a of activities) {
      const [flag, country] = getCountry(a.timezone);
      const existing = map.get(country) || { flag, runs: 0, rides: 0, distance: 0 };
      if (RUN_TYPES.has(a.sport_type)) existing.runs++;
      else if (RIDE_TYPES.has(a.sport_type)) existing.rides++;
      existing.distance += a.distance / 1000;
      map.set(country, existing);
    }
    return Array.from(map.entries())
      .map(([country, { flag, runs, rides, distance }]) => ({ country, flag, runs, rides, distance }))
      .sort((a, b) => (b.runs + b.rides) - (a.runs + a.rides));
  }, [activities]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Activities by Country</h2>
      <div className="space-y-0">
        {countryData.map((c) => (
          <div key={c.country} className="flex items-center justify-between py-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span>{c.flag}</span>
              <span>{c.country}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-400" style={{ fontFamily: "var(--font-mono)" }}>{Math.round(c.distance)} km</span>
              <span className="text-neutral-400 w-20 text-right" style={{ fontFamily: "var(--font-mono)" }}>{c.runs} runs</span>
              <span className="text-neutral-400 w-20 text-right" style={{ fontFamily: "var(--font-mono)" }}>{c.rides} rides</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
