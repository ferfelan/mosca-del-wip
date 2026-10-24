// Cuenta visitas con Vercel Web Analytics: sin cookies ni datos personales
// (ver docs/etapa5-2.md). Solo corre en el sitio publicado; en desarrollo
// (npm run dev) no carga nada, así no hay pedidos que fallen.
if (import.meta.env.PROD) {
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  const s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);
}
