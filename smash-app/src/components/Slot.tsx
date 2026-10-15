import { hhmm, rub } from '../lib/format';
import s from './Slot.module.css';

export type SlotState = 'free' | 'selected' | 'busy';

/** Slot: free / selected (ball, единственный на сетке) / busy (тихий, зачёркнутый, без кнопочного вида). */
export function Slot({ start, hourly, state, onPress }: { start: number; hourly: number; state: SlotState; onPress: () => void }) {
  const busy = state === 'busy';
  return (
    <button
      type="button"
      className={`${s.slot} ${s[state]} ${busy ? '' : 'pressable'}`}
      aria-pressed={state === 'selected'}
      aria-disabled={busy || undefined}
      aria-label={`${hhmm(start)}, ${busy ? 'занято' : `${rub(hourly)} в час`}`}
      onClick={onPress}
    >
      <span className={s.time}>{hhmm(start)}</span>
      <span className={s.price}>{busy ? 'занято' : rub(hourly)}</span>
    </button>
  );
}
