import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Heart, MapPin, Star } from 'lucide-react';
import { Screen } from '../components/Screen';
import { BottomBar } from '../components/BottomBar';
import { Button } from '../components/Button';
import { Slot } from '../components/Slot';
import { DateStrip, Segment, TagChip } from '../components/controls';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { CourtScheme } from '../graphics/CourtScheme';
import { Ball } from '../graphics/Ball';
import { api, clubOf, keys } from '../api';
import { useQuery } from '../api/useQuery';
import { DEFAULT_DURATION, DURATIONS, priceFor, startsFor, WINDOWS, type StartSlot } from '../data/slots';
import type { Duration, TimeOfDay } from '../data/types';
import { useApp } from '../state/AppState';
import { haptic } from '../telegram/haptics';
import { decimal, hhmm, isValidISO, relDayLong, rub, todayISO, dayDiff } from '../lib/format';
import { useGoBack } from '../lib/nav';
import { EASE } from '../lib/motion';
import { useErrorToast } from './Home';
import s from './Court.module.css';

const GROUPS: [Exclude<TimeOfDay, 'any'>, string][] = [
  ['morning', 'Утро'],
  ['day', 'День'],
  ['evening', 'Вечер'],
];

function readParams(p: URLSearchParams) {
  const rawDate = p.get('date');
  const date = isValidISO(rawDate) && dayDiff(rawDate) >= 0 && dayDiff(rawDate) < 14 ? rawDate : todayISO();
  const durN = Number(p.get('dur'));
  const dur = (DURATIONS as number[]).includes(durN) ? (durN as Duration) : DEFAULT_DURATION;
  const slotN = p.get('slot');
  const slot = slotN !== null && /^\d+$/.test(slotN) ? Number(slotN) : null;
  return { date, dur, slot };
}

/** 11 Корт: слоты на день, длительность, сумма и CTA внизу. */
export function Court() {
  const { courtId = '' } = useParams();
  const found = clubOf(courtId);
  const goBack = useGoBack();
  if (!found) {
    return (
      <Screen top="light" back={() => goBack('/courts')}>
        <EmptyState
          art={<CourtScheme length={220} width={110} angle={-10} tone="line" />}
          title="Корт не найден"
          text="Возможно, ссылка устарела"
          action={<Button onClick={() => goBack('/courts')}>К списку кортов</Button>}
        />
      </Screen>
    );
  }
  return <CourtView courtId={courtId} />;
}

