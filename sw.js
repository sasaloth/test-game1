const CACHE_VERSION='ww-v5';
const MUSIC_FILE='pripac-relaxed-gaming-vibes-323631.mp3';
const CORE_FILES=[
  './',
  'index.html',
  'garland.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'app-cover-mobile.png',
  'app-cover-desktop.png',
  'fl-tray.webp',
  'fl-marigold.webp',
  'fl-jasmine.webp',
  'fl-rak1.webp',
  'fl-rak2.webp',
  'fl-rak3.webp',
  'fl-rak4.webp',
  MUSIC_FILE
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
  if(request.method!=='GET')return;

  const range=request.headers.get('range');
  if(range&&new URL(request.url).pathname.endsWith('/'+MUSIC_FILE)){
    event.respondWith((async()=>{
      const musicUrl=new URL(MUSIC_FILE,self.registration.scope).href;
      const cached=await caches.match(musicUrl);
      if(!cached)return fetch(request);

      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      const data=await cached.arrayBuffer();
      if(!match)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+data.byteLength}});

      const start=match[1]?Number(match[1]):Math.max(0,data.byteLength-Number(match[2]));
      const end=match[2]&&match[1]?Math.min(Number(match[2]),data.byteLength-1):data.byteLength-1;
      if(start>=data.byteLength||end<start)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+data.byteLength}});

      const body=data.slice(start,end+1);
      return new Response(body,{status:206,headers:{
        'Accept-Ranges':'bytes',
        'Content-Length':String(body.byteLength),
        'Content-Range':'bytes '+start+'-'+end+'/'+data.byteLength,
        'Content-Type':'audio/mpeg'
      }});
    })());
    return;
  }
  if(range)return;

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
