import { prisma } from '../prisma.js';
import {
  listRegions,
  listSpeciesInRegionByType,
  listTypes,
  getPokemonSummary,
} from '../../services/pokeapi.js';
import { getDifficultyBucket, type Difficulty } from '../difficulty.js';
import { regionAchievementId, typeAchievementId } from './catalog.js';

export interface CatchEvalContext {
  pokemonId: number;
  pokemonTypes: string[];
  baseExperience: number | null;
  catchTime: Date;
  /** True iff this catch overwrote a previous 'fled' record (drives `comeback`). */
  wasPreviouslyFled: boolean;
  preference: { regions: string[]; types: string[] };
}

export interface PassEvalContext {
  preference: { regions: string[]; types: string[] };
}

export interface FleeEvalContext {
  pokemonId: number;
  preference: { regions: string[]; types: string[] };
}

// Achievement IDs already unlocked by the user.
async function loadUnlocked(userId: string): Promise<Set<string>> {
  const rows = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  return new Set(rows.map((r) => r.achievementId));
}

async function award(userId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await prisma.$transaction(
    ids.map((id) =>
      prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: id } },
        update: {},
        create: { userId, achievementId: id },
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Evaluators
// ---------------------------------------------------------------------------

/**
 * Evaluate achievements triggered by a successful catch. Returns newly-unlocked IDs.
 * Region/type completion is scoped to the user's current preferences.
 */
export async function evaluateOnCatch(
  userId: string,
  ctx: CatchEvalContext,
): Promise<string[]> {
  const unlocked = await loadUnlocked(userId);
  const candidates: string[] = [];

  // Catch-count thresholds (the new catch is already in the DB).
  const totalCaught = await prisma.pokemonChoice.count({
    where: { userId, choice: 'like' },
  });
  for (const t of CATCH_THRESHOLDS) {
    if (totalCaught >= t.n) candidates.push(t.id);
  }

  // Difficulty firsts.
  const diff = getDifficultyBucket(ctx.baseExperience);
  candidates.push(DIFFICULTY_TO_ACHIEVEMENT[diff]);

  // Apex Predator — 10 Hard/Legendary catches. Summaries are cached so this is cheap.
  if (!unlocked.has('apex-predator')) {
    const hardCount = await countLikedAtDifficulty(userId, ['hard', 'legendary']);
    if (hardCount >= 10) candidates.push('apex-predator');
  }

  if (ctx.wasPreviouslyFled) candidates.push('comeback');

  // Time-of-day uses the server clock.
  const hour = ctx.catchTime.getHours();
  if (hour >= 0 && hour < 4) candidates.push('night-owl');
  if (hour >= 0 && hour < 7) candidates.push('early-bird');

  // Rainbow trainer — one of every type available in the user's selected regions.
  if (!unlocked.has('rainbow-trainer')) {
    const isRainbow = await checkRainbowTrainer(userId, ctx.preference);
    if (isRainbow) candidates.push('rainbow-trainer');
  }

  // Region & type completion (dynamic IDs).
  const completion = await evaluateCompletion(userId, ctx.preference, unlocked);
  candidates.push(...completion);

  const newly = candidates.filter((id) => !unlocked.has(id));
  // Dedupe: a single catch can match multiple thresholds.
  const unique = Array.from(new Set(newly));
  await award(userId, unique);
  return unique;
}

/** Evaluate achievements on a failed catch (fled). */
export async function evaluateOnFlee(
  userId: string,
  _ctx: FleeEvalContext,
): Promise<string[]> {
  const unlocked = await loadUnlocked(userId);
  const newly: string[] = [];
  if (!unlocked.has('first-flee')) newly.push('first-flee');
  await award(userId, newly);
  return newly;
}

/** Evaluate achievements on a pass/dislike. */
export async function evaluateOnPass(
  userId: string,
  _ctx: PassEvalContext,
): Promise<string[]> {
  const unlocked = await loadUnlocked(userId);
  const newly: string[] = [];
  if (!unlocked.has('first-pass')) {
    // Picky Trainer: pass is the first choice of the calendar day (server tz).
    // The current pass is already upserted by choices.ts, so today's count == 1
    // means this is the first action today.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await prisma.pokemonChoice.count({
      where: { userId, createdAt: { gte: startOfDay } },
    });
    if (todayCount <= 1) newly.push('first-pass');
  }
  if (!unlocked.has('passes-50')) {
    const passes = await prisma.pokemonChoice.count({
      where: { userId, choice: 'dislike' },
    });
    if (passes >= 50) newly.push('passes-50');
  }
  await award(userId, newly);
  return newly;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATCH_THRESHOLDS = [
  { id: 'first-catch', n: 1 },
  { id: 'catches-5', n: 5 },
  { id: 'catches-10', n: 10 },
  { id: 'catches-25', n: 25 },
  { id: 'catches-50', n: 50 },
  { id: 'catches-100', n: 100 },
  { id: 'catches-500', n: 500 },
  { id: 'catches-1000', n: 1000 },
] as const;

