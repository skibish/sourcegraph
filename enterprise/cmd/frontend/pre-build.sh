#!/usr/bin/env bash

set -euxo pipefail
cd $(dirname "${BASH_SOURCE[0]}")/../../..

echo "--- yarn root"
yarn --frozen-lockfile --network-timeout 60000

parallel --keep-order --verbose --bar {} ::: browser/build.sh web/build.sh

echo "--- generate"
enterprise/dev/generate.sh
