import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { haptic } from '../telegram/haptics';
import s from './Button.module.css';

export type ButtonKind = 'primary' | 'secondary' | 'outline' | 'dark';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  kind?: ButtonKind;
  icon?: ReactNode;
  loading?: boolean;
  block?: boolean;
  children: ReactNode;
}

/**
 * Button (DESIGN.md): primary — ball, одна на экран; secondary — контур на тёмном;
 * outline — контур на светлом; dark — чернильная на светлом.
 * disabled: фон line, текст muted, подпись-причина передаётся children.
 */
export function Button({ kind = 'primary', icon, loading, block, className, onClick, disabled, children, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[s.btn, s[kind], block ? s.block : '', loading ? s.loading : '', 'pressable', className ?? ''].join(' ')}
      onClick={(e) => {
        if (kind === 'primary') haptic.press();
        onClick?.(e);
      }}
    >
      {loading ? (
        <LoaderCircle className={s.spinner} size={22} strokeWidth={2.5} aria-hidden />
      ) : (
        <>
          {icon}
          <span className={s.label}>{children}</span>
        </>
      )}
    </button>
  );
}
