# breachpoint-frontend

Production deployment uses the root `docker-compose.yml` as one Portainer stack
for the frontend, backend, and a dedicated Postgres service. See
[`docs/portainer-deployment.md`](docs/portainer-deployment.md).

The player-facing client for BreachPoint Round 1 — Signal Zero. It can connect
to [`breachpoint-backend`](../breachpoint-backend) or run with the built-in
in-memory mock board for frontend development.

## Running it

For live API development, seed and start the backend first:

```bash
cd ../breachpoint-backend
docker compose up -d postgres
bun run db:migrate && bun run db:seed && bun run db:publish
bun run db:admin -- --email ops@axios.net --username ops --password '...'
bun run dev                      # http://localhost:8080
```

Then start the frontend with `VITE_USE_MOCK_API=false`:

```bash
cp .env.example .env             # defaults already point at localhost:8080
bun install
bun run dev                      # http://localhost:3000
```

`VITE_API_BASE_URL` must match the backend's `PORT`, and this app's origin must
appear in the backend's `FRONTEND_URL` or the browser blocks every call at CORS.

### Frontend-only mock

To run the challenge UI without the backend, set `VITE_USE_MOCK_API=true` in
`.env` and run the Vite development server. Production builds reject mock mode.
Production builds also substitute an empty fixture so mock flags and sample
challenge answers are not included in the shipped JavaScript.
Sign in with any email and password, create a
team, then submit the sample flag shown in each mock challenge description.
Solves and score update in memory and reset when the page reloads. Set the
variable to `false` to use the live API.

For deployment, copy `.env.example` to `.env` and set unique database, JWT, and
admin passwords before starting Compose. Compose fails closed when these values
are missing. The tracked `.env` file was removed from version control; rotate any
secrets that were previously used from it. Generate independent values with
`openssl rand -hex 32`; removing a secret from the current tree does not remove it
from existing Git history.

## How it talks to the server

| Layer | File | Job |
| --- | --- | --- |
| Transport | `src/services/api.ts` | One function per backend route. Bearer token, `ApiError`/`NetworkError`. Knows nothing about the game. |
| Translation | `src/services/backend.ts` | Turns API shapes into challenge cards, categories, and scoreboard rows. |
| State | `src/context/GameContext.tsx` | Boot sequence, board polling, and every action. The only place that decides *when* to call the API. |

In live mode, challenge titles, descriptions, point values, difficulty, and
availability come from `/events/:id/board`. In mock mode, `src/services/mockData.ts`
provides a small playable fixture for developing the dashboard without a server.

### Identity

`slot` (`A-07`) is the display code — path code plus sequence. `id` is the
server UUID and is the only thing the API accepts. Both live on every `Challenge`.

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

In live mode, flag correctness, point values, availability, and the scoreboard
are decided by the server. The client sends input and renders the answer. Mock
mode uses the fixture flags and updates its in-memory score locally.

Decay in particular: the board sends both `points` (headline) and
`currentPoints` (what a solve pays now). The client renders them and never
recomputes either — the price shown and the price paid have to be the same
calculation, and it lives on the server.
