import { AnimatePresence, motion } from 'framer-motion';
import type { UnlockedAchievement } from '../lib/types';

interface Props {
  achievements: UnlockedAchievement[];
  onDismiss: (id: string) => void;
}

/**
 * Stacked toast notifications for newly unlocked achievements. Pushes are
 * additive — each unlock auto-dismisses after a short delay so the player can
 * keep playing without modal interruption. The component is purely
 * presentational; the parent owns the queue (see SwipePage).
 */
export function AchievementToasts({ achievements, onDismiss }: Props) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-2 z-40 flex flex-col items-center gap-2 px-3"
    >
      <AnimatePresence initial={false}>
        {achievements.map((a) => (
          <motion.div
            key={a.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="pointer-events-auto flex w-full max-w-xs items-center gap-3 rounded-xl border-2 border-like/50 bg-white px-3 py-2 shadow-device"
            role="status"
          >
            <span
              aria-hidden
              className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-like/15 text-lg text-like"
            >
              {a.icon}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="pixel-text text-[9px] uppercase tracking-[0.2em] text-like">
                Achievement!
              </p>
              <p className="truncate text-[12px] font-semibold text-ink">{a.title}</p>
              <p className="truncate text-[11px] text-ink-muted">{a.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(a.id)}
              aria-label="Dismiss"
              className="focus-ring rounded-full p-1 text-ink-muted hover:bg-bg"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
