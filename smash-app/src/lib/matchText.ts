import type { Match } from '../data/types';
import { dayDiff, decimal, nowMinutes, plural, relDay } from './format';

export const levelRange = (m: Pick<Match, 'levelMin' | 'levelMax'>) => `${decimal(m.levelMin)}–${decimal(m.levelMax)}`;
export const openSeats = (m: Match) => m.seats.filter((x) => !x).length;
export const needText = (m: Match) => {
  const n = openSeats(m);
  return n === 1 ? 'Нужен 1 игрок' : `Нужно ${n} ${plural(n, ['игрок', 'игрока', 'игроков'])}`;
};

/** «Сегодня, через 2 часа» / «Завтра, 90 мин» */
export function whenText(m: Match) {
  if (dayDiff(m.date) === 0) {
    const left = m.start - nowMinutes();
    if (left > 0 && left < 60) return `Сегодня, через ${left} мин`;
    if (left >= 60 && left < 6 * 60) {
      const h = Math.round(left / 60);
      return `Сегодня, через ${h} ${plural(h, ['час', 'часа', 'часов'])}`;
    }
  }
  return `${relDay(m.date)}, ${m.duration} мин`;
}

/** Подходит ли матч по рейтингу (SPEC §5.2) */
export const fits = (rating: number, m: Pick<Match, 'levelMin' | 'levelMax'>) => rating >= m.levelMin && rating <= m.levelMax;
