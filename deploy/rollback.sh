#!/usr/bin/env bash
# Redeploy a given git ref (tag, branch or sha): ./deploy/rollback.sh <ref>
set -euo pipefail
ref="${1:?usage: rollback.sh <git-ref>}"
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'git -C "$root" worktree remove --force "$work" >/dev/null 2>&1 || true' EXIT

git -C "$root" worktree add --detach "$work" "$ref"
APP_COMMIT="$(git -C "$work" rev-parse --short HEAD)" bash "$work/deploy/deploy.sh"
