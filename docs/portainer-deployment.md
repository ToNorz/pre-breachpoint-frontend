# BreachPoint Portainer deployment

Both images are built from their repository's `master` branch by GitHub Actions:

- `ghcr.io/csa-tech-team/breachpoint-frontend`
- `ghcr.io/csa-tech-team/breachpoint-backend`

Each workflow publishes `latest` and `sha-<full-commit-sha>`. The frontend build
uses `/` as its API base, so browser requests use the frontend origin. Its
container Nginx proxies API routes to the `backend` service in the same stack.

Paste the root `docker-compose.yml` into a Portainer Docker Standalone stack
named `breachpoint`. Select the existing `ghcr/csa-tech-team` registry for
private image pulls. Set these Portainer stack environment variables:

| Variable | Purpose |
| --- | --- |
| `POSTGRES_PASSWORD` | Unique random hex password for the dedicated Postgres database. |
| `JWT_SECRET` | Independent random signing secret. |
| `ADMIN_1_PASSWORD` | Initial password for `admin@breachpoint.net`. |
| `ADMIN_2_PASSWORD` | Initial password for `ops@breachpoint.net`. |
| `ADMIN_3_PASSWORD` | Initial password for `control@breachpoint.net`. |
| `FRONTEND_IMAGE_TAG` | Published frontend `sha-<full-commit-sha>` tag. |
| `BACKEND_IMAGE_TAG` | Published backend `sha-<full-commit-sha>` tag. |
| `FRONTEND_ORIGIN` | Public HTTPS frontend origin once host Nginx is configured. |

Use a separate random value for each secret. The stack builds the internal
database URL from the Postgres password; use hex passwords so URL encoding is
unnecessary. Do not put values in this file or Git.

The dedicated Postgres service has no host port. Its data is stored in the
`breachpoint_postgres_data` named volume. The frontend binds to
`127.0.0.1:32081`, and the API binds to `127.0.0.1:32082`. Check both host
ports before deployment. Host Nginx can proxy the public HTTPS hostname to
`127.0.0.1:32081`; the frontend proxies its API paths internally.

Startup order is Postgres health, one-shot Drizzle migration, one-shot content
and admin seeding, API health, then frontend. The seed step updates challenge
content and creates missing admin accounts; it leaves existing admin accounts
unchanged. It does **not** publish the event or change its play window. Run
`bun run db:publish` separately when the event should open.

After deployment, verify the two long-running containers are healthy, the
`migrate` and `seed` containers exited with code 0, and a real API route such
as `/events` responds through the frontend proxy. For an update, change the
two image tags to published commit tags, select **Re-pull image**, and redeploy.
Never remove the named database volume during an ordinary update.
