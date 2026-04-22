import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  show: boolean;
  /** CSS selector for the Pokédex tab the ball should land in. */
  tabSelector: string;
  /** CSS selector for the modal panel — used to anchor the ball center. */
  modalSelector?: string;
}

interface Snapshot {
  tabRect: DOMRect;
  modalRect: DOMRect;
}

/**
 * Catch sequence (~2s): drop, close with flash, wobble, fall into Pokédex tab.
 * Fixed-positioned against the modal rect. Respects prefers-reduced-motion via global CSS.
 */
export function CatchAnimation({
  show,
  tabSelector,
  modalSelector = '#app-modal',
}: Props) {
  const [snap, setSnap] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!show) {
      setSnap(null);
      return;
    }
    const tabEl = document.querySelector(tabSelector) as HTMLElement | null;
    const modalEl = document.querySelector(modalSelector) as HTMLElement | null;
    if (!tabEl || !modalEl) return;
    setSnap({
      tabRect: tabEl.getBoundingClientRect(),
      modalRect: modalEl.getBoundingClientRect(),
    });
  }, [show, tabSelector, modalSelector]);

  return (
    <AnimatePresence>
      {show && snap && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <Choreography snap={snap} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const BALL_SIZE = 96;

// Timeline durations in seconds.
const T = {
  drop: 0.4,
  close: 0.28,
  wobble: 0.6,
  fall: 0.55,
};
const TOTAL = T.drop + T.close + T.wobble + T.fall;

const ms = (...parts: number[]) =>
  parts.reduce((acc, p) => acc + p, 0) / TOTAL;

function Choreography({ snap }: { snap: Snapshot }) {
  const { tabRect, modalRect } = snap;

  // Anchor at modal horizontal center, one-third down.
  const centerX = modalRect.left + modalRect.width / 2 - BALL_SIZE / 2;
  const centerY = modalRect.top + modalRect.height * 0.34 - BALL_SIZE / 2;

  // Landing target: center of the Pokédex tab.
  const tabX = tabRect.left + tabRect.width / 2 - BALL_SIZE / 2;
  const tabY = tabRect.top + tabRect.height / 2 - BALL_SIZE / 2;

  const dropped = ms(T.drop);
  const closed = ms(T.drop, T.close);
  const wobbleEnd = ms(T.drop, T.close, T.wobble);

  // Hold at center through close + wobble, then fall to the tab.
  const times = [0, dropped, closed, wobbleEnd, 1];

  return (
    <motion.div
      className="absolute will-change-transform"
      style={{ left: 0, top: 0, width: BALL_SIZE, height: BALL_SIZE }}
      initial={{ x: centerX, y: centerY - 280, scale: 0.55, opacity: 0 }}
      animate={{
        x: [centerX, centerX, centerX, centerX, tabX],
        y: [centerY - 280, centerY, centerY, centerY, tabY],
        scale: [0.55, 1, 1, 1, 0.32],
        opacity: [0, 1, 1, 1, 0.2],
      }}
      transition={{ duration: TOTAL, times, ease: 'easeInOut' }}
    >
      <Ball />
      <Shadow />
    </motion.div>
  );
}

// Pokéball assembled from independently animated parts.

function Ball() {
  const dropped = ms(T.drop);
  const closed = ms(T.drop, T.close);
  const wobbleEnd = ms(T.drop, T.close, T.wobble);

  return (
    <div className="relative" style={{ width: BALL_SIZE, height: BALL_SIZE }}>
      {/* Bottom (white) half. */}
      <div className="absolute inset-0 drop-shadow-[0_3px_2px_rgba(0,0,0,0.25)]">
        <BallBottom />
      </div>

      {/* Top (red) half: rotates from open onto the bottom. */}
      <motion.div
        className="absolute left-0 top-0 origin-bottom drop-shadow-[0_-1px_2px_rgba(0,0,0,0.2)]"
        style={{ width: BALL_SIZE, height: BALL_SIZE / 2 }}
        initial={{ rotate: -130, y: -BALL_SIZE * 0.28 }}
        animate={{
          rotate: [-130, -130, -22, 0, 0, 0],
          y: [-BALL_SIZE * 0.28, -BALL_SIZE * 0.28, -3, 0, 0, 0],
        }}
        transition={{
          duration: TOTAL,
          times: [0, dropped - 0.005, closed - T.close * 0.3 / TOTAL, closed, wobbleEnd, 1],
          ease: [0.42, 0, 0.2, 1.2],
        }}
      >
        <BallTop />
      </motion.div>

      {/* Flash ring on close. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        initial={{ scale: 0.6, opacity: 0, boxShadow: '0 0 0 0 rgba(255,255,255,0)' }}
        animate={{
          scale: [0.6, 0.6, 1.4, 1.7],
          opacity: [0, 0, 0.85, 0],
          boxShadow: [
            '0 0 0 0 rgba(255,255,255,0)',
            '0 0 0 0 rgba(255,255,255,0)',
            '0 0 30px 10px rgba(255,235,180,0.85)',
            '0 0 60px 18px rgba(255,235,180,0)',
          ],
        }}
        transition={{
          duration: TOTAL,
          times: [0, closed - 0.005, closed + 0.01, closed + 0.08],
          ease: 'easeOut',
        }}
      />

      {/* Wobble. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          rotate: [0, 0, 0, -14, 12, -8, 5, -2, 0, 0],
        }}
        transition={{
          duration: TOTAL,
          times: [
            0,
            dropped - 0.001,
            closed,
            closed + (wobbleEnd - closed) * 0.18,
            closed + (wobbleEnd - closed) * 0.36,
            closed + (wobbleEnd - closed) * 0.54,
            closed + (wobbleEnd - closed) * 0.72,
            closed + (wobbleEnd - closed) * 0.9,
            wobbleEnd,
            1,
          ],
          ease: 'easeInOut',
        }}
      />

      {/* Sparkle burst on close. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1, 0] }}
        transition={{
          duration: TOTAL,
          times: [0, closed - 0.005, closed + 0.02, closed + 0.18],
        }}
      >
        <Sparkles />
      </motion.div>

      {/* Seam + center button overlay. */}
      <div className="pointer-events-none absolute inset-0">
        <BallSeam />
      </div>

      {/* Trail glow during the fall. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0, 0, 0.5, 0],
          boxShadow: [
            'none',
            'none',
            'none',
            '0 0 16px 5px rgba(255,255,255,0.6)',
            'none',
          ],
        }}
        transition={{
          duration: TOTAL,
          times: [0, closed, wobbleEnd, wobbleEnd + (1 - wobbleEnd) * 0.5, 1],
        }}
      />
    </div>
  );
}

function Shadow() {
  const dropped = ms(T.drop);
  const closed = ms(T.drop, T.close);
  const wobbleEnd = ms(T.drop, T.close, T.wobble);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: '50%',
        top: BALL_SIZE - 6,
        width: BALL_SIZE * 0.85,
        height: 10,
        marginLeft: -(BALL_SIZE * 0.85) / 2,
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        filter: 'blur(1px)',
      }}
      initial={{ opacity: 0, scaleX: 0.4, scaleY: 0.6 }}
      animate={{
        opacity: [0, 0.55, 0.65, 0.6, 0.2, 0],
        scaleX: [0.4, 1, 1, 1.05, 0.7, 0.5],
        scaleY: [0.6, 1, 1, 1, 0.7, 0.5],
      }}
      transition={{
        duration: TOTAL,
        times: [0, dropped, closed, wobbleEnd, wobbleEnd + (1 - wobbleEnd) * 0.5, 1],
      }}
    />
  );
}

// SVG halves with shading and gloss.

function BallBottom() {
  return (
    <svg width={BALL_SIZE} height={BALL_SIZE} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <radialGradient id="bot-grad" cx="35%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>
      </defs>
      <path
        d="M2 32a30 30 0 0060 0H40a8 8 0 11-16 0H2z"
        fill="url(#bot-grad)"
        stroke="#0F172A"
        strokeWidth="2.4"
      />
      <path
        d="M11 44 C16 52, 26 56, 32 56"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function BallTop() {
  return (
    <svg width={BALL_SIZE} height={BALL_SIZE / 2} viewBox="0 0 64 32" fill="none" aria-hidden>
      <defs>
        <radialGradient id="top-grad" cx="35%" cy="55%" r="80%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="40%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>
      </defs>
      <path
        d="M2 32a30 30 0 0160 0H40a8 8 0 10-16 0H2z"
        fill="url(#top-grad)"
        stroke="#0F172A"
        strokeWidth="2.4"
      />
      <path
        d="M10 18 C14 8, 24 4, 30 4"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="20" cy="14" rx="6" ry="2.4" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}

function BallSeam() {
  return (
    <svg width={BALL_SIZE} height={BALL_SIZE} viewBox="0 0 64 64" fill="none" aria-hidden>
      <defs>
        <radialGradient id="btn-grad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </radialGradient>
      </defs>
      <line x1="2" y1="32" x2="24" y2="32" stroke="#0F172A" strokeWidth="2.4" />
      <line x1="40" y1="32" x2="62" y2="32" stroke="#0F172A" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="7" fill="url(#btn-grad)" stroke="#0F172A" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="3" fill="#0F172A" />
      <circle cx="30.5" cy="30.5" r="1" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}

function Sparkles() {
  return (
    <svg
      width={BALL_SIZE * 1.6}
      height={BALL_SIZE * 1.6}
      viewBox="0 0 160 160"
      style={{ position: 'absolute', left: -BALL_SIZE * 0.3, top: -BALL_SIZE * 0.3 }}
      aria-hidden
    >
      {[
        { x: 18, y: 30, r: 2.2 },
        { x: 138, y: 28, r: 1.8 },
        { x: 28, y: 130, r: 1.6 },
        { x: 132, y: 124, r: 2 },
        { x: 80, y: 8, r: 2.4 },
        { x: 80, y: 152, r: 1.6 },
      ].map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FEF3C7" opacity="0.95" />
      ))}
    </svg>
  );
}
