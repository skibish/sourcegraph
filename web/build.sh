#!/usr/bin/env bash

cd $(dirname "${BASH_SOURCE[0]}")
set -euxo pipefail

NODE_ENV=${NODE_ENV:-production}

echo "--- yarn web"
yarn -s run build --color
