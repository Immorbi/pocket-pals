import type { ImageSourcePropType } from 'react-native';

import type { PetPlayStyle } from './checkers';
import type { FoodId, PetId, Species, ToyId } from './types';

export interface PetDefinition {
  id: PetId;
  name: string;
  /** Genitive case ("для кого?") — used in UI sentences like "для Леи". */
  nameGenitive: string;
  /** Instrumental case ("с кем?") — used in UI sentences like "игра с Леей". */
  nameInstrumental: string;
  gender: 'f' | 'm';
  species: Species;
  personality: string[];
  favoriteFood: FoodId;
  favoriteToy: ToyId;
  /** How this one plays checkers — the same temperament as the personality above. */
  checkersStyle: PetPlayStyle;
  /** Multiplies the base hourly decay rate for this pet's standout need. */
  decayMultipliers: {
    hunger: number;
    fun: number;
    attention: number;
  };
  /** Placeholder art: an emoji per animation state, swappable later for real sprites. */
  emoji: Partial<Record<string, string>> & { base: string };
  /** Real illustrated idle-loop sprite, when available — overrides the emoji for calm/ambient states. */
  idleSprite?: ImageSourcePropType;
  /** Shown chasing the toy in the play mini-game, instead of the emoji stand-in. */
  playSprite?: ImageSourcePropType;
  /**
   * Length of one loop of each sprite, in ms. Both clips are cut to begin and end on the
   * same drawing, so swapping exactly on a loop boundary is invisible — see PetSprite.
   */
  idleLoopMs?: number;
  playLoopMs?: number;
  /** Static illustrated portrait, when available — overrides the emoji in small avatar/icon contexts. */
  portrait?: ImageSourcePropType;
  /** Per-pet size correction: each source illustration fills its frame differently. */
  spriteScale?: number;
  /** Nudge left/right as a fraction of the stage, when the artwork sits off-centre in its frame. */
  spriteOffsetX?: number;
  /** Nudge up/down as a fraction of the stage; negative lifts the pet off the ground line. */
  spriteOffsetY?: number;
}

export const PET_DEFINITIONS: Record<PetId, PetDefinition> = {
  cat1: {
    id: 'cat1',
    name: 'Лея',
    nameGenitive: 'Леи',
    nameInstrumental: 'Леей',
    gender: 'f',
    species: 'cat',
    personality: ['энергичная', 'любопытная', 'немного хаотичная', 'игривая', 'быстро скучает'],
    favoriteFood: 'tuna',
    favoriteToy: 'yarn',
    checkersStyle: 'chaotic',
    decayMultipliers: { hunger: 1, fun: 1.3, attention: 1 },
    emoji: {
      base: '🐈',
      IDLE: '🐈',
      WALKING: '🐈',
      SITTING: '🐈',
      SLEEPING: '😴',
      WAKING: '🙀',
      EATING: '😋',
      PLAYING: '😸',
      REQUESTING_FOOD: '🐈',
      REQUESTING_PLAY: '😼',
      REQUESTING_ATTENTION: '🐈',
      PETTING: '😻',
    },
    idleSprite: require('../../assets/images/leya-idle.webp'),
    portrait: require('../../assets/images/portraits/leya.png'),
    spriteScale: 2,
    // Her tail stretches the frame to the right, leaving her body left of centre.
    spriteOffsetX: 0.06,
    // She sits high in her frame, so she floated above the grass line.
    spriteOffsetY: 0.05,
  },
  cat2: {
    id: 'cat2',
    name: 'Варяг',
    nameGenitive: 'Варяга',
    nameInstrumental: 'Варягом',
    gender: 'm',
    species: 'cat',
    personality: ['спокойный', 'сонный', 'ласковый', 'любит поесть', 'немного ленивый'],
    favoriteFood: 'wet_cat_food',
    // Мяч, а не пёрышко: пёрышко не входит в открытые игрушки, и «любимая» у него
    // не показывалась ни разу. Теперь у каждого свой фаворит из трёх доступных.
    favoriteToy: 'ball',
    checkersStyle: 'calm',
    decayMultipliers: { hunger: 1.2, fun: 1, attention: 1 },
    emoji: {
      base: '🐱',
      IDLE: '🐱',
      WALKING: '🐱',
      SITTING: '🐱',
      SLEEPING: '😴',
      WAKING: '🙀',
      EATING: '😋',
      PLAYING: '😸',
      REQUESTING_FOOD: '🐱',
      REQUESTING_PLAY: '😼',
      REQUESTING_ATTENTION: '🐱',
      PETTING: '😻',
    },
    idleSprite: require('../../assets/images/varyag-idle.webp'),
    portrait: require('../../assets/images/portraits/varyag.png'),
    spriteScale: 2.16,
    // His tail curls out to the right, leaving his body left of centre.
    spriteOffsetX: 0.13,
  },
  dog: {
    id: 'dog',
    name: 'Джорджия',
    nameGenitive: 'Джорджии',
    nameInstrumental: 'Джорджией',
    gender: 'f',
    species: 'dog',
    personality: ['дружелюбная', 'общительная', 'восторженная', 'ласковая', 'жаждет внимания'],
    favoriteFood: 'dog_treat',
    favoriteToy: 'rope',
    checkersStyle: 'eager',
    decayMultipliers: { hunger: 1, fun: 1, attention: 1.4 },
    emoji: {
      base: '🐶',
      IDLE: '🐶',
      WALKING: '🐕',
      SITTING: '🐶',
      SLEEPING: '😴',
      WAKING: '🐶',
      EATING: '😋',
      PLAYING: '🐕',
      REQUESTING_FOOD: '🐶',
      REQUESTING_PLAY: '🐕',
      REQUESTING_ATTENTION: '🐶',
      PETTING: '🥰',
    },
    idleSprite: require('../../assets/images/georgia-idle.webp'),
    // 36 frames at 12 fps.
    idleLoopMs: 2988,
    portrait: require('../../assets/images/portraits/georgia.png'),
    spriteScale: 2.49,
  },
};

export const PET_ORDER: PetId[] = ['cat1', 'cat2', 'dog'];
