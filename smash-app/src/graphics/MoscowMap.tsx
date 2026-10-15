import { MAP_LABELS, ME_ON_MAP } from '../data/clubs';
import s from './MoscowMap.module.css';

/** Нарисованная карта из макета 09: река, кольца, парки, лучи. 390 × 844. */
export function MoscowMap() {
  return (
    <>
      <svg className={s.art} width="390" height="844" viewBox="0 0 390 844" fill="none" aria-hidden>
        <path d="M250 150c40 10 70 40 60 80-8 30-50 40-70 20-22-22-30-90 10-100z" fill="#F1EEE4" fillOpacity=".06" />
        <path d="M20 600c40-20 90-10 100 30 8 40-50 70-90 50-30-14-40-64-10-80z" fill="#F1EEE4" fillOpacity=".06" />
        <path d="M-30 470C40 420 110 520 180 480 260 434 220 330 300 300 350 282 380 320 430 300" stroke="#F1EEE4" strokeOpacity=".1" strokeWidth="30" strokeLinecap="round" />
        <circle cx="220" cy="300" r="190" stroke="#F1EEE4" strokeOpacity=".16" strokeWidth="3" />
        <circle cx="220" cy="300" r="330" stroke="#F1EEE4" strokeOpacity=".1" strokeWidth="2" />
        <path
          d="M220 300L-40 120M220 300L120 -20M220 300L420 60M220 300L430 420M220 300L60 860M220 300L330 860M0 250L390 230M40 0L120 844"
          stroke="#F1EEE4"
          strokeOpacity=".1"
          strokeWidth="2"
        />
      </svg>
      {MAP_LABELS.map(([t, x, y]) => (
        <span key={t} className={s.label} style={{ left: x, top: y }} aria-hidden>
          {t}
        </span>
      ))}
      <span className={s.me} style={{ left: ME_ON_MAP.x, top: ME_ON_MAP.y }} aria-label="Вы здесь" role="img" />
    </>
  );
}
