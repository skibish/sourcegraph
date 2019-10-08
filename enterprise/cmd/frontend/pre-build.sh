#!/usr/bin/env bash

set -exo pipefail
cd $(dirname "${BASH_SOURCE[0]}")/../../..

echo "--- yarn root"
yarn --mutex network --frozen-lockfile --network-timeout 60000

NODE_ENV=${NODE_ENV:-production}
TARGETS=${TARGETS:-phabricator}

parallel --keep-order --line-buffer --tag --bar {} ::: "env NODE_ENV=$NODE_ENV browser/build.sh" "env TARGETS=$TARGETS web/build.sh"

echo "--- generate"
enterprise/dev/generate.sh
