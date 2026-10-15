import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { animate, motion, useDragControls, useMotionValue, type PanInfo } from 'motion/react';
import { Clock, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { Screen } from '../components/Screen';
import { MapPin } from '../components/MapPin';
import { CourtCard } from '../components/CourtCard';
import { TagChip } from '../components/controls';
import { SkeletonCard } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { MoscowMap } from '../graphics/MoscowMap';
import { CourtScheme } from '../graphics/CourtScheme';
import { api, keys } from '../api';
import { useQuery } from '../api/useQuery';
import { countCourts } from '../data/search';
import { TIME_LABEL } from '../data/slots';
import { useApp, MAX_PRICE } from '../state/AppState';
import { haptic } from '../telegram/haptics';
import { plural, relDay, rub } from '../lib/format';
import { useGoBack } from '../lib/nav';
import { useFiltersSheet } from '../lib/useFiltersSheet';
import { EASE } from '../lib/motion';
import { FiltersSheet } from './Filters';
import { useErrorToast, useFiltersActive } from './Home';
import s from './MapScreen.module.css';

const MAP_W = 390;
const MAP_H = 844;
/** зона под верхними контролами */
const TOP_UI = 120;
/** высота пина с хвостом */
const PIN_H = 40;
/** высота свёрнутого шита: шапка + карточка + место под таб-бар */
const COLLAPSED = 452;

/** 09 Карта: пины с ценой, шит с карточкой выбранного корта; свайп вверх — список. */
export function MapScreen() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [params] = useSearchParams();
  const { state } = useApp();
  const f = state.filters;
  const sheet = useFiltersSheet();
  const active = useFiltersActive();
  const q = useQuery(keys.courts(f), () => api.listCourts(f));
  useErrorToast(q.error, q.retry);

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const hits = useMemo(() => {
    const all = q.data ?? [];
    const t = query.trim().toLowerCase();
    if (!t) return all;
    return all.filter((h) => [h.club.name, h.club.district, h.club.metro].some((v) => v.toLowerCase().includes(t)));
  }, [q.data, query]);

  const selected = hits.find((h) => h.club.id === selectedId) ?? hits[0];
  const ordered = selected ? [selected, ...hits.filter((h) => h !== selected)] : [];
  const n = countCourts(hits);

  useEffect(() => {
    if (params.get('focus')) inputRef.current?.focus({ preventScroll: true });
    // фокус в поиске — только при входе с главной
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- геометрия: карта и шит
  const wrap = useRef<HTMLDivElement>(null);
  const [H, setH] = useState(700);
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    setH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const sheetH = Math.round(H * 0.85);
  const visible = Math.min(COLLAPSED, H - TOP_UI - 120);
  const collapsedY = sheetH - visible;
  const sheetY = useMotionValue(collapsedY);
  const [expanded, setExpanded] = useState(false);
  const controls = useDragControls();

  useEffect(() => {
    sheetY.set(expanded ? 0 : collapsedY);
    // при смене размеров окна
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsedY]);

  const snap = (open: boolean) => {
    setExpanded(open);
    animate(sheetY, open ? 0 : collapsedY, { duration: 0.25, ease: EASE });
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const y = sheetY.get();
    if (info.velocity.y < -500) snap(true);
    else if (info.velocity.y > 500) snap(false);
    else snap(y < collapsedY / 2);
  };

  // карта: центр полосы видимости — на выбранном пине
  const mapX = useMotionValue(0);
  const mapY = useMotionValue(0);
  const band = { top: TOP_UI, bottom: H - visible };
  useEffect(() => {
    // все пины влезают в полосу — показываем все; нет — центрируем выбранный
    const ys = hits.map((h) => h.club.mapY);
    if (!ys.length) return;
    const minY = Math.min(...ys) - PIN_H;
    const maxY = Math.max(...ys);
    const bandH = band.bottom - band.top;
    let y: number;
    if (maxY - minY <= bandH) y = band.top - minY + (bandH - (maxY - minY)) / 2;
    else y = (band.top + band.bottom) / 2 - ((selected?.club.mapY ?? 300) - PIN_H / 2);
    animate(mapY, Math.max(Math.min(y, 60), band.bottom - MAP_H), { duration: 0.25, ease: EASE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.club.id, H, hits.length]);

  const select = (id: string) => {
    haptic.select();
    setSelectedId(id);
    if (expanded) snap(false);
  };

  const openCourt = (courtId: string, start?: number) => {
    const p = new URLSearchParams({ date: f.date, dur: '90' });
    if (start !== undefined) p.set('slot', String(start));
    navigate(`/court/${courtId}?${p}`);
  };

  const chips: { key: string; label: string; icon?: boolean }[] = [
    { key: 'when', label: f.time === 'any' ? relDay(f.date) : `${relDay(f.date)}, ${TIME_LABEL[f.time].toLowerCase()}`, icon: true },
  ];
  if (f.maxPrice < MAX_PRICE) chips.push({ key: 'price', label: `до ${rub(f.maxPrice)}` });
  if (f.courtType !== 'any') chips.push({ key: 'type', label: f.courtType === 'indoor' ? 'Крытый' : 'Открытый' });
  if (f.districts.length) chips.push({ key: 'dist', label: f.districts.length === 1 ? f.districts[0] : `${f.districts.length} ${plural(f.districts.length, ['район', 'района', 'районов'])}` });

  return (
    <Screen top="dark" bg="ink" back={expanded ? () => snap(false) : () => goBack('/courts')} toast="tabbar" fixed>
      <div ref={wrap} className={s.wrap}>
        <motion.div
          className={s.map}
          style={{ x: mapX, y: mapY, width: MAP_W, height: MAP_H, marginLeft: -MAP_W / 2 }}
          drag
          dragMomentum
          dragConstraints={{ left: -80, right: 80, top: band.bottom - MAP_H, bottom: 60 }}
          dragElastic={0.1}
        >
          <MoscowMap />
          {hits.map((h) => (
            <MapPin key={h.club.id} x={h.club.mapX} y={h.club.mapY} price={h.price} name={h.club.name} selected={h === selected} onSelect={() => select(h.club.id)} />
          ))}
        </motion.div>

        <div className={`${s.top} on-dark`}>
          <div className={s.searchRow}>
            <label className={s.search}>
              <Search size={20} strokeWidth={2} aria-hidden />
              <input
                ref={inputRef}
                className={s.input}
                type="search"
                enterKeyHint="search"
                placeholder="Район, метро или клуб"
                aria-label="Поиск: район, метро или клуб"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className={s.clear} aria-label="Очистить поиск" onClick={() => setQuery('')}>
                  <X size={18} strokeWidth={2} aria-hidden />
                </button>
              )}
            </label>
            <button type="button" className={`${s.filterBtn} pressable`} aria-label="Фильтры" onClick={sheet.show}>
              <SlidersHorizontal size={20} strokeWidth={2} aria-hidden />
              {active && <span className={s.dot} aria-hidden />}
            </button>
          </div>
          <div className={`${s.chips} no-scrollbar`}>
            {chips.map((c) => (
              <TagChip key={c.key} solid icon={c.icon ? <Clock size={14} strokeWidth={2} /> : undefined}>
                {c.label}
              </TagChip>
            ))}
          </div>
        </div>

        <motion.section
          className={s.sheet}
          style={{ height: sheetH, y: sheetY }}
          drag="y"
          dragListener={false}
          dragControls={controls}
          dragConstraints={{ top: 0, bottom: collapsedY }}
          dragElastic={0.05}
          onDragEnd={onDragEnd}
          aria-label="Корты"
        >
          <div className={s.sheetHead} onPointerDown={(e) => controls.start(e)}>
            <button
              type="button"
              className={s.handle}
              aria-label={expanded ? 'Свернуть список' : 'Развернуть список'}
              aria-expanded={expanded}
              onClick={() => snap(!expanded)}
            />
            <div className={s.headRow}>
              <h2 className={s.title}>{q.loading ? 'Ищем корты' : `${n} ${plural(n, ['корт', 'корта', 'кортов'])}`}</h2>
              <button type="button" className={`${s.action} pressable`} onClick={() => goBack('/courts')}>
                <List size={18} strokeWidth={2} aria-hidden />
                Списком
              </button>
            </div>
          </div>
          <div className={`${s.sheetBody} no-scrollbar`} style={{ overflowY: expanded ? 'auto' : 'hidden' }}>
            {q.loading || q.error ? (
              <SkeletonCard />
            ) : ordered.length ? (
              <motion.div className={s.list} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                {ordered.map((h) => (
                  <CourtCard key={h.club.id} hit={h} date={f.date} variant={hits.indexOf(h)} onOpen={openCourt} />
                ))}
              </motion.div>
            ) : (
              <EmptyState
                art={<CourtScheme length={180} width={90} angle={-10} tone="line" />}
                title="Ничего не нашли"
                text={query ? 'Попробуйте другой район или метро' : 'С такими фильтрами свободных кортов нет'}
                action={<Button onClick={() => (query ? setQuery('') : sheet.show())}>{query ? 'Очистить поиск' : 'Изменить фильтры'}</Button>}
              />
            )}
          </div>
        </motion.section>
      </div>
      <FiltersSheet open={sheet.open} onClose={sheet.close} />
    </Screen>
  );
}
