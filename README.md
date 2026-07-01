# 🍺🎆 The 250 Club

A public, no-login Fourth of July party app. Everyone types their name, joins or creates a
group, and taps a big button every time they crack open a beer. The group's total fills a
shared pint-glass meter toward a goal (250 by default), with a live leaderboard, a "who just
drank" ticker, milestone celebrations, and a fireworks finale when the goal is hit.

Built with Next.js (App Router, TypeScript), Tailwind CSS, Upstash Redis, and canvas-confetti.
No accounts, no database migrations — identity is just a random id stored in `localStorage`.

## How it works

1. **`/`** — enter your name. Saved to `localStorage` along with a generated `memberId`.
2. **`/groups`** — find a group by name or create a new group with a custom goal.
3. **`/g/[id]`** — the main screen: the pint-glass meter, the big "Add a beer" button
   (one released tap adds one beer), your personal count, the live leaderboard, a scrolling
   ticker of recent taps, and a share button that generates a downloadable/shareable image.

All game state lives in Upstash Redis and is shared across every device in the group. The
group screen polls the server every few seconds so everyone's phone stays in sync.

## Tech stack

- **Next.js** (App Router, TypeScript) + **Tailwind CSS**
- **Upstash Redis** via `@upstash/redis` — cross-device shared state (no `@vercel/kv`, which is
  sunset; this app talks to Upstash's REST API directly)
- **canvas-confetti** for celebrations
- No login. Duplicate names within a group require the person to claim the existing identity
  or choose a different display name.

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

- `lib/config.ts` — app title (`APP_TITLE`), default goal, poll interval, and the color palette.
- `lib/content.ts` — the fixed milestone thresholds/copy for the default 250 goal, the
  percentage-based milestones used for custom goals, and the rotating "did you know" fun facts.

## Data model (Upstash Redis)

| Key | Type | Purpose |
| --- | --- | --- |
| `groups:public` | Set | IDs of discoverable groups, for the group-name list |
| `group:{id}:meta` | Hash | `name`, `goal`, `createdAt` |
| `group:{id}:total` | Integer | The group's beer count (source of truth for the meter) |
| `group:{id}:members` | Hash | `memberId -> displayName` |
| `group:{id}:names` | Hash | Normalized display name -> `memberId`, for atomic uniqueness |
| `group:{id}:counts` | Sorted Set | `memberId` scored by personal beer count (leaderboard) |
| `group:{id}:events` | List | Recent `"name\|timestamp\|type\|count\|message"` ticker entries |

## API routes

- `POST /api/groups` — create a group
- `GET /api/groups` — list public groups (for the homepage race)
- `GET /api/groups/[id]` — full group state (meta, total, leaderboard, events) — polled every
  3s by the group screen
- `POST /api/groups/[id]/join` — register a member and enforce unique display names
- `POST /api/groups/[id]/beer` — add exactly one beer
- `POST /api/groups/[id]/undo` — undo your last beer (floored at 0)
- `POST /api/groups/[id]/reset` — clear a group's counts/total/events

## Assumptions made

- Default poll interval is 3 seconds, matching the spec's "within ~3s" sync requirement.
- Group and member IDs are short slugs/UUIDs.
- The crack/pour sound and haptic buzz are synthesized in-browser with the Web Audio API and
  `navigator.vibrate`, so no binary audio asset needs to ship with the app.
- Resetting a group clears counts/total/events but keeps existing members registered (they
  reappear on the leaderboard at 0, rather than needing to rejoin).

## Verified end-to-end

The main group flows are manually driven through a real browser against Redis before release:
name persistence and uniqueness, group creation and discovery, one-tap beer additions,
cross-device sync, milestones, the fireworks finale, and undo-floored-at-0.
