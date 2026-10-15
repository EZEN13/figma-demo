import type { TgWebApp } from './types';

/**
 * Подмена Telegram.WebApp для браузера (режим разработки, SPEC §3.8).
 * Методы — no-op с console.debug, состояние BackButton и цвет шапки
 * доступны DevHeader через подписку.
 */
type Listener = () => void;

export interface DevChrome {
  backVisible: boolean;
  headerColor: string;
}

const listeners = new Set<Listener>();
let chrome: DevChrome = { backVisible: false, headerColor: '#111210' };
const backHandlers = new Set<() => void>();

function emit(patch: Partial<DevChrome>) {
  chrome = { ...chrome, ...patch };
  listeners.forEach((l) => l());
}

export const devChrome = {
  get: () => chrome,
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  pressBack() {
    backHandlers.forEach((h) => h());
  },
};

const log = (...a: unknown[]) => console.debug('[tg-mock]', ...a);

function startParamFromUrl(): string | undefined {
  const q = new URLSearchParams(window.location.search);
  return q.get('startapp') ?? q.get('tgWebAppStartParam') ?? undefined;
}

export function createDevWebApp(): TgWebApp {
  const backButton = {
    isVisible: false,
    show() {
      this.isVisible = true;
      emit({ backVisible: true });
    },
    hide() {
      this.isVisible = false;
      emit({ backVisible: false });
    },
    onClick(cb: () => void) {
      backHandlers.add(cb);
    },
    offClick(cb: () => void) {
      backHandlers.delete(cb);
    },
  };

  return {
    initData: '',
    initDataUnsafe: {
      user: { id: 1, first_name: 'Аня', last_name: 'Ковалёва', username: 'anya_k', language_code: 'ru' },
      start_param: startParamFromUrl(),
    },
    version: '8.0',
    platform: 'dev',
    safeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
    contentSafeAreaInset: { top: 0, bottom: 0, left: 0, right: 0 },
    isVersionAtLeast: () => true,
    ready: () => log('ready'),
    expand: () => log('expand'),
    close: () => log('close'),
    disableVerticalSwipes: () => log('disableVerticalSwipes'),
    setHeaderColor: (c) => {
      log('setHeaderColor', c);
      emit({ headerColor: c });
    },
    setBackgroundColor: (c) => log('setBackgroundColor', c),
    setBottomBarColor: (c) => log('setBottomBarColor', c),
    enableClosingConfirmation: () => log('enableClosingConfirmation'),
    disableClosingConfirmation: () => log('disableClosingConfirmation'),
    openLink: (url) => {
      log('openLink', url);
      window.open(url, '_blank', 'noopener');
    },
    openTelegramLink: (url) => {
      log('openTelegramLink', url);
      window.open(url, '_blank', 'noopener');
    },
    showConfirm: (message, cb) => cb(window.confirm(message)),
    BackButton: backButton,
    HapticFeedback: {
      impactOccurred: (s) => log('haptic impact', s),
      notificationOccurred: (t) => log('haptic notification', t),
      selectionChanged: () => log('haptic selection'),
    },
  };
}
