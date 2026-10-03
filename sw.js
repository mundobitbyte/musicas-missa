const CACHE = 'musicas-missa-v19';

const ARQUIVOS_ESSENCIAIS = [
  './',
  './index.html',
  './repertorio.html',
  './musica.html',
  './montar-missa.html',
  './roteiro.html',
  './missas-salvas.html',
  './cadastro-musica.html',
  './manifest.webmanifest',
  './assets/img/icone-app.svg',
  './assets/css/style.css',
  './assets/css/tema.css',
  './assets/css/tela-ativa.css',
  './assets/css/lista-celebracao.css',
  './assets/css/print.css',
  './assets/css/cadastro-musica.css',
  './assets/js/site.js',
  './assets/js/favoritos.js',
  './assets/js/app.js',
  './assets/js/repertorio.js',
  './assets/js/missa.js',
  './assets/js/compartilhar.js',
  './assets/js/nova-missa.js',
  './assets/js/fluxo-escolha.js',
  './assets/js/transposicao.js',
  './assets/js/tela-ativa.js',
  './assets/js/gestos-celebracao.js',
  './assets/js/lista-celebracao.js',
  './assets/js/transferir-missa.js',
  './assets/js/missas-salvas.js',
  './assets/js/cadastro-musica.js',
  './assets/js/ocr-cadastro.js',
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

function chaveParaCache(request) {
  if (request.mode !== 'navigate') return request;

  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  return url.toString();
}

async function redePrimeiro(request, permitirHomeComoFallback = false) {
  let respostaRede = null;

  try {
    respostaRede = await fetch(request);

    if (respostaRede && respostaRede.ok) {
      const cache = await caches.open(CACHE);
      cache.put(chaveParaCache(request), respostaRede.clone());
      return respostaRede;
    }
  } catch {
    respostaRede = null;
  }

  const emCache = await caches.match(request, { ignoreSearch: true });
  if (emCache) return emCache;

  if (respostaRede) return respostaRede;

  if (permitirHomeComoFallback) {
    const home = await caches.match('./index.html');
    if (home) return home;
  }

  return new Response('Recurso indisponível no momento.', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
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

  if (request.mode === 'navigate') {
    event.respondWith(redePrimeiro(request, true));
    return;
  }

  if (url.pathname.endsWith('/data/musicas.json')) {
    event.respondWith(redePrimeiro(request));
    return;
  }

  event.respondWith(cachePrimeiro(request));
});