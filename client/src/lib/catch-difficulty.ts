/**
 * Catch-minigame difficulty model.
 *
 * PokéAPI gives us `base_experience` rather than a "level"; we treat it as a
 * proxy for catch difficulty. The mapping is *tiered* (not a smooth curve)
 * so each Pokémon falls cleanly into Easy / Medium / Hard / Legendary, with
 * a fixed sweet-spot arc per tier.
 *
 *   exp <  100   →  EASY       (52° arc)
 *   100 ≤ exp < 200 →  MEDIUM (32°)
 *   200 ≤ exp < 250 →  HARD   (16°)
 *   exp ≥ 250   →  LEGENDARY  (7°)
 *
 * Combined with the 1000 ms ring rotation, that means the LEGENDARY arc
 * window only passes the indicator for ~19 ms — so "press at the right
 * frame" is a real ask.
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';

interface Tier {
  bucket: Difficulty;
  /** Lower bound of base_experience (inclusive). */
  minExp: number;
  /** Sweet-spot arc size in degrees. */
  arc: number;
  label: string;
}

// Ordered easiest → hardest.
const TIERS: Tier[] = [
  { bucket: 'easy', minExp: 0, arc: 52, label: '★☆☆ EASY' },
  { bucket: 'medium', minExp: 100, arc: 32, label: '★★☆ MEDIUM' },
  { bucket: 'hard', minExp: 200, arc: 16, label: '★★★ HARD' },
  { bucket: 'legendary', minExp: 250, arc: 7, label: '★★★★ LEGENDARY' },
];

export const MAX_ARC = TIERS[0].arc;
export const MIN_ARC = TIERS[TIERS.length - 1].arc;

function getTierByExperience(baseExperience: number | null | undefined): Tier {
  // Unknown experience → treat as easy. PokéAPI is reliable enough that this
  // is rare; defaulting to easy keeps the player from getting blindsided by
  // a Legendary arc on a Pokémon we couldn't profile.
  const exp = baseExperience ?? 0;
  let chosen: Tier = TIERS[0];
  for (const t of TIERS) {
    if (exp >= t.minExp) chosen = t;
  }
  return chosen;
}

export function getArcSizeByExperience(baseExperience: number | null | undefined): number {
  return getTierByExperience(baseExperience).arc;
}

export function getDifficultyLabel(baseExperience: number | null | undefined): string {
  return getTierByExperience(baseExperience).label;
}

/**
 * Returns the machine-readable difficulty bucket for a Pokémon's base experience.
 * Used by the achievements engine (server-side mirror lives in `server/src/lib/difficulty.ts`).
 */
export function getDifficultyBucket(
  baseExperience: number | null | undefined,
): Difficulty {
  return getTierByExperience(baseExperience).bucket;
}
