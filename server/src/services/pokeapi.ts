import { z } from 'zod';
import { getCached } from '../lib/cache.js';
import { upstream } from '../lib/errors.js';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// --- Schemas -----------------------------------------------------------------
// Only validates fields the app uses. .passthrough() so upstream additions don't break parsing.

const namedRefSchema = z.object({ name: z.string(), url: z.string().url() });

const regionListSchema = z.object({
  results: z.array(namedRefSchema),
});

const typeListSchema = z.object({
  results: z.array(namedRefSchema),
});

const regionDetailSchema = z.object({
  name: z.string(),
  // /region/{name} no longer exposes pokemon_species directly; species live under linked pokedexes.
  pokedexes: z.array(namedRefSchema),
});

const pokedexDetailSchema = z.object({
  name: z.string(),
  pokemon_entries: z.array(
    z.object({
      pokemon_species: namedRefSchema,
    }),
  ),
});

const speciesSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    varieties: z.array(
      z.object({
        is_default: z.boolean(),
        pokemon: namedRefSchema,
      }),
    ),
  })
  .passthrough();

const pokemonSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    height: z.number(),
    weight: z.number(),
    base_experience: z.number().nullable().optional(),
    sprites: z
      .object({
        front_default: z.string().nullable().optional(),
        other: z
          .object({
            'official-artwork': z
              .object({ front_default: z.string().nullable().optional() })
              .optional(),
          })
          .optional(),
      })
      .passthrough(),
    types: z.array(z.object({ type: namedRefSchema })),
    stats: z.array(
      z.object({
        base_stat: z.number().int(),
        stat: namedRefSchema,
      }),
    ),
    moves: z.array(
      z.object({
        move: namedRefSchema,
      }),
    ),
  })
  .passthrough();

// --- Public types ------------------------------------------------------------

export interface NamedRef {
  name: string;
}

export interface PokemonSummary {
  id: number;
  name: string;
  types: string[];
  height: number;
  weight: number;
  baseExperience: number | null;
  hp: number | null;
  moves: string[];
  imageUrl: string | null;
}

// --- Fetching ----------------------------------------------------------------

async function fetchJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const url = `${POKEAPI_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw upstream('POKEAPI_UNREACHABLE', `Could not reach PokéAPI: ${(err as Error).message}`);
  }
  if (!res.ok) {
    throw upstream('POKEAPI_BAD_STATUS', `PokéAPI returned ${res.status} for ${path}`);
  }
  const json = await res.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw upstream('POKEAPI_BAD_RESPONSE', `PokéAPI returned an unexpected shape for ${path}`);
  }
  return parsed.data;
}

/** Raw unprocessed PokéAPI JSON for a single Pokémon. Used by the deck route for logging. */
export async function getRawPokemonData(idOrName: number | string): Promise<unknown> {
  const url = `${POKEAPI_BASE}/pokemon/${idOrName}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

// --- Region & type lists ----------------------------------------------------

export async function listRegions(): Promise<NamedRef[]> {
  const data = await getCached('regions', () => fetchJson('/region?limit=100', regionListSchema));
  const allNames = data.results.map((r) => r.name);

  // Filter out regions with no Pokémon (e.g. "orre"). loadRegionSpecies is cached.
  const withPokemon = await Promise.all(
    allNames.map(async (name) => {
      try {
        const species = await loadRegionSpecies(name);
        return species.length > 0 ? { name } : null;
      } catch {
        return null;
      }
    }),
  );

  return withPokemon.filter((r): r is NamedRef => r !== null);
}

export async function listTypes(): Promise<NamedRef[]> {
  const data = await getCached('types', () => fetchJson('/type?limit=100', typeListSchema));
  // Drop "unknown" and "shadow" — not standard playable types.
  return data.results
    .map((t) => ({ name: t.name }))
    .filter((t) => t.name !== 'unknown' && t.name !== 'shadow');
}

// --- Species lookup ---------------------------------------------------------

interface SpeciesIndexEntry {
  id: number;
  name: string;
  types: string[];
  baseExperience: number | null;
}

// Region → species index, built on first use and cached for the process lifetime.
async function loadRegionSpecies(region: string): Promise<SpeciesIndexEntry[]> {
  return getCached(`region:${region}:species`, async () => {
    const detail = await fetchJson(`/region/${region}`, regionDetailSchema);
    // A region can link to multiple pokedexes (e.g. Alola's island + combined dexes);
    // merge and dedupe across all of them.
    const speciesNameSet = new Set<string>();
    for (const dex of detail.pokedexes) {
      try {
        const pokedex = await getCached(`pokedex:${dex.name}`, () =>
          fetchJson(`/pokedex/${dex.name}`, pokedexDetailSchema),
        );
        for (const entry of pokedex.pokemon_entries) {
          speciesNameSet.add(entry.pokemon_species.name);
        }
      } catch {
        // Skip a failing pokedex rather than failing the whole region.
      }
    }
    const speciesNames = [...speciesNameSet];
    const out: SpeciesIndexEntry[] = [];
    const batchSize = 25;
    for (let i = 0; i < speciesNames.length; i += batchSize) {
      const batch = speciesNames.slice(i, i + batchSize);
      const resolved = await Promise.all(
        batch.map(async (name) => {
          try {
            const species = await getCached(`species:${name}`, () =>
              fetchJson(`/pokemon-species/${name}`, speciesSchema),
            );
            const variety =
              species.varieties.find((v) => v.is_default) ?? species.varieties[0] ?? null;
            if (!variety) return null;
            const pokemon = await getCached(`pokemon:${variety.pokemon.name}`, () =>
              fetchJson(`/pokemon/${variety.pokemon.name}`, pokemonSchema),
            );
            return {
              id: pokemon.id,
              name: pokemon.name,
              types: pokemon.types.map((t) => t.type.name),
              baseExperience: pokemon.base_experience ?? null,
            } satisfies SpeciesIndexEntry;
          } catch {
            // Obscure species occasionally 404 from PokéAPI — skip them.
            return null;
          }
        }),
      );
      for (const entry of resolved) if (entry) out.push(entry);
    }
    out.sort((a, b) => a.id - b.id);
    return out;
  });
}

export async function listSpeciesInRegionByType(
  region: string,
  types: string[],
): Promise<SpeciesIndexEntry[]> {
  const all = await loadRegionSpecies(region);
  if (types.length === 0) return all;
  const wanted = new Set(types.map((t) => t.toLowerCase()));
  return all.filter((entry) => entry.types.some((t) => wanted.has(t)));
}

export async function getPokemonSummary(idOrName: number | string): Promise<PokemonSummary> {
  const key = `pokemon:${idOrName}`;
  const pokemon = await getCached(key, () => fetchJson(`/pokemon/${idOrName}`, pokemonSchema));
  const artwork = pokemon.sprites.other?.['official-artwork']?.front_default;
  const hp = pokemon.stats.find((s) => s.stat.name === 'hp')?.base_stat ?? null;
  // First 3 moves (PokéAPI returns them alphabetically sorted).
  const moves = pokemon.moves.slice(0, 3).map((m) => m.move.name);
  return {
    id: pokemon.id,
    name: pokemon.name,
    types: pokemon.types.map((t) => t.type.name),
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience: pokemon.base_experience ?? null,
    hp,
    moves,
    imageUrl: artwork ?? pokemon.sprites.front_default ?? null,
  };
}
