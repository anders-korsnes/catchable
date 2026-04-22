import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import type { ChoiceResponse, DeckResponse, UnlockedAchievement } from '../lib/types';

export type Choice = 'like' | 'dislike' | 'fled';

interface DeckState {
  current: DeckResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseDeckOptions {
  /** When false, stays idle. Useful while prefs load. */
  enabled?: boolean;
  /** Fired when a choice unlocks achievements. */
  onAchievementsUnlocked?: (achievements: UnlockedAchievement[]) => void;
}

/**
 * Swipe deck state. `decide` accepts 'like' | 'dislike' | 'fled';
 * the server treats 'fled' as a 5-minute cooldown exclusion.
 */
export function useDeck({ enabled = true, onAchievementsUnlocked }: UseDeckOptions = {}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DeckState>({ current: null, loading: enabled, error: null });
  const requestIdRef = useRef(0);

  const loadNext = useCallback(async () => {
    const id = ++requestIdRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const next = await api.get<DeckResponse>('/api/deck/next');
      if (id !== requestIdRef.current) return;
      setState({ current: next, loading: false, error: null });
    } catch (err) {
      if (id !== requestIdRef.current) return;
      const message = err instanceof ApiError ? err.message : 'Could not load the next card.';
      setState({ current: null, loading: false, error: message });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void loadNext();
  }, [enabled, loadNext]);

  const decide = useCallback(
    async (choice: Choice) => {
      const pokemon = state.current?.pokemon;
      if (!pokemon) return;

      try {
        const response = await api.post<ChoiceResponse>('/api/choices', {
          pokemonId: pokemon.id,
          choice,
        });
        if (choice === 'like') {
          queryClient.invalidateQueries({ queryKey: ['liked'] });
        }
        if (response.newAchievements?.length) {
          // Refresh achievements page on next view.
          queryClient.invalidateQueries({ queryKey: ['achievements'] });
          onAchievementsUnlocked?.(response.newAchievements);
        }
        await loadNext();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Could not save your choice.';
        setState((s) => ({ ...s, error: message }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state.current read via closure.
    [state.current?.pokemon?.id, queryClient, loadNext, onAchievementsUnlocked],
  );

  return {
    current: state.current,
    loading: state.loading,
    error: state.error,
    decide,
    reload: loadNext,
  };
}
