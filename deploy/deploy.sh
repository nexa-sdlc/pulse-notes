#!/usr/bin/env bash
# Build and (re)start the test bed on http://localhost:5450, then smoke-test it.
set -euo pipefail
cd "$(dirname "$0")/.."

export APP_COMMIT="${APP_COMMIT:-$(git rev-parse --short HEAD)}"
echo "deploying commit $APP_COMMIT"

docker compose -p pulse-testbed -f deploy/docker-compose.yml up -d --build --wait
bash deploy/smoke.sh "http://localhost:5450"
echo "deployed $APP_COMMIT OK"
