import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NamedRef } from '../lib/types';

// Cache for the session but allow a refresh on next page load so server-side
// changes (e.g. filtering out empty regions) are eventually picked up.
const PERMANENT_CACHE_OPTIONS = { staleTime: 1000 * 60 * 30, gcTime: Infinity };

export function useRegions() {
  return useQuery({
    queryKey: ['ref', 'regions'],
    queryFn: () => api.get<{ regions: NamedRef[] }>('/api/pokemon/regions').then((r) => r.regions),
    ...PERMANENT_CACHE_OPTIONS,
  });
}

export function useTypes() {
  return useQuery({
    queryKey: ['ref', 'types'],
    queryFn: () => api.get<{ types: NamedRef[] }>('/api/pokemon/types').then((r) => r.types),
    ...PERMANENT_CACHE_OPTIONS,
  });
}
