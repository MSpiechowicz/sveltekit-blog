#!/usr/bin/env node
/**
 * Renders a 1200x630 title card to static/images/og/<slug>.png for every article without an
 * `image`, for Open Graph and X cards. Add the printed `image` and `imageAlt` lines to each
 * article's frontmatter afterwards.
 *
 * Playwright is not a dependency of this site. Point PLAYWRIGHT at any installed copy:
 *   PLAYWRIGHT=/path/to/node_modules/playwright/index.mjs node scripts/og-cards.js
 * (`@playwright/test/index.mjs` works too). Fonts are loaded from Google Fonts while rendering.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from 'yaml';

const repo = fileURLToPath(new URL('../', import.meta.url));
const { chromium } = await import(process.env.PLAYWRIGHT || 'playwright');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card(meta) {
	const [m, d, y] = meta.date.split('-').map(Number);
	const date = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(
		new Date(Date.UTC(y, m - 1, d)),
	);
	const size = meta.title.length > 60 ? 64 : meta.title.length > 36 ? 76 : 92;

	return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@500;700;900&family=JetBrains+Mono:wght@500;700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f3ecd8;
 background-image:repeating-conic-gradient(#d9cba6 0 25%,#0000 0 50%);background-size:4px 4px;
 font-family:'Fira Sans',sans-serif;color:#141414;display:flex;align-items:center;justify-content:center}
.win{width:1080px;height:510px;background:#fbfaf5;border:4px solid #141414;box-shadow:12px 12px 0 #141414;display:flex;flex-direction:column}
.bar{height:44px;border-bottom:4px solid #141414;display:flex;align-items:center;justify-content:center;position:relative;
 background:repeating-linear-gradient(#fbfaf5 0 4px,#141414 4px 6px);background-clip:content-box;padding:8px 10px}
.bar span{background:#fbfaf5;padding:0 14px;font:700 20px 'JetBrains Mono',monospace}
.body{flex:1;padding:44px 56px;display:flex;flex-direction:column;justify-content:space-between}
h1{font-weight:900;font-size:${size}px;line-height:1.08;letter-spacing:-0.01em;overflow-wrap:anywhere}
.foot{display:flex;justify-content:space-between;align-items:flex-end;border-top:3px solid #141414;padding-top:18px;font:500 24px 'JetBrains Mono',monospace}
.foot b{font-weight:700}
</style></head><body><div class="win"><div class="bar"><span>${esc(meta.slug)}.txt</span></div>
<div class="body"><h1>${esc(meta.title)}</h1><div class="foot"><span>${esc(date)}</span><b>mspiechowicz.com</b></div></div></div></body></html>`;
}

const dir = join(repo, 'src/lib/blog');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const done = [];

for (const file of readdirSync(dir).filter((f) => f.endsWith('.svx'))) {
	const meta = parse(readFileSync(join(dir, file), 'utf8').split(/^---$/m)[1]);
	if (meta.image) continue;

	await page.setContent(card(meta), { waitUntil: 'networkidle' });
	await page.evaluate(() => document.fonts.ready);
	writeFileSync(
		join(repo, 'static/images/og', `${meta.slug}.png`),
		await page.screenshot({ type: 'png' }),
	);
	const alt = `Title card for the article “${meta.title}”`.replace(/'/g, "''");
	done.push(`${file}\n  image: /images/og/${meta.slug}.png\n  imageAlt: '${alt}'`);
}

await browser.close();
console.log(done.join('\n'));