const DIFFICULTY_TO_ACHIEVEMENT: Record<Difficulty, string> = {
  easy: 'easy-catch',
  medium: 'medium-catch',
  hard: 'hard-catch',
  legendary: 'legendary-catch',
};

async function countLikedAtDifficulty(
  userId: string,
  buckets: Difficulty[],
): Promise<number> {
  const liked = await prisma.pokemonChoice.findMany({
    where: { userId, choice: 'like' },
    select: { pokemonId: true },
  });
  const wanted = new Set(buckets);
  let n = 0;
  for (const row of liked) {
    try {
      const summary = await getPokemonSummary(row.pokemonId);
      if (wanted.has(getDifficultyBucket(summary.baseExperience))) n++;
    } catch {
      // Skip unresolved summaries rather than failing the whole evaluation.
    }
  }
  return n;
}

async function checkRainbowTrainer(
  userId: string,
  pref: { regions: string[]; types: string[] },
): Promise<boolean> {
  // Type universe = all types present in the user's selected regions.
  const [allTypesRaw, ...regionLists] = await Promise.all([
    listTypes(),
    ...pref.regions.map((r) => listSpeciesInRegionByType(r, [])),
  ]);
  const universe = new Set<string>();
  for (const list of regionLists) {
    for (const sp of list) {
      for (const t of sp.types) universe.add(t);
    }
  }
  // Intersect with the canonical type list so odd PokéAPI entries can't make it impossible.
  const canonical = new Set(allTypesRaw.map((t) => t.name));
  const required = new Set([...universe].filter((t) => canonical.has(t)));

  const liked = await prisma.pokemonChoice.findMany({
    where: { userId, choice: 'like' },
    select: { pokemonId: true },
  });
  const likedIds = new Set(liked.map((l) => l.pokemonId));
  const caughtTypes = new Set<string>();
  for (const list of regionLists) {
    for (const sp of list) {
      if (likedIds.has(sp.id)) {
        for (const t of sp.types) caughtTypes.add(t);
      }
    }
  }
  for (const need of required) {
    if (!caughtTypes.has(need)) return false;
  }
  return required.size > 0;
}

/**
 * Awards region-complete (scoped to selected regions) and type-complete
 * (global — every Pokémon of that type across all regions) achievements.
 */
async function evaluateCompletion(
  userId: string,
  pref: { regions: string[]; types: string[] },
  unlocked: Set<string>,
): Promise<string[]> {
  const newly: string[] = [];

  const liked = await prisma.pokemonChoice.findMany({
    where: { userId, choice: 'like' },
    select: { pokemonId: true },
  });
  const likedIds = new Set(liked.map((l) => l.pokemonId));

  // Region completion — scoped to selected regions.
  const selectedRegionLists = await Promise.all(
    pref.regions.map((r) =>
      listSpeciesInRegionByType(r, []).then((list) => ({ region: r, list })),
    ),
  );
  for (const { region, list } of selectedRegionLists) {
    if (list.length === 0) continue;
    const id = regionAchievementId(region);
    if (unlocked.has(id)) continue;
    if (list.every((sp) => likedIds.has(sp.id))) newly.push(id);
  }

  // Type completion — global across every region.
  const allRegions = await listRegions();
  const allRegionLists = await Promise.all(
    allRegions.map((r) => listSpeciesInRegionByType(r.name, [])),
  );

  for (const type of pref.types) {
    const id = typeAchievementId(type);
    if (unlocked.has(id)) continue;
    const allOfType = new Set<number>();
    for (const list of allRegionLists) {
      for (const sp of list) {
        if (sp.types.includes(type)) allOfType.add(sp.id);
      }
    }
    if (allOfType.size === 0) continue;
    if ([...allOfType].every((id) => likedIds.has(id))) newly.push(typeAchievementId(type));
  }

  return newly;
}
