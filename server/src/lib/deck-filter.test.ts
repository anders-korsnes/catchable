import { describe, expect, it } from 'vitest';
import { countRemaining, pickNextCandidate } from './deck-filter.js';

const candidates = [
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
  { id: 7, name: 'squirtle' },
  { id: 25, name: 'pikachu' },
];

describe('pickNextCandidate', () => {
  it('returns the first candidate when nothing has been decided yet', () => {
    expect(pickNextCandidate(candidates, [])?.id).toBe(1);
  });

  it('skips Pokémon the user has already liked', () => {
    expect(pickNextCandidate(candidates, [1])?.id).toBe(4);
  });

  it('skips Pokémon whose ids are in the decided set', () => {
    expect(pickNextCandidate(candidates, [1, 4])?.id).toBe(7);
  });

  it('returns null when every candidate has been seen', () => {
    expect(pickNextCandidate(candidates, [1, 4, 7, 25])).toBeNull();
  });

  it('preserves candidate order (first not-seen wins)', () => {
    expect(pickNextCandidate(candidates, [4, 25])?.id).toBe(1);
  });
});

describe('countRemaining', () => {
  it('counts candidates the user has not decided on', () => {
    expect(countRemaining(candidates, [])).toBe(4);
    expect(countRemaining(candidates, [1, 4])).toBe(2);
    expect(countRemaining(candidates, [1, 4, 7, 25])).toBe(0);
  });

  it('ignores ids that are not in the candidate set', () => {
    expect(countRemaining(candidates, [999])).toBe(4);
  });
});
