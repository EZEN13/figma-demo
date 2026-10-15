import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { CalendarPlus, UserPlus } from 'lucide-react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { Ticket, TicketMeta, TicketRow, TicketTime } from '../components/Ticket';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { CourtScheme } from '../graphics/CourtScheme';
import { api, clubOf, keys } from '../api';
import { useQuery } from '../api/useQuery';
import type { Booking } from '../data/types';
import { useTelegram } from '../telegram/useTelegram';
import { haptic } from '../telegram/haptics';
import { appLink, confirmAction, shareURL } from '../telegram/tg';
import { addDays, dateMedium, fromISO, hhmm, relDay, rub, todayISO, nowMinutes } from '../lib/format';
import { buildIcs, openIcs } from '../lib/calendar';
import { useBackTo, useGoBack } from '../lib/nav';
import { EASE } from '../lib/motion';
import { useErrorToast } from './Home';
import s from './BookingSuccess.module.css';

/** Минут до начала брони от «сейчас». */
function minutesUntil(b: Booking) {
  const days = Math.round((fromISO(b.date).getTime() - fromISO(todayISO()).getTime()) / 86400000);
  return days * 1440 + b.start - nowMinutes();
}

/** «Бесплатная отмена до 13:00 сегодня» (SPEC §5.2: бесплатно, если до начала > 6 ч). */
function cancelNote(b: Booking): string {
  if (minutesUntil(b) <= 360) return 'Бесплатная отмена уже недоступна';
  let min = b.start - 360;
  let date = b.date;
  if (min < 0) {
    min += 1440;
    date = addDays(date, -1);
  }
  const d = relDay(date);
  const when = d === 'Сегодня' || d === 'Завтра' ? d.toLowerCase() : d;
  return `Бесплатная отмена до ${hhmm(min)} ${when}`;
}

/** 13 Бронь подтверждена (`/booking/:id/success`) и просмотр брони 13* (`/booking/:id`). */
export function BookingSuccess({ mode }: { mode: 'success' | 'view' }) {
  const { id = '' } = useParams();
  const goBack = useGoBack();
  const backTo = useBackTo();
  const q = useQuery(keys.booking(id), () => api.getBooking(id));
  useErrorToast(q.error && q.error.message !== 'not_found' ? q.error : null, q.retry);
  const back = mode === 'success' ? () => backTo('/bookings') : () => goBack('/bookings');

  if (q.loading || (q.error && q.error.message !== 'not_found')) {
    return (
      <Screen top="dark" bg="ink" back={back}>
        <div className={s.loading}>
          <Skeleton h={300} r={20} />
          <Skeleton h={80} r={16} />
        </div>
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen top="light" back={back}>
        <EmptyState
          art={<CourtScheme length={220} width={110} angle={-10} tone="line" />}
          title="Брони нет"
          text="Её отменили или ссылка устарела"
          action={<Button onClick={() => backTo('/bookings')}>Мои брони</Button>}
        />
      </Screen>
    );
  }
  return <BookingView b={q.data} mode={mode} back={back} />;
}

