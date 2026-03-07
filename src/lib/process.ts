import { StravaActivity, DayData, YearSummary } from "@/types/strava";

export type SportType = "Run" | "Ride" | "All";

const RUN_TYPES = new Set(["Run", "TrailRun", "VirtualRun"]);
const RIDE_TYPES = new Set(["Ride", "VirtualRide", "GravelRide", "EBikeRide", "MountainBikeRide"]);

export function filterByType(activities: StravaActivity[], type: SportType): StravaActivity[] {
  if (type === "All") return activities.filter((a) => {
    const t = a.sport_type || a.type;
    return RUN_TYPES.has(t) || RIDE_TYPES.has(t);
  });
  if (type === "Run") return activities.filter((a) => RUN_TYPES.has(a.sport_type || a.type));
  if (type === "Ride") return activities.filter((a) => RIDE_TYPES.has(a.sport_type || a.type));
  return activities;
}

/** Keep for backward compat */
export function filterRuns(activities: StravaActivity[]): StravaActivity[] {
  return filterByType(activities, "Run");
}

export function aggregateByDay(activities: StravaActivity[]): Map<string, DayData> {
  const days = new Map<string, DayData>();

  for (const a of activities) {
    const date = a.start_date_local.slice(0, 10);
    const existing = days.get(date);
    const distKm = a.distance / 1000;
    const durMin = a.moving_time / 60;
    const pace = distKm > 0 ? durMin / distKm : 0;

    if (existing) {
      existing.distance += distKm;
      existing.duration += durMin;
      existing.elevation += a.total_elevation_gain;
      existing.count += 1;
      if (a.average_heartrate) {
        existing.heartrate = existing.heartrate
          ? (existing.heartrate + a.average_heartrate) / 2
          : a.average_heartrate;
      }
      existing.pace = existing.distance > 0 ? existing.duration / existing.distance : 0;
    } else {
      days.set(date, {
        date,
        distance: distKm,
        duration: durMin,
        elevation: a.total_elevation_gain,
        pace,
        heartrate: a.average_heartrate,
        count: 1,
      });
    }
  }

  return days;
}

export function summarizeByYear(activities: StravaActivity[]): YearSummary[] {
  const years = new Map<number, StravaActivity[]>();

  for (const a of activities) {
    const year = parseInt(a.start_date_local.slice(0, 4), 10);
    if (!years.has(year)) years.set(year, []);
    years.get(year)!.push(a);
  }

  return Array.from(years.entries())
    .map(([year, acts]) => {
      const totalDistance = acts.reduce((s, a) => s + a.distance / 1000, 0);
      const totalDuration = acts.reduce((s, a) => s + a.moving_time / 3600, 0);
      const totalElevation = acts.reduce((s, a) => s + a.total_elevation_gain, 0);
      const longestRun = Math.max(...acts.map((a) => a.distance / 1000));
      const avgPace = totalDistance > 0 ? (totalDuration * 60) / totalDistance : 0;

      return {
        year,
        totalDistance: Math.round(totalDistance),
        totalDuration: Math.round(totalDuration),
        totalElevation: Math.round(totalElevation),
        totalActivities: acts.length,
        avgPace: Math.round(avgPace * 100) / 100,
        longestRun: Math.round(longestRun * 100) / 100,
      };
    })
    .sort((a, b) => a.year - b.year);
}

export function overallStats(activities: StravaActivity[]) {
  const totalDistance = activities.reduce((s, a) => s + a.distance / 1000, 0);
  const totalDuration = activities.reduce((s, a) => s + a.moving_time / 3600, 0);
  const totalElevation = activities.reduce((s, a) => s + a.total_elevation_gain, 0);
  const totalActivities = activities.length;

  return {
    totalDistance: Math.round(totalDistance),
    totalDuration: Math.round(totalDuration),
    totalElevation: Math.round(totalElevation),
    totalActivities,
  };
}
