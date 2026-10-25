// Tres páginas: la portada en "/" (index.html), el juego en "/jugar/"
// (jugar/index.html) y "Créditos y licencias" en "/creditos/"
// (creditos/index.html, desde la 5.2h). El juego no cambia: solo vive en otra dirección.
// Los archivos de public/ (cerebro, PDF, imágenes) siguen en la raíz del sitio.
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        portada: resolve(import.meta.dirname, 'index.html'),
        jugar: resolve(import.meta.dirname, 'jugar/index.html'),
        creditos: resolve(import.meta.dirname, 'creditos/index.html'),
      },
    },
    // three.js pesa más de 500 kB a propósito: el aviso no aporta
    chunkSizeWarningLimit: 900,
  },
});
