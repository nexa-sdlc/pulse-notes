# NEXA.md

> Drafted by Nexa from the repo's files (heuristics only). It states only what was detected; every TODO is for a human.
> Agents read this file first, so keep it short and true.

## What was detected
- Repo role (guess): fullstack
- Languages: typescript
- Frameworks: react, vite, fastify
- Package manager: pnpm
- Sub-packages (own package.json, no workspaces): `api`, `web`
- package.json scripts: `build`, `check`, `dev`, `lint`, `smoke`, `test`, `typecheck`

## Commands

The commands Nexa will run are in `nexa.yaml`:
- `pnpm install --frozen-lockfile`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm exec playwright test`

## Conventions

- TODO: code style, naming, folder layout.
- TODO: branch and commit conventions.

## Architecture

- TODO: the main modules and how they fit together.

## Testing

- TODO: what to run before a change is done, and where tests live.

## Do not touch

- TODO: generated files, vendored code, anything that needs a human (see `protected` in `nexa.yaml`).
