self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // 简单的透传，主要为了满足 PWA 的安装条件
  e.respondWith(
    fetch(e.request).catch(() => new Response('Network error or offline'))
  );
});
