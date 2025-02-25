const CACHE_NAME = 'my-spa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js', // Это пример, точное имя зависит от сборки
  '/static/css/main.chunk.css', // Аналогично
];

// Установка Service Worker и кэширование ресурсов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Кэширование ресурсов');
      return cache.addAll(urlsToCache);
    })
  );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Возвращаем кэшированный ответ или делаем запрос к сети
      return response || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      // Если запрос не удался и нет кэша, можно вернуть оффлайн-страницу
      return caches.match('/index.html');
    })
  );
});

// Обновление Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});