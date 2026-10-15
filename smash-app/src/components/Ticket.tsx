import type { ReactNode } from 'react';
import s from './Ticket.module.css';

/** Ticket: билет с перфорацией (подтверждение 13, «Мои брони»). notch — цвет фона под билетом. */
export function Ticket({ top, bottom, notch = 'ink', className }: { top: ReactNode; bottom: ReactNode; notch?: 'ink' | 'chalk'; className?: string }) {
  return (
    <div className={`${s.ticket} ${className ?? ''}`}>
      <div className={s.top}>{top}</div>
      <div className={`${s.perf} ${notch === 'ink' ? s.onInk : s.onChalk}`} aria-hidden />
      <div className={s.bottom}>{bottom}</div>
    </div>
  );
}

export function TicketTime({ start, end }: { start: string; end: string }) {
  return (
    <p className={s.time}>
      <span className={s.start}>{start}</span>
      <span className={s.end}>–{end}</span>
    </p>
  );
}

export function TicketMeta({ items }: { items: [string, string][] }) {
  return (
    <dl className={s.meta}>
      {items.map(([k, v]) => (
        <div key={k} className={s.metaItem}>
          <dt className={s.metaK}>{k}</dt>
          <dd className={s.metaV}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TicketRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className={s.row}>
      <span className={s.rowK}>{k}</span>
      <span className={s.rowV}>{v}</span>
    </div>
  );
}
