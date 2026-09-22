import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { applyBondDelta } from '@/domain/bond';
import { applyDecay, mostUrgentNeed, tierFor } from '@/domain/decay';
import { FAVORITE_HUNGER_BONUS, FOODS, foodReactionFor } from '@/domain/food';
import { PET_DEFINITIONS, PET_ORDER } from '@/domain/petDefinitions';
import { PUZZLE_ORDER, pieceCount, type PuzzleId, type PuzzleProgress } from '@/domain/puzzles';
import { pickRandomEvent, pushRecentEventKey } from '@/domain/randomEvents';
import { resolveTapReaction } from '@/domain/reactions';
import { canEnterState } from '@/domain/stateMachine';
import { getTimeOfDay } from '@/domain/time';
import { TOYS } from '@/domain/toys';
import type { FoodId, GameState, Memory, PetId, PetRuntimeState, PetStateName, ToyId } from '@/domain/types';

function emptyPuzzleProgress(): PuzzleProgress {
  const progress = {} as PuzzleProgress;
  for (const id of PUZZLE_ORDER) progress[id] = [];
  return progress;
}

// Normalized to sit on the grass band of the backyard illustration (below the house/bushes).
const START_POSITIONS: Record<PetId, { x: number; y: number }> = {
  cat1: { x: 0.18, y: 0.8 },
  cat2: { x: 0.5, y: 0.87 },
  dog: { x: 0.78, y: 0.82 },
};

const PETTING_COOLDOWN_MS = 45_000;
const AWAY_WELCOME_THRESHOLD_MS = 30 * 60_000;
const AWAY_NEEDS_THRESHOLD_MS = 4 * 3_600_000;

function createDefaultPet(id: PetId, now: number): PetRuntimeState {
  return {
    id,
    hunger: 85,
    fun: 85,
    attention: 85,
    energy: 90,
    bond: 0,
    bondLevel: 1,
    currentState: 'IDLE',
    position: START_POSITIONS[id],
    isSleeping: false,
    lastInteraction: now,
    lastFed: now,
    lastPlayed: now,
    lastPetted: 0,
    lastStateChange: now,
    lastTapAt: 0,
    tapStreak: 0,
    thought: null,
  };
}

function createDefaultState(now: number): GameState {
  const pets = {} as Record<PetId, PetRuntimeState>;
  for (const id of PET_ORDER) pets[id] = createDefaultPet(id, now);
  return {
    pets,
    lastAppOpen: now,
    unlockedToys: ['yarn', 'ball', 'rope'],
    unlockedFurniture: ['pet_bed', 'sofa', 'cardboard_box'],
    memories: [],
    settings: { notificationsEnabled: true },
    lastEventKeys: [],
    startedAt: now,
    noteReadDay: 0,
    puzzles: emptyPuzzleProgress(),
    puzzlesDone: [],
    saveVersion: 1,
  };
}

interface GameActions {
  catchUpOnOpen: () => void;
  tick: () => void;
  tapPet: (id: PetId) => void;
  feedPet: (id: PetId, foodId: FoodId) => void;
  startPlaying: (id: PetId) => void;
  finishPlaying: (id: PetId, toyId: ToyId) => void;
  startPetting: (id: PetId) => void;
  applyPetting: (id: PetId) => void;
  endPetting: (id: PetId) => void;
  completeTransientState: (id: PetId) => void;
  clearThought: (id: PetId) => void;
  addMemoryOnce: (memory: Pick<Memory, 'title' | 'emoji'>, petIds: PetId[]) => void;
  markNoteRead: (day: number) => void;
  placePuzzlePiece: (id: PuzzleId, index: number) => void;
  resetPuzzle: (id: PuzzleId) => void;
}

type Store = GameState & { hasHydrated: boolean; setHasHydrated: (v: boolean) => void } & GameActions;

const WAKING_STATES: PetStateName[] = ['WAKING', 'EATING', 'PLAYING', 'PETTING'];

