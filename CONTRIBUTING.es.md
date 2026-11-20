# Cómo aportar

Gracias por querer ayudar. Mosca del WIP es un proyecto chico que mantiene una
sola persona, así que un aporte claro y corto es el más fácil de aceptar.

In English in [CONTRIBUTING.md](CONTRIBUTING.md).

## Formas de ayudar

- **Avisa si algo está mal.** Una página rota, un número que no calza, una
  frase que se lee mal. Abre un issue con el formulario.
- **Propón una idea.** Abre un issue antes de escribir código, para ponernos
  de acuerdo primero.
- **Traduce.** El juego y el sitio están en español y en inglés. El taller
  está solo en español por ahora.
- **Cuenta cómo te fue con el taller.** Si lo hiciste con un equipo, hay un
  formulario para eso. No nombres personas ni empresas sin su permiso.
- **Arregla o mejora el código.** Parte por los issues marcados como good
  first issue.

Puedes escribir los issues y los pull requests en español o en inglés.

## Córrelo y revísalo

```
npm install
npm run dev
```

Antes de abrir un pull request, corre las revisiones de lo que tocaste.

```
node scripts/simular-dias.mjs       # las reglas del juego, tiene que terminar con "Forma: todo bien"
node scripts/probar-urgencias.mjs   # las reglas de las urgencias
npm run build                       # el sitio tiene que armarse
```

Las revisiones con navegador son `scripts/probar-*.mjs`. Usan Playwright,
necesitan `npx playwright install` una vez y corren con `npm run dev`
encendido. Cada una termina con "todo bien" cuando pasa.

## Cosas que conviene saber antes de cambiar algo

- **Las reglas del juego están congeladas.** Viven en `src/brain.js`. Los
  números del informe, de la guía y de las tablas de datos salen de la corrida
  oficial de esas reglas, así que un cambio ahí lo cambia todo. Abre un issue
  primero.
- **Los datos del cerebro no se editan a mano.** Los archivos de
  `public/cerebro/` los producen los programas de `scripts/datos/`.
- **Algunas páginas se generan solas.** `limite-wip/`, `taller/`, `informe/`,
  `404.html` y todo lo que está en `en/` lo escriben los programas que corren
  antes de `npm run dev` y de `npm run build`. Se cambian sus fuentes, en
  `docs/paginas/`, `docs/contexto/` y `scripts/`, no los archivos generados.
- **Los dos idiomas cambian juntos.** El español es la fuente. El inglés del
  juego está en `src/juego-textos.js`, el de la portada en
  `src/portada-textos.js` y el glosario en `docs/glosario-ingles.md`.

## Cómo se escriben los textos

El sitio tiene una voz y las revisiones la cuidan.

- Palabras simples y frases completas. Sin jerga de métodos ni palabras de
  moda.
- Cada número dice de dónde sale, si del juego, de la simulación o de
  estudios.
- Nunca se le promete un resultado a un equipo. El juego muestra lo que le
  pasa a la mosca.
- La mosca tiene tareas. Un equipo tiene cosas en curso.
- Lo que se lee no lleva dos puntos, punto y coma ni rayas. Las horas, como
  09:00, y las direcciones web son la única excepción.

## Pull requests

- Que cada uno sea chico y trate de una sola cosa.
- Di qué cambiaste, por qué y qué revisiones corriste.
- Los comentarios del código van en español.

Este repositorio es la copia pública del proyecto. El autor trabaja en una
copia privada que también guarda sus notas, y los mismos commits llegan acá
sin esas notas. Un pull request aceptado se aplica allá y vuelve acá con tu
nombre.

## Licencias de lo que aportas

Al aportar aceptas que tu código queda con [licencia MIT](LICENSE) y que tus
textos, imágenes y traducciones quedan con licencia CC BY 4.0, como explica
[LICENSE-CONTENT.md](LICENSE-CONTENT.md).

## Conducta

Trata bien a los demás. La versión corta está en
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
