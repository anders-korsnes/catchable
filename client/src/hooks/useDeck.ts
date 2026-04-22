import { useCallback, useEffect, useState } from 'react';
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
  /** When false, the hook stays idle (won't fetch). Useful while prefs load. */
  enabled?: boolean;
  /** Fired with any achievements that unlocked as a side-effect of a choice.
   * Used by SwipePage to show toast notifications. */
  onAchievementsUnlocked?: (achievements: UnlockedAchievement[]) => void;
}

/**
 * Manages the swipe deck. We fan out two responsibilities:
 *  - `current`: the card on screen (or null when empty / not loaded)
 *  - `decide(choice)`: records the choice and advances to the next card
 *
 * `decide` accepts 'fled' in addition to 'like'/'dislike'; the server treats
 * 'fled' as a transient exclusion (5-minute cooldown).
 */
export function useDeck({ enabled = true, onAchievementsUnlocked }: UseDeckOptions = {}) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<DeckState>({ current: null, loading: enabled, error: null });

  const loadNext = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const next = await api.get<DeckResponse>('/api/deck/next');
      setState({ current: next, loading: false, error: null });
    } catch (err) {
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
          // Pulled fresh, so make sure the achievements page reflects the
          // new unlock state next time it's opened.
          queryClient.invalidateQueries({ queryKey: ['achievements'] });
          onAchievementsUnlocked?.(response.newAchievements);
        }
        await loadNext();
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Could not save your choice.';
        setState((s) => ({ ...s, error: message }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- state.current is read
    // through a closure; decide() should only re-create when its handlers change.
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
