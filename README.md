# Endless Miles

Personal running & cycling data visualization, powered by Strava data.

Live demo: https://endless-miles-peach.vercel.app

## Tech Stack

- Next.js + TypeScript + Tailwind CSS
- Strava API (OAuth2)
- Recharts
- Vercel (hosting, auto-deploy on push)

---

## Deploy Your Own

Follow these steps to set up your own Strava dashboard.

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/endless-miles.git
cd endless-miles
npm install
```

### 2. Create a Strava API Application

1. Go to https://www.strava.com/settings/api
2. Create an application:
   - **Application Name**: anything (e.g. "My Dashboard")
   - **Authorization Callback Domain**: `localhost`
3. Note your **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```
STRAVA_CLIENT_ID=<your-client-id>
STRAVA_CLIENT_SECRET=<your-client-secret>
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/api/strava/callback
```

### 4. Authorize & Fetch Initial Data

Start the dev server and trigger the OAuth flow:

```bash
npm run dev
```

Open http://localhost:3000/api/strava in your browser. This will:

1. Redirect you to Strava to authorize the app
2. Fetch all your activities
3. Save `data/activities.json` (activity data), `data/athlete.json` (profile), and `data/.tokens.json` (refresh token)

You should see a JSON response with your activity count. Your dashboard is now live at http://localhost:3000.

### 5. Deploy to Vercel

1. Push your repo to GitHub (make sure `data/activities.json` is committed)
2. Go to https://vercel.com/new and import your repo
3. Deploy — no environment variables needed (data is pre-built as static JSON)

Your site is live. Vercel auto-deploys on every push to `main`.

---

## Syncing New Activities

After recording new activities on Strava, sync and deploy:

```bash
npm run sync
git add data/activities.json
git commit -m "sync strava data"
git push
```

Or as a one-liner:

```bash
npm run sync && git add data/activities.json && git commit -m "sync strava data" && git push
```

Vercel detects the push and rebuilds automatically (~30 seconds).

### What `npm run sync` does

1. Refreshes your Strava access token (tokens expire every 6 hours)
2. Fetches all activities from Strava API (handles pagination & rate limiting)
3. Saves to `data/activities.json`

---

## Auto Sync with GitHub Actions (Optional)

Set up daily automatic syncing so your dashboard stays up-to-date without manual work.

### 1. Create a GitHub Personal Access Token

1. Go to https://github.com/settings/personal-access-tokens
2. **Generate new token** (Fine-grained)
3. Select your `endless-miles` repository
4. Repository permissions: **Secrets** → Read and write
5. Copy the token

### 2. Add GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions, and add:

| Secret | Value |
|--------|-------|
| `STRAVA_CLIENT_ID` | Your Strava Client ID |
| `STRAVA_CLIENT_SECRET` | Your Strava Client Secret |
| `STRAVA_REFRESH_TOKEN` | Copy from `data/.tokens.json` → `refresh_token` field |
| `GH_PAT` | The GitHub Personal Access Token from step 1 |

### 3. Enable the Workflow

The workflow `.github/workflows/daily-strava-sync.yml` is included in the repo. It will:

- Run daily at **06:00 Beijing time** (UTC 22:00)
- Fetch latest activities from Strava
- Commit and push if there are new activities
- Update the refresh token in GitHub Secrets automatically

You can also trigger it manually from the **Actions** tab.

To change the schedule, edit the cron expression in the workflow file:

```yaml
schedule:
  - cron: "0 22 * * *"  # UTC 22:00 = Beijing 06:00
```

---

## Project Structure

```
endless-miles/
├── src/
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # Dashboard chart components
│   ├── lib/              # Strava API client & data processing
│   └── types/            # TypeScript types
├── data/
│   ├── activities.json   # Strava activity data (committed)
│   └── .tokens.json      # Strava refresh token (git-ignored)
├── scripts/
│   └── refetch.ts        # Strava sync script
└── .github/workflows/
    └── daily-strava-sync.yml
```

## Changelog

- **2026-03-09** — Open-sourced; added complete setup guide; GitHub Actions auto sync
- **2026-03-08** — Code cleanup: deduplicate type sets, fix country mapping, add rate limit retries
- **2026-03-08** — Renamed from `run-dashboard` to `endless-miles`; fixed Strava sync command
- **2026-03-07** — Added Tamzen pixel font for data display
- **2026-03-06** — Added time of day, day of week, heart rate, pace vs HR, country stats charts
- **2026-03-05** — Rewrote heatmap with SVG; improved mobile layout
- **2026-03-04** — Initial release: yearly charts, stats overview, top activities, distance histogram, heatmap

## License

MIT
