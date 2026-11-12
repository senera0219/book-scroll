#!/usr/bin/env node
// 전체 검사: 카드 JSON, PWA 파일, 저장소 규칙(AGENTS.md §6).
// 사용: node scripts/verify.mjs [--root <폴더>]
// 오류가 하나라도 있으면 exit 1. 경고는 통과에 영향 없음.
// 기준 문서: docs/ARCHITECTURE.md §4(형식), docs/card-guide.md §5·§7·§9(작성 규칙).

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, basename, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TABS = ['literature', 'self-help', 'philosophy', 'society', 'science'];
const TYPES = ['excerpt', 'summary', 'quote', 'original'];
const UNITS = ['bundle', 'chapter'];
const LICENSES = ['public-domain'];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// card-guide.md §5 (잠정). 넘으면 경고만 한다(한 문장 예외 허용).
const MAX_LEN = { quote: 120, summary: 300, excerpt: 400, original: 400, note: 150, commentary: 300, dailyQuote: 60 };

export function verify(root) {
  const errors = [];
  const warnings = [];
  const notes = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

  checkContent(root, err, warn, notes);
  checkPwa(root, err, notes);
  checkRepoRules(root, err, notes);

  return { errors, warnings, notes };
}

// ---------- 카드 ----------

function readJson(path, where, err) {
  try {
    return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    err(where, `JSON을 읽을 수 없음 (${e.message})`);
    return undefined;
  }
}

const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const len = (s) => [...s].length;
const isHttps = (v) => isStr(v) && /^https:\/\/\S+$/.test(v);

function checkContent(root, err, warn, notes) {
  const contentDir = join(root, 'content');
  const booksDir = join(contentDir, 'books');
  const indexPath = join(contentDir, 'index.json');

  if (!existsSync(contentDir)) {
    notes.push('카드: content/ 없음 — 아직 카드가 없어 건너뜀');
    return;
  }
  if (!existsSync(indexPath)) {
    err('content/index.json', '파일이 없음');
    return;
  }

  const index = readJson(indexPath, 'content/index.json', err);
  if (index === undefined) return;
  if (!index || !Array.isArray(index.books)) {
    err('content/index.json', '"books" 배열이 있어야 함');
    return;
  }

  const listed = new Map(); // id -> entry
  index.books.forEach((b, i) => {
    const where = `content/index.json books[${i}]`;
    if (!b || typeof b !== 'object') return err(where, '객체여야 함');
    if (!isStr(b.id) || !ID_RE.test(b.id)) err(where, `id "${b.id}"는 영어 소문자·숫자·-만`);
    else if (listed.has(b.id)) err(where, `id "${b.id}" 중복`);
    if (!isStr(b.title)) err(where, 'title 없음');
    if (!TABS.includes(b.tab)) err(where, `tab "${b.tab}"는 ${TABS.join('·')} 중 하나`);
    if (!isStr(b.file)) err(where, 'file 없음');
    else if (b.file !== `books/${b.id}.json`) err(where, `file은 "books/${b.id}.json"이어야 함 (지금 "${b.file}")`);
    if (isStr(b.id)) listed.set(b.id, b);
  });

  const files = existsSync(booksDir)
    ? readdirSync(booksDir).filter((f) => f.endsWith('.json')).sort()
    : [];
  if (files.length === 0) notes.push('카드: content/books/에 책 파일 없음');

  const allCardIds = new Map(); // cardId -> file
  const bookIds = new Set(files.map((f) => basename(f, '.json')));

  for (const id of listed.keys()) {
    if (!bookIds.has(id)) err('content/index.json', `"${id}"의 파일 content/books/${id}.json이 없음`);
  }

  for (const f of files) {
    const rel = `content/books/${f}`;
    const book = readJson(join(booksDir, f), rel, err);
    if (book === undefined) continue;
    checkBook(root, book, rel, basename(f, '.json'), listed, bookIds, allCardIds, err, warn);
  }
  notes.push(`카드: 책 ${files.length}권, 카드 ${allCardIds.size}장 검사`);
}

