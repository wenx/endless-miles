# Endless Miles

Personal running & cycling data visualization, powered by Strava data.

## Tech Stack

- Next.js + TypeScript + Tailwind CSS
- Strava API (OAuth2)
- Recharts

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
```

## Syncing Strava Data

Pull latest activities from Strava:

```bash
npm run sync
```

This will:
1. Refresh your Strava access token
2. Fetch all activities (handles pagination & rate limiting)
3. Save to `data/activities.json`

Refresh the page to see updated data.

### Prerequisites

`.env.local` with Strava API credentials:

```
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
```

`data/.tokens.json` with your refresh token (created during initial OAuth flow).

### Automate with Cron (Optional)

To sync daily at 6am:

```bash
crontab -e
```

Add:

```
0 6 * * * cd ~/Documents/projects/run-dashboard && npm run sync >> /tmp/endless-miles-sync.log 2>&1
```

Or just run `npm run sync` manually whenever you want fresh data.
