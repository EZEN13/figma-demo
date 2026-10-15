import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { MapPin, TrendingUp, UserPlus } from 'lucide-react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Ball } from '../graphics/Ball';
import { CourtPlayers } from '../graphics/CourtPlayers';
import { CourtScheme } from '../graphics/CourtScheme';
import { api, clubOf, keys } from '../api';
import { useQuery } from '../api/useQuery';
import type { Match } from '../data/types';
import { PROFILE_STATS } from '../data/user';
import { haptic } from '../telegram/haptics';
import { dayDiff, hhmm, rub } from '../lib/format';
import { fits, levelRange, needText, whenText } from '../lib/matchText';
import { useErrorToast } from './Home';
import s from './Matches.module.css';

type F = 'level' | 'today' | 'near';

/** 16 Открытые матчи: ближайший — крупно со схемой, ниже карточки. */
export function Matches() {
  const navigate = useNavigate();
  const q = useQuery(keys.matches(), () => api.getMatches());
  useErrorToast(q.error, q.retry);
  const [on, setOn] = useState<Record<F, boolean>>({ level: true, today: false, near: false });
  const rating = PROFILE_STATS.rating;
  const myRange = { levelMin: Math.max(1, Math.floor((rating - 0.5) * 2) / 2), levelMax: Math.ceil((rating + 0.1) * 2) / 2 };

  const list = (q.data ?? [])
    .filter((m) => (on.level ? fits(rating, m) : true))
    .filter((m) => (on.today ? dayDiff(m.date) === 0 : true))
    .filter((m) => (on.near ? (clubOf(m.courtId)?.club.distanceKm ?? 99) <= 5 : true))
    .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const [first, ...rest] = list;
  const open = (m: Match) => {
    haptic.select();
    navigate(`/match/${m.id}`);
  };
  const toggle = (k: F) => {
    haptic.select();
    setOn((x) => ({ ...x, [k]: !x[k] }));
  };

  return (
    <Screen top="dark" back={null} toast="tabbar">
      <div className={`${s.hero} on-dark`}>
        <Ball size={84} trail={1} angle={16} className={s.ball} />
        <div className={s.headRow}>
          <h1 className={s.display}>
            Открытые
            <br />
            матчи
          </h1>
        </div>
        <div className={`${s.chips} no-scrollbar`} role="group" aria-label="Фильтры матчей">
          <FilterChip on={on.level} onClick={() => toggle('level')} icon={<TrendingUp size={14} strokeWidth={2} />}>
            Ваш уровень {levelRange(myRange)}
          </FilterChip>
          <FilterChip on={on.today} onClick={() => toggle('today')}>
            Сегодня
          </FilterChip>
          <FilterChip on={on.near} onClick={() => toggle('near')} icon={<MapPin size={14} strokeWidth={2} />}>
            до 5 км
          </FilterChip>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={q.loading ? 'sk' : first ? first.id : 'empty'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {q.loading || q.error ? (
              <Skeleton h={360} r={20} style={{ background: 'var(--chalk-10)' }} />
            ) : first ? (
              <Featured m={first} onOpen={() => open(first)} />
            ) : (
              <div className={s.emptyDark}>
                <EmptyState
                  art={<CourtScheme length={180} width={90} angle={-10} lineOpacity={0.5} />}
                  title={on.level ? 'Матчей вашего уровня нет' : 'Матчей нет'}
                  text={on.level ? 'Посмотрите все матчи — можно сыграть с соперниками сильнее' : 'Снимите часть фильтров'}
                  action={
                    <Button onClick={() => setOn({ level: false, today: false, near: false })}>Показать все</Button>
                  }
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {rest.length > 0 && (
        <section className={s.more}>
          <h2 className={s.title}>Ещё {rest.length} {rest.length === 1 ? 'матч' : rest.length < 5 ? 'матча' : 'матчей'}</h2>
          {rest.map((m) => (
            <MatchCard key={m.id} m={m} onOpen={() => open(m)} />
          ))}
        </section>
      )}
      <div className={s.spacer} />
    </Screen>
  );
}

function FilterChip({ on, onClick, icon, children }: { on: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} className={`${s.fchip} ${on ? s.fchipOn : ''} pressable`} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

function Featured({ m, onOpen }: { m: Match; onOpen: () => void }) {
  const { court, club } = clubOf(m.courtId)!;
  return (
    <article className={s.featured}>
      <div className={s.fTop}>
        <div className={s.fWhen}>
          <span className={s.fTime}>{hhmm(m.start)}</span>
          <span className={s.fSub}>{whenText(m)}</span>
        </div>
        <div className={s.fPrice}>
          <span className={s.fSum}>{rub(m.pricePerPlayer)}</span>
          <span className={s.fSub}>с игрока</span>
        </div>
      </div>
      <CourtPlayers seats={m.seats} />
      <div className={s.fInfo}>
        <span className={s.fClub}>
          {club.name}, корт {court.number}
        </span>
        <span className={s.fSub}>
          Уровень {levelRange(m)}, {needText(m).toLowerCase()}
        </span>
      </div>
      <Button block icon={<UserPlus size={20} strokeWidth={2} aria-hidden />} onClick={onOpen}>
        Присоединиться
      </Button>
    </article>
  );
}

/** MatchCard: цена с игрока — ball, кнопка чернильная. */
export function MatchCard({ m, onOpen }: { m: Match; onOpen: () => void }) {
  const { court, club } = clubOf(m.courtId)!;
  return (
    <article className={s.card}>
      <div className={s.cTop}>
        <div className={s.cWhen}>
          <span className={s.cTime}>{hhmm(m.start)}</span>
          <span className={s.cSub}>{whenText(m)}</span>
        </div>
        <div className={s.cPriceCol}>
          <span className={s.cPrice}>{rub(m.pricePerPlayer)}</span>
          <span className={s.cSub}>с игрока</span>
        </div>
      </div>
      <div className={s.cClub}>
        <span className={s.cName}>{club.name}</span>
        <span className={s.cSub}>
          {club.district}, корт {court.number}, {court.indoor ? 'крытый' : 'открытый'}
        </span>
      </div>
      <div className={s.cSeatsRow}>
        <div className={s.cSeats}>
          {m.seats.map((p, i) => (p ? <PlayerAvatar key={i} state="filled" initials={p.initials} label={p.name} /> : <PlayerAvatar key={i} state="open" />))}
        </div>
        <div className={s.cNeed}>
          <span className={s.cNeedT}>{needText(m)}</span>
          <span className={s.cSub}>Уровень {levelRange(m)}</span>
        </div>
      </div>
      <button type="button" className={`${s.join} pressable`} onClick={onOpen}>
        <UserPlus size={18} strokeWidth={2} aria-hidden />
        Присоединиться
      </button>
    </article>
  );
}