function CourtView({ courtId }: { courtId: string }) {
  const { court, club } = clubOf(courtId)!;
  const [params, setParams] = useSearchParams();
  const { date, dur, slot } = readParams(params);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const toast = useToast();
  const { state, dispatch } = useApp();
  const [datesOpen, setDatesOpen] = useState(false);
  const fav = state.favorites.includes(courtId);

  const q = useQuery(keys.court(courtId, date), () => api.getCourtDay(courtId, date));
  useErrorToast(q.error, q.retry);
  const starts = useMemo(() => (q.data ? startsFor(court, date, q.data.busy, dur) : []), [q.data, court, date, dur]);
  const selected = slot !== null ? starts.find((x) => x.start === slot && x.free) : undefined;

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  // выбранный слот больше недоступен (заняли, прошёл) — сбрасываем молча
  useEffect(() => {
    if (q.data && slot !== null && !starts.some((x) => x.start === slot && x.free)) update({ slot: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);

  const changeDur = (d: Duration) => {
    if (slot !== null && q.data) {
      const ok = startsFor(court, date, q.data.busy, d).some((x) => x.start === slot && x.free);
      if (!ok) {
        toast(`На ${d} мин это время занято`);
        update({ dur: String(d), slot: null });
        return;
      }
    }
    update({ dur: String(d) });
  };

  const press = (x: StartSlot) => {
    if (!x.free) {
      haptic.warning();
      return;
    }
    haptic.select();
    update({ slot: String(x.start) });
  };

  const total = selected ? priceFor(court, date, selected.start, dur) : 0;
  const freeCount = starts.filter((x) => x.free).length;
  const groups = GROUPS.map(([id, label]) => ({ id, label, items: starts.filter((x) => x.start >= WINDOWS[id][0] && x.start < WINDOWS[id][1]) })).filter(
    (g) => g.items.length,
  );

  const bar = (
    <BottomBar sum={selected ? rub(total) : undefined} note={selected ? `${hhmm(selected.start)}–${hhmm(selected.start + dur)}, ${dur} мин` : undefined}>
      {selected ? (
        <Button onClick={() => navigate(`/pay?${new URLSearchParams({ court: courtId, date, slot: String(selected.start), dur: String(dur) })}`)}>
          Забронировать
        </Button>
      ) : (
        <Button disabled>Выберите время</Button>
      )}
    </BottomBar>
  );

  const tags = [court.indoor ? 'Крытый' : 'Открытый', ...court.features];

  return (
    <Screen top="dark" back={() => goBack('/courts')} toast="bar" bar={bar}>
      <div className={`${s.hero} on-dark`}>
        <span className={s.number} aria-hidden>
          {String(court.number).padStart(2, '0')}
        </span>
        <CourtScheme length={330} width={165} angle={-16} className={s.scheme} />
        <Ball size={64} trail={1} angle={30} className={s.ball} />
        <button
          type="button"
          className={`${s.fav} ${fav ? s.favOn : ''} pressable`}
          aria-pressed={fav}
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
          onClick={() => {
            haptic.select();
            dispatch({ type: 'toggleFavorite', courtId });
          }}
        >
          <Heart size={20} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} aria-hidden />
        </button>
        <div className={s.tags}>
          {tags.map((t) => (
            <TagChip key={t} solid>
              {t}
            </TagChip>
          ))}
          <TagChip solid icon={<Star size={14} strokeWidth={2} />}>{decimal(club.rating)}</TagChip>
        </div>
      </div>

      <div className={s.content}>
        <div className={s.titleBlock}>
          <h1 className={s.title}>{club.name}</h1>
          <p className={s.address}>
            <MapPin size={16} strokeWidth={2} aria-hidden />
            Корт {court.number}, {club.address}
          </p>
        </div>

        <section className={s.block} aria-label="Время">
          <div className={s.slotsHead}>
            <button
              type="button"
              className={`${s.dateBtn} pressable`}
              aria-expanded={datesOpen}
              onClick={() => {
                haptic.select();
                setDatesOpen((v) => !v);
              }}
            >
              {relDayLong(date)}
              <ChevronDown size={18} strokeWidth={2} className={datesOpen ? s.chevOn : s.chev} aria-hidden />
            </button>
            {q.data && (
              <span className={s.count}>
                {freeCount} из {starts.length} свободны
              </span>
            )}
          </div>
          <AnimatePresence initial={false}>
            {datesOpen && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: EASE }}>
                <DateStrip
                  from={todayISO()}
                  value={date}
                  onChange={(d) => {
                    update({ date: d, slot: null });
                    setDatesOpen(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {q.loading || q.error ? (
            <div className={s.grid} aria-busy>
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} h={56} r={8} />
              ))}
            </div>
          ) : starts.length === 0 ? (
            <p className={s.none}>На сегодня время закончилось. Выберите другую дату.</p>
          ) : (
            <motion.div className={s.groups} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              {groups.map((g) => (
                <div key={g.id} className={s.group}>
                  <h3 className={s.groupTitle}>{g.label}</h3>
                  <div className={s.grid}>
                    {g.items.map((x) => (
                      <Slot
                        key={x.start}
                        start={x.start}
                        hourly={x.hourly}
                        state={!x.free ? 'busy' : x.start === selected?.start ? 'selected' : 'free'}
                        onPress={() => press(x)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </section>

        <section className={s.block}>
          <h2 className={s.h}>Длительность</h2>
          <Segment label="Длительность" items={DURATIONS.map((d) => ({ value: d, label: `${d} мин` }))} value={dur} onChange={changeDur} />
        </section>
      </div>
    </Screen>
  );
}
