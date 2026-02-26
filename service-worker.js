const CACHE_NAME = "efc-erp-v3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./styles.css",
  "./app.js",
  "./favicon.png",
  "./192.png",
  "./512.png"
];

// INSTALAÇÃO
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// ATIVAÇÃO
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// FETCH (IMPORTANTE: não interceptar navegação HTML errada)
self.addEventListener("fetch", event => {

  // Só faz cache para arquivos estáticos
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );

});
