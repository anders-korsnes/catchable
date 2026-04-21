import { describe, expect, it } from 'vitest';
import {
  getArcSizeByExperience,
  getDifficultyBucket,
  getDifficultyLabel,
  MAX_ARC,
  MIN_ARC,
} from './catch-difficulty';

describe('getDifficultyBucket', () => {
  it('classifies low-experience Pokémon as easy', () => {
    expect(getDifficultyBucket(0)).toBe('easy');
    expect(getDifficultyBucket(50)).toBe('easy');
    expect(getDifficultyBucket(99)).toBe('easy');
  });

  it('classifies the 100–199 band as medium', () => {
    expect(getDifficultyBucket(100)).toBe('medium');
    expect(getDifficultyBucket(150)).toBe('medium');
    expect(getDifficultyBucket(199)).toBe('medium');
  });

  it('classifies the 200–249 band as hard', () => {
    expect(getDifficultyBucket(200)).toBe('hard');
    expect(getDifficultyBucket(225)).toBe('hard');
    expect(getDifficultyBucket(249)).toBe('hard');
  });

  it('classifies 250+ as legendary', () => {
    expect(getDifficultyBucket(250)).toBe('legendary');
    expect(getDifficultyBucket(306)).toBe('legendary'); // Mewtwo-ish
    expect(getDifficultyBucket(9999)).toBe('legendary');
  });

  it('treats unknown experience as easy', () => {
    expect(getDifficultyBucket(null)).toBe('easy');
    expect(getDifficultyBucket(undefined)).toBe('easy');
  });
});

describe('getArcSizeByExperience', () => {
  it('returns the easy arc as MAX_ARC', () => {
    expect(getArcSizeByExperience(50)).toBe(MAX_ARC);
  });

  it('returns the legendary arc as MIN_ARC', () => {
    expect(getArcSizeByExperience(400)).toBe(MIN_ARC);
  });

  it('is monotonically non-increasing as experience grows', () => {
    let prev = Infinity;
    for (let exp = 0; exp <= 400; exp += 10) {
      const arc = getArcSizeByExperience(exp);
      expect(arc).toBeLessThanOrEqual(prev);
      prev = arc;
    }
  });

  it('produces exactly four distinct arc sizes', () => {
    const sizes = new Set([
      getArcSizeByExperience(50),
      getArcSizeByExperience(150),
      getArcSizeByExperience(225),
      getArcSizeByExperience(400),
    ]);
    expect(sizes.size).toBe(4);
  });
});

describe('getDifficultyLabel', () => {
  it('labels low-exp mons as easy', () => {
    expect(getDifficultyLabel(40)).toContain('EASY');
  });

  it('labels mid-exp mons as medium', () => {
    expect(getDifficultyLabel(150)).toContain('MEDIUM');
  });

  it('labels high-exp mons as hard', () => {
    expect(getDifficultyLabel(225)).toContain('HARD');
  });

  it('reserves the legendary bucket for the very high end', () => {
    expect(getDifficultyLabel(300)).toContain('LEGENDARY');
  });
});
