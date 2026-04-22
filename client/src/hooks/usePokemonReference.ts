import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { NamedRef } from '../lib/types';

// Session-long cache; reloads on next page load to pick up server-side changes.
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
