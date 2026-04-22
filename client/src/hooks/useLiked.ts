import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { LikedItem } from '../lib/types';

const QUERY_KEY = ['liked'] as const;

interface LikedResponse {
  liked: LikedItem[];
  regionTotals: Record<string, number>;
  /** Pokédex IDs per selected region, for rendering missing placeholders. */
  regionIds: Record<string, number[]>;
}

export function useLiked() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.get<LikedResponse>('/api/choices/liked'),
  });
}

export function useUnlike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pokemonId: number) =>
      api.delete<{ ok: true }>(`/api/choices/liked/${pokemonId}`),
    onSuccess: (_data, pokemonId) => {
      queryClient.setQueryData<LikedResponse | undefined>(QUERY_KEY, (current) =>
        current
          ? { ...current, liked: current.liked.filter((item) => item.pokemon.id !== pokemonId) }
          : current,
      );
    },
  });
}
