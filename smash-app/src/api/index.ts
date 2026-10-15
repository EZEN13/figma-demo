import type { Booking, Duration, Filters, Match, PayMethod, PaySplit } from '../data/types';
import { getClubById, getCourtById } from '../data/clubs';
import { searchCourts, busyFor, type ClubHit } from '../data/search';
import { buildMatches } from '../data/matches';
import { priceFor, shareOf } from '../data/slots';
import { dbAddBooking, dbBookings, dbCancelBooking, dbTake, newBookingCode, YOU } from './db';

/**
 * Слой «запросов» (SPEC §5.3): async с задержкой 400–700 мс, чтобы были видны скелетоны.
 * Заменяется на реальный бэкенд без правок экранов.
 */
export class ApiError extends Error {
  constructor(public code: 'offline' | 'taken' | 'not_found') {
    super(code);
  }
}

const cache = new Map<string, unknown>();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latency = () => wait(400 + Math.random() * 300);

async function call<T>(key: string, fn: () => T): Promise<T> {
  if (!navigator.onLine) {
    if (cache.has(key)) return cache.get(key) as T;
    throw new ApiError('offline');
  }
  await latency();
  const v = fn();
  cache.set(key, v);
  return v;
}

/** Кешированный ответ — экран показывает его сразу, без скелетона. */
export const peek = <T,>(key: string) => cache.get(key) as T | undefined;
export const invalidate = () => cache.clear();

export const keys = {
  courts: (f: Filters) => `courts|${JSON.stringify(f)}`,
  court: (courtId: string, date: string) => `court|${courtId}|${date}`,
  matches: () => 'matches',
  match: (id: string) => `match|${id}`,
  bookings: () => 'bookings',
  booking: (id: string) => `booking|${id}`,
};

export interface CourtDay {
  courtId: string;
  date: string;
  busy: boolean[];
}

export const api = {
  listCourts: (f: Filters): Promise<ClubHit[]> => call(keys.courts(f), () => searchCourts(f)),

  getCourtDay: (courtId: string, date: string): Promise<CourtDay> =>
    call(keys.court(courtId, date), () => {
      if (!getCourtById(courtId)) throw new ApiError('not_found');
      return { courtId, date, busy: busyFor(courtId, date) };
    }),

  getMatches: (): Promise<Match[]> => call(keys.matches(), buildMatches),

  getMatch: (id: string): Promise<Match> =>
    call(keys.match(id), () => {
      const m = buildMatches().find((x) => x.id === id);
      if (!m) throw new ApiError('not_found');
      return m;
    }),

  getBookings: (): Promise<Booking[]> => call(keys.bookings(), () => [...dbBookings()]),

  getBooking: (id: string): Promise<Booking> =>
    call(keys.booking(id), () => {
      const b = dbBookings().find((x) => x.id === id);
      if (!b) throw new ApiError('not_found');
      return b;
    }),

  /** Оплата и бронь. fail — dev-флаг ?fail=1: «слот только что заняли». */
  async createBooking(input: {
    courtId: string;
    date: string;
    start: number;
    duration: Duration;
    split: PaySplit;
    method: PayMethod;
    matchId?: string;
    fail?: boolean;
  }): Promise<Booking> {
    if (!navigator.onLine) throw new ApiError('offline');
    await wait(1200);
    const court = getCourtById(input.courtId);
    if (!court) throw new ApiError('not_found');
    if (input.fail) {
      dbTake(input.courtId, input.date, input.start, input.duration);
      invalidate();
      throw new ApiError('taken');
    }
    let total = priceFor(court, input.date, input.start, input.duration);
    let seats: Booking['seats'] = [YOU, null, null, null];
    let paid = input.split === 'split' ? shareOf(total) : total;
    if (input.matchId) {
      const m = buildMatches().find((x) => x.id === input.matchId);
      if (m) {
        total = m.total;
        paid = m.pricePerPlayer;
        const others = m.seats.filter(Boolean);
        seats = [...others, YOU, null, null, null].slice(0, 4);
      }
    }
    const code = newBookingCode();
    const b: Booking = {
      id: code,
      code,
      courtId: court.id,
      clubId: court.clubId,
      date: input.date,
      start: input.start,
      duration: input.duration,
      total,
      paid,
      split: input.matchId ? 'split' : input.split,
      method: input.method,
      seats,
      matchId: input.matchId,
      createdAt: Date.now(),
    };
    dbAddBooking(b);
    invalidate();
    return b;
  },

  async cancelBooking(id: string): Promise<void> {
    await latency();
    dbCancelBooking(id);
    invalidate();
  },
};

export const clubOf = (courtId: string) => {
  const court = getCourtById(courtId);
  return court ? { court, club: getClubById(court.clubId)! } : null;
};
