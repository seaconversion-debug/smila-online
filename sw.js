/**
 * Service Worker — СмілаОнлайн
 * Кешує статику, news.json оновлює в мережі
 */

const CACHE = 'smila-v1';
const STATIC = ['/', '/index.html', '/style.css', '/main.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // news.json і stats.json: network-first
  if (url.pathname.includes('data/news.json') || url.pathname.includes('data/stats.json')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Зовнішні запити (tg, siren, wttr): без кешу
  if (url.origin !== location.origin) return;

  // Статика: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
