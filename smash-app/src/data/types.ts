export interface Court {
  id: string;
  clubId: string;
  number: number;
  indoor: boolean;
  features: string[];
  /** ₽ за час: day — до 18:00 в будни, evening — с 18:00 и в выходные весь день */
  tariffs: { day: number; evening: number };
}

export interface Club {
  id: string;
  name: string;
  district: string;
  metro: string;
  address: string;
  rating: number;
  distanceKm: number;
  /** координаты кончика пина на нашей SVG-карте 390 × 844 */
  mapX: number;
  mapY: number;
  courts: Court[];
}

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'any';
export type CourtType = 'any' | 'indoor' | 'outdoor';
export type Duration = 60 | 90 | 120;

export interface Filters {
  date: string;
  time: TimeOfDay;
  maxPrice: number;
  courtType: CourtType;
  districts: string[];
}

export type PaySplit = 'split' | 'full';
export type PayMethod = 'sbp' | 'card' | 'applepay';

export interface Player {
  name: string;
  initials: string;
  rating?: number;
  you?: boolean;
}

export interface Booking {
  id: string;
  code: string;
  courtId: string;
  clubId: string;
  date: string;
  start: number;
  duration: Duration;
  total: number;
  paid: number;
  split: PaySplit;
  method: PayMethod;
  /** четыре места: игрок или null (свободно) */
  seats: (Player | null)[];
  matchId?: string;
  createdAt: number;
  /** прошедшие: результат */
  result?: { win: boolean; score: string } | null;
}

export interface Match {
  id: string;
  courtId: string;
  clubId: string;
  date: string;
  start: number;
  duration: Duration;
  levelMin: number;
  levelMax: number;
  pricePerPlayer: number;
  total: number;
  format: string;
  organizer: Player;
  seats: (Player | null)[];
  closesAt: number;
}
