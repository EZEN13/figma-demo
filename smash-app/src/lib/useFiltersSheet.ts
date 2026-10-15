import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

/** Шит фильтров как `?sheet=filters` поверх 08 или 09 (SPEC §4.2). */
export function useFiltersSheet() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const open = params.get('sheet') === 'filters';

  const show = useCallback(() => {
    const next = new URLSearchParams(location.search);
    next.set('sheet', 'filters');
    navigate({ pathname: location.pathname, search: `?${next}` }, { state: { sheet: true } });
  }, [location.pathname, location.search, navigate]);

  const close = useCallback(() => {
    if ((location.state as { sheet?: boolean } | null)?.sheet) {
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(location.search);
    next.delete('sheet');
    const q = next.toString();
    navigate({ pathname: location.pathname, search: q ? `?${q}` : '' }, { replace: true });
  }, [location, navigate]);

  return { open, show, close };
}
