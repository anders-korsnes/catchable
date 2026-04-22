// Pokémon type → Chuck Norris joke category. Types without a mapping fall
// back to a random joke at runtime.
//
// Chuck Norris categories (current):
//   animal, career, celebrity, dev, explicit, fashion, food, history,
//   money, movie, music, political, religion, science, sport, travel
export const TYPE_TO_JOKE_CATEGORY: Readonly<Record<string, string>> = Object.freeze({
  // Combat / strength
  fighting: 'sport',
  rock: 'sport',
  steel: 'sport',
  // Animal kingdom
  bug: 'animal',
  flying: 'animal',
  // Tech / unknown forces
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
  normal: 'money',
});

export const ALL_KNOWN_TYPES = Object.keys(TYPE_TO_JOKE_CATEGORY);
