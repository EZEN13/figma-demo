import { useNavigate } from 'react-router';
import { Bell, ChevronRight, CreditCard, RotateCcw, Settings, TrendingUp, type LucideIcon } from 'lucide-react';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { api, clubOf, keys } from '../api';
import { useQuery } from '../api/useQuery';
import { LEVELS, PROFILE_STATS } from '../data/user';
import { useApp, resetDemoStorage } from '../state/AppState';
import { useTelegram } from '../telegram/useTelegram';
import { confirmAction } from '../telegram/tg';
import { haptic } from '../telegram/haptics';
import { decimal, dayDiff, nowMinutes } from '../lib/format';
import { levelRange } from '../lib/matchText';
import s from './Profile.module.css';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const DELTAS = ['+0,08', '−0,05', '+0,06', '+0,04', '+0,07'];

/** 18 Профиль: рейтинг и рост, статистика, последние матчи, настройки. */
export function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useTelegram();
  const { state } = useApp();
  const q = useQuery(keys.bookings(), () => api.getBookings());
  const level = LEVELS.find((l) => l.id === state.level)!;
  const past = (q.data ?? [])
    .filter((b) => dayDiff(b.date) * 1440 + b.start + b.duration - nowMinutes() <= 0 && b.result)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const { history, rating } = PROFILE_STATS;
  const growth = rating - history[0];
  const months = Array.from({ length: 4 }, (_, i) => MONTHS[(new Date().getMonth() - 3 + i + 12) % 12]);
  const district = state.districts[0] ?? 'Москва';

  const settings: { icon: LucideIcon; title: string; sub?: string; onClick: () => void }[] = [
    {
      icon: TrendingUp,
      title: 'Уровень и районы',
      sub: [levelRange({ levelMin: level.min, levelMax: level.max }), state.districts.slice(0, 2).join(', ')].filter(Boolean).join(', '),
      onClick: () => navigate('/profile/level'),
    },
    { icon: CreditCard, title: 'Способы оплаты', sub: 'СБП, Мир 4417', onClick: () => toast('Способы оплаты — скоро') },
    { icon: Bell, title: 'Уведомления', sub: 'Матчи моего уровня', onClick: () => toast('Настройка уведомлений — скоро') },
  ];
  // демо: сброс доступен и в Telegram, чтобы заново посмотреть сплэш и онбординг
  settings.push({
    icon: RotateCcw,
    title: 'Сбросить демо',
    sub: 'Очистить данные и начать с онбординга',
    onClick: async () => {
      if (!(await confirmAction('Сбросить демо? Брони и настройки удалятся.'))) return;
      resetDemoStorage();
      window.location.replace(window.location.pathname + '#/');
      window.location.reload();
    },
  });

  return (
    <Screen top="dark" back={null} toast="tabbar">
      <div className={`${s.hero} on-dark`}>
        <div className={s.topRow}>
          <button type="button" className={`${s.round} pressable`} aria-label="Настройки" onClick={() => toast('Настройки — скоро')}>
            <Settings size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <div className={s.me}>
          <span className={s.avatar}>{user.photoUrl ? <img src={user.photoUrl} alt="" /> : user.initials}</span>
          <div className={s.meText}>
            <h1 className={s.name}>{user.fullName}</h1>
            <p className={s.since}>
              {district}, в СМЭШ с {PROFILE_STATS.since}
            </p>
          </div>
        </div>
        <div className={s.ratingRow}>
          <div className={s.ratingVal}>
            <span className={s.ratingLabel}>Рейтинг</span>
            <span className={s.rating}>{decimal(rating)}</span>
          </div>
          <span className={s.growth}>
            <TrendingUp size={14} strokeWidth={2} aria-hidden />+{decimal(growth)} за 3 месяца
          </span>
        </div>
        <Chart points={history} />
        <div className={s.months} aria-hidden>
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      <div className={s.content}>
        <dl className={s.stats}>
          {[
            [String(PROFILE_STATS.matches), 'матчей'],
            [`${PROFILE_STATS.winRate} %`, 'побед'],
            [String(PROFILE_STATS.hours), 'часа на корте'],
          ].map(([v, k]) => (
            <div key={k} className={s.stat}>
              <dd className={s.statV}>{v}</dd>
              <dt className={s.statK}>{k}</dt>
            </div>
          ))}
        </dl>

        <section className={s.section}>
          <div className={s.sectionHead}>
            <h2 className={s.h}>Последние матчи</h2>
            <button type="button" className={`${s.all} pressable`} onClick={() => navigate('/bookings?tab=past', { replace: true })}>
              Все {PROFILE_STATS.matches}
            </button>
          </div>
          {past.map((b, i) => (
            <button key={b.id} type="button" className={`${s.game} pressable`} onClick={() => navigate(`/booking/${b.id}`)}>
              <span className={s.gameText}>
                <span className={s.gameRes}>{b.result!.win ? 'Победа' : 'Поражение'}</span>
                <span className={s.gameSub}>
                  {b.result!.score}, {clubOf(b.courtId)!.club.district}
                </span>
              </span>
              <span className={`${s.delta} ${DELTAS[i].startsWith('+') ? '' : s.minus}`}>{DELTAS[i]}</span>
            </button>
          ))}
        </section>

        <section className={s.section}>
          <h2 className={s.h}>Настройки</h2>
          <ul className={s.settings}>
            {settings.map(({ icon: Icon, title, sub, onClick }) => (
              <li key={title}>
                <button
                  type="button"
                  className={s.setRow}
                  onClick={() => {
                    haptic.select();
                    onClick();
                  }}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden />
                  <span className={s.setText}>
                    <span className={s.setTitle}>{title}</span>
                    {sub && <span className={s.setSub}>{sub}</span>}
                  </span>
                  <ChevronRight size={20} strokeWidth={2} className={s.chev} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Screen>
  );
}

/** График рейтинга за 3 месяца: линия ball по 12 точкам, последняя — крупная. */
function Chart({ points }: { points: number[] }) {
  const W = 350;
  const H = 120;
  const min = Math.min(...points) - 0.1;
  const max = Math.max(...points) + 0.1;
  const xy = points.map((v, i) => [(i / (points.length - 1)) * (W - 14) + 7, H - 14 - ((v - min) / (max - min)) * (H - 28)] as const);
  const last = xy[xy.length - 1];
  return (
    <svg className={s.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Рейтинг вырос с ${decimal(points[0])} до ${decimal(points[points.length - 1])}`}>
      <path d={`M0 30H${W}M0 60H${W}M0 90H${W}`} stroke="var(--chalk)" strokeOpacity=".1" vectorEffect="non-scaling-stroke" />
      <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--ball)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={7} fill="var(--ball)" />
    </svg>
  );
}
