import { readFile } from "fs/promises";
import path from "path";
import { StravaActivity } from "@/types/strava";
import Dashboard from "@/components/Dashboard";

async function loadActivities(): Promise<StravaActivity[]> {
  const filePath = path.join(process.cwd(), "data", "activities.json");
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export default async function Home() {
  const allActivities = await loadActivities();
  return <Dashboard allActivities={allActivities} />;
}
