# figma-demo — портфолио: дизайн мини-приложений

Два демо-проекта, собранных через Figma MCP скриптами `use_figma`.

- **СМЭШ** — бронирование падел-кортов, Москва. Figma `k5e09t1rOr9tNNh5uYgqhe`. Правила: `DESIGN.md`. Сборка макета: `work/src/*.js` → `work/assemble.py`. Доска: `screens-full.png`.
  - **smash-app/** — вёрстка в Telegram Mini App. ТЗ: `smash-app/SPEC.md` (навигация, Telegram, логика, состояния, этапы, приёмка).
- **REDLINE** — крипто-казино (Telegram Mini App), только макет. Figma `nCJw4htuKNIcGFDY2RwsOs`. Папка `redline/`.

Решения пользователя (2026-10-15): вход только через Telegram (экраны SMS не делаем); «Назад» — нативная BackButton Telegram, своих стрелок нет; главная CTA — наша, не MainButton.
Лимит Figma MCP: 20 вызовов/мес — при вёрстке Figma не вызывать, всё есть в скриптах.
