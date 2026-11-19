const V='ww-v1',CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','app-cover-mobile.png','app-cover-desktop.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const nav=r.mode==='navigate';
  e.respondWith(
    (nav?fetch(r).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))):caches.match(r).then(m=>m||fetch(r)))
    .then(res=>{if(res&&(res.ok||res.type==='opaque')){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res})
  )
});
