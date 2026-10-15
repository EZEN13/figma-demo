import { useEffect } from 'react';
import { supports, tg } from './tg';

export const HEADER_DARK = '#111210';
export const HEADER_LIGHT = '#F1EEE4';

/** Цвет шапки Telegram под верх экрана (SPEC §3.4). Без анимации, в момент начала перехода. */
export function useHeaderColor(color: string) {
  useEffect(() => {
    if (supports.headerColor()) tg.setHeaderColor(color);
  }, [color]);
}

/** Подтверждение закрытия — только на оплате (SPEC §3.8). */
export function useClosingConfirmation(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !supports.closingConfirmation()) return;
    tg.enableClosingConfirmation();
    return () => tg.disableClosingConfirmation();
  }, [enabled]);
}
