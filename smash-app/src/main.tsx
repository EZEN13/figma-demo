import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Шрифты: только используемые начертания, кириллица + латиница (SPEC §2)
import '@fontsource/unbounded/cyrillic-700.css';
import '@fontsource/unbounded/latin-700.css';
import '@fontsource/unbounded/cyrillic-900.css';
import '@fontsource/unbounded/latin-900.css';
import '@fontsource/onest/cyrillic-400.css';
import '@fontsource/onest/latin-400.css';
import '@fontsource/onest/cyrillic-500.css';
import '@fontsource/onest/latin-500.css';
import '@fontsource/onest/cyrillic-700.css';
import '@fontsource/onest/latin-700.css';
import './styles/tokens.css';
import './styles/global.css';
import { initTelegram } from './telegram/tg';
import { App } from './App';

initTelegram();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
