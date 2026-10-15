import { CreditCard, QrCode, Smartphone } from 'lucide-react';
import type { PayMethod } from '../data/types';
import { haptic } from '../telegram/haptics';
import s from './PayOption.module.css';

const META: Record<PayMethod, { icon: typeof QrCode; name: string; hint: string }> = {
  sbp: { icon: QrCode, name: 'СБП', hint: 'Без комиссии' },
  card: { icon: CreditCard, name: 'Карта Мир 4417', hint: 'Сохранена' },
  applepay: { icon: Smartphone, name: 'Apple Pay', hint: 'Карта в Wallet' },
};

/** PayOption: СБП / Карта / Apple Pay × on / off. */
export function PayOption({ method, on, onSelect }: { method: PayMethod; on: boolean; onSelect: () => void }) {
  const m = META[method];
  const Icon = m.icon;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      className={`${s.opt} ${on ? s.on : ''} pressable`}
      onClick={() => {
        if (!on) haptic.select();
        onSelect();
      }}
    >
      <span className={s.icon}>
        <Icon size={20} strokeWidth={2} aria-hidden />
      </span>
      <span className={s.text}>
        <span className={s.name}>{m.name}</span>
        <span className={s.hint}>{m.hint}</span>
      </span>
      <span className={s.radio} aria-hidden />
    </button>
  );
}
