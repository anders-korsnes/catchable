import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegions, useTypes } from '../hooks/usePokemonReference';
import { usePreferences, useSavePreferences } from '../hooks/usePreferences';
import { useAuth } from '../hooks/useAuth';
import { TypeBadge } from '../components/TypeBadge';
import { SignInPrompt } from '../components/SignInPrompt';
import { SelectAllRow } from '../components/SelectAllRow';
import { describeRegion } from '../lib/region-info';
import { ApiError } from '../lib/api';
import type { Difficulty } from '../lib/types';

const DIFFICULTY_TIERS: ReadonlyArray<{
  value: Difficulty;
  label: string;
  stars: string;
  blurb: string;
  tone: string;
}> = [
  {
    value: 'easy',
    label: 'Easy',
    stars: '★☆☆☆',
    blurb: 'Wide catch arc. Great for warming up.',
    tone: 'text-emerald-600 border-emerald-500/40',
  },
  {
    value: 'medium',
    label: 'Medium',
    stars: '★★☆☆',
    blurb: 'Fair challenge. Most of the roster.',
    tone: 'text-amber-600 border-amber-500/40',
  },
  {
    value: 'hard',
    label: 'Hard',
    stars: '★★★☆',
    blurb: 'Tight arcs. Fast hands needed.',
    tone: 'text-orange-600 border-orange-500/40',
  },
  {
    value: 'legendary',
    label: 'Legendary',
    stars: '★★★★',
    blurb: 'Razor-thin window. Legendary only.',
    tone: 'text-pokered border-pokered/50',
  },
];

export function SettingsPage() {
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
        title="SETTINGS"
        body="Sign in to customize your deck — pick your favorite regions, types, and difficulty."
        redirectTo="/settings"
      />
    );
  }

  return <AuthedSettings />;
}

