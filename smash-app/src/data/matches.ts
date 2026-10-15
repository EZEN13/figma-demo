import type { Duration, Match, Player } from './types';
import { addDays, todayISO } from '../lib/format';
import { getCourtById } from './clubs';
import { priceFor, shareOf } from './slots';

const P = (name: string, rating: number): Player => {
  const [a, b] = name.split(' ');
  return { name, rating, initials: ((a?.[0] ?? '') + (b?.[0] ?? '')).toUpperCase() };
};

const ALINA = P('Алина Кравец', 3.4);
const DIMA = P('Дима Сорокин', 3.1);
const OLEG = P('Олег Власов', 3.3);
const MASHA = P('Маша Петрова', 2.8);
const ILYA = P('Илья Громов', 4.2);
const KATYA = P('Катя Лебедева', 3.6);
const SASHA = P('Саша Орлов', 1.8);
const NIKITA = P('Никита Белов', 4.6);
const VERA = P('Вера Соколова', 2.4);

type Seed = [id: string, courtId: string, dayOffset: number, start: string, dur: Duration, lvl: [number, number], format: string, players: Player[]];

const SEEDS: Seed[] = [
  ['m1', 'luzhniki-1', 0, '19:00', 90, [2.5, 3.5], 'Дружеский', [ALINA, OLEG, DIMA]],
  ['m2', 'sokolniki-2', 0, '20:30', 90, [3.0, 3.5], 'Дружеский', [DIMA, OLEG, KATYA]],
  ['m3', 'ramenki-1', 1, '08:00', 60, [1.5, 2.5], 'Тренировочный', [SASHA, VERA]],
  ['m4', 'presnya-1', 1, '19:30', 90, [4.0, 5.0], 'Рейтинговый', [ILYA, NIKITA, KATYA]],
  ['m5', 'taganka-1', 1, '21:00', 90, [2.5, 3.5], 'Дружеский', [MASHA, DIMA, OLEG]],
  ['m6', 'maryina-1', 2, '10:00', 120, [3.0, 4.0], 'Американо', [KATYA, OLEG]],
  ['m7', 'krylatskoe-1', 2, '18:00', 90, [2.0, 3.0], 'Дружеский', [VERA, MASHA, SASHA]],
  ['m8', 'luzhniki-2', 2, '20:00', 90, [3.5, 4.5], 'Рейтинговый', [ILYA, KATYA, NIKITA]],
];

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5);

/** 8 открытых матчей на ближайшие 3 дня (SPEC §5.1). */
export function buildMatches(): Match[] {
  const today = todayISO();
  return SEEDS.map(([id, courtId, off, start, duration, [levelMin, levelMax], format, players]) => {
    const court = getCourtById(courtId)!;
    const date = addDays(today, off);
    const total = priceFor(court, date, toMin(start), duration);
    const seats: (Player | null)[] = [...players, null, null, null].slice(0, 4);
    return {
      id,
      courtId,
      clubId: court.clubId,
      date,
      start: toMin(start),
      duration,
      levelMin,
      levelMax,
      total,
      pricePerPlayer: shareOf(total),
      format,
      organizer: players[0],
      seats,
      closesAt: toMin(start) - 180,
    };
  });
}

