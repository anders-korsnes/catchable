import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LikedItem } from '../lib/types';
import { TypeBadge } from './TypeBadge';
import {
  colorForType,
  darkerForType,
  environmentBackground,
  lighterForType,
} from '../lib/type-colors';
import { getDifficultyLabel } from '../lib/catch-difficulty';

interface Props {
  item: LikedItem;
  onClose: () => void;
  onRelease: () => void;
}

const formatHeight = (h: number) => `${(h / 10).toFixed(1)} m`;
const formatWeight = (w: number) => `${(w / 10).toFixed(1)} kg`;

const PATCH_BACKGROUND = `
  repeating-linear-gradient(
    -45deg,
    rgba(0, 0, 0, 0.055) 0px,
    rgba(0, 0, 0, 0.055) 5px,
    transparent 5px,
    transparent 13px
  ),
  #fef9c3
`;

export function PokedexEntryModal({ item, onClose, onRelease }: Props) {
  const { pokemon, joke, likedAt } = item;
  const primary = pokemon.types[0] ?? 'normal';
  const secondary = pokemon.types[1];
  const top = lighterForType(primary);
  const base = colorForType(primary);
  const border = darkerForType(primary);
  const env = environmentBackground(primary, secondary);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-label={`Pokédex entry: ${pokemon.displayName}`}
      aria-modal
      className="absolute inset-0 z-40 flex items-stretch justify-center overflow-y-auto bg-black/35 px-3 py-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.article
        layoutId={`pokedex-card-${pokemon.id}`}
        onClick={(e) => e.stopPropagation()}
        className="relative m-auto flex w-full max-w-[380px] flex-col overflow-hidden rounded-2xl border-[3px] shadow-device"
        style={{
          background: `linear-gradient(180deg, ${top} 0%, ${base} 55%, ${border} 100%)`,
          borderColor: border,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Pokédex entry"
          className="focus-ring absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-md ring-1 ring-ink/15 transition hover:bg-white/90 active:scale-95"
        >
          <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden>
            <path
              d="M4 4 L16 16 M16 4 L4 16"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {/* Header: POKÉDEX ENTRY label + #number + HP */}
        <header className="flex items-baseline justify-between px-4 pt-3 text-white">
          <div>
            <p className="pixel-text text-[9px] tracking-[0.3em] opacity-90">POKÉDEX ENTRY</p>
            <p className="font-mono text-[12px] font-semibold tracking-wider drop-shadow">
              #{String(pokemon.id).padStart(3, '0')}
            </p>
          </div>
          <div className="mr-10 flex items-baseline gap-1 drop-shadow">
            <span className="pixel-text text-[10px] text-white/80">HP</span>
            <span className="font-mono text-[18px] font-semibold text-white/90">
              {pokemon.hp ?? '—'}
            </span>
          </div>
        </header>

        {/* Image */}
        <div
          className="relative mx-3 mt-2 flex aspect-square items-center justify-center overflow-hidden rounded-screen border-2 border-white/35"
          style={{ background: env }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gb-dotmatrix bg-gb-dotmatrix opacity-[0.18] mix-blend-overlay"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-black/20"
          />
          {pokemon.imageUrl ? (
            <img
              src={pokemon.imageUrl}
              alt={pokemon.displayName}
              className="relative h-full w-full object-contain p-3 drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]"
            />
          ) : (
            <span className="pixel-text text-white/80">NO SIGNAL</span>
          )}
        </div>

        {/* Name + info card */}
        <div
          className="mx-3 mt-2 overflow-hidden rounded-screen border-2"
          style={{ borderColor: border }}
        >
          {/* Name header */}
          <div
            className="px-3 py-1.5"
            style={{ background: base, borderBottom: `2px solid ${border}` }}
          >
            <h2 className="pixel-text text-[13px] capitalize text-white drop-shadow">
              {pokemon.displayName}
            </h2>
          </div>

          {/* Type row */}
          <div
            className="flex items-center gap-2 bg-white/95 px-3 py-1.5"
            style={{ borderBottom: `2px solid ${border}` }}
          >
            <span className="text-[9px] font-semibold tracking-[0.2em] text-ink-muted">TYPE</span>
            <div className="flex flex-wrap gap-1">
              {pokemon.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
          </div>

          {/* Stats grid */}
          <dl className="grid grid-cols-3 divide-x-2 divide-dashed divide-ink/[0.12] bg-white/95">
            <Stat label="HEIGHT" value={formatHeight(pokemon.height)} />
            <Stat label="WEIGHT" value={formatWeight(pokemon.weight)} />
            <Stat label="LVL" value={String(pokemon.baseExperience ?? '—')} />
          </dl>

          {/* Details */}
          <div className="space-y-0.5 border-t-2 border-dashed border-ink/[0.12] bg-white/95 px-3 py-1.5 text-[11px]">
            <p className="text-ink-muted">
              <span className="font-semibold text-ink">Catch difficulty:</span>{' '}
              {getDifficultyLabel(pokemon.baseExperience)}
            </p>
            {pokemon.moves.length > 0 && (
              <p className="text-ink-muted">
                <span className="font-semibold text-ink">Moves:</span>{' '}
                <span className="capitalize">
                  {pokemon.moves.map((m) => m.replace(/-/g, ' ')).join(' · ')}
                </span>
              </p>
            )}
            <p className="text-ink-muted">
              <span className="font-semibold text-ink">Caught:</span>{' '}
              {new Date(likedAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Joke section — same amber stripe as the catch card, text already revealed */}
        {joke && (
          <div
            className="mx-3 mt-2 overflow-hidden rounded-md px-3 py-2"
            style={{ background: PATCH_BACKGROUND }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800/70">
              {joke.category ? `Joke · ${joke.category}` : 'Random joke'}
            </p>
            <p className="mt-0.5 max-h-[100px] overflow-y-auto text-[12px] leading-snug text-ink">
              {joke.value}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mx-3 mb-3 mt-2 flex">
          <button
            type="button"
            onClick={onRelease}
            className="focus-ring flex-1 rounded-lg border-2 border-pokered/40 bg-white py-2 text-[12px] font-semibold text-pokered shadow-sm transition hover:border-pokered"
          >
            Release
          </button>
        </div>
      </motion.article>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2">
      <dt className="text-[9px] font-semibold tracking-[0.2em] text-ink-muted">{label}</dt>
      <dd className="pixel-text text-[16px] uppercase text-ink">{value}</dd>
    </div>
  );
}
