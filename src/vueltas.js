// OPCIÓN 4 del inicio (Etapa 8.13, EN PRUEBA, 2026-11-14). "Tu número".
// Felipe pidió tres propuestas con otro mensaje, porque el de 9 y 2 a la vez
// ya sale tres veces en la página. Esta le habla a la persona: cuenta lo que
// tiene empezado, con los botones de sumar y quitar, y aprende que ese número
// es su WIP. Sobre la cabeza de la mosca da vueltas una tarjeta por cada cosa
// (como cuando uno tiene mil cosas dando vueltas en la cabeza).
//
// Aquí no hay ningún número del juego. El número es el de la persona, de 1 a
// 10 (lo mismo que se puede elegir en el juego), y la página no dice qué le
// pasa a nadie con ese número: invita a probarlo en el juego.
//
// Las tarjetas dan la vuelta por una elipse sobre la cabeza de la mosca. Con
// cada toque dan poco más de una vuelta y se detienen repartidas a los dos
// lados por igual (con número impar queda una arriba; nunca queda una abajo al
// centro, encima de las antenas): el movimiento dura menos de 5 segundos y
// después todo queda quieto.
// Solo cambian la posición y la transparencia. Con "reducir movimiento" las
// tarjetas se ponen en su lugar de una vez. Sin JavaScript se ve una tarjeta y
// la frase que explica qué es el WIP.
const TOPE = 10;
const CENTRO = { x: 300, y: 96 }; // la elipse del dibujo (en index.html, .m-aire)
const RADIO = { x: 215, y: 70 };
const TALLA = 1.12; // las tarjetas, un poco más grandes que en su dibujo
const DURA = 3800; // ms que dan vueltas después de cada toque (menos de 5 segundos)
const REPARTO = 520; // ms que tardan en repartirse de nuevo
const SE_VE = 0.45;

const suave = (t) => 1 - (1 - t) ** 3;

