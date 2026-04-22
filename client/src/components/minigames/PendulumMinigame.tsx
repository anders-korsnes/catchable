import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getDifficultyBucket } from '../../lib/catch-difficulty';
import { ThrowButton } from './PokeballThrow';
import { FLASH_MS, MISS_FLASH_MS, type MinigameProps } from './types';

const FIELD_W = 240;
const FIELD_H = 220;
const PIVOT_X = FIELD_W / 2;
const PIVOT_Y = 18;
const STRING_LEN = 150;
const BALL_R = 18;
const MAX_ANGLE = 55;
const MAX_RAD = (MAX_ANGLE * Math.PI) / 180;

interface Tuning {
  zoneDeg: number;
  periodMs: number;
}

function tuningFor(baseExperience: number | null | undefined): Tuning {
  switch (getDifficultyBucket(baseExperience)) {
    case 'easy':
      return { zoneDeg: 18, periodMs: 1600 };
    case 'medium':
      return { zoneDeg: 12, periodMs: 1300 };
    case 'hard':
      return { zoneDeg: 7, periodMs: 1050 };
    case 'legendary':
      return { zoneDeg: 4, periodMs: 850 };
  }
}

export function PendulumMinigame({ pokemon, onResult }: MinigameProps) {
  const tuning = useMemo(() => tuningFor(pokemon.baseExperience), [pokemon.baseExperience]);
  const [feedback, setFeedback] = useState<'idle' | 'hit' | 'miss'>('idle');

  const ballGroupRef = useRef<SVGGElement>(null);
  const stringRef = useRef<SVGLineElement>(null);
  const angleRef = useRef(0);
  const isThrowingRef = useRef(false);
  const runningRef = useRef(true);
  const phaseRef = useRef(Math.random() * Math.PI * 2);

  useEffect(() => {
    let frame = 0;
    const startTime = performance.now();
    const omega = (2 * Math.PI) / tuning.periodMs;

    const tick = (now: number) => {
      if (runningRef.current) {
        const t = now - startTime;
        const angle = MAX_RAD * Math.sin(omega * t + phaseRef.current);
        angleRef.current = angle;

        const bx = PIVOT_X + Math.sin(angle) * STRING_LEN;
        const by = PIVOT_Y + Math.cos(angle) * STRING_LEN;

        const grp = ballGroupRef.current;
        if (grp) grp.setAttribute('transform', `translate(${bx}, ${by})`);
        const str = stringRef.current;
        if (str) {
          str.setAttribute('x2', String(bx));
          str.setAttribute('y2', String(by));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [tuning.periodMs]);

  const handleThrow = () => {
    if (isThrowingRef.current) return;
    isThrowingRef.current = true;
    runningRef.current = false;
    const angleDeg = (angleRef.current * 180) / Math.PI;
    const hit = Math.abs(angleDeg) <= tuning.zoneDeg;
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

  const zoneRad = (tuning.zoneDeg * Math.PI) / 180;
  const lx = PIVOT_X + Math.sin(-zoneRad) * STRING_LEN;
  const ly = PIVOT_Y + Math.cos(-zoneRad) * STRING_LEN;
  const rx = PIVOT_X + Math.sin(zoneRad) * STRING_LEN;
  const ry = PIVOT_Y + Math.cos(zoneRad) * STRING_LEN;
  const arcPath = `M ${PIVOT_X} ${PIVOT_Y} L ${lx} ${ly} A ${STRING_LEN} ${STRING_LEN} 0 0 1 ${rx} ${ry} Z`;

  const flx = PIVOT_X + Math.sin(-MAX_RAD) * STRING_LEN;
  const fly = PIVOT_Y + Math.cos(-MAX_RAD) * STRING_LEN;
  const frx = PIVOT_X + Math.sin(MAX_RAD) * STRING_LEN;
  const fry = PIVOT_Y + Math.cos(MAX_RAD) * STRING_LEN;

  const initBx = PIVOT_X;
  const initBy = PIVOT_Y + STRING_LEN;

  return (
    <>
      <div className="relative flex flex-shrink-0 items-center justify-center">
        <div
          className={`relative overflow-hidden rounded-2xl border-[3px] border-ink bg-bg shadow-inner ${
            feedback === 'miss' ? 'animate-shake' : ''
          }`}
          style={{ width: FIELD_W, height: FIELD_H }}
          aria-hidden
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gb-dotmatrix bg-gb-dotmatrix opacity-[0.16]"
          />

          {pokemon.imageUrl && (
            <img
              src={pokemon.imageUrl}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 m-auto h-20 w-20 select-none object-contain opacity-40 drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
              draggable={false}
            />
          )}

          <svg
            width={FIELD_W}
            height={FIELD_H}
            viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
            className="absolute inset-0"
          >
            {/* Swing arc guide */}
            <path
              d={`M ${flx} ${fly} A ${STRING_LEN} ${STRING_LEN} 0 0 1 ${frx} ${fry}`}
              fill="none"
              stroke="rgba(15,23,42,0.15)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />

            {/* Sweet zone */}
            <path d={arcPath} fill="rgba(34,197,94,0.25)" stroke="none" />
            <line x1={PIVOT_X} y1={PIVOT_Y} x2={lx} y2={ly} stroke="#16A34A" strokeWidth={2} strokeDasharray="4 3" />
            <line x1={PIVOT_X} y1={PIVOT_Y} x2={rx} y2={ry} stroke="#16A34A" strokeWidth={2} strokeDasharray="4 3" />
            <path
              d={`M ${lx} ${ly} A ${STRING_LEN} ${STRING_LEN} 0 0 1 ${rx} ${ry}`}
              fill="none"
              stroke="#16A34A"
              strokeWidth={3}
            />

            {/* Pivot */}
            <circle cx={PIVOT_X} cy={PIVOT_Y} r={5} fill="#0F172A" />

            {/* String */}
            <line
              ref={stringRef}
              x1={PIVOT_X}
              y1={PIVOT_Y}
              x2={initBx}
              y2={initBy}
              stroke="#0F172A"
              strokeWidth={2}
            />

            {/* Ball group, translated per frame; local origin at (0,0). */}
            <g ref={ballGroupRef} transform={`translate(${initBx}, ${initBy})`}>
              <circle r={BALL_R} fill="#FFFFFF" stroke="#0F172A" strokeWidth={2.4} />
              <clipPath id="pend-ball-clip">
                <circle r={BALL_R} />
              </clipPath>
              <g clipPath="url(#pend-ball-clip)">
                <rect x={-BALL_R} y={-BALL_R} width={BALL_R * 2} height={BALL_R} fill="#EF4444" />
                <line x1={-BALL_R} y1={0} x2={BALL_R} y2={0} stroke="#0F172A" strokeWidth={2} />
              </g>
              <circle r={5} fill="#FFFFFF" stroke="#0F172A" strokeWidth={2} />
              <circle r={2} fill="#0F172A" />
            </g>
          </svg>

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
