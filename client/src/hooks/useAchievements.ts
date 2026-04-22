import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AchievementsResponse } from '../lib/types';

/** Fetches the achievement list. Invalidate via queryKey ['achievements']. */
export function useAchievements(enabled = true) {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get<AchievementsResponse>('/api/achievements'),
    enabled,
    staleTime: 30_000,
  });
}