function setPetState(pets: Record<PetId, PetRuntimeState>, id: PetId, next: PetStateName, opts?: { force?: boolean; now?: number }) {
  const pet = pets[id];
  if (!canEnterState(pet.currentState, next, opts?.force)) return pets;
  const isSleeping = next === 'SLEEPING' ? true : WAKING_STATES.includes(next) ? false : pet.isSleeping;
  return {
    ...pets,
    [id]: { ...pet, currentState: next, lastStateChange: opts?.now ?? Date.now(), isSleeping },
  };
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createDefaultState(Date.now()),
      hasHydrated: false,
      setHasHydrated: (v) => set({ hasHydrated: v }),

      catchUpOnOpen: () => {
        const now = Date.now();
        const state = get();
        const elapsedMs = Math.max(0, now - state.lastAppOpen);
        const timeOfDay = getTimeOfDay(new Date(now));

        const decayedPets = {} as Record<PetId, PetRuntimeState>;
        for (const id of PET_ORDER) {
          const def = PET_DEFINITIONS[id];
          const decayed = applyDecay(state.pets[id], def, elapsedMs);
          const shouldSleep = timeOfDay === 'night' ? decayed.energy < 75 : decayed.energy < 12;
          decayedPets[id] = {
            ...decayed,
            isSleeping: shouldSleep,
            currentState: shouldSleep ? 'SLEEPING' : 'IDLE',
            thought: null,
          };
        }

        // Welcome-back reactions: never guilt-trip, just a warm little moment.
        if (elapsedMs > AWAY_NEEDS_THRESHOLD_MS) {
          const hungriest = PET_ORDER.reduce((worst, id) => (decayedPets[id].hunger < decayedPets[worst].hunger ? id : worst));
          if (!decayedPets[hungriest].isSleeping) {
            decayedPets[hungriest] = {
              ...decayedPets[hungriest],
              thought: { kind: 'food', emoji: FOODS[PET_DEFINITIONS[hungriest].favoriteFood].emoji, createdAt: now },
            };
          }
        } else if (elapsedMs > AWAY_WELCOME_THRESHOLD_MS && !decayedPets.dog.isSleeping) {
          decayedPets.dog = { ...decayedPets.dog, currentState: 'SPECIAL_EVENT', thought: { kind: 'heart', emoji: '🥰', createdAt: now } };
        }

        set({ pets: decayedPets, lastAppOpen: now, hasHydrated: true });
      },

      tick: () => {
        const now = Date.now();
        const state = get();
        const elapsedMs = Math.max(0, now - state.lastAppOpen);
        const timeOfDay = getTimeOfDay(new Date(now));

        let pets = { ...state.pets };
        for (const id of PET_ORDER) {
          const def = PET_DEFINITIONS[id];
          pets[id] = applyDecay(pets[id], def, elapsedMs);
        }

        // Pets in a settled, low-priority state may start autonomously asking for what they need.
        for (const id of PET_ORDER) {
          const pet = pets[id];
          if (pet.isSleeping || pet.currentState !== 'IDLE') continue;
          const urgent = mostUrgentNeed(pet);
          const tier = tierFor(urgent.value);
          if ((tier === 'strongNeed' || tier === 'critical') && Math.random() < 0.5) {
            const def = PET_DEFINITIONS[id];
            const nextState: PetStateName = urgent.need === 'hunger' ? 'REQUESTING_FOOD' : urgent.need === 'fun' ? 'REQUESTING_PLAY' : 'REQUESTING_ATTENTION';
            const emoji = urgent.need === 'hunger' ? FOODS[def.favoriteFood].emoji : urgent.need === 'fun' ? TOYS[def.favoriteToy].emoji : '🤍';
            pets = setPetState(pets, id, nextState, { now }) ?? pets;
            pets[id] = { ...pets[id], thought: { kind: urgent.need === 'hunger' ? 'food' : urgent.need === 'fun' ? 'toy' : 'heart', emoji, createdAt: now } };
          }
        }

        let lastEventKeys = state.lastEventKeys;
        let memories = state.memories;
        if (Math.random() < 0.3) {
          const result = pickRandomEvent(pets, timeOfDay, lastEventKeys);
          if (result) {
            lastEventKeys = pushRecentEventKey(lastEventKeys, result.key);
            if (result.stateByPet) {
              for (const [id, s] of Object.entries(result.stateByPet) as [PetId, PetStateName][]) {
                pets = setPetState(pets, id, s, { now }) ?? pets;
              }
            }
            if (result.thoughtByPet) {
              for (const [id, t] of Object.entries(result.thoughtByPet) as [PetId, PetRuntimeState['thought']][]) {
                pets[id] = { ...pets[id], thought: t };
              }
            }
            if (result.memory && !memories.some((m) => m.title === result.memory!.title)) {
              memories = [...memories, { id: `${result.key}-${now}`, title: result.memory.title, emoji: result.memory.emoji, createdAt: now, petIds: result.petIds }];
            }
          }
        }

        set({ pets, lastAppOpen: now, lastEventKeys, memories });
      },

      tapPet: (id) => {
        const now = Date.now();
        const state = get();
        const pet = state.pets[id];
        const def = PET_DEFINITIONS[id];
        const reaction = resolveTapReaction(pet, def, now);

        let pets = state.pets;
        if (reaction.nextState) {
          pets = setPetState(pets, id, reaction.nextState, { now }) ?? pets;
        }
        pets = { ...pets, [id]: { ...pets[id], thought: reaction.thought ?? pets[id].thought, lastTapAt: now, lastInteraction: now } };

        const bondResult = applyBondDelta(pet.bond, pet.bondLevel, reaction.bondDelta);
        pets = { ...pets, [id]: { ...pets[id], bond: bondResult.bond, bondLevel: bondResult.bondLevel } };

        set({ pets });
      },

      feedPet: (id, foodId) => {
        const now = Date.now();
        const state = get();
        const pet = state.pets[id];
        const food = FOODS[foodId];
        const reaction = foodReactionFor(id, foodId);

        if (reaction === 'refused') {
          const pets = { ...state.pets, [id]: { ...pet, thought: { kind: 'annoyed' as const, emoji: '👃', createdAt: now } } };
          set({ pets });
          return;
        }

        const bonus = reaction === 'favorite' ? FAVORITE_HUNGER_BONUS : 0;
        const hunger = Math.min(100, pet.hunger + food.hungerRestore + bonus);
        const bondResult = reaction === 'favorite' ? applyBondDelta(pet.bond, pet.bondLevel, 2) : { bond: pet.bond, bondLevel: pet.bondLevel };

        let pets = setPetState(state.pets, id, 'EATING', { force: true, now }) ?? state.pets;
        pets = {
          ...pets,
          [id]: {
            ...pets[id],
            hunger,
            bond: bondResult.bond,
            bondLevel: bondResult.bondLevel,
            lastFed: now,
            lastInteraction: now,
            thought: reaction === 'favorite' ? { kind: 'heart', emoji: '💖', createdAt: now } : null,
          },
        };
        set({ pets });
      },

      startPlaying: (id) => {
        const now = Date.now();
        const pets = setPetState(get().pets, id, 'PLAYING', { force: true, now });
        if (pets) set({ pets: { ...pets, [id]: { ...pets[id], lastInteraction: now } } });
      },

      finishPlaying: (id, toyId) => {
        const now = Date.now();
        const state = get();
        const pet = state.pets[id];
        const def = PET_DEFINITIONS[id];
        const toy = TOYS[toyId];
        const isFavorite = toy.id === def.favoriteToy;

        const fun = Math.min(100, pet.fun + toy.funReward + (isFavorite ? 5 : 0));
        const attention = Math.min(100, pet.attention + toy.attentionReward);
        const bondResult = applyBondDelta(pet.bond, pet.bondLevel, isFavorite ? 2 : 1);

        const pets = {
          ...state.pets,
          [id]: {
            ...pet,
            fun,
            attention,
            bond: bondResult.bond,
            bondLevel: bondResult.bondLevel,
            currentState: 'IDLE' as PetStateName,
            lastPlayed: now,
            lastInteraction: now,
            thought: isFavorite ? { kind: 'heart' as const, emoji: '💖', createdAt: now } : null,
          },
        };
        set({ pets });
      },

      startPetting: (id) => {
        const now = Date.now();
        const pets = setPetState(get().pets, id, 'PETTING', { force: true, now });
        if (pets) set({ pets });
      },

      applyPetting: (id) => {
        const now = Date.now();
        const state = get();
        const pet = state.pets[id];
        const onCooldown = now - pet.lastPetted < PETTING_COOLDOWN_MS;
        const gain = onCooldown ? 1 : 5;
        const attention = Math.min(100, pet.attention + gain);
        const bondResult = onCooldown ? { bond: pet.bond, bondLevel: pet.bondLevel } : applyBondDelta(pet.bond, pet.bondLevel, 1);
        set({
          pets: {
            ...state.pets,
            [id]: { ...pet, attention, bond: bondResult.bond, bondLevel: bondResult.bondLevel, lastPetted: now, lastInteraction: now },
          },
        });
      },

      endPetting: (id) => {
        const pets = setPetState(get().pets, id, 'IDLE', { force: true });
        if (pets) set({ pets });
      },

      completeTransientState: (id) => {
        const pet = get().pets[id];
        const transient: PetStateName[] = ['EATING', 'PLAYING', 'PETTING', 'AMBIENT_EVENT', 'SPECIAL_EVENT', 'REQUESTING_FOOD', 'REQUESTING_PLAY', 'REQUESTING_ATTENTION', 'WAKING'];
        if (!transient.includes(pet.currentState)) return;
        const pets = setPetState(get().pets, id, pet.isSleeping ? 'SLEEPING' : 'IDLE', { force: true });
        if (pets) set({ pets });
      },

      placePuzzlePiece: (id, index) => {
        const state = get();
        const placed = state.puzzles[id] ?? [];
        if (placed.includes(index)) return;
        const next = [...placed, index];
        const finished = next.length >= pieceCount(id);
        set({
          puzzles: { ...state.puzzles, [id]: next },
          // Finishing is remembered separately from the pieces, so building the same
          // picture again does not take the collected mark away.
          puzzlesDone: finished && !state.puzzlesDone.includes(id) ? [...state.puzzlesDone, id] : state.puzzlesDone,
        });
      },

      resetPuzzle: (id) => {
        set({ puzzles: { ...get().puzzles, [id]: [] } });
      },

      markNoteRead: (day) => {
        if (get().noteReadDay === day) return;
        set({ noteReadDay: day });
      },
      clearThought: (id) => {
        const state = get();
        set({ pets: { ...state.pets, [id]: { ...state.pets[id], thought: null } } });
      },

      addMemoryOnce: (memory, petIds) => {
        const state = get();
        if (state.memories.some((m) => m.title === memory.title)) return;
        set({ memories: [...state.memories, { id: `${memory.title}-${Date.now()}`, ...memory, createdAt: Date.now(), petIds }] });
      },
    }),
    {
      name: 'pocket-pals-save',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): GameState => ({
        pets: state.pets,
        lastAppOpen: state.lastAppOpen,
        unlockedToys: state.unlockedToys,
        unlockedFurniture: state.unlockedFurniture,
        memories: state.memories,
        settings: state.settings,
        lastEventKeys: state.lastEventKeys,
        startedAt: state.startedAt,
        noteReadDay: state.noteReadDay,
        puzzles: state.puzzles,
        puzzlesDone: state.puzzlesDone,
        saveVersion: state.saveVersion,
      }),
      // Pictures are added over time, so a save always predates the newest ones: fill in any
      // puzzle the save has never seen rather than leaving its progress undefined.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current,
          ...saved,
          puzzles: { ...emptyPuzzleProgress(), ...(saved.puzzles ?? {}) },
          puzzlesDone: saved.puzzlesDone ?? [],
        };
      },
      version: 4,
      // v2 introduced the rope, v3 the puzzles and v4 the finished-picture list; saves written
      // before any of them are missing those fields, so backfill each one on load.
      migrate: (persisted) => {
        const state = persisted as GameState;
        if (!state) return state;
        let next = state;
        if (state.unlockedToys && !state.unlockedToys.includes('rope')) {
          next = { ...next, unlockedToys: [...state.unlockedToys, 'rope'] };
        }
        if (!state.puzzles) {
          next = { ...next, puzzles: emptyPuzzleProgress() };
        }
        if (!state.puzzlesDone) {
          // v4 remembers finished pictures on their own; recover it from the pieces in place.
          const done = PUZZLE_ORDER.filter((id) => (next.puzzles?.[id]?.length ?? 0) >= pieceCount(id));
          next = { ...next, puzzlesDone: done };
        }
        return next;
      },
    }
  )
);
