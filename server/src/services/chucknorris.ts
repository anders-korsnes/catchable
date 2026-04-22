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

// Log one example per endpoint shape to keep the dev console readable.
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
    1000 * 60 * 60, // 1h
  );
  return cached;
}

/**
 * Pick a joke category for a Pokémon's types. Returns null when no mapping
 * applies (caller should use the random endpoint).
 * Takes the category list explicitly so it's testable without network calls.
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

  // Fallback: random joke, then a static placeholder if the API is down.
  const random = await fetchJson('/jokes/random', jokeSchema);
  if (random) return { id: random.id, value: random.value, category: null };

  return {
    id: 'fallback',
    value: 'Chuck Norris ran out of jokes. (Just kidding — he never does.)',
    category: null,
  };
}
