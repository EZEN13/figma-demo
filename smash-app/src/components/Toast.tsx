import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import s from './Toast.module.css';

/** Где стоит тост: над таб-баром, над нижней панелью (CTA) или просто у низа. */
export type ToastAnchor = 'tabbar' | 'bar' | 'bottom';

interface ToastData {
  id: number;
  text: string;
  action?: { label: string; onClick: () => void };
}

interface Ctx {
  show: (text: string, action?: ToastData['action']) => void;
  setAnchor: (a: ToastAnchor) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function useToast() {
  const c = useContext(ToastCtx);
  if (!c) throw new Error('useToast вне ToastProvider');
  return c.show;
}

/** Экран сообщает, что у него внизу — тост встанет над этим. */
export function useToastAnchor(a: ToastAnchor) {
  const c = useContext(ToastCtx);
  useEffect(() => {
    c?.setAnchor(a);
  }, [a, c]);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [anchor, setAnchor] = useState<ToastAnchor>('bottom');
  const timer = useRef<number>(0);
  const seq = useRef(0);

  const show = useCallback<Ctx['show']>((text, action) => {
    window.clearTimeout(timer.current);
    setToast({ id: ++seq.current, text, action });
    timer.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const value = useMemo(() => ({ show, setAnchor }), [show]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className={`${s.host} ${s[anchor]}`} aria-live="polite">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.id}
              className={s.toast}
              role="status"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className={s.text}>{toast.text}</span>
              {toast.action && (
                <button
                  type="button"
                  className={`${s.action} pressable on-dark`}
                  onClick={() => {
                    toast.action?.onClick();
                    setToast(null);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
