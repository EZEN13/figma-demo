import { useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { Screen } from '../components/Screen';
import { Segment } from '../components/controls';
import { Ticket, TicketMeta, TicketTime } from '../components/Ticket';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { api, clubOf, keys } from '../api';
import { useQuery } from '../api/useQuery';
import type { Booking } from '../data/types';
import { useTelegram } from '../telegram/useTelegram';
import { haptic } from '../telegram/haptics';
import { addDays, dateShort, dayDiff, fromISO, hhmm, nowMinutes, plural, todayISO } from '../lib/format';
import { useErrorToast } from './Home';
import s from './Bookings.module.css';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const endsAt = (b: Booking) => dayDiff(b.date) * 1440 + b.start + b.duration - nowMinutes();
const isPast = (b: Booking) => endsAt(b) <= 0;

/** «Сегодня», «Завтра», «Через 3 дня» */
function whenTag(b: Booking) {
  const d = dayDiff(b.date);
  if (d === 0) return 'Сегодня';
  if (d === 1) return 'Завтра';
  return `Через ${d} ${plural(d, ['день', 'дня', 'дней'])}`;
}

/** Ближайший день с тем же днём недели, что у прошедшей брони (не сегодня). */
function nextSameWeekday(date: string) {
  const want = fromISO(date).getDay();
  let d = addDays(todayISO(), 1);
  while (fromISO(d).getDay() !== want) d = addDays(d, 1);
  return d;
}

/** 14/15 Брони: предстоящие и прошедшие. */
export function Bookings() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'past' ? 'past' : 'upcoming';
  const q = useQuery(keys.bookings(), () => api.getBookings());
  useErrorToast(q.error, q.retry);

  const all = q.data ?? [];
  const upcoming = all.filter((b) => !isPast(b)).sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const past = all.filter(isPast).sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start);

  return (
    <Screen top="light" back={null} toast="tabbar">
      <div className={s.page}>
        <h1 className={s.display}>Брони</h1>
        <Segment
          label="Брони"
          items={[
            { value: 'upcoming', label: q.data ? `Предстоящие ${upcoming.length}` : 'Предстоящие' },
            { value: 'past', label: q.data ? `Прошедшие ${past.length}` : 'Прошедшие' },
          ]}
          value={tab}
          onChange={(v) => setParams(v === 'past' ? { tab: 'past' } : {}, { replace: true })}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={q.loading ? 'sk' : tab}
            className={s.list}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {q.loading || q.error ? (
              <>
                <Skeleton h={tab === 'past' ? 72 : 236} r={16} />
                <Skeleton h={tab === 'past' ? 72 : 236} r={16} />
              </>
            ) : tab === 'upcoming' ? (
              <Upcoming list={upcoming} />
            ) : (
              <Past list={past} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Screen>
  );
}

function Upcoming({ list }: { list: Booking[] }) {
  const navigate = useNavigate();
  const { user } = useTelegram();
  if (!list.length) {
    return (
      <EmptyState
        art={<span className={s.ghostTicket} />}
        title="Пока без игр"
        text="Забронируйте корт — билет появится здесь"
        action={<Button onClick={() => navigate('/courts', { replace: true })}>Найти корт</Button>}
      />
    );
  }
  return (
    <>
      {list.map((b) => {
        const { court, club } = clubOf(b.courtId)!;
        const taken = b.seats.filter(Boolean).length;
        return (
          <button
            key={b.id}
            type="button"
            className={`${s.ticketBtn} pressable`}
            aria-label={`${club.name}, ${dateShort(b.date)}, ${hhmm(b.start)}`}
            onClick={() => {
              haptic.select();
              navigate(`/booking/${b.id}`);
            }}
          >
            <Ticket
              notch="chalk"
              className={s.ticket}
              top={
                <>
                  <div className={s.clubRow}>
                    <span className={s.club}>{club.name}</span>
                    <span className={s.when}>{whenTag(b)}</span>
                  </div>
                  <TicketTime start={hhmm(b.start)} end={hhmm(b.start + b.duration)} />
                  <TicketMeta
                    items={[
                      ['Дата', dateShort(b.date)],
                      ['Корт', `${court.number}, ${court.indoor ? 'крытый' : 'открытый'}`],
                      ['Бронь', b.code],
                    ]}
                  />
                </>
              }
              bottom={
                <div className={s.seatsRow}>
                  <div className={s.seats}>
                    {b.seats.map((p, i) =>
                      p ? (
                        <PlayerAvatar key={i} state={p.you ? 'you' : 'filled'} initials={p.you ? user.initials : p.initials} photoUrl={p.you ? user.photoUrl : undefined} label={p.you ? 'Вы' : p.name} />
                      ) : (
                        <PlayerAvatar key={i} state="open" />
                      ),
                    )}
                  </div>
                  <span className={s.count}>{taken === 4 ? 'Все в сборе' : `${taken} из 4`}</span>
                </div>
              }
            />
          </button>
        );
      })}
    </>
  );
}

function Past({ list }: { list: Booking[] }) {
  const navigate = useNavigate();
  if (!list.length) {
    return <EmptyState art={<span className={s.ghostTicket} />} title="Истории пока нет" text="Сыгранные матчи появятся здесь" />;
  }
  const groups: { month: string; items: Booking[] }[] = [];
  for (const b of list) {
    const d = fromISO(b.date);
    const month = MONTHS[d.getMonth()] + (d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : '');
    const g = groups[groups.length - 1];
    if (g?.month === month) g.items.push(b);
    else groups.push({ month, items: [b] });
  }
  return (
    <>
      {groups.map((g) => (
        <section key={g.month} className={s.group}>
          <h2 className={s.month}>{g.month}</h2>
          {g.items.map((b) => {
            const { court, club } = clubOf(b.courtId)!;
            const d = fromISO(b.date);
            const res = b.result ? `${b.result.win ? 'Победа' : 'Поражение'}, ${b.result.score}` : 'Без счёта';
            return (
              <div key={b.id} className={s.pastRow}>
                <button type="button" className={s.pastMain} onClick={() => navigate(`/booking/${b.id}`)} aria-label={`${club.name}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${res}`}>
                  <span className={s.pastDate}>
                    <span className={s.pastDay}>{String(d.getDate()).padStart(2, '0')}</span>
                    <span className={s.pastMon}>{MONTHS_SHORT[d.getMonth()]}</span>
                  </span>
                  <span className={s.pastText}>
                    <span className={s.pastClub}>{club.name}</span>
                    <span className={`${s.pastRes} ${b.result?.win ? s.win : ''}`}>{res}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`${s.repeat} pressable`}
                  aria-label={`Повторить: ${club.name}, корт ${court.number}, ${hhmm(b.start)}, ${b.duration} мин`}
                  onClick={() => {
                    haptic.select();
                    const p = new URLSearchParams({ date: nextSameWeekday(b.date), slot: String(b.start), dur: String(b.duration) });
                    navigate(`/court/${b.courtId}?${p}`);
                  }}
                >
                  <RotateCcw size={18} strokeWidth={2} aria-hidden />
                </button>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
