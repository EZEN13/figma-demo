import { AnimatePresence, motion } from 'motion/react';
import { EASE } from '../lib/motion';
import s from './RollNumber.module.css';

/** Сумма с перекатом цифр при изменении (SPEC §7, 250 мс). */
export function RollNumber({ value, className }: { value: string; className?: string }) {
  const chars = [...value];
  return (
    <span className={`${s.roll} ${className ?? ''}`} aria-label={value} role="text">
      {chars.map((ch, i) => (
        <span key={chars.length - i} className={s.cell} aria-hidden>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={ch}
              className={s.ch}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {ch === ' ' || ch === ' ' ? ' ' : ch}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
