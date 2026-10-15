import { useSyncExternalStore } from 'react';
import { ChevronDown, ChevronLeft, Ellipsis, X } from 'lucide-react';
import { devChrome } from './devMock';
import s from './DevHeader.module.css';

/** Имитация шапки Telegram в браузере (SPEC §3.8). В Telegram не рендерится. */
export function DevHeader() {
  const { backVisible, headerColor } = useSyncExternalStore(devChrome.subscribe, devChrome.get);
  const dark = headerColor.toLowerCase() === '#111210';
  return (
    <div className={s.bar} style={{ background: headerColor, color: dark ? '#F1EEE4' : '#111210' }} data-dev-header>
      {backVisible ? (
        <button type="button" className={s.pill} onClick={devChrome.pressBack}>
          <ChevronLeft size={20} strokeWidth={2} aria-hidden />
          Назад
        </button>
      ) : (
        <button type="button" className={s.pill} onClick={() => console.debug('[tg-mock] close')}>
          <X size={18} strokeWidth={2} aria-hidden />
          Закрыть
        </button>
      )}
      <div className={s.pill} aria-hidden>
        <ChevronDown size={18} strokeWidth={2} />
        <Ellipsis size={18} strokeWidth={2} />
      </div>
    </div>
  );
}
