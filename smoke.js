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
  // Re-tuned from the supplied reference: centre of the visible manhole is right of the hero and close to the bottom of frame.
  const SOURCE_X=.665,SOURCE_Y=.855;
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
    unit=Math.max(26,Math.min(W,H)*.075);
  }

  function spawn(strength=1){
    const life=9.2+Math.random()*5.2;
    particles.push({
      x:emitterX+(Math.random()-.5)*unit*.50,
      y:emitterY+(Math.random()-.5)*unit*.045,
      vx:(Math.random()-.5)*unit*.13,
      vy:-unit*(.78+Math.random()*.40),
      r:unit*(.18+Math.random()*.22),
      grow:unit*(.38+Math.random()*.38),
      age:0,life,phase:Math.random()*Math.PI*2,
      wobble:.28+Math.random()*.62,
      alpha:(.20+Math.random()*.14)*strength,
      squash:.84+Math.random()*.26
    });
  }

  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.065),fadeOut=Math.max(0,1-Math.max(0,t-.72)/.28);
    const a=p.alpha*fadeIn*fadeOut;
    if(a<=.002)return;
    const radius=p.r+p.grow*t;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,p.squash);
    const g=ctx.createRadialGradient(-radius*.10,-radius*.10,radius*.035,0,0,radius);
    g.addColorStop(0,`rgba(235,241,242,${a})`);
    g.addColorStop(.27,`rgba(219,228,231,${a*.82})`);
    g.addColorStop(.60,`rgba(195,209,214,${a*.39})`);
    g.addColorStop(1,'rgba(180,198,204,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;
    ctx.clearRect(0,0,W,H);
    // Continuous heavy bellowing, with only subtle breathing so the column never disappears.
    const breathe=.96+Math.sin(now*.00105)*.07+Math.sin(now*.00235+1.8)*.04;
    spawnCarry+=dt*(12.4*breathe);
    while(spawnCarry>=1){spawn(.96+Math.random()*.18);spawnCarry-=1;}

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;
      if(p.age>=p.life||p.y<-unit*5){particles.splice(i,1);continue;}
      const t=p.age/p.life;
      p.vx+=Math.sin(p.age*p.wobble*2+p.phase)*unit*.0075*dt;
      p.vy-=unit*(.030+.020*t)*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      drawPuff(p);
    }
    requestAnimationFrame(frame);
  }

  function seed(){
    for(let i=0;i<58;i++){
      spawn(.94+Math.random()*.16);
      const p=particles[particles.length-1];
      p.age=Math.random()*p.life*.78;
      p.x+=p.vx*p.age;
      p.y+=p.vy*p.age-unit*.017*p.age*p.age;
    }
  }

  if(photo.complete&&photo.naturalWidth){layout();seed();}
  else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});
  requestAnimationFrame(frame);
})();
