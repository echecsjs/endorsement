import { pair } from '@echecs/swiss';
import { describe, expect, it } from 'vitest';

import type { Player } from '@echecs/swiss';

describe('VCL.08: pairing by pairing numbers, not ratings', () => {
  it('S1/S2 split uses pairing number order, not rating order', () => {
    // 6 players, all same score (0 points, round 1)
    // Pairing number order: 1,2,3,4,5,6
    // Rating order would be: 3,1,5,2,6,4 (deliberately shuffled)
    //
    // Dutch S1/S2 split by pairing number:
    //   S1 = [1,2,3], S2 = [4,5,6]
    //   Expected pairings: 1v4, 2v5, 3v6
    //
    // If engine wrongly used ratings:
    //   Sorted by rating desc: 3(2400),1(2200),5(2100),2(2000),6(1900),4(1800)
    //   S1 = [3,1,5], S2 = [2,6,4]
    //   Would produce: 3v2, 1v6, 5v4 (different pairings)

    const players: Player[] = [
      { id: '1', points: 0, rank: 1, rating: 2200 },
      { id: '2', points: 0, rank: 2, rating: 2000 },
      { id: '3', points: 0, rank: 3, rating: 2400 },
      { id: '4', points: 0, rank: 4, rating: 1800 },
      { id: '5', points: 0, rank: 5, rating: 2100 },
      { id: '6', points: 0, rank: 6, rating: 1900 },
    ];

    const result = pair(players, []);

    const pairKeys = result.games
      .map((g) =>
        [g.white, g.black].toSorted((a, b) => a.localeCompare(b)).join('-'),
      )
      .toSorted((a, b) => a.localeCompare(b));

    // S1=[1,2,3] vs S2=[4,5,6] by pairing number
    expect(pairKeys).toEqual(['1-4', '2-5', '3-6']);
  });
});
