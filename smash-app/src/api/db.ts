import type { Booking, Duration, Player } from '../data/types';
import { getCourtById } from '../data/clubs';
import { priceFor, segOf, SEG } from '../data/slots';
import { addDays, nowMinutes, todayISO } from '../lib/format';

/**
 * «Сервер» демо: брони пользователя и слоты, которые заняли другие.
 * Живёт в localStorage. Слой api/ — единственный, кто сюда ходит.
 */
interface Db {
  bookings: Booking[];
  /** `${courtId}|${date}` → занятые отрезки */
  taken: Record<string, number[]>;
}

const KEY = 'smash:db';
export const YOU: Player = { name: 'Вы', initials: '', you: true };
const p = (name: string, initials: string): Player => ({ name, initials });

function seedBooking(
  code: string, courtId: string, date: string, start: number, duration: Duration,
  split: 'split' | 'full', seats: (Player | null)[], result?: Booking['result'],
): Booking {
  const court = getCourtById(courtId)!;
  const total = priceFor(court, date, start, duration);
  return {
    id: code, code, courtId, clubId: court.clubId, date, start, duration, total,
    paid: split === 'split' ? Math.ceil(total / 40) * 10 : total,
    split, method: 'sbp', seats, createdAt: Date.now(), result,
  };
}

/** 2 предстоящие и 5 прошедших (как в макете 14–15). */
function seed(): Db {
  const t = todayISO();
  const firstDay = nowMinutes() < 17 * 60 + 30 ? t : addDays(t, 1);
  const bookings: Booking[] = [
    seedBooking('SM-48217', 'luzhniki-3', firstDay, 19 * 60, 90, 'split', [YOU, null, null, null]),
    seedBooking('SM-48390', 'sokolniki-2', addDays(t, 3), 10 * 60, 90, 'full', [YOU, p('Дима Сорокин', 'ДС'), p('Олег Власов', 'ОВ'), p('Маша Петрова', 'МП')]),
    seedBooking('SM-47702', 'luzhniki-3', addDays(t, -4), 19 * 60, 90, 'split', [YOU, p('Дима Сорокин', 'ДС'), p('Олег Власов', 'ОВ'), p('Маша Петрова', 'МП')], { win: true, score: '6:4 6:3' }),
    seedBooking('SM-47518', 'ramenki-2', addDays(t, -8), 20 * 60, 90, 'split', [YOU, p('Илья Громов', 'ИГ'), p('Катя Лебедева', 'КЛ'), p('Олег Власов', 'ОВ')], { win: false, score: '4:6 5:7' }),
    seedBooking('SM-47236', 'luzhniki-1', addDays(t, -13), 18 * 60 + 30, 90, 'full', [YOU, p('Дима Сорокин', 'ДС'), p('Вера Соколова', 'ВС'), p('Саша Орлов', 'СО')], { win: true, score: '7:5 6:2' }),
    seedBooking('SM-46904', 'sokolniki-2', addDays(t, -19), 19 * 60 + 30, 90, 'split', [YOU, p('Катя Лебедева', 'КЛ'), p('Олег Власов', 'ОВ'), p('Маша Петрова', 'МП')], { win: true, score: '6:3 6:4' }),
    seedBooking('SM-46611', 'luzhniki-3', addDays(t, -25), 9 * 60, 60, 'full', [YOU, p('Дима Сорокин', 'ДС'), p('Илья Громов', 'ИГ'), p('Вера Соколова', 'ВС')], null),
  ];
  return { bookings, taken: {} };
}

let db: Db = load();

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Db;
      if (Array.isArray(v.bookings) && v.taken) return v;
    }
  } catch {
    /* ignore */
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(v: Db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export const dbBookings = () => db.bookings;

export function dbAddBooking(b: Booking) {
  db = { ...db, bookings: [b, ...db.bookings] };
  save(db);
}

export function dbCancelBooking(id: string) {
  db = { ...db, bookings: db.bookings.filter((b) => b.id !== id) };
  save(db);
}

export function dbTake(courtId: string, date: string, start: number, duration: number) {
  const k = `${courtId}|${date}`;
  const segs = new Set(db.taken[k] ?? []);
  for (let m = start; m < start + duration; m += SEG) segs.add(segOf(m));
  db = { ...db, taken: { ...db.taken, [k]: [...segs] } };
  save(db);
}

/** Отрезки, занятые бронями пользователя и «чужими» захватами. */
export function dbTakenSegments(courtId: string, date: string): Set<number> {
  const out = new Set(db.taken[`${courtId}|${date}`] ?? []);
  for (const b of db.bookings) {
    if (b.courtId !== courtId || b.date !== date) continue;
    for (let m = b.start; m < b.start + b.duration; m += SEG) out.add(segOf(m));
  }
  return out;
}

export function newBookingCode(): string {
  const used = new Set(db.bookings.map((b) => b.code));
  let code = '';
  do code = `SM-${Math.floor(10000 + Math.random() * 90000)}`;
  while (used.has(code));
  return code;
}
