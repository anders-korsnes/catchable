// SQLite (via Prisma) has no JSON column type. List-valued preferences
// (regions, types) are stored as comma-separated strings — encoding lives here.

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
  // All tiers selected collapses to "" (treated as no filter by the deck loader).
  if (kept.length === ALL_DIFFICULTIES.length) return '';
  return kept.join(',');
}

export function decodeDifficulties(stored: string): Difficulty[] {
  if (!stored) return [];
  const valid = new Set<string>(ALL_DIFFICULTIES);
  return stored.split(',').filter((v): v is Difficulty => valid.has(v));
}
