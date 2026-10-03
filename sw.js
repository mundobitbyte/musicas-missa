const CACHE = 'musicas-missa-v2';

const ARQUIVOS_ESSENCIAIS = [
  './',
  './index.html',
  './repertorio.html',
  './musica.html',
  './montar-missa.html',
  './roteiro.html',
  './manifest.webmanifest',
  './assets/img/icone-app.svg',
  './assets/css/style.css',
  './assets/css/tema.css',
  './assets/css/print.css',
  './assets/js/site.js',
  './assets/js/app.js',
  './assets/js/repertorio.js',
  './assets/js/missa.js',
  './assets/js/compartilhar.js',
  './data/musicas.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ARQUIVOS_ESSENCIAIS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(chaves => Promise.all(
        chaves
          .filter(chave => chave.startsWith('musicas-missa-') && chave !== CACHE)
          .map(chave => caches.delete(chave))
      ))
      .then(() => self.clients.claim())
  );
});

async function redePrimeiro(request) {
  try {
    const resposta = await fetch(request);
    if (resposta && resposta.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, resposta.clone());
    }
    return resposta;
  } catch {
    const emCache = await caches.match(request, { ignoreSearch: true });
    if (emCache) return emCache;
    return caches.match('./index.html');
  }
}

async function cachePrimeiro(request) {
  const emCache = await caches.match(request, { ignoreSearch: true });
  if (emCache) return emCache;

  const resposta = await fetch(request);
  if (resposta && resposta.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, resposta.clone());
  }
  return resposta;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || url.pathname.endsWith('/data/musicas.json')) {
    event.respondWith(redePrimeiro(request));
    return;
  }

  event.respondWith(cachePrimeiro(request));
});
