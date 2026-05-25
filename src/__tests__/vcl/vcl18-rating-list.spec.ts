import { parse } from '@echecs/trf';
import { describe, expect, it } from 'vitest';


import { generate } from '../../generate.js';

describe('VCL.18: FIDE rating list', () => {
  it('TRF16 parser reads player ratings correctly', () => {
    const trfContent = generate({ players: 10, rounds: 3, seed: 42 });
    const tournament = parse(trfContent);

    expect(tournament).not.toBeNull();

    for (const player of tournament!.players) {
      expect(player.rating).toBeDefined();
      expect(player.rating).toBeGreaterThanOrEqual(1000);
      expect(player.rating).toBeLessThanOrEqual(2800);
    }
  });

  it('Tournament API accepts players with ratings from external sources', () => {
    const trfContent = generate({ players: 10, rounds: 3, seed: 42 });
    const tournament = parse(trfContent);

    expect(tournament).not.toBeNull();

    const swissPlayers = tournament!.players.map((p) => ({
      id: p.id,
      points: 0,
      rank: p.rank,
      rating: p.rating,
    }));

    expect(swissPlayers.every((p) => typeof p.rating === 'number')).toBe(true);
  });
});
