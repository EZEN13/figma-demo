import { Plus } from 'lucide-react';
import s from './PlayerAvatar.module.css';

export type AvatarState = 'filled' | 'you' | 'open';

interface Props {
  state: AvatarState;
  initials?: string;
  photoUrl?: string;
  size?: 44 | 56;
  /** на тёмном фоне (подтверждение брони) */
  dark?: boolean;
  label?: string;
}

/** PlayerAvatar: filled — игрок; you — вы; open — свободное место (пунктир медленно вращается). */
export function PlayerAvatar({ state, initials, photoUrl, size = 44, dark, label }: Props) {
  const cls = [s.av, s[state], dark ? s.dark : '', size === 56 ? s.big : ''].join(' ');
  if (state === 'open') {
    return (
      <span className={cls} role="img" aria-label={label ?? 'Свободное место'}>
        <span className={s.ring} aria-hidden />
        <Plus size={size === 56 ? 20 : 18} strokeWidth={2} aria-hidden />
      </span>
    );
  }
  return (
    <span className={cls} role="img" aria-label={label ?? initials}>
      {photoUrl ? <img className={s.photo} src={photoUrl} alt="" /> : initials}
    </span>
  );
}
