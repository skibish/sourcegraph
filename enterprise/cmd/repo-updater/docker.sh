#!/usr/bin/env bash

cd $(dirname "${BASH_SOURCE[0]}")/../../..
set -ex

export REPO_UPDATER_PKG="github.com/sourcegraph/sourcegraph/enterprise/cmd/repo-updater"

./cmd/repo-updater/docker.sh
