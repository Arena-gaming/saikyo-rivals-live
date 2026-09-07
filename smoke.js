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
  // Tuned to the centre of the visible manhole opening in the approved source artwork.
  const SOURCE_X=.674,SOURCE_Y=.790;
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
    emitterX=ox+SOURCE_X*dw;emitterY=oy+SOURCE_Y*dh;
    unit=Math.max(22,Math.min(W,H)*.062);
  }

  function spawn(strength=1){
    const life=7.8+Math.random()*4.8;
    particles.push({
      x:emitterX+(Math.random()-.5)*unit*.26,
      y:emitterY+(Math.random()-.5)*unit*.035,
      vx:(Math.random()-.5)*unit*.075,
      vy:-unit*(.72+Math.random()*.36),
      r:unit*(.12+Math.random()*.17),
      grow:unit*(.28+Math.random()*.28),
      age:0,life,phase:Math.random()*Math.PI*2,
      wobble:.30+Math.random()*.62,
      alpha:(.14+Math.random()*.11)*strength,
      squash:.82+Math.random()*.28
    });
  }

  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.08),fadeOut=Math.max(0,1-Math.max(0,t-.64)/.36);
    const a=p.alpha*fadeIn*fadeOut;
    if(a<=.002)return;
    const radius=p.r+p.grow*t;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,p.squash);
    const g=ctx.createRadialGradient(-radius*.10,-radius*.10,radius*.04,0,0,radius);
    g.addColorStop(0,`rgba(232,239,241,${a})`);
    g.addColorStop(.30,`rgba(215,225,228,${a*.75})`);
    g.addColorStop(.64,`rgba(191,205,211,${a*.31})`);
    g.addColorStop(1,'rgba(178,195,202,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;
    ctx.clearRect(0,0,W,H);

    // Constant output with small natural variation: the manhole should always be visibly bellowing.
    const breathe=.88+Math.sin(now*.00115)*.10+Math.sin(now*.0027+1.8)*.06;
    spawnCarry+=dt*(8.2*breathe);
    while(spawnCarry>=1){spawn(.92+Math.random()*.16);spawnCarry-=1;}

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;
      if(p.age>=p.life||p.y<-unit*4){particles.splice(i,1);continue;}
      const t=p.age/p.life;
      p.vx+=Math.sin(p.age*p.wobble*2+p.phase)*unit*.006*dt;
      // Maintain a strong upward thermal current so the plume clears the hero's head.
      p.vy-=unit*(.025+.018*t)*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      drawPuff(p);
    }
    requestAnimationFrame(frame);
  }

  function seed(){
    // Pre-fill the full plume so it is already rising above the hero on first paint.
    for(let i=0;i<34;i++){
      spawn(.88+Math.random()*.16);
      const p=particles[particles.length-1];
      p.age=Math.random()*p.life*.72;
      p.x+=p.vx*p.age;
      p.y+=p.vy*p.age-unit*.014*p.age*p.age;
    }
  }

  if(photo.complete&&photo.naturalWidth){layout();seed();}
  else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});
  requestAnimationFrame(frame);
})();
