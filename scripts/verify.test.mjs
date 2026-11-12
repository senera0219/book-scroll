// 검사 도구 자체의 시험. 실행: node --test scripts/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { verify } from './verify.mjs';

function goodBook() {
  return {
    id: 'meditations',
    lang: 'ko',
    title: '명상록',
    author: '마르쿠스 아우렐리우스',
    tab: 'philosophy',
    source: {
      originalLang: 'grc',
      translatedFrom: 'en',
      edition: 'Project Gutenberg #2680 영역본',
      url: 'https://www.gutenberg.org/ebooks/2680',
      license: 'public-domain',
    },
    unit: 'bundle',
    cards: [
      { id: 'meditations-01', type: 'quote', text: '아침 일찍 스스로에게 말하라.', note: '해설.' },
      { id: 'meditations-02', type: 'summary', text: '요약.' },
    ],
    commentary: {
      about: '이 책은.',
      today: '지금은.',
      related: [],
      links: { buy: 'https://example.com/buy', library: 'https://example.com/lib' },
    },
    dailyQuote: '아침 일찍 스스로에게 말하라.',
    review: { generatedBy: 'claude', reviewedBy: 'chatgpt', date: '2026-11-12' },
  };
}

function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), 'verify-test-'));
  for (const [path, content] of Object.entries(files)) {
    const p = join(root, path);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  }
  return root;
}

function withBook(book, extra = {}) {
  return {
    'content/index.json': { books: [{ id: 'meditations', title: '명상록', tab: 'philosophy', file: 'books/meditations.json' }] },
    'content/books/meditations.json': book,
    'pipeline/reports/meditations.md': '# 검수 기록\n',
    ...extra,
  };
}

function run(files) {
  const root = makeRoot(files);
  try {
    return verify(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const has = (list, text) => list.some((e) => e.includes(text));

test('빈 프로젝트는 통과하고 건너뛴 것을 알린다', () => {
  const r = run({});
  assert.deepEqual(r.errors, []);
  assert.ok(has(r.notes, 'content/ 없음'));
  assert.ok(has(r.notes, 'index.html 없음'));
});

test('올바른 책은 통과한다', () => {
  const r = run(withBook(goodBook()));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test('source.url·license가 없으면 실패', () => {
  const b = goodBook();
  delete b.source.url;
  b.source.license = 'cc-by';
  const r = run(withBook(b));
  assert.ok(has(r.errors, 'source.url'));
  assert.ok(has(r.errors, 'source.license'));
});

test('검수 기록 파일이 없거나 같은 AI가 검수하면 실패', () => {
  const b = goodBook();
  b.review.reviewedBy = 'claude';
  const files = withBook(b);
  delete files['pipeline/reports/meditations.md'];
  const r = run(files);
  assert.ok(has(r.errors, 'pipeline/reports/meditations.md'));
  assert.ok(has(r.errors, '같음'));
});

test('카드 id가 건너뛰면 실패', () => {
  const b = goodBook();
  b.cards[1].id = 'meditations-03';
  assert.ok(has(run(withBook(b)).errors, 'meditations-02'));
});

test('quote가 아닌 카드에 note가 있거나 quote에 note가 없으면 실패', () => {
  const b = goodBook();
  b.cards[1].note = 'x';
  delete b.cards[0].note;
  const r = run(withBook(b));
  assert.ok(has(r.errors, 'quote일 때만'));
  assert.ok(has(r.errors, 'note가 있어야'));
});

test('dailyQuote가 카드에 없는 문장이면 실패', () => {
  const b = goodBook();
  b.dailyQuote = '지어낸 문장';
  assert.ok(has(run(withBook(b)).errors, 'dailyQuote'));
});

test('긴 카드는 경고만 한다', () => {
  const b = goodBook();
  b.cards[0].text = '가'.repeat(121);
  b.dailyQuote = '가가가';
  const r = run(withBook(b));
  assert.deepEqual(r.errors, []);
  assert.ok(has(r.warnings, '121자'));
});

test('index.json에 없는 책·없는 파일은 실패', () => {
  const files = withBook(goodBook());
  files['content/index.json'] = { books: [{ id: 'candle', title: '촛불의 과학', tab: 'science', file: 'books/candle.json' }] };
  const r = run(files);
  assert.ok(has(r.errors, 'index.json에 없음'));
  assert.ok(has(r.errors, 'candle.json이 없음'));
});

test('JSON 문법 오류는 실패', () => {
  const files = withBook(goodBook());
  files['content/books/meditations.json'] = '{ "id": ';
  assert.ok(has(run(files).errors, 'JSON을 읽을 수 없음'));
});

test('앱 코드 규칙: localStorage·console.log·CDN', () => {
  const r = run({
    'index.html': '<script src="https://cdn.example.com/x.js"></script>',
    'manifest.webmanifest': { name: 'a', short_name: 'a', start_url: '.', display: 'standalone', icons: [{ src: 'assets/icon.png' }] },
    'assets/icon.png': 'x',
    'sw.js': '',
    'app/js/storage.js': 'localStorage.getItem("a");',
    'app/js/feed.js': 'localStorage.setItem("a", 1);\nconsole.log("debug");',
  });
  assert.ok(has(r.errors, 'app/js/feed.js:1'));
  assert.ok(has(r.errors, 'console.log'));
  assert.ok(has(r.errors, 'CDN'));
  assert.ok(!has(r.errors, 'storage.js:'));
});

test('PWA: index.html이 있으면 manifest·sw.js가 있어야 함', () => {
  const r = run({ 'index.html': '<p>hi</p>' });
  assert.ok(has(r.errors, 'manifest.webmanifest'));
  assert.ok(has(r.errors, 'sw.js'));
});
