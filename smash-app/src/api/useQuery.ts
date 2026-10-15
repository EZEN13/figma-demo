import { useCallback, useEffect, useRef, useState } from 'react';
import { peek } from './index';

export interface Query<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

/** Загрузка с кешем: есть ответ в кеше — без скелетона; иначе скелетон до ответа. */
export function useQuery<T>(key: string, fetcher: () => Promise<T>): Query<T> {
  const [state, setState] = useState<{ key: string; data: T | undefined; error: Error | null }>(() => ({
    key,
    data: peek<T>(key),
    error: null,
  }));
  const [tick, setTick] = useState(0);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  useEffect(() => {
    let alive = true;
    const cached = peek<T>(key);
    if (cached !== undefined) {
      setState({ key, data: cached, error: null });
      return;
    }
    setState((s) => ({ key, data: s.key === key ? s.data : undefined, error: null }));
    fetchRef.current().then(
      (data) => alive && setState({ key, data, error: null }),
      (error: Error) => alive && setState({ key, data: undefined, error }),
    );
    return () => {
      alive = false;
    };
  }, [key, tick]);

  const retry = useCallback(() => setTick((t) => t + 1), []);
  const fresh = state.key === key;
  return {
    data: fresh ? state.data : undefined,
    loading: !fresh || (state.data === undefined && !state.error),
    error: fresh ? state.error : null,
    retry,
  };
}
