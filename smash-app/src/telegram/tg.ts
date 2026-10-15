import { createDevWebApp } from './devMock';
import type { TgWebApp } from './types';

const real = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

/** true — открыто вне Telegram (или скрипт не загрузился): мок + dev-шапка. */
export const isDev = !real || !real.initData;

export const tg: TgWebApp = isDev ? createDevWebApp() : real!;

const at = (v: string) => {
  try {
    return tg.isVersionAtLeast(v);
  } catch {
    return false;
  }
};

/** Старт: SPEC §3.1, §3.4. ready() вызывается после первого рендера (main.tsx). */
export function initTelegram() {
  tg.expand();
  if (at('7.7')) tg.disableVerticalSwipes?.();
  if (at('6.1')) {
    tg.setBackgroundColor('#F1EEE4');
    tg.setHeaderColor('#111210');
  }
  if (at('7.10')) tg.setBottomBarColor?.('#F1EEE4');
  // TODO(бэкенд): валидировать initData на сервере. В демо бэкенда нет.
}

export const supports = {
  backButton: () => at('6.1'),
  headerColor: () => at('6.1'),
  closingConfirmation: () => at('6.2'),
  haptics: () => at('6.1'),
  confirm: () => at('6.2'),
};

/** Ссылка на мини-апп с параметром startapp. */
export const BOT_URL = 'https://t.me/smashpadel_bot';
export const appLink = (startParam: string) => `${BOT_URL}/app?startapp=${encodeURIComponent(startParam)}`;

/** «Позвать друзей»: нативный шаринг Telegram через t.me/share/url. */
export function shareURL(url: string, text: string) {
  const share = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  tg.openTelegramLink(share);
}

export function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (supports.confirm()) tg.showConfirm(message, resolve);
    else resolve(window.confirm(message));
  });
}
