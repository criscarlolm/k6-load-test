#!/usr/bin/env bash
# Burst 10 VUs — 10 browsers start simultaneously, each runs exactly 1 iteration.
#
# WHY THIS PROFILE
#   Unlike the baseline / pass1-4 scripts (which use a ramping-vus executor
#   that slowly increases concurrency), this uses k6's per-vu-iterations
#   executor and launches ALL 10 browsers at the same instant. It's the
#   harshest possible 10-VU cold-start and the right shape for answering:
#
#       "Can the AUT handle 10 users hitting it at the EXACT same moment?"
#
# USE IT FOR
#   - First-impression / cold-start concurrency validation.
#   - Reproducing thundering-herd issues — DB connection pool exhaustion,
#     Cloudflare WAF bursts, login-rate-limit spikes, session-store contention.
#   - A quick smoke run BEFORE the longer baseline / pass1-4 runs.
#
# DON'T USE IT FOR
#   - Stable web-vital averages — the synchronised start biases p95/p99 toward
#     the worst case. Use run-case-posting-baseline10.sh for clean numbers.
#   - Sustained-load measurements — every VU exits after 1 iteration, so the
#     "load" lasts only as long as the slowest case-posting flow.
#
# RUNTIME EXPECTATION
#   ~2-4 minutes total (one full case-posting flow per VU + browser teardown).
#   DURATION is a maxDuration safety cap — if any VU is still running after
#   that, k6 aborts that iteration.
#
# USAGE
#   bash k6/scripts/run-case-posting-burst10.sh -e DOMAIN=www9.aws.legalmatch.com
#
#   # On a WAF-blocked CI runner, also enable Cloudflare bypass:
#   bash k6/scripts/run-case-posting-burst10.sh \
#       -e DOMAIN=www9.aws.legalmatch.com -e CF_BYPASS=true
#
#   # Watch the browsers (default is headless):
#   K6_BROWSER_HEADLESS=false bash k6/scripts/run-case-posting-burst10.sh \
#       -e DOMAIN=www9.aws.legalmatch.com
#
# OVERRIDE DEFAULTS WITH ENV VARS
#   VUS=10 ITER=1 DURATION=10m
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

VUS="${VUS:-10}"
ITER="${ITER:-1}"
DURATION="${DURATION:-10m}"

echo "==> Burst 10 VUs: $VUS VUs simultaneous, $ITER iteration(s) each, max $DURATION"
echo ""

# No SCENARIO env → falls through to perVUiterations() in scenarios.js,
# which is exactly the "all VUs start at once" behaviour we want here.
exec bash "$SCRIPT_DIR/run-case-posting.sh" \
    -e VUS="$VUS" \
    -e ITER="$ITER" \
    -e DURATION="$DURATION" \
    ${MACHINES:+-e MACHINES="$MACHINES"} \
    ${MACHINE_ID:+-e MACHINE_ID="$MACHINE_ID"} \
    "$@"
