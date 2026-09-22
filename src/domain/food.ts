import type { ImageSourcePropType } from 'react-native';

import type { FoodId, PetId } from './types';

export interface FoodDefinition {
  id: FoodId;
  label: string;
  emoji: string;
  /** Illustrated icon, when one exists — preferred over the emoji wherever it is shown. */
  image?: ImageSourcePropType;
  hungerRestore: number;
  /** Pets that consider this their favorite food (extra hunger + happy reaction). */
  favoriteOf: PetId[];
  /** Pets that outright refuse it (e.g. a dog treat offered to a cat). */
  refusedBy: PetId[];
}

export const FOODS: Record<FoodId, FoodDefinition> = {
  tuna: {
    id: 'tuna',
    label: 'Тунец',
    emoji: '🐟',
    image: require('../../assets/images/items/toy-fish.png'),
    hungerRestore: 20,
    favoriteOf: ['cat1'],
    refusedBy: [],
  },
  wet_cat_food: {
    id: 'wet_cat_food',
    label: 'Кошачий корм',
    emoji: '🥫',
    image: require('../../assets/images/items/food-cat-pouch.png'),
    hungerRestore: 20,
    favoriteOf: ['cat2'],
    refusedBy: ['dog'],
  },
  dog_treat: {
    id: 'dog_treat',
    label: 'Собачье лакомство',
    emoji: '🦴',
    image: require('../../assets/images/items/food-bone-biscuit.png'),
    hungerRestore: 20,
    favoriteOf: ['dog'],
    refusedBy: ['cat1', 'cat2'],
  },
  veggie_snack: {
    id: 'veggie_snack',
    label: 'Овощная закуска',
    emoji: '🥕',
    image: require('../../assets/images/items/food-carrot.png'),
    hungerRestore: 12,
    favoriteOf: [],
    refusedBy: [],
  },
  treat: {
    id: 'treat',
    label: 'Печенье',
    emoji: '🍪',
    image: require('../../assets/images/items/food-paw-cookie.png'),
    hungerRestore: 15,
    favoriteOf: [],
    refusedBy: [],
  },
};

export const FOOD_ORDER: FoodId[] = ['tuna', 'wet_cat_food', 'dog_treat', 'veggie_snack', 'treat'];

export const FAVORITE_HUNGER_BONUS = 10;

export function foodReactionFor(petId: PetId, foodId: FoodId): 'favorite' | 'refused' | 'normal' {
  const food = FOODS[foodId];
  if (food.favoriteOf.includes(petId)) return 'favorite';
  if (food.refusedBy.includes(petId)) return 'refused';
  return 'normal';
}
