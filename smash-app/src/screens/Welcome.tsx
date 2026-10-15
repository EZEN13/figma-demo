import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, type PanInfo } from 'motion/react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Slot } from '../components/Slot';
import { CourtScheme } from '../graphics/CourtScheme';
import { CourtPlayers } from '../graphics/CourtPlayers';
import { Ball } from '../graphics/Ball';
import { haptic } from '../telegram/haptics';
import { useGoBack } from '../lib/nav';
import { markFlowStart } from '../lib/flow';
import { EASE } from '../lib/motion';
import { plural } from '../lib/format';
import s from './Welcome.module.css';

const SWIPE = 60;

interface Props {
  page: 1 | 2;
}

/** 02 «Корт за 30 секунд» и 03 «Соберите четвёрку». Свайп влево/вправо — между карточками. */
export function Welcome({ page }: Props) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const first = page === 1;

  useEffect(() => {
    if (first) markFlowStart();
  }, [first]);

  const next = () => navigate(first ? '/welcome/2' : '/welcome/level');
  const skip = () => {
    haptic.select();
    navigate('/welcome/level');
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE || info.velocity.x < -500) {
      haptic.select();
      next();
    } else if (!first && (info.offset.x > SWIPE || info.velocity.x > 500)) {
      haptic.select();
      goBack('/welcome/1');
    }
  };

  const footer = (
    <div className={s.footer}>
      <div className={s.dots} role="tablist" aria-label={`Карточка ${page} из 2`}>
        <span className={page === 1 ? s.dotOn : s.dot} />
        <span className={page === 2 ? s.dotOn : s.dot} />
      </div>
      <Button block onClick={next}>
        {first ? 'Дальше' : 'Начать'}
      </Button>
    </div>
  );

  return (
    <Screen top="dark" back={first ? null : () => goBack('/welcome/1')} bar={footer}>
      <motion.div className={s.swipe} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} dragDirectionLock onDragEnd={onDragEnd}>
        <div className={`${s.art} on-dark`}>
          {first ? <ArtSlots /> : <ArtFour />}
          <button type="button" className={`${s.skip} pressable`} onClick={skip}>
            Пропустить
          </button>
        </div>
        <div className={s.text}>
          <h1 className={s.display}>
            {first ? (
              <>
                Корт
                <br />
                за 30 секунд
              </>
            ) : (
              <>
                Соберите
                <br />
                четвёрку
              </>
            )}
          </h1>
          <p className={s.body}>
            {first
              ? 'Свободное время во всех клубах Москвы обновляется в реальном времени. Выбрали слот, оплатили, идёте играть.'
              : 'Не хватает игрока? Откройте матч, и к вам присоединятся люди вашего уровня. Оплата сразу делится на всех.'}
          </p>
        </div>
      </motion.div>
    </Screen>
  );
}

/** 02: превью слотов — те же Slot, что на экране корта; «живой» счётчик обновления. */
function ArtSlots() {
  const [sec, setSec] = useState(2);
  const [taken, setTaken] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => setSec((x) => (x >= 9 ? 1 : x + 1)), 1000);
    // через 1,4 с один слот «занимают» — сетка живая
    const k = window.setTimeout(() => setTaken(true), 1400);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(k);
    };
  }, []);
  const rows: [number, 'free' | 'selected' | 'busy'][][] = [
    [
      [17 * 60 + 30, 'free'],
      [19 * 60, 'selected'],
      [20 * 60 + 30, 'busy'],
    ],
    [
      [22 * 60, taken ? 'busy' : 'free'],
      [23 * 60 + 30, 'free'],
      [7 * 60, 'free'],
    ],
  ];
  return (
    <div className={s.stage} aria-hidden>
      <CourtScheme length={460} width={230} angle={16} lineOpacity={0.5} className={s.court2} />
      <motion.div
        className={s.pane}
        initial={{ opacity: 0, y: 40, rotate: -10 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
      >
        <div className={s.paneHead}>
          <span className={s.live} />
          Обновлено {sec} {plural(sec, ['секунду', 'секунды', 'секунд'])} назад
        </div>
        {rows.map((r, i) => (
          <div key={i} className={s.paneRow}>
            {r.map(([t, st]) => (
              <Slot key={t} start={t} hourly={3200} state={st} onPress={() => undefined} />
            ))}
          </div>
        ))}
      </motion.div>
      <motion.span
        className={s.ball2}
        initial={{ opacity: 0, x: -120, y: -60 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
      >
        <Ball size={48} trail={1} angle={-24} />
      </motion.span>
    </div>
  );
}

/** 03: схема корта, три места заняты, четвёртое ждёт. */
function ArtFour() {
  return (
    <div className={s.stage} aria-hidden>
      <motion.div className={s.four} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: EASE }}>
        <CourtPlayers
          big
          seats={[
            { name: 'Аня К.', initials: 'АК' },
            { name: 'Дима С.', initials: 'ДС' },
            { name: 'Олег В.', initials: 'ОВ' },
            null,
          ]}
        />
        <motion.span
          className={s.need}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE, delay: 0.35 }}
        >
          Нужен 1 игрок
        </motion.span>
      </motion.div>
      <motion.span
        className={s.ball3}
        initial={{ opacity: 0, x: -80, y: -40 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
      >
        <Ball size={40} trail={1} angle={20} />
      </motion.span>
    </div>
  );
}
