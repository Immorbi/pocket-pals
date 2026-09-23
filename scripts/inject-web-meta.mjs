// Expo's single-page web output builds its own HTML shell and ignores src/app/+html.tsx —
// that file only applies to static rendering (web.output: "static"). So the tags a shared
// link needs, plus the two shell fixes that file was meant to make, are injected here,
// straight after `expo export`.
import { readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://nastyapawsathome.space';
const TITLE = 'Мои питомцы';
const DESCRIPTION = 'Уютная игра про трёх питомцев: Лею, Варяга и Джорджию.';

const file = process.argv[2] ?? 'dist/index.html';
let html = readFileSync(file, 'utf8');

const tags = [
  `<meta name="description" content="${DESCRIPTION}" />`,
  `<meta name="theme-color" content="#FFF7ED" />`,
  `<meta property="og:type" content="website" />`,
  `<meta property="og:site_name" content="${TITLE}" />`,
  `<meta property="og:title" content="${TITLE}" />`,
  `<meta property="og:description" content="${DESCRIPTION}" />`,
  `<meta property="og:url" content="${SITE}/" />`,
  `<meta property="og:locale" content="ru_RU" />`,
  `<meta property="og:image" content="${SITE}/og.jpg" />`,
  `<meta property="og:image:type" content="image/jpeg" />`,
  `<meta property="og:image:width" content="850" />`,
  `<meta property="og:image:height" content="850" />`,
  `<meta property="og:image:alt" content="Девушка сидит на ковре с собакой и двумя кошками" />`,
  // Square art: "summary" keeps it whole, where "summary_large_image" would crop it to 1.91:1
  // and cut off either the face or the cats.
  `<meta name="twitter:card" content="summary" />`,
].map((tag) => `    ${tag}`).join('\n');

// Russian content, and viewport-fit=cover so safe-area insets report real values in iOS Safari.
html = html.replace('<html lang="en">', '<html lang="ru">');
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"',
);
html = html.replace('</head>', `${tags}\n  </head>`);

writeFileSync(file, html);
console.log(`meta injected into ${file}`);
