import type { PetStateName, StatePriority } from './types';

/**
 * High-priority states own the pet until they finish (the system transitions them out itself);
 * low-priority states can be freely interrupted by a user action or a higher-priority event.
 * Mirrors Section 33: eating/playing/petting/special-event outrank idle/walking/ambient/requesting.
 */
export const STATE_PRIORITY: Record<PetStateName, StatePriority> = {
  IDLE: 'low',
  WALKING: 'low',
  SITTING: 'low',
  SLEEPING: 'low',
  WAKING: 'high',
  EATING: 'high',
  PLAYING: 'high',
  REQUESTING_FOOD: 'low',
  REQUESTING_PLAY: 'low',
  REQUESTING_ATTENTION: 'low',
  PETTING: 'high',
  SPECIAL_EVENT: 'high',
  AMBIENT_EVENT: 'low',
};

/**
 * Whether a pet currently in `current` may move to `next`.
 * A sleeping pet must pass through WAKING before anything else (never "instantly eating while asleep").
 * A pet mid a high-priority action ignores external interrupts until that action completes and
 * transitions itself out (callers use `force: true` for that self-completion).
 */
export function canEnterState(current: PetStateName, next: PetStateName, force = false): boolean {
  if (force) return true;
  if (current === next) return true;
  if (current === 'SLEEPING') return next === 'WAKING';
  if (STATE_PRIORITY[current] === 'high') return false;
  return true;
}
