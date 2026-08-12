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

// --- Web Push (T1-R07) ---
self.addEventListener('push', function(event) {
  let data = { title: 'Notificação', body: 'Você tem uma nova notificação.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/logo-mini.svg',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
