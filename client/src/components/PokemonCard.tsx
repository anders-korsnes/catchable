import { forwardRef } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { TypeBadge } from './TypeBadge';
import type { Joke, PokemonSummary } from '../lib/types';
import {
  colorForType,
  darkerForType,
  environmentBackground,
  lighterForType,
} from '../lib/type-colors';

interface Props {
  pokemon: PokemonSummary;
  joke: Joke | undefined;
  onSwipe: (choice: 'like' | 'dislike') => void;
  interactive: boolean;
  jokeRevealed: boolean;
  onRevealJoke?: () => void;
}

const SWIPE_THRESHOLD = 110;

const formatHeight = (h: number) => `${(h / 10).toFixed(1)} m`;
const formatWeight = (w: number) => `${(w / 10).toFixed(1)} kg`;

// Amber striped background shared by the type row, locked patch, and peelable patch.
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

/**
 * The card uses a vertical flex layout where the image area is the *flex grow*
 * region. Every other section (top bar, name, stats, joke) has an intrinsic
 * height, so when the parent constrains the card's overall height the image
 * area shrinks first — keeping the card on a single screen without scroll.
 */
export const PokemonCard = forwardRef<HTMLDivElement, Props>(function PokemonCard(
  { pokemon, joke, onSwipe, interactive, jokeRevealed, onRevealJoke },
  ref,
) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const dislikeOpacity = useTransform(x, [-140, -40], [1, 0]);

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!interactive) return;
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe('like');
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe('dislike');
  };

  const primary = pokemon.types[0] ?? 'normal';
  const secondary = pokemon.types[1];
  const top = lighterForType(primary);
  const base = colorForType(primary);
  const border = darkerForType(primary);
  const shellStyle = {
    background: `linear-gradient(180deg, ${top} 0%, ${base} 55%, ${border} 100%)`,
    borderColor: border,
  };
  const environmentStyle = { background: environmentBackground(primary, secondary) };

  return (
    <motion.article
      ref={ref}
      drag={interactive ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      style={{ x, rotate, ...shellStyle }}
      className="relative flex h-full w-full max-w-[380px] cursor-grab select-none flex-col rounded-device border-[3px] p-3 text-white shadow-device active:cursor-grabbing"
      aria-label={`${pokemon.displayName}, ${pokemon.types.join(' and ')} type`}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="mb-2 flex flex-none items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="block h-4 w-4 rounded-full bg-action ring-2 ring-white/40" />
          <span aria-hidden className="block h-2 w-2 rounded-full bg-warn" />
          <span aria-hidden className="block h-2 w-2 rounded-full bg-like" />
        </div>

        {/* HP number (large) sits right next to the Pokédex number */}
        <div className="flex items-baseline gap-1.5">
          <span className="drop-shadow">
            <span className="pixel-text text-[10px] font-normal text-white/80">HP</span>{' '}
            <span className="font-mono text-[18px] font-semibold text-white/90">
              {pokemon.hp ?? '—'}
            </span>
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-wider text-white/85 drop-shadow">
            #{String(pokemon.id).padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* ── Pokémon image ───────────────────────────────────────────────── */}
      <div
        className="relative min-h-0 flex-1 overflow-hidden rounded-screen border-[3px] border-white/35"
        style={environmentStyle}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-[55%] bg-gradient-to-b from-transparent via-black/5 to-black/15"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gb-dotmatrix bg-gb-dotmatrix opacity-[0.18] mix-blend-overlay"
        />
        <div className="relative flex h-full w-full items-center justify-center p-2">
          {pokemon.imageUrl ? (
            <img
              src={pokemon.imageUrl}
              alt={pokemon.displayName}
              className="h-full w-full object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.35)]"
              draggable={false}
            />
          ) : (
            <span className="pixel-text text-white/80">NO SIGNAL</span>
          )}
        </div>

        <motion.div
          aria-hidden
          style={{ opacity: likeOpacity }}
          className="pointer-events-none absolute right-3 top-3 rounded-md border-2 border-like bg-white/95 px-2 py-1 text-xs font-bold text-like"
        >
          CATCH!
        </motion.div>
        <motion.div
          aria-hidden
          style={{ opacity: dislikeOpacity }}
          className="pointer-events-none absolute left-3 top-3 rounded-md border-2 border-dislike bg-white/95 px-2 py-1 text-xs font-bold text-dislike"
        >
          PASS
        </motion.div>
      </div>

      {/* ── Name + Stats (combined card) ────────────────────────────────── */}
      <div
        className="mt-2 flex-none overflow-hidden rounded-screen border-2 shadow-sm"
        style={{ borderColor: border }}
      >
        {/* Name header — solid type colour */}
        <div
          className="px-3 py-1.5"
          style={{
            background: base,
            borderBottom: `2px solid ${border}`,
          }}
        >
          <h2 className="pixel-text text-[18px] capitalize text-white drop-shadow">
            {pokemon.displayName}
          </h2>
        </div>

        {/* Type row */}
        <div
          className="flex items-center gap-2 bg-white/95 px-3 py-1.5"
          style={{ borderBottom: `2px solid ${border}` }}
        >
          <span className="text-[10px] font-bold tracking-[0.2em] text-ink-muted">TYPE</span>
          <div className="flex flex-wrap gap-1">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
        </div>

        {/* Height / Weight / LVL — three columns with dashed vertical dividers */}
        <dl className="grid grid-cols-3 divide-x-2 divide-dashed divide-ink/[0.12] bg-white/95">
          <Stat label="HEIGHT" value={formatHeight(pokemon.height)} />
          <Stat label="WEIGHT" value={formatWeight(pokemon.weight)} />
          <Stat label="LVL" value={String(pokemon.baseExperience ?? '—')} />
        </dl>

        {/* Moves */}
        {pokemon.moves.length > 0 && (
          <p className="bg-white/95 px-3 py-1.5 text-[11px]">
            <span className="font-semibold text-ink-muted">Moves:</span>
            <span className="pixel-text text-[10px] text-ink/90">
              {' '}
              {pokemon.moves.map((m) => m.replace(/-/g, ' ')).join(' · ')}
            </span>
          </p>
        )}
      </div>

      {/* ── Joke section ────────────────────────────────────────────────── */}
      {/*
       * The joke text is always rendered (establishing the section's height),
       * but stays invisible while the patch overlay is on top. This guarantees
       * the locked state and the peelable state have identical heights.
       *
       * Locked state   → patch visible, non-interactive
       * Peelable state → patch visible, clickable
       * Revealed state → patch exits via the peel animation, joke text shows
       */}
      <div className={`relative mt-1.5 flex-none overflow-hidden rounded-md bg-white/95 px-3 py-2 text-ink shadow-sm${jokeRevealed ? '' : ' h-[65px]'}`}>
        {/* Joke text — invisible until the patch peels away */}
        <div aria-hidden={!jokeRevealed} className={jokeRevealed ? '' : 'invisible'}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            {joke?.category ? `Joke · ${joke.category}` : 'Random joke'}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug">{joke?.value ?? 'Loading joke…'}</p>
        </div>

        {/* Patch overlay ─────────────────────────────────────────────────
         * Sits absolutely over the joke text. Both states (locked / peelable)
         * use the same stripe style so height is identical.
         *
         * On exit (when jokeRevealed flips to true), the patch pivots from its
         * top-left corner and sweeps to the right — like peeling a sticker.
         */}
        <AnimatePresence>
          {!jokeRevealed && (
            <motion.div
              key="joke-patch"
              className="absolute inset-0 rounded-xl border-2"
              style={{
                background: PATCH_BACKGROUND,
                // The peel fans out from the top-left corner.
                transformOrigin: 'top left',
              }}
              exit={{
                rotate: 22,
                x: '120%',
                y: '-8%',
                opacity: 0.2,
              }}
              transition={{ duration: 0.48, ease: [0.4, 0, 0.2, 1] }}
            >
              {onRevealJoke ? (
                // Peelable: dashed-border button matching reference CTA style
                <button
                  type="button"
                  onClick={onRevealJoke}
                  className="focus-ring flex h-full w-full items-center justify-center rounded-md p-2"
                  aria-label="Reveal joke"
                >
                  <div className="flex w-full flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-amber-600/60 py-1.5">
                    <span className="pixel-text text-[10px] italic tracking-wider text-amber-800">
                      REVEAL JOKE
                    </span>
                    <span className="text-[9px] text-amber-700/70">tap to peel</span>
                  </div>
                </button>
              ) : (
                // Locked: same dashed-border container, no interaction
                <div className="flex h-full w-full items-center justify-center rounded-md p-2">
                  <div className="flex w-full flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-amber-600/40 py-1.5">
                    <span className="pixel-text text-[12px] italic tracking-wider text-amber-800/60">
                      CATCH TO REVEAL
                    </span>
                    <span className="text-[12px] text-amber-700/50">🔒</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-2">
      <dt className="text-[9px] font-semibold tracking-[0.2em] text-ink-muted">{label}</dt>
      <dd className="pixel-text text-[18px] uppercase text-ink">{value}</dd>
    </div>
  );
}
