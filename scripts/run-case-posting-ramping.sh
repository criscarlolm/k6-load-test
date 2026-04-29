#!/usr/bin/env bash
# Wrapper that runs the case-posting test with the ramping scenario.
#
# Load profile (per machine, before MACHINES distribution):
#   Pass 1: 0  -> 15 VUs over RAMP_UP (10m), hold HOLD (5m) at 15
#   Pass 2:    -> 25 VUs over RAMP_UP (10m), hold HOLD (5m) at 25
#   Pass 3:    -> 50 VUs over RAMP_UP (10m), hold HOLD (5m) at 50
#   Ramp down to 0 over RAMP_DOWN (2m)
#
# Goal: observe how many users fail during each 10-minute ramp-up per pass.
#
# Usage (run from the repo root or any directory):
#   bash k6/scripts/run-case-posting-ramping.sh -e DOMAIN=www9.aws.legalmatch.com
#
# Override any default by exporting an env var before running, e.g.:
#   HOLD=2m RAMP_DOWN=1m bash k6/scripts/run-case-posting-ramping.sh -e DOMAIN=...
#   PASS1=10 PASS2=20 PASS3=40 bash k6/scripts/run-case-posting-ramping.sh -e DOMAIN=...
#
# Distributed (multiple machines, run on each in parallel at the same time):
#   MACHINES=2 MACHINE_ID=1 bash k6/scripts/run-case-posting-ramping.sh -e DOMAIN=...
#   MACHINES=2 MACHINE_ID=2 bash k6/scripts/run-case-posting-ramping.sh -e DOMAIN=...
#
# Set K6_BROWSER_HEADLESS=false to see the browser. Defaults to headless.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Defaults match the goal: 15 / 25 / 50 users with a 10-minute ramp per pass.
PASS1="${PASS1:-15}"
PASS2="${PASS2:-25}"
PASS3="${PASS3:-50}"
RAMP_UP="${RAMP_UP:-10m}"
HOLD="${HOLD:-5m}"
RAMP_DOWN="${RAMP_DOWN:-2m}"

echo "==> Ramping scenario"
echo "    Pass 1: 0  -> $PASS1 VUs over $RAMP_UP, hold $HOLD"
echo "    Pass 2:    -> $PASS2 VUs over $RAMP_UP, hold $HOLD"
echo "    Pass 3:    -> $PASS3 VUs over $RAMP_UP, hold $HOLD"
echo "    Ramp down to 0 over $RAMP_DOWN"
if [ -n "$MACHINES" ] || [ -n "$MACHINE_ID" ]; then
    echo "    Distributed: MACHINES=${MACHINES:-1} MACHINE_ID=${MACHINE_ID:-1}"
fi
echo ""

exec bash "$SCRIPT_DIR/run-case-posting.sh" \
    -e SCENARIO=ramping \
    -e PASS1="$PASS1" \
    -e PASS2="$PASS2" \
    -e PASS3="$PASS3" \
    -e RAMP_UP="$RAMP_UP" \
    -e HOLD="$HOLD" \
    -e RAMP_DOWN="$RAMP_DOWN" \
    ${MACHINES:+-e MACHINES="$MACHINES"} \
    ${MACHINE_ID:+-e MACHINE_ID="$MACHINE_ID"} \
    "$@"
