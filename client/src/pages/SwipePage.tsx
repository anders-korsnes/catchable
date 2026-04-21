import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useAnimate } from 'framer-motion';
import { useDeck } from '../hooks/useDeck';
import { usePreferences } from '../hooks/usePreferences';
import { useAuth } from '../hooks/useAuth';
import { PokemonCard } from '../components/PokemonCard';
import { CatchMinigame } from '../components/CatchMinigame';
import { SignInPrompt } from '../components/SignInPrompt';
import { AchievementToasts } from '../components/AchievementToasts';
import type { Joke, PokemonSummary, UnlockedAchievement } from '../lib/types';

type SwipeDirection = 'left' | 'right' | null;

/**
 * Tracks what stage the player is in after winning the catch minigame:
 *
 *   'reveal-pending' — the Pokémon is caught but the joke is still hidden
 *                      behind a "REVEAL JOKE" button.
 *   'revealed'       — the joke is visible; the player can now store the
 *                      Pokémon in their Pokédex.
 *
 * The catch is recorded server-side as soon as the player wins the minigame,
 * so navigating away mid-reveal still keeps the catch and any achievements.
 */
type PostCatchStage = 'reveal-pending' | 'revealed';

const SWIPE_EXIT_DURATION_MS = 700;
const FLED_MESSAGE_DURATION_MS = 200;
const TOAST_DISMISS_MS = 4500;

export function SwipePage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <CenteredMessage>Loading…</CenteredMessage>;
  }

  if (!user) {
    return (
      <SignInPrompt
        title="READY TO SWIPE?"
        body="The deck is waiting. Sign in or create a trainer account to start catching Pokémon."
        redirectTo="/"
      />
    );
  }

  return <SwipeDeckView />;
}

