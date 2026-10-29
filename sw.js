// Çevrimdışı çalışma: uygulama dosyaları önbelleğe alınır, AI görselleri ilk görüldükten sonra saklanır.
const VERSION = 'kb-v2';
const CORE = ['./', 'index.html', 'styles.css', 'app.js', 'data/words.js', 'data/phrasal.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
const IMG_CACHE = 'kb-img-v1';
const IMG_MAX = 600;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== IMG_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
async function trimImages() {
  const c = await caches.open(IMG_CACHE); const keys = await c.keys();
  for (let i = 0; i < keys.length - IMG_MAX; i++) await c.delete(keys[i]);
}
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // önce ağ (güncel sürüm), yoksa önbellek
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (req.destination === 'image') {
    e.respondWith(caches.open(IMG_CACHE).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trimImages(); }
      return res;
    }));
  }
});
