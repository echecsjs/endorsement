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

if [ ! -x "$BBP" ]; then
  echo "error: bbpPairings not found at $BBP" >&2
  exit 2
fi

passed=0
failed=0
crashes=0

for seed in $(seq 1 "$N"); do
  trf_path="$TMP_DIR/ours_$seed.trf"

  if ! $CLI generate --players 40 --rounds 9 --seed "$seed" -o "$trf_path" 2>/dev/null; then
    echo "seed $seed: our RTG failed"
    crashes=$((crashes + 1))
    continue
  fi

  # bbpPairings -c exits 0 if pairings match, non-zero on discrepancy
  if "$BBP" --dutch "$trf_path" -c 2>/dev/null 1>/dev/null; then
    echo "seed $seed: bbpPairings accepted"
    passed=$((passed + 1))
  else
    echo "seed $seed: bbpPairings rejected"
    failed=$((failed + 1))
  fi

  rm -f "$trf_path"
done

rmdir "$TMP_DIR" 2>/dev/null || true

echo ""
echo "=== our RTG -> bbpPairings FPC: $N seeds ==="
echo "crashes:  $crashes"
echo "passed:   $passed/$N"
if [ "$failed" -gt 0 ]; then
  echo "rejected: $failed"
fi
