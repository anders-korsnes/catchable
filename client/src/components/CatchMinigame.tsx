import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PokemonSummary } from '../lib/types';
import { getDifficultyLabel } from '../lib/catch-difficulty';
import { pickMinigame } from '../lib/minigame-picker';
import { RingMinigame } from './minigames/RingMinigame';
import { PowerBarMinigame } from './minigames/PowerBarMinigame';
import { BullseyeMinigame } from './minigames/BullseyeMinigame';
import { PendulumMinigame } from './minigames/PendulumMinigame';
import type { CatchResult, MinigameKind } from './minigames/types';

export type { CatchResult } from './minigames/types';

interface Props {
  pokemon: PokemonSummary;
  /** Fired exactly once when the round resolves: 'caught' or 'fled'. */
  onResult: (result: CatchResult) => void;
  /** Player chose to bail before throwing — counts as a flee. */
  onGiveUp: () => void;
}

/**
 * "Wild encounter" overlay. Picks a minigame variant from the Pokémon's
 * primary type (`pickMinigame`) and renders it inside a shared frame
 * containing the WILD ENCOUNTER header (name + difficulty) and the
 * "Run away" footer.
 *
 * Each minigame component is responsible for its own throw button + result
 * feedback; this wrapper only owns the surrounding chrome.
 */
export function CatchMinigame({ pokemon, onResult, onGiveUp }: Props) {
  // Pick once on mount so parent re-renders (e.g. achievement toast
  // dismiss) never swap the minigame mid-game.
  const [kind] = useState<MinigameKind>(() => pickMinigame(pokemon.types));
  const difficultyLabel = getDifficultyLabel(pokemon.baseExperience);

  return (
    <motion.div
      role="dialog"
      aria-label={`Catch ${pokemon.name}`}
      className="absolute inset-0 z-30 flex flex-col items-center overflow-hidden bg-bg/95 px-4 pb-3 pt-3 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex flex-none flex-col items-center gap-1">
        <p className="pixel-text text-[9px] tracking-[0.3em] text-ink-muted">WILD ENCOUNTER</p>
        <h2 className="pixel-text text-sm capitalize text-ink">{pokemon.name}</h2>
        <p className="text-[10px] uppercase tracking-wider text-ink-muted">
          difficulty: <span className="font-semibold text-ink">{difficultyLabel}</span>
        </p>
        <p className="text-[10px] text-ink-muted">
          {minigameTagline(kind)} · One chance — make it count.
        </p>
      </div>

      <div className="my-2 flex flex-1 flex-col items-center justify-center">
        {renderMinigame(kind, pokemon, onResult)}
      </div>

      <div className="flex flex-none items-center gap-3 text-[11px] text-ink-muted">
        <button
          type="button"
          onClick={onGiveUp}
          className="focus-ring rounded-full border border-line px-3 py-1 font-semibold text-ink-muted hover:bg-bg"
        >
          Run away
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake { animation: shake 220ms ease-in-out; }
      `}</style>
    </motion.div>
  );
}

function renderMinigame(
  kind: MinigameKind,
  pokemon: PokemonSummary,
  onResult: (r: CatchResult) => void,
) {
  switch (kind) {
    case 'power-bar':
      return <PowerBarMinigame pokemon={pokemon} onResult={onResult} />;
    case 'bullseye':
      return <BullseyeMinigame pokemon={pokemon} onResult={onResult} />;
    case 'pendulum':
      return <PendulumMinigame pokemon={pokemon} onResult={onResult} />;
    case 'ring':
    default:
      return <RingMinigame pokemon={pokemon} onResult={onResult} />;
  }
}

function minigameTagline(kind: MinigameKind): string {
  switch (kind) {
    case 'power-bar':
      return 'Charge & throw';
    case 'bullseye':
      return 'Aim for the bullseye';
    case 'pendulum':
      return 'Time the swing';
    case 'ring':
    default:
      return 'Time the spin';
  }
}
