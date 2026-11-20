# How to contribute

Thank you for wanting to help. Mosca del WIP is a small project kept by one
person, so a clear and short contribution is the easiest to accept.

En español en [CONTRIBUTING.es.md](CONTRIBUTING.es.md).

## Ways to help

- **Tell us something is wrong.** A broken page, a number that does not match,
  a sentence that reads badly in English. Open an issue with the form.
- **Propose an idea.** Open an issue before you write code, so we can agree on
  it first.
- **Translate.** The game and the site are in Spanish and English. The
  workshop kit is in Spanish only for now.
- **Tell how it went.** If you used the game or the workshop with a team,
  leave two or three lines in
  [this thread](https://github.com/ferfelan/mosca-del-wip/issues/7). If you ran
  the full workshop, there is also a longer issue form. Do not name people or
  companies.
- **Fix or improve the code.** Start with the issues labeled good first issue.

You can write issues and pull requests in Spanish or in English.

## Run it and check it

```
npm install
npm run dev
```

Before you open a pull request, run the checks that touch what you changed.

```
node scripts/simular-dias.mjs       # the rules of the game, it must end with "Forma: todo bien"
node scripts/probar-urgencias.mjs   # the rules for urgent tasks
npm run build                       # the site must build
```

The browser checks are `scripts/probar-*.mjs`. They use Playwright, need
`npx playwright install` once and run with `npm run dev` on. Each one ends
with "todo bien" when it passes.

## Things to know before you change something

- **The rules of the game are frozen.** They live in `src/brain.js`. The
  numbers of the report, the guide and the data tables come from the official
  run of those rules, so a change there changes everything. Open an issue
  first.
- **The brain data is not edited by hand.** The files in `public/cerebro/` are
  produced by the scripts in `scripts/datos/`.
- **Some pages are generated.** `limite-wip/`, `taller/`, `informe/`,
  `404.html` and everything under `en/` are written by the scripts that run
  before `npm run dev` and `npm run build`. Change their sources in
  `docs/paginas/`, `docs/contexto/` and `scripts/`, not the generated files.
- **Both languages change together.** Spanish is the source. The English of
  the game is in `src/juego-textos.js`, the English of the home page in
  `src/portada-textos.js` and the glossary in `docs/glosario-ingles.md`.

## How the texts are written

The site has a voice and the checks protect it.

- Simple words and whole sentences. No method jargon and no buzzwords.
- Every number says where it comes from, whether the game, the simulation or
  studies.
- Never promise a result to a team. The game shows what happens to the fly.
- The fly has tasks. A team has things in progress.
- Text that people read has no colons, no semicolons and no dashes. Times such
  as 09:00 and web addresses are the only exception.

## Pull requests

- Keep each one small and about one thing.
- Say what you changed, why, and which checks you ran.
- Code comments are in Spanish. If you do not write Spanish, write them in
  English and they will be translated.

This repository is the public copy of the project. The author works in a
private copy that also holds his notes, and the same commits arrive here
without those notes. An accepted pull request is applied there and comes back
here with your name on it.

## Licenses of what you contribute

By contributing you agree that your code is under the [MIT license](LICENSE)
and that your texts, images and translations are under CC BY 4.0, as explained
in [LICENSE-CONTENT.md](LICENSE-CONTENT.md).

## Conduct

Be kind. The short version is in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
