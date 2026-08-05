/**
 * Service Worker do QR do Bem — versão rústica (06/08/2026).
 * Suporte ao requisito T1-R07: o frontend precisa ser instalável como app
 * para o Botão de Pânico funcionar como alarme.
 *
 * ESTRATÉGIA DE CACHE, E POR QUE ESTA E NÃO OUTRA
 *
 *   - App shell (HTML, JS, CSS): network-first com fallback para cache.
 *     Cache-first serviria versão velha depois de um deploy, e o deploy
 *     aqui é upload manual — usuário com tela antiga não teria como saber.
 *
 *   - Chamadas de API: NUNCA cacheadas. Dado de emergência servido do
 *     cache é pior que erro de rede: alergia desatualizada numa página de
 *     primeiros socorros pode fazer estrago real.
 *
 * O que este SW NÃO faz, e precisa ficar claro: não dispara alarme em
 * segundo plano. Navegador não toca som sem gesto do usuário, e Web Push
 * exige servidor VAPID, que é a versão definitiva. O alarme atual toca a
 * partir do toque no botão, dentro do app aberto.
 */

const CACHE_NAME = 'qrdobem-v1';

// Só o essencial para a casca abrir offline. Os assets com hash entram no
// cache conforme forem usados.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/logo-mini.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // Assume o controle sem esperar o fechamento das abas antigas.
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API nunca é cacheada. Ver justificativa no cabeçalho.
  if (url.pathname.startsWith('/api/') || url.hostname.startsWith('api.')) {
    return;
  }

  // Outros domínios (Firebase, etc.) seguem direto para a rede.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Guarda uma cópia para o caso de ficar offline depois.
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) =>
          // SPA: qualquer rota desconhecida offline devolve o index, senão
          // atualizar a página em /contas daria erro de navegação.
          cached || caches.match('/index.html')
        )
      )
  );
});
