import { rub } from '../lib/format';
import s from './MapPin.module.css';

/** MapPin: цена за час; выбранный — ball и scale 1,1 за 150 мс. */
export function MapPin({ price, name, selected, x, y, onSelect }: { price: number; name: string; selected: boolean; x: number; y: number; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`${s.pin} ${selected ? s.on : ''}`}
      style={{ left: x, top: y }}
      aria-pressed={selected}
      aria-label={`${name}, ${rub(price)} в час`}
      onClick={onSelect}
    >
      <span className={s.body}>{rub(price)}</span>
      <svg className={s.tail} width="12" height="7" viewBox="0 0 12 7" aria-hidden>
        <path d="M0 0h12L6 7z" />
      </svg>
    </button>
  );
}
