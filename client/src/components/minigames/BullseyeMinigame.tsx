import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getDifficultyBucket } from '../../lib/catch-difficulty';
import { ThrowButton } from './PokeballThrow';
import { FLASH_MS, MISS_FLASH_MS, type MinigameProps } from './types';

const FIELD_SIZE = 240;
const CENTER = FIELD_SIZE / 2;
const MARKER_SIZE = 32;
const HALF_MARKER = MARKER_SIZE / 2;

// Fixed reticle ring radii (decorative guide circles drawn on the field).
const RING_OUTER = 110;
const RING_MID = 80;
const RING_INNER = 52;
const RING_SMALL = 26;
const RING_TINY = 13;

interface Tuning {
  hitRadius: number;
  drift: number;
}

// Constant speed & sway for all difficulties — only the green zone shrinks.
const SWAY_SPEED = 2.0;
const DRIFT_BASE = 106;

function tuningFor(baseExperience: number | null | undefined): Tuning {
  switch (getDifficultyBucket(baseExperience)) {
    case 'easy':
      return { hitRadius: RING_INNER, drift: DRIFT_BASE };
    case 'medium':
      return { hitRadius: RING_SMALL, drift: DRIFT_BASE };
    case 'hard':
      return { hitRadius: RING_TINY, drift: DRIFT_BASE };
    case 'legendary':
      return { hitRadius: RING_TINY, drift: DRIFT_BASE };
  }
}

/**
 * Bullseye minigame. A target reticle sits at the centre of the play field;
 * a Poké Ball marker drifts in smooth, breath-like figure-of-eight curves
 * (layered sine waves). The player freezes it with a throw — catch only if
 * the marker's centre is inside the green bullseye ring.
 *
 * The green zone corresponds to one of the fixed concentric reticle circles,
 * so the player can see exactly what they're aiming for.
 */
