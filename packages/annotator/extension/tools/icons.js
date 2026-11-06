#!/usr/bin/env node

/**
 * Draws the extension's icons (src/images/) from Chaotic Good Computing's logo, the site's
 * (content/public/assets/cgc-cpu-only.svg): the glyph in white on a dark rounded square, as the
 * site's favicon has it, so it reads on light and dark toolbars alike. The toolbar's inactive icon
 * is the same, faded. Run by hand when the logo changes; the icons are committed.
 *
 *   node tools/icons.js
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const logo = path.join(root, '../../../content/public/assets/cgc-cpu-only.svg');
const images = path.join(root, 'src/images');

/** The logo's paths, and the viewBox they are drawn in. */
const source = fs.readFileSync(logo, 'utf8');
const viewBox = /viewBox="([^"]+)"/.exec(source)[1];
const inner = source.slice(source.indexOf('>', source.indexOf('<svg')) + 1, source.lastIndexOf('</svg>'));

/** The icon at `size` pixels: the glyph, 84% of the square, on the dark square. */
function icon(size, { faded = false } = {}) {
  const radius = size * 0.22;
  const glyph = size * 0.84;
  const offset = (size - glyph) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <g opacity="${faded ? 0.45 : 1}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="#1e1e1e"/>
    <svg x="${offset}" y="${offset}" width="${glyph}" height="${glyph}" viewBox="${viewBox}">
      <g fill="#ffffff">${inner}</g>
    </svg>
  </g>
</svg>`;
  return sharp(Buffer.from(svg), { density: 72 * 8 }).resize(size, size).png();
}

const outputs = [
  ['icon16.png', 16],
  ['icon48.png', 48],
  ['icon128.png', 128],
  ['browser-icon-active.png', 19],
  ['browser-icon-active@2x.png', 38],
  ['browser-icon-inactive.png', 19, { faded: true }],
  ['browser-icon-inactive@2x.png', 38, { faded: true }],
];

for (const [name, size, options] of outputs) {
  await icon(size, options).toFile(path.join(images, name));
  console.log(`${name}: ${size}px`);
}
