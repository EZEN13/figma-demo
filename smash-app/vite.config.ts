import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: https://ezen13.github.io/figma-demo/
export default defineConfig({
  base: '/figma-demo/',
  plugins: [react()],
  build: { target: 'es2020', sourcemap: false },
});
