/**
 * FIDE expected score table (C.04.A A.5).
 *
 * Maps rating difference (0-735) to expected score for the higher-rated player.
 * Each entry covers a range of rating differences — the table uses the upper
 * bound of each range as the key.
 */
const FIDE_TABLE: [number, number][] = [
  [3, 0.5],
  [10, 0.51],
  [17, 0.52],
  [25, 0.53],
  [32, 0.54],
  [39, 0.55],
  [46, 0.56],
  [53, 0.57],
  [61, 0.58],
  [68, 0.59],
  [76, 0.6],
  [83, 0.61],
  [91, 0.62],
  [98, 0.63],
  [106, 0.64],
  [113, 0.65],
  [121, 0.66],
  [129, 0.67],
  [137, 0.68],
  [145, 0.69],
  [153, 0.7],
  [162, 0.71],
  [170, 0.72],
  [179, 0.73],
  [188, 0.74],
  [197, 0.75],
  [206, 0.76],
  [215, 0.77],
  [225, 0.78],
  [235, 0.79],
  [245, 0.8],
  [256, 0.81],
  [267, 0.82],
  [278, 0.83],
  [290, 0.84],
  [302, 0.85],
  [315, 0.86],
  [328, 0.87],
  [344, 0.88],
  [357, 0.89],
  [374, 0.9],
  [391, 0.91],
  [411, 0.92],
  [432, 0.93],
  [456, 0.94],
  [484, 0.95],
  [517, 0.96],
  [559, 0.97],
  [619, 0.98],
  [735, 0.99],
];

/**
 * Returns the FIDE expected score for the higher-rated player given a rating
 * difference. Clamps to 0.50-0.99.
 */
function fideExpectedScore(ratingDiff: number): number {
  const absDiff = Math.abs(ratingDiff);
  for (const [threshold, score] of FIDE_TABLE) {
    if (absDiff <= threshold) {
      return score;
    }
  }
  return 0.99;
}

/**
 * Given an expected score for white, a PRNG, produce a game result (1, 0.5, 0)
 * from white's perspective.
 *
 * Uses a simple three-way split: the expected score determines the win/loss
 * balance, while a fixed draw rate of ~33% keeps realistic diversity. The draw
 * rate scales down as the rating gap grows.
 */
function simulateResult(
  expectedWhite: number,
  random: () => number,
): 0 | 0.5 | 1 {
  // Draw probability decreases as the gap widens
  const drawProbability = Math.max(
    0.05,
    0.33 * (1 - Math.abs(2 * expectedWhite - 1)),
  );
  const winProbability = expectedWhite - 0.5 * drawProbability;
  const lossProbability = 1 - winProbability - drawProbability;

  const roll = random();

  if (roll < winProbability) {
    return 1;
  }

  if (roll < winProbability + drawProbability) {
    return 0.5;
  }

  // Guard: if lossProbability is negligible, still return a loss for correctness
  return lossProbability > 0 ? 0 : 0.5;
}

export { fideExpectedScore, simulateResult };
