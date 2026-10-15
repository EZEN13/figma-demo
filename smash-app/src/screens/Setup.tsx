import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Heart } from 'lucide-react';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { Chip } from '../components/controls';
import { useToast } from '../components/Toast';
import { CLUBS, DISTRICTS } from '../data/clubs';
import { LEVELS, type LevelInfo } from '../data/user';
import { useApp, type LevelId } from '../state/AppState';
import { haptic } from '../telegram/haptics';
import { decimal, km } from '../lib/format';
import { useGoBack } from '../lib/nav';
import s from './Setup.module.css';

type Mode = 'onboarding' | 'edit';

function Progress({ step }: { step: 1 | 2 }) {
  return (
    <div className={s.progress} aria-label={`Шаг ${step} из 2`}>
      <span className={s.bars} aria-hidden>
        <span className={s.barOn} />
        <span className={step === 2 ? s.barOn : s.bar} />
      </span>
      <span className={s.step}>{step} из 2</span>
    </div>
  );
}

/** 06 Уровень игры (онбординг) и 06* правка из профиля. */
export function LevelScreen({ mode }: { mode: Mode }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [level, setLevel] = useState<LevelId>(state.level);
  const edit = mode === 'edit';

  const footer = (
    <div className={s.footer}>
      <Button
        block
        onClick={() => {
          dispatch({ type: 'setLevel', level });
          navigate(edit ? '/profile/places' : '/welcome/places');
        }}
      >
        Дальше
      </Button>
    </div>
  );

  return (
    <Screen top="light" back={() => goBack(edit ? '/profile' : '/welcome/2')} bar={footer}>
      <div className={s.page}>
        {!edit && <Progress step={1} />}
        <header className={s.head}>
          <h1 className={s.display}>Ваш уровень</h1>
          <p className={s.sub}>По нему подбираем матчи и соперников. Поменять можно в профиле.</p>
        </header>
        <div className={s.levels} role="radiogroup" aria-label="Уровень игры">
          {LEVELS.map((l) => (
            <LevelOption
              key={l.id}
              l={l}
              on={l.id === level}
              onSelect={() => {
                if (l.id !== level) haptic.select();
                setLevel(l.id);
              }}
            />
          ))}
        </div>
      </div>
    </Screen>
  );
}

/** LevelOption: в выбранном — шкала 1,0–7,0 с диапазоном в ball. */
function LevelOption({ l, on, onSelect }: { l: LevelInfo; on: boolean; onSelect: () => void }) {
  const range = l.min === l.max ? decimal(l.min) : `${decimal(l.min)}–${decimal(l.max)}`;
  return (
    <button type="button" role="radio" aria-checked={on} className={`${s.level} ${on ? s.levelOn : ''} pressable`} onClick={onSelect}>
      <span className={s.levelRow}>
        <span className={s.levelText}>
          <span className={s.levelTitle}>{l.title}</span>
          <span className={s.levelDesc}>{l.desc}</span>
        </span>
        <span className={s.levelRange}>{range}</span>
      </span>
      {on && (
        <span className={s.scale} aria-hidden>
          <span className={s.scaleEdge}>1,0</span>
          {Array.from({ length: 13 }, (_, i) => {
            const v = 1 + i * 0.5;
            return <span key={i} className={v >= l.min && v <= l.max ? s.tickOn : s.tick} />;
          })}
          <span className={s.scaleEdge}>7,0</span>
        </span>
      )}
    </button>
  );
}

/** 07 Районы и клубы (онбординг) и 07* правка из профиля. */
export function PlacesScreen({ mode }: { mode: Mode }) {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const toast = useToast();
  const [districts, setDistricts] = useState<string[]>(state.districts);
  const edit = mode === 'edit';
  const favKey = (id: string) => `club:${id}`;

  const save = () => {
    dispatch({ type: 'setDistricts', districts });
    if (edit) {
      toast('Сохранено');
      navigate('/profile', { replace: true, state: { dir: 'back' } });
    } else {
      dispatch({ type: 'onboard' });
      navigate('/courts', { replace: true });
    }
  };

  const footer = (
    <div className={s.footer}>
      <Button block onClick={save}>
        {edit ? 'Сохранить' : 'Готово'}
      </Button>
    </div>
  );

  return (
    <Screen top="light" back={() => goBack(edit ? '/profile/level' : '/welcome/level')} bar={footer}>
      <div className={s.page}>
        {!edit && <Progress step={2} />}
        <header className={s.head}>
          <h1 className={s.display}>Где играете?</h1>
          <p className={s.sub}>Покажем корты и матчи рядом. Можно выбрать несколько районов.</p>
        </header>
        <div className={s.chips}>
          {DISTRICTS.map((d) => {
            const on = districts.includes(d);
            return (
              <Chip key={d} selected={on} onToggle={() => setDistricts(on ? districts.filter((x) => x !== d) : [...districts, d])}>
                {d}
              </Chip>
            );
          })}
        </div>
        <section className={s.clubs}>
          <h2 className={s.h}>Любимые клубы</h2>
          <ul>
            {[...CLUBS]
              .sort((a, b) => a.distanceKm - b.distanceKm)
              .slice(0, 5)
              .map((c) => {
                const fav = state.favorites.includes(favKey(c.id));
                return (
                  <li key={c.id} className={s.clubRow}>
                    <span className={s.clubText}>
                      <span className={s.clubName}>{c.name}</span>
                      <span className={s.clubSub}>
                        {c.district}, {km(c.distanceKm)}
                      </span>
                    </span>
                    <button
                      type="button"
                      className={`${s.heart} pressable`}
                      aria-pressed={fav}
                      aria-label={fav ? `Убрать ${c.name} из любимых` : `${c.name} в любимые`}
                      onClick={() => {
                        haptic.select();
                        dispatch({ type: 'toggleFavorite', courtId: favKey(c.id) });
                      }}
                    >
                      <Heart size={20} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} aria-hidden />
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      </div>
    </Screen>
  );
}
