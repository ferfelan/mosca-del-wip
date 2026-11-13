// Las páginas del sitio (cada una es un index.html propio; Vite arma todas):
//   /            index.html            la portada en español
//   /en/         en/index.html         la portada en inglés (GENERADA por
//                                      scripts/generar-ingles.mjs: no editar)
//   /jugar/      jugar/index.html      el juego (un solo idioma por dirección:
//                                      ?lang=en lo pone en inglés)
//   /creditos/   creditos/index.html   créditos y licencias (?lang=en)
//   /limite-wip/ y /en/wip-limit/      la guía del límite WIP (Etapa 7; GENERADA
//                                      por scripts/paginas.mjs desde docs/paginas/)
//   /informe/ y /en/report/            el resumen ejecutivo para leer en la web
//                                      (desde la 8.12; antes, el informe entero;
//                                      GENERADO por scripts/resumen-web.mjs desde
//                                      docs/contexto/resumen(-en).html)
//   /taller/ y /en/workshop/           el taller (Etapa 7; GENERADO por paginas.mjs)
//   404.html                           la página "no encontrada" (Vercel la
//                                      sirve sola para direcciones que no existen)
// El juego no cambia: solo vive en otra dirección. Los archivos de public/
// (cerebro, PDF, imágenes, robots.txt, sitemap.xml) siguen en la raíz del sitio.
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const pagina = (ruta) => resolve(import.meta.dirname, ruta);

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        portada: pagina('index.html'),
        portadaEn: pagina('en/index.html'),
        jugar: pagina('jugar/index.html'),
        creditos: pagina('creditos/index.html'),
        // Etapa 7 (2026-10-28): páginas GENERADAS por scripts/paginas.mjs e
        // resumen-web.mjs (corren solos antes de dev y build): no editarlas a mano
        guia: pagina('limite-wip/index.html'),
        guiaEn: pagina('en/wip-limit/index.html'),
        informe: pagina('informe/index.html'),
        informeEn: pagina('en/report/index.html'),
        taller: pagina('taller/index.html'),
        tallerEn: pagina('en/workshop/index.html'),
        noEncontrada: pagina('404.html'),
      },
    },
    // three.js pesa más de 500 kB a propósito: el aviso no aporta
    chunkSizeWarningLimit: 900,
  },
});
