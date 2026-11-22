import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Sayfalar: uygulama (index.html) ve kullanım rehberi (rehber.html Türkçe, guide.html İngilizce).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: { input: { main: 'index.html', rehber: 'rehber.html', guide: 'guide.html' } }
  }
});
