import type { PokemonSummary } from '../../lib/types';

export type CatchResult = 'caught' | 'fled';

/**
 * Common props all minigame variants accept. Each minigame owns its own
 * "throw" interaction (button + keyboard shortcut) and reports the outcome
 * exactly once via `onResult`.
 *
 * The `pokemon.baseExperience` field drives difficulty (see catch-difficulty
 * tiers); each minigame translates that into something appropriate for its
 * own play surface (arc size, zone height, hit-radius, ...).
 */
export interface MinigameProps {
  pokemon: PokemonSummary;
  onResult: (result: CatchResult) => void;
}

/** Identifies which minigame the catch picker chose for a Pokémon. */
export type MinigameKind = 'ring' | 'power-bar' | 'bullseye' | 'pendulum';

// Shared timing — keep these in sync across all minigames so the player gets
// consistent post-throw feedback no matter which game is rolled.
export const FLASH_MS = 420;
export const MISS_FLASH_MS = 700;
