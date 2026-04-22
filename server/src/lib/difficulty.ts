/**
 * Server-side mirror of the client's catch-difficulty tiers.
 * Keep in sync with `client/src/lib/catch-difficulty.ts`.
 *
 *   exp <  100       → easy
 *   100 ≤ exp < 200  → medium
 *   200 ≤ exp < 250  → hard
 *   exp ≥ 250        → legendary
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';

const THRESHOLDS: Array<{ bucket: Difficulty; minExp: number }> = [
  { bucket: 'easy', minExp: 0 },
  { bucket: 'medium', minExp: 100 },
  { bucket: 'hard', minExp: 200 },
  { bucket: 'legendary', minExp: 250 },
];

export function getDifficultyBucket(baseExperience: number | null | undefined): Difficulty {
  const exp = baseExperience ?? 0;
  let chosen: Difficulty = 'easy';
  for (const t of THRESHOLDS) {
    if (exp >= t.minExp) chosen = t.bucket;
  }
  return chosen;
}