function SwipeDeckView() {
  const { data: prefs, isLoading: prefsLoading } = usePreferences();
  const [toasts, setToasts] = useState<UnlockedAchievement[]>([]);

  const handleAchievements = useCallback((items: UnlockedAchievement[]) => {
    setToasts((prev) => {
      const seen = new Set(prev.map((a) => a.id));
      const merged = [...prev, ...items.filter((a) => !seen.has(a.id))];
      return merged.slice(-3);
    });
    for (const item of items) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((a) => a.id !== item.id));
      }, TOAST_DISMISS_MS);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const { current, loading, error, decide, reload } = useDeck({
    enabled: !!prefs,
    onAchievementsUnlocked: handleAchievements,
  });
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [minigameOpen, setMinigameOpen] = useState(false);
  const [postCatchStage, setPostCatchStage] = useState<PostCatchStage | null>(null);
  // Snapshot of the just-caught Pokémon so the reveal/store stage keeps
  // showing it while `current` advances to the next deck entry in the background.
  const [caughtCard, setCaughtCard] = useState<{ pokemon: PokemonSummary; joke: Joke | undefined } | null>(null);
  const [fledMessage, setFledMessage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  // Ref for the caught-card wrapper — used by the store animation.
  const [caughtCardScope, animateCaughtCard] = useAnimate<HTMLDivElement>();
  // Prevents double-clicks or overlapping async actions.
  const isProcessingRef = useRef(false);

  // Read through a ref inside the card-change effect so the effect only
  // fires when the deck advances, not when `postCatchStage` toggles.
  const postCatchStageRef = useRef<PostCatchStage | null>(null);
  postCatchStageRef.current = postCatchStage;

  useEffect(() => {
    // Don't blow away the caught/reveal stage when `current` advances; the
    // catch flow owns its own teardown via handleStore().
    if (postCatchStageRef.current) return;
    setMinigameOpen(false);
    setFledMessage(null);
  }, [current?.pokemon?.id]);

  /** Right-swipe / "Catch" click → open the catch minigame. */
  const handleAttemptCatch = useCallback(() => {
    if (isProcessingRef.current || postCatchStage || !current?.pokemon) return;
    setMinigameOpen(true);
  }, [postCatchStage, current]);

  /** Left-swipe / "Pass" click → record dislike and slide the card off-screen. */
  const handlePass = useCallback(async () => {
    if (isProcessingRef.current || postCatchStage || !current?.pokemon) return;
    isProcessingRef.current = true;
    setSwipeDirection('left');
    const animationDone = new Promise<void>((resolve) =>
      setTimeout(resolve, SWIPE_EXIT_DURATION_MS),
    );
    const apiDone = decide('dislike');
    await Promise.all([animationDone, apiDone]);
    setSwipeDirection(null);
    isProcessingRef.current = false;
  }, [postCatchStage, current, decide]);

  const handleSwipe = useCallback(
    (choice: 'like' | 'dislike') => {
      if (choice === 'like') handleAttemptCatch();
      else void handlePass();
    },
    [handleAttemptCatch, handlePass],
  );

  /**
   * Minigame win. Records the catch immediately so achievements/server state
   * stay correct, then enters 'reveal-pending' so the player can tap
   * REVEAL JOKE on their own time.
   */
  const handleCatchSuccess = useCallback(() => {
    if (!current?.pokemon) return;
    setMinigameOpen(false);
    setCaughtCard({ pokemon: current.pokemon, joke: current.joke });
    setPostCatchStage('reveal-pending');
    // Records the catch and (in the background) loads the next card. The
    // caught snapshot above keeps the UI showing this Pokémon until the
    // player taps "Store in Pokédex".
    void decide('like');
  }, [current, decide]);

  const handleRevealJoke = useCallback(() => {
    setPostCatchStage('revealed');
  }, []);

  /**
   * Player tapped "Store in Pokédex". The card shrinks into a Poké-Ball-sized
   * circle and flies down to the Dex tab, then state clears so the next card appears.
   */
  const handleStore = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const el = caughtCardScope.current;
    const tabEl = document.querySelector('#liked-tab-target') as HTMLElement | null;

    if (el && tabEl) {
      const cardRect = el.getBoundingClientRect();
      const tabRect = tabEl.getBoundingClientRect();
      // How far to translate the card center so it lands on the tab center.
      const dx = tabRect.left + tabRect.width / 2 - (cardRect.left + cardRect.width / 2);
      const dy = tabRect.top + tabRect.height / 2 - (cardRect.top + cardRect.height / 2);

      // Phase 1: shrink into a small circle (≈Poké Ball size).
      await animateCaughtCard(
        el,
        { scale: 0.12, borderRadius: '50%', opacity: 0.85 },
        { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
      );
      // Phase 2: fly to the Dex tab and fade out.
      await animateCaughtCard(
        el,
        { x: dx, y: dy, scale: 0.06, opacity: 0 },
        { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      );
    }

    setPostCatchStage(null);
    setCaughtCard(null);
    isProcessingRef.current = false;
  }, [caughtCardScope, animateCaughtCard]);

  /** Failed catch → record 'fled' (5-min cooldown) and show the fled message. */
  const handlePokemonFled = useCallback(async () => {
    if (isProcessingRef.current || !current?.pokemon) return;
    isProcessingRef.current = true;
    const name = capitalize(current.pokemon.name);
    setMinigameOpen(false);
    setFledMessage(`${name} broke free and fled into the tall grass!`);
    const animationDone = new Promise<void>((resolve) =>
      setTimeout(resolve, FLED_MESSAGE_DURATION_MS),
    );
    const apiDone = decide('fled');
    await Promise.all([animationDone, apiDone]);
    setFledMessage(null);
    isProcessingRef.current = false;
  }, [current, decide]);

  const handleMinigameResult = useCallback(
    (result: 'caught' | 'fled') => {
      if (result === 'caught') handleCatchSuccess();
      else void handlePokemonFled();
    },
    [handleCatchSuccess, handlePokemonFled],
  );

  /** Player gives up on the minigame → counts as a flee (with cooldown). */
  const handleGiveUp = useCallback(() => {
    setMinigameOpen(false);
    void handlePokemonFled();
  }, [handlePokemonFled]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (minigameOpen || postCatchStage) return;
      if (e.key === 'ArrowRight') handleAttemptCatch();
      else if (e.key === 'ArrowLeft') void handlePass();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleAttemptCatch, handlePass, minigameOpen, postCatchStage]);

  if (prefsLoading) {
    return <CenteredMessage>Loading your deck…</CenteredMessage>;
  }

  if (!prefs) {
    return (
      <DeckEmptyCard
        title="Welcome, trainer!"
        body="Pick at least one region and a few types so we know what to put in your deck."
        actionLabel="Start setup"
        actionTo="/onboarding"
      />
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="max-w-sm rounded-md border border-pokered/30 bg-pokered/5 p-4 text-center text-sm text-pokered">
          <p className="font-semibold">No signal.</p>
          <p className="mt-1 text-pokered/80">{error}</p>
          <button
            onClick={reload}
            className="focus-ring mt-3 rounded-md border border-pokered px-3 py-1.5 font-medium hover:bg-pokered/10"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (loading && !current) {
    return <SkeletonCard />;
  }

  if (current && current.pokemon === null) {
    return (
      <DeckEmptyCard
        title="That's everyone!"
        body="No more Pokémon match your filters. Adjust your regions or types to keep swiping."
        actionLabel="Edit preferences"
        actionTo="/settings"
      />
    );
  }

  const isSwiping = !!swipeDirection;
  const isShowingFledMessage = !!fledMessage;
  // While the caught snapshot is up, hide the underlying live card.
  const isShowingCaughtCard = !!postCatchStage && !!caughtCard;
  const isLiveCardVisible =
    !isSwiping && !isShowingFledMessage && !isShowingCaughtCard && !!current?.pokemon;

  return (
    <section
      className="relative flex h-full min-h-0 flex-col items-center overflow-hidden px-3 pb-3 pt-2"
      aria-live="polite"
    >
      <AchievementToasts achievements={toasts} onDismiss={dismissToast} />

      <p className="flex-none text-[11px] uppercase tracking-wider text-ink-muted">
        {current?.remaining ?? 0} left in deck
      </p>

      <div className="relative my-2 flex w-full min-h-0 flex-1 items-center justify-center">
        {isLiveCardVisible && current?.pokemon && (
          <motion.div
            key={current.pokemon.id}
            className="flex h-full w-full items-center justify-center"
            initial={{ y: 16, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
          >
            <PokemonCard
              ref={cardRef}
              pokemon={current.pokemon}
              joke={current.joke}
              onSwipe={handleSwipe}
              interactive={!swipeDirection && !minigameOpen}
              jokeRevealed={false}
            />
          </motion.div>
        )}

        {isShowingCaughtCard && caughtCard && (
          <motion.div
            ref={caughtCardScope}
            key={`caught-${caughtCard.pokemon.id}`}
            className="flex h-full w-full items-center justify-center overflow-hidden"
            initial={{ y: 8, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <PokemonCard
              pokemon={caughtCard.pokemon}
              joke={caughtCard.joke}
              onSwipe={() => {}}
              interactive={false}
              jokeRevealed={postCatchStage === 'revealed'}
              onRevealJoke={
                postCatchStage === 'reveal-pending' ? handleRevealJoke : undefined
              }
            />
          </motion.div>
        )}

        <AnimatePresence>
          {isShowingFledMessage && (
            <motion.div
              key="fled"
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {minigameOpen && current?.pokemon && (
            <CatchMinigame
              key={`mini-${current.pokemon.id}`}
              pokemon={current.pokemon}
              onResult={handleMinigameResult}
              onGiveUp={handleGiveUp}
            />
          )}
        </AnimatePresence>
      </div>

      {isShowingCaughtCard ? (
        <div className="flex flex-none items-center justify-center">
          <button
            onClick={() => void handleStore()}
            aria-label="Store in Pokédex"
            className="focus-ring pixel-text flex h-14 items-center gap-2 rounded-full bg-like px-5 text-xs text-white shadow-device transition active:translate-y-px active:scale-95 disabled:opacity-50"
          >
            <CatchPokeballIcon />
            STORE IN POKÉDEX
          </button>
        </div>
      ) : (
        <div
          className={`flex flex-none items-center gap-5 transition-opacity duration-200 ${
            isSwiping || minigameOpen || isShowingFledMessage
              ? 'pointer-events-none opacity-0'
              : 'opacity-100'
          }`}
        >
          <button
            onClick={() => void handlePass()}
            disabled={loading || isSwiping || minigameOpen || isShowingFledMessage}
            aria-label="Pass (left arrow)"
            className="focus-ring pixel-text flex h-14 items-center gap-2 rounded-full border-2 border-line bg-surface px-5 text-xs text-dislike shadow-device transition active:translate-y-px active:scale-95 disabled:opacity-50"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
              <path
                d="M4 4 L16 16 M16 4 L4 16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            SKIP
          </button>
          <button
            onClick={handleAttemptCatch}
            disabled={loading || isSwiping || minigameOpen || isShowingFledMessage}
            aria-label="Catch (right arrow)"
            className="focus-ring pixel-text flex h-14 items-center gap-2 rounded-full bg-like px-5 text-xs text-white shadow-device transition active:translate-y-px active:scale-95 disabled:opacity-50"
          >
            <CatchPokeballIcon />
            CATCH
          </button>
        </div>
      )}

    </section>
  );
}

function capitalize(name: string) {
  if (!name) return name;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function CatchPokeballIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
      <path d="M2 12 A10 10 0 0 1 22 12 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="1.6" />
      <line x1="2" y1="12" x2="9" y2="12" stroke="#0F172A" strokeWidth="1.6" />
      <line x1="15" y1="12" x2="22" y2="12" stroke="#0F172A" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
    </svg>
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-ink-muted">
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="flex h-full w-full max-w-[380px] animate-pulse flex-col rounded-device bg-line/60 p-4">
        <div className="min-h-0 flex-1 rounded-screen bg-line" />
        <div className="mt-3 h-8 flex-none rounded-md bg-white/70" />
        <div className="mt-2 h-20 flex-none rounded-md bg-white/70" />
        <div className="mt-2 h-14 flex-none rounded-md bg-white/70" />
      </div>
    </div>
  );
}

interface DeckEmptyCardProps {
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}

function DeckEmptyCard({ title, body, actionLabel, actionTo }: DeckEmptyCardProps) {
  return (
    <section className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-xs rounded-device border border-line bg-surface p-6 text-center shadow-sm">
        <p className="pixel-text text-[10px] text-pokered">NO SIGNAL</p>
        <h2 className="mt-2 text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{body}</p>
        <Link
          to={actionTo}
          className="focus-ring mt-4 inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-invert"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
