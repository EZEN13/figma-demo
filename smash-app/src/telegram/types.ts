// Тонкое описание той части Telegram.WebApp, которой пользуемся.
export interface TgUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TgInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

type Cb = () => void;

export interface TgBackButton {
  isVisible: boolean;
  show(): void;
  hide(): void;
  onClick(cb: Cb): void;
  offClick(cb: Cb): void;
}

export interface TgHaptics {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

export interface TgWebApp {
  initData: string;
  initDataUnsafe: { user?: TgUser; start_param?: string };
  version: string;
  platform: string;
  safeAreaInset?: TgInsets;
  contentSafeAreaInset?: TgInsets;
  isVersionAtLeast(v: string): boolean;
  ready(): void;
  expand(): void;
  close(): void;
  disableVerticalSwipes?(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  setBottomBarColor?(color: string): void;
  enableClosingConfirmation(): void;
  disableClosingConfirmation(): void;
  openLink(url: string, opts?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  showConfirm(message: string, cb: (ok: boolean) => void): void;
  BackButton: TgBackButton;
  HapticFeedback: TgHaptics;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}
