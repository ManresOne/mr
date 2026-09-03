// Service worker del Cotizador — solo se encarga de que la app "cascarón"
// (el HTML, el manifest y los íconos) pueda instalarse y abrirse sin
// conexión. NO cachea ni intercepta nada de Google Sign-In, tu Apps
// Script/Google Sheets, ni las librerías externas (jsPDF, Chart.js, etc.):
// esas siempre van directo a la red para que el login y tus datos
// funcionen normal.

const CACHE_NAME = 'cotizador-shell-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Solo nos metemos en peticiones GET de nuestro propio origen
  // (el archivo HTML, el manifest, los íconos). Todo lo demás
  // (Google Sign-In, tu Apps Script, CDNs) pasa de largo sin tocar.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
