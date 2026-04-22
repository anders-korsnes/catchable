// In-process cache keyed by URL with optional TTL.
interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export async function getCached<T>(
  key: string,
  load: () => Promise<T>,
  ttlMs = 1000 * 60 * 60 * 24, // 24h default
): Promise<T> {
  const hit = store.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) {
    return hit.value as T;
  }
  const value = await load();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function clearCache(): void {
  store.clear();
}
