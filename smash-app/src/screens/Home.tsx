import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { Screen } from '../components/Screen';
import { DateStrip } from '../components/controls';
import { CourtCard } from '../components/CourtCard';
import { SkeletonCard } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { useToast } from '../components/Toast';
import { Ball } from '../graphics/Ball';
import { CourtScheme } from '../graphics/CourtScheme';
import { api, keys } from '../api';
import { useQuery } from '../api/useQuery';
import { defaultFilters, useApp } from '../state/AppState';
import { useTelegram } from '../telegram/useTelegram';
import { haptic } from '../telegram/haptics';
import { todayISO } from '../lib/format';
import { useFiltersSheet } from '../lib/useFiltersSheet';
import { FiltersSheet } from './Filters';
import s from './Home.module.css';

/** Фильтры отличаются от дефолтных (кроме даты) — точка на кнопке фильтров. */
export function useFiltersActive() {
  const { state } = useApp();
  const d = defaultFilters(state.districts);
  const f = state.filters;
  return f.time !== d.time || f.maxPrice !== d.maxPrice || f.courtType !== d.courtType || f.districts.join() !== d.districts.join();
}

/** Ошибка сети → тост с «Повторить» (SPEC §6). */
export function useErrorToast(error: Error | null, retry: () => void) {
  const toast = useToast();
  useEffect(() => {
    if (error) toast(error.message === 'offline' ? 'Нет сети. Данные не загрузились' : 'Не получилось загрузить', { label: 'Повторить', onClick: retry });
  }, [error, retry, toast]);
}

/** 08 Главная: свободные корты на дату рядом. */
export function Home() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { user } = useTelegram();
  const toast = useToast();
  const sheet = useFiltersSheet();
  const active = useFiltersActive();
  const f = state.filters;
  const q = useQuery(keys.courts(f), () => api.listCourts(f));
  useErrorToast(q.error, q.retry);

  const openCourt = (courtId: string, start?: number) => {
    const p = new URLSearchParams({ date: f.date, dur: '90' });
    if (start !== undefined) p.set('slot', String(start));
    navigate(`/court/${courtId}?${p}`);
  };

  return (
    <Screen top="dark" back={null} toast="tabbar">
      <header className={`${s.hero} on-dark`}>
        <Ball size={100} trail={1} angle={18} className={s.heroBall} />
        <div className={s.bar}>
          <span className={s.logo} aria-label="СМЭШ">
            смэш
          </span>
          <button type="button" className={`${s.round} pressable`} aria-label="Уведомления" onClick={() => toast('Уведомления скоро')}>
            <Bell size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className={s.greet}>
          <p className={s.hello}>Привет, {user.firstName}</p>
          <h1 className={s.display}>
            Корт
            <br />
            на вечер?
          </h1>
        </div>
        <div className={s.searchRow}>
          <button type="button" className={`${s.search} pressable`} onClick={() => navigate('/courts/map?focus=1')}>
            <Search size={20} strokeWidth={2} aria-hidden />
            <span>Район, метро или клуб</span>
          </button>
          <button type="button" className={`${s.filterBtn} pressable`} aria-label="Фильтры" onClick={sheet.show}>
            <SlidersHorizontal size={20} strokeWidth={2} aria-hidden />
            {active && <span className={s.dot} aria-hidden />}
          </button>
        </div>
      </header>

      <div className={s.body}>
        <DateStrip from={todayISO()} value={f.date} onChange={(date) => dispatch({ type: 'setFilters', patch: { date } })} />

        <div className={s.sectionHead}>
          <h2 className={s.title}>Рядом с вами</h2>
          <button
            type="button"
            className={`${s.mapLink} pressable`}
            onClick={() => {
              haptic.select();
              navigate('/courts/map');
            }}
          >
            <MapPin size={16} strokeWidth={2} aria-hidden />
            На карте
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={q.loading || q.error ? 'sk' : q.data?.length ? 'list' : 'empty'}
            className={s.list}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-busy={q.loading}
          >
            {q.loading || q.error ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : q.data?.length ? (
              q.data.map((hit, i) => <CourtCard key={hit.club.id} hit={hit} date={f.date} variant={i} onOpen={openCourt} />)
            ) : (
              <EmptyState
                art={<CourtScheme length={220} width={110} angle={-10} tone="line" />}
                title="Ничего не нашли"
                text="На эту дату с такими фильтрами свободных кортов нет"
                action={<Button onClick={() => dispatch({ type: 'resetFilters' })}>Сбросить фильтры</Button>}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <FiltersSheet open={sheet.open} onClose={sheet.close} />
    </Screen>
  );
}
