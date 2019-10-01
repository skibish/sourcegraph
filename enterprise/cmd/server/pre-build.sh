#!/usr/bin/env bash

cd $(dirname "${BASH_SOURCE[0]}")/../../..
set -euxo pipefail

./enterprise/cmd/frontend/pre-build.sh
