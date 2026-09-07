(()=>{
  'use strict';
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const stage=document.querySelector('.right');
  const photo=document.querySelector('.photo');
  if(!stage||!photo)return;

  const canvas=document.createElement('canvas');
  canvas.className='smoke-canvas';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7;';
  stage.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx)return;

  let W=0,H=0,dpr=1,last=performance.now(),spawnCarry=0;
  const particles=[];
  const OBJ_POS_X=.56,OBJ_POS_Y=.31,IMG_SCALE=1.004;
  // Emitter coordinates are source-image fractions and are deliberately isolated here for visual tuning.
  const SOURCE_X=.641,SOURCE_Y=.735;
  let emitterX=0,emitterY=0,unit=1;

  function layout(){
    const r=stage.getBoundingClientRect();
    W=r.width;H=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const iw=photo.naturalWidth,ih=photo.naturalHeight;
    if(!iw||!ih)return;
    const scale=Math.max(W/iw,H/ih)*IMG_SCALE,dw=iw*scale,dh=ih*scale;
    const ox=(W-dw)*OBJ_POS_X,oy=(H-dh)*OBJ_POS_Y;
    emitterX=ox+SOURCE_X*dw;emitterY=oy+SOURCE_Y*dh;unit=Math.max(18,Math.min(W,H)*.055);
  }

  function spawn(){
    const life=3.8+Math.random()*3.4;
    particles.push({
      x:emitterX+(Math.random()-.5)*unit*.38,
      y:emitterY+(Math.random()-.5)*unit*.08,
      vx:(Math.random()-.5)*unit*.12,
      vy:-unit*(.24+Math.random()*.22),
      r:unit*(.18+Math.random()*.22),
      grow:unit*(.13+Math.random()*.17),
      age:0,life,phase:Math.random()*Math.PI*2,
      wobble:.45+Math.random()*.9,
      alpha:.13+Math.random()*.12,
      squash:.72+Math.random()*.42
    });
  }

  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.12),fadeOut=Math.max(0,1-Math.max(0,t-.48)/.52);
    const a=p.alpha*fadeIn*fadeOut;
    if(a<=.002)return;
    const radius=p.r+p.grow*t;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,p.squash);
    const g=ctx.createRadialGradient(-radius*.12,-radius*.08,radius*.05,0,0,radius);
    g.addColorStop(0,`rgba(232,239,241,${a})`);
    g.addColorStop(.28,`rgba(216,226,230,${a*.78})`);
    g.addColorStop(.62,`rgba(194,208,214,${a*.34})`);
    g.addColorStop(1,'rgba(180,198,205,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;
    ctx.clearRect(0,0,W,H);
    spawnCarry+=dt*5.2;
    while(spawnCarry>=1){spawn();spawnCarry-=1;}
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;
      if(p.age>=p.life){particles.splice(i,1);continue;}
      p.vx+=Math.sin(p.age*p.wobble*2+p.phase)*unit*.006*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=unit*.018*dt;
      drawPuff(p);
    }
    requestAnimationFrame(frame);
  }
  if(photo.complete&&photo.naturalWidth)layout();else photo.addEventListener('load',layout,{once:true});
  window.addEventListener('resize',layout,{passive:true});
  for(let i=0;i<12;i++){spawn();particles[i].age=Math.random()*particles[i].life*.65;}
  requestAnimationFrame(frame);
})();