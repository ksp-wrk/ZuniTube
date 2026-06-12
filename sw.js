const CACHE_NAME = 'zunitube-v1';
const ASSETS = [
  'index.html',
  'manifest.json'
];

// ওয়েবসাইট প্রথমবার চালু হলে প্রয়োজনীয় ফাইল ক্যাশ (Cache) মেমরিতে জমা রাখা
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// ইন্টারনেট না থাকলে ক্যাশ মেমরি থেকে ওয়েবসাইট লোড করা
self.addEventListener('fetch', e => {
  if (e.request.url.includes('index.html') || e.request.url.includes('manifest.json')) {
    e.respondWith(
      caches.match(e.request).then(cachedResponse => {
        return cachedResponse || fetch(e.request);
      })
    );
  }
});
