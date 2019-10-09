#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE[0]}")/../.."
set -euxo pipefail

echo "--- go build"

PACKAGES=(
    $SERVER_PKG
    github.com/sourcegraph/sourcegraph/cmd/github-proxy
    github.com/sourcegraph/sourcegraph/cmd/gitserver
    github.com/sourcegraph/sourcegraph/cmd/query-runner
    github.com/sourcegraph/sourcegraph/cmd/replacer
    github.com/sourcegraph/sourcegraph/cmd/searcher
    github.com/google/zoekt/cmd/zoekt-archive-index
    github.com/google/zoekt/cmd/zoekt-sourcegraph-indexserver
    github.com/google/zoekt/cmd/zoekt-webserver
    $FRONTEND_PKG
    $MANAGEMENT_CONSOLE_PKG
    $REPO_UPDATER_PKG
)

BUILD_COMMAND="go build \
      -ldflags \"-X github.com/sourcegraph/sourcegraph/pkg/version.version=$VERSION\"  \
      -buildmode exe \
      -installsuffix netgo \
      -tags \"dist netgo\" \
      -o \"$BINDIR/$(basename {})\" {}"

parallel --keep-order --line-buffer --tag --bar $BUILD_COMMAND ::: "${PACKAGES[@]}"
