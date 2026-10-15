import { supports, tg } from './tg';

// SPEC §3.7
const safe = (fn: () => void) => {
  if (!supports.haptics()) return;
  try {
    fn();
  } catch {
    /* старый клиент — без отклика */
  }
};

export const haptic = {
  /** выбор слота, даты, чипа, сегмента, таба */
  select: () => safe(() => tg.HapticFeedback.selectionChanged()),
  /** нажатие primary-кнопки */
  press: () => safe(() => tg.HapticFeedback.impactOccurred('medium')),
  success: () => safe(() => tg.HapticFeedback.notificationOccurred('success')),
  error: () => safe(() => tg.HapticFeedback.notificationOccurred('error')),
  warning: () => safe(() => tg.HapticFeedback.notificationOccurred('warning')),
};
