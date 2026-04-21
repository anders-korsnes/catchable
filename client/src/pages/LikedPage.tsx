import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiked, useUnlike } from '../hooks/useLiked';
import { useAuth } from '../hooks/useAuth';
import { SignInPrompt } from '../components/SignInPrompt';
import { PokedexEntryModal } from '../components/PokedexEntryModal';
import { ApiError } from '../lib/api';
import type { LikedItem } from '../lib/types';
import {
  colorForType,
  darkerForType,
  lighterForType,
  tileEnvironmentBackground,
} from '../lib/type-colors';

export function LikedPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <section className="flex flex-1 items-center justify-center px-4 py-6 text-sm text-ink-muted">
        Loading…
      </section>
    );
  }

  if (!user) {
    return (
      <SignInPrompt
        title="YOUR POKÉDEX"
        body="Sign in to start a Pokédex of your own. Every Pokémon you catch gets logged here."
        redirectTo="/liked"
      />
    );
  }

  return <AuthedLiked />;
}

/**
 * A region group can contain both caught Pokémon (rendered as detailed tiles)
 * and "still missing" placeholders for ones that belong to the region but
 * haven't been caught yet. Groups for user-selected regions always include a
 * full `missingIds` list so the grid visually reminds the player what's left;
 * groups for extra historical regions have empty `missingIds`.
 */
interface RegionGroup {
  region: string;
  total: number;
  caught: LikedItem[];
  missingIds: number[];
}

