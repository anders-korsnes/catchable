// Canonical Pokémon type color palette. Kept here (rather than only in
// tailwind.config.ts) so JS code that needs the raw hex — gradients, shadows,
// dynamic backgrounds — can read it without parsing Tailwind classes.

export const TYPE_COLOR: Readonly<Record<string, string>> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

const FALLBACK = '#78716C';

export function colorForType(type: string | undefined | null): string {
  if (!type) return FALLBACK;
  return TYPE_COLOR[type.toLowerCase()] ?? FALLBACK;
}

/** Slightly darker shade for borders / highlights of the same type. */
export function darkerForType(type: string | undefined | null): string {
  const hex = colorForType(type);
  return shade(hex, -0.22);
}

/** Slightly lighter shade for inner panels of the same type. */
export function lighterForType(type: string | undefined | null): string {
  const hex = colorForType(type);
  return shade(hex, 0.18);
}

function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1]!, 16);
  const r = clamp((num >> 16) & 0xff, amount);
  const g = clamp((num >> 8) & 0xff, amount);
  const b = clamp(num & 0xff, amount);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function clamp(channel: number, amount: number): number {
  if (amount >= 0) return Math.min(255, Math.round(channel + (255 - channel) * amount));
  return Math.max(0, Math.round(channel * (1 + amount)));
}

/**
 * Build a CSS background that reads as an "environment" for the Pokémon —
 * stacked radial gradients in the type colors plus a soft vignette. The
 * primary type drives the dominant hue; the secondary type (if any) seeds
 * an accent orb so dual-types feel different from mono-types.
 */
export function environmentBackground(
  primary: string | undefined,
  secondary?: string | undefined,
): string {
  const base = colorForType(primary);
  const light = lighterForType(primary);
  const dark = darkerForType(primary);
  const accent = secondary ? colorForType(secondary) : lighterForType(primary);
  const accentLight = secondary ? lighterForType(secondary) : light;

  // Order matters: first listed gradient is on top.
  return [
    `radial-gradient(circle at 22% 18%, ${withAlpha(accentLight, 0.85)} 0%, ${withAlpha(accentLight, 0)} 45%)`,
    `radial-gradient(circle at 82% 78%, ${withAlpha(accent, 0.75)} 0%, ${withAlpha(accent, 0)} 55%)`,
    `radial-gradient(circle at 50% 110%, ${withAlpha(dark, 0.7)} 0%, ${withAlpha(dark, 0)} 60%)`,
    `linear-gradient(160deg, ${withAlpha(light, 0.95)} 0%, ${base} 55%, ${dark} 100%)`,
  ].join(', ');
}

/** Same idea, but wider and softer — for backgrounds behind smaller Pokédex tiles. */
export function tileEnvironmentBackground(
  primary: string | undefined,
  secondary?: string | undefined,
): string {
  const base = colorForType(primary);
  const light = lighterForType(primary);
  const dark = darkerForType(primary);
  const accent = secondary ? colorForType(secondary) : lighterForType(primary);

  return [
    `radial-gradient(circle at 30% 20%, ${withAlpha(light, 0.9)} 0%, ${withAlpha(light, 0)} 55%)`,
    `radial-gradient(circle at 80% 85%, ${withAlpha(accent, 0.7)} 0%, ${withAlpha(accent, 0)} 60%)`,
    `linear-gradient(165deg, ${base} 0%, ${dark} 100%)`,
  ].join(', ');
}

function withAlpha(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1]!, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
