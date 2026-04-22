import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import { getPokemonSummary, listRegions, listSpeciesInRegionByType } from '../services/pokeapi.js';
import { getJokeForTypes } from '../services/chucknorris.js';
import { nameFor } from '../lib/human-names.js';
import { notFound } from '../lib/errors.js';
import { decodeRegions, decodeTypes } from '../lib/preferences-store.js';
import {
  evaluateOnCatch,
  evaluateOnFlee,
  evaluateOnPass,
} from '../lib/achievements/evaluator.js';
import {
  STATIC_ACHIEVEMENTS,
  dynamicAchievementsFor,
  type AchievementDef,
} from '../lib/achievements/catalog.js';

export const choicesRouter = Router();

choicesRouter.use(requireAuth);

const choiceSchema = z.object({
  pokemonId: z.number().int().positive(),
  // 'fled' is a transient choice — see deck.ts for the 5-minute cooldown.
  choice: z.enum(['like', 'dislike', 'fled']),
});

// POST / — records a swipe result and returns any newly unlocked achievements.
// Handles all three choice types: 'like', 'dislike', 'fled'.
choicesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const { pokemonId, choice } = choiceSchema.parse(req.body);

    // Read the previous record before upserting to detect the fled → caught case.
    const previous = await prisma.pokemonChoice.findUnique({
      where: { userId_pokemonId: { userId, pokemonId } },
    });
    const wasPreviouslyFled = previous?.choice === 'fled';

    // Re-recording 'fled' on the same pokemon should reset the cooldown
    // window — upsert with `update.createdAt = now()` handles that.
    await prisma.pokemonChoice.upsert({
      where: { userId_pokemonId: { userId, pokemonId } },
      update: { choice, createdAt: new Date() },
      create: { userId, pokemonId, choice },
    });

    let newlyUnlocked: string[] = [];

    if (choice === 'like') {
      const pref = await prisma.userPreference.findUnique({ where: { userId } });
      const regions = pref ? decodeRegions(pref.regions) : [];
      const types = pref ? decodeTypes(pref.types) : [];
      let summary = null as Awaited<ReturnType<typeof getPokemonSummary>> | null;
      try {
        summary = await getPokemonSummary(pokemonId);
      } catch {
        // PokéAPI unavailable — catch is still recorded, difficulty evaluation skipped.
      }
      newlyUnlocked = await evaluateOnCatch(userId, {
        pokemonId,
        pokemonTypes: summary?.types ?? [],
        baseExperience: summary?.baseExperience ?? null,
        catchTime: new Date(),
        wasPreviouslyFled,
        preference: { regions, types },
      });
    } else if (choice === 'fled') {
      newlyUnlocked = await evaluateOnFlee(userId, {
        pokemonId,
        preference: { regions: [], types: [] },
      });
    } else {
      newlyUnlocked = await evaluateOnPass(userId, {
        preference: { regions: [], types: [] },
      });
    }

    res.status(201).json({
      ok: true,
      newAchievements: hydrateAchievements(newlyUnlocked),
    });
  }),
);

choicesRouter.get(
  '/liked',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const liked = await prisma.pokemonChoice.findMany({
      where: { userId, choice: 'like' },
      orderBy: { createdAt: 'desc' },
    });

    const pref = await prisma.userPreference.findUnique({ where: { userId } });
    const userRegions = pref ? decodeRegions(pref.regions) : [];
    const userTypes = pref ? decodeTypes(pref.types) : [];

    // Build a pokemonId → region[] map from EVERY region (no type filter) so
    // caught Pokémon always appear in their real region group, even if the user
    // has since deselected that region in their preferences.
    const allRegions = await listRegions();
    const idToRegions = new Map<number, string[]>();
    await Promise.all(
      allRegions.map(async ({ name: region }) => {
        const species = await listSpeciesInRegionByType(region, []);
        for (const s of species) {
          const arr = idToRegions.get(s.id);
          if (arr) arr.push(region);
          else idToRegions.set(s.id, [region]);
        }
      }),
    );

    // Full ID list per user-selected region (filtered by type prefs). Clients use
    // this both for the "X / total" counter *and* to render "still missing"
    // placeholder tiles for Pokémon that haven't been caught yet.
    const regionIds: Record<string, number[]> = {};
    await Promise.all(
      userRegions.map(async (region) => {
        const species = await listSpeciesInRegionByType(region, userTypes);
        regionIds[region] = species.map((s) => s.id).sort((a, b) => a - b);
      }),
    );
    const regionTotals: Record<string, number> = {};
    for (const [r, ids] of Object.entries(regionIds)) regionTotals[r] = ids.length;

    const items = await Promise.all(
      liked.map(async (row) => {
        const pokemon = await getPokemonSummary(row.pokemonId);
        const joke = await getJokeForTypes(pokemon.types).catch(() => null);
        return {
          pokemon: { ...pokemon, displayName: `${nameFor(pokemon.id)} the ${pokemon.name}` },
          joke,
          regions: idToRegions.get(row.pokemonId) ?? [],
          likedAt: row.createdAt.toISOString(),
        };
      }),
    );
    res.json({ liked: items, regionTotals, regionIds });
  }),
);

choicesRouter.delete(
  '/liked/:pokemonId',
  asyncHandler(async (req, res) => {
    const pokemonId = Number.parseInt(req.params.pokemonId ?? '', 10);
    if (!Number.isFinite(pokemonId) || pokemonId <= 0) {
      throw notFound('INVALID_POKEMON_ID', 'Invalid Pokémon id');
    }
    const result = await prisma.pokemonChoice.deleteMany({
      where: { userId: req.user!.id, pokemonId, choice: 'like' },
    });
    if (result.count === 0) {
      throw notFound('NOT_LIKED', 'That Pokémon is not in your liked list');
    }
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------------

/**
 * Hydrate a list of achievement IDs to the same shape `/api/achievements`
 * returns, so the client can show the unlock toast without a second
 * round-trip. Dynamic IDs are reconstructed from their structured pieces.
 */
function hydrateAchievements(ids: string[]): UnlockedAchievement[] {
  if (ids.length === 0) return [];
  // Build a lookup of static defs and dynamic defs reconstructed from the id.
  const byId = new Map<string, AchievementDef>();
  for (const def of STATIC_ACHIEVEMENTS) byId.set(def.id, def);

  for (const id of ids) {
    if (byId.has(id)) continue;
    if (id.startsWith('region-complete:')) {
      const region = id.split(':')[1] ?? '';
      const [def] = dynamicAchievementsFor([region], []);
      if (def) byId.set(def.id, def);
    } else if (id.startsWith('type-complete:')) {
      const type = id.split(':')[1] ?? '';
      const dyn = dynamicAchievementsFor([], [type]);
      const def = dyn.find((d) => d.id === id);
      if (def) byId.set(def.id, def);
    }
  }

  return ids.flatMap((id) => {
    const def = byId.get(id);
    if (!def) return [];
    return [
      {
        id: def.id,
        title: def.title,
        description: def.description,
        category: def.category,
        icon: def.icon,
        hidden: def.hidden ?? false,
      },
    ];
  });
}

interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  category: AchievementDef['category'];
  icon: string;
  hidden: boolean;
}
