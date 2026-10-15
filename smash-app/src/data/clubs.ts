import type { Club, Court } from './types';

type CourtSeed = [number, boolean, string[]];

function club(
  id: string,
  name: string,
  district: string,
  metro: string,
  address: string,
  rating: number,
  distanceKm: number,
  mapX: number,
  mapY: number,
  tariffs: { day: number; evening: number },
  courts: CourtSeed[],
): Club {
  return {
    id,
    name,
    district,
    metro,
    address,
    rating,
    distanceKm,
    mapX,
    mapY,
    courts: courts.map(
      ([number, indoor, features]): Court => ({ id: `${id}-${number}`, clubId: id, number, indoor, features, tariffs }),
    ),
  };
}

const GLASS = 'Панорамное стекло';

/** 8 клубов, 18 кортов (SPEC §5.1). Пользователь условно в Хамовниках. */
export const CLUBS: Club[] = [
  club('luzhniki', 'Лужники Падел', 'Хамовники', 'Спортивная', 'Лужнецкая наб., 24, стр. 8', 4.9, 1.2, 186, 336,
    { day: 2400, evening: 3200 }, [[3, true, [GLASS]], [1, true, []], [2, false, []]]),
  club('ramenki', 'Падел Раменки', 'Раменки', 'Раменки', 'Мичуринский пр-т, 8', 4.6, 3.1, 92, 392,
    { day: 2100, evening: 2800 }, [[1, true, []], [2, true, [GLASS]]]),
  club('sokolniki', 'Сетка Сокольники', 'Сокольники', 'Сокольники', 'ул. Сокольнический Вал, 1Б', 4.7, 4.8, 292, 196,
    { day: 2900, evening: 3600 }, [[2, true, [GLASS]], [1, true, []], [3, false, []]]),
  club('presnya', 'Падел Пресня', 'Пресня', 'Улица 1905 года', 'ул. Мантулинская, 5', 4.8, 2.6, 128, 214,
    { day: 3200, evening: 3900 }, [[1, true, [GLASS]], [2, true, [GLASS]]]),
  club('taganka', 'Таганка Падел', 'Таганка', 'Таганская', 'ул. Большие Каменщики, 6', 4.5, 3.9, 306, 300,
    { day: 2700, evening: 3400 }, [[1, true, []], [2, false, []]]),
  club('krylatskoe', 'Крылатское Арена', 'Крылатское', 'Крылатское', 'Крылатская ул., 10', 4.7, 7.4, 58, 290,
    { day: 2600, evening: 3200 }, [[1, false, []], [2, false, []]]),
  club('strogino', 'Строгино Падел', 'Строгино', 'Строгино', 'ул. Кулакова, 20', 4.4, 11.2, 68, 168,
    { day: 1900, evening: 2600 }, [[1, true, []], [2, false, []]]),
  club('maryina', 'Марьина Роща Падел', 'Марьина Роща', 'Марьина Роща', 'Шереметьевская ул., 6', 4.6, 6.1, 214, 150,
    { day: 2500, evening: 3300 }, [[1, true, [GLASS]], [2, true, []]]),
];

export const DISTRICTS = ['Хамовники', 'Раменки', 'Сокольники', 'Пресня', 'Таганка', 'Крылатское', 'Строгино', 'Марьина Роща'];

/** Подписи районов на карте (как в макете 09) */
export const MAP_LABELS: [string, number, number][] = [
  ['Пресня', 60, 236],
  ['Сокольники', 262, 160],
  ['Таганка', 300, 250],
  ['Хамовники', 150, 372],
  ['Раменки', 24, 424],
  ['Крылатское', 24, 312],
];

/** Где «вы» на карте */
export const ME_ON_MAP = { x: 252, y: 282 };

const COURTS = new Map<string, Court>(CLUBS.flatMap((c) => c.courts.map((k) => [k.id, k] as const)));
const BY_ID = new Map(CLUBS.map((c) => [c.id, c] as const));

export const getCourtById = (id: string) => COURTS.get(id);
export const getClubById = (id: string) => BY_ID.get(id);
export const TOTAL_COURTS = COURTS.size;