export function iniciarVueltas() {
  const raiz = document.querySelector('.cuenta');
  if (!raiz) return null;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const el = {
    cartas: [...raiz.querySelectorAll('[data-carta]')],
    numero: raiz.querySelector('[data-numero]'),
    quitar: raiz.querySelector('[data-quitar]'),
    sumar: raiz.querySelector('[data-sumar]'),
    resultado: raiz.querySelector('[data-resultado]'),
    formas: [...raiz.querySelectorAll('[data-forma]')],
    ecos: [...raiz.querySelectorAll('[data-eco]')],
  };
  let n = 1;
  let partio = false;
  let cuadro = 0;
  // La vuelta: dónde va (en vueltas), desde dónde y hasta dónde, y desde cuándo
  const vuelta = { ahora: 0, desde: 0, hasta: 0, inicio: 0, andando: false };
  // Cada tarjeta: qué parte de la vuelta le toca, y su tamaño (0 a 1)
  const cartas = el.cartas.map((nodo, i) => ({ nodo, lugar: 0, lugarDesde: 0, lugarHasta: 0, talla: i === 0 ? 1 : 0, tallaDesde: i === 0 ? 1 : 0, tallaHasta: i === 0 ? 1 : 0 }));
  let repartoInicio = -Infinity;

  function dibujar() {
    cartas.forEach((c) => {
      const angulo = (vuelta.ahora + c.lugar) * Math.PI * 2 - Math.PI / 2;
      const x = CENTRO.x + RADIO.x * Math.cos(angulo);
      const y = CENTRO.y + RADIO.y * Math.sin(angulo);
      const giro = 11 * Math.cos(angulo);
      c.nodo.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${giro.toFixed(1)}deg) scale(${(TALLA * (0.6 + 0.4 * c.talla)).toFixed(3)})`;
    });
  }

  function paso(ahora) {
    cuadro = 0;
    let sigue = false;
    if (vuelta.andando) {
      const k = Math.min(1, (ahora - vuelta.inicio) / DURA);
      vuelta.ahora = vuelta.desde + (vuelta.hasta - vuelta.desde) * suave(k);
      if (k < 1) sigue = true;
      else {
        vuelta.andando = false;
        raiz.dataset.estado = 'quieta';
      }
    }
    const r = Math.min(1, (ahora - repartoInicio) / REPARTO);
    for (const c of cartas) {
      c.lugar = c.lugarDesde + (c.lugarHasta - c.lugarDesde) * suave(r);
      c.talla = c.tallaDesde + (c.tallaHasta - c.tallaDesde) * suave(r);
    }
    if (r < 1) sigue = true;
    dibujar();
    if (sigue) cuadro = requestAnimationFrame(paso);
  }

  // Deja a la vista ese número. Con movimiento, las tarjetas se reparten de
  // nuevo y dan poco más de una vuelta
  function poner(cuantas, conMovimiento) {
    n = Math.max(1, Math.min(TOPE, cuantas));
    raiz.dataset.n = n;
    el.numero.textContent = n === TOPE ? `${TOPE}+` : n;
    for (const eco of el.ecos) eco.textContent = n;
    const forma = n === 1 ? 'una' : n === TOPE ? 'tope' : 'varias';
    for (const f of el.formas) f.toggleAttribute('data-activa', f.dataset.forma === forma);
    el.quitar.setAttribute('aria-disabled', String(n === 1));
    el.sumar.setAttribute('aria-disabled', String(n === TOPE));
    const ahora = performance.now();
    cartas.forEach((c, i) => {
      const dentro = i < n;
      const estaba = c.tallaHasta === 1;
      // (con número par se corren medio lugar, para quedar iguales a los dos lados)
      c.lugarHasta = dentro ? (i + (n % 2 === 0 ? 0.5 : 0)) / n : c.lugarHasta;
      // la que entra aparece ya en su lugar; las demás se corren
      c.lugarDesde = dentro && !estaba ? c.lugarHasta : c.lugar;
      c.tallaDesde = c.talla;
      c.tallaHasta = dentro ? 1 : 0;
      // (cuáles están a la vista queda dicho de inmediato, sin esperar al dibujo)
      c.nodo.classList.toggle('fuera', !dentro);
    });
    if (!conMovimiento) {
      cancelAnimationFrame(cuadro);
      cuadro = 0;
      vuelta.andando = false;
      vuelta.ahora = 0;
      for (const c of cartas) {
        c.lugar = c.lugarHasta;
        c.talla = c.tallaHasta;
      }
      repartoInicio = -Infinity;
      raiz.dataset.estado = 'quieta';
      dibujar();
      return;
    }
    repartoInicio = ahora;
    // poco más de una vuelta, y que termine con una tarjeta justo arriba
    vuelta.desde = vuelta.ahora;
    vuelta.hasta = Math.ceil((vuelta.ahora + 1.15) * n) / n;
    vuelta.inicio = ahora;
    vuelta.andando = true;
    raiz.dataset.estado = 'andando';
    if (!cuadro) cuadro = requestAnimationFrame(paso);
  }

  function tocar(cambio) {
    const nueva = n + cambio;
    if (nueva < 1 || nueva > TOPE) return;
    partio = true;
    raiz.removeAttribute('data-llama');
    // Desde que la persona cuenta, su número se le lee a quien usa lector de pantalla
    el.resultado.setAttribute('aria-live', 'polite');
    el.resultado.setAttribute('aria-atomic', 'true');
    poner(nueva, !quieto.matches);
  }
  el.quitar.addEventListener('click', () => tocar(-1));
  el.sumar.addEventListener('click', () => tocar(1));

  raiz.classList.add('viva');
  poner(1, false);
  if (!quieto.matches && 'IntersectionObserver' in window) {
    // La primera vez que se ve: la tarjeta da su vuelta y el botón de sumar llama la atención
    new IntersectionObserver(
      ([e], observador) => {
        const altoPantalla = e.rootBounds?.height || innerHeight;
        if (!partio && e.isIntersecting && (e.intersectionRatio >= SE_VE || e.intersectionRect.height >= altoPantalla * 0.5)) {
          partio = true;
          observador.disconnect();
          raiz.setAttribute('data-llama', '');
          poner(1, true);
        }
      },
      { rootMargin: '-64px 0px 0px 0px', threshold: [0, 0.2, SE_VE, 0.7, 1] },
    ).observe(raiz);
  }

  // (para las pruebas)
  return { poner: (cuantas) => poner(cuantas, false), n: () => n, estado: () => raiz.dataset.estado };
}
