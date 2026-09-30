(()=>{
  'use strict';

  const liveStage=document.querySelector('.right');
  const livePhoto=document.querySelector('.photo');
  const appStage=document.querySelector('.neo-world--home');
  const appPhoto=appStage&&appStage.querySelector('.neo-world__image');
  const stage=liveStage||appStage;
  const photo=livePhoto||appPhoto;

  if(!stage||!photo||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  const canvas=document.createElement('canvas');
  canvas.className='smoke-canvas';
  canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7;';
  stage.appendChild(canvas);

  const ctx=canvas.getContext('2d');
  if(!ctx)return;

  // Anchor to the actual street vent in the approved hero image.
  const SOURCE_X=.868;
  const SOURCE_Y=.821;

  let W=0,H=0,dpr=1,emitterX=0,emitterY=0,unit=1;
  let last=performance.now(),spawnCarry=0;
  const particles=[];

  function parseObjectPosition(){
    const raw=getComputedStyle(photo).objectPosition.trim().split(/\s+/);
    const parse=(v,fallback)=>{
      if(!v)return fallback;
      if(v.endsWith('%'))return parseFloat(v)/100;
      if(v==='left'||v==='top')return 0;
      if(v==='center')return .5;
      if(v==='right'||v==='bottom')return 1;
      return fallback;
    };
    return [parse(raw[0],.5),parse(raw[1],.5)];
  }

  function layout(){
    const r=stage.getBoundingClientRect();
    W=r.width; H=r.height;
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(W*dpr));
    canvas.height=Math.max(1,Math.round(H*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const iw=photo.naturalWidth,ih=photo.naturalHeight;
    if(!iw||!ih)return;

    const scale=Math.max(W/iw,H/ih);
    const dw=iw*scale,dh=ih*scale;
    const [px,py]=parseObjectPosition();
    const ox=(W-dw)*px;
    const oy=(H-dh)*py;

    emitterX=ox+SOURCE_X*dw;
    emitterY=oy+SOURCE_Y*dh;
    unit=Math.max(24,Math.min(W,H)*.05);
  }

  function spawn(){
    if(particles.length>42)return;

    const life=3.6+Math.random()*2.6;
    const small=Math.random()<.70;

    particles.push({
      x:emitterX+(Math.random()-.5)*unit*.22,
      y:emitterY+(Math.random()-.5)*unit*.02,

      // Match the static plume: strong leftward push, modest rise.
      vx:-unit*(.11+Math.random()*.12),
      vy:-unit*(.22+Math.random()*.14),

      r:unit*(small?.07+Math.random()*.04:.10+Math.random()*.05),
      grow:unit*(small?.15+Math.random()*.08:.20+Math.random()*.12),

      age:0,
      life,
      phase:Math.random()*Math.PI*2,
      wobble:.7+Math.random()*.7,
      alpha:small?.09+Math.random()*.04:.06+Math.random()*.035,
      squash:.8+Math.random()*.25
    });
  }

  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.10);
    const fadeOut=Math.max(0,1-Math.max(0,t-.48)/.52);
    const a=p.alpha*fadeIn*fadeOut;
    if(a<.002)return;

    const r=p.r+p.grow*(1-Math.pow(1-t,1.45));
    const stretchX=1.25+.9*t;
    const squashY=p.squash*(.92-Math.min(t*.15,.12));
    const curl=Math.sin(p.phase+p.age*p.wobble)*r*.22;

    ctx.save();
    ctx.translate(p.x+curl,p.y);
    ctx.scale(stretchX,squashY);

    const g=ctx.createRadialGradient(-r*.10,-r*.10,r*.03,0,0,r);
    g.addColorStop(0,`rgba(232,237,240,${a})`);
    g.addColorStop(.24,`rgba(210,219,224,${a*.72})`);
    g.addColorStop(.52,`rgba(176,188,194,${a*.34})`);
    g.addColorStop(.82,`rgba(135,149,158,${a*.08})`);
    g.addColorStop(1,'rgba(120,135,145,0)');

    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    // Broken, wispy edge similar to the static plume.
    if(t>.14&&t<.72){
      ctx.save();
      ctx.globalAlpha=a*.28;
      ctx.strokeStyle='rgba(220,229,233,.82)';
      ctx.lineWidth=Math.max(.35,r*.02);
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(p.x,p.y+r*.08);
      ctx.bezierCurveTo(
        p.x-r*.15,p.y-r*.18,
        p.x-r*.42,p.y-r*.45,
        p.x-r*.58,p.y-r*.78
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  function frame(now){
    const dt=Math.min((now-last)/1000,.04);
    last=now;
    ctx.clearRect(0,0,W,H);

    // Uneven pulses instead of continuous chimney output.
    const pulse=.62+
      Math.sin(now*.00065)*.16+
      Math.sin(now*.0014+1.6)*.10;

    spawnCarry+=dt*(4.4*Math.max(.25,pulse));

    while(spawnCarry>=1){
      spawn();
      spawnCarry-=1;
      if(Math.random()<.10)spawn();
    }

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.age+=dt;

      if(p.age>=p.life){
        particles.splice(i,1);
        continue;
      }

      const t=p.age/p.life;
      const leftPull=unit*(.010+.020*(1-t));
      const sway=Math.sin(p.phase+p.age*p.wobble)*unit*.010;

      p.vx-=leftPull*dt;
      p.vx+=sway*dt;
      p.vy-=unit*.004*dt;

      p.vx*=Math.pow(.992,dt*60);
      p.vy*=Math.pow(.998,dt*60);

      p.x+=p.vx*dt;
      p.y+=p.vy*dt;

      // Keep the animated plume short, like the one baked into the image.
      if(p.y<emitterY-unit*2.1){
        particles.splice(i,1);
        continue;
      }

      drawPuff(p);
    }

    requestAnimationFrame(frame);
  }

  function seed(){
    for(let i=0;i<14;i++){
      spawn();
      const p=particles[particles.length-1];
      if(!p)continue;
      p.age=Math.random()*p.life*.45;
      p.x+=p.vx*p.age;
      p.y+=p.vy*p.age;
    }
  }

  if(photo.complete&&photo.naturalWidth){
    layout();
    seed();
  }else{
    photo.addEventListener('load',()=>{layout();seed();},{once:true});
  }

  window.addEventListener('resize',layout,{passive:true});
  requestAnimationFrame(frame);
})();