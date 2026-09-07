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
  // Centre of the manhole opening in the approved artwork: clearly right of the hero and near the bottom of frame.
  const SOURCE_X=.700,SOURCE_Y=.842;
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
    unit=Math.max(28,Math.min(W,H)*.082);
  }

  function spawn(strength=1){
    const life=10.5+Math.random()*5.5;
    particles.push({
      x:emitterX+(Math.random()-.5)*unit*.58,
      y:emitterY+(Math.random()-.5)*unit*.035,
      vx:(Math.random()-.5)*unit*.16,
      vy:-unit*(.86+Math.random()*.42),
      r:unit*(.20+Math.random()*.24),
      grow:unit*(.44+Math.random()*.42),
      age:0,life,phase:Math.random()*Math.PI*2,
      wobble:.25+Math.random()*.58,
      alpha:(.23+Math.random()*.15)*strength,
      squash:.88+Math.random()*.22
    });
  }

  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.055),fadeOut=Math.max(0,1-Math.max(0,t-.76)/.24);
    const a=p.alpha*fadeIn*fadeOut;
    if(a<=.002)return;
    const radius=p.r+p.grow*t;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,p.squash);
    const g=ctx.createRadialGradient(-radius*.09,-radius*.10,radius*.03,0,0,radius);
    g.addColorStop(0,`rgba(236,242,243,${a})`);
    g.addColorStop(.25,`rgba(220,230,232,${a*.86})`);
    g.addColorStop(.58,`rgba(197,211,216,${a*.44})`);
    g.addColorStop(1,'rgba(181,199,205,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;
    ctx.clearRect(0,0,W,H);
    // Constant dense output: no gaps, only slight natural variation in volume.
    const breathe=.98+Math.sin(now*.0009)*.055+Math.sin(now*.0021+1.4)*.035;
    spawnCarry+=dt*(15.5*breathe);
    while(spawnCarry>=1){spawn(.98+Math.random()*.16);spawnCarry-=1;}

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;
      if(p.age>=p.life||p.y<-unit*6){particles.splice(i,1);continue;}
      const t=p.age/p.life;
      p.vx+=Math.sin(p.age*p.wobble*2+p.phase)*unit*.008*dt;
      p.vy-=unit*(.034+.022*t)*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      drawPuff(p);
    }
    requestAnimationFrame(frame);
  }

  function seed(){
    // Start with a fully established plume from the manhole to above the hero's head.
    for(let i=0;i<76;i++){
      spawn(.96+Math.random()*.14);
      const p=particles[particles.length-1];
      p.age=Math.random()*p.life*.82;
      p.x+=p.vx*p.age;
      p.y+=p.vy*p.age-unit*.019*p.age*p.age;
    }
  }

  if(photo.complete&&photo.naturalWidth){layout();seed();}
  else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});
  requestAnimationFrame(frame);
})();
