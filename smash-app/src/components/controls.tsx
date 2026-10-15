import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { haptic } from '../telegram/haptics';
import { addDays, dayNum, weekdayShort } from '../lib/format';
import s from './controls.module.css';

/** DateChip: default / selected (ball). */
export function DateChip({ date, selected, onSelect, today }: { date: string; selected: boolean; onSelect: (d: string) => void; today?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${today ? 'Сегодня, ' : ''}${weekdayShort(date)} ${dayNum(date)}`}
      className={`${s.date} ${selected ? s.dateOn : ''} pressable`}
      onClick={() => {
        if (!selected) haptic.select();
        onSelect(date);
      }}
    >
      <span className={s.dateDay}>{weekdayShort(date)}</span>
      <span className={s.dateNum}>{dayNum(date)}</span>
    </button>
  );
}

/** Segment: сегментированный переключатель (длительность, табы, «кто платит», фильтры). */
export function Segment<T extends string | number>({
  items,
  value,
  onChange,
  label,
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className={s.segment} role="radiogroup" aria-label={label}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={String(it.value)}
            type="button"
            role="radio"
            aria-checked={on}
            className={`${s.segItem} ${on ? s.segOn : ''} pressable`}
            onClick={() => {
              if (!on) haptic.select();
              onChange(it.value);
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/** Chip: выбор на светлом фоне; выбранный — ink с галочкой, не ball. */
export function Chip({ selected, onToggle, children }: { selected: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={`${s.chip} ${selected ? s.chipOn : ''} pressable`}
      onClick={() => {
        haptic.select();
        onToggle();
      }}
    >
      {selected && <Check size={16} strokeWidth={2} aria-hidden />}
      {children}
    </button>
  );
}

/** Метка на тёмном фоне (теги корта, активные фильтры на карте, расстояние). */
export function TagChip({ icon, solid, children }: { icon?: ReactNode; solid?: boolean; children: ReactNode }) {
  return (
    <span className={`${s.tag} ${solid ? s.tagSolid : ''}`}>
      {icon}
      {children}
    </span>
  );
}

/** Горизонтальная лента дат на 14 дней (главная, фильтры, корт). */
export function DateStrip({ value, onChange, days = 14, from }: { value: string; onChange: (d: string) => void; days?: number; from: string }) {
  const list = Array.from({ length: days }, (_, i) => addDays(from, i));
  return (
    <div className={`${s.strip} no-scrollbar`} role="radiogroup" aria-label="Дата">
      {list.map((d, i) => (
        <DateChip key={d} date={d} today={i === 0} selected={d === value} onSelect={onChange} />
      ))}
    </div>
  );
}
