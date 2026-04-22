// Extracted from the deck route so it can be unit-tested without the DB or PokéAPI.

interface Candidate {
  id: number;
}

export function pickNextCandidate<T extends Candidate>(
  candidates: readonly T[],
  decidedIds: Iterable<number>,
): T | null {
  const seen = new Set(decidedIds);
  for (const candidate of candidates) {
    if (!seen.has(candidate.id)) return candidate;
  }
  return null;
}

export function countRemaining(
  candidates: readonly Candidate[],
  decidedIds: Iterable<number>,
): number {
  const seen = new Set(decidedIds);
  let count = 0;
  for (const c of candidates) if (!seen.has(c.id)) count++;
  return count;
}
