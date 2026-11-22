/* ลุ้นเลขมงคล แบบเครื่องหมุนสลาก — เพิ่มใน index.html ก่อน </body> หลังสคริปต์หลัก: <script src="lottery.js"></script>
   แทนที่ฉากเครื่องลูกบอลเดิมในหน้า #lottery: แตะคันโยก -> ลูกบอลกลิ้งจริง -> ลูกบอลพุ่งออกมาตกบนแผ่นไม้
   ใช้ตัวแปรกลางของเกม: $, inits, ding, ensureAudio, audioContext, soundEnabled, playLotteryRollSound, lotteryFortunes */
(()=>{
if(window.__ltLoaded)return;window.__ltLoaded=true;
const IW=1296,IH=1213;                                   // ขนาดภาพต้นฉบับ (พิกัดทั้งหมดอิงภาพนี้)
const GL={cx:609.3,cy:509.2,rx:432.3,ry:367.7};          // วงรีด้านในลูกโหลแก้ว
const BOX={cx:609.3,cy:510,R:366},BR=72;                 // วงกลมที่ลูกบอลกลิ้ง / รัศมีลูกบอล
const HUB={x:1125,y:516},ARM_R=225;                      // แกนคันโยก / ความยาวแขน
const FLOOR_Y=1018;                                      // แผ่นไม้ด้านหน้าที่ลูกบอลตกลงมา
const G=2700,E_WALL=.42,E_BALL=.55,DT=1/120;
const COLORS=['#f7a8c0','#9fc5f4','#aedb94','#f8d37f','#cdb7ee','#92dcc8'];
const PETAL=['#ffb7c9','#ffd86e','#b8dcff','#ffd1a1'];
const SPIN_MS=2900;

const css=document.createElement('style');
const pc=(n,d)=>(n/d*100)+'%';
css.textContent=`
.lottery-scene{height:auto!important;padding:12px 8px 8px;display:grid;place-items:center}
.lottery-scene::before,.lottery-scene::after{display:none!important}
.lt-m{position:relative;width:min(100%,460px);aspect-ratio:${IW}/${IH}}
.lt-m>*{position:absolute;display:block;margin:0}
.lt-c,.lt-frame{inset:0;width:100%;height:100%;pointer-events:none}
.lt-arm{left:${pc(1092,IW)};top:${pc(548,IH)};width:${pc(49,IW)};height:${pc(242,IH)};transform-origin:${(HUB.x-1092)/49*100}% ${(HUB.y-548)/242*100}%;pointer-events:none}
.lt-handle{left:${pc(1138,IW)};top:${pc(670,IH)};width:${pc(158,IW)};height:${pc(135,IH)};transform-origin:0 50%;pointer-events:none}
.lt-crank{left:${pc(1030,IW)};top:${pc(600,IH)};width:${pc(266,IW)};height:${pc(260,IH)};padding:0;border:0;background:none;cursor:pointer;border-radius:46%;touch-action:manipulation}
.lt-crank span{position:absolute;inset:6%;border:4px dashed #ff8a7a;border-radius:46%;animation:ltpulse 1.4s ease-in-out infinite}
.lt-crank.busy{cursor:default}.lt-crank.busy span{display:none}
@keyframes ltpulse{50%{transform:scale(1.08);opacity:.5}}
@media (prefers-reduced-motion:reduce){.lt-crank span{animation:none}}
`;
document.head.append(css);

const scene=document.querySelector('#lottery .lottery-scene');
if(!scene){console.warn('lottery.js: ไม่พบ .lottery-scene');return}
scene.innerHTML=`<div class="lt-m" id="lotteryMachine" role="group" aria-label="เครื่องหมุนลูกบอลลุ้นเลขมงคล">
<canvas class="lt-c" id="ltBack"></canvas>
<img class="lt-arm" id="ltArm" src="lt-arm.webp" alt="">
<img class="lt-handle" id="ltHandle" src="lt-handle.webp" alt="">
<img class="lt-frame" src="lt-frame.webp" alt="เครื่องหมุนลูกบอล">
<canvas class="lt-c" id="ltFront"></canvas>
<button class="lt-crank" id="ltCrank" type="button" aria-label="แตะที่คันโยกเพื่อหมุนลุ้นเลข"><span></span></button>
</div>`;
const M=$('#lotteryMachine'),cb=$('#ltBack'),cf=$('#ltFront'),xb=cb.getContext('2d'),xf=cf.getContext('2d'),arm=$('#ltArm'),handle=$('#ltHandle'),crank=$('#ltCrank');

// ---------- ลูกบอล ----------
let balls=[],ex=null,phase='idle',tStart=0,tPhase=0,winner=0,spin=0,crankS=0,theta=0,lastQuarter=0,raf=0,last=0,running=false;
const rnd=(a,b)=>a+Math.random()*(b-a);
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;const f=v=>Math.max(0,Math.min(255,Math.round(amt<0?v*(1+amt):v+(255-v)*amt)));return `rgb(${f(r)},${f(g)},${f(b)})`}
function makeBall(n,x,y){return{n,x,y,vx:rnd(-80,80),vy:rnd(-40,40),a:rnd(0,6.28),va:0,c:COLORS[(n-1)%COLORS.length],f:PETAL[n%PETAL.length]}}
function resetBalls(){
  balls=[];ex=null;
  for(let i=1;i<=16;i++){const a=rnd(0,6.28),d=Math.sqrt(Math.random())*(BOX.R-BR);balls.push(makeBall(i,BOX.cx+Math.cos(a)*d,BOX.cy+Math.sin(a)*d*.8))}
  for(let i=0;i<260;i++)step(0)
}
function step(s){
  const {cx,cy,R}=BOX;
  for(const b of balls){
    b.vy+=G*DT;
    const dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy)||1;
    if(s>0){const k=2300*s*(d/R);b.vx+=(-dy/d)*k*DT;b.vy+=(dx/d)*k*DT;b.vx+=rnd(-1,1)*1700*s*DT;b.vy+=rnd(-1,1)*1700*s*DT;if(dy>0)b.vy-=2900*s*DT*Math.random()*(dy/R)}
    const sp=Math.hypot(b.vx,b.vy);if(sp>2000){b.vx*=2000/sp;b.vy*=2000/sp}
    b.vx*=.9988;b.vy*=.9988;
    b.x+=b.vx*DT;b.y+=b.vy*DT;
    b.va+=((b.vx/BR)*.55-b.va)*.08;b.a+=b.va*DT*6;
  }
  if(winner&&phase==='draw'){const w=balls.find(b=>b.n===winner);if(w){const tx=cx,ty=cy+R-BR*.6;w.vx+=(tx-w.x)*18*DT;w.vy+=(ty-w.y)*14*DT;w.vx*=.97;w.vy*=.97}}
  for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
    const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=BR*2;
    if(d>0&&d<m){const nx=dx/d,ny=dy/d,o=(m-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;
      const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(vn<0){const j2=-(1+E_BALL)*vn/2;a.vx-=j2*nx;a.vy-=j2*ny;b.vx+=j2*nx;b.vy+=j2*ny}}
  }
  for(const b of balls){
    const dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy),lim=R-BR;
    if(d>lim){const nx=dx/d,ny=dy/d;b.x=cx+nx*lim;b.y=cy+ny*lim;const vn=b.vx*nx+b.vy*ny;
      if(vn>0){b.vx-=(1+E_WALL)*vn*nx;b.vy-=(1+E_WALL)*vn*ny}
      if(s>0){b.vx+=(-ny)*3600*s*DT;b.vy+=(nx)*3600*s*DT}
    }
  }
}

