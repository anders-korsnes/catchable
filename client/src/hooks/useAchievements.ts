import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AchievementsResponse } from '../lib/types';

/**
 * Fetches the full achievement list (locked + unlocked, with hidden ones
 * masked while still locked). Cached on the React-Query side so navigating
 * away and back is instant; mutations elsewhere bust the cache via
 * `invalidateQueries(['achievements'])`.
 */
export function useAchievements(enabled = true) {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: () => api.get<AchievementsResponse>('/api/achievements'),
    enabled,
    staleTime: 30_000,
  });
}
