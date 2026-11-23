#!/usr/bin/env bash
# Smoke-test a deployed instance: /health must report ok, then run the browser smoke.
set -euo pipefail
cd "$(dirname "$0")/.."

export BASE_URL="${1:-${BASE_URL:-http://localhost:5450}}"

curl -fsS --retry 10 --retry-connrefused --retry-delay 1 "$BASE_URL/health" | tee /dev/stderr | grep -q '"status":"ok"'
echo
node e2e/smoke.mjs