function AuthedSettings() {
  const navigate = useNavigate();
  const regionsQuery = useRegions();
  const typesQuery = useTypes();
  const prefsQuery = usePreferences();
  const save = useSavePreferences();

  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Re-sync local state whenever the query delivers a new data reference
  // (initial load or refetch after a save). Reacting to the reference is safer
  // than a one-shot hydration flag — it handles late cache refreshes too.
  const lastSyncedRef = useRef<typeof prefsQuery.data | null>(null);
  useEffect(() => {
    if (!prefsQuery.data) return;
    if (lastSyncedRef.current === prefsQuery.data) return;
    lastSyncedRef.current = prefsQuery.data;
    setRegions(new Set(prefsQuery.data.regions));
    setTypes(new Set(prefsQuery.data.types));
    setDifficulties(new Set(prefsQuery.data.difficulties ?? []));
  }, [prefsQuery.data]);

  const sortedTypes = useMemo(
    () => (typesQuery.data ? [...typesQuery.data].sort((a, b) => a.name.localeCompare(b.name)) : []),
    [typesQuery.data],
  );

  const toggleRegion = (name: string) =>
    setRegions((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const toggleType = (name: string) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const toggleDifficulty = (value: Difficulty) =>
    setDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const allDifficultiesSelected = difficulties.size === DIFFICULTY_TIERS.length;
  const noDifficultiesSelected = difficulties.size === 0;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    if (regions.size === 0) {
      setError('Pick at least one region.');
      return;
    }
    if (types.size === 0) {
      setError('Pick at least one type.');
      return;
    }
    try {
      // Empty array = "all difficulties" on the server.
      const difficultiesPayload =
        difficulties.size === DIFFICULTY_TIERS.length ? [] : [...difficulties];
      await save.mutateAsync({
        regions: [...regions],
        types: [...types],
        difficulties: difficultiesPayload,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your preferences.');
    }
  };

  const loading = regionsQuery.isLoading || typesQuery.isLoading || prefsQuery.isLoading;

  return (
    <section className="flex flex-1 flex-col overflow-hidden px-4 py-5">
      <header className="mb-5">
        <p className="pixel-text text-[10px] text-pokered">TRAINER CONFIG</p>
        <h1 className="mt-1 text-xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-xs text-ink-muted">
          Shape your deck. Changes apply to the next card you draw.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading options…</p>
      ) : (
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pb-4 pr-1">
            {/* Regions */}
            <SettingsCard
              title="Regions"
              subtitle="Generations of Pokémon to pull from."
              accent="bg-amber-400"
            >
              <SelectAllRow
                selected={regions.size}
                total={regionsQuery.data?.length ?? 0}
                onToggle={(all) =>
                  setRegions(
                    all ? new Set((regionsQuery.data ?? []).map((r) => r.name)) : new Set(),
                  )
                }
                noun="regions"
              />
              <div className="max-h-[260px] overflow-y-auto rounded-xl border border-line bg-bg/40 p-2">
                <ul className="grid grid-cols-1 gap-1.5">
                  {regionsQuery.data?.map((r) => {
                    const info = describeRegion(r.name);
                    const checked = regions.has(r.name);
                    return (
                      <li key={r.name}>
                        <label
                          className={[
                            'focus-ring flex cursor-pointer items-start gap-3 rounded-lg border bg-surface px-3 py-2 transition',
                            checked ? 'border-ink bg-ink/5' : 'border-line hover:border-ink/40',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleRegion(r.name)}
                            className="mt-1 h-4 w-4 accent-ink"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium capitalize">{r.name}</p>
                            {info && (
                              <p className="truncate text-[11px] text-ink-muted">
                                {info.generation} · {info.games}
                              </p>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </SettingsCard>

            {/* Types */}
            <SettingsCard
              title="Types"
              subtitle="Which elemental types belong in your deck."
              accent="bg-sky-400"
            >
              <SelectAllRow
                selected={types.size}
                total={sortedTypes.length}
                onToggle={(all) =>
                  setTypes(all ? new Set(sortedTypes.map((t) => t.name)) : new Set())
                }
                noun="types"
              />
              <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-bg/40 p-3">
                {sortedTypes.map((t) => (
                  <TypeBadge
                    key={t.name}
                    type={t.name}
                    as="button"
                    selected={types.has(t.name)}
                    onClick={() => toggleType(t.name)}
                  />
                ))}
              </div>
            </SettingsCard>

            {/* Difficulty */}
            <SettingsCard
              title="Catch difficulty"
              subtitle="Skip the tiers you don't want to see in the deck."
              accent="bg-pokered"
            >
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-ink-muted">
                  {allDifficultiesSelected ? (
                    <span className="font-semibold text-ink">Every difficulty</span>
                  ) : (
                    <>
                      <span className="font-semibold text-ink">{difficulties.size}</span> of{' '}
                      {DIFFICULTY_TIERS.length} tiers selected
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setDifficulties(
                      allDifficultiesSelected
                        ? new Set()
                        : new Set(DIFFICULTY_TIERS.map((t) => t.value)),
                    )
                  }
                  className="focus-ring rounded-full border border-line px-3 py-1 font-medium text-ink hover:bg-bg"
                >
                  {allDifficultiesSelected
                    ? 'Clear'
                    : noDifficultiesSelected
                    ? 'Select all'
                    : 'Every difficulty'}
                </button>
              </div>
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {DIFFICULTY_TIERS.map((tier) => {
                  const checked = difficulties.has(tier.value);
                  return (
                    <li key={tier.value}>
                      <button
                        type="button"
                        onClick={() => toggleDifficulty(tier.value)}
                        aria-pressed={checked}
                        className={[
                          'focus-ring flex w-full items-start gap-3 rounded-lg border-2 bg-surface px-3 py-2 text-left transition',
                          checked
                            ? `border-ink bg-ink/5 ${tier.tone}`
                            : 'border-line hover:border-ink/40',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-sm border-2',
                            checked ? 'border-ink bg-ink' : 'border-line bg-surface',
                          ].join(' ')}
                          aria-hidden
                        >
                          {checked && (
                            <svg viewBox="0 0 12 12" width="10" height="10">
                              <path
                                d="M2 6 L5 9 L10 3"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-baseline gap-2">
                            <span className="text-sm font-semibold text-ink">{tier.label}</span>
                            <span className="font-mono text-[10px] text-ink-muted">
                              {tier.stars}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[11px] text-ink-muted">
                            {tier.blurb}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[11px] text-ink-muted">
                Pick none (or all four) to keep every difficulty in the deck.
              </p>
            </SettingsCard>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-pokered/30 bg-pokered/5 px-3 py-2 text-sm text-pokered"
              >
                {error}
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-surface/95 px-1 py-3 backdrop-blur">
            <button
              type="submit"
              disabled={save.isPending}
              className="focus-ring inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-ink-invert disabled:opacity-60"
            >
              {save.isPending ? 'Saving…' : 'Save preferences'}
            </button>
            {prefsQuery.data && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="focus-ring rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-bg"
              >
                Back to deck
              </button>
            )}
            {saved && (
              <span className="pixel-text text-[10px] text-like" aria-live="polite">
                ✓ SAVED
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

interface SettingsCardProps {
  title: string;
  subtitle?: string;
  accent?: string;
  children: React.ReactNode;
}

function SettingsCard({ title, subtitle, accent = 'bg-ink', children }: SettingsCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className={`h-6 w-1.5 flex-none rounded-full ${accent}`} aria-hidden />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-[11px] text-ink-muted">{subtitle}</p>}
        </div>
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}
