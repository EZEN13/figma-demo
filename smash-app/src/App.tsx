import { useEffect, useMemo, useRef, useState } from 'react';
import { HashRouter, useLocation, useNavigationType } from 'react-router';
import { AnimatePresence, MotionConfig, motion, type Variants } from 'motion/react';
import { AppRoutes } from './routes';
import { AppStateProvider } from './state/AppState';
import { ToastProvider } from './components/Toast';
import { TabBar } from './components/TabBar';
import { DevHeader } from './telegram/DevHeader';
import { isDev } from './telegram/tg';
import { metaOf } from './lib/nav';
import { EASE } from './lib/motion';
import s from './App.module.css';

type Dir = 'push' | 'back' | 'fade';

// SPEC §7: push — x 24→0 + opacity за 250 мс, старый гаснет за 150; назад — зеркально; таб — crossfade 150.
const variants: Variants = {
  initial: (d: Dir) => (d === 'fade' ? { opacity: 0, x: 0 } : { opacity: 0, x: d === 'back' ? -24 : 24 }),
  animate: (d: Dir) => ({ opacity: 1, x: 0, zIndex: 1, transition: { duration: d === 'fade' ? 0.15 : 0.25, ease: EASE } }),
  exit: () => ({ opacity: 0, zIndex: 0, pointerEvents: 'none', transition: { duration: 0.15, ease: EASE } }),
};

function AnimatedRoutes() {
  const location = useLocation();
  const navType = useNavigationType();
  const prev = useRef(location);

  const dir: Dir = useMemo(() => {
    const a = metaOf(prev.current.pathname);
    const b = metaOf(location.pathname);
    if (a.tab && b.tab && a.tab !== b.tab) return 'fade';
    if (navType === 'POP' || (location.state as { dir?: string } | null)?.dir === 'back') return 'back';
    return 'push';
    // направление считается один раз на смену экрана
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    prev.current = location;
  }, [location]);

  return (
    <AnimatePresence initial={false} custom={dir}>
      <motion.div
        key={location.pathname}
        className={s.page}
        custom={dir}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <AppRoutes location={location} />
      </motion.div>
    </AnimatePresence>
  );
}

function OfflineBar() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  if (online) return null;
  return (
    <div className={s.offline} role="status">
      Нет сети
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <MotionConfig reducedMotion="user">
        <AppStateProvider>
          <div className={s.shell}>
            {isDev && <DevHeader />}
            <div className={s.frame}>
              <ToastProvider>
                <AnimatedRoutes />
                <TabBar />
                <div id="overlay-root" className={s.overlay} />
                <OfflineBar />
              </ToastProvider>
            </div>
          </div>
        </AppStateProvider>
      </MotionConfig>
    </HashRouter>
  );
}
