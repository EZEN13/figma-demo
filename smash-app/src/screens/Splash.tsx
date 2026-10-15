import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../state/AppState';
import { useTelegram } from '../telegram/useTelegram';
import { useHeaderColor, HEADER_DARK } from '../telegram/useHeaderColor';
import { useBackButton } from '../telegram/useBackButton';
import { tg } from '../telegram/tg';
import { Ball } from '../graphics/Ball';
import s from './Splash.module.css';

/**
 * Сплэш (этап 1: статичный логотип; анимация 01a–01c — этап 4).
 * Решает, куда идти: start_param → нужный экран со стеком «корень вкладки + цель»,
 * иначе онбординг или главная (SPEC §4.3).
 */
export function Splash() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { startParam } = useTelegram();
  useHeaderColor(HEADER_DARK);
  useBackButton(null);

  useEffect(() => {
    tg.ready();
    const t = window.setTimeout(() => {
      const booking = startParam?.match(/^booking_([\w-]+)$/);
      const match = startParam?.match(/^match_([\w-]+)$/);
      if (booking) {
        navigate('/bookings', { replace: true });
        navigate(`/booking/${booking[1]}`);
      } else if (match) {
        navigate('/matches', { replace: true });
        navigate(`/match/${match[1]}`);
      } else {
        navigate(state.onboarded ? '/courts' : '/welcome/1', { replace: true });
      }
    }, 900);
    return () => window.clearTimeout(t);
    // старт — один раз
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={s.splash}>
      <div className={s.logo}>
        <span className={s.word}>смэш</span>
        <Ball size={22} className={s.dot} />
      </div>
      <p className={s.sub}>Падел-корты Москвы</p>
    </div>
  );
}