function checkBook(root, book, rel, fileId, listed, bookIds, allCardIds, err, warn) {
  if (!book || typeof book !== 'object' || Array.isArray(book)) return err(rel, '객체여야 함');

  const id = book.id;
  if (id !== fileId) err(rel, `id "${id}"가 파일 이름 "${fileId}"와 다름`);
  if (!listed.has(fileId)) err(rel, 'content/index.json에 없음');
  else {
    const entry = listed.get(fileId);
    if (entry.title !== book.title) err(rel, `title이 index.json("${entry.title}")과 다름`);
    if (entry.tab !== book.tab) err(rel, `tab이 index.json("${entry.tab}")과 다름`);
  }

  if (book.lang !== 'ko') err(rel, `lang은 "ko" (지금 "${book.lang}")`);
  if (!isStr(book.title)) err(rel, 'title 없음');
  if (!isStr(book.author)) err(rel, 'author 없음');
  if (!TABS.includes(book.tab)) err(rel, `tab "${book.tab}"는 ${TABS.join('·')} 중 하나`);
  if (!UNITS.includes(book.unit)) err(rel, `unit "${book.unit}"는 ${UNITS.join('·')} 중 하나`);

  // source
  const s = book.source;
  if (!s || typeof s !== 'object') err(rel, 'source 없음');
  else {
    if (!isStr(s.originalLang)) err(rel, 'source.originalLang 없음');
    if (!(s.translatedFrom === null || isStr(s.translatedFrom))) err(rel, 'source.translatedFrom은 언어 코드 또는 null');
    if (s.originalLang === 'ko' && s.translatedFrom !== null) err(rel, '한국어 원문이면 source.translatedFrom은 null');
    if (!isStr(s.edition)) err(rel, 'source.edition 없음');
    if (!isHttps(s.url)) err(rel, 'source.url은 https:// 주소여야 함');
    if (!LICENSES.includes(s.license)) err(rel, `source.license는 ${LICENSES.join('·')}만 (지금 "${s.license}")`);
  }

  // cards
  if (!Array.isArray(book.cards) || book.cards.length === 0) err(rel, 'cards가 비어 있음');
  else {
    book.cards.forEach((c, i) => {
      const where = `${rel} cards[${i}]`;
      if (!c || typeof c !== 'object') return err(where, '객체여야 함');
      const want = `${id}-${String(i + 1).padStart(2, '0')}`;
      if (c.id !== want) err(where, `id는 "${want}"여야 함 (지금 "${c.id}") — 01부터 빠짐없이`);
      if (isStr(c.id)) {
        if (allCardIds.has(c.id)) err(where, `카드 id "${c.id}"가 ${allCardIds.get(c.id)}에도 있음`);
        else allCardIds.set(c.id, rel);
      }
      if (!TYPES.includes(c.type)) err(where, `type "${c.type}"는 ${TYPES.join('·')} 중 하나`);
      if (!isStr(c.text)) err(where, 'text 없음');
      else if (MAX_LEN[c.type] && len(c.text) > MAX_LEN[c.type]) {
        warn(where, `text ${len(c.text)}자 > ${MAX_LEN[c.type]}자 (예외면 검수 기록에 적을 것)`);
      }
      if (c.type === 'quote') {
        if (!isStr(c.note)) err(where, 'quote 카드는 note가 있어야 함');
        else if (len(c.note) > MAX_LEN.note) warn(where, `note ${len(c.note)}자 > ${MAX_LEN.note}자`);
      } else if (c.note !== undefined) {
        err(where, 'note는 type이 quote일 때만');
      }
    });
  }

  // commentary
  const cm = book.commentary;
  if (!cm || typeof cm !== 'object') err(rel, 'commentary 없음');
  else {
    for (const k of ['about', 'today']) {
      if (!isStr(cm[k])) err(rel, `commentary.${k} 없음`);
      else if (len(cm[k]) > MAX_LEN.commentary) warn(rel, `commentary.${k} ${len(cm[k])}자 > ${MAX_LEN.commentary}자`);
    }
    if (!Array.isArray(cm.related)) err(rel, 'commentary.related는 배열(없으면 [])');
    else {
      cm.related.forEach((r) => {
        if (r === id) err(rel, 'commentary.related에 자기 자신이 있음');
        else if (!listed.has(r)) warn(rel, `commentary.related "${r}"는 아직 index.json에 없음`);
      });
    }
    if (!cm.links || typeof cm.links !== 'object') err(rel, 'commentary.links 없음');
    else {
      for (const k of ['buy', 'library']) {
        if (!isHttps(cm.links[k])) err(rel, `commentary.links.${k}는 https:// 주소여야 함`);
      }
    }
  }

  // dailyQuote
  if (!isStr(book.dailyQuote)) err(rel, 'dailyQuote 없음');
  else {
    if (len(book.dailyQuote) > MAX_LEN.dailyQuote) warn(rel, `dailyQuote ${len(book.dailyQuote)}자 > ${MAX_LEN.dailyQuote}자`);
    const texts = Array.isArray(book.cards) ? book.cards.map((c) => (c && c.text) || '') : [];
    const q = book.dailyQuote.trim();
    if (!texts.some((t) => t.includes(q))) err(rel, 'dailyQuote가 cards의 text 안에 없음 (새로 지어내지 않기)');
  }

  // review
  const r = book.review;
  if (!r || typeof r !== 'object') err(rel, 'review 없음 (검수 전이면 content/에 넣지 않기)');
  else {
    if (!isStr(r.generatedBy)) err(rel, 'review.generatedBy 없음');
    if (!isStr(r.reviewedBy)) err(rel, 'review.reviewedBy 없음');
    if (isStr(r.generatedBy) && r.generatedBy === r.reviewedBy) err(rel, '만든 AI와 검수한 AI가 같음');
    if (!isStr(r.date) || !DATE_RE.test(r.date)) err(rel, 'review.date는 YYYY-MM-DD');
    const report = join(root, 'pipeline', 'reports', `${id}.md`);
    if (!existsSync(report)) err(rel, `검수 기록 pipeline/reports/${id}.md가 없음`);
  }
}

