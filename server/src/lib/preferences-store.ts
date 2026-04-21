// SQLite has no JSON column type via Prisma's SQLite provider, so we serialize
// list-valued preference fields (regions, types) as comma-separated strings.
// Centralized here so the encoding is consistent across routes.

function encodeList(values: string[]): string {
  return Array.from(
    new Set(values.map((v) => v.toLowerCase().trim()).filter(Boolean)),
  ).join(',');
}

function decodeList(stored: string): string[] {
  if (!stored) return [];
  return stored.split(',').filter(Boolean);
}

export const encodeTypes = encodeList;
export const decodeTypes = decodeList;
export const encodeRegions = encodeList;
export const decodeRegions = decodeList;

const ALL_DIFFICULTIES = ['easy', 'medium', 'hard', 'legendary'] as const;
type Difficulty = (typeof ALL_DIFFICULTIES)[number];

export function encodeDifficulties(values: string[]): string {
  const valid = new Set<string>(ALL_DIFFICULTIES);
  const kept = Array.from(
    new Set(values.map((v) => v.toLowerCase().trim()).filter((v) => valid.has(v))),
  );
  // If the user picked every tier, collapse to "" so the deck filter
  // treats it as "no filter" (same as not picking anything).
  if (kept.length === ALL_DIFFICULTIES.length) return '';
  return kept.join(',');
}

export function decodeDifficulties(stored: string): Difficulty[] {
  if (!stored) return [];
  const valid = new Set<string>(ALL_DIFFICULTIES);
  return stored.split(',').filter((v): v is Difficulty => valid.has(v));
}
