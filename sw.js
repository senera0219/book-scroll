// 서비스 워커: 앱 화면과 카드를 휴대폰에 저장해 오프라인에서도 열리게 한다.
// 저장본 목록(SHELL)을 바꾸면 VERSION을 올린다(새 버전이 옛 저장본을 지운다).

const VERSION = 'v5';
const CACHE = `book-scroll-${VERSION}`;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'app/styles/base.css',
  'app/styles/feed.css',
  'app/js/main.js',
  'app/js/content.js',
  'app/js/feed.js',
  'app/js/render.js',
  'app/js/storage.js',
  'app/js/controls.js',
  'app/js/textsize.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('book-scroll-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// 같은 사이트 파일: 인터넷이 되면 항상 새 파일을 받아 보여 주고 저장본도 바꾼다.
// 인터넷이 안 되면 저장본을 보여 준다. (고친 화면이 바로 보이게 하려고 새 파일 우선)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const res = await fetch(req, { cache: 'no-cache' });
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const cached = await cache.match(req, { ignoreSearch: true });
        return cached || Response.error();
      }
    }),
  );
});
