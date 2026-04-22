// Maps Pokémon types to the closest matching Chuck Norris joke category.
// Chuck Norris API has a fixed set of categories; the most thematically adjacent
// one is used per type. Multiple types may collapse to the same category.
// Update this table if the Chuck Norris API adds new categories.
//
// Available Chuck Norris categories (as of writing):
//   animal, career, celebrity, dev, explicit, fashion, food, history,
//   money, movie, music, political, religion, science, sport, travel
//
// Types with no obvious mapping fall back to a random joke at runtime.
export const TYPE_TO_JOKE_CATEGORY: Readonly<Record<string, string>> = Object.freeze({
  // Combat / strength → sport
  fighting: 'sport',
  rock: 'sport',
  steel: 'sport',
  // Animal kingdom
  bug: 'animal',
  flying: 'animal',
  // "Tech" / unknown forces → dev (Chuck breaking compilers and laws of physics)
  electric: 'dev',
  psychic: 'dev',
  // Otherworldly
  ghost: 'religion',
  dragon: 'history',
  fairy: 'religion',
  dark: 'religion',
  // Earthly
  ground: 'travel',
  water: 'travel',
  ice: 'travel',
  grass: 'food',
  poison: 'food',
  fire: 'celebrity',
  // Default-ish — Normal types are the everyman, give them money jokes
  normal: 'money',
});

export const ALL_KNOWN_TYPES = Object.keys(TYPE_TO_JOKE_CATEGORY);
