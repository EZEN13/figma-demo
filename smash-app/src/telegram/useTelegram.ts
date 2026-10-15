import { useMemo } from 'react';
import { isDev, tg } from './tg';
import type { TgUser } from './types';

export interface AppUser {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  username?: string;
  photoUrl?: string;
}

const FALLBACK: TgUser = { id: 0, first_name: 'Игрок' };

export function toAppUser(u: TgUser = FALLBACK): AppUser {
  const first = u.first_name?.trim() || 'Игрок';
  const last = u.last_name?.trim() || '';
  const initials = ((first[0] ?? '') + (last[0] ?? first[1] ?? '')).toUpperCase();
  return {
    id: u.id,
    firstName: first,
    lastName: last,
    fullName: [first, last].filter(Boolean).join(' '),
    initials,
    username: u.username,
    photoUrl: u.photo_url,
  };
}

export function useTelegram() {
  return useMemo(
    () => ({
      tg,
      isDev,
      user: toAppUser(tg.initDataUnsafe.user),
      startParam: tg.initDataUnsafe.start_param,
    }),
    [],
  );
}
