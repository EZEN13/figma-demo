import { Plus } from 'lucide-react';
import type { Player } from '../data/types';
import { CourtScheme } from './CourtScheme';
import { decimal } from '../lib/format';
import s from './CourtPlayers.module.css';

/** Позиции мест: команда 1 слева, команда 2 справа (как в макетах 16–17). */
const POS: [number, number][] = [
  [18.5, 29],
  [18.5, 71],
  [81.5, 29],
  [81.5, 71],
];

interface Props {
  seats: (Player | null)[];
  /** подписи у игроков (экран матча) */
  labels?: boolean;
  /** диапазон уровня матча — подпись к свободному месту */
  levelLabel?: string;
  big?: boolean;
}

/** Схема корта сверху с четырьмя местами; первое свободное — «Ваше место» с вращающимся кольцом ball. */
export function CourtPlayers({ seats, labels, levelLabel, big }: Props) {
  const firstOpen = seats.findIndex((x) => !x);
  return (
    <div className={`${s.wrap} ${big ? s.big : ''}`}>
      <CourtScheme length={350} width={big ? 175 : 145} lineOpacity={0.85} className={s.court} />
      {seats.map((p, i) => {
        const [x, y] = POS[i];
        const right = x > 50;
        return (
          <div key={i} className={`${s.seat} ${right ? s.right : ''}`} style={{ left: `${x}%`, top: `${y}%` }}>
            {p ? (
              <span className={s.av} role="img" aria-label={p.name}>
                {p.initials}
              </span>
            ) : (
              <span className={`${s.av} ${s.open}`} role="img" aria-label={i === firstOpen ? 'Ваше место' : 'Свободное место'}>
                {i === firstOpen && <span className={s.ring} aria-hidden />}
                <Plus size={18} strokeWidth={2} aria-hidden />
              </span>
            )}
            {labels && (
              <span className={s.label} aria-hidden>
                <span className={!p && i === firstOpen ? s.yours : s.name}>{p ? shortName(p.name) : i === firstOpen ? 'Ваше место' : 'Свободно'}</span>
                <span className={s.lvl}>{p ? (p.rating ? decimal(p.rating) : '') : levelLabel}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const shortName = (n: string) => {
  const [a, b] = n.split(' ');
  return b ? `${a} ${b[0]}.` : a;
};
