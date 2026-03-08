# Endless Miles

Personal running & cycling data visualization, powered by Strava data.

Live site: https://endless-miles-peach.vercel.app

## Tech Stack

- Next.js + TypeScript + Tailwind CSS
- Strava API (OAuth2)
- Recharts
- Vercel (hosting, auto-deploy on push)

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
```

## Syncing Strava Data & Deploying

When you have new activities on Strava and want to update the website, run:

```bash
cd ~/Documents/projects/endless-miles

# Step 1: Pull latest activities from Strava
npm run sync

# Step 2: Commit and push — Vercel will auto-deploy
git add data/activities.json
git commit -m "sync strava data"
git push
```

That's it. Vercel detects the push and rebuilds automatically. The site updates within ~30 seconds.

### What `npm run sync` does

1. Refreshes your Strava access token (tokens expire every 6 hours)
2. Fetches all activities from Strava API (handles pagination & rate limiting)
3. Saves to `data/activities.json`

### One-liner

If you want to do it all in one command:

```bash
cd ~/Documents/projects/endless-miles && npm run sync && git add data/activities.json && git commit -m "sync strava data" && git push
```

### Automate with Cron (Optional)

To sync and deploy daily at 6am automatically:

```bash
crontab -e
```

Add:

```
0 6 * * * cd ~/Documents/projects/endless-miles && npm run sync && git add data/activities.json && git diff --cached --quiet || (git commit -m "auto sync strava data" && git push) >> /tmp/endless-miles-sync.log 2>&1
```

### Prerequisites

These files must exist (already set up):

- `.env.local` — Strava API credentials (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`)
- `data/.tokens.json` — Strava refresh token (created during initial OAuth flow)

Both are git-ignored and stay local only.
