import { useMemo } from 'react';
import { Sheet } from '../components/Sheet';
import { Button } from '../components/Button';
import { Chip, DateStrip, Segment } from '../components/controls';
import { useApp, MAX_PRICE, MIN_PRICE } from '../state/AppState';
import { DISTRICTS } from '../data/clubs';
import { countCourts, searchCourts } from '../data/search';
import { TIME_LABEL } from '../data/slots';
import type { CourtType, TimeOfDay } from '../data/types';
import { plural, rub, todayISO } from '../lib/format';
import s from './Filters.module.css';

const TIMES: TimeOfDay[] = ['morning', 'day', 'evening', 'any'];
const TYPES: { value: CourtType; label: string }[] = [
  { value: 'any', label: 'Любой' },
  { value: 'indoor', label: 'Крытый' },
  { value: 'outdoor', label: 'Открытый' },
];

/**
 * 10 Фильтры: всё применяется сразу, число на CTA пересчитывается мгновенно.
 * Закрытие свайпом / «Назад» изменения не теряет.
 */
export function FiltersSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useApp();
  const f = state.filters;
  const set = (patch: Partial<typeof f>) => dispatch({ type: 'setFilters', patch });
  const n = useMemo(() => (open ? countCourts(searchCourts(f)) : 0), [f, open]);

  const footer = (
    <div className={s.footer}>
      <button type="button" className={`${s.reset} pressable`} onClick={() => dispatch({ type: 'resetFilters' })}>
        Сбросить
      </button>
      <Button block disabled={n === 0} onClick={onClose}>
        {n === 0 ? 'Кортов нет' : `Показать ${n} ${plural(n, ['корт', 'корта', 'кортов'])}`}
      </Button>
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Фильтры" footer={footer}>
      <div className={s.sections}>
        <section className={s.section}>
          <h3 className={s.h}>Дата</h3>
          <DateStrip from={todayISO()} value={f.date} onChange={(date) => set({ date })} />
        </section>

        <section className={s.section}>
          <h3 className={s.h}>Время</h3>
          <Segment label="Время" items={TIMES.map((t) => ({ value: t, label: TIME_LABEL[t] }))} value={f.time} onChange={(time) => set({ time })} />
        </section>

        <section className={s.section}>
          <div className={s.headRow}>
            <h3 className={s.h} id="price-label">
              Цена за час
            </h3>
            <span className={s.value}>до {rub(f.maxPrice)}</span>
          </div>
          <PriceSlider value={f.maxPrice} onChange={(maxPrice) => set({ maxPrice })} />
          <div className={s.scale} aria-hidden>
            <span>{rub(MIN_PRICE)}</span>
            <span>{rub(MAX_PRICE)}</span>
          </div>
        </section>

        <section className={s.section}>
          <h3 className={s.h}>Корт</h3>
          <Segment label="Тип корта" items={TYPES} value={f.courtType} onChange={(courtType) => set({ courtType })} />
        </section>

        <section className={s.section}>
          <h3 className={s.h}>Район</h3>
          <div className={s.chips}>
            {DISTRICTS.map((d) => {
              const on = f.districts.includes(d);
              return (
                <Chip key={d} selected={on} onToggle={() => set({ districts: on ? f.districts.filter((x) => x !== d) : [...f.districts, d] })}>
                  {d}
                </Chip>
              );
            })}
          </div>
        </section>
      </div>
    </Sheet>
  );
}

function PriceSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = ((value - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100;
  return (
    <div className={s.slider}>
      <span className={s.track} aria-hidden />
      <span className={s.fill} style={{ transform: `scaleX(${pct / 100})` }} aria-hidden />
      <span className={s.thumb} style={{ left: `calc(${pct}% - ${(pct / 100) * 28}px)` }} aria-hidden />
      <input
        className={s.range}
        type="range"
        min={MIN_PRICE}
        max={MAX_PRICE}
        step={100}
        value={value}
        aria-labelledby="price-label"
        aria-valuetext={`до ${rub(value)}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
