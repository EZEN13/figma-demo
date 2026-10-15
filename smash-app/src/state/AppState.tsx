import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Filters } from '../data/types';
import { todayISO } from '../lib/format';

/**
 * Клиентское состояние: онбординг, профиль, избранное, фильтры.
 * «Серверные» данные (брони, занятые слоты) живут в api/db.ts.
 */
export type LevelId = 'novice' | 'amateur' | 'advanced' | 'tournament' | 'pro';

export interface AppState {
  onboarded: boolean;
  level: LevelId;
  districts: string[];
  favorites: string[];
  filters: Filters;
}

type Action =
  | { type: 'onboard' }
  | { type: 'setLevel'; level: LevelId }
  | { type: 'setDistricts'; districts: string[] }
  | { type: 'toggleFavorite'; courtId: string }
  | { type: 'setFilters'; patch: Partial<Filters> }
  | { type: 'resetFilters' };

const KEY = 'smash:v1';
export const MAX_PRICE = 5000;
export const MIN_PRICE = 1500;

export const defaultFilters = (districts: string[] = []): Filters => ({
  date: todayISO(),
  time: 'any',
  maxPrice: MAX_PRICE,
  courtType: 'any',
  districts,
});

function load(): AppState {
  const base: AppState = { onboarded: false, level: 'amateur', districts: [], favorites: [], filters: defaultFilters() };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<AppState>;
    const districts = Array.isArray(saved.districts) ? saved.districts : [];
    return {
      onboarded: !!saved.onboarded,
      level: saved.level ?? 'amateur',
      districts,
      favorites: Array.isArray(saved.favorites) ? saved.favorites : [],
      filters: defaultFilters(districts),
    };
  } catch {
    return base;
  }
}

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'onboard':
      return { ...s, onboarded: true };
    case 'setLevel':
      return { ...s, level: a.level };
    case 'setDistricts':
      return { ...s, districts: a.districts, filters: { ...s.filters, districts: a.districts } };
    case 'toggleFavorite':
      return {
        ...s,
        favorites: s.favorites.includes(a.courtId) ? s.favorites.filter((x) => x !== a.courtId) : [...s.favorites, a.courtId],
      };
    case 'setFilters':
      return { ...s, filters: { ...s.filters, ...a.patch } };
    case 'resetFilters':
      return { ...s, filters: { ...defaultFilters(s.districts), date: s.filters.date } };
  }
}

const Ctx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    const { onboarded, level, districts, favorites } = state;
    try {
      localStorage.setItem(KEY, JSON.stringify({ onboarded, level, districts, favorites }));
    } catch {
      /* приватный режим — живём в памяти */
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useApp вне AppStateProvider');
  return c;
}

/** «Сбросить демо»: всё локальное хранилище приложения. */
export function resetDemoStorage() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('smash:'))
    .forEach((k) => localStorage.removeItem(k));
}
