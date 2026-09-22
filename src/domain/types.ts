import type { PuzzleId, PuzzleProgress } from './puzzles';

export type PetId = 'cat1' | 'cat2' | 'dog';
export type Species = 'cat' | 'dog';

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export type NeedKind = 'hunger' | 'fun' | 'attention' | 'energy';

export type PetStateName =
  | 'IDLE'
  | 'WALKING'
  | 'SITTING'
  | 'SLEEPING'
  | 'WAKING'
  | 'EATING'
  | 'PLAYING'
  | 'REQUESTING_FOOD'
  | 'REQUESTING_PLAY'
  | 'REQUESTING_ATTENTION'
  | 'PETTING'
  | 'SPECIAL_EVENT'
  | 'AMBIENT_EVENT';

/** Priority tier used by the state machine to decide whether a new state may interrupt the current one. */
export type StatePriority = 'high' | 'low';

export type BondLevel = 1 | 2 | 3 | 4 | 5;

export type FoodId = 'tuna' | 'wet_cat_food' | 'dry_dog_food' | 'dog_treat' | 'veggie_snack' | 'treat';
export type ToyId = 'yarn' | 'ball' | 'rope' | 'feather' | 'mouse_toy' | 'laser';

export interface Position {
  x: number; // 0-1 normalized within the room
  y: number; // 0-1 normalized within the room
}

export interface ThoughtBubbleContent {
  kind: 'food' | 'toy' | 'heart' | 'zzz' | 'annoyed' | 'sparkle' | 'custom';
  emoji: string;
  createdAt: number;
  /** A line the pet says out loud over its head — feeding and play reactions carry one. */
  text?: string;
}

/** Dynamic, persisted state for a single pet. Static traits (personality, favorites) live in petDefinitions.ts. */
export interface PetRuntimeState {
  id: PetId;
  hunger: number;
  fun: number;
  attention: number;
  energy: number;
  bond: number; // 0-100 progress within the current bond level
  bondLevel: BondLevel;
  currentState: PetStateName;
  position: Position;
  isSleeping: boolean;
  lastInteraction: number;
  lastFed: number;
  lastPlayed: number;
  lastPetted: number;
  lastStateChange: number;
  lastTapAt: number;
  tapStreak: number;
  thought: ThoughtBubbleContent | null;
}

export interface Memory {
  id: string;
  title: string;
  emoji: string;
  createdAt: number;
  petIds: PetId[];
}


export interface GameState {
  pets: Record<PetId, PetRuntimeState>;
  lastAppOpen: number;
  unlockedToys: ToyId[];
  unlockedFurniture: string[];
  memories: Memory[];
  settings: {
    notificationsEnabled: boolean;
  };
  lastEventKeys: string[]; // recently-fired random event keys, to avoid immediate repeats
  /** First launch — the daily wish counts from here, so it opens on wish number one. */
  startedAt: number;
  /** Day number of the last wish that was actually opened; 0 while none has been read. */
  noteReadDay: number;
  /** Which pieces of each picture are already in place, by piece index. */
  puzzles: PuzzleProgress;
  /** Pictures that have been finished at least once — they stay collected after a replay. */
  puzzlesDone: PuzzleId[];
  saveVersion: number;
}
