import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { requireAuth } from '../middleware/require-auth.js';
import {
  decodeDifficulties,
  decodeRegions,
  decodeTypes,
} from '../lib/preferences-store.js';
import { getDifficultyBucket } from '../lib/difficulty.js';
import { getPokemonSummary, getRawPokemonData, listSpeciesInRegionByType } from '../services/pokeapi.js';
import { getJokeForTypes } from '../services/chucknorris.js';
import { nameFor } from '../lib/human-names.js';
import { badRequest } from '../lib/errors.js';
import { countRemaining, pickNextCandidate } from '../lib/deck-filter.js';

export const deckRouter = Router();

deckRouter.use(requireAuth);

// Pokémon that fled from the catch minigame stay out of the deck for this
// long, after which they re-enter the candidate pool.
const FLED_COOLDOWN_MS = 5 * 60 * 1000;

deckRouter.get(
  '/next',
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    const pref = await prisma.userPreference.findUnique({ where: { userId } });
    if (!pref) {
      throw badRequest('NO_PREFERENCES', 'Set your regions and types in Settings first');
    }
    const regions = decodeRegions(pref.regions);
    const types = decodeTypes(pref.types);
    const difficulties = decodeDifficulties(pref.difficulties);

    // Pull candidate species lists from PokéAPI for every selected region
    // (cached) plus the user's already-decided pokemon from the DB. Then merge
    // the regional rosters (deduped by species id, preserving region order)
    // and find the first candidate the user hasn't seen.
    // 'fled' pokemon are excluded for FLED_COOLDOWN_MS; everything else
    // (likes/dislikes) is excluded forever.
    const cooldownStart = new Date(Date.now() - FLED_COOLDOWN_MS);
    const [perRegion, decided] = await Promise.all([
      Promise.all(regions.map((r) => listSpeciesInRegionByType(r, types))),
      prisma.pokemonChoice.findMany({
        where: {
          userId,
          OR: [
            { choice: { in: ['like', 'dislike'] } },
            { choice: 'fled', createdAt: { gt: cooldownStart } },
          ],
        },
        select: { pokemonId: true },
      }),
    ]);

    const seen = new Set<number>();
    const candidates: {
      id: number;
      name: string;
      types: string[];
      baseExperience: number | null;
    }[] = [];
    const difficultyFilter = new Set(difficulties);
    for (const list of perRegion) {
      for (const entry of list) {
        if (seen.has(entry.id)) continue;
        seen.add(entry.id);
        if (
          difficultyFilter.size > 0 &&
          !difficultyFilter.has(getDifficultyBucket(entry.baseExperience))
        ) {
          continue;
        }
        candidates.push(entry);
      }
    }

    // Fisher-Yates shuffle so the deck order is completely random each time.
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    const decidedIds = decided.map((d) => d.pokemonId);
    const next = pickNextCandidate(candidates, decidedIds);

    if (!next) {
      res.json({ pokemon: null, remaining: 0 });
      return;
    }

    const remaining = countRemaining(candidates, decidedIds);

    const [summary, joke] = await Promise.all([
      getPokemonSummary(next.id),
      getJokeForTypes(next.types),
    ]);

    // Log the full raw PokéAPI data for the Pokémon being served (fire & forget).
    getRawPokemonData(next.id).then((raw) => {
      if (raw) {
        console.log(`\n[deck] Raw PokéAPI data for #${next.id} (${next.name}):`);
        console.log(JSON.stringify(raw, null, 2));
        console.log(`[deck] ─── end #${next.id} ───\n`);
      }
    }).catch(() => {});

    res.json({
      pokemon: {
        ...summary,
        displayName: `${nameFor(summary.id)} the ${summary.name}`,
      },
      joke,
      remaining,
    });
  }),
);
