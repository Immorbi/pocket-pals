import type { PetDefinition } from './petDefinitions';
import { FOODS } from './food';
import { TOYS } from './toys';
import { mostUrgentNeed, tierFor } from './decay';
import type { PetRuntimeState, PetStateName, ThoughtBubbleContent } from './types';

export interface TapReaction {
  id: string;
  thought: ThoughtBubbleContent | null;
  nextState: PetStateName | null;
  bondDelta: number;
}

const DOUBLE_TAP_WINDOW_MS = 3500;
const TAP_BOND_COOLDOWN_MS = 20_000;

function thought(kind: ThoughtBubbleContent['kind'], emoji: string): ThoughtBubbleContent {
  return { kind, emoji, createdAt: Date.now() };
}

/**
 * Resolves what happens when the user taps a pet. Depends on sleep state, current need
 * tier, personality, and whether this is a rapid second tap — never the same animation twice.
 */
export function resolveTapReaction(
  pet: PetRuntimeState,
  def: PetDefinition,
  now: number = Date.now()
): TapReaction {
  const isDoubleTap = now - pet.lastTapAt < DOUBLE_TAP_WINDOW_MS;
  const bondDelta = now - pet.lastInteraction > TAP_BOND_COOLDOWN_MS ? 1 : 0;

  if (pet.isSleeping) {
    if (!isDoubleTap) {
      return { id: 'sleepy-open-eye', thought: null, nextState: null, bondDelta };
    }
    return { id: 'sleepy-annoyed', thought: thought('annoyed', '😤'), nextState: null, bondDelta };
  }

  const urgent = mostUrgentNeed(pet);
  const tier = tierFor(urgent.value);

  if (tier === 'critical' || tier === 'strongNeed') {
    if (urgent.need === 'hunger') {
      return { id: 'hungry-thought', thought: thought('food', FOODS[def.favoriteFood].emoji), nextState: 'REQUESTING_FOOD', bondDelta };
    }
    if (urgent.need === 'fun') {
      return { id: 'bored-thought', thought: thought('toy', TOYS[def.favoriteToy].emoji), nextState: 'REQUESTING_PLAY', bondDelta };
    }
    return { id: 'lonely-thought', thought: thought('heart', '🤍'), nextState: 'REQUESTING_ATTENTION', bondDelta };
  }

  if (tier === 'needsAttention' && Math.random() < 0.5) {
    if (urgent.need === 'hunger') {
      return { id: 'peckish-thought', thought: thought('food', FOODS[def.favoriteFood].emoji), nextState: null, bondDelta };
    }
    if (urgent.need === 'fun') {
      return { id: 'restless-thought', thought: thought('toy', TOYS[def.favoriteToy].emoji), nextState: null, bondDelta };
    }
    return { id: 'wanting-thought', thought: thought('heart', '🤍'), nextState: null, bondDelta };
  }

  if (isDoubleTap) {
    return { id: def.species === 'dog' ? 'dog-approach' : 'cat-purr', thought: thought('sparkle', '✨'), nextState: null, bondDelta };
  }

  // Happy/neutral single tap: personality-flavored idle acknowledgement, occasionally a
  // favorite-activity daydream even when the need isn't urgent, to keep taps varied.
  if (Math.random() < 0.15) {
    return { id: 'daydream', thought: thought('toy', TOYS[def.favoriteToy].emoji), nextState: null, bondDelta };
  }

  return { id: 'look-at-camera', thought: null, nextState: null, bondDelta };
}
