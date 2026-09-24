// Railway runtime: Node http server, SQLite on the mounted volume, same API logic as Cloudflare.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, extname, normalize, sep } from 'node:path';
const root = resolve(import.meta.dirname, '..'), pub = resolve(root, 'dist-node/public');
const dbPath = process.env.PILOOP_DB_PATH || '/data/piloop.sqlite';
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = new DatabaseSync(dbPath);
sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
if (!sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='piloop_toys'").get())
 sqlite.exec(readFileSync(resolve(root, 'drizzle/0000_romantic_hydra.sql'), 'utf8').replaceAll('--> statement-breakpoint', ''));
const DB = { prepare(sql) { let args = []; const q = { bind(...v) { args = v; return q; },
 async first() { return sqlite.prepare(sql).get(...args) || null; }, async all() { return { results: sqlite.prepare(sql).all(...args) }; },
 async run() { return sqlite.prepare(sql).run(...args); } }; return q; },
 async batch(list) { sqlite.exec('BEGIN'); try { const r = []; for (const s of list) r.push(await s.run()); sqlite.exec('COMMIT'); return r; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } } };
globalThis.__piloopEnv = { DB };
const { GET, POST } = await import('../dist-node/route.mjs');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const security = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };
createServer(async (req, res) => {
 try {
  const proto = req.headers['x-forwarded-proto'] || 'http', url = new URL(req.url, `${proto}://${req.headers.host}`);
  if (url.pathname === '/health') { res.writeHead(200, security).end('ok'); return; }
  if (url.pathname === '/api/toys') {
   const chunks = []; for await (const c of req) chunks.push(c);
   const request = new Request(url, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined });
   const r = req.method === 'GET' ? await GET() : req.method === 'POST' ? await POST(request) : new Response(null, { status: 405 });
   res.writeHead(r.status, { ...security, ...Object.fromEntries(r.headers) }).end(Buffer.from(await r.arrayBuffer())); return;
  }
  let file = normalize(resolve(pub, '.' + decodeURIComponent(url.pathname)));
  if (!file.startsWith(pub + sep) || !existsSync(file) || statSync(file).isDirectory()) file = resolve(pub, 'index.html');
  res.writeHead(200, { ...security, 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' }).end(readFileSync(file));
 } catch (e) { console.error('PILOOP request failed', e); if (!res.headersSent) res.writeHead(500).end(); }
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => console.log('PILOOP listening', process.env.PORT || 3000, 'db', dbPath));
