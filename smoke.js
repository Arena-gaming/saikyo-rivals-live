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
  let plume=0,nextPulse=.8+Math.random()*1.8,pulseLeft=0;
  const particles=[];
  const OBJ_POS_X=.56,OBJ_POS_Y=.31,IMG_SCALE=1.004;
  // Source-image fractions keep the emitter locked to the painted manhole without altering the artwork/layout.
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

  function spawn(strength=1){
    const life=4.4+Math.random()*3.6;
    particles.push({
      x:emitterX+(Math.random()-.5)*unit*.32,
      y:emitterY+(Math.random()-.5)*unit*.06,
      vx:(Math.random()-.5)*unit*.085,
      vy:-unit*(.20+Math.random()*.18),
      r:unit*(.15+Math.random()*.19),
      grow:unit*(.15+Math.random()*.20),
      age:0,life,phase:Math.random()*Math.PI*2,
      wobble:.38+Math.random()*.75,
      alpha:(.105+Math.random()*.105)*strength,
      squash:.78+Math.random()*.34
    });
  }

  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.14),fadeOut=Math.max(0,1-Math.max(0,t-.43)/.57);
    const a=p.alpha*fadeIn*fadeOut;
    if(a<=.002)return;
    const radius=p.r+p.grow*t;
    ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,p.squash);
    const g=ctx.createRadialGradient(-radius*.10,-radius*.10,radius*.04,0,0,radius);
    g.addColorStop(0,`rgba(229,237,239,${a})`);
    g.addColorStop(.30,`rgba(211,222,226,${a*.72})`);
    g.addColorStop(.64,`rgba(188,203,209,${a*.28})`);
    g.addColorStop(1,'rgba(175,194,201,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;
    ctx.clearRect(0,0,W,H);

    nextPulse-=dt;
    if(nextPulse<=0&&pulseLeft<=0){
      pulseLeft=1.5+Math.random()*2.4;
      plume=.72+Math.random()*.38;
      nextPulse=5.5+Math.random()*6.5;
    }
    if(pulseLeft>0){
      pulseLeft-=dt;
      spawnCarry+=dt*(3.3+plume*2.4);
    }else{
      spawnCarry+=dt*.7;
      plume=Math.max(.55,plume-dt*.08);
    }
    while(spawnCarry>=1){spawn(plume||.65);spawnCarry-=1;}

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;
      if(p.age>=p.life){particles.splice(i,1);continue;}
      p.vx+=Math.sin(p.age*p.wobble*2+p.phase)*unit*.0045*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy-=unit*.012*dt;
      drawPuff(p);
    }
    requestAnimationFrame(frame);
  }
  if(photo.complete&&photo.naturalWidth)layout();else photo.addEventListener('load',layout,{once:true});
  window.addEventListener('resize',layout,{passive:true});
  for(let i=0;i<7;i++){spawn(.62+Math.random()*.18);particles[i].age=Math.random()*particles[i].life*.58;}
  requestAnimationFrame(frame);
})();