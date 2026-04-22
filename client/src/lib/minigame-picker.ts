import type { MinigameKind } from '../components/minigames/types';

const ALL_MINIGAMES: MinigameKind[] = ['ring', 'power-bar', 'bullseye', 'pendulum'];

/** Pick a random minigame per encounter. */
export function pickMinigame(_types: readonly string[]): MinigameKind {
  return ALL_MINIGAMES[Math.floor(Math.random() * ALL_MINIGAMES.length)];
}