// ---------- PWA ----------

function checkPwa(root, err, notes) {
  if (!existsSync(join(root, 'index.html'))) {
    notes.push('PWA: index.html 없음 — 아직 화면이 없어 건너뜀');
    return;
  }
  for (const f of ['manifest.webmanifest', 'sw.js', 'app/js/storage.js']) {
    if (!existsSync(join(root, f))) err(f, '파일이 없음');
  }
  const mPath = join(root, 'manifest.webmanifest');
  if (existsSync(mPath)) {
    const m = readJson(mPath, 'manifest.webmanifest', err);
    if (m) {
      for (const k of ['name', 'short_name', 'start_url', 'display']) {
        if (!isStr(m[k])) err('manifest.webmanifest', `${k} 없음`);
      }
      if (!Array.isArray(m.icons) || m.icons.length === 0) err('manifest.webmanifest', 'icons 없음');
      else {
        m.icons.forEach((ic, i) => {
          if (!ic || !isStr(ic.src)) return err('manifest.webmanifest', `icons[${i}].src 없음`);
          if (/^https?:/.test(ic.src)) err('manifest.webmanifest', `icons[${i}] 외부 주소 금지`);
          else if (!existsSync(join(root, ic.src.replace(/^\.?\//, '')))) err('manifest.webmanifest', `icons[${i}] 파일 ${ic.src} 없음`);
        });
      }
    }
  }
  notes.push('PWA: 필수 파일 검사');
}

// ---------- 저장소 규칙 (AGENTS.md §6) ----------

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

function checkRepoRules(root, err, notes) {
  const rel = (p) => relative(root, p).split('\\').join('/');

  // 앱 코드: localStorage는 storage.js만, console.log 금지, 외부 스크립트 금지
  const codeFiles = [
    ...walk(join(root, 'app'), ['.js', '.css', '.html']),
    ...['index.html', 'sw.js'].map((f) => join(root, f)).filter(existsSync),
  ];
  for (const p of codeFiles) {
    const r = rel(p);
    const lines = readFileSync(p, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const at = `${r}:${i + 1}`;
      if (r.endsWith('.js') && r !== 'app/js/storage.js' && /\blocalStorage\b/.test(line)) {
        err(at, 'localStorage는 app/js/storage.js에서만');
      }
      if (/\bconsole\.log\s*\(/.test(line)) err(at, 'console.log 남아 있음');
      if (/<(script|link)\b[^>]*\b(src|href)\s*=\s*["']?(https?:)?\/\//i.test(line)) err(at, '외부 스크립트·CDN 금지 (assets/에 두기)');
      if (/@import\s+(url\()?\s*["']?(https?:)?\/\//i.test(line)) err(at, '외부 CSS 금지');
      if (/\bimport\b[^'"]*["'](https?:)?\/\//.test(line)) err(at, '외부 모듈 import 금지');
    });
  }

  // docs/PRD.md가 git에 올라가 있으면 안 됨
  if (existsSync(join(root, '.git'))) {
    try {
      const out = execFileSync('git', ['ls-files', 'docs/PRD.md'], { cwd: root, encoding: 'utf8' });
      if (out.trim() !== '') err('docs/PRD.md', 'git에 올라가 있음 (커밋 금지, D-7)');
    } catch {
      notes.push('저장소: git을 실행할 수 없어 PRD 추적 검사 건너뜀');
    }
  }
  notes.push(`저장소 규칙: 코드 파일 ${codeFiles.length}개 검사`);
}

// ---------- 실행 ----------

function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--root');
  const root = resolve(i >= 0 && args[i + 1] ? args[i + 1] : process.cwd());

  const { errors, warnings, notes } = verify(root);
  for (const n of notes) console.log(`· ${n}`);
  for (const w of warnings) console.log(`경고 ${w}`);
  for (const e of errors) console.log(`오류 ${e}`);
  console.log(errors.length === 0
    ? `통과 (오류 0, 경고 ${warnings.length})`
    : `실패 (오류 ${errors.length}, 경고 ${warnings.length})`);
  process.exitCode = errors.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
