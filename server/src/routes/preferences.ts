import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  decodeDifficulties,
  decodeRegions,
  decodeTypes,
  encodeDifficulties,
  encodeRegions,
  encodeTypes,
} from '../lib/preferences-store.js';

export const preferencesRouter = Router();

preferencesRouter.use(requireAuth);

const upsertSchema = z.object({
  regions: z.array(z.string().trim().min(1)).min(1, 'Pick at least one region'),
  types: z.array(z.string().trim().min(1)).min(1, 'Pick at least one type'),
  // Empty array / omitted = all difficulties.
  difficulties: z
    .array(z.enum(['easy', 'medium', 'hard', 'legendary']))
    .optional()
    .default([]),
});

preferencesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const pref = await prisma.userPreference.findUnique({
      where: { userId: req.user!.id },
    });
    if (!pref) {
      res.json({ preferences: null });
      return;
    }
    res.json({
      preferences: {
        regions: decodeRegions(pref.regions),
        types: decodeTypes(pref.types),
        difficulties: decodeDifficulties(pref.difficulties),
      },
    });
  }),
);

preferencesRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const { regions, types, difficulties } = upsertSchema.parse(req.body);
    const storedRegions = encodeRegions(regions);
    const storedTypes = encodeTypes(types);
    const storedDifficulties = encodeDifficulties(difficulties);
    const pref = await prisma.userPreference.upsert({
      where: { userId: req.user!.id },
      update: {
        regions: storedRegions,
        types: storedTypes,
        difficulties: storedDifficulties,
      },
      create: {
        userId: req.user!.id,
        regions: storedRegions,
        types: storedTypes,
        difficulties: storedDifficulties,
      },
    });
    res.json({
      preferences: {
        regions: decodeRegions(pref.regions),
        types: decodeTypes(pref.types),
        difficulties: decodeDifficulties(pref.difficulties),
      },
    });
  }),
);
