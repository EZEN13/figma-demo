declare const __BUILD_ID__: string;

/**
 * Telegram WebView кеширует index.html, и после деплоя открывается прошлая версия.
 * Сверяем метку сборки с version.json (без кеша); если на сервере новее —
 * перезагружаемся с ?v=<build>, чтобы получить свежий index.html. Хеш (Telegram-параметры
 * и маршрут) не трогаем. Одна попытка на версию, чтобы не уйти в цикл.
 */
export function ensureFreshBuild() {
  if (import.meta.env.DEV) return;
  fetch(`${import.meta.env.BASE_URL}version.json?t=${Date.now()}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((v: { build?: string } | null) => {
      if (!v?.build || v.build === __BUILD_ID__) return;
      const key = `smash:reloaded:${v.build}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      const url = new URL(window.location.href);
      url.searchParams.set('v', v.build);
      window.location.replace(url.toString());
    })
    .catch(() => {});
}
