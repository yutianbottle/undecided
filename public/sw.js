/* 未决离线缓存：页面资源可缓存，用户记录保存在 localStorage。 */
/* 缓存名包含构建版本，更新构建时创建新缓存并淘汰旧资源。 */
const BUILD = new URL(self.location.href).searchParams.get('v') || 'dev';
const CACHE = 'weijue-' + BUILD;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 页面提示刷新时，让等待中的新版本立即接管。 */
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // 导航请求优先使用网络，离线时回退到缓存中的 index.html。
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // 静态资源优先使用缓存；带 hash 的文件可长期缓存。
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((resp) => {
        if (resp.ok && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return resp;
      });
    })
  );
});
