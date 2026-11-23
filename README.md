# Pulse Notes

A tiny team notes/todo board. It exists as a **test bed for Nexa**,
a self-hosted AI SDLC platform: Nexa connects to this repo, has agents open PRs, reviews, merges and
deploys it locally. The repo is public and holds no secrets.

- `web/` React 19 + Vite + TypeScript (plain CSS, light/dark)
- `api/` Node 22 + Fastify + zod, notes in a JSON file under `DATA_DIR`
- `e2e/smoke.mjs` Playwright smoke test of a deployed instance
- `deploy/` Docker Compose project `pulse-testbed`, **host port 5450**

## Run

```sh
pnpm install
pnpm dev          # api on :3000, web on :5173 (proxies /api)
pnpm check        # install, typecheck, lint, unit tests, build (the local gate)
```

API: `GET/POST /api/notes`, `PATCH/DELETE /api/notes/:id`, `GET /health` -> `{status, version, commit}`
(`commit` comes from env `APP_COMMIT`).

## Deploy and smoke

```sh
./deploy/deploy.sh                 # builds with APP_COMMIT=<short sha>, starts on http://localhost:5450, runs the smoke
./deploy/smoke.sh [base-url]       # curl /health + Playwright smoke (default http://localhost:5450)
./deploy/rollback.sh <git-ref>     # redeploy a given ref
docker compose -p pulse-testbed -f deploy/docker-compose.yml down -v   # stop and remove data
```

The smoke needs a browser once: `pnpm exec playwright install chromium`.
The scripts never prune Docker.
