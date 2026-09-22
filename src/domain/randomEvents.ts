import { PET_DEFINITIONS } from './petDefinitions';
import type { Memory, PetId, PetRuntimeState, PetStateName, ThoughtBubbleContent, TimeOfDay } from './types';

export interface RandomEventResult {
  key: string;
  petIds: PetId[];
  thoughtByPet?: Partial<Record<PetId, ThoughtBubbleContent>>;
  stateByPet?: Partial<Record<PetId, PetStateName>>;
  memory?: Pick<Memory, 'title' | 'emoji'>;
}

interface EventContext {
  pets: Record<PetId, PetRuntimeState>;
  timeOfDay: TimeOfDay;
  now: number;
}

interface RandomEventDef {
  key: string;
  weight: number;
  /** Returns the participating pet ids if this event can fire right now, otherwise null. */
  eligible: (ctx: EventContext) => PetId[] | null;
  build: (petIds: PetId[]) => RandomEventResult;
}

function bubble(kind: ThoughtBubbleContent['kind'], emoji: string): ThoughtBubbleContent {
  return { kind, emoji, createdAt: Date.now() };
}

const awake = (p: PetRuntimeState) => !p.isSleeping && p.currentState !== 'EATING' && p.currentState !== 'PLAYING';

const EVENTS: RandomEventDef[] = [
  {
    key: 'cat_enters_box',
    weight: 3,
    eligible: ({ pets }) => {
      const cats = (['cat1', 'cat2'] as PetId[]).filter((id) => awake(pets[id]));
      return cats.length ? [cats[Math.floor(Math.random() * cats.length)]] : null;
    },
    build: ([id]) => ({
      key: 'cat_enters_box',
      petIds: [id],
      thoughtByPet: { [id]: bubble('custom', '📦') },
      stateByPet: { [id]: 'AMBIENT_EVENT' },
    }),
  },
  {
    key: 'dog_brings_ball',
    weight: 3,
    eligible: ({ pets }) => (awake(pets.dog) ? ['dog'] : null),
    build: () => ({
      key: 'dog_brings_ball',
      petIds: ['dog'],
      thoughtByPet: { dog: bubble('toy', '🎾') },
      stateByPet: { dog: 'AMBIENT_EVENT' },
    }),
  },
  {
    key: 'cat_looks_through_window',
    weight: 2,
    eligible: ({ pets }) => {
      const cats = (['cat1', 'cat2'] as PetId[]).filter((id) => awake(pets[id]));
      return cats.length ? [cats[Math.floor(Math.random() * cats.length)]] : null;
    },
    build: ([id]) => ({
      key: 'cat_looks_through_window',
      petIds: [id],
      thoughtByPet: { [id]: bubble('custom', '🪟') },
      stateByPet: { [id]: 'AMBIENT_EVENT' },
    }),
  },
  {
    key: 'cat1_knocks_object',
    weight: 2,
    eligible: ({ pets }) => (awake(pets.cat1) && pets.cat1.energy > 30 ? ['cat1'] : null),
    build: () => ({
      key: 'cat1_knocks_object',
      petIds: ['cat1'],
      thoughtByPet: { cat1: bubble('custom', '💥') },
      stateByPet: { cat1: 'AMBIENT_EVENT' },
    }),
  },
  {
    key: 'pet_yawns',
    weight: 3,
    eligible: ({ pets }) => {
      const sleepy = (['cat1', 'cat2', 'dog'] as PetId[]).filter((id) => awake(pets[id]) && pets[id].energy < 60);
      return sleepy.length ? [sleepy[Math.floor(Math.random() * sleepy.length)]] : null;
    },
    build: ([id]) => ({
      key: 'pet_yawns',
      petIds: [id],
      thoughtByPet: { [id]: bubble('custom', '🥱') },
      stateByPet: { [id]: 'AMBIENT_EVENT' },
    }),
  },
  {
    key: 'pet_stretches',
    weight: 2,
    eligible: ({ pets, timeOfDay }) => {
      if (timeOfDay !== 'morning') return null;
      const candidates = (['cat1', 'cat2', 'dog'] as PetId[]).filter((id) => awake(pets[id]));
      return candidates.length ? [candidates[Math.floor(Math.random() * candidates.length)]] : null;
    },
    build: ([id]) => ({ key: 'pet_stretches', petIds: [id], stateByPet: { [id]: 'AMBIENT_EVENT' } }),
  },
  {
    key: 'two_pets_sit_together',
    weight: 2,
    eligible: ({ pets }) => {
      const candidates = (['cat1', 'cat2', 'dog'] as PetId[]).filter((id) => awake(pets[id]));
      if (candidates.length < 2) return null;
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 2);
    },
    build: (ids) => ({
      key: 'two_pets_sit_together',
      petIds: ids,
      thoughtByPet: { [ids[0]]: bubble('heart', '💕') },
      stateByPet: { [ids[0]]: 'SPECIAL_EVENT', [ids[1]]: 'SPECIAL_EVENT' },
    }),
  },
  {
    key: 'cats_chase_each_other',
    weight: 2,
    eligible: ({ pets }) =>
      awake(pets.cat1) && awake(pets.cat2) && pets.cat1.energy > 40 && pets.cat2.energy > 40 ? ['cat1', 'cat2'] : null,
    build: (ids) => ({
      key: 'cats_chase_each_other',
      petIds: ids,
      stateByPet: { cat1: 'AMBIENT_EVENT', cat2: 'AMBIENT_EVENT' },
    }),
  },
  {
    key: 'dog_watches_sleeping_cat',
    weight: 2,
    eligible: ({ pets }) => {
      const sleepingCat = (['cat1', 'cat2'] as PetId[]).find((id) => pets[id].isSleeping);
      return sleepingCat && awake(pets.dog) ? ['dog', sleepingCat] : null;
    },
    build: (ids) => ({ key: 'dog_watches_sleeping_cat', petIds: ids, stateByPet: { dog: 'AMBIENT_EVENT' } }),
  },
  {
    key: 'cat_steals_dog_bed',
    weight: 1,
    eligible: ({ pets }) => {
      const cat = (['cat1', 'cat2'] as PetId[]).find((id) => awake(pets[id]));
      return cat && pets.dog.isSleeping ? [cat, 'dog'] : null;
    },
    build: (ids) => ({
      key: 'cat_steals_dog_bed',
      petIds: ids,
      thoughtByPet: { [ids[0]]: bubble('sparkle', '😏') },
      stateByPet: { [ids[0]]: 'AMBIENT_EVENT' },
    }),
  },
  {
    key: 'nighttime_zoomies',
    weight: 1,
    eligible: ({ pets, timeOfDay }) => {
      if (timeOfDay !== 'night') return null;
      const zoomy = (['cat1', 'cat2'] as PetId[]).find((id) => awake(pets[id]) && pets[id].energy > 50);
      return zoomy ? [zoomy] : null;
    },
    build: ([id]) => ({
      key: 'nighttime_zoomies',
      petIds: [id],
      stateByPet: { [id]: 'AMBIENT_EVENT' },
      memory: { title: 'Полуночная беготня', emoji: '🌙' },
    }),
  },
  {
    key: 'dog_licks_cat',
    weight: 1,
    eligible: ({ pets }) => {
      const cat = (['cat1', 'cat2'] as PetId[]).find((id) => awake(pets[id]) && pets[id].bondLevel >= 2);
      return cat && awake(pets.dog) ? ['dog', cat] : null;
    },
    build: (ids) => ({
      key: 'dog_licks_cat',
      petIds: ids,
      thoughtByPet: { [ids[1]]: bubble('heart', '💗') },
      stateByPet: { dog: 'AMBIENT_EVENT' },
    }),
  },
];

const RECENT_EVENTS_TO_REMEMBER = 5;

export function pickRandomEvent(
  pets: Record<PetId, PetRuntimeState>,
  timeOfDay: TimeOfDay,
  recentKeys: string[]
): RandomEventResult | null {
  const ctx: EventContext = { pets, timeOfDay, now: Date.now() };
  const candidates = EVENTS.filter((e) => !recentKeys.includes(e.key)).map((e) => ({ def: e, petIds: e.eligible(ctx) })).filter((c): c is { def: RandomEventDef; petIds: PetId[] } => c.petIds !== null);

  if (!candidates.length) return null;

  const totalWeight = candidates.reduce((sum, c) => sum + c.def.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const candidate of candidates) {
    roll -= candidate.def.weight;
    if (roll <= 0) return candidate.def.build(candidate.petIds);
  }
  return candidates[candidates.length - 1].def.build(candidates[candidates.length - 1].petIds);
}

export function pushRecentEventKey(recentKeys: string[], key: string): string[] {
  return [key, ...recentKeys].slice(0, RECENT_EVENTS_TO_REMEMBER);
}

export function petDefFor(id: PetId) {
  return PET_DEFINITIONS[id];
}
