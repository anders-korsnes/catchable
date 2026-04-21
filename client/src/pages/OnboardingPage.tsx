import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegions, useTypes } from '../hooks/usePokemonReference';
import { usePreferences, useSavePreferences } from '../hooks/usePreferences';
import { TypeBadge } from '../components/TypeBadge';
import { SelectAllRow } from '../components/SelectAllRow';
import { describeRegion } from '../lib/region-info';
import { ApiError } from '../lib/api';

type Step = 'regions' | 'types' | 'confirm';

const STEP_ORDER: Step[] = ['regions', 'types', 'confirm'];

/**
 * First-run wizard. Walks the user through choosing regions (with descriptions
 * so they can pick by era/game/vibe) and then types. Mounted at /onboarding;
 * registration drops the user here, but they can also re-run it from Settings
 * by clicking "Run setup again".
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const regionsQuery = useRegions();
  const typesQuery = useTypes();
  const prefsQuery = usePreferences();
  const save = useSavePreferences();

  const [step, setStep] = useState<Step>('regions');
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Pre-seed selections if the user already has prefs (re-running the wizard).
  useEffect(() => {
    if (prefsQuery.data && regions.size === 0 && types.size === 0) {
      setRegions(new Set(prefsQuery.data.regions));
      setTypes(new Set(prefsQuery.data.types));
    }
  }, [prefsQuery.data, regions.size, types.size]);

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

  const handleNext = () => {
    setError(null);
    if (step === 'regions' && regions.size === 0) {
      setError('Pick at least one region.');
      return;
    }
    if (step === 'types' && types.size === 0) {
      setError('Pick at least one type.');
      return;
    }
    const idx = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)]!);
  };

  const handleBack = () => {
    setError(null);
    const idx = STEP_ORDER.indexOf(step);
    setStep(STEP_ORDER[Math.max(idx - 1, 0)]!);
  };

  const handleFinish = async () => {
    setError(null);
    try {
      await save.mutateAsync({ regions: [...regions], types: [...types] });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your preferences.');
    }
  };

  const loading = regionsQuery.isLoading || typesQuery.isLoading || prefsQuery.isLoading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="relative w-full max-w-[520px] overflow-hidden rounded-[28px] border border-line bg-surface shadow-device">
        <header className="border-b border-line px-6 py-4">
          <p className="pixel-text text-[10px] text-pokered">SETUP</p>
          <h1 className="mt-1 text-lg font-semibold">Build your deck</h1>
          <StepIndicator step={step} />
        </header>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="text-sm text-ink-muted">Loading options…</p>
          ) : step === 'regions' ? (
            <RegionsStep
              regions={regionsQuery.data ?? []}
              selected={regions}
              onToggle={toggleRegion}
              onSelectAll={(all) =>
                setRegions(all ? new Set((regionsQuery.data ?? []).map((r) => r.name)) : new Set())
              }
            />
          ) : step === 'types' ? (
            <TypesStep
              types={sortedTypes}
              selected={types}
              onToggle={toggleType}
              onSelectAll={(all) =>
                setTypes(all ? new Set(sortedTypes.map((t) => t.name)) : new Set())
              }
            />
          ) : (
            <ConfirmStep regions={[...regions]} types={[...types]} />
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mx-6 mb-2 rounded-md border border-pokered/30 bg-pokered/5 px-3 py-2 text-sm text-pokered"
          >
            {error}
          </div>
        )}

        <footer className="flex items-center justify-between border-t border-line px-6 py-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 'regions'}
            className="focus-ring rounded-full border border-line px-4 py-2 text-sm font-medium hover:bg-bg disabled:opacity-40"
          >
            Back
          </button>
          {step !== 'confirm' ? (
            <button
              type="button"
              onClick={handleNext}
              className="focus-ring rounded-full bg-ink px-5 py-2 text-sm font-semibold text-ink-invert"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={save.isPending}
              className="focus-ring rounded-full bg-like px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {save.isPending ? 'Saving…' : 'Start swiping'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <ol className="mt-3 flex items-center gap-2 text-[10px] text-ink-muted">
      {STEP_ORDER.map((s, i) => {
        const active = s === step;
        const done = STEP_ORDER.indexOf(step) > i;
        return (
          <li key={s} className="flex items-center gap-2">
            <span
              className={[
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                active
                  ? 'bg-ink text-ink-invert'
                  : done
                  ? 'bg-like text-white'
                  : 'border border-line bg-surface text-ink-muted',
              ].join(' ')}
            >
              {i + 1}
            </span>
            <span className={active ? 'font-semibold text-ink' : ''}>
              {s === 'regions' ? 'Regions' : s === 'types' ? 'Types' : 'Confirm'}
            </span>
            {i < STEP_ORDER.length - 1 && <span className="text-line">›</span>}
          </li>
        );
      })}
    </ol>
  );
}

interface RegionsStepProps {
  regions: { name: string }[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSelectAll: (allSelected: boolean) => void;
}

function RegionsStep({ regions, selected, onToggle, onSelectAll }: RegionsStepProps) {
  return (
    <div>
      <p className="mb-2 text-sm text-ink-muted">
        Pick one or more regions to swipe through. Each region pulls from a
        different generation of games — descriptions below.
      </p>
      <SelectAllRow
        selected={selected.size}
        total={regions.length}
        onToggle={onSelectAll}
        noun="regions"
      />
      <div className="max-h-[300px] overflow-y-auto rounded-xl border border-line bg-bg/40 p-2">
        <ul className="space-y-2">
          {regions.map((r) => {
            const info = describeRegion(r.name);
            const isSelected = selected.has(r.name);
            return (
              <li key={r.name}>
                <button
                  type="button"
                  onClick={() => onToggle(r.name)}
                  aria-pressed={isSelected}
                  className={[
                    'focus-ring flex w-full flex-col items-start gap-1 rounded-xl border-2 bg-surface px-4 py-3 text-left transition',
                    isSelected ? 'border-ink bg-ink/5' : 'border-line hover:border-ink/40',
                  ].join(' ')}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="pixel-text text-[12px] capitalize">{r.name}</span>
                    {info && (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                        {info.generation}
                      </span>
                    )}
                  </div>
                  {info && (
                    <>
                      <p className="text-[11px] font-medium text-action">{info.games}</p>
                      <p className="text-xs leading-snug text-ink-muted">{info.flavor}</p>
                    </>
                  )}
                  {!info && (
                    <p className="text-xs text-ink-muted">No description available.</p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

interface TypesStepProps {
  types: { name: string }[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onSelectAll: (allSelected: boolean) => void;
}

function TypesStep({ types, selected, onToggle, onSelectAll }: TypesStepProps) {
  return (
    <div>
      <p className="mb-2 text-sm text-ink-muted">
        Which types do you want in your deck? Pick at least one — the more you
        pick, the bigger your pool.
      </p>
      <SelectAllRow
        selected={selected.size}
        total={types.length}
        onToggle={onSelectAll}
        noun="types"
      />
      <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-bg/40 p-3">
        {types.map((t) => (
          <TypeBadge
            key={t.name}
            type={t.name}
            as="button"
            selected={selected.has(t.name)}
            onClick={() => onToggle(t.name)}
          />
        ))}
      </div>
    </div>
  );
}

function ConfirmStep({ regions, types }: { regions: string[]; types: string[] }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">Looks good? Confirm and start swiping.</p>
      <section>
        <h2 className="pixel-text text-[10px] text-ink-muted">REGIONS ({regions.length})</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {regions.map((r) => (
            <li
              key={r}
              className="rounded-full border border-line bg-bg px-3 py-1 text-sm font-medium capitalize"
            >
              {r}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="pixel-text text-[10px] text-ink-muted">TYPES ({types.length})</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
