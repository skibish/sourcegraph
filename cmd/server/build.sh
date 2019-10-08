#!/usr/bin/env bash

# We want to build multiple go binaries, so we use a custom build step on CI.
cd "$(dirname "${BASH_SOURCE[0]}")/../.."
set -euxo pipefail

export PS4='+[${SECONDS}s][${BASH_SOURCE}:${LINENO}]: ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'

# Environment for building linux binaries
export GO111MODULE=on
export GOARCH=amd64
export GOOS=linux
export CGO_ENABLED=0

cp -a ./cmd/server/rootfs/. "$OUTPUT_DIR"
bindir="$OUTPUT_DIR/usr/local/bin"
mkdir -p "$bindir"

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
      -o \"$bindir/$(basename {})\" {}"

parallel -k --progress $BUILD_COMMAND:::"${PACKAGES[@]}"

echo "--- build symbols dependencies"
env CTAGS_D_OUTPUT_PATH="$OUTPUT_DIR/.ctags.d" SYMBOLS_EXECUTABLE_OUTPUT_PATH="$bindir/symbols" BUILD_TYPE=dist ./cmd/symbols/build.sh buildSymbolsDockerImageDependencies

echo "--- prometheus config"
cp -r docker-images/prometheus/config "$OUTPUT_DIR/sg_config_prometheus"
mkdir "$OUTPUT_DIR/sg_prometheus_add_ons"
cp dev/prometheus/linux/prometheus_targets.yml "$OUTPUT_DIR/sg_prometheus_add_ons"

echo "--- grafana config"
cp -r docker-images/grafana/config "$OUTPUT_DIR/sg_config_grafana"
cp -r dev/grafana/linux "$OUTPUT_DIR/sg_config_grafana/provisioning/datasources"

wait