function AuthedLiked() {
  const { data, isLoading, error } = useLiked();
  const unlike = useUnlike();
  const [openItem, setOpenItem] = useState<LikedItem | null>(null);
  // Accordion state — holds regions that the user has *collapsed*. Empty set =
  // every group is open (the requested default).
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const liked = useMemo(() => data?.liked ?? [], [data]);
  const regionTotals = useMemo(() => data?.regionTotals ?? {}, [data]);
  const regionIds = useMemo(() => data?.regionIds ?? {}, [data]);

  const groups = useMemo<RegionGroup[]>(() => {
    // Assign each caught Pokémon to its primary region (first region in the
    // server-provided list). Dedupe in case a pokemon appears in multiple
    // regions' lists — primary wins.
    const regionMap = new Map<string, LikedItem[]>();
    const seenIds = new Set<number>();

    for (const item of liked) {
      if (seenIds.has(item.pokemon.id)) continue;
      seenIds.add(item.pokemon.id);
      const primaryRegion = item.regions[0] ?? 'other';
      const arr = regionMap.get(primaryRegion) ?? [];
      arr.push(item);
      regionMap.set(primaryRegion, arr);
    }

    // Sort each region's caught list by Pokédex number so #1 appears first.
    for (const arr of regionMap.values()) {
      arr.sort((a, b) => a.pokemon.id - b.pokemon.id);
    }

    const selectedRegions = Object.keys(regionTotals);
    const extraRegions = [...regionMap.keys()]
      .filter((r) => r !== 'other' && !selectedRegions.includes(r))
      .sort();

    const result: RegionGroup[] = [];
    for (const region of selectedRegions) {
      const caught = regionMap.get(region) ?? [];
      const caughtSet = new Set(caught.map((c) => c.pokemon.id));
      const missingIds = (regionIds[region] ?? []).filter((id) => !caughtSet.has(id));
      result.push({
        region,
        total: regionTotals[region] ?? 0,
        caught,
        missingIds,
      });
    }
    // Extra regions (caught before current preferences) — no "missing" list.
    for (const region of extraRegions) {
      const caught = regionMap.get(region) ?? [];
      if (caught.length > 0) {
        result.push({ region, total: 0, caught, missingIds: [] });
      }
    }
    const other = regionMap.get('other');
    if (other && other.length > 0) {
      result.push({ region: 'other', total: 0, caught: other, missingIds: [] });
    }
    return result;
  }, [liked, regionTotals, regionIds]);

  const toggleRegion = (region: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center px-4 py-6 text-sm text-ink-muted">
        Loading your Pokédex…
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-1 items-center justify-center px-4 py-6">
        <p className="text-sm text-pokered">
          {error instanceof ApiError ? error.message : 'Could not load liked Pokémon.'}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-1 flex-col px-3 py-4">
      <header className="mb-3 flex items-center justify-between px-1">
        <div>
          <h1 className="pixel-text text-sm">POKÉDEX</h1>
          <p className="mt-0.5 text-xs text-ink-muted">{liked.length} caught</p>
        </div>
        <Link
          to="/"
          className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-bg"
        >
          Back to deck
        </Link>
      </header>

      {liked.length === 0 && groups.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-device border border-dashed border-line bg-bg/40 p-8 text-center">
          <p className="pixel-text text-[10px] text-pokered">EMPTY</p>
          <h2 className="mt-2 text-base font-semibold">Nothing caught yet</h2>
          <p className="mt-1 text-sm text-ink-muted">Head back to the deck and start swiping.</p>
          <Link
            to="/"
            className="focus-ring mt-4 inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-invert"
          >
            Open deck
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <RegionSection
              key={group.region}
              group={group}
              open={!collapsed.has(group.region)}
              onToggle={() => toggleRegion(group.region)}
              onOpenCard={setOpenItem}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {openItem && (
          <PokedexEntryModal
            item={openItem}
            onClose={() => setOpenItem(null)}
            onRelease={() => {
              unlike.mutate(openItem.pokemon.id);
              setOpenItem(null);
            }}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Region section — collapsible header + grid of caught/missing cards.
// ---------------------------------------------------------------------------

interface RegionSectionProps {
  group: RegionGroup;
  open: boolean;
  onToggle: () => void;
  onOpenCard: (item: LikedItem) => void;
}

function RegionSection({ group, open, onToggle, onOpenCard }: RegionSectionProps) {
  // Merge caught + missing into a single ID-sorted list so #1 comes first
  // regardless of whether it's caught yet.
  const entries = useMemo(() => {
    const merged: Array<{ id: number; item: LikedItem | null }> = [
      ...group.caught.map((item) => ({ id: item.pokemon.id, item })),
      ...group.missingIds.map((id) => ({ id, item: null as LikedItem | null })),
    ];
    merged.sort((a, b) => a.id - b.id);
    return merged;
  }, [group.caught, group.missingIds]);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="focus-ring mb-2 flex w-full items-center px-1 text-left"
      >
        <h2 className="pixel-text text-[11px] capitalize tracking-wider text-ink">
          {group.region}
        </h2>
        {group.total > 0 && (
          <span
            className="text-[10px] font-medium text-ink-muted"
            style={{ marginLeft: '24px' }}
          >
            {group.caught.length} / {group.total}
          </span>
        )}
        <Chevron open={open} className="ml-auto text-ink-muted" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            key="grid"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="grid grid-cols-4 gap-2 overflow-hidden"
          >
            {entries.map(({ id, item }, index) =>
              item ? (
                <PokedexCard
                  key={`caught-${id}`}
                  item={item}
                  index={index}
                  onOpen={() => onOpenCard(item)}
                />
              ) : (
                <MissingPokedexCard key={`missing-${id}`} id={id} index={index} />
              ),
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chevron({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      aria-hidden
      className={`${className} flex-none transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

interface CardProps {
  item: LikedItem;
  index: number;
  onOpen: () => void;
}

function PokedexCard({ item, index, onOpen }: CardProps) {
  const { pokemon } = item;
  const primary = pokemon.types[0] ?? 'normal';
  const secondary = pokemon.types[1];
  const top = lighterForType(primary);
  const base = colorForType(primary);
  const border = darkerForType(primary);

  return (
    <motion.li
      layout
      layoutId={`pokedex-card-${pokemon.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2), type: 'spring', stiffness: 220, damping: 22 }}
      className="overflow-hidden rounded-xl border-[2px] shadow-sm"
      style={{
        background: `linear-gradient(180deg, ${top} 0%, ${base} 100%)`,
        borderColor: border,
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="focus-ring block w-full text-left transition active:scale-[0.97]"
        aria-label={`Open Pokédex entry for ${pokemon.displayName}`}
      >
        <div
          className="relative mx-1.5 mt-1.5 flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-white/30"
          style={{ background: tileEnvironmentBackground(primary, secondary) }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gb-dotmatrix bg-gb-dotmatrix opacity-[0.18] mix-blend-overlay"
          />
          {pokemon.imageUrl ? (
            <img
              src={pokemon.imageUrl}
              alt={pokemon.displayName}
              className="relative h-full w-full object-contain p-1 drop-shadow-[0_3px_5px_rgba(0,0,0,0.3)]"
            />
          ) : (
            <span className="pixel-text text-[8px] text-white/80">?</span>
          )}
        </div>

        <div className="px-1.5 pb-1.5 pt-1">
          <p className="pixel-text truncate text-[7px] capitalize leading-tight text-white">
            {pokemon.name}
          </p>
          <p className="font-mono text-[7px] font-medium text-white/70">
            #{String(pokemon.id).padStart(3, '0')}
          </p>
        </div>
      </button>
    </motion.li>
  );
}

/**
 * Placeholder card shown for Pokémon that belong to a user-selected region
 * but haven't been caught yet. Matches the real tile's dimensions so the grid
 * stays tidy, but the visual language ("???", dashed border, muted neutrals)
 * makes it clear the entry is unclaimed.
 */
function MissingPokedexCard({ id, index }: { id: number; index: number }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 0.85, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2), type: 'spring', stiffness: 220, damping: 22 }}
      className="overflow-hidden rounded-xl border-[2px] border-dashed border-ink-muted/40 bg-bg shadow-sm"
      aria-label={`Still missing #${String(id).padStart(3, '0')}`}
    >
      <div className="block w-full">
        <div className="relative mx-1.5 mt-1.5 flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-ink-muted/30 bg-white/60">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gb-dotmatrix bg-gb-dotmatrix opacity-[0.18] mix-blend-overlay"
          />
          <span className="pixel-text text-[28px] text-ink-muted/70">?</span>
        </div>

        <div className="px-1.5 pb-1.5 pt-1">
          <p className="pixel-text truncate text-[7px] leading-tight text-ink-muted">???</p>
          <p className="font-mono text-[7px] font-medium text-ink-muted/70">
            #{String(id).padStart(3, '0')}
          </p>
        </div>
      </div>
    </motion.li>
  );
}
