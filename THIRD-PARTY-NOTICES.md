# Third-party notices

Mosca del WIP uses data, a model, fonts and libraries made by other people.
Each one keeps its own license. This page gives the credit each one asks for.

## Male CNS v1.0, the fly connectome

The neurons in the game come from Male CNS v1.0, the map of the central nervous
system of a male fruit fly.

> This project is a collaboration between FlyEM (HHMI Janelia), the University
> of Cambridge (Dept. of Zoology), the MRC Laboratory of Molecular Biology, and
> Google Research.

- Source https://male-cns.janelia.org
- License Creative Commons Attribution 4.0 International (CC BY 4.0),
  https://creativecommons.org/licenses/by/4.0/
- Paper Berg et al. (2026), Cell, 189(18)

We adapted the data. These files are derived from it.

- `public/cerebro/malecns-puntos.bin`, `puntos-extra.bin` and
  `malecns-info.json` hold the positions of a sample of 25,000 neurons, grouped
  in five regions and rescaled for the screen.
- `public/cerebro/actividad-real.bin` and `actividad-real.json` hold activity
  that we simulated on the traced connectome (164,587 neurons). It is a
  simulation. It is not a recording of a living fly.
- `scripts/datos/*.json` hold the circuits, candidates and results of those
  simulations.

The raw connectome files are not in this repository. The scripts in
`scripts/datos/` say how to download them from the source. The derived files
above are offered under CC BY 4.0 as well, with the credit above.

## The brain model

`scripts/datos/modelo_etapa3.py` simulates the connectome with simple leaky
integrate-and-fire neurons. It follows the parameters and the equations of the
model published by Shiu et al. (2024), Nature, 634, and of their code at
https://github.com/philshiu/Drosophila_brain_model. Our file is written again
in Python with numba and it runs on a different connectome. That code is under
the MIT license, with this notice.

```
MIT License

Copyright (c) 2023 Philip Shiu and Nico Spiller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Fonts

- **Mona Sans**, © 2022 The Mona Sans Project Authors
  (https://github.com/github/mona-sans), SIL Open Font License 1.1. The file
  `public/fonts/mona-sans-latin-wdth.woff2` is a Latin subset. The full license
  is next to it, in `public/fonts/LICENCIA-mona-sans-OFL.txt`.
- **Letra PDF**, in `docs/contexto/letras-pdf/`, is a set of fixed copies of
  Mona Sans made with `scripts/letras-pdf.py` so that text copies well from the
  PDF files. They carry another name because the license reserves the name of
  the original. Same authors and same license, in
  `docs/contexto/letras-pdf/LICENCIA-OFL.txt`.

These font files stay under the SIL Open Font License 1.1 only. The MIT and
CC BY licenses of this repository do not apply to them.

The PDF files of the site carry small embedded pieces of the fonts they were
printed with. The report uses Avenir Next, Iowan Old Style and Lucida Grande,
which belong to their owners. The workshop files use Lora, Figtree and DejaVu
Sans, which are open fonts. None of those fonts is covered by the licenses of
this repository.

## Libraries

The site is built with these packages. They are installed with `npm install`
and none of them is copied into this repository.

- **three.js** 0.186, MIT, © 2010 to 2026 three.js authors. It draws the
  office, the fly and the brain. The published site includes it inside its
  bundle, with its license notice.
- **Vite** 8, MIT. It builds the site.
- **Playwright** 1.64, Apache License 2.0. The checks in `scripts/` use it to
  drive a browser.
- **pdf-lib** 1.17, MIT. It writes the properties of the PDF files.
- **pptxgenjs**, MIT, and **JSZip**, offered under MIT or GPL 3.0 and used here
  under MIT. Only the scripts that build the workshop slides need them, and
  they are installed on demand.

## Hosting

The public site runs on Vercel and counts visits with Vercel Web Analytics,
with no cookies. That service is not part of this repository.
