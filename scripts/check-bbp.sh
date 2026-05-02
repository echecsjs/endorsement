#!/usr/bin/env bash
#
# generates N tournaments with bbpPairings RTG, checks each with our FPC.
# uses config files to vary tournament sizes across seeds.
#
# usage: ./scripts/check-bbp.sh [count] [bbp-path]
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

# vary tournament sizes — bbpPairings config format: key=value
configs=(
  "PlayersNumber=40\nRoundsNumber=9"
  "PlayersNumber=60\nRoundsNumber=11"
  "PlayersNumber=80\nRoundsNumber=9"
  "PlayersNumber=20\nRoundsNumber=7"
  "PlayersNumber=100\nRoundsNumber=13"
  "PlayersNumber=50\nRoundsNumber=11"
  "PlayersNumber=30\nRoundsNumber=9"
  "PlayersNumber=120\nRoundsNumber=15"
  "PlayersNumber=70\nRoundsNumber=11"
  "PlayersNumber=90\nRoundsNumber=13"
)
config_count=${#configs[@]}

total_rounds=0
perfect_rounds=0
total_pairings=0
total_matching=0
failures=0
crashes=0

for seed in $(seq 1 "$N"); do
  trf_path="$TMP_DIR/rtg_$seed.trf"
  config_path="$TMP_DIR/rtg_$seed.cfg"

  # rotate through configs
  config_idx=$(( (seed - 1) % config_count ))
  printf '%b\n' "${configs[$config_idx]}" > "$config_path"

  if ! "$BBP" --dutch -g "$config_path" -o "$trf_path" -s "$seed" >/dev/null 2>&1; then
    echo "seed $seed: bbpPairings RTG failed"
    crashes=$((crashes + 1))
    rm -f "$config_path"
    continue
  fi

  rm -f "$config_path"
  output=$($CLI check "$trf_path" 2>&1) || true

  # parse the summary line: "result: X/Y rounds perfect, A/B pairings match (Z%)"
  summary=$(echo "$output" | grep "^result:")
  if [ -z "$summary" ]; then
    echo "seed $seed: parse failed"
    crashes=$((crashes + 1))
    rm -f "$trf_path"
    continue
  fi

  rounds_perfect=$(echo "$summary" | sed 's/.*: \([0-9]*\)\/\([0-9]*\) rounds.*/\1/')
  rounds_total=$(echo "$summary" | sed 's/.*: \([0-9]*\)\/\([0-9]*\) rounds.*/\2/')
  pairs_matching=$(echo "$summary" | sed 's/.*, \([0-9]*\)\/\([0-9]*\) pairings.*/\1/')
  pairs_total=$(echo "$summary" | sed 's/.*, \([0-9]*\)\/\([0-9]*\) pairings.*/\2/')

  total_rounds=$((total_rounds + rounds_total))
  perfect_rounds=$((perfect_rounds + rounds_perfect))
  total_pairings=$((total_pairings + pairs_total))
  total_matching=$((total_matching + pairs_matching))

  if [ "$rounds_perfect" = "$rounds_total" ]; then
    echo "seed $seed: $rounds_total rounds perfect ($pairs_total pairings)"
  else
    echo "seed $seed: $rounds_perfect/$rounds_total rounds ($pairs_matching/$pairs_total pairings)"
    failures=$((failures + 1))
  fi

  rm -f "$trf_path"
done

rmdir "$TMP_DIR" 2>/dev/null || true

echo ""
echo "=== bbpPairings RTG -> our FPC: $N seeds ==="
echo "crashes:  $crashes"
echo "rounds:   $perfect_rounds/$total_rounds perfect"
echo "pairings: $total_matching/$total_pairings"
if [ "$failures" -gt 0 ]; then
  echo "failures: $failures seeds with discrepancies"
fi
