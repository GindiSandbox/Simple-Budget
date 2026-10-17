// Simple Budget service worker (v1.5): lets the app open with no internet.
// Same-site files are cached. The page is fetched fresh when online (so updates arrive) and falls back to the saved copy when offline or slow.
var CACHE = 'simple-budget-v1.6';
var FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return; // fonts etc. go to the network; the app falls back to system fonts offline
  if (r.mode === 'navigate') {
    e.respondWith(
      Promise.race([
        fetch(r).then(function (res) { if (res && res.ok) { var cp = res.clone(); caches.open(CACHE).then(function (c) { c.put('index.html', cp); }); } return res; }),
        new Promise(function (_, rej) { setTimeout(rej, 3000); })
      ]).catch(function () { return caches.match('index.html').then(function (m) { return m || caches.match('./'); }); })
    );
    return;
  }
  e.respondWith(caches.match(r).then(function (m) { return m || fetch(r); }));
});
