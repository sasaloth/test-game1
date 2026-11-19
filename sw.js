const CACHE_VERSION='ww-v2';
const CORE_FILES=[
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'app-cover-mobile.png',
  'app-cover-desktop.png',
  'pripac-relaxed-gaming-vibes-323631.mp3'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache=>Promise.all(CORE_FILES.map(file=>cache.add(file).catch(()=>{}))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_VERSION).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('range'))return;

  const isNavigation=request.mode==='navigate';
  event.respondWith(
    (isNavigation
      ?fetch(request).catch(()=>caches.match(request).then(response=>response||caches.match('index.html')))
      :caches.match(request).then(response=>response||fetch(request)))
      .then(response=>{
        if(response&&(response.ok||response.type==='opaque')){
          const copy=response.clone();
          caches.open(CACHE_VERSION).then(cache=>cache.put(request,copy));
        }
        return response;
      })
  );
});
