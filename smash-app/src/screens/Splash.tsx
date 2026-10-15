import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAnimate, useReducedMotion } from 'motion/react';
import { defaultFilters, useApp } from '../state/AppState';
import { useTelegram } from '../telegram/useTelegram';
import { useHeaderColor, HEADER_DARK } from '../telegram/useHeaderColor';
import { useBackButton } from '../telegram/useBackButton';
import { haptic } from '../telegram/haptics';
import { isDev, tg } from '../telegram/tg';
import { api } from '../api';
import { Ball } from '../graphics/Ball';
import { EASE, EASE_IN } from '../lib/motion';
import s from './Splash.module.css';

/** Корт сплэша 520 × 260, как в макете 01a–c. */
const L = 520;
const W = 260;
const SX = (0.695 * L) / 2;
const BALL = 56;
const DOT = 22;
const LETTERS = ['с', 'м', 'э', 'ш'];
/** угол полёта: шлейф смотрит вверх-влево */
const FLIGHT_ANGLE = 32;

type Phase = 'run' | 'logo' | 'wait';

/**
 * Сплэш 01a–01c (DESIGN.md → Движение → Сплэш, 1,6 с):
 * 0–500 корт прорисовывается, мяч влетает с ускорением; 500–800 удар: сплющивание, два кольца,
 * восемь искр, вспышка линий, haptic medium; 800–1400 корт гаснет, мяч становится точкой,
 * буквы поднимаются по очереди; 1400–1600 пауза и переход.
 * Данные готовы раньше (повторный запуск) — прыжок к 01c; позже — держим 01c с прогрессом.
 * reduced-motion — статичный логотип 600 мс.
 */
