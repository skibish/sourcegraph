#!/usr/bin/env bash

cd $(dirname "${BASH_SOURCE[0]}")/../../..
set -euxo pipefail

parallel --keep-order --line-buffer --tag --bar {} ::: ./enterprise/cmd/frontend/pre-build.sh ./cmd/management-console/pre-build.sh
