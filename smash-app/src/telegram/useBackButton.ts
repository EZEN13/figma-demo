import { useEffect, useRef } from 'react';
import { supports, tg } from './tg';

/**
 * Стек обработчиков нативной BackButton (SPEC §3.2).
 * Экран объявляет поведение: handler — кнопка «Назад» видна, null — скрыта («Закрыть»).
 * Открытый шит (level 'sheet') всегда перекрывает экран.
 * Активен последний смонтированный: при переходе новый экран монтируется,
 * пока старый ещё доигрывает анимацию ухода.
 */
type Level = 'screen' | 'sheet';
interface Entry {
  id: number;
  level: Level;
  get: () => (() => void) | null;
}

const stack: Entry[] = [];
let seq = 0;
let bound = false;

function top(): Entry | undefined {
  for (let i = stack.length - 1; i >= 0; i--) if (stack[i].level === 'sheet') return stack[i];
  return stack[stack.length - 1];
}

function dispatch() {
  top()?.get()?.();
}

function apply() {
  if (!supports.backButton()) return;
  if (!bound) {
    tg.BackButton.onClick(dispatch);
    bound = true;
  }
  if (top()?.get()) tg.BackButton.show();
  else tg.BackButton.hide();
}

export function useBackButton(handler: (() => void) | null, level: Level = 'screen') {
  const ref = useRef(handler);
  ref.current = handler;
  const hasHandler = handler !== null;

  useEffect(() => {
    const entry: Entry = { id: ++seq, level, get: () => ref.current };
    stack.push(entry);
    apply();
    return () => {
      const i = stack.findIndex((e) => e.id === entry.id);
      if (i >= 0) stack.splice(i, 1);
      apply();
    };
  }, [level]);

  useEffect(() => {
    apply();
  }, [hasHandler]);
}
