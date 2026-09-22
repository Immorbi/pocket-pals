import type { ImageSourcePropType } from 'react-native';

import { PET_DEFINITIONS, PET_ORDER } from './petDefinitions';
import type { PetId, PetRuntimeState, Species, ToyId } from './types';

export interface ToyDefinition {
  id: ToyId;
  label: string;
  emoji: string;
  /** Illustrated icon, when one exists — preferred over the emoji wherever it is shown. */
  image?: ImageSourcePropType;
  preferredSpecies: Species[];
  funReward: number;
  attentionReward: number;
  /** Approximate mini-game duration in seconds, per Section 12-14. */
  durationSeconds: number;
  miniGame: 'yarn' | 'ball' | 'chase';
}

export const TOYS: Record<ToyId, ToyDefinition> = {
  yarn: {
    id: 'yarn',
    label: 'Клубок ниток',
    emoji: '🧶',
    image: require('../../assets/images/items/toy-yarn.png'),
    preferredSpecies: ['cat'],
    funReward: 20,
    attentionReward: 0,
    durationSeconds: 12,
    miniGame: 'yarn',
  },
  feather: {
    id: 'feather',
    label: 'Пёрышко',
    emoji: '🪶',
    image: require('../../assets/images/items/toy-feather-wand.png'),
    preferredSpecies: ['cat'],
    funReward: 15,
    attentionReward: 5,
    durationSeconds: 10,
    miniGame: 'chase',
  },
  mouse_toy: {
    id: 'mouse_toy',
    label: 'Игрушка-мышка',
    emoji: '🐭',
    image: require('../../assets/images/items/toy-mouse.png'),
    preferredSpecies: ['cat'],
    funReward: 15,
    attentionReward: 0,
    durationSeconds: 10,
    miniGame: 'chase',
  },
  laser: {
    id: 'laser',
    label: 'Лазерная указка',
    emoji: '🔴',
    preferredSpecies: ['cat'],
    funReward: 18,
    attentionReward: 0,
    durationSeconds: 10,
    miniGame: 'chase',
  },
  rope: {
    id: 'rope',
    label: 'Канат',
    emoji: '🪢',
    image: require('../../assets/images/items/toy-rope.png'),
    preferredSpecies: ['dog'],
    funReward: 22,
    attentionReward: 6,
    durationSeconds: 10,
    miniGame: 'chase',
  },
  ball: {
    id: 'ball',
    label: 'Мяч',
    emoji: '🎾',
    image: require('../../assets/images/items/toy-ball.png'),
    preferredSpecies: ['dog'],
    funReward: 20,
    attentionReward: 5,
    durationSeconds: 10,
    miniGame: 'ball',
  },
};

export const TOY_ORDER: ToyId[] = ['yarn', 'feather', 'mouse_toy', 'laser', 'ball', 'rope'];

/** Picks which pet a toy's mini-game should target: the eligible species with the lowest Fun. */
export function pickPlayTarget(toyId: ToyId, pets: Record<PetId, PetRuntimeState>): PetId {
  const toy = TOYS[toyId];
  const candidates = PET_ORDER.filter((id) => toy.preferredSpecies.includes(PET_DEFINITIONS[id].species));
  return candidates.reduce((most, id) => (pets[id].fun < pets[most].fun ? id : most), candidates[0]);
}

export function isFavoriteToy(petId: PetId, toyId: ToyId, favoriteToy: ToyId): boolean {
  return petId && toyId === favoriteToy;
}
