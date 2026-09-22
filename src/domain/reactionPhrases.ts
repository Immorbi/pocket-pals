import { render } from './chatter';

/**
 * What a pet says out loud right after being fed or played with — a short, immediate
 * reaction, distinct from the unrelated ambient small talk in chatter.ts. Templates use the
 * same `{м|ж}` convention: `render` picks the side matching the pet's gender.
 */

const FEED_NORMAL: string[] = [
  'Ммм, вкусно!',
  'Как раз то, что нужно.',
  'Спасибо, я проголода{лся|лась}.',
  'Уже лучше.',
  'Хорошо пошло.',
  'Ты знаешь толк в еде.',
  'Съе{л|ла} бы ещё кусочек.',
  'Вот теперь хорошо.',
];

const FEED_FAVORITE: string[] = [
  'Это же моё любимое!',
  'Лучший день!',
  'Как ты угада{л|ла}?',
  'Съе{л|ла} бы ещё десять раз.',
  'Вот теперь я счастлив{|а}.',
  'Именно об этом я и мечта{л|ла}.',
];

const FEED_REFUSED: string[] = [
  'Фу, это не моё.',
  'Нет, спасибо.',
  'Я это не ем.',
  'Может, что-то другое?',
  'Даже не проси.',
  'Убери, пожалуйста.',
];

const PLAY_NORMAL: string[] = [
  'Ещё разок!',
  'Так весело!',
  'Давай ещё чуть-чуть.',
  'Я в ударе сегодня.',
  'Здорово поигра{л|ла}.',
  'Хочу ещё.',
  'Это моя любимая часть дня.',
  'Почти пойма{л|ла}!',
];

const PLAY_FAVORITE: string[] = [
  'Обожаю эту игрушку!',
  'Мой любимый момент!',
  'Никогда не устаю от этого.',
  'Лучшая игрушка в доме.',
  'Вот это игра!',
  'Ещё, ещё, ещё!',
];

function pick(pool: string[], gender: 'f' | 'm'): string {
  const text = pool[Math.floor(Math.random() * pool.length)];
  return render(text, gender);
}

export function feedReactionLine(gender: 'f' | 'm', tier: 'favorite' | 'refused' | 'normal'): string {
  const pool = tier === 'favorite' ? FEED_FAVORITE : tier === 'refused' ? FEED_REFUSED : FEED_NORMAL;
  return pick(pool, gender);
}

export function playReactionLine(gender: 'f' | 'm', isFavorite: boolean): string {
  return pick(isFavorite ? PLAY_FAVORITE : PLAY_NORMAL, gender);
}
