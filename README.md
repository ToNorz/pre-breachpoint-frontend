# breachpoint-frontend

Production deployment uses the root `docker-compose.yml` as one Portainer stack
for the frontend, backend, and a dedicated Postgres service. See
[`docs/portainer-deployment.md`](docs/portainer-deployment.md).

The player-facing client for BreachPoint Round 1 — Signal Zero. It is a thin
shell over [`breachpoint-backend`](../breachpoint-backend): the server owns the
game, this owns how it looks.

## Running it

The backend must be seeded, published and running first:

```bash
cd ../breachpoint-backend
docker compose up -d postgres
bun run db:migrate && bun run db:seed && bun run db:publish
bun run db:admin -- --email ops@axios.net --username ops --password '...'
bun run dev                      # http://localhost:8080
```

Then:

```bash
cp .env.example .env             # defaults already point at localhost:8080
bun install
bun run dev                      # http://localhost:3000
```

`VITE_API_BASE_URL` must match the backend's `PORT`, and this app's origin must
appear in the backend's `FRONTEND_URL` or the browser blocks every call at CORS.

## How it talks to the server

| Layer | File | Job |
| --- | --- | --- |
| Transport | `src/services/api.ts` | One function per backend route. Bearer token, `ApiError`/`NetworkError`. Knows nothing about the game. |
| Translation | `src/services/backend.ts` | Turns API shapes into what views render — joins server challenges to chart positions, maps the scoreboard, splits narration. |
| State | `src/context/GameContext.tsx` | Boot sequence, board polling, and every action. The only place that decides *when* to call the API. |

**The rule: every word a player reads about the game comes from the server.**
Locally this repo holds geometry (`src/data/nodeLayout.ts`), colour and the
in-fiction path leads (`src/data/pathsData.ts`), and the event prologue
(`src/data/storyData.ts`). Challenge titles, briefings, debriefs, point values,
difficulty and what is open are all read from `/events/:id/board`.

### Identity

`slot` (`A-07`) is the display code — path code plus sequence. It is what the
hash router carries and what the chart keys on. `id` is the server UUID and is
the only thing the API accepts. Both live on every `Challenge`.

### Boot phases

`GameContext` resolves session → event → team → board and stops at the first
thing missing, which `App.tsx` renders as a screen:

| Phase | Screen |
| --- | --- |
| `loading` | uplink spinner |
| `unauthenticated` | `LandingView` — sign in or register |
| `pending` | `EventWindowView` — lobby, countdown to the gun, team formation |
| `no-team` | `TeamGate` — create a cell or join with a code |
| `ready` | the game |
| `ended` | `EventWindowView` — final standings |
| `error` | the failure, with a retry |

A missing team is not an error. Nothing in the event scores without one, so it
gets a screen rather than a toast.

`pending` and `ended` are the event's window, not the player's progress. The
server refuses the board outside it, so the client compares `now` to the event
dates and renders a lobby or a closing board instead of surfacing a 403 as a
broken app. It crosses both boundaries live — a player waiting in the lobby is
moved into the game at the gun without refreshing.

### Freshness

The board is re-read every 20s while the tab is visible, on tab focus, and
after every action that changes state. A CTF board moves under the player's
feet — reveals land, glitch windows open, values decay — and a stale board
lies about what is open.

## What this client does not decide

Flag correctness, point values, what is revealed, whether a skip is allowed,
whether a path can be entered, and the scoreboard. All server-side. The client
sends input and renders the answer; a refusal is displayed, not worked around.

Decay in particular: the board sends both `points` (headline) and
`currentPoints` (what a solve pays now). The client renders them and never
recomputes either — the price shown and the price paid have to be the same
calculation, and it lives on the server.
