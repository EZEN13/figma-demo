import { useCallback, useSyncExternalStore } from 'react';
import { useNavigate, type Location } from 'react-router';

/**
 * Удаление линейной цепочки (онбординг) из истории (SPEC §4.3).
 * HashRouter не умеет вырезать записи, поэтому: запоминаем idx начала цепочки,
 * на финале уходим history.go(-n) к её началу и заменяем запись целевым экраном.
 * Пока история отматывается, экран «заморожен» — промежуточные шаги не мелькают.
 */
const FLOW_KEY = 'smash:flow-start';
let frozen: Location | null = null;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export const frozenLocation = {
  get: () => frozen,
  subscribe(f: () => void) {
    subs.add(f);
    return () => subs.delete(f);
  },
};

export const useFrozenLocation = () => useSyncExternalStore(frozenLocation.subscribe, frozenLocation.get);

const idxNow = () => (window.history.state as { idx?: number } | null)?.idx ?? 0;

/** Вызывается на первом шаге цепочки. */
export function markFlowStart() {
  sessionStorage.setItem(FLOW_KEY, String(idxNow()));
}

/** Завершить цепочку: заменить её целиком экраном `to`. */
export function useFinishFlow() {
  const navigate = useNavigate();
  return useCallback(
    (to: string, current: Location) => {
      const start = Number(sessionStorage.getItem(FLOW_KEY));
      sessionStorage.removeItem(FLOW_KEY);
      const n = idxNow() - start;
      if (!Number.isFinite(start) || n <= 0) {
        navigate(to, { replace: true });
        return;
      }
      frozen = current;
      emit();
      const onPop = () => {
        window.removeEventListener('popstate', onPop);
        navigate(to, { replace: true });
        // размораживаем после того, как роутер применил замену
        requestAnimationFrame(() => {
          frozen = null;
          emit();
        });
      };
      window.addEventListener('popstate', onPop);
      window.history.go(-n);
    },
    [navigate],
  );
}
