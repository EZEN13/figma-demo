import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Метка сборки: приложение сверяет её с version.json и перезагружается,
// если Telegram отдал из кеша старый index.html (Pages кеширует его 10 мин).
const BUILD_ID = Date.now().toString(36);

const versionFile = (): Plugin => ({
  name: 'version-file',
  apply: 'build',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
  },
});

// GitHub Pages: https://ezen13.github.io/figma-demo/
export default defineConfig({
  base: '/figma-demo/',
  plugins: [react(), versionFile()],
  define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
  build: { target: 'es2020', sourcemap: false },
});
