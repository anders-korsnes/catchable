/**
 * Difficulty tiers derived from PokéAPI base_experience:
 *   <100 EASY (52°), <200 MEDIUM (32°), <250 HARD (16°), >=250 LEGENDARY (7°).
 * Ring rotates in 1000ms, so the legendary arc only passes for ~19ms.
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';

interface Tier {
  bucket: Difficulty;
  /** Inclusive lower bound on base_experience. */
  minExp: number;
  /** Sweet-spot arc (degrees). */
  arc: number;
  label: string;
}

// Ordered easiest to hardest.
const TIERS: Tier[] = [
  { bucket: 'easy', minExp: 0, arc: 52, label: '★☆☆ EASY' },
  { bucket: 'medium', minExp: 100, arc: 32, label: '★★☆ MEDIUM' },
  { bucket: 'hard', minExp: 200, arc: 16, label: '★★★ HARD' },
  { bucket: 'legendary', minExp: 250, arc: 7, label: '★★★★ LEGENDARY' },
];

export const MAX_ARC = TIERS[0].arc;
export const MIN_ARC = TIERS[TIERS.length - 1].arc;

function getTierByExperience(baseExperience: number | null | undefined): Tier {
  // Unknown experience defaults to easy.
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

/** Difficulty bucket. Mirrored server-side in server/src/lib/difficulty.ts. */
export function getDifficultyBucket(
  baseExperience: number | null | undefined,
): Difficulty {
  return getTierByExperience(baseExperience).bucket;
}
