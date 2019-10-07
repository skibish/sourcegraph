#!/usr/bin/env bash

set -euxo pipefail
cd $(dirname "${BASH_SOURCE[0]}")/../..

parallel --help

pushd ..
echo "--- yarn root"
yarn --frozen-lockfile --network-timeout 60000
(echo "--- yarn browser" && pushd browser && TARGETS=phabricator yarn build && popd) &
(echo "---yarn web" && pushd web && NODE_ENV=production yarn -s run build --color && popd) &
wait
popd

echo "--- generate"
dev/generate.sh
