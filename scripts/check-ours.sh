#!/usr/bin/env bash
#
# generates N tournaments with our RTG, checks each with bbpPairings FPC.
#
# usage: ./scripts/check-ours.sh [count] [bbp-path]
#   count    — number of seeds to test (default: 50)
#   bbp-path — path to bbpPairings binary (default: /tmp/bbpPairings/build/bbpPairings.exe)

set -euo pipefail

N="${1:-50}"
BBP="${2:-/tmp/bbpPairings/build/bbpPairings.exe}"
CLI="node dist/cli.mjs"
TMP_DIR=$(mktemp -d)
START_SEED=$(date +%s)

if [ ! -x "$BBP" ]; then
  echo "error: bbpPairings not found at $BBP" >&2
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

  # bbpPairings -c exits 0 if pairings match, non-zero on discrepancy
  if "$BBP" --dutch "$trf_path" -c 2>/dev/null 1>/dev/null; then
    echo "seed $seed ($cfg_label): bbpPairings accepted"
    passed=$((passed + 1))
  else
    echo "seed $seed ($cfg_label): bbpPairings rejected"
    failed=$((failed + 1))
  fi

  rm -f "$trf_path"
done

rmdir "$TMP_DIR" 2>/dev/null || true

echo ""
echo "=== our RTG -> bbpPairings FPC: $N seeds (start: $START_SEED) ==="
echo "crashes:  $crashes"
echo "passed:   $passed/$N"
if [ "$failed" -gt 0 ]; then
  echo "rejected: $failed"
fi
