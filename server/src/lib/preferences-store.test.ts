import { describe, expect, it } from 'vitest';
import {
  decodeRegions,
  decodeTypes,
  encodeRegions,
  encodeTypes,
} from './preferences-store.js';

describe('preferences-store: types', () => {
  it('round-trips a list of types', () => {
    expect(decodeTypes(encodeTypes(['fire', 'water']))).toEqual(['fire', 'water']);
  });

  it('lowercases and trims', () => {
    expect(decodeTypes(encodeTypes([' Fire ', 'WATER']))).toEqual(['fire', 'water']);
  });

  it('drops duplicates', () => {
    expect(decodeTypes(encodeTypes(['fire', 'fire']))).toEqual(['fire']);
  });

  it('drops empty strings', () => {
    expect(decodeTypes(encodeTypes(['fire', '', '   ']))).toEqual(['fire']);
  });

  it('decodes an empty stored value to an empty array', () => {
    expect(decodeTypes('')).toEqual([]);
  });
});

describe('preferences-store: regions', () => {
  it('round-trips a list of regions', () => {
    expect(decodeRegions(encodeRegions(['kanto', 'johto']))).toEqual(['kanto', 'johto']);
  });

  it('normalizes case and dedupes', () => {
    expect(decodeRegions(encodeRegions(['Kanto', 'kanto', 'JOHTO']))).toEqual([
      'kanto',
      'johto',
    ]);
  });

  it('decodes an empty stored value to an empty array', () => {
    expect(decodeRegions('')).toEqual([]);
  });
});
