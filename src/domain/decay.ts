import type { PetDefinition } from './petDefinitions';
import type { PetRuntimeState } from './types';

/** Base decay rates, in points per real-world hour. Section 4. */
export const BASE_DECAY_PER_HOUR = {
  hunger: -5,
  fun: -3,
  attention: -2,
};

/** Energy is not a flat hourly rate: it depends on activity, handled separately below. */
export const ENERGY_DRAIN_PER_HOUR_ACTIVE = -8;
export const ENERGY_RESTORE_PER_HOUR_SLEEPING = 25;
export const ENERGY_DRIFT_PER_HOUR_IDLE = -2;

export function clampStat(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Applies real-world elapsed time to a pet's needs. Pure function so it can run identically
 * on a live tick and on the large "how long was I away" catch-up at app open.
 */
export function applyDecay(
  pet: PetRuntimeState,
  def: PetDefinition,
  elapsedMs: number
): PetRuntimeState {
  if (elapsedMs <= 0) return pet;
  const hours = elapsedMs / 3_600_000;

  const hunger = clampStat(pet.hunger + BASE_DECAY_PER_HOUR.hunger * def.decayMultipliers.hunger * hours);
  const fun = clampStat(pet.fun + BASE_DECAY_PER_HOUR.fun * def.decayMultipliers.fun * hours);
  const attention = clampStat(
    pet.attention + BASE_DECAY_PER_HOUR.attention * def.decayMultipliers.attention * hours
  );

  let energyRate: number;
  if (pet.isSleeping) {
    energyRate = ENERGY_RESTORE_PER_HOUR_SLEEPING;
  } else if (pet.currentState === 'PLAYING' || pet.currentState === 'WALKING') {
    energyRate = ENERGY_DRAIN_PER_HOUR_ACTIVE;
  } else {
    energyRate = ENERGY_DRIFT_PER_HOUR_IDLE;
  }
  const energy = clampStat(pet.energy + energyRate * hours);

  return { ...pet, hunger, fun, attention, energy };
}

/** Which of the 5 behavioral tiers (Section 5) a stat value falls into. */
export type NeedTier = 'happy' | 'neutral' | 'needsAttention' | 'strongNeed' | 'critical';

export function tierFor(value: number): NeedTier {
  if (value >= 70) return 'happy';
  if (value >= 40) return 'neutral';
  if (value >= 20) return 'needsAttention';
  if (value >= 1) return 'strongNeed';
  return 'critical';
}

/** The pet's most urgent need right now, used to bias behavior/events/thought bubbles. */
export function mostUrgentNeed(pet: PetRuntimeState): { need: 'hunger' | 'fun' | 'attention'; value: number } {
  const candidates: { need: 'hunger' | 'fun' | 'attention'; value: number }[] = [
    { need: 'hunger', value: pet.hunger },
    { need: 'fun', value: pet.fun },
    { need: 'attention', value: pet.attention },
  ];
  return candidates.reduce((worst, c) => (c.value < worst.value ? c : worst));
}
