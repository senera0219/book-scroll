#!/usr/bin/env node
// 내 컴퓨터에서 앱 미리 보기(설치 없는 로컬 서버).
//   node scripts/serve.mjs            → http://localhost:5500
//   node scripts/serve.mjs --drafts   → content/가 없으면 pipeline/drafts/의 검수 전 카드로 미리 보기
// 이 서버는 내 컴퓨터에서만 열린다(127.0.0.1).

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DRAFTS = process.argv.includes('--drafts');
const PORT = Number(process.env.PORT) || 5500;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function draftContent(urlPath) {
  const dir = join(ROOT, 'pipeline', 'drafts');
  if (!existsSync(dir)) return null;
  const books = readdirSync(dir).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  if (urlPath === '/content/index.json') {
    return JSON.stringify({ books: books.map((b) => ({ id: b.id, title: b.title, tab: b.tab, file: `books/${b.id}.json` })) });
  }
  const m = urlPath.match(/^\/content\/books\/([a-z0-9-]+)\.json$/);
  const book = m && books.find((b) => b.id === m[1]);
  return book ? JSON.stringify(book) : null;
}

const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);

  if (DRAFTS && urlPath.startsWith('/content/') && !existsSync(join(ROOT, 'content'))) {
    const body = draftContent(urlPath);
    res.writeHead(body ? 200 : 404, { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
    return res.end(body ?? '');
  }

  let file = resolve(ROOT, `.${urlPath}`);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403);
    return res.end();
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('없음');
  }
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  res.end(readFileSync(file));
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`미리 보기: http://localhost:${PORT}${DRAFTS ? '  (검수 전 카드 사용)' : ''}\n`);
});
