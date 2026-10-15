import type { Club, Court, Filters } from './types';
import { CLUBS } from './clubs';
import { DEFAULT_DURATION, inWindow, seededBusy, startsFor, SEG_COUNT, type StartSlot } from './slots';
import { dbTakenSegments } from '../api/db';
import { buildMatches } from './matches';
import { segOf, SEG } from './slots';

/** Занятость корта на день: детерминированная + брони пользователя + матчи + «чужие» захваты. */
export function busyFor(courtId: string, date: string): boolean[] {
  const busy = seededBusy(courtId, date);
  dbTakenSegments(courtId, date).forEach((i) => {
    if (i >= 0 && i < SEG_COUNT) busy[i] = true;
  });
  for (const m of buildMatches()) {
    if (m.courtId !== courtId || m.date !== date) continue;
    for (let t = m.start; t < m.start + m.duration; t += SEG) busy[segOf(t)] = true;
  }
  return busy;
}

export interface CourtHit {
  court: Court;
  starts: StartSlot[];
}

export interface ClubHit {
  club: Club;
  courts: CourtHit[];
  /** минимальный тариф среди подходящих стартов, ₽/ч */
  price: number;
  /** до трёх времён для карточки */
  picks: { courtId: string; start: number }[];
  more: number;
}

/**
 * Поиск по фильтрам (SPEC §5.2, §4.4/10): корт подходит, если на дату есть свободный старт
 * на 90 мин в окне времени с тарифом ≤ цены. Считается синхронно — число на CTA фильтров
 * пересчитывается мгновенно.
 */
export function searchCourts(f: Filters): ClubHit[] {
  const hits: ClubHit[] = [];
  for (const club of CLUBS) {
    if (f.districts.length && !f.districts.includes(club.district)) continue;
    const courts: CourtHit[] = [];
    for (const court of club.courts) {
      if (f.courtType === 'indoor' && !court.indoor) continue;
      if (f.courtType === 'outdoor' && court.indoor) continue;
      const starts = startsFor(court, f.date, busyFor(court.id, f.date), DEFAULT_DURATION).filter(
        (s) => s.free && inWindow(s.start, f.time) && s.hourly <= f.maxPrice,
      );
      if (starts.length) courts.push({ court, starts });
    }
    if (!courts.length) continue;
    const price = Math.min(...courts.flatMap((c) => c.starts.map((s) => s.hourly)));
    // времена по всем кортам, без повторов, по возрастанию
    const byTime = new Map<number, string>();
    for (const c of courts) for (const s of c.starts) if (!byTime.has(s.start)) byTime.set(s.start, c.court.id);
    const times = [...byTime.keys()].sort((a, b) => a - b);
    const picks: ClubHit['picks'] = [];
    for (const t of times) {
      if (picks.length === 3) break;
      if (!picks.length || t - picks[picks.length - 1].start >= 90) picks.push({ courtId: byTime.get(t)!, start: t });
    }
    hits.push({ club, courts, price, picks, more: times.length - picks.length });
  }
  return hits.sort((a, b) => a.club.distanceKm - b.club.distanceKm);
}

export const countCourts = (hits: ClubHit[]) => hits.reduce((n, h) => n + h.courts.length, 0);