export function BullseyeMinigame({ pokemon, onResult }: MinigameProps) {
  const tuning = useMemo(() => tuningFor(pokemon.baseExperience), [pokemon.baseExperience]);
  const [feedback, setFeedback] = useState<'idle' | 'hit' | 'miss'>('idle');

  const markerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: CENTER, y: CENTER });
  const isThrowingRef = useRef(false);
  const runningRef = useRef(true);

  const phasesRef = useRef({
    px1: Math.random() * Math.PI * 2,
    py1: Math.random() * Math.PI * 2,
    px2: Math.random() * Math.PI * 2,
    py2: Math.random() * Math.PI * 2,
    px3: Math.random() * Math.PI * 2,
    py3: Math.random() * Math.PI * 2,
    px4: Math.random() * Math.PI * 2,
    py4: Math.random() * Math.PI * 2,
  });

  useEffect(() => {
    let frame = 0;
    const p = phasesRef.current;
    const { drift } = tuning;
    const startTime = performance.now();
    const maxR = CENTER - HALF_MARKER - 4;

    const tick = (now: number) => {
      if (runningRef.current) {
        const t = ((now - startTime) / 1000) * SWAY_SPEED;

        let x =
          CENTER +
          drift *
            (0.35 * Math.sin(t * 1.0 + p.px1) +
             0.25 * Math.sin(t * 1.7 + p.px2) +
             0.22 * Math.sin(t * 3.1 + p.px3) +
             0.18 * Math.sin(t * 5.3 + p.px4));
        let y =
          CENTER +
          drift *
            (0.35 * Math.sin(t * 1.3 + p.py1) +
             0.25 * Math.sin(t * 2.1 + p.py2) +
             0.22 * Math.sin(t * 3.7 + p.py3) +
             0.18 * Math.sin(t * 5.9 + p.py4));

        const dx = x - CENTER;
        const dy = y - CENTER;
        const dist = Math.hypot(dx, dy);
        if (dist > maxR) {
          x = CENTER + (dx / dist) * maxR;
          y = CENTER + (dy / dist) * maxR;
        }

        posRef.current = { x, y };
        const el = markerRef.current;
        if (el) {
          el.style.transform = `translate(${x - HALF_MARKER}px, ${y - HALF_MARKER}px)`;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tuning]);

  const handleThrow = () => {
    if (isThrowingRef.current) return;
    isThrowingRef.current = true;
    runningRef.current = false;
    const { x, y } = posRef.current;
    const dist = Math.hypot(x - CENTER, y - CENTER);
    // Hit if any part of the ball overlaps the green zone (not just its center).
    const hit = dist - HALF_MARKER <= tuning.hitRadius;
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

  // Reticle rings — all five are always drawn, but only the one matching
  // this difficulty tier gets the green fill.
  const allRings = [RING_OUTER, RING_MID, RING_INNER, RING_SMALL, RING_TINY];

  return (
    <>
      <div className="relative flex flex-shrink-0 items-center justify-center">
        <div
          className={`relative overflow-hidden rounded-2xl border-[3px] border-ink bg-bg shadow-inner ${
            feedback === 'miss' ? 'animate-shake' : ''
          }`}
          style={{ width: FIELD_SIZE, height: FIELD_SIZE }}
          aria-hidden
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gb-dotmatrix bg-gb-dotmatrix opacity-[0.16]"
          />

          <svg
            width={FIELD_SIZE}
            height={FIELD_SIZE}
            viewBox={`0 0 ${FIELD_SIZE} ${FIELD_SIZE}`}
            className="absolute inset-0"
            aria-hidden
          >
            {allRings.map((r) => {
              const isHitZone = r === tuning.hitRadius;
              return (
                <circle
                  key={r}
                  cx={CENTER}
                  cy={CENTER}
                  r={r}
                  fill={isHitZone ? 'rgba(34,197,94,0.30)' : 'none'}
                  stroke={isHitZone ? '#16A34A' : 'rgba(15,23,42,0.30)'}
                  strokeWidth={isHitZone ? 3 : 1.5}
                  strokeDasharray={isHitZone ? undefined : '4 4'}
                />
              );
            })}
            {/* Crosshair */}
            <line x1={CENTER} y1={10} x2={CENTER} y2={FIELD_SIZE - 10} stroke="rgba(15,23,42,0.20)" strokeWidth={1} />
            <line x1={10} y1={CENTER} x2={FIELD_SIZE - 10} y2={CENTER} stroke="rgba(15,23,42,0.20)" strokeWidth={1} />
          </svg>

          {pokemon.imageUrl && (
            <img
              src={pokemon.imageUrl}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 m-auto h-20 w-20 select-none object-contain opacity-50 drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
              draggable={false}
            />
          )}

          <div
            ref={markerRef}
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: MARKER_SIZE, height: MARKER_SIZE }}
          >
            <MarkerBall />
          </div>

          {feedback === 'hit' && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                border: '6px solid #22C55E',
                boxShadow: '0 0 36px 12px rgba(34,197,94,0.65)',
              }}
              initial={{ opacity: 0.95 }}
              animate={{ opacity: 0 }}
              transition={{ duration: FLASH_MS / 1000, ease: 'easeOut' }}
            />
          )}
        </div>

        {feedback !== 'idle' && (
          <div
            className={`pixel-text pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border-2 bg-white px-3 py-1 text-[11px] shadow-md ${
              feedback === 'hit' ? 'border-like text-like' : 'border-pokered text-pokered'
            }`}
          >
            {feedback === 'hit' ? 'CAUGHT!' : 'FLED!'}
          </div>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <ThrowButton onClick={handleThrow} disabled={feedback !== 'idle'} />
      </div>
    </>
  );
}

function MarkerBall() {
  return (
    <svg viewBox="0 0 32 32" width={MARKER_SIZE} height={MARKER_SIZE} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
      <path d="M2 16 A14 14 0 0 1 30 16 Z" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
      <line x1="2" y1="16" x2="11" y2="16" stroke="#0F172A" strokeWidth="2" />
      <line x1="21" y1="16" x2="30" y2="16" stroke="#0F172A" strokeWidth="2" />
      <circle cx="16" cy="16" r="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
      <circle cx="16" cy="16" r="1.6" fill="#0F172A" />
    </svg>
  );
}
