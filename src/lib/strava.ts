import { StravaActivity, StravaTokenResponse } from "@/types/strava";

const STRAVA_API = "https://www.strava.com/api/v3";
const STRAVA_AUTH = "https://www.strava.com/oauth";

export function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI!,
    response_type: "code",
    scope: "activity:read_all",
  });
  return `${STRAVA_AUTH}/authorize?${params}`;
}

export async function exchangeToken(code: string): Promise<StravaTokenResponse> {
  const res = await fetch(`${STRAVA_AUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function refreshToken(token: string): Promise<StravaTokenResponse> {
  const res = await fetch(`${STRAVA_AUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: token,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return res.json();
}

/**
 * Fetch all activities from Strava API (handles pagination).
 * Strava returns max 200 per page.
 */
export async function fetchAllActivities(
  accessToken: string,
  after?: number // Unix timestamp
): Promise<StravaActivity[]> {
  const allActivities: StravaActivity[] = [];
  let page = 1;
  const perPage = 200;
  let retries = 0;

  while (true) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (after) params.set("after", String(after));

    const res = await fetch(`${STRAVA_API}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 429 && retries < 3) {
        retries++;
        const retryAfter = Number(res.headers.get("Retry-After") || 60);
        console.log(`Rate limited, waiting ${retryAfter}s (retry ${retries}/3)...`);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        continue;
      }
      throw new Error(`Strava API error: ${res.status}`);
    }
    retries = 0;

    const activities: StravaActivity[] = await res.json();
    if (activities.length === 0) break;

    allActivities.push(...activities);
    console.log(`Fetched page ${page}: ${activities.length} activities (total: ${allActivities.length})`);

    if (activities.length < perPage) break;
    page++;
  }

  return allActivities;
}
