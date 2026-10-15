import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { House, Ticket, User, Users, type LucideIcon } from 'lucide-react';
import { haptic } from '../telegram/haptics';
import { metaOf, SCROLL_TOP_EVENT, TAB_ROOT, type TabId } from '../lib/nav';
import { EASE } from '../lib/motion';
import s from './TabBar.module.css';

const TABS: [TabId, string, LucideIcon][] = [
  ['courts', 'Корты', House],
  ['bookings', 'Брони', Ticket],
  ['matches', 'Игроки', Users],
  ['profile', 'Профиль', User],
];

/**
 * TabBar: плавает 20 от краёв и 30 от низа (над safe area).
 * У каждой вкладки свой стек: переключение не копит историю (replace),
 * повторный тап — к корню вкладки или скролл вверх.
 */
export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = metaOf(location.pathname);
  const last = useRef<Partial<Record<TabId, string>>>({});

  useEffect(() => {
    if (meta.tab) last.current[meta.tab] = location.pathname + location.search;
  }, [meta.tab, location.pathname, location.search]);

  const go = (id: TabId) => {
    haptic.select();
    if (id === meta.tab) {
      if (meta.root) window.dispatchEvent(new Event(SCROLL_TOP_EVENT));
      else navigate(TAB_ROOT[id], { replace: true, state: { dir: 'back' } });
      return;
    }
    navigate(last.current[id] ?? TAB_ROOT[id], { replace: true });
  };

  return (
    <AnimatePresence>
      {meta.tab && (
        <motion.nav
          className={`${s.bar} on-dark`}
          aria-label="Разделы"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {TABS.map(([id, label, Icon]) => {
            const on = id === meta.tab;
            return (
              <button
                key={id}
                type="button"
                className={`${s.tab} ${on ? s.on : ''} pressable`}
                aria-current={on ? 'page' : undefined}
                aria-label={label}
                onClick={() => go(id)}
              >
                <Icon size={20} strokeWidth={2} aria-hidden />
                {on && <span className={s.label}>{label}</span>}
              </button>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
