/**
 * Shared "throw" button artwork + keyboard helper. Each minigame embeds its
 * own throw button (positioning differs per game), but they all use this
 * Poké Ball SVG so the action reads as the same gesture across variants.
 */

interface ThrowButtonProps {
  onClick: () => void;
  disabled?: boolean;
  hint?: string;
  ariaLabel?: string;
}

export function ThrowButton({
  onClick,
  disabled = false,
  hint = 'SPACE',
  ariaLabel = 'Throw Poké Ball',
}: ThrowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="focus-ring group relative flex h-16 w-16 items-center justify-center rounded-full shadow-device transition active:translate-y-px active:scale-95 disabled:opacity-60"
    >
      <PokeballArt />
      {hint && (
        <span className="pixel-text absolute -bottom-5 text-[8px] tracking-[0.25em] text-ink-muted">
          {hint}
        </span>
      )}
    </button>
  );
}

function PokeballArt() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden>
      <defs>
        <radialGradient id="thr-top" cx="35%" cy="55%" r="80%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="50%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </radialGradient>
        <radialGradient id="thr-bot" cx="35%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill="url(#thr-bot)" stroke="#0F172A" strokeWidth="2.4" />
      <path
        d="M3 32 A29 29 0 0 1 61 32 Z"
        fill="url(#thr-top)"
        stroke="#0F172A"
        strokeWidth="2.4"
      />
      <line x1="3" y1="32" x2="24" y2="32" stroke="#0F172A" strokeWidth="2.4" />
      <line x1="40" y1="32" x2="61" y2="32" stroke="#0F172A" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="7" fill="#F1F5F9" stroke="#0F172A" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="3" fill="#0F172A" />
      <circle cx="30.5" cy="30.5" r="1" fill="rgba(255,255,255,0.85)" />
    </svg>
  );
}
