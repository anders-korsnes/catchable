import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAchievements } from '../hooks/useAchievements';
import { SignInPrompt } from '../components/SignInPrompt';
import { ApiError } from '../lib/api';
import type { AchievementCategory, AchievementListItem } from '../lib/types';

const CATEGORY_ORDER: AchievementCategory[] = [
  'progression',
  'difficulty',
  'completion',
  'special',
];

const CATEGORY_LABEL: Record<AchievementCategory, string> = {
  progression: 'Progression',
  difficulty: 'Skill & difficulty',
  completion: 'Completion',
  special: 'Hidden & special',
};

export function AchievementsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <Centered>Loading…</Centered>;
  }

  if (!user) {
    return (
      <SignInPrompt
        title="MEDALS LOCKER"
        body="Sign in to track every milestone, hidden secret, and full-region completion."
        redirectTo="/achievements"
      />
    );
  }

  return <AuthedAchievements />;
}

function AuthedAchievements() {
  const { data, isLoading, error } = useAchievements();

  const grouped = useMemo(() => {
    const items = data?.items ?? [];
    const buckets: Record<AchievementCategory, AchievementListItem[]> = {
      progression: [],
      difficulty: [],
      completion: [],
      special: [],
    };
    for (const item of items) buckets[item.category].push(item);
    for (const cat of CATEGORY_ORDER) {
      buckets[cat].sort((a, b) => {
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return a.order - b.order;
      });
    }
    return buckets;
  }, [data]);

  if (isLoading) return <Centered>Loading medals…</Centered>;

  if (error) {
    return (
      <Centered>
        <span className="text-pokered">
          {error instanceof ApiError ? error.message : 'Could not load achievements.'}
        </span>
      </Centered>
    );
  }

  const total = data?.total ?? 0;
  const unlocked = data?.unlocked ?? 0;
  const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 py-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="pixel-text text-sm">MEDALS</h1>
          <p className="mt-0.5 text-xs text-ink-muted">
            {unlocked}/{total} unlocked · {percent}%
          </p>
        </div>
        <Link
          to="/"
          className="focus-ring rounded-full border border-line px-3 py-1 text-xs font-medium hover:bg-bg"
        >
          Back to deck
        </Link>
      </header>

      <div className="h-2 w-full overflow-hidden rounded-full border border-line bg-bg">
        <div
          className="h-full bg-like transition-all"
          style={{ width: `${percent}%` }}
          aria-hidden
        />
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        const sectionUnlocked = items.filter((i) => i.unlocked).length;
        return (
          <section key={cat} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <h2 className="pixel-text text-[10px] uppercase tracking-[0.2em] text-ink-muted">
                {CATEGORY_LABEL[cat]}
              </h2>
              <span className="font-mono text-[10px] text-ink-muted">
                {sectionUnlocked}/{items.length}
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((item, idx) => (
                <AchievementTile key={item.id} item={item} index={idx} />
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}

/**
 * Achievement tile.
 *
 * Three visual states, each unmistakable at a glance:
 *
 *   - **Unlocked**: full-color gold gradient, glowing icon ring, ✓ checkmark
 *     stamp, "UNLOCKED" tagline above the title. The eye should be drawn here.
 *   - **Hidden + locked**: dashed border, mystery silhouette, no spoilers.
 *   - **Visible + locked**: muted/desaturated card with a 🔒 indicator.
 */
function AchievementTile({ item, index }: { item: AchievementListItem; index: number }) {
  const locked = !item.unlocked;
  const stillHidden = item.hidden && locked;

  if (item.unlocked) {
    return (
      <motion.li
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.02, 0.2) }}
        className="relative flex items-start gap-3 overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-3 shadow-[0_2px_0_rgba(245,158,11,0.35)]"
      >
        <span
          aria-hidden
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-like text-[10px] font-bold text-white shadow"
        >
          ✓
        </span>
        <div
          aria-hidden
          className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-amber-100 text-2xl ring-2 ring-amber-400/60"
        >
          {item.icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col pr-5">
          <p className="pixel-text text-[8px] uppercase tracking-[0.25em] text-amber-600">
            Unlocked
          </p>
          <p className="text-[12px] font-semibold text-ink">{item.title}</p>
          <p className="mt-0.5 text-[11px] text-ink-muted">{item.description}</p>
          {item.unlockedAt && (
            <p className="mt-1 font-mono text-[10px] text-ink-muted">
              {new Date(item.unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.2) }}
      className={`relative flex items-start gap-3 rounded-xl border-2 p-3 ${
        stillHidden
          ? 'border-dashed border-line bg-bg/40'
          : 'border-line bg-bg/40'
      }`}
    >
      <div
        aria-hidden
        className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-line/40 text-2xl text-ink-muted/70"
      >
        {stillHidden ? '?' : item.icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="pixel-text text-[8px] uppercase tracking-[0.25em] text-ink-muted">
          {stillHidden ? 'Hidden' : 'Locked'}
        </p>
        <p className="text-[12px] font-semibold text-ink-muted">
          {stillHidden ? '???' : item.title}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-muted/80">
          {stillHidden ? 'Keep playing to reveal this one.' : item.description}
        </p>
      </div>
      <span aria-hidden className="absolute right-2 top-2 text-sm text-ink-muted/60">
        🔒
      </span>
    </motion.li>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-1 items-center justify-center px-4 py-6 text-sm text-ink-muted">
      {children}
    </section>
  );
}
