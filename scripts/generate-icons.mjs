// Regenerates the app icons in static/icons from one drawing: `node scripts/generate-icons.mjs`
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const out = new URL('../static/icons/', import.meta.url);
const GREEN = '#16a34a';

// A letter tile: a white "A" with a "+", drawn as strokes so it doesn't depend on installed fonts.
const glyph = `<g stroke="#fff" stroke-linecap="round" stroke-linejoin="round" fill="none">
	<path stroke-width="44" d="M150 372 240 140 330 372M186 296H294"/>
	<path stroke-width="30" d="M382 132v76M344 170h76"/>
</g>`;

/** @param {number} scale glyph size around the center @param {number} radius corner radius of the 512 canvas */
const svg = (scale, radius = 0) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="${radius}" fill="${GREEN}"/><g transform="translate(256 256) scale(${scale}) translate(-262 -256)">${glyph}</g></svg>\n`;

const any = svg(1);
// Maskable icons must keep their content inside the central 80% circle.
const maskable = svg(0.8);
const rounded = svg(1, 112);

const png = [
	['icon-192.png', any, 192],
	['icon-512.png', any, 512],
	['maskable-512.png', maskable, 512],
	['apple-touch-icon.png', any, 180],
	['favicon-32.png', rounded, 32]
];

await mkdir(out, { recursive: true });
await writeFile(new URL('icon.svg', out), rounded);
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, source, size] of png) {
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(
		`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`
	);
	await writeFile(new URL(name, out), await page.screenshot({ omitBackground: true }));
}
await browser.close();
