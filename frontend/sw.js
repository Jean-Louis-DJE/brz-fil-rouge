const CACHE = 'breizh4line-v1';
const ASSETS = [
  './','./index.html','./style.css','./app.js','./manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k !== CACHE) && caches.delete(k))))
  );
});

// ⚠️ Laisse passer toutes les requêtes backend directement au réseau
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/breizh4line/backend/')) return; // no intercept
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
