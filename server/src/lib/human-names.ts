// Stable pool of names used for the "Josh the Charmander" gimmick. We seed the
// pick by Pokémon id so the same Pokémon always gets the same name for a given
// user — otherwise the joke gets old fast and the Liked view looks confusing.
const NAMES = [
  'Josh', 'Mia', 'Sam', 'Rio', 'Aria', 'Luna', 'Finn', 'Theo', 'Nora', 'Kai',
  'Zoe', 'Eli', 'Maya', 'Leo', 'Ivy', 'Jude', 'Cleo', 'Otto', 'Wren', 'Ezra',
  'Hugo', 'Ada', 'Iris', 'Milo', 'Juno', 'Remy', 'Sage', 'Nico', 'Asa', 'Vera',
  'Quinn', 'Beau', 'Dani', 'Ruth', 'Phil', 'Cara', 'Dora', 'Toby', 'Hank', 'Pepe',
];

export function nameFor(pokemonId: number): string {
  return NAMES[pokemonId % NAMES.length]!;
}
