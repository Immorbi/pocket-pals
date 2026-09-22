import { tierFor } from './decay';
import type { NeedKind } from './types';

type Tier = ReturnType<typeof tierFor>;
type Gender = 'f' | 'm';

// Fun/attention lean on gender-neutral verb and noun phrases (Russian 3rd-person present
// tense doesn't inflect for gender). Hunger/energy read much more naturally as short
// adjectives, which do inflect, so those two need the pet's gender.
const NEUTRAL_LABELS: Record<'fun' | 'attention', Record<Tier, string>> = {
  fun: {
    happy: 'Веселится',
    neutral: 'Немного скучает',
    needsAttention: 'Скучает',
    strongNeed: 'Очень скучает',
    critical: 'Очень скучает',
  },
  attention: {
    happy: 'Чувствует любовь',
    neutral: 'Не хватает внимания',
    needsAttention: 'Хочет внимания',
    strongNeed: 'Скучает по вам',
    critical: 'Скучает по вам',
  },
};

const GENDERED_LABELS: Record<'hunger' | 'energy', Record<Tier, Record<Gender, string>>> = {
  hunger: {
    happy: { f: 'Сыта', m: 'Сыт' },
    neutral: { f: 'Слегка проголодалась', m: 'Слегка проголодался' },
    needsAttention: { f: 'Голодна', m: 'Голоден' },
    strongNeed: { f: 'Очень голодна', m: 'Очень голоден' },
    critical: { f: 'Очень голодна', m: 'Очень голоден' },
  },
  energy: {
    happy: { f: 'Полна энергии', m: 'Полон энергии' },
    neutral: { f: 'Слегка устала', m: 'Слегка устал' },
    needsAttention: { f: 'Устала', m: 'Устал' },
    strongNeed: { f: 'Очень устала', m: 'Очень устал' },
    critical: { f: 'Без сил', m: 'Без сил' },
  },
};

export function statusLabel(kind: NeedKind, value: number, gender: Gender): string {
  const tier = tierFor(value);
  if (kind === 'fun' || kind === 'attention') return NEUTRAL_LABELS[kind][tier];
  return GENDERED_LABELS[kind][tier][gender];
}
