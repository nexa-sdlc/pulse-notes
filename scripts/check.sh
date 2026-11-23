#!/usr/bin/env bash
# The repo's local gate (required status: nexa/check).
set -euo pipefail
cd "$(dirname "$0")/.."

pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
echo "check: all green"
