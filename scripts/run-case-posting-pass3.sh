#!/usr/bin/env bash
# Pass 3 only: ramp 0 -> 50 VUs over 10m, hold 5m, ramp down 2m.
#
# Goal: measure failures during the 10-minute ramp-up to 50 concurrent users.
#
# Usage:
#   bash k6/scripts/run-case-posting-pass3.sh -e DOMAIN=www9.aws.legalmatch.com
#
# Override defaults with env vars:
#   TARGET=50  RAMP_UP=10m  HOLD=5m  RAMP_DOWN=2m
#   K6_BROWSER_HEADLESS=false to see the browser.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TARGET="${TARGET:-50}"
RAMP_UP="${RAMP_UP:-10m}"
HOLD="${HOLD:-5m}"
RAMP_DOWN="${RAMP_DOWN:-2m}"

echo "==> Pass 3: 0 -> $TARGET VUs over $RAMP_UP, hold $HOLD, ramp down $RAMP_DOWN"
echo ""

exec bash "$SCRIPT_DIR/run-case-posting.sh" \
    -e SCENARIO=single \
    -e TARGET="$TARGET" \
    -e RAMP_UP="$RAMP_UP" \
    -e HOLD="$HOLD" \
    -e RAMP_DOWN="$RAMP_DOWN" \
    ${MACHINES:+-e MACHINES="$MACHINES"} \
    ${MACHINE_ID:+-e MACHINE_ID="$MACHINE_ID"} \
    "$@"
