import { MapPin as PinIcon, Star } from 'lucide-react';
import type { ClubHit } from '../data/search';
import { decimal, hhmm, km, relDay, rub } from '../lib/format';
import { CourtScheme } from '../graphics/CourtScheme';
import { Ball } from '../graphics/Ball';
import { TagChip } from './controls';
import { haptic } from '../telegram/haptics';
import s from './CourtCard.module.css';

/** Разные ракурсы схемы и положения мяча — в макете карточки одинаковые, это исправлено (SPEC §8). */
const ARTS = [
  { angle: 14, bx: '74%', by: 52, ba: 22 },
  { angle: -11, bx: '34%', by: 64, ba: -24 },
  { angle: 6, bx: '62%', by: 66, ba: 8 },
  { angle: -18, bx: '70%', by: 10, ba: 34 },
];

interface Props {
  hit: ClubHit;
  date: string;
  variant: number;
  onOpen: (courtId: string, start?: number) => void;
}

/** CourtCard: схема корта вместо фото, цена — единственный ball. */
export function CourtCard({ hit, date, variant, onOpen }: Props) {
  const { club, price, picks, more, courts } = hit;
  const art = ARTS[variant % ARTS.length];
  return (
    <article className={s.card}>
      <div className={s.art} aria-hidden>
        <CourtScheme length={260} width={130} angle={art.angle} className={s.court} />
        <Ball size={34} trail={1} angle={art.ba} className={s.ball} style={{ left: art.bx, top: art.by }} />
        <span className={s.dist}>
          <TagChip solid icon={<PinIcon size={14} strokeWidth={2} />}>{km(club.distanceKm)}</TagChip>
        </span>
        <span className={s.price}>{rub(price)}/ч</span>
      </div>
      <div className={s.info}>
        <div className={s.head}>
          <div className={s.nameRow}>
            <button
              type="button"
              className={s.main}
              onClick={() => {
                haptic.select();
                onOpen(courts[0].court.id);
              }}
            >
              <h3 className={s.name}>{club.name}</h3>
            </button>
            <span className={s.rating} aria-label={`Рейтинг ${decimal(club.rating)}`}>
              <Star size={14} strokeWidth={2} aria-hidden />
              {decimal(club.rating)}
            </span>
          </div>
          <p className={s.district}>
            {club.district}, м. {club.metro}
          </p>
        </div>
        <div className={s.slots}>
          <span className={s.day}>{relDay(date)}</span>
          {picks.map((p) => (
            <button
              key={p.start}
              type="button"
              className={`${s.pill} pressable`}
              aria-label={`${club.name}, ${relDay(date)} в ${hhmm(p.start)}`}
              onClick={() => {
                haptic.select();
                onOpen(p.courtId, p.start);
              }}
            >
              {hhmm(p.start)}
            </button>
          ))}
          {more > 0 && <span className={s.more}>+{more}</span>}
        </div>
      </div>
    </article>
  );
}
