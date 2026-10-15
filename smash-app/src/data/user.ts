/** Профиль игрока сверх Telegram (SPEC §5.1). */
export const PROFILE_STATS = {
  rating: 3.4,
  /** история рейтинга за 3 месяца, 12 точек */
  history: [2.8, 2.85, 2.9, 2.88, 2.95, 3.0, 3.06, 3.1, 3.18, 3.22, 3.3, 3.4],
  matches: 38,
  winRate: 61,
  hours: 52,
  since: 'марта 2024',
};

export interface LevelInfo {
  id: 'novice' | 'amateur' | 'advanced' | 'tournament' | 'pro';
  title: string;
  desc: string;
  min: number;
  max: number;
}

export const LEVELS: LevelInfo[] = [
  { id: 'novice', title: 'Новичок', desc: 'Только начинаю, учусь держать мяч в игре', min: 1.0, max: 2.0 },
  { id: 'amateur', title: 'Любитель', desc: 'Держу розыгрыш, играю пару раз в месяц', min: 2.5, max: 3.5 },
  { id: 'advanced', title: 'Продвинутый', desc: 'Уверенная подача, играю у стекла', min: 4.0, max: 5.0 },
  { id: 'tournament', title: 'Турнирный', desc: 'Играю турниры клубов', min: 5.5, max: 6.5 },
  { id: 'pro', title: 'Профи', desc: 'Рейтинг федерации', min: 7.0, max: 7.0 },
];
