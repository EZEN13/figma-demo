import { useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { useBackButton } from '../telegram/useBackButton';
import { EASE } from '../lib/motion';
import s from './Sheet.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** закреплённый низ шита (CTA) */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Модальный нижний шит (SPEC §7): снизу за 250 мс, затемнение ink 40 %,
 * drag вниз — закрытие при смещении > 30 % или скорости > 500 px/с.
 * Пока открыт, нативная «Назад» закрывает шит.
 */
export function Sheet({ open, onClose, title, footer, children }: Props) {
  return <AnimatePresence>{open && <SheetBody onClose={onClose} title={title} footer={footer}>{children}</SheetBody>}</AnimatePresence>;
}

function SheetBody({ onClose, title, footer, children }: Omit<Props, 'open'>) {
  const controls = useDragControls();
  const panel = useRef<HTMLDivElement>(null);
  useBackButton(onClose, 'sheet');

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const h = panel.current?.offsetHeight ?? 600;
    if (info.offset.y > h * 0.3 || info.velocity.y > 500) onClose();
  };

  return (
    <div className={s.root} role="dialog" aria-modal="true" aria-label={title}>
      <motion.div
        className={s.scrim}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: EASE }}
      />
      <motion.div
        ref={panel}
        className={s.panel}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.25, ease: EASE }}
        drag="y"
        dragListener={false}
        dragControls={controls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={onDragEnd}
      >
        <div className={s.head} onPointerDown={(e) => controls.start(e)}>
          <span className={s.handle} aria-hidden />
          <div className={s.row}>
            <h2 className={s.title}>{title}</h2>
            <button type="button" className={`${s.close} pressable`} onClick={onClose} aria-label="Закрыть">
              <X size={20} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
        <div className={`${s.content} no-scrollbar`}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </motion.div>
    </div>
  );
}
