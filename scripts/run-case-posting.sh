#!/usr/bin/env bash
# Wrapper script that runs the k6 case-posting test and saves all captured
# case numbers to k6/data/posted-cases.json.
#
# Usage (can be run from anywhere; paths are resolved relative to this script):
#   bash k6/scripts/run-case-posting.sh -e VUS=2 -e ITER=2 -e DURATION=7m -e DOMAIN=www9.aws.legalmatch.com
#   bash scripts/run-case-posting.sh    -e VUS=2 -e ITER=2 -e DURATION=7m -e DOMAIN=www9.aws.legalmatch.com
#
# Set K6_BROWSER_HEADLESS=false to see the browser. Defaults to headless.
set -e

# Resolve k6 root (parent of this script's directory) so the script works
# regardless of the caller's current working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K6_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

LOG_FILE=$(mktemp -t k6-case-posting-XXXXXX.log)
SCRIPT_PATH="$K6_ROOT/tests/LMClient/TCM-6551-CasePosting.js"

# Tag output file with MACHINE_ID when running distributed (so VMs don't overwrite each other)
if [ -n "$MACHINE_ID" ]; then
    JSON_OUT="$K6_ROOT/data/posted-cases-machine${MACHINE_ID}.json"
else
    JSON_OUT="$K6_ROOT/data/posted-cases.json"
fi

trap "rm -f $LOG_FILE" EXIT

echo "==> Running k6 test (output captured to $LOG_FILE)"
echo ""

# Make sure the report/ directory exists before the run; k6's handleSummary
# does NOT create parent directories and will fail to write the HTML/JSON
# summary if it's missing.
mkdir -p "$K6_ROOT/report"

# Run k6 from the k6/ directory so relative paths inside handleSummary
# (e.g. 'report/...') resolve to k6/report/ instead of the caller's cwd.
(
    cd "$K6_ROOT"
    K6_BROWSER_HEADLESS="${K6_BROWSER_HEADLESS:-true}" k6 run "$@" "$SCRIPT_PATH"
) 2>&1 | tee "$LOG_FILE"

echo ""
echo "==> Extracting case numbers from log..."

# Lines look like: INFO[0067] [CASE_POSTED] caseNumber=CCXXXX vu=1 iteration=1   source=console
mapfile -t CASE_LINES < <(grep -oE '\[CASE_POSTED\] caseNumber=[A-Z0-9]+ vu=[0-9]+ iteration=[0-9]+' "$LOG_FILE" || true)

COUNT=${#CASE_LINES[@]}

mkdir -p "$(dirname "$JSON_OUT")"

{
  echo "{"
  echo "  \"generatedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"totalCases\": $COUNT,"
  if [ "$COUNT" -eq 0 ]; then
    echo "  \"cases\": []"
  else
    echo "  \"cases\": ["
    for i in "${!CASE_LINES[@]}"; do
      LINE="${CASE_LINES[$i]}"
      CASE=$(echo "$LINE"  | sed -E 's/.*caseNumber=([A-Z0-9]+).*/\1/')
      VU=$(echo "$LINE"    | sed -E 's/.*vu=([0-9]+).*/\1/')
      ITER=$(echo "$LINE"  | sed -E 's/.*iteration=([0-9]+).*/\1/')
      if [ "$i" -lt "$((COUNT - 1))" ]; then COMMA=","; else COMMA=""; fi
      printf '    { "caseNumber": "%s", "vu": "%s", "iteration": "%s" }%s\n' "$CASE" "$VU" "$ITER" "$COMMA"
    done
    echo "  ]"
  fi
  echo "}"
} > "$JSON_OUT"

echo "==> Saved $COUNT case number(s) to $JSON_OUT"
