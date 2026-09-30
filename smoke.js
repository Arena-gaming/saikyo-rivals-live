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

  // Approved hero image: steam leaves the upper-middle of the street vent at
  // roughly 86.8% across and 82.1% down the source artwork.
  const SOURCE_X=.868;
  const SOURCE_Y=.821;

  let W=0,H=0,dpr=1;
  let emitterX=0,emitterY=0;
  let unit=1,last=performance.now(),spawnCarry=0;
  const particles=[];

  function objectPosition(){
    const value=getComputedStyle(photo).objectPosition.trim().split(/\s+/);
    const parse=(v,fallback)=>{
      if(!v)return fallback;
      if(v.endsWith('%'))return parseFloat(v)/100;
      if(v==='left'||v==='top')return 0;
      if(v==='right'||v==='bottom')return 1;
      if(v==='center')return .5;
      return fallback;
    };
    return [parse(value[0],.5),parse(value[1],.5)];
  }

  function layout(){
    const r=stage.getBoundingClientRect();
    W=r.width;H=r.height;
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(W*dpr));
    canvas.height=Math.max(1,Math.round(H*dpr));
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const iw=photo.naturalWidth,ih=photo.naturalHeight;
    if(!iw||!ih)return;

    const scale=Math.max(W/iw,H/ih);
    const dw=iw*scale,dh=ih*scale;
    const [px,py]=objectPosition();
    const ox=(W-dw)*px;
    const oy=(H-dh)*py;

    emitterX=ox+SOURCE_X*dw;
    emitterY=oy+SOURCE_Y*dh;
    unit=Math.max(28,Math.min(W,H)*.062);
  }

  function spawn(){
    if(particles.length>46)return;
    const life=4.4+Math.random()*3.4;
    const small=Math.random()<.64;
    particles.push({
      x:emitterX+(Math.random()-.5)*unit*.28,
      y:emitterY+(Math.random()-.5)*unit*.025,
      vx:-unit*(.045+Math.random()*.07)+(Math.random()-.5)*unit*.025,
      vy:-unit*(.42+Math.random()*.22),
      r:unit*(small?.075+.045*Math.random():.11+.07*Math.random()),
      grow:unit*(small?.22+.14*Math.random():.30+.19*Math.random()),
      age:0,
      life,
      phase:Math.random()*Math.PI*2,
      wobble:.65+Math.random()*.9,
      alpha:small?.11+.055*Math.random():.075+.045*Math.random(),
      squash:.82+Math.random()*.28
    });
  }

  function puff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.08);
    const fadeOut=Math.max(0,1-Math.max(0,t-.54)/.46);
    const a=p.alpha*fadeIn*fadeOut;
    if(a<.002)return;

    const r=p.r+p.grow*(1-Math.pow(1-t,1.35));
    const stretch=1+.75*t;
    const curl=Math.sin(p.phase+p.age*p.wobble)*r*.28;

    ctx.save();
    ctx.translate(p.x+curl,p.y);
    ctx.scale(stretch,p.squash);

    const g=ctx.createRadialGradient(-r*.12,-r*.15,r*.03,0,0,r);
    g.addColorStop(0,`rgba(229,235,238,${a})`);
    g.addColorStop(.24,`rgba(207,217,222,${a*.72})`);
    g.addColorStop(.52,`rgba(172,184,190,${a*.35})`);
    g.addColorStop(.78,`rgba(132,148,157,${a*.10})`);
    g.addColorStop(1,'rgba(115,130,140,0)');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(0,0,r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();

    // A faint trailing filament gives the plume a natural torn-wisp edge.
    if(t>.16&&t<.78){
      ctx.save();
      ctx.globalAlpha=a*.34;
      ctx.strokeStyle='rgba(220,230,234,.8)';
      ctx.lineWidth=Math.max(.35,r*.025);
      ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(p.x,p.y+r*.1);
      ctx.bezierCurveTo(
        p.x+r*.32,p.y-r*.22,
        p.x-r*.24,p.y-r*.65,
        p.x+r*.12,p.y-r*1.05
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  function frame(now){
    const dt=Math.min((now-last)/1000,.04);
    last=now;
    ctx.clearRect(0,0,W,H);

    // Quiet, uneven output rather than a continuous chimney.
    const pulse=.72+
      Math.sin(now*.00063)*.18+
      Math.sin(now*.00147+1.9)*.10;
    spawnCarry+=dt*(5.2*Math.max(.25,pulse));

    while(spawnCarry>=1){
      spawn();
      spawnCarry-=1;
      if(Math.random()<.12)spawn();
    }

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.age+=dt;
      if(p.age>=p.life){
        particles.splice(i,1);
        continue;
      }

      const t=p.age/p.life;
      const sway=Math.sin(p.phase+p.age*p.wobble)*unit*.014;
      p.vx+=sway*dt;
      p.vx-=unit*.0045*t*dt;
      p.vy-=unit*.010*dt;
      p.vx*=Math.pow(.994,dt*60);
      p.x+=p.vx*dt;
      p.y+=p.vy*dt;

      puff(p);
    }

    requestAnimationFrame(frame);
  }

  function seed(){
    for(let i=0;i<18;i++){
      spawn();
      const p=particles[particles.length-1];
      if(!p)continue;
      p.age=Math.random()*p.life*.55;
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