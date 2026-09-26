import { parse, stringify } from '@echecs/trf';
import { describe, expect, it } from 'vitest';

import { generate } from '../generate.js';
import { check, extractAbsentPlayers, extractRoundPairings } from '../index.js';

describe('check — TRF26 input', () => {
  it('produces identical summaries for TRF16 and TRF26 input', () => {
    const base = { players: 21, rounds: 5, seed: 314 };
    const trf16 = check(generate({ ...base, format: 'TRF16' }));
    const trf26 = check(generate({ ...base, format: 'TRF26' }));
    expect(trf26.summary).toEqual(trf16.summary);
    expect(trf16.summary.perfectRounds).toBe(trf16.summary.totalRounds);
  });

  it('honors pairing byes as engine-reassigned (odd player count)', () => {
    const output = generate({ players: 11, rounds: 5, seed: 27 });
    const tournament = parse(output);
    expect(tournament).not.toBeNull();
    if (!tournament) {
      return;
    }
    const byeRound = tournament.completedRounds.findIndex(
      (r) => r.byes.length > 0,
    );
    expect(byeRound).toBeGreaterThanOrEqual(0);
    const absent = extractAbsentPlayers(tournament, byeRound + 1);
    // pairing byes are NOT pre-assigned absences: the engine re-derives them
    const bye = tournament.completedRounds[byeRound]?.byes[0];
    expect(bye?.kind).toBe('pairing');
    expect(absent.has(bye?.player ?? '')).toBe(false);
    // and the full check still passes
    const result = check(output);
    expect(result.summary.perfectRounds).toBe(result.summary.totalRounds);
  });

  it('honors 240-record point byes as absent players', () => {
    const tournamentData = {
      completedRounds: [
        {
          byes: [
            { kind: 'half' as const, player: '3' },
            { kind: 'full' as const, player: '4' },
          ],
          games: [{ black: '2', result: 'draw' as const, white: '1' }],
        },
      ],
      players: [
        { id: '1', name: 'Player One', points: 0.5, rank: 1 },
        { id: '2', name: 'Player Two', points: 0.5, rank: 2 },
        { id: '3', name: 'Player Three', points: 0.5, rank: 3 },
        { id: '4', name: 'Player Four', points: 1, rank: 4 },
      ],
      totalRounds: 1,
    };
    const document = stringify(tournamentData, { version: 'TRF26' });
    expect(document).toMatch(/^240 H 001 {2}003$/m);
    expect(document).toMatch(/^240 F 001 {2}004$/m);
    const tournament = parse(document);
    expect(tournament).not.toBeNull();
    if (!tournament) {
      return;
    }
    expect(extractRoundPairings(tournament, 1)).toEqual([['1', '2']]);
    expect(extractAbsentPlayers(tournament, 1)).toEqual(new Set(['3', '4']));
    // end-to-end: excluded players are not re-paired, so the round checks clean
    const result = check(document, { rounds: [1] });
    expect(result.rounds[0]?.matching).toBe(1);
    expect(result.rounds[0]?.total).toBe(1);
  });
});
