/**
 * Achievement catalog.
 *
 * Definitions live in code (not the database) so we can iterate on the list
 * without migrations. The `user_achievements` table just records which IDs a
 * user has unlocked.
 *
 * IDs are stable strings — changing one will "lose" any existing unlocks.
 *
 *   - **Static** achievements have a fixed id known at build time.
 *   - **Dynamic** achievements are generated per region/type at request time
 *     (e.g. `region-complete:kanto`). Their definitions are produced by
 *     `dynamicAchievementsFor()` from PokéAPI's region/type lists.
 */

export type AchievementCategory =
  | 'progression'
  | 'difficulty'
  | 'completion'
  | 'special';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  /** Hidden achievements are not shown in the locked list — the player
   * only sees them once unlocked, with title + description revealed. */
  hidden?: boolean;
  icon: string;
  /** A coarse "weight" used purely for sorting in the UI. */
  order: number;
}

// ---------------------------------------------------------------------------
// Static achievements
// ---------------------------------------------------------------------------

export const STATIC_ACHIEVEMENTS: AchievementDef[] = [
  // Progression — catch counts.
  { id: 'first-catch', icon: '⭐', title: "Gotta Catch 'Em", description: 'Caught your very first Pokémon.', category: 'progression', order: 1 },
  { id: 'catches-5', icon: '🎒', title: 'Rookie Trainer', description: 'Caught 5 Pokémon.', category: 'progression', order: 2 },
  { id: 'catches-10', icon: '📜', title: 'Apprentice', description: 'Caught 10 Pokémon.', category: 'progression', order: 3 },
  { id: 'catches-25', icon: '🎖️', title: 'Junior Trainer', description: 'Caught 25 Pokémon.', category: 'progression', order: 4 },
  { id: 'catches-50', icon: '🏅', title: 'Trainer', description: 'Caught 50 Pokémon.', category: 'progression', order: 5 },
  { id: 'catches-100', icon: '🥇', title: 'Veteran Trainer', description: 'Caught 100 Pokémon.', category: 'progression', order: 6 },
  { id: 'catches-500', icon: '👑', title: 'Pokémon Master', description: 'Caught 500 Pokémon.', category: 'progression', order: 7 },
  { id: 'catches-1000', icon: '🌟', title: 'Pokémon Legend', description: 'Caught 1000 Pokémon. Truly the very best.', category: 'progression', order: 8 },

  // Difficulty — first of each tier.
  { id: 'easy-catch', icon: '🟢', title: "Beginner's Luck", description: 'Caught an Easy-difficulty Pokémon.', category: 'difficulty', order: 10 },
  { id: 'medium-catch', icon: '🟡', title: 'Skilled Hand', description: 'Caught a Medium-difficulty Pokémon.', category: 'difficulty', order: 11 },
  { id: 'hard-catch', icon: '🟠', title: 'Big Game Hunter', description: 'Caught a Hard-difficulty Pokémon.', category: 'difficulty', order: 12 },
  { id: 'legendary-catch', icon: '🔴', title: 'Legend Slayer', description: 'Caught a Legendary-difficulty Pokémon.', category: 'difficulty', order: 13 },
  { id: 'apex-predator', icon: '⚔️', title: 'Apex Predator', description: 'Caught 10 Hard-or-Legendary Pokémon.', category: 'difficulty', order: 14, hidden: true },

  // Special / hidden — niche moments.
  { id: 'first-flee', icon: '💨', title: 'It Got Away', description: 'A Pokémon fled from your Poké Ball.', category: 'special', order: 20, hidden: true },
  { id: 'comeback', icon: '🔁', title: 'Persistence Pays', description: 'Caught a Pokémon after it fled from a previous attempt.', category: 'special', order: 21, hidden: true },
  { id: 'night-owl', icon: '🦉', title: 'Night Owl', description: 'Caught a Pokémon between midnight and 4 AM.', category: 'special', order: 22, hidden: true },
  { id: 'early-bird', icon: '🐦', title: 'Early Bird', description: 'Caught a Pokémon before 7 AM.', category: 'special', order: 23, hidden: true },
  { id: 'first-pass', icon: '🤔', title: 'Picky Trainer', description: 'Skipped the first Pokémon of the day.', category: 'special', order: 24, hidden: true },
  { id: 'passes-50', icon: '😤', title: 'Connoisseur', description: 'Passed on 50 Pokémon.', category: 'special', order: 25, hidden: true },
  { id: 'rainbow-trainer', icon: '🌈', title: 'Rainbow Trainer', description: 'Caught at least one Pokémon of every type in your selected regions.', category: 'special', order: 26 },
];

// ---------------------------------------------------------------------------
// Dynamic achievements (region & type completion)
// ---------------------------------------------------------------------------

export function regionAchievementId(region: string): string {
  return `region-complete:${region}`;
}

export function typeAchievementId(type: string): string {
  return `type-complete:${type}`;
}

export function typeRegionAchievementId(type: string, region: string): string {
  return `type-region-complete:${type}:${region}`;
}

export function dynamicAchievementsFor(
  regions: readonly string[],
  types: readonly string[],
): AchievementDef[] {
  const out: AchievementDef[] = [];
  let order = 100;

  for (const region of regions) {
    out.push({
      id: regionAchievementId(region),
      title: `${cap(region)} Complete`,
      description: `Caught every Pokémon in the ${cap(region)} region.`,
      category: 'completion',
      icon: '📘',
      order: order++,
    });
  }

  for (const type of types) {
    out.push({
      id: typeAchievementId(type),
      title: `${cap(type)} Specialist`,
      description: `Caught every ${cap(type)}-type Pokémon.`,
      category: 'completion',
      icon: '🏷️',
      order: order++,
    });
  }

  return out;
}

function cap(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}
