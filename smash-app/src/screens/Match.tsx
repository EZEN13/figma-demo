import { useNavigate, useParams } from 'react-router';
import { Share } from 'lucide-react';
import { Screen } from '../components/Screen';
import { BottomBar } from '../components/BottomBar';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { CourtPlayers } from '../graphics/CourtPlayers';
import { CourtScheme } from '../graphics/CourtScheme';
import { api, clubOf, keys } from '../api';
import { useQuery } from '../api/useQuery';
import type { Match as M } from '../data/types';
import { PROFILE_STATS } from '../data/user';
import { appLink, shareURL } from '../telegram/tg';
import { haptic } from '../telegram/haptics';
import { decimal, hhmm, relDayLong, rub } from '../lib/format';
import { fits, levelRange } from '../lib/matchText';
import { useGoBack } from '../lib/nav';
import { useErrorToast } from './Home';
import s from './Match.module.css';

/** 17 Матч: кто уже играет, где ваше место, уровень; вход — оплата доли. */
export function Match() {
  const { id = '' } = useParams();
  const goBack = useGoBack();
  const q = useQuery(keys.match(id), () => api.getMatch(id));
  const notFound = q.error?.message === 'not_found';
  useErrorToast(q.error && !notFound ? q.error : null, q.retry);
  const back = () => goBack('/matches');

  if (q.loading || (q.error && !notFound)) {
    return (
      <Screen top="dark" bg="ink" back={back}>
        <div className={s.loading}>
          <Skeleton h={84} r={16} style={{ background: 'var(--chalk-10)' }} />
          <Skeleton h={200} r={16} style={{ background: 'var(--chalk-10)' }} />
        </div>
      </Screen>
    );
  }
  if (!q.data) {
    return (
      <Screen top="light" back={back}>
        <EmptyState
          art={<CourtScheme length={200} width={100} angle={-10} tone="line" />}
          title="Матч не найден"
          text="Его отменили или уже собрали"
          action={<Button onClick={back}>Все матчи</Button>}
        />
      </Screen>
    );
  }
  return <MatchView m={q.data} back={back} />;
}

const GAMES: Record<string, number> = { АК: 38, ДС: 24, ОВ: 51, МП: 17, ИГ: 64, КЛ: 42, СО: 9, НБ: 88, ВС: 21 };

function MatchView({ m, back }: { m: M; back: () => void }) {
  const navigate = useNavigate();
  const { court, club } = clubOf(m.courtId)!;
  const bq = useQuery(keys.bookings(), () => api.getBookings());
  const joined = bq.data?.find((b) => b.matchId === m.id);
  const rating = PROFILE_STATS.rating;
  const ok = fits(rating, m);
  const org = m.organizer;
  const [orgFirst, orgLast] = org.name.split(' ');

  const share = () => {
    haptic.select();
    shareURL(appLink(`match_${m.id}`), `Матч по паделу: ${club.name}, ${relDayLong(m.date).toLowerCase()} в ${hhmm(m.start)}. Нужен игрок уровня ${levelRange(m)}`);
  };

  const rows: [string, string][] = [
    ['Уровень матча', levelRange(m)],
    ['Ваш уровень', `${decimal(rating)}, ${ok ? 'подходит' : rating < m.levelMin ? 'ниже' : 'выше'}`],
    ['Формат', `${m.format}, ${m.duration} мин`],
    ['Организатор', `${orgFirst} ${orgLast?.[0] ?? ''}., ${GAMES[org.initials] ?? 12} игр`],
    ['Запись закроется', `в ${hhmm(Math.max(m.closesAt, 0))}`],
  ];

  const bar = joined ? (
    <BottomBar sum={rub(joined.paid)} note="вы в матче">
      <Button kind="secondary" onClick={() => navigate(`/booking/${joined.id}`)}>
        Открыть бронь
      </Button>
    </BottomBar>
  ) : (
    <BottomBar sum={rub(m.pricePerPlayer)} note="с игрока">
      <Button onClick={() => navigate(`/pay?match=${m.id}`)}>Присоединиться</Button>
    </BottomBar>
  );

  return (
    <Screen top="dark" bg="ink" back={back} toast="bar" bar={bar}>
      <div className={`${s.page} on-dark`}>
        <div className={s.topRow}>
          <button type="button" className={`${s.round} pressable`} aria-label="Поделиться матчем" onClick={share}>
            <Share size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <header className={s.head}>
          <h1 className={s.display}>
            Матч
            <br />в {hhmm(m.start)}
          </h1>
          <p className={s.sub}>
            {relDayLong(m.date)}. {club.name}, корт {court.number}
          </p>
        </header>

        <div className={s.court}>
          <CourtPlayers seats={m.seats} labels levelLabel={levelRange(m)} big />
          <div className={s.teams} aria-hidden>
            <span>Команда 1</span>
            <span>Команда 2</span>
          </div>
        </div>

        {!ok && <p className={s.warn}>Уровень матча {rating < m.levelMin ? 'выше' : 'ниже'} вашего. Присоединиться можно, но игра будет неровной</p>}

        <dl className={s.rows}>
          {rows.map(([k, v]) => (
            <div key={k} className={s.row}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Screen>
  );
}
