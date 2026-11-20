/* ร้อยมาลัย (มือ + ไม้เสียบ) — เพิ่มใน index.html ก่อน </body> หลังสคริปต์หลัก: <script src="garland.js"></script>
   สร้างหน้า #garland และปุ่มในเมนูให้เองถ้ายังไม่มี ปรับขนาดตามจอ (มือถือ/คอม) ใช้ตัวแปรกลางของเกม: $, inits, go, ding, speak, shuf */
(()=>{
const KEYS=['marigold','jasmine','rak'],NAME={marigold:'ดอกดาวเรือง',jasmine:'ดอกมะลิ',rak:'ดอกรัก'};
const SRC=(k,v)=>'fl-'+(k=='rak'?'rak'+v:k)+'.webp';
const PILE_H={marigold:54,jasmine:56,rak:44},STICK_H={marigold:46,jasmine:48,rak:38};
const N=8,STEP=37,SIZE=48,KEY='wwGarlandSeq';
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const HAND='<svg class="gl-hand" viewBox="0 0 100 100" overflow="visible" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#c98b60"><path d="M135 -20L70 40" stroke-width="31"/><ellipse cx="62" cy="48" rx="20" ry="17" fill="#c98b60" stroke-width="5"/><path d="M54 44L25 72" stroke-width="16"/><path d="M68 58L28 76" stroke-width="16"/></g><g stroke="#f6d2b0"><path d="M135 -20L70 40" stroke-width="26"/><ellipse cx="62" cy="48" rx="20" ry="17" fill="#f6d2b0" stroke-width="0"/><path d="M54 44L25 72" stroke-width="11"/><path d="M68 58L28 76" stroke-width="11"/><path d="M60 40Q70 36 76 44M62 50Q72 48 78 56" stroke="#e3b48c" stroke-width="2"/></g></g></svg>';
const css=document.createElement('style');
const P=n=>`calc(${n}px*var(--s,1))`;
css.textContent=`
#garland{overflow-x:hidden}
#glStage{position:relative;width:100%;max-width:${P(340)};display:flex;flex-direction:column;align-items:center;gap:${P(6)}}
.gl-pat{display:flex;align-items:center;justify-content:center;gap:${P(4)};min-height:${P(40)};padding:${P(4)} ${P(10)};background:#fffaf0;border:3px dashed #e6aa30;border-radius:18px;width:100%}
.gl-pat small{font-weight:700;color:#2f7a4a;margin-right:4px}
.gl-pat span{display:grid;place-items:center;width:${P(30)};height:${P(30)};border-radius:50%}
.gl-pat span.now{background:#ffe3e0;box-shadow:0 0 0 3px #ff8a7a}
.gl-pat img{height:${P(26)};width:auto}
#glStick{position:relative;width:100%;height:${P(64)}}
.gl-rod{position:absolute;left:0;right:${P(12)};top:${P(29)};height:${P(7)};border-radius:4px;background:linear-gradient(#e0b274,#a9743a)}
.gl-tip{position:absolute;right:0;top:${P(27)};border-left:${P(16)} solid #a9743a;border-top:${P(5)} solid transparent;border-bottom:${P(5)} solid transparent}
.gl-slot{position:absolute;top:${P(8)};width:${P(SIZE)};height:${P(SIZE)};display:grid;place-items:center;animation:glpop .3s}
.gl-slot img{width:auto}
@keyframes glpop{50%{transform:scale(1.2)}}
.gl-tray{position:relative;width:${P(224)};height:${P(252)};flex:none}
.gl-tray>img{position:absolute;inset:0;width:100%;height:100%}
.gl-fl{position:absolute;padding:0;border:0;background:none;cursor:pointer;touch-action:manipulation;display:grid;place-items:center;filter:drop-shadow(0 3px 2px rgba(0,0,0,.25))}
.gl-fl img{width:auto;pointer-events:none}
.gl-fl.hint{animation:glglow .8s ease-in-out infinite}
.gl-fl.no{animation:glno .3s}
@keyframes glno{25%{translate:-6px 0}75%{translate:6px 0}}
@keyframes glglow{50%{transform:scale(1.18) rotate(var(--r,0deg));filter:drop-shadow(0 0 8px #ffb300)}}
.gl-fly{position:absolute;width:0;height:0;z-index:10;pointer-events:none}
.gl-fly>img{position:absolute;width:auto}
.gl-hand{position:absolute;width:${P(96)};height:${P(96)};left:${P(-23)};top:${P(-71)};filter:drop-shadow(0 4px 3px rgba(0,0,0,.2))}
.gl-mini{width:100%;text-align:center}
.gl-mini img{height:24px;width:auto;margin:0 -2px;vertical-align:middle}
@media (prefers-reduced-motion:reduce){.gl-fl.hint{outline:3px solid #ffb300;border-radius:50%}}
`;
document.head.append(css);

// สร้างหน้าและปุ่มเมนูเองถ้ายังไม่มี (กรณีถูกลบออกจาก index.html)
if(!$('#garland')){const s=document.createElement('section');s.className='scr';s.id='garland';$('#app').append(s)}
if(!document.querySelector('[data-go="garland"]')){
  const m=document.createElement('button');m.className='menu m3';m.dataset.go='garland';
  m.innerHTML='<span>🌺</span><div><b>ร้อยมาลัย</b><small>ร้อยดอกไม้ตามลาย แล้วนำไปแต่งสวน</small></div>';
  const menu=$('#menu'),back=menu&&menu.querySelector('.btn.w');
  if(menu)back?back.before(m):menu.append(m);
}

let pattern=[],got=[],wrongs=0,busy=false,S=1;
const fit=()=>{const sec=$('#garland');return Math.max(.7,Math.min(1.5,((sec.clientWidth||innerWidth)-32)/340,((sec.clientHeight||innerHeight)-292)/408))};

function build(){
  $('#garland').innerHTML=`<h2>ร้อยมาลัย</h2>
<p class="sub">แตะดอกไม้ในถาด ให้มือหยิบไปเสียบตามลาย</p>
<div id="glStage"><div class="gl-pat" id="glPat"></div><div id="glStick"><i class="gl-rod"></i><b class="gl-tip"></b></div><p class="chip" id="glCount"></p><div class="gl-tray" id="glTray"><img src="fl-tray.webp" alt="ถาดใบตองใส่ดอกไม้"></div></div>
<p class="encourage" id="glMsg" aria-live="polite"></p>
<div class="row"><button class="btn w" data-go="menu">← กลับ</button><button class="btn" id="glAgain" type="button">เริ่มร้อยใหม่</button></div>`;
  $('#glAgain').onclick=glInit;
}
function glInit(){
  build();S=fit();$('#glStage').style.setProperty('--s',S);
  got=[];wrongs=0;busy=false;
  const unit=shuf(KEYS).slice(0,Math.random()<.5?2:3);
  pattern=Array.from({length:N},(_,i)=>unit[i%unit.length]);
  $('#glPat').setAttribute('aria-label','ลาย: '+pattern.map(k=>NAME[k]).join(' '));
  const pile=shuf([...Array(5).fill('marigold'),...Array(5).fill('jasmine'),'rak1','rak2','rak3','rak4']);
  const tray=$('#glTray'),W=224*S,cx=W/2,cy=126*S,R=W*.34;
  pile.forEach((id,i)=>{
    const k=id.startsWith('rak')?'rak':id,v=id.startsWith('rak')?id.slice(3):'1',h=PILE_H[k]*S,bs=h+6*S;
    const a=i*2.39996,r=Math.sqrt((i+.6)/pile.length)*R,rot=(i*67)%360-180;
    const b=document.createElement('button');b.type='button';b.className='gl-fl';b.dataset.k=k;b.dataset.v=v;b.setAttribute('aria-label',NAME[k]);
    b.style.cssText=`width:${bs}px;height:${bs}px;left:${cx+r*Math.cos(a)-bs/2}px;top:${cy+r*Math.sin(a)-bs/2}px;--r:${rot}deg;transform:rotate(${rot}deg)`;
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
  const dx=(kr.left-sr.left)+(6+idx*STEP+SIZE/2)*S-sx,dy=(kr.top-sr.top)+32*S-sy;
  b.style.visibility='hidden';
  const ph=PILE_H[k]*S,sh=STICK_H[k]*S;
  if(!reduce){
    const fly=document.createElement('div');fly.className='gl-fly';fly.style.left=sx+'px';fly.style.top=sy+'px';
    fly.innerHTML=`<img src="${SRC(k,v)}" alt="" style="height:${ph}px;left:-${ph/2}px;top:-${ph/2}px">`+HAND;
    st.append(fly);
    fly.firstChild.animate([{transform:'scale(1)'},{transform:`scale(${sh/ph})`}],{duration:650,fill:'forwards'});
    await fly.animate([{transform:'translate(0,0)'},{transform:`translate(${dx*.5}px,${dy*.5-34*S}px)`},{transform:`translate(${dx}px,${dy}px)`}],{duration:650,easing:'ease-in-out',fill:'forwards'}).finished;
    fly.firstChild.remove();
    stk.animate([{transform:'translateY(0)'},{transform:'translateY(2px)'},{transform:'translateY(0)'}],{duration:180});
    fly.animate([{transform:`translate(${dx}px,${dy}px)`,opacity:1},{transform:`translate(${dx+50*S}px,${dy-40*S}px)`,opacity:0}],{duration:300,fill:'forwards'}).finished.then(()=>fly.remove());
  }
  const s=document.createElement('div');s.className='gl-slot';s.style.left=(6+idx*STEP)*S+'px';
  s.innerHTML=`<img src="${SRC(k,v)}" alt="${NAME[k]}" style="height:${sh}px">`;stk.append(s);
}
function done(){
  $('#glMsg').textContent='มาลัยครบแล้ว! เยี่ยมมากเลย';
  try{const all=JSON.parse(localStorage.getItem(KEY)||'[]');all.push(got.map(g=>SRC(g.k,g.v)));localStorage.setItem(KEY,JSON.stringify(all.slice(-5)))}catch(e){}
  speak('เก่งมาก ร้อยมาลัยสำเร็จแล้ว');
  setTimeout(()=>go('win'),1300);
}
inits.garland=glInit;
// หมุนจอ/ย่อขยายหน้าต่างก่อนเริ่มร้อย: จัดขนาดใหม่ (ไม่ทำถ้าร้อยไปแล้ว)
addEventListener('resize',()=>{const g=$('#garland');if(g.classList.contains('on')&&!got.length&&!busy)glInit()});

})();