function BookingView({ b, mode, back }: { b: Booking; mode: 'success' | 'view'; back: () => void }) {
  const { court, club } = clubOf(b.courtId)!;
  const { user } = useTelegram();
  const toast = useToast();
  const navigate = useNavigate();
  const fired = useRef(false);
  const success = mode === 'success';
  const past = minutesUntil(b) + b.duration < 0;

  useEffect(() => {
    if (success && !fired.current) {
      fired.current = true;
      haptic.success();
    }
  }, [success]);

  const taken = b.seats.filter(Boolean).length;
  const open = 4 - taken;
  const waiting = b.split === 'split' ? Math.max(0, b.total - b.paid - (taken - 1) * b.paid) : 0;
  const words = b.matchId ? ['Вы', 'в матче!'] : ['Корт', 'ваш!'];

  const share = () => {
    haptic.press();
    shareURL(appLink(`booking_${b.id}`), `Играем в падел: ${club.name}, ${relDay(b.date).toLowerCase()} в ${hhmm(b.start)}. Есть место — присоединяйся!`);
  };

  const calendar = () => {
    openIcs(
      buildIcs({
        uid: b.code,
        title: `Падел, ${club.name}`,
        location: `${club.name}, корт ${court.number}, ${club.address}`,
        date: b.date,
        start: b.start,
        duration: b.duration,
        description: `Бронь ${b.code}`,
      }),
      `smash-${b.code}.ics`,
    );
    toast('Событие добавлено в календарь');
  };

  const cancel = async () => {
    if (!(await confirmAction(`Отменить бронь ${b.code}? Деньги вернутся на тот же счёт.`))) return;
    await api.cancelBooking(b.id);
    haptic.success();
    toast('Бронь отменена, деньги вернутся в течение дня');
    navigate('/bookings', { replace: true, state: { dir: 'back' } });
  };

  return (
    <Screen top="dark" bg="ink" back={back} toast="bottom">
      <div className={`${s.page} on-dark`}>
        {success && (
          <header className={s.header}>
            <h1 className={s.display} aria-label={words.join(' ')}>
              {words.map((w, i) => (
                <motion.span
                  key={w}
                  className={i === 1 ? s.accent : undefined}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: EASE, delay: 0.1 + i * 0.06 }}
                  aria-hidden
                >
                  {w}
                </motion.span>
              ))}
            </h1>
            <p className={s.sub}>Бронь подтверждена, чек придёт в чат с ботом</p>
          </header>
        )}

        <motion.div
          className={s.ticketWrap}
          initial={success ? { opacity: 0, y: 24 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE, delay: success ? 0.15 : 0 }}
        >
          <Ticket
            top={
              <>
                <div className={s.clubRow}>
                  <span className={s.club}>{club.name}</span>
                  <span className={s.courtName}>
                    Корт {court.number}, {court.indoor ? 'крытый' : 'открытый'}
                  </span>
                </div>
                <TicketTime start={hhmm(b.start)} end={hhmm(b.start + b.duration)} />
                <TicketMeta
                  items={[
                    ['Дата', dateMedium(b.date)],
                    ['Длительность', `${b.duration} мин`],
                    ['Игроков', '4'],
                  ]}
                />
              </>
            }
            bottom={
              <>
                <TicketRow k="Номер брони" v={b.code} />
                <TicketRow k="Вы оплатили" v={rub(b.paid)} />
                {waiting > 0 && <TicketRow k="Ждём от игроков" v={rub(waiting)} />}
                {b.result && <TicketRow k={b.result.win ? 'Победа' : 'Поражение'} v={b.result.score} />}
              </>
            }
          />
        </motion.div>

        <section className={s.players}>
          <div className={s.playersHead}>
            <h2 className={s.title}>Игроки</h2>
            <span className={s.count}>{taken} из 4</span>
          </div>
          <ul className={s.seats}>
            {b.seats.map((p, i) => (
              <li key={i} className={s.seat}>
                {p ? (
                  <>
                    <PlayerAvatar state={p.you ? 'you' : 'filled'} initials={p.you ? user.initials : p.initials} photoUrl={p.you ? user.photoUrl : undefined} size={56} dark label={p.you ? 'Вы' : p.name} />
                    <span className={s.seatName}>{p.you ? 'Вы' : p.name.split(' ')[0]}</span>
                  </>
                ) : (
                  <>
                    <button type="button" className={`${s.openBtn} pressable`} onClick={share} disabled={past} aria-label={`Позвать на место ${i + 1}`}>
                      <PlayerAvatar state="open" size={56} dark />
                    </button>
                    <span className={`${s.seatName} ${s.seatOpen}`}>Место {i + 1}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        {!past && (
          <div className={s.actions}>
            {open > 0 && (
              <Button block icon={<UserPlus size={20} strokeWidth={2} aria-hidden />} onClick={share}>
                Позвать друзей
              </Button>
            )}
            <Button block kind="secondary" icon={<CalendarPlus size={20} strokeWidth={2} aria-hidden />} onClick={calendar}>
              Добавить в календарь
            </Button>
            {mode === 'view' && minutesUntil(b) > 360 ? (
              <button type="button" className={`${s.cancel} pressable`} onClick={cancel}>
                Отменить бронь
              </button>
            ) : null}
            <p className={s.cancelNote}>{cancelNote(b)}</p>
          </div>
        )}
      </div>
    </Screen>
  );
}