// ---------- วาด ----------
function drawBall(c,b,sc,glow){
  const r=BR;c.save();c.translate(b.x,b.y);c.scale(sc,sc);
  if(glow){c.shadowColor='rgba(255,213,90,.95)';c.shadowBlur=38}
  const g=c.createRadialGradient(-r*.3,-r*.35,r*.1,0,0,r);
  g.addColorStop(0,'#fff');g.addColorStop(.22,shade(b.c,.55));g.addColorStop(.8,b.c);g.addColorStop(1,shade(b.c,-.18));
  c.beginPath();c.arc(0,0,r,0,6.2832);c.fillStyle=g;c.fill();c.shadowBlur=0;
  c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.9)';c.stroke();
  c.rotate(b.a);
  c.beginPath();c.arc(0,0,r*.57,0,6.2832);c.fillStyle='#fffaf0';c.fill();
  c.fillStyle='#4a3d45';c.font=`700 ${r*.64}px Mali,"Noto Sans Thai",sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(String(b.n),0,r*.04);
  const px=Math.cos(1.0)*r*.72,py=Math.sin(1.0)*r*.72;c.fillStyle=b.f;
  for(let i=0;i<5;i++){const a=i*1.2566;c.beginPath();c.arc(px+Math.cos(a)*r*.085,py+Math.sin(a)*r*.085,r*.07,0,6.2832);c.fill()}
  c.beginPath();c.arc(px,py,r*.05,0,6.2832);c.fillStyle='#ffe58a';c.fill();
  c.rotate(-b.a);
  c.beginPath();c.ellipse(-r*.36,-r*.42,r*.22,r*.12,-.6,0,6.2832);c.fillStyle='rgba(255,255,255,.75)';c.fill();
  c.restore();
}
function draw(){
  const kb=cb.width/IW,kf=cf.width/IW;
  xb.setTransform(1,0,0,1,0,0);xb.clearRect(0,0,cb.width,cb.height);xb.setTransform(kb,0,0,kb,0,0);
  xb.save();xb.beginPath();xb.ellipse(GL.cx,GL.cy,GL.rx,GL.ry,0,0,6.2832);xb.clip();
  const gg=xb.createRadialGradient(GL.cx-130,GL.cy-170,40,GL.cx,GL.cy,GL.rx);
  gg.addColorStop(0,'rgba(255,255,255,.55)');gg.addColorStop(.55,'rgba(226,244,252,.30)');gg.addColorStop(1,'rgba(165,212,232,.42)');
  xb.fillStyle=gg;xb.fillRect(0,0,IW,IH);
  for(const b of balls)drawBall(xb,b,1,false);
  xb.beginPath();xb.ellipse(GL.cx,GL.cy,GL.rx-34,GL.ry-34,0,Math.PI*1.06,Math.PI*1.46);xb.strokeStyle='rgba(255,255,255,.55)';xb.lineWidth=24;xb.lineCap='round';xb.stroke();
  xb.restore();
  xf.setTransform(1,0,0,1,0,0);xf.clearRect(0,0,cf.width,cf.height);xf.setTransform(kf,0,0,kf,0,0);
  if(ex)drawBall(xf,ex,ex.sc,ex.glow);
}

// ---------- เสียง ----------
function whoosh(){
  if(typeof soundEnabled==='undefined'||!soundEnabled)return;ensureAudio();if(!audioContext)return;
  const c=audioContext,len=Math.floor(c.sampleRate*.5),buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
  const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;
  s.buffer=buf;f.type='bandpass';f.Q.value=2.2;f.frequency.setValueAtTime(500,t);f.frequency.exponentialRampToValueAtTime(3200,t+.4);
  g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.5);s.connect(f);f.connect(g);g.connect(c.destination);s.start(t);
}
function tick(){
  if(typeof soundEnabled==='undefined'||!soundEnabled)return;ensureAudio();if(!audioContext)return;
  const c=audioContext,o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type='square';o.frequency.value=180;g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.001,t+.05);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.06);
}
function thud(){
  if(typeof soundEnabled==='undefined'||!soundEnabled)return;ensureAudio();if(!audioContext)return;
  const c=audioContext,o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type='sine';o.frequency.setValueAtTime(160,t);o.frequency.exponentialRampToValueAtTime(70,t+.12);g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.18);
}

// ---------- ขั้นตอนลุ้น ----------
const startBtn=$('#lotteryStart'),status=$('#lotteryStatus');
function setPhase(p){phase=p;tPhase=performance.now()}
function startSpin(){
  if(phase!=='idle'&&phase!=='result')return;
  if(ex&&phase==='result'){balls.push(makeBall(ex.n,BOX.cx+rnd(-60,60),BOX.cy-BOX.R+BR+10));ex=null}
  winner=Math.floor(Math.random()*16)+1;
  startBtn.disabled=true;crank.classList.add('busy');
  $('#lotteryResult').hidden=true;
  status.textContent='หมุนคันโยกแล้ว ลูกบอลกำลังกลิ้ง ลุ้นไปด้วยกันนะ';
  if(typeof playLotteryRollSound==='function')playLotteryRollSound();
  setPhase('spin');
}
function finish(){
  const n=ex.n;
  $('#lotteryNumber').textContent=n;
  $('#lotteryFortune').textContent=(typeof lotteryFortunes!=='undefined'&&lotteryFortunes[n-1])||'';
  $('#lotteryResult').hidden=false;
  status.textContent='ได้เลข '+n+' แล้ว ขอให้เป็นวันที่ดีนะ';
  startBtn.disabled=false;crank.classList.remove('busy');
  if(typeof ding==='function')ding();
  setPhase('result');
}
function update(dt){
  const now=performance.now(),tp=now-tPhase;
  // ความแรงของการหมุน
  let target=0;
  if(phase==='spin')target=Math.min(1,tp/500);
  else if(phase==='draw')target=Math.max(.3,1-tp/700);
  spin+=(target-spin)*Math.min(1,dt*7);
  const ct=(phase==='spin')?1:(phase==='draw'?Math.max(0,1-tp/500):0);
  crankS+=(ct-crankS)*Math.min(1,dt*9);
  if(phase==='spin'&&tp>SPIN_MS)setPhase('draw');
  if(phase==='draw'){
    const w=balls.find(b=>b.n===winner),E={x:BOX.cx,y:BOX.cy+BOX.R-BR*.6};
    if(w&&(Math.hypot(w.x-E.x,w.y-E.y)<BR*.75||tp>2600)){
      if(Math.hypot(w.x-E.x,w.y-E.y)>=BR*.75){w.x=E.x+rnd(-24,24);w.y=E.y}
      balls=balls.filter(b=>b!==w);
      ex={n:w.n,x:w.x,y:w.y,vx:rnd(-60,60),vy:900,a:w.a,va:rnd(-6,6),c:w.c,f:w.f,sc:1,glow:false,bounces:0,done:false};
      whoosh();setPhase('out');
    }
  }
  const steps=Math.max(1,Math.round(dt/DT));
  for(let i=0;i<steps;i++)step(spin);
  if(phase==='out'&&ex&&!ex.done){
    for(let i=0;i<steps;i++){
      ex.vy+=G*DT;ex.x+=ex.vx*DT;ex.y+=ex.vy*DT;ex.a+=ex.va*DT;
      if(ex.y>=FLOOR_Y){
        ex.y=FLOOR_Y;
        if(Math.abs(ex.vy)>260&&ex.bounces<3){ex.vy=-ex.vy*.38;ex.vx*=.6;ex.va*=.6;ex.bounces++;thud()}
        else{ex.vy=0;ex.done=true;ex.glow=true;ex.t0=now;ex.vx=0;ex.va=0;break}
      }
    }
  }
  if(ex&&ex.done){ex.sc=1+.45*Math.min(1,(now-ex.t0)/400);if(phase==='out'&&now-ex.t0>500)finish()}
  // คันโยก
  theta+=Math.PI*2*1.3*crankS*dt;
  if(crankS<.02){const tgt=Math.round(theta/(Math.PI*2))*Math.PI*2;theta+=(tgt-theta)*(1-Math.exp(-dt*10))}
  const q=Math.floor(theta/(Math.PI/2));if(q!==lastQuarter&&crankS>.3){tick()}lastQuarter=q;
  const k=M.clientWidth/IW,c=Math.cos(theta),sn=Math.sin(theta);
  arm.style.transform=`scaleY(${c})`;
  handle.style.transform=`translateY(${ARM_R*(c-1)*k}px) scale(${1+.1*sn})`;
}
function resize(){
  const dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.round(M.clientWidth*dpr)),h=Math.max(1,Math.round(M.clientHeight*dpr));
  for(const c of[cb,cf])if(c.width!==w||c.height!==h){c.width=w;c.height=h}
}
function loop(t){
  if(!running)return;
  const sec=$('#lottery');
  if(!sec||!sec.classList.contains('on')||document.hidden){running=false;phase='idle';spin=0;crankS=0;startBtn.disabled=false;crank.classList.remove('busy');return}
  const dt=Math.min(.05,(t-last)/1000||.016);last=t;
  update(dt);draw();raf=requestAnimationFrame(loop);
}
function initL(){
  resize();resetBalls();phase='idle';spin=0;crankS=0;theta=0;lastQuarter=0;winner=0;
  $('#lotteryResult').hidden=true;startBtn.disabled=false;crank.classList.remove('busy');
  status.textContent='พร้อมแล้ว แตะที่คันโยกด้านขวา หรือกดปุ่ม "เริ่มลุ้น" ได้เลย';
  if(!running){running=true;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
}
if('ResizeObserver' in window)new ResizeObserver(resize).observe(M);else addEventListener('resize',resize);
crank.onclick=startSpin;startBtn.onclick=startSpin;
inits.lottery=initL;
})();