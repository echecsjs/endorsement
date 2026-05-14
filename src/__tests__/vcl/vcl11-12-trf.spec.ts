import { parse, stringify } from '@echecs/trf';
import { describe, expect, it } from 'vitest';


import { generate } from '../../generate.js';

describe('VCL.11: TRF16 import', () => {
  it('parses a generated TRF16 file correctly', () => {
    const trfContent = generate({ players: 20, rounds: 5, seed: 42 });
    const tournament = parse(trfContent);

    expect(tournament).not.toBeNull();
    expect(tournament!.players).toHaveLength(20);
    expect(tournament!.rounds).toBe(5);
  });

  it('parses all player fields', () => {
    const trfContent = generate({ players: 10, rounds: 3, seed: 7 });
    const tournament = parse(trfContent);

    expect(tournament).not.toBeNull();
    for (const player of tournament!.players) {
      expect(player.pairingNumber).toBeGreaterThan(0);
      expect(player.name).toBeTruthy();
      expect(player.results.length).toBeGreaterThan(0);
    }
  });

  it('parses all result types from a generated tournament', () => {
    const trfContent = generate({ players: 40, rounds: 9, seed: 123 });
    const tournament = parse(trfContent);

    expect(tournament).not.toBeNull();

    const resultCodes = new Set<string>();
    for (const player of tournament!.players) {
      for (const result of player.results) {
        resultCodes.add(result.result);
      }
    }

    expect(resultCodes.has('1')).toBe(true);
    expect(resultCodes.has('0')).toBe(true);
    expect(resultCodes.has('=')).toBe(true);
  });

  it('returns null for empty input', () => {
    const result = parse('');
    expect(result).toBeNull();
  });
});

describe('VCL.12: TRF16 export', () => {
  it('round-trips a tournament through stringify then parse', () => {
    const originalTrf = generate({ players: 16, rounds: 5, seed: 99 });
    const tournament = parse(originalTrf);
    expect(tournament).not.toBeNull();

    const reStringified = stringify(tournament!);
    const reParsed = parse(reStringified);

    expect(reParsed).not.toBeNull();
    expect(reParsed!.players).toHaveLength(tournament!.players.length);
    expect(reParsed!.rounds).toBe(tournament!.rounds);

    for (let index = 0; index < tournament!.players.length; index++) {
      const orig = tournament!.players[index]!;
      const rt = reParsed!.players[index]!;
      expect(rt.pairingNumber).toBe(orig.pairingNumber);
      expect(rt.results).toHaveLength(orig.results.length);
    }
  });

  it('export produces valid UTF-8', () => {
    const trfContent = generate({ players: 10, rounds: 3, seed: 1 });

    const encoder = new TextEncoder();
    const bytes = encoder.encode(trfContent);
    const decoder = new TextDecoder('utf-8', { fatal: true });

    expect(() => decoder.decode(bytes)).not.toThrow();
  });

  it('includes XXR round count tag', () => {
    const trfContent = generate({ players: 10, rounds: 7, seed: 5 });
    expect(trfContent).toContain('XXR 7');
  });
});
