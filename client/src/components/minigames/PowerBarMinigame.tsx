import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getDifficultyBucket } from '../../lib/catch-difficulty';
import { ThrowButton } from './PokeballThrow';
import { FLASH_MS, MISS_FLASH_MS, type MinigameProps } from './types';

const BAR_W = 44;
const BAR_H = 200;
const INSET = 4;

interface BarTuning {
  zonePct: number;
  cycleMs: number;
}

function tuningFor(baseExperience: number | null | undefined): BarTuning {
  switch (getDifficultyBucket(baseExperience)) {
    case 'easy':
      return { zonePct: 28, cycleMs: 1100 };
    case 'medium':
      return { zonePct: 16, cycleMs: 850 };
    case 'hard':
      return { zonePct: 8, cycleMs: 650 };
    case 'legendary':
      return { zonePct: 4, cycleMs: 480 };
  }
}

export function PowerBarMinigame({ pokemon, onResult }: MinigameProps) {
  const { zonePct, cycleMs } = useMemo(() => tuningFor(pokemon.baseExperience), [pokemon.baseExperience]);
  const [feedback, setFeedback] = useState<'idle' | 'hit' | 'miss'>('idle');

  const fillRef = useRef<SVGRectElement>(null);
  const cursorRef = useRef<SVGLineElement>(null);
  const pctRef = useRef(0);
  const isThrowingRef = useRef(false);
  const runningRef = useRef(true);

  const trackX = INSET;
  const trackW = BAR_W - INSET * 2;
  const trackY = INSET;
  const trackH = BAR_H - INSET * 2;

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const speed = 200 / cycleMs;
    let goingUp = true;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (runningRef.current) {
        if (goingUp) {
          pctRef.current += dt * speed;
          if (pctRef.current >= 100) {
            pctRef.current = 100 - (pctRef.current - 100);
            goingUp = false;
          }
        } else {
          pctRef.current -= dt * speed;
          if (pctRef.current <= 0) {
            pctRef.current = -pctRef.current;
            goingUp = true;
          }
        }
        const fillH = (pctRef.current / 100) * trackH;
        const fillY = trackY + trackH - fillH;
        const fill = fillRef.current;
        if (fill) {
          fill.setAttribute('y', String(fillY));
          fill.setAttribute('height', String(fillH));
        }
        const cursor = cursorRef.current;
        if (cursor) {
          cursor.setAttribute('y1', String(fillY));
          cursor.setAttribute('y2', String(fillY));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleThrow = () => {
    if (isThrowingRef.current) return;
    isThrowingRef.current = true;
    runningRef.current = false;
    const pct = pctRef.current;
    const hit = pct >= 100 - zonePct && pct <= 100;
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

  // Zone geometry in SVG coordinates.
  const zoneH = (zonePct / 100) * trackH;
  const zoneY = trackY;

  return (
    <>
      <div className="relative flex flex-shrink-0 flex-col items-center gap-3">
        {pokemon.imageUrl && (
          <img
            src={pokemon.imageUrl}
            alt=""
            aria-hidden
            className="pointer-events-none h-20 w-20 select-none object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]"
            draggable={false}
          />
        )}

        <div
          className={`relative ${feedback === 'miss' ? 'animate-shake' : ''}`}
          style={{ width: BAR_W, height: BAR_H }}
          aria-hidden
        >
          <svg
            width={BAR_W}
            height={BAR_H}
            viewBox={`0 0 ${BAR_W} ${BAR_H}`}
            className="absolute inset-0"
          >
            {/* Chassis background */}
            <rect
              x={0} y={0} width={BAR_W} height={BAR_H}
              rx={10} ry={10}
              fill="#E2E8F0"
              stroke="#0F172A"
              strokeWidth={3}
            />

            {/* Track background (inner area) */}
            <rect
              x={trackX} y={trackY} width={trackW} height={trackH}
              rx={6} ry={6}
              fill="#CBD5E1"
            />

            {/* Catch zone — highlighted band near the top */}
            <rect
              x={trackX} y={zoneY} width={trackW} height={zoneH}
              rx={6} ry={6}
              fill="rgba(34,197,94,0.3)"
            />
            {/* Zone threshold line */}
            <line
              x1={trackX} y1={zoneY + zoneH}
              x2={trackX + trackW} y2={zoneY + zoneH}
              stroke="#16A34A"
              strokeWidth={2.5}
            />

            {/* Moving fill */}
            <rect
              ref={fillRef}
              x={trackX} y={trackY + trackH}
              width={trackW} height={0}
              rx={6} ry={6}
              fill="#22C55E"
            />

            {/* Cursor line — bright top edge of the fill */}
            <line
              ref={cursorRef}
              x1={trackX - 1} y1={trackY + trackH}
              x2={trackX + trackW + 1} y2={trackY + trackH}
              stroke="#FFFFFF"
              strokeWidth={3}
              strokeLinecap="round"
            />
          </svg>

          {feedback === 'hit' && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[10px]"
              style={{
                border: '4px solid #22C55E',
                boxShadow: '0 0 28px 8px rgba(34,197,94,0.6)',
              }}
              initial={{ opacity: 0.95, scale: 0.96 }}
              animate={{ opacity: 0, scale: 1.15 }}
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
