/**
 * Re-fetch all activities using saved refresh token.
 * Usage: npx tsx scripts/refetch.ts
 */

import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";

const STRAVA_AUTH = "https://www.strava.com/oauth";
const STRAVA_API = "https://www.strava.com/api/v3";

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  const tokensPath = path.join(dataDir, ".tokens.json");

  const tokens = JSON.parse(await readFile(tokensPath, "utf-8"));
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET env vars");
    console.error("Run: source .env.local && npx tsx scripts/refetch.ts");
    process.exit(1);
  }

  // Refresh access token
  console.log("Refreshing token...");
  const tokenRes = await fetch(`${STRAVA_AUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token refresh failed: ${tokenRes.status}`);
  const newTokens = await tokenRes.json();

  await writeFile(tokensPath, JSON.stringify({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    expires_at: newTokens.expires_at,
  }));
  console.log("Token refreshed.");

  // Fetch all activities
  const accessToken = newTokens.access_token;
  const allActivities: any[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({ page: String(page), per_page: "200" });
    const res = await fetch(`${STRAVA_API}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.status === 429) {
      const wait = Number(res.headers.get("Retry-After") || 60);
      console.log(`Rate limited, waiting ${wait}s...`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const activities = await res.json();
    if (activities.length === 0) break;

    allActivities.push(...activities);
    console.log(`Page ${page}: ${activities.length} (total: ${allActivities.length})`);

    if (activities.length < 200) break;
    page++;
  }

  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, "activities.json"), JSON.stringify(allActivities, null, 2));

  // Stats
  const types: Record<string, number> = {};
  for (const a of allActivities) {
    const t = a.sport_type || a.type;
    types[t] = (types[t] || 0) + 1;
  }
  console.log(`\nTotal: ${allActivities.length} activities`);
  for (const [t, c] of Object.entries(types).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t}: ${c}`);
  }
  console.log("\nSaved to data/activities.json");
}

main().catch(console.error);
