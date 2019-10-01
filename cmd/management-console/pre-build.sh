#!/usr/bin/env bash

cd $(dirname "${BASH_SOURCE[0]}")
set -euxo pipefail

export GO111MODULE=on
export GOARCH=amd64
export GOOS=linux
export CGO_ENABLED=0

go generate github.com/sourcegraph/sourcegraph/cmd/management-console/assets
