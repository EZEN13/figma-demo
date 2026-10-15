// Форматирование: даты, время, деньги. Всё на русском, без зависимостей.
const NBSP = ' ';

export const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/** ISO-дата 'YYYY-MM-DD' в локальном времени. */
export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = () => toISO(new Date());

export function addDays(iso: string, n: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function isValidISO(v: string | null | undefined): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(fromISO(v).getTime());
}

export function dayDiff(iso: string, base = todayISO()): number {
  return Math.round((fromISO(iso).getTime() - fromISO(base).getTime()) / 86400000);
}

export const isWeekend = (iso: string) => {
  const w = fromISO(iso).getDay();
  return w === 0 || w === 6;
};

export const weekdayShort = (iso: string) => WEEKDAYS_SHORT[fromISO(iso).getDay()];
export const dayNum = (iso: string) => String(fromISO(iso).getDate());

/** «Сегодня», «Завтра», «Пт, 16 окт» */
export function relDay(iso: string): string {
  const diff = dayDiff(iso);
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';
  const d = fromISO(iso);
  return `${weekdayShort(iso)}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** «Сегодня, 14 октября» / «Завтра, 15 октября» / «Пятница, 16 октября» */
export function relDayLong(iso: string): string {
  const d = fromISO(iso);
  const tail = `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
  const diff = dayDiff(iso);
  if (diff === 0) return `Сегодня, ${tail}`;
  if (diff === 1) return `Завтра, ${tail}`;
  const full = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][d.getDay()];
  return `${full}, ${tail}`;
}

/** «Ср, 14 октября» */
export function dateMedium(iso: string): string {
  const d = fromISO(iso);
  return `${weekdayShort(iso)}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** «Ср, 14 окт» */
export function dateShort(iso: string): string {
  const d = fromISO(iso);
  return `${weekdayShort(iso)}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** минуты от полуночи → «19:00» */
export function hhmm(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseHHMM(v: string | null | undefined): number | null {
  if (!v || !/^\d{2}:\d{2}$/.test(v)) return null;
  const [h, m] = v.split(':').map(Number);
  return h * 60 + m;
}

/** 4800 → «4 800 ₽» (неразрывные пробелы) */
export function rub(n: number): string {
  const s = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${s}${NBSP}₽`;
}

export const km = (v: number) => `${v.toFixed(1).replace('.', ',')}${NBSP}км`;
export const decimal = (v: number) => v.toFixed(1).replace('.', ',');

/** Склонение: plural(5, ['корт','корта','кортов']) */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
