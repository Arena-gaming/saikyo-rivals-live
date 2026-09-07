(()=>{
  'use strict';
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
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
  // Locked master coordinates: do not alter while refining the plume.
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
    const life=9.8+Math.random()*6.4;
    const core=Math.random()<.38;
    particles.push({
      x:emitterX+(Math.random()-.5)*unit*(core?.28:.58),
      y:emitterY+(Math.random()-.5)*unit*.025,
      vx:(Math.random()-.5)*unit*(core?.075:.13),
      vy:-unit*(.66+Math.random()*.32),
      r:unit*(core?(.12+Math.random()*.11):(.16+Math.random()*.16)),
      grow:unit*(core?(.40+Math.random()*.30):(.55+Math.random()*.50)),
      age:0,life,phase:Math.random()*Math.PI*2,
      wobble:.38+Math.random()*.72,
      curl:(Math.random()-.5)*2,
      alpha:(core?(.22+Math.random()*.13):(.13+Math.random()*.12))*strength,
      squash:.88+Math.random()*.28
    });
  }
  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.075),fadeOut=Math.max(0,1-Math.max(0,t-.62)/.38);
    const a=p.alpha*fadeIn*fadeOut*(1-t*.24);if(a<=.0015)return;
    const radius=p.r+p.grow*(1-Math.pow(1-t,1.35));
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(p.phase+p.age*.18)*.035);ctx.scale(1.08,p.squash);
    const g=ctx.createRadialGradient(-radius*.12,-radius*.15,radius*.02,0,0,radius);
    g.addColorStop(0,`rgba(235,240,241,${a*.88})`);
    g.addColorStop(.20,`rgba(218,226,228,${a*.78})`);
    g.addColorStop(.48,`rgba(194,207,211,${a*.40})`);
    g.addColorStop(.76,`rgba(175,192,198,${a*.13})`);
    g.addColorStop(1,'rgba(165,184,190,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,W,H);
    const slowPulse=.93+Math.sin(now*.00063)*.10;
    const smallPulse=1+Math.sin(now*.00171+1.2)*.055;
    spawnCarry+=dt*(14.8*slowPulse*smallPulse);
    while(spawnCarry>=1){spawn(.92+Math.random()*.17);spawnCarry-=1;}
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;if(p.age>=p.life||p.y<-unit*7){particles.splice(i,1);continue;}
      const t=p.age/p.life;
      const turbulence=Math.sin(p.phase+p.age*p.wobble*1.45)+.48*Math.sin(p.phase*1.7+p.age*.63);
      p.vx+=turbulence*unit*.0105*dt+p.curl*unit*.0024*dt;
      p.vx*=Math.pow(.993,dt*60);
      p.vy-=unit*(.018+.030*t)*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      drawPuff(p);
    }
    requestAnimationFrame(frame);
  }
  function seed(){
    for(let i=0;i<76;i++){
      spawn(.9+Math.random()*.15);const p=particles[particles.length-1];
      p.age=Math.random()*p.life*.72;p.x+=p.vx*p.age;p.y+=p.vy*p.age-unit*.010*p.age*p.age;
    }
  }
  if(photo.complete&&photo.naturalWidth){layout();seed();}else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});requestAnimationFrame(frame);
})();
