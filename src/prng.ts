/**
 * Mulberry32 — a simple seeded 32-bit PRNG.
 * Returns a function producing deterministic floats in [0, 1).
 */
function createPrng(seed: number): () => number {
  // eslint-disable-next-line unicorn/prefer-math-trunc -- bitwise OR forces 32-bit integer overflow
  let s = seed | 0;
  return (): number => {
    // eslint-disable-next-line unicorn/prefer-math-trunc -- bitwise OR forces 32-bit integer overflow
    s = (s + 0x6d_2b_79_f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_00_00_00_00;
  };
}

export { createPrng };
