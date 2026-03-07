"use client";

import { useMemo, useState } from "react";
import { StravaActivity, DayData, YearSummary } from "@/types/strava";
import { filterByType, aggregateByDay, summarizeByYear, overallStats, SportType } from "@/lib/process";
import StatsOverview from "./StatsOverview";
import YearlyChart from "./YearlyChart";
import Heatmap from "./Heatmap";
import PaceDistribution from "./PaceDistribution";
import DistanceHistogram from "./DistanceHistogram";
import TopRuns from "./TopRuns";
import CountryStats from "./CountryStats";
import TimeOfDay from "./TimeOfDay";
import DayOfWeek from "./DayOfWeek";
import HeartRateZones from "./HeartRateZones";
import PaceHeartRate from "./PaceHeartRate";

interface Props {
  allActivities: StravaActivity[];
}

const SPORT_TABS: { label: string; value: SportType; icon: string }[] = [
  { label: "All", value: "All", icon: "🏃‍♂️🚴" },
  { label: "Running", value: "Run", icon: "🏃‍♂️" },
  { label: "Cycling", value: "Ride", icon: "🚴" },
];

export default function Dashboard({ allActivities }: Props) {
  const [sportType, setSportType] = useState<SportType>("All");

  const activities = useMemo(() => filterByType(allActivities, sportType), [allActivities, sportType]);
  const stats = useMemo(() => overallStats(activities), [activities]);
  const yearSummaries = useMemo(() => summarizeByYear(activities), [activities]);
  const dayMap = useMemo(() => aggregateByDay(activities), [activities]);

  const startYear = yearSummaries.length > 0 ? yearSummaries[0].year : 2020;
  const endYear = yearSummaries.length > 0 ? yearSummaries[yearSummaries.length - 1].year : 2026;

  const isRun = sportType === "Run";
  const speedLabel = isRun ? "Pace" : "Speed";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-2">Endless Miles</h1>
          <p className="text-neutral-500 text-lg">Kevin&apos;s training journey since 2017</p>
        </header>

        {/* Sport Type Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {SPORT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSportType(tab.value)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                sportType === tab.value
                  ? "bg-white text-black"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <section className="mb-16">
          <StatsOverview {...stats} sportType={sportType} />
        </section>

        {/* Heatmap */}
        <section className="mb-16">
          <Heatmap data={dayMap} startYear={startYear} endYear={endYear} />
        </section>

        {/* Yearly Chart */}
        <section className="mb-16">
          <YearlyChart data={yearSummaries} sportType={sportType} />
        </section>

        {/* Charts Row 1 */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <PaceDistribution activities={activities} isRun={isRun} />
          <DistanceHistogram activities={activities} isRide={!isRun && sportType === "Ride"} />
        </section>

        {/* Charts Row 2 */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <TimeOfDay activities={activities} />
          <DayOfWeek activities={activities} />
        </section>

        {/* Heart Rate */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <HeartRateZones activities={activities} />
          <PaceHeartRate activities={activities} />
        </section>

        {/* Top Runs */}
        <section className="mb-16">
          <TopRuns activities={activities} sportType={sportType} />
        </section>

        {/* Country Stats */}
        <section className="mb-16">
          <CountryStats activities={activities} />
        </section>

        {/* Footer */}
        <footer className="text-center text-neutral-600 text-sm pt-8 border-t border-neutral-800">
          Data from Strava · Built with Next.js
        </footer>
      </div>
    </div>
  );
}
