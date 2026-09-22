import type { BondLevel } from './types';

export const BOND_LEVEL_NAMES: Record<BondLevel, string> = {
  1: 'Знакомый',
  2: 'Друг',
  3: 'Близкий друг',
  4: 'Лучший друг',
  5: 'Семья',
};

/** Bond points required to advance out of each level, tuned so level 5 takes weeks, not a day. */
const BOND_THRESHOLD = 80;

export function applyBondDelta(bond: number, bondLevel: BondLevel, delta: number): { bond: number; bondLevel: BondLevel } {
  if (delta === 0 || bondLevel === 5) return { bond, bondLevel };
  let nextBond = bond + delta;
  let nextLevel: BondLevel = bondLevel;
  if (nextBond >= BOND_THRESHOLD && nextLevel < 5) {
    nextBond -= BOND_THRESHOLD;
    nextLevel = (nextLevel + 1) as BondLevel;
  }
  return { bond: Math.max(0, nextBond), bondLevel: nextLevel };
}

export const BOND_UNLOCKS: Record<BondLevel, string> = {
  1: 'Базовые поглаживания',
  2: 'Питомец сам подходит к вам',
  3: 'Особая анимация приветствия',
  4: 'Питомец приносит вам игрушки',
  5: 'Редкие ласковые анимации',
};
