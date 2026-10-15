import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useBackButton } from '../telegram/useBackButton';
import { HEADER_DARK, HEADER_LIGHT, useHeaderColor } from '../telegram/useHeaderColor';
import { useToastAnchor, type ToastAnchor } from './Toast';
import { SCROLL_TOP_EVENT } from '../lib/nav';
import s from './Screen.module.css';

interface Props {
  /** цвет верха экрана → цвет шапки Telegram */
  top: 'dark' | 'light';
  /** фон экрана */
  bg?: 'chalk' | 'ink';
  /** обработчик нативной «Назад»; null — корень, кнопка скрыта */
  back: (() => void) | null;
  toast?: ToastAnchor;
  /** нижний закреплённый блок (CTA-панель) */
  bar?: ReactNode;
  /** без собственного скролла (карта) */
  fixed?: boolean;
  className?: string;
  children: ReactNode;
}

const scrollMemory = new Map<string, number>();

/** Каркас экрана: шапка Telegram, BackButton, скролл с восстановлением позиции. */
export function Screen({ top, bg = 'chalk', back, toast = 'bottom', bar, fixed, className, children }: Props) {
  useHeaderColor(top === 'dark' ? HEADER_DARK : HEADER_LIGHT);
  useBackButton(back);
  useToastAnchor(toast);
  const ref = useRef<HTMLDivElement>(null);
  const { key } = useLocation();

  useLayoutEffect(() => {
    const y = scrollMemory.get(key);
    if (y && ref.current) ref.current.scrollTop = y;
    // ключ фиксируется на момент монтирования экрана
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => scrollMemory.set(key, el.scrollTop);
    const onTop = () => el.scrollTo({ top: 0, behavior: 'smooth' });
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener(SCROLL_TOP_EVENT, onTop);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener(SCROLL_TOP_EVENT, onTop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`${s.screen} ${s[bg]}`}>
      <div ref={ref} className={`${fixed ? s.fixed : s.scroll} no-scrollbar ${className ?? ''}`}>
        {children}
      </div>
      {bar}
    </div>
  );
}
