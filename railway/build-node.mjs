// Railway build: static client bundle + Node API bundle. Cloudflare build stays untouched.
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..'), out = resolve(root, 'dist-node'), pub = resolve(out, 'public');
rmSync(out, { recursive: true, force: true }); mkdirSync(pub, { recursive: true });
cpSync(resolve(root, 'public'), pub, { recursive: true });
const alias = { '@': root };
await build({ entryPoints: [resolve(root, 'railway/client.tsx')], bundle: true, minify: true, format: 'esm', jsx: 'automatic',
 alias, outfile: resolve(pub, 'app.js'), loader: { '.css': 'empty' }, define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning' });
const cssFile = resolve(root, 'app/globals.css');
const css = await postcss([tailwind({ base: root })]).process(readFileSync(cssFile, 'utf8'), { from: cssFile });
writeFileSync(resolve(pub, 'app.css'), css.css);
await build({ entryPoints: [resolve(root, 'app/api/toys/route.ts')], bundle: true, platform: 'node', format: 'esm', alias,
 outfile: resolve(out, 'route.mjs'), plugins: [{ name: 'cf-shim', setup(b) { b.onResolve({ filter: /^cloudflare:workers$/ }, () => ({ path: resolve(root, 'railway/env-shim.mjs') })); } }], logLevel: 'warning' });
writeFileSync(resolve(pub, 'index.html'), `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PILOOP | More Than a Toy</title><meta name="description" content="Your PILOOP collection, heart and memories. Private first version."><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/app.css"></head><body><svg width="0" height="0" aria-hidden="true" style="position:absolute;pointer-events:none"><defs><filter id="heart-transparency" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 -5 0 4.5"/><feComposite in2="SourceGraphic" operator="in"/></filter></defs></svg><div id="root"></div><script type="module" src="/app.js"></script></body></html>`);
console.log('PILOOP node build ready:', out);
