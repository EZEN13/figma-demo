import type { Court, Duration, TimeOfDay } from './types';
import { isWeekend, nowMinutes, todayISO } from '../lib/format';

/** Сетка дня: отрезки по 30 мин, старты 07:00–23:30 (SPEC §5.1). */
export const DAY_START = 7 * 60;
export const SEG = 30;
export const SEG_COUNT = 34; // 07:00 … 23:30, последний отрезок кончается в 24:00
export const DURATIONS: Duration[] = [60, 90, 120];
export const DEFAULT_DURATION: Duration = 90;

export const segOf = (min: number) => (min - DAY_START) / SEG;
export const minOf = (seg: number) => DAY_START + seg * SEG;

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Детерминированная занятость, seed = courtId + date. Брони идут блоками по 60–90 мин, ~30 % занято. */
export function seededBusy(courtId: string, date: string): boolean[] {
  const rnd = mulberry32(hash(`${courtId}|${date}`));
  const busy = new Array<boolean>(SEG_COUNT).fill(false);
  let i = 0;
  while (i < SEG_COUNT) {
    if (rnd() < 0.17) {
      const len = rnd() < 0.5 ? 2 : 3;
      for (let k = 0; k < len && i + k < SEG_COUNT; k++) busy[i + k] = true;
      i += len;
    } else i += 1;
  }
  return busy;
}

/** Тариф часа начала: вечер с 18:00, в выходные — вечерний весь день. */
export function hourlyAt(court: Court, date: string, start: number): number {
  return isWeekend(date) || start >= 18 * 60 ? court.tariffs.evening : court.tariffs.day;
}

/** Цена = тариф(час начала) × длительность / 60 */
export const priceFor = (court: Court, date: string, start: number, dur: Duration) => (hourlyAt(court, date, start) * dur) / 60;

/** Доля при делении на 4: ceil(сумма / 4 / 10) × 10 */
export const shareOf = (total: number) => Math.ceil(total / 4 / 10) * 10;

export interface StartSlot {
  start: number;
  free: boolean;
  hourly: number;
}

/**
 * Возможные старты на день: доступен, если все отрезки на длительность свободны и конец ≤ 24:00.
 * Прошедшее время сегодня не показываем.
 */
export function startsFor(court: Court, date: string, busy: boolean[], dur: Duration): StartSlot[] {
  const n = dur / SEG;
  const cutoff = date === todayISO() ? nowMinutes() : -1;
  const out: StartSlot[] = [];
  for (let i = 0; i + n <= SEG_COUNT; i++) {
    const start = minOf(i);
    if (start <= cutoff) continue;
    let free = true;
    for (let k = 0; k < n; k++) if (busy[i + k]) free = false;
    out.push({ start, free, hourly: hourlyAt(court, date, start) });
  }
  return out;
}

export const WINDOWS: Record<TimeOfDay, [number, number]> = {
  morning: [7 * 60, 12 * 60],
  day: [12 * 60, 18 * 60],
  evening: [18 * 60, 24 * 60],
  any: [0, 24 * 60],
};

export const inWindow = (start: number, t: TimeOfDay) => start >= WINDOWS[t][0] && start < WINDOWS[t][1];

export const TIME_LABEL: Record<TimeOfDay, string> = { morning: 'Утро', day: 'День', evening: 'Вечер', any: 'Любое' };
