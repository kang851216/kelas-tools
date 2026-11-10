/* sw.js — offline cache for KelasTools */
const CACHE = 'kelas-v8';
const ASSETS = [
  './',
  './index.html',
  './roulette.html',
  './kelompok.html',
  './timer.html',
  './404.html',
  './css/style.css',
  './js/app.js',
  './js/roulette.js',
  './js/kelompok.js',
  './js/timer.js',
  './manifest.webmanifest',
  './panduan/cara-membagi-kelompok-belajar.html',
  './panduan/ide-memilih-siswa-acak.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
