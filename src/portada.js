// Portada: el clip del juego se carga solo en pantallas angostas (celular),
// para que el computador no baje un video que no muestra. Si la persona pidió
// menos movimiento, el clip no arranca solo: queda con sus controles.
const video = document.querySelector('.tele video');
if (video) {
  const angosta = matchMedia('(max-width: 899px)');
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  const cargar = () => {
    if (video.src || !angosta.matches) return;
    video.src = video.dataset.src;
    if (quieto.matches) {
      video.controls = true;
    } else {
      video.play().catch(() => { video.controls = true; });
    }
  };
  cargar();
  angosta.addEventListener('change', cargar);
}
