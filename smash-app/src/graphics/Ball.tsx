import { useId, type CSSProperties } from 'react';

interface Props {
  /** диаметр мяча, px */
  size: number;
  /** длина шлейфа: 0 — без шлейфа, 1 — как в макете */
  trail?: number;
  /** поворот всей группы (шлейф смотрит против полёта) */
  angle?: number;
  className?: string;
  style?: CSSProperties;
}

/** Мяч из макета: ball-заливка, два шва ink, шлейф из трёх полос. */
export function Ball({ size, trail = 0, angle = 0, className, style }: Props) {
  const clip = useId();
  const t = Math.max(0, trail);
  const w = size * (1.1 + 1.3 * t) - (t === 0 ? size * 0.1 : 0);
  const bx = t === 0 ? 0 : size * (0.1 + 1.3 * t);
  const sw = Math.max(2, size * 0.04);
  const bars: [number, number, number][] = [
    [0.28, 0.5, 0.3],
    [0.5, 0.8, 0.6],
    [0.72, 0.35, 0.3],
  ];
  return (
    <svg
      className={className}
      style={{ transform: angle ? `rotate(${angle}deg)` : undefined, overflow: 'visible', ...style }}
      width={w}
      height={size}
      viewBox={`0 0 ${w} ${size}`}
      aria-hidden
    >
      {t > 0 &&
        bars.map(([hh, ww, op], i) => {
          const L = size * ww * t;
          return (
            <rect
              key={i}
              x={size * 1.3 * t - L}
              y={size * hh - size * 0.04}
              width={L}
              height={size * 0.08}
              rx={size * 0.04}
              fill="var(--ball)"
              opacity={op}
            />
          );
        })}
      <defs>
        <clipPath id={clip}>
          <circle cx={bx + size / 2} cy={size / 2} r={size / 2} />
        </clipPath>
      </defs>
      <circle cx={bx + size / 2} cy={size / 2} r={size / 2} fill="var(--ball)" />
      <g clipPath={`url(#${clip})`} fill="none" stroke="var(--ink)" strokeWidth={sw}>
        <circle cx={bx + size / 2 - 0.7 * size} cy={size / 2} r={size / 2 - sw / 2} />
        <circle cx={bx + size / 2 + 0.7 * size} cy={size / 2} r={size / 2 - sw / 2} />
      </g>
    </svg>
  );
}
