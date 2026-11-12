// 서비스 워커: 앱 화면과 카드를 휴대폰에 저장해 오프라인에서도 열리게 한다.
// 화면 파일을 바꾸면 VERSION을 올린다(새 버전이 옛 저장본을 지운다).

const VERSION = 'v1';
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

// 같은 사이트 파일: 저장본을 바로 보여 주고, 뒤에서 새로 받아 저장본을 갱신한다.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      if (cached) {
        event.waitUntil(fresh);
        return cached;
      }
      return fresh;
    }),
  );
});
