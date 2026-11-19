/* ร้อยมาลัย (แบบมีมือ+ไม้เสียบ) — ต่อท้าย index.html ด้วย <script src="garland.js"></script>
   แทนที่ #garland เดิมทั้งหมด ใช้ตัวแปรกลางของเกม: $, inits, go, ding, speak, shuf, save, garlands, drawGarden */
(()=>{
const KEYS=['marigold','jasmine','rak'],NAME={marigold:'ดอกดาวเรือง',jasmine:'ดอกมะลิ',rak:'ดอกรัก'};
const SRC=(k,v)=>'fl-'+(k=='rak'?'rak'+v:k)+'.webp';
const PILE_H={marigold:54,jasmine:56,rak:44},STICK_H={marigold:46,jasmine:48,rak:38};
const N=8,STEP=37,SIZE=48,KEY='wwGarlandSeq';
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const HAND='<svg class="gl-hand" viewBox="0 0 100 100" width="96" height="96" aria-hidden="true"><g stroke="#c98b60" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" fill="#f6d2b0"><path d="M70 0 L100 22 L100 60 Q84 66 68 56 L52 44 Q58 20 70 0Z"/><path d="M54 44 Q40 52 28 62 Q18 70 22 75 Q28 78 36 70 Q46 62 62 54Z"/><path d="M64 56 Q52 68 40 78 Q31 86 36 90 Q43 92 52 82 Q66 70 78 62Z"/></g></svg>';
const css=document.createElement('style');
css.textContent=`
#glStage{position:relative;width:100%;max-width:340px;display:flex;flex-direction:column;align-items:center;gap:6px}
.gl-pat{display:flex;align-items:center;justify-content:center;gap:4px;min-height:40px;padding:4px 10px;background:#fffaf0;border:3px dashed #e6aa30;border-radius:18px;width:100%}
.gl-pat small{font-weight:700;color:#2f7a4a;margin-right:4px}
.gl-pat span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%}
.gl-pat span.now{background:#ffe3e0;box-shadow:0 0 0 3px #ff8a7a}
.gl-pat img{height:26px;width:auto}
#glStick{position:relative;width:100%;height:64px}
.gl-rod{position:absolute;left:0;right:12px;top:29px;height:7px;border-radius:4px;background:linear-gradient(#e0b274,#a9743a)}
.gl-tip{position:absolute;right:0;top:27px;border-left:16px solid #a9743a;border-top:5px solid transparent;border-bottom:5px solid transparent}
.gl-slot{position:absolute;top:8px;width:${SIZE}px;height:${SIZE}px;display:grid;place-items:center;animation:glpop .3s}
.gl-slot img{width:auto}
@keyframes glpop{50%{transform:scale(1.2)}}
.gl-tray{position:relative;width:224px;height:252px;flex:none}
.gl-tray>img{position:absolute;inset:0;width:100%;height:100%}
.gl-fl{position:absolute;padding:0;border:0;background:none;cursor:pointer;display:grid;place-items:center;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}
.gl-fl img{width:auto;pointer-events:none}
.gl-fl.hint{animation:glglow .8s ease-in-out infinite}
.gl-fl.no{animation:sh .3s}
@keyframes glglow{50%{transform:scale(1.18) rotate(var(--r,0deg));filter:drop-shadow(0 0 8px #ffb300)}}
.gl-fly{position:absolute;width:0;height:0;z-index:10;pointer-events:none}
.gl-fly>img{position:absolute;width:auto}
.gl-hand{position:absolute;left:-23px;top:-71px;filter:drop-shadow(0 4px 3px rgba(0,0,0,.2))}
.gl-mini{width:100%;text-align:center}
.gl-mini img{height:24px;width:auto;margin:0 -2px;vertical-align:middle}
`;
document.head.append(css);

let pattern=[],got=[],wrongs=0,busy=false;
const row=(el,html)=>el.innerHTML=html;

function build(){
  $('#garland').innerHTML=`<h2>ร้อยมาลัย</h2>
<p class="sub">แตะดอกไม้ในถาด ให้มือหยิบไปเสียบตามลาย</p>
<div id="glStage"><div class="gl-pat" id="glPat"></div><div id="glStick"><i class="gl-rod"></i><b class="gl-tip"></b></div><p class="chip" id="glCount"></p><div class="gl-tray" id="glTray"><img src="fl-tray.webp" alt="ถาดใบตองใส่ดอกไม้"></div></div>
<p class="encourage" id="glMsg" aria-live="polite"></p>
<div class="row"><button class="btn w" data-go="menu">← กลับ</button><button class="btn" id="glAgain" type="button">เริ่มร้อยใหม่</button></div>`;
  $('#glAgain').onclick=glInit;
}
function glInit(){
  build();pattern=[];got=[];wrongs=0;busy=false;
  const unit=shuf(KEYS).slice(0,Math.random()<.5?2:3);
  pattern=Array.from({length:N},(_,i)=>unit[i%unit.length]);
  $('#glPat').setAttribute('aria-label','ลาย: '+pattern.map(k=>NAME[k]).join(' '));
  const pile=shuf([...Array(5).fill('marigold'),...Array(5).fill('jasmine'),'rak1','rak2','rak3','rak4']);
  const tray=$('#glTray'),W=224,cx=W/2,cy=126,R=W*.34;
  pile.forEach((id,i)=>{
    const k=id.startsWith('rak')?'rak':id,v=id.startsWith('rak')?id.slice(3):'1',h=PILE_H[k];
    const a=i*2.39996,r=Math.sqrt((i+.6)/pile.length)*R,rot=(i*67)%360-180;
    const b=document.createElement('button');b.type='button';b.className='gl-fl';b.dataset.k=k;b.dataset.v=v;b.setAttribute('aria-label',NAME[k]);
    b.style.cssText=`width:${h+6}px;height:${h+6}px;left:${cx+r*Math.cos(a)-(h+6)/2}px;top:${cy+r*Math.sin(a)-(h+6)/2}px;--r:${rot}deg;transform:rotate(${rot}deg)`;
    b.innerHTML=`<img src="${SRC(k,v)}" alt="" style="height:${h}px">`;
    b.onclick=()=>pick(b);tray.append(b);
  });
  refresh();
  $('#glMsg').textContent='ลองแตะดอกไม้ในถาดดูนะ';
}
function refresh(){
  $('#glPat').innerHTML='<small>ลาย</small>'+pattern.map((k,i)=>`<span class="${i==got.length?'now':''}"><img src="${SRC(k,1)}" alt=""></span>`).join('');
  $('#glCount').textContent=got.length<N?'ดอกที่ '+(got.length+1)+' จาก '+N:'มาลัยครบแล้ว!';
}
function pick(b){
  if(busy||got.length>=N)return;
  const k=b.dataset.k;
  if(k!==pattern[got.length]){
    wrongs++;b.classList.remove('no');void b.offsetWidth;b.classList.add('no');
    $('#glMsg').textContent='ลองอีกทีนะ ดูลายด้านบนช้า ๆ';
    if(wrongs>=2)document.querySelectorAll('.gl-fl').forEach(x=>x.classList.toggle('hint',x.dataset.k==pattern[got.length]&&x.style.visibility!='hidden'));
    return;
  }
  busy=true;wrongs=0;
  document.querySelectorAll('.gl-fl.hint').forEach(x=>x.classList.remove('hint'));
  thread(b,k,b.dataset.v).then(()=>{
    got.push({k,v:b.dataset.v});busy=false;refresh();ding();
    if(got.length==N)done();else $('#glMsg').textContent='ดีมาก! ดอกที่ '+got.length+' แล้ว';
  });
}
async function thread(b,k,v){
  const st=$('#glStage'),sr=st.getBoundingClientRect(),br=b.getBoundingClientRect(),stk=$('#glStick'),kr=stk.getBoundingClientRect();
  const idx=got.length,sx=br.left-sr.left+br.width/2,sy=br.top-sr.top+br.height/2;
  const dx=(kr.left-sr.left)+6+idx*STEP+SIZE/2-sx,dy=(kr.top-sr.top)+32-sy;
  b.style.visibility='hidden';
  const ph=PILE_H[k],sh=STICK_H[k];
  if(!reduce){
    const fly=document.createElement('div');fly.className='gl-fly';fly.style.left=sx+'px';fly.style.top=sy+'px';
    fly.innerHTML=`<img src="${SRC(k,v)}" alt="" style="height:${ph}px;left:-${ph/2}px;top:-${ph/2}px">`+HAND;
    st.append(fly);
    fly.firstChild.animate([{transform:'scale(1)'},{transform:`scale(${sh/ph})`}],{duration:650,fill:'forwards'});
    await fly.animate([{transform:'translate(0,0)'},{transform:`translate(${dx*.5}px,${dy*.5-34}px)`},{transform:`translate(${dx}px,${dy}px)`}],{duration:650,easing:'ease-in-out',fill:'forwards'}).finished;
    fly.firstChild.remove();
    stk.animate([{transform:'translateY(0)'},{transform:'translateY(2px)'},{transform:'translateY(0)'}],{duration:180});
    fly.animate([{transform:`translate(${dx}px,${dy}px)`,opacity:1},{transform:`translate(${dx+50}px,${dy-40}px)`,opacity:0}],{duration:300,fill:'forwards'}).finished.then(()=>fly.remove());
  }
  const s=document.createElement('div');s.className='gl-slot';s.style.left=(6+idx*STEP)+'px';
  s.innerHTML=`<img src="${SRC(k,v)}" alt="${NAME[k]}" style="height:${sh}px">`;stk.append(s);
}
function done(){
  $('#glMsg').textContent='มาลัยครบแล้ว! เก็บเข้ามุมสวนเรียบร้อย';
  try{const all=JSON.parse(localStorage.getItem(KEY)||'[]');all.push(got.map(g=>SRC(g.k,g.v)));localStorage.setItem(KEY,JSON.stringify(all.slice(-5)))}catch(e){}
  garlands++;save();speak('เก่งมาก ร้อยมาลัยสำเร็จแล้ว');
  setTimeout(()=>go('win'),1300);
}
inits.garland=glInit;

// สวน: วาดมาลัยด้วยภาพดอกไม้จริงแทนอีโมจิ
const dg=drawGarden;
drawGarden=function(){
  dg();
  const gd=$('#gd');gd.querySelectorAll('.garden-garland').forEach(e=>e.remove());
  let all=[];try{all=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){}
  all.forEach(seq=>{const s=document.createElement('span');s.className='garden-garland gl-mini';s.innerHTML=seq.map(src=>`<img src="${src}" alt="">`).join('');gd.append(s)});
};
inits.garden=drawGarden;
})();
