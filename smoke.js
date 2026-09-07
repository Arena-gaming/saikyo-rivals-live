(()=>{
  'use strict';
  const stage=document.querySelector('.right');
  const photo=document.querySelector('.photo');
  if(!stage||!photo)return;
  const canvas=document.createElement('canvas');
  canvas.className='smoke-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7;';
  stage.appendChild(canvas);const ctx=canvas.getContext('2d');if(!ctx)return;
  let W=0,H=0,dpr=1,last=performance.now(),spawnCarry=0;
  const particles=[];
  const OBJ_POS_X=.56,OBJ_POS_Y=.31,IMG_SCALE=1.004;
  const SOURCE_X=.79850,SOURCE_Y=.79000;
  let emitterX=0,emitterY=0,unit=1;
  function layout(){
    const r=stage.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
    const iw=photo.naturalWidth,ih=photo.naturalHeight;if(!iw||!ih)return;
    const scale=Math.max(W/iw,H/ih)*IMG_SCALE,dw=iw*scale,dh=ih*scale,ox=(W-dw)*OBJ_POS_X,oy=(H-dh)*OBJ_POS_Y;
    emitterX=ox+SOURCE_X*dw;emitterY=oy+SOURCE_Y*dh;unit=Math.max(30,Math.min(W,H)*.086);
  }
  function spawn(strength=1){
    const life=11.8+Math.random()*6.2;
    const kind=Math.random()<.68?'body':Math.random()<.72?'haze':'wisp';
    const base=kind==='body'?.20:kind==='haze'?.27:.10;
    particles.push({
      kind,x:emitterX+(Math.random()-.5)*unit*.58,y:emitterY+(Math.random()-.5)*unit*.035,
      vx:(Math.random()-.5)*unit*(kind==='wisp'?.22:.15),vy:-unit*(kind==='haze'?.68+Math.random()*.30:.78+Math.random()*.38),
      r:unit*(base+Math.random()*(kind==='wisp'?.13:.22)),grow:unit*(kind==='haze'?.72+Math.random()*.52:.48+Math.random()*.48),
      age:0,life,phase:Math.random()*6.283,phase2:Math.random()*6.283,wobble:.22+Math.random()*.62,
      alpha:(kind==='body'?.23+Math.random()*.15:kind==='haze'?.08+Math.random()*.09:.10+Math.random()*.10)*strength,
      squash:.82+Math.random()*.34,lean:(Math.random()-.5)*.20,
      lobe1:.26+Math.random()*.18,lobe2:.20+Math.random()*.18,lobe3:.15+Math.random()*.17,
      off1:(Math.random()-.5)*.42,off2:(Math.random()-.5)*.52,off3:(Math.random()-.5)*.62
    });
  }
  function cloud(x,y,r,a,squash,tone){
    if(a<=.001)return;
    ctx.save();ctx.translate(x,y);ctx.scale(1,squash);
    const g=ctx.createRadialGradient(-r*.12,-r*.13,r*.025,0,0,r);
    if(tone==='haze'){
      g.addColorStop(0,`rgba(213,215,218,${a*.72})`);g.addColorStop(.32,`rgba(186,190,195,${a*.55})`);g.addColorStop(.68,`rgba(145,151,158,${a*.18})`);g.addColorStop(1,'rgba(118,126,136,0)');
    }else{
      g.addColorStop(0,`rgba(220,222,224,${a})`);g.addColorStop(.20,`rgba(191,195,199,${a*.90})`);g.addColorStop(.48,`rgba(151,157,164,${a*.56})`);g.addColorStop(.75,`rgba(112,120,130,${a*.20})`);g.addColorStop(1,'rgba(88,98,109,0)');
    }
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.fill();ctx.restore();
  }
  function drawPuff(p){
    const t=p.age/p.life,fadeIn=Math.min(1,t/.055),fadeOut=Math.max(0,1-Math.max(0,t-.70)/.30),a=p.alpha*fadeIn*fadeOut*(1-t*.18);if(a<=.002)return;
    const radius=p.r+p.grow*(1-Math.pow(1-t,1.28));
    const curl=Math.sin(p.phase+p.age*.34)*radius*.12;
    cloud(p.x,p.y,radius,a,p.squash,p.kind==='haze'?'haze':'body');
    // Fixed irregular lobes give each puff a textured, non-circular silhouette without frame-to-frame jitter.
    cloud(p.x+radius*p.off1+curl,p.y-radius*.10,radius*p.lobe1,a*.52,p.squash*.92,p.kind==='haze'?'haze':'body');
    cloud(p.x+radius*p.off2-curl*.6,p.y+radius*.08,radius*p.lobe2,a*.38,p.squash*1.08,p.kind==='haze'?'haze':'body');
    cloud(p.x+radius*p.off3+curl*.35,p.y-radius*.22,radius*p.lobe3,a*.28,p.squash*.86,'haze');
    if(p.kind==='wisp'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.lean+Math.sin(p.phase2+p.age*.27)*.16);ctx.strokeStyle=`rgba(166,171,178,${a*.32})`;ctx.lineWidth=Math.max(.45,radius*.025);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,radius*.18);ctx.bezierCurveTo(radius*.38,-radius*.10,-radius*.48,-radius*.52,radius*.24,-radius*1.08);ctx.stroke();ctx.restore();
    }
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,W,H);
    // Natural uneven output: a continuous plume with small density fluctuations rather than uniform puffs.
    const breathe=.96+Math.sin(now*.00073)*.10+Math.sin(now*.00167+1.7)*.055+Math.sin(now*.0031+4.1)*.025;
    spawnCarry+=dt*(19.2*breathe);
    while(spawnCarry>=1){spawn(.96+Math.random()*.16);spawnCarry-=1;if(Math.random()<.07)spawn(.65+Math.random()*.20);}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life||p.y<-unit*7){particles.splice(i,1);continue;}
      const t=p.age/p.life;
      const curl1=Math.sin(p.age*p.wobble*1.65+p.phase),curl2=Math.sin(p.age*.47+p.phase2+t*7.1);
      p.vx+=(curl1*.70+curl2*.30)*unit*(.0065+.006*t)*dt;p.vx*=Math.pow(.997,dt*60);
      p.vy-=unit*(.017+.015*t)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;drawPuff(p);}
    requestAnimationFrame(frame);
  }
  function seed(){for(let i=0;i<110;i++){spawn(.92+Math.random()*.15);const p=particles[particles.length-1];p.age=Math.random()*p.life*.76;p.x+=p.vx*p.age;p.y+=p.vy*p.age-unit*.010*p.age*p.age;}}
  if(photo.complete&&photo.naturalWidth){layout();seed();}else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});requestAnimationFrame(frame);
})();
