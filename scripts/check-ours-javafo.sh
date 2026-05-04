#!/usr/bin/env bash
#
# generates N tournaments with our RTG, checks each with JaVaFo FPC.
#
# usage: ./scripts/check-ours-javafo.sh [count] [javafo-jar-path]
#   count        — number of seeds to test (default: 50)
#   javafo-jar   — path to javafo.jar (default: /tmp/javafo.jar)

set -euo pipefail

N="${1:-50}"
JAVAFO="${2:-/tmp/javafo.jar}"
CLI="node dist/cli.mjs"
TMP_DIR=$(mktemp -d)
START_SEED=$(( RANDOM * 32768 + RANDOM ))

if [ ! -f "$JAVAFO" ]; then
  echo "error: javafo.jar not found at $JAVAFO" >&2
  exit 2
fi

# vary tournament size per seed
configs=(
  "40 9"
  "60 11"
  "80 9"
  "20 7"
  "100 13"
  "50 11"
  "30 9"
  "120 15"
  "70 11"
  "90 13"
)
config_count=${#configs[@]}

echo "start seed: $START_SEED"
echo ""

passed=0
failed=0
crashes=0

for i in $(seq 0 $((N - 1))); do
  seed=$((START_SEED + i))
  trf_path="$TMP_DIR/ours_$seed.trf"

  # rotate through configs
  config_idx=$((i % config_count))
  read -r players rounds <<< "${configs[$config_idx]}"
  cfg_label="${players}p/${rounds}r"

  if ! $CLI generate --players "$players" --rounds "$rounds" --seed "$seed" -o "$trf_path" 2>/dev/null; then
    echo "seed $seed ($cfg_label): our RTG failed"
    crashes=$((crashes + 1))
    continue
  fi

  # JaVaFo -c checks TRF pairings, outputs discrepancies to stdout
  # exit code 0 = all match, non-zero = discrepancy or error
  javafo_output=$(java -ea -jar "$JAVAFO" "$trf_path" -c -w 2>&1) || true

  # JaVaFo checker outputs "Round #N" for each round, and shows discrepancies inline
  # if there are no lines with " - " pattern (pairing format), all rounds matched
  if echo "$javafo_output" | grep -q "Checker pairings"; then
    echo "seed $seed ($cfg_label): JaVaFo found discrepancies"
    echo "$javafo_output" | grep -A2 "Checker pairings"
    failed=$((failed + 1))
  else
    echo "seed $seed ($cfg_label): JaVaFo accepted"
    passed=$((passed + 1))
  fi

  rm -f "$trf_path"
done

rmdir "$TMP_DIR" 2>/dev/null || true

echo ""
echo "=== our RTG -> JaVaFo FPC: $N seeds (start: $START_SEED) ==="
echo "crashes:  $crashes"
echo "passed:   $passed/$N"
if [ "$failed" -gt 0 ]; then
  echo "rejected: $failed"
fi
