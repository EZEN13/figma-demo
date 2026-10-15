import type { CSSProperties } from 'react';

interface Props {
  /** длина и ширина корта в px (у падела 20 × 10 м) */
  length: number;
  width: number;
  /** поворот в градусах */
  angle?: number;
  /** цвет линий: chalk на тёмном, line на светлом */
  tone?: 'chalk' | 'line';
  /** множитель прозрачности линий */
  lineOpacity?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Схема падел-корта сверху (как court() в макете): поле, рамка-стекло,
 * линии подачи, центральная линия, сетка.
 */
export function CourtScheme({ length: L, width: W, angle = 0, tone = 'chalk', lineOpacity = 1, className, style }: Props) {
  const c = tone === 'chalk' ? 'var(--chalk)' : 'var(--line)';
  const sx = (0.695 * L) / 2;
  const k = lineOpacity;
  return (
    <svg
      className={className}
      style={{ transform: angle ? `rotate(${angle}deg)` : undefined, overflow: 'visible', ...style }}
      width={L}
      height={W}
      viewBox={`0 0 ${L} ${W}`}
      aria-hidden
    >
      <rect width={L} height={W} fill={c} opacity={tone === 'chalk' ? 0.05 : 0} />
      <rect x={1} y={1} width={L - 2} height={W - 2} fill="none" stroke={c} strokeWidth={2} opacity={(tone === 'chalk' ? 0.85 : 1) * k} />
      <g fill={c} opacity={(tone === 'chalk' ? 0.55 : 1) * k}>
        <rect x={L / 2 - sx - 1} y={0} width={2} height={W} />
        <rect x={L / 2 + sx - 1} y={0} width={2} height={W} />
        <rect x={L / 2 - sx} y={W / 2 - 1} width={2 * sx} height={2} />
      </g>
      <rect x={L / 2 - 2} y={-5} width={4} height={W + 10} rx={2} fill={c} opacity={k} />
    </svg>
  );
}
