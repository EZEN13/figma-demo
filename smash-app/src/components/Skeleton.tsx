import type { CSSProperties } from 'react';
import s from './Skeleton.module.css';

/** Скелетон: line на paper, пульс 1,2 с (SPEC §6). */
export function Skeleton({ w = '100%', h = 16, r = 8, style, className }: { w?: number | string; h?: number | string; r?: number; style?: CSSProperties; className?: string }) {
  return <span aria-hidden className={`${s.sk} ${className ?? ''}`} style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`${s.card} ${className ?? ''}`} aria-hidden>
      <span className={s.art} />
      <div className={s.body}>
        <div className={s.row}>
          <Skeleton w="55%" h={20} />
          <Skeleton w={40} h={16} />
        </div>
        <Skeleton w="70%" h={14} />
        <div className={s.row} style={{ justifyContent: 'flex-start', gap: 8 }}>
          <Skeleton w={56} h={14} />
          <Skeleton w={60} h={32} />
          <Skeleton w={60} h={32} />
          <Skeleton w={60} h={32} />
        </div>
      </div>
    </div>
  );
}
