#!/usr/bin/env bash
# Baseline 10 VUs — gentle ramp 0 -> 10 over 1m, hold 5m, ramp down 30s.
#
# WHY THIS PROFILE
#   This is the recommended "10-user baseline" for the AUT. Use it BEFORE
#   running the heavier pass1-4 scripts to confirm the system is healthy
#   at low concurrency. A clean 100% pass at 10 VUs is the prerequisite for
#   trusting any higher-load result — if cases fail here, they'll fail
#   harder at 25 / 50 / 100.
#
# Profile vs. the existing scripts:
#
#     this  (baseline)  10 VUs   ramp 1m   / hold 5m   / down 30s   ≈ 6.5m   ◀ start here
#     pass1             15 VUs   ramp 10m  / hold 5m   / down 2m    ≈ 17m    light load
#     pass2             25 VUs   ramp 10m  / hold 5m   / down 2m    ≈ 17m    moderate
#     pass3             50 VUs   ramp 10m  / hold 5m   / down 2m    ≈ 17m    stress
#     pass4            100 VUs   ramp 10m  / hold 5m   / down 2m    ≈ 17m    soak / break
#
# WHY A *SHORT* RAMP HERE
#   - We're not stress-testing — just establishing a baseline.
#   - At only 10 VUs, a 10-minute ramp would spend most of the run at <10
#     concurrent users, biasing metrics toward "easy" load.
#   - 1m ramp-up is still long enough to avoid thundering-herd browser
#     launches that crash Chromium / saturate /dev/shm on small VMs.
#
# WHAT TO LOOK FOR IN THE REPORT
#   - Cases Posted: 10 / 10 (any failure is a real bug, not server load).
#   - Checks Rate ≥ 99% (the per-page 'Home page', 'Search Attorney', etc.).
#   - p(90) HTTP duration well under 1.5s.
#   - LCP / FCP / TTFB in the "good" range.
#   If any of those slip, fix the AUT before trying pass1.
#
# USAGE
#   bash k6/scripts/run-case-posting-baseline10.sh -e DOMAIN=www9.aws.legalmatch.com
#
#   # On a WAF-blocked CI runner, also enable Cloudflare bypass:
#   bash k6/scripts/run-case-posting-baseline10.sh \
#       -e DOMAIN=www9.aws.legalmatch.com -e CF_BYPASS=true
#
#   # Watch the browsers (default is headless):
#   K6_BROWSER_HEADLESS=false bash k6/scripts/run-case-posting-baseline10.sh \
#       -e DOMAIN=www9.aws.legalmatch.com
#
# OVERRIDE DEFAULTS WITH ENV VARS
#   TARGET=10 RAMP_UP=1m HOLD=5m RAMP_DOWN=30s
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TARGET="${TARGET:-10}"
RAMP_UP="${RAMP_UP:-1m}"
HOLD="${HOLD:-5m}"
RAMP_DOWN="${RAMP_DOWN:-30s}"

echo "==> Baseline 10 VUs: 0 -> $TARGET VUs over $RAMP_UP, hold $HOLD, ramp down $RAMP_DOWN"
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
