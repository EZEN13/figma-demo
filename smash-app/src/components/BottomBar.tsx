import type { ReactNode } from 'react';
import { RollNumber } from './RollNumber';
import s from './BottomBar.module.css';

/**
 * Нижняя чернильная панель (корт 11, оплата 12): сумма ball + пояснение и CTA.
 * Без суммы (слот не выбран) CTA занимает всю ширину.
 */
export function BottomBar({ sum, note, children }: { sum?: string; note?: string; children: ReactNode }) {
  return (
    <div className={`${s.bar} on-dark`}>
      {sum && (
        <div className={s.summary}>
          <RollNumber value={sum} className={s.sum} />
          {note && <span className={s.note}>{note}</span>}
        </div>
      )}
      <div className={s.cta}>{children}</div>
    </div>
  );
}
