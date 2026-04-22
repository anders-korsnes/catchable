import type { PokemonSummary } from '../../lib/types';

export type CatchResult = 'caught' | 'fled';

/** Props for every minigame variant. Calls onResult exactly once. Difficulty comes from pokemon.baseExperience. */
export interface MinigameProps {
  pokemon: PokemonSummary;
  onResult: (result: CatchResult) => void;
}

/** Which minigame variant the picker selected. */
export type MinigameKind = 'ring' | 'power-bar' | 'bullseye' | 'pendulum';

// Shared post-throw feedback durations.
export const FLASH_MS = 420;
export const MISS_FLASH_MS = 700;
