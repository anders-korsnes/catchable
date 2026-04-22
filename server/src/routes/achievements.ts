import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  STATIC_ACHIEVEMENTS,
  dynamicAchievementsFor,
  type AchievementDef,
} from '../lib/achievements/catalog.js';
import { decodeRegions, decodeTypes } from '../lib/preferences-store.js';

export const achievementsRouter = Router();

achievementsRouter.use(requireAuth);

/**
 * Returns every achievement plus unlock state.
 * Hidden + locked entries are replaced with a placeholder so title/description aren't leaked.
 */
achievementsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const [unlockedRows, pref] = await Promise.all([
      prisma.userAchievement.findMany({ where: { userId } }),
      prisma.userPreference.findUnique({ where: { userId } }),
    ]);
    const unlockedMap = new Map(
      unlockedRows.map((r) => [r.achievementId, r.unlockedAt.toISOString()]),
    );

    const regions = pref ? decodeRegions(pref.regions) : [];
    const types = pref ? decodeTypes(pref.types) : [];
    const dynamic = dynamicAchievementsFor(regions, types);
    const all = [...STATIC_ACHIEVEMENTS, ...dynamic];

    const items = all.map((def) => buildItem(def, unlockedMap));

    res.json({
      total: items.length,
      unlocked: unlockedMap.size,
      items,
    });
  }),
);

function buildItem(
  def: AchievementDef,
  unlockedMap: Map<string, string>,
): AchievementListItem {
  const unlockedAt = unlockedMap.get(def.id) ?? null;
  const isHiddenAndLocked = def.hidden && unlockedAt === null;

  if (isHiddenAndLocked) {
    return {
      id: def.id,
      title: 'Locked Secret Achievement',
      description: 'Keep playing to discover this one.',
      category: def.category,
      icon: '❓',
      hidden: true,
      unlocked: false,
      unlockedAt: null,
      order: def.order,
    };
  }
  return {
    id: def.id,
    title: def.title,
    description: def.description,
    category: def.category,
    icon: def.icon,
    hidden: def.hidden ?? false,
    unlocked: unlockedAt !== null,
    unlockedAt,
    order: def.order,
  };
}

interface AchievementListItem {
  id: string;
  title: string;
  description: string;
  category: AchievementDef['category'];
  icon: string;
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  order: number;
}
