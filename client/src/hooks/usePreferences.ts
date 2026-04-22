import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Difficulty, Preferences } from '../lib/types';

export interface SavePreferencesInput {
  regions: string[];
  types: string[];
  difficulties?: Difficulty[];
}

const QUERY_KEY = ['preferences'] as const;

export function usePreferences() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      api
        .get<{ preferences: Preferences | null }>('/api/preferences')
        .then((r) => r.preferences),
  });
}

export function useSavePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SavePreferencesInput) =>
      api.put<{ preferences: Preferences }>('/api/preferences', input).then((r) => r.preferences),
    onSuccess: (preferences) => {
      queryClient.setQueryData(QUERY_KEY, preferences);
      // Invalidate so the next read refetches.
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // Filter change invalidates the deck.
      queryClient.invalidateQueries({ queryKey: ['deck'] });
    },
  });
}
