import type { TimeOfDay } from './types';

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

const GREETINGS: Record<TimeOfDay, string[]> = {
  morning: ['Доброе утро', 'Пора вставать'],
  day: ['Добрый день', 'Привет'],
  evening: ['Добрый вечер', 'Уютный вечер'],
  night: ['Дом спит', 'Тихая ночь'],
};

export function greetingFor(timeOfDay: TimeOfDay): string {
  const options = GREETINGS[timeOfDay];
  return options[Math.floor(Math.random() * options.length)];
}

const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export function formatDateTime(date: Date = new Date()): string {
  const weekday = WEEKDAYS[date.getDay()];
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${weekday} · ${hours}:${minutes}`;
}

export function formatAwayDuration(elapsedMs: number): string {
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return 'мгновение';
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч`;
  const days = Math.floor(hours / 24);
  return `${days} дн.`;
}
