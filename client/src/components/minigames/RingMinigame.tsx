import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getArcSizeByExperience } from '../../lib/catch-difficulty';
import { ThrowButton } from './PokeballThrow';
import { FLASH_MS, MISS_FLASH_MS, type MinigameProps } from './types';

const RING_SIZE = 240;
const RING_RADIUS = 100;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ROTATION_MS = 1000;

/**
 * Rotating-indicator minigame (the "classic"). A dot sweeps clockwise around
 * a ring; the player must throw when it crosses a small green sweet-spot
 * arc. On throw the indicator freezes at its current position so the result
 * is visually unambiguous.
 *
 * Difficulty (per the catch-difficulty tier) determines `arcSize` — the
 * smaller it is, the tighter the timing window.
 */
export function RingMinigame({ pokemon, onResult }: MinigameProps) {
  const arcSize = useMemo(() => getArcSizeByExperience(pokemon.baseExperience), [pokemon.baseExperience]);
  const [arcStart] = useState(() => Math.random() * 360);
  const [feedback, setFeedback] = useState<'idle' | 'hit' | 'miss'>('idle');

  const indicatorRef = useRef<SVGGElement>(null);
  const angleRef = useRef(0);
  const isThrowingRef = useRef(false);
  const runningRef = useRef(true);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const speed = 360 / ROTATION_MS;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (runningRef.current) {
        angleRef.current = (angleRef.current + dt * speed) % 360;
        const el = indicatorRef.current;
        if (el) {
          el.setAttribute(
            'transform',
            `rotate(${angleRef.current} ${RING_SIZE / 2} ${RING_SIZE / 2})`,
          );
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleThrow = () => {
    if (isThrowingRef.current) return;
    isThrowingRef.current = true;
    runningRef.current = false;
    const angle = angleRef.current;
    const delta = ((angle - arcStart) % 360 + 360) % 360;
    const hit = delta <= arcSize;
    if (hit) {
      setFeedback('hit');
      setTimeout(() => onResult('caught'), FLASH_MS);
    } else {
      setFeedback('miss');
      setTimeout(() => onResult('fled'), MISS_FLASH_MS);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleThrow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const arcDash = (arcSize / 360) * CIRCUMFERENCE;

  return (
    <>
      <div className="relative flex flex-shrink-0 items-center justify-center">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className={feedback === 'miss' ? 'animate-shake' : ''}
          aria-hidden
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="#CBD5E1"
            strokeWidth={STROKE}
            fill="none"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke="#22C55E"
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={`${arcDash} ${CIRCUMFERENCE}`}
            transform={`rotate(${arcStart - 90} ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180);
            const x1 = RING_SIZE / 2 + Math.cos(a) * (RING_RADIUS - STROKE / 2 - 2);
            const y1 = RING_SIZE / 2 + Math.sin(a) * (RING_RADIUS - STROKE / 2 - 2);
            const x2 = RING_SIZE / 2 + Math.cos(a) * (RING_RADIUS - STROKE / 2 - 8);
            const y2 = RING_SIZE / 2 + Math.sin(a) * (RING_RADIUS - STROKE / 2 - 8);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(15,23,42,0.3)" strokeWidth={1.5} />
            );
          })}
          <g ref={indicatorRef}>
            <line
              x1={RING_SIZE / 2}
              y1={RING_SIZE / 2 - RING_RADIUS - STROKE / 2 - 4}
              x2={RING_SIZE / 2}
              y2={RING_SIZE / 2 - RING_RADIUS + STROKE / 2 + 4}
              stroke="#0F172A"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2 - RING_RADIUS - 8} r={5} fill="#0F172A" />
          </g>
        </svg>

        {pokemon.imageUrl && (
          <img
            src={pokemon.imageUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute h-24 w-24 select-none object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
            draggable={false}
          />
        )}

        {feedback === 'hit' && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute rounded-full"
            style={{
              width: RING_SIZE,
              height: RING_SIZE,
              border: '6px solid #22C55E',
              boxShadow: '0 0 36px 12px rgba(34,197,94,0.65)',
            }}
            initial={{ opacity: 0.95, scale: 0.95 }}
            animate={{ opacity: 0, scale: 1.45 }}
            transition={{ duration: FLASH_MS / 1000, ease: 'easeOut' }}
          />
        )}

        {feedback === 'hit' && <FeedbackBadge variant="hit" label="CAUGHT!" />}
        {feedback === 'miss' && <FeedbackBadge variant="miss" label="FLED!" />}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <ThrowButton onClick={handleThrow} disabled={feedback !== 'idle'} />
      </div>
    </>
  );
}

function FeedbackBadge({ variant, label }: { variant: 'hit' | 'miss'; label: string }) {
  const cls =
    variant === 'hit'
      ? 'border-like text-like'
      : 'border-pokered text-pokered';
  return (
    <div className={`pixel-text pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-md border-2 bg-white px-3 py-1 text-[11px] shadow-md ${cls}`}>
      {label}
    </div>
  );
}
