import { describe, expect, it } from 'vitest';
import { pickCategoryForTypes } from './chucknorris.js';
import { TYPE_TO_JOKE_CATEGORY } from '../config/type-joke-mapping.js';

const CATEGORIES = [
  'animal',
  'career',
  'celebrity',
  'dev',
  'food',
  'history',
  'money',
  'movie',
  'religion',
  'science',
  'sport',
  'travel',
] as const;

describe('pickCategoryForTypes', () => {
  it('maps a known type to its configured category', () => {
    expect(pickCategoryForTypes(['fire'], CATEGORIES)).toBe(TYPE_TO_JOKE_CATEGORY.fire);
    expect(pickCategoryForTypes(['fighting'], CATEGORIES)).toBe('sport');
    expect(pickCategoryForTypes(['bug'], CATEGORIES)).toBe('animal');
  });

  it('uses the first matching type when a Pokémon has multiple', () => {
    expect(pickCategoryForTypes(['ghost', 'flying'], CATEGORIES)).toBe('religion');
  });

  it('falls back to a later type when the first has no mapping', () => {
    expect(pickCategoryForTypes(['mystery-unknown', 'water'], CATEGORIES)).toBe('travel');
  });

  it('returns null when no type maps to an available category — caller should use random', () => {
    expect(pickCategoryForTypes(['mystery-unknown'], CATEGORIES)).toBeNull();
    expect(pickCategoryForTypes([], CATEGORIES)).toBeNull();
  });

  it('returns null when the mapped category is not currently available upstream', () => {
    // Simulate Chuck Norris API not exposing "sport" anymore — the fighting type's
    // mapping is unavailable, so the matcher should signal "use random".
    const limited = ['dev', 'travel'] as const;
    expect(pickCategoryForTypes(['fighting'], limited)).toBeNull();
  });

  it('is case-insensitive on the Pokémon type', () => {
    expect(pickCategoryForTypes(['FIRE'], CATEGORIES)).toBe(TYPE_TO_JOKE_CATEGORY.fire);
  });
});
