#!/usr/bin/env bash

# We want to build multiple go binaries, so we use a custom build step on CI.
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
set -eux

echo "--- docker build"
docker build -f cmd/server/Dockerfile -t "$IMAGE" . \
    --build-arg COMMIT_SHA \
    --build-arg DATE \
    --build-arg VERSION \
    --build-arg FRONTEND_PKG \
    --build-arg MANAGEMENT_CONSOLE_PKG \
    --build-arg REPO_UPDATER_PKG \
    --build-arg SERVER_PKG \
    --build-arg PRE_BUILD_SCRIPT \
    --build-arg CTAGS_VERSION