export function Splash() {
  const navigate = useNavigate();
  const { state } = useApp();
  const { startParam } = useTelegram();
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate();
  const [phase, setPhase] = useState<Phase>('run');
  const dotRef = useRef<HTMLSpanElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);
  useHeaderColor(HEADER_DARK);
  useBackButton(null);

  // демо: ролик играет целиком при каждом запуске; короче — только по диплинку
  const repeat = !!startParam;

  const go = () => {
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
  };

  useLayoutEffect(() => {
    tg.ready();
  }, []);

  useEffect(() => {
    let alive = true;
    const running: { stop: () => void; pause: () => void }[] = [];
    const timers: number[] = [];
    const live = new Set<{ pause: () => void }>();
    const a = (...args: Parameters<typeof animate>) => {
      const c = animate(...args);
      running.push(c);
      live.add(c);
      c.then(() => live.delete(c));
      return c;
    };
    // dev: ?splashAt=650 — заморозить ролик на кадре (проверка глазами)
    const freezeRaw = isDev ? new URLSearchParams(window.location.search).get('splashAt') : null;
    const freezeAt = freezeRaw !== null ? Number(freezeRaw) : Infinity;
    const at = (ms: number, fn: () => void) => {
      if (ms > freezeAt) return;
      timers.push(window.setTimeout(() => alive && fn(), ms));
    };
    if (Number.isFinite(freezeAt)) timers.push(window.setTimeout(() => live.forEach((c) => c.pause()), freezeAt));

    // данные главной грузим параллельно с роликом — ключ кеша совпадает с экраном 08
    let dataReady = false;
    let onData: (() => void) | null = null;
    api
      .listCourts(defaultFilters(state.districts))
      .catch(() => undefined)
      .then(() => {
        dataReady = true;
        onData?.();
      });
    const whenData = (fn: () => void) => (dataReady ? fn() : (onData = fn));

    /** вектор от точки удара до места точки после «смэш» */
    const dotOffset = () => {
      const d = dotRef.current?.getBoundingClientRect();
      const i = impactRef.current?.getBoundingClientRect();
      if (!d || !i) return { x: 120, y: 0 };
      return { x: d.left + d.width / 2 - i.left, y: d.top + d.height / 2 - i.top };
    };

    /** конечный кадр 01c (fast — прыжок за 250 мс) */
    const toLogo = (fast: boolean) => {
      const off = dotOffset();
      const k = fast ? 0 : 1;
      const d = (ms: number) => (fast ? 0.25 : ms / 1000);
      a('[data-court]', { opacity: 0.2 }, { duration: d(600), ease: EASE });
      a('[data-trail]', { opacity: 0 }, { duration: 0.1 });
      a('[data-fx]', { x: off.x }, { duration: d(300), ease: EASE });
      a('[data-fy]', { y: off.y }, { duration: d(300), ease: EASE });
      a('[data-rot]', { rotate: 0, scale: DOT / BALL }, { duration: d(300), ease: EASE });
      if (fast) impactRef.current?.setAttribute('data-off', '');
      LETTERS.forEach((_, i) =>
        a(`[data-letter="${i}"]`, { y: [24, 0], opacity: [0, 1] }, { duration: 0.28, delay: (fast ? 0.05 : 0.1) + i * 0.06 * (k || 0.5), ease: EASE }),
      );
      a('[data-sub]', { opacity: [0, 1] }, { duration: 0.25, delay: fast ? 0.25 : 0.45, ease: EASE });
    };

    const finish = () => {
      if (!alive) return;
      if (dataReady) go();
      else {
        setPhase('wait');
        whenData(go);
      }
    };

    if (reduced) {
      // статичный логотип 600 мс
      setPhase('logo');
      at(600, finish);
      return () => {
        alive = false;
        timers.forEach(clearTimeout);
      };
    }

    // 0–500: корт прорисовывается, прозрачность 0 → 0,35; вспышка на ударе и угасание
    a('[data-line]', { pathLength: [0, 1] }, { duration: 0.5, ease: EASE });
    a('[data-court]', { opacity: [0, 0.35, 1, 0.6, 0.2] }, { duration: 1.4, times: [0, 0.357, 0.464, 0.571, 1], ease: 'easeOut' });
    // с 80 мс мяч влетает из-за левого верхнего края по лёгкой дуге, с ускорением
    a('[data-fx]', { x: [-300, 0] }, { duration: 0.42, delay: 0.08, ease: [0.4, 0, 1, 1] });
    a('[data-fy]', { y: [-420, 0] }, { duration: 0.42, delay: 0.08, ease: EASE_IN });
    a('[data-rot]', { scale: [0.6, 1], rotate: [FLIGHT_ANGLE, FLIGHT_ANGLE] }, { duration: 0.42, delay: 0.08, ease: EASE_IN });
    a('[data-trail]', { scaleX: [0, 1], opacity: [1, 1] }, { duration: 0.42, delay: 0.08, ease: EASE_IN });

    let jumped = false;
    const t0 = performance.now();
    // 500: удар
    at(500, () => {
      if (jumped) return;
      haptic.press();
      a('[data-squash]', { scaleX: [1, 1.25, 0.94, 1], scaleY: [1, 0.8, 1.05, 1] }, { duration: 0.26, times: [0, 0.23, 0.6, 1], ease: EASE });
      a('[data-trail]', { opacity: 0 }, { duration: 0.12 });
      a('[data-ring="0"]', { scale: [0.4, 1.6], opacity: [1, 0] }, { duration: 0.3, ease: EASE });
      a('[data-ring="1"]', { scale: [0.4, 1.6], opacity: [1, 0] }, { duration: 0.3, delay: 0.06, ease: EASE });
      for (let k = 0; k < 8; k++) {
        a(`[data-spark="${k}"]`, { x: [0, 24], opacity: [1, 0] }, { duration: 0.2, ease: EASE });
      }
    });
    // 800–1400: мяч → точка, буквы, подпись
    at(800, () => {
      if (!jumped) toLogo(false);
    });
    // 1400–1600: пауза → переход
    at(1600, () => {
      if (!jumped) finish();
    });

    // повторный запуск: данные пришли раньше — прыжок к 01c
    if (repeat && !Number.isFinite(freezeAt)) {
      whenData(() => {
        if (!alive || jumped) return;
        const elapsed = performance.now() - t0;
        if (elapsed >= 800) return; // ролик уже на 01c — доиграет сам
        jumped = true;
        running.forEach((c) => c.stop());
        toLogo(true);
        at(elapsed < 500 ? 650 : 550, go);
      });
    }
    return () => {
      alive = false;
      onData = null;
      timers.forEach(clearTimeout);
      running.forEach((c) => c.stop());
    };
    // ролик запускается один раз
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const staticLogo = reduced || phase === 'logo';

  return (
    <div ref={scope} className={s.splash} aria-label="СМЭШ, падел-корты Москвы" role="img">
      <div className={s.stage}>
        <svg
          data-court
          className={s.court}
          width={L}
          height={W}
          viewBox={`-4 -8 ${L + 8} ${W + 16}`}
          style={{ opacity: staticLogo ? 0.2 : 0 }}
          aria-hidden
        >
          <rect x={0} y={0} width={L} height={W} fill="var(--chalk)" opacity={0.05} />
          <g fill="none" stroke="var(--chalk)" strokeLinecap="round">
            <path data-line d={`M1 1H${L - 1}V${W - 1}H1Z`} strokeWidth={2} opacity={0.85} />
            <path data-line d={`M${L / 2 - SX} 0V${W}`} strokeWidth={2} opacity={0.55} />
            <path data-line d={`M${L / 2 + SX} 0V${W}`} strokeWidth={2} opacity={0.55} />
            <path data-line d={`M${L / 2 - SX} ${W / 2}H${L / 2 + SX}`} strokeWidth={2} opacity={0.55} />
            <path data-line d={`M${L / 2} -5V${W + 5}`} strokeWidth={4} />
          </g>
        </svg>

        {/* точка удара = центр корта; отсюда кольца, искры и мяч */}
        <div ref={impactRef} className={s.impact} aria-hidden>
          {!staticLogo && (
            <>
              {[0, 1].map((i) => (
                <span key={i} data-ring={i} className={s.ring} style={{ opacity: 0 }} />
              ))}
              {Array.from({ length: 8 }, (_, k) => (
                <span key={k} className={s.sparkPos} style={{ transform: `rotate(${-(k * 45 + 22)}deg) translateX(40px)` }}>
                  <span data-spark={k} className={s.spark} style={{ opacity: 0 }} />
                </span>
              ))}
              <div data-fx className={s.fx} style={{ transform: 'translateX(-300px)' }}>
                <div data-fy style={{ transform: 'translateY(-420px)' }}>
                  <div data-rot className={s.rot} style={{ transform: `rotate(${FLIGHT_ANGLE}deg) scale(0.6)` }}>
                    <span data-trail className={s.trail}>
                      <i style={{ top: '28%', width: '50%', opacity: 0.3 }} />
                      <i style={{ top: '50%', width: '80%', opacity: 0.6 }} />
                      <i style={{ top: '72%', width: '35%', opacity: 0.3 }} />
                    </span>
                    <span data-squash className={s.body}>
                      <Ball size={BALL} />
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={s.lockup}>
          <span className={s.word} aria-hidden>
            {LETTERS.map((ch, i) => (
              <span key={i} data-letter={i} className={s.letter} style={{ opacity: staticLogo ? 1 : 0 }}>
                {ch}
              </span>
            ))}
          </span>
          <span ref={dotRef} className={s.dot} style={{ opacity: staticLogo ? 1 : 0 }} aria-hidden>
            <Ball size={DOT} />
          </span>
        </div>
        <p data-sub className={s.sub} style={{ opacity: staticLogo ? 1 : 0 }} aria-hidden>
          Падел-корты Москвы
        </p>
        {phase === 'wait' && <span className={s.progress} role="progressbar" aria-label="Загружаем корты" />}
      </div>
    </div>
  );
}
