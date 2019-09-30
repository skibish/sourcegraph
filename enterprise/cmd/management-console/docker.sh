#!/usr/bin/env bash

cd $(dirname "${BASH_SOURCE[0]}")/../../..
set -ex

export MANAGEMENT_CONSOLE_PKG="github.com/sourcegraph/sourcegraph/enterprise/cmd/management-console"

./cmd/management-console/docker.sh
