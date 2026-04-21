import { z } from 'zod';
import { getCached } from '../lib/cache.js';
import { TYPE_TO_JOKE_CATEGORY } from '../config/type-joke-mapping.js';

const CHUCK_NORRIS_BASE = 'https://api.chucknorris.io';

const jokeSchema = z.object({
  id: z.string(),
  value: z.string(),
  categories: z.array(z.string()).optional(),
});

const categoriesSchema = z.array(z.string());

export interface Joke {
  id: string;
  value: string;
  category: string | null;
}

// Same one-example-per-shape logging trick used in pokeapi.ts so the joke
// payload structure is visible in the dev console without spamming.
const loggedShapes = new Set<string>();

function logResponse(path: string, json: unknown): void {
  const shape = path.split('?')[0];
  if (loggedShapes.has(shape)) {
    const keys =
      typeof json === 'object' && json !== null
        ? Object.keys(json as Record<string, unknown>).slice(0, 6).join(',')
        : '';
    console.log(`[chucknorris] ${path}  (keys: ${keys})`);
    return;
  }
  loggedShapes.add(shape);
  console.log(`\n[chucknorris] ${path}  ◄ first response of shape ${shape}`);
  console.log(JSON.stringify(json, null, 2));
  console.log(`[chucknorris] ─── end ${shape} ───\n`);
}

async function fetchJson<T>(path: string, schema: z.ZodType<T>): Promise<T | null> {
  try {
    const res = await fetch(`${CHUCK_NORRIS_BASE}${path}`);
    if (!res.ok) return null;
    const json = await res.json();
    logResponse(path, json);
    const parsed = schema.safeParse(json);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function getCategories(): Promise<string[]> {
  const cached = await getCached(
    'chuck:categories',
    async () => (await fetchJson('/jokes/categories', categoriesSchema)) ?? [],
    1000 * 60 * 60, // 1h — categories change very rarely but we don't want them stuck forever
  );
  return cached;
}

/**
 * Pick the joke category for a Pokémon's types. Returns null when no mapping
 * applies, signalling "use the random endpoint instead".
 *
 * Pure-ish: takes the available category list explicitly so the matcher can be
 * unit-tested without hitting the network. The route handler injects the live
 * category list via getJokeForTypes below.
 */
export function pickCategoryForTypes(
  pokemonTypes: string[],
  availableCategories: readonly string[],
): string | null {
  const available = new Set(availableCategories);
  for (const type of pokemonTypes) {
    const mapped = TYPE_TO_JOKE_CATEGORY[type.toLowerCase()];
    if (mapped && available.has(mapped)) {
      return mapped;
    }
  }
  return null;
}

export async function getJokeForTypes(pokemonTypes: string[]): Promise<Joke> {
  const categories = await getCategories();
  const category = pickCategoryForTypes(pokemonTypes, categories);

  if (category) {
    const joke = await fetchJson(`/jokes/random?category=${encodeURIComponent(category)}`, jokeSchema);
    if (joke) return { id: joke.id, value: joke.value, category };
  }

  // Fallback: random joke. If even this fails, return a static placeholder so the
  // user-facing card never breaks just because a joke API hiccupped.
  const random = await fetchJson('/jokes/random', jokeSchema);
  if (random) return { id: random.id, value: random.value, category: null };

  return {
    id: 'fallback',
    value: 'Chuck Norris ran out of jokes. (Just kidding — he never does.)',
    category: null,
  };
}
