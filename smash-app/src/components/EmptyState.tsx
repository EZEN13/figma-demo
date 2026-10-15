import type { ReactNode } from 'react';
import s from './EmptyState.module.css';

/** Пустое состояние: рисунок линиями line, заголовок, пояснение, действие. */
export function EmptyState({ art, title, text, action }: { art: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={s.empty}>
      <div className={s.art}>{art}</div>
      <h3 className={s.title}>{title}</h3>
      {text && <p className={s.text}>{text}</p>}
      {action && <div className={s.action}>{action}</div>}
    </div>
  );
}
