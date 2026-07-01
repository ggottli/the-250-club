# 🍺🎆 The 250 Club

A public, no-login Fourth of July party app. Everyone types their name, joins or creates a
group, and taps a big button every time they crack open a beer. The group's total fills a
shared pint-glass meter toward a goal (250 by default), with a live leaderboard, a "who just
drank" ticker, milestone celebrations, and a fireworks finale when the goal is hit.

Built with Next.js (App Router, TypeScript), Tailwind CSS, Upstash Redis, and canvas-confetti.
No accounts, no database migrations — identity is just a random id stored in `localStorage`.

## How it works

1. **`/`** — enter your name. Saved to `localStorage` along with a generated `memberId`.
2. **`/groups`** — see public groups currently racing, join a private group by its short code,
   or create a new group (name, goal, public/private).
3. **`/g/[id]`** — the main screen: the pint-glass meter, the big "Add a beer" button
   (tap, or press-and-hold to add several quickly), your personal count, the live leaderboard,
   a scrolling ticker of recent taps, a pace/ETA projection, and a share button that generates
   a downloadable/shareable image.

All game state lives in Upstash Redis and is shared across every device in the group. The
group screen polls the server every few seconds so everyone's phone stays in sync.

## Tech stack

- **Next.js** (App Router, TypeScript) + **Tailwind CSS**
- **Upstash Redis** via `@upstash/redis` — cross-device shared state (no `@vercel/kv`, which is
  sunset; this app talks to Upstash's REST API directly)
- **canvas-confetti** for celebrations
- No auth. No database migrations. No captchas.

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in .env.local
npm run dev
```

Open http://localhost:3000.

### Getting Upstash credentials for local dev

Create a free database at [console.upstash.com](https://console.upstash.com), open its
**REST API** tab, and copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values
into `.env.local`.

## Deploying to Vercel

1. Push this repo to GitHub (or run `vercel` from this directory) and import it into Vercel.
2. Add Redis from the Marketplace — either:
   - In the Vercel dashboard: **Storage → Marketplace Database Providers → Upstash for Redis**,
     or
   - From the CLI: `vercel install upstash/upstash-kv` (you'll need to accept Upstash's
     marketplace terms in the browser link the CLI prints before the install completes)
3. The integration automatically injects REST credentials into your project's environment
   variables — no manual copying needed. Depending on how it was installed, Vercel names
   these either `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` or the legacy
   `KV_REST_API_URL`/`KV_REST_API_TOKEN` (a holdover from Vercel KV). `lib/redis.ts` reads
   either pair, so both work with zero config.
4. Deploy:

   ```bash
   vercel --prod
   ```

   or just push to your connected Git branch.

No other configuration is required. The Hobby (free) plan is enough for a backyard party.

## Config

Nearly everything you'd want to tweak for next year's party lives in two files:

- `lib/config.ts` — app title (`APP_TITLE`), default goal, poll interval, hold-to-add timing,
  the color palette.
- `lib/content.ts` — the fixed milestone thresholds/copy for the default 250 goal, the
  percentage-based milestones used for custom goals, and the rotating "did you know" fun facts.

## Data model (Upstash Redis)

| Key | Type | Purpose |
| --- | --- | --- |
| `groups:public` | Set | IDs of public groups, for the homepage race list |
| `group:{id}:meta` | Hash | `name`, `goal`, `joinCode`, `isPublic`, `createdAt` |
| `group:{id}:total` | Integer | The group's beer count (source of truth for the meter) |
| `group:{id}:members` | Hash | `memberId -> displayName` |
| `group:{id}:counts` | Sorted Set | `memberId` scored by personal beer count (leaderboard) |
| `group:{id}:events` | List | Recent `"name\|timestamp\|type"` entries for the ticker |
| `joincode:{code}` | String | `joinCode -> groupId`, for "join by code" |

## API routes

- `POST /api/groups` — create a group
- `GET /api/groups` — list public groups (for the homepage race)
- `GET /api/groups/[id]` — full group state (meta, total, leaderboard, events) — polled every
  3s by the group screen
- `GET /api/groups/code/[code]` — resolve a join code to a group id
- `POST /api/groups/[id]/join` — register a member (idempotent, dedupes display names)
- `POST /api/groups/[id]/beer` — add a beer (`delta` capped 1–5 server-side)
- `POST /api/groups/[id]/undo` — undo your last beer (floored at 0)
- `POST /api/groups/[id]/reset` — clear a group's counts/total/events

## Assumptions made

- Default poll interval is 3 seconds, matching the spec's "within ~3s" sync requirement.
- Group and member IDs are short slugs/UUIDs; join codes are 5-character A–Z/2–9 strings
  (ambiguous characters like `0`/`O`/`1`/`I` excluded).
- The crack/pour sound and haptic buzz are synthesized in-browser with the Web Audio API and
  `navigator.vibrate`, so no binary audio asset needs to ship with the app.
- Resetting a group clears counts/total/events but keeps existing members registered (they
  reappear on the leaderboard at 0, rather than needing to rejoin).

## Verified end-to-end

This was manually driven through a real browser (Playwright + Chromium) against a local
Upstash-compatible Redis before calling it done: name persistence, group creation with a
custom goal, joining by code and from the public list, cross-device sync within the 3s poll
window, milestone popups (both fixed 250-goal thresholds and percentage-based thresholds for
custom goals), the fireworks finale at goal completion, delta capping, and undo-floored-at-0.
