// Region descriptions shown in onboarding and Settings.
// Keys are lowercase PokéAPI region names; unknown keys return null.

export interface RegionInfo {
  generation: string;
  games: string;
  flavor: string;
}

export const REGION_INFO: Readonly<Record<string, RegionInfo>> = {
  kanto: {
    generation: 'Generation I',
    games: 'Red · Blue · Yellow · FireRed · LeafGreen · Let’s Go',
    flavor:
      'The original 151. Home of Pikachu, Charizard, Mewtwo and the iconic Gym leaders.',
  },
  johto: {
    generation: 'Generation II',
    games: 'Gold · Silver · Crystal · HeartGold · SoulSilver',
    flavor:
      'Kanto’s neighbor across Mt. Silver — adds Pichu, Togepi, plus the legendary beasts and Lugia / Ho-Oh.',
  },
  hoenn: {
    generation: 'Generation III',
    games: 'Ruby · Sapphire · Emerald · Omega Ruby · Alpha Sapphire',
    flavor:
      'Tropical region split between land and sea. Weather trio: Kyogre, Groudon and Rayquaza.',
  },
  sinnoh: {
    generation: 'Generation IV',
    games: 'Diamond · Pearl · Platinum · Brilliant Diamond · Shining Pearl',
    flavor:
      'Mountainous and mythological. Dialga, Palkia and Giratina — and the creation trio Arceus.',
  },
  unova: {
    generation: 'Generation V',
    games: 'Black · White · Black 2 · White 2',
    flavor:
      'Inspired by New York City. A 156-strong roster of all-new Pokémon with no repeats from earlier games.',
  },
  kalos: {
    generation: 'Generation VI',
    games: 'X · Y',
    flavor:
      'France-inspired region that introduced Mega Evolution, Fairy types, and Xerneas / Yveltal.',
  },
  alola: {
    generation: 'Generation VII',
    games: 'Sun · Moon · Ultra Sun · Ultra Moon',
    flavor:
      'Tropical Hawaiian-style islands. Brought regional variants, Z-Moves, Solgaleo and Lunala.',
  },
  galar: {
    generation: 'Generation VIII',
    games: 'Sword · Shield',
    flavor:
      'British Isles inspiration, stadium gym battles, Dynamax and Gigantamax. Zacian and Zamazenta.',
  },
  hisui: {
    generation: 'Generation VIII (spin-off)',
    games: 'Legends: Arceus',
    flavor:
      'Ancient Sinnoh. Action-RPG era of the Pokémon world with Hisuian regional forms.',
  },
  paldea: {
    generation: 'Generation IX',
    games: 'Scarlet · Violet',
    flavor:
      'Open-world region inspired by Spain. Ride legendaries Koraidon and Miraidon, three story arcs.',
  },
  orre: {
    generation: 'Spin-off region',
    games: 'Colosseum · XD: Gale of Darkness',
    flavor:
      'Desert region from the GameCube era. No native species — has very few Pokémon mapped to it.',
  },
};

export function describeRegion(name: string): RegionInfo | null {
  return REGION_INFO[name.toLowerCase()] ?? null;
}
