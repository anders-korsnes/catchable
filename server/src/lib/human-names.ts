// Name pool for the "Josh the Charmander" gimmick. Keyed by Pokémon id so the
// same Pokémon always gets the same name.
const NAMES = [
  'Josh', 'Mia', 'Sam', 'Rio', 'Aria', 'Luna', 'Finn', 'Theo', 'Nora', 'Kai',
  'Zoe', 'Eli', 'Maya', 'Leo', 'Ivy', 'Jude', 'Cleo', 'Otto', 'Wren', 'Ezra',
  'Hugo', 'Ada', 'Iris', 'Milo', 'Juno', 'Remy', 'Sage', 'Nico', 'Asa', 'Vera',
  'Quinn', 'Beau', 'Dani', 'Ruth', 'Phil', 'Cara', 'Dora', 'Toby', 'Hank', 'Pepe',
];

export function nameFor(pokemonId: number): string {
  return NAMES[pokemonId % NAMES.length]!;
}
