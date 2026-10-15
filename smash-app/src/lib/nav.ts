import { useCallback } from 'react';
import { useNavigate } from 'react-router';

export type TabId = 'courts' | 'bookings' | 'matches' | 'profile';

export const TAB_ROOT: Record<TabId, string> = {
  courts: '/courts',
  bookings: '/bookings',
  matches: '/matches',
  profile: '/profile',
};

export interface RouteMeta {
  /** у экрана виден таб-бар этой вкладки */
  tab?: TabId;
  /** корень вкладки: BackButton скрыт */
  root?: boolean;
}

/** Мета маршрута по pathname (SPEC §4.2). */
export function metaOf(pathname: string): RouteMeta {
  if (pathname === '/courts') return { tab: 'courts', root: true };
  if (pathname === '/courts/map') return { tab: 'courts' };
  if (pathname === '/bookings') return { tab: 'bookings', root: true };
  if (pathname === '/matches') return { tab: 'matches', root: true };
  if (pathname === '/profile') return { tab: 'profile', root: true };
  return {};
}

/** Есть ли куда вернуться внутри приложения (react-router хранит idx в history.state). */
export function canGoBack(): boolean {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === 'number' && idx > 0;
}

/** «Назад» по правилам §4: в историю, если она есть, иначе — на заданный экран. */
export function useGoBack() {
  const navigate = useNavigate();
  return useCallback(
    (fallback: string) => {
      if (canGoBack()) navigate(-1);
      else navigate(fallback, { replace: true, state: { dir: 'back' } });
    },
    [navigate],
  );
}

/** Явный переход «назад» на конкретный экран (с анимацией возврата). */
export function useBackTo() {
  const navigate = useNavigate();
  return useCallback((to: string) => navigate(to, { replace: true, state: { dir: 'back' } }), [navigate]);
}

export const SCROLL_TOP_EVENT = 'smash:scroll-top';
