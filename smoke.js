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
  // Locked master coordinates. Plume changes must never move the manhole source.
  const SOURCE_X=.79850,SOURCE_Y=.79000;
  let emitterX=0,emitterY=0,unit=1;
  function layout(){
    const r=stage.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
    const iw=photo.naturalWidth,ih=photo.naturalHeight;if(!iw||!ih)return;
    const scale=Math.max(W/iw,H/ih)*IMG_SCALE,dw=iw*scale,dh=ih*scale,ox=(W-dw)*OBJ_POS_X,oy=(H-dh)*OBJ_POS_Y;
    emitterX=ox+SOURCE_X*dw;emitterY=oy+SOURCE_Y*dh;unit=Math.max(30,Math.min(W,H)*.086);
  }
  function spawn(strength=1,seedAge=0){
    const core=Math.random()<.56;
    const life=7.8+Math.random()*5.8;
    const side=(Math.random()-.5);
    const p={
      x:emitterX+side*unit*(core?.24:.42),y:emitterY+(Math.random()-.5)*unit*.025,
      vx:side*unit*.035+(Math.random()-.5)*unit*.07,
      vy:-unit*(.56+Math.random()*.27),
      r:unit*(core?(.13+Math.random()*.13):(.18+Math.random()*.19)),
      grow:unit*(core?(.52+Math.random()*.36):(.70+Math.random()*.56)),
      age:0,life,phase:Math.random()*Math.PI*2,phase2:Math.random()*Math.PI*2,
      wobble:.48+Math.random()*.70,curl:(Math.random()-.5)*2,
      alpha:(core?(.25+Math.random()*.13):(.14+Math.random()*.11))*strength,
      stretch:.92+Math.random()*.25
    };
    if(seedAge){p.age=seedAge;p.y+=p.vy*seedAge-unit*.012*seedAge*seedAge;p.x+=p.vx*seedAge;}
    particles.push(p);
  }
  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.055),fadeOut=Math.max(0,1-Math.max(0,t-.68)/.32);
    const a=p.alpha*fadeIn*fadeOut*(1-t*.18);if(a<=.0015)return;
    const radius=p.r+p.grow*(1-Math.pow(1-t,1.55));
    ctx.save();ctx.translate(p.x,p.y);
    ctx.rotate(Math.sin(p.phase+p.age*.20)*.055);
    ctx.scale(1.10+Math.sin(p.phase2+p.age*.25)*.07,p.stretch);
    const g=ctx.createRadialGradient(-radius*.14,-radius*.18,radius*.015,0,0,radius);
    g.addColorStop(0,`rgba(246,238,243,${a*.96})`);
    g.addColorStop(.16,`rgba(236,222,231,${a*.88})`);
    g.addColorStop(.38,`rgba(220,203,215,${a*.64})`);
    g.addColorStop(.64,`rgba(198,184,198,${a*.31})`);
    g.addColorStop(.84,`rgba(179,169,184,${a*.10})`);
    g.addColorStop(1,'rgba(170,165,180,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,W,H);
    // Continuous heavy flow with gentle, irregular breathing rather than discrete puffs.
    const breathe=.98+Math.sin(now*.00047)*.09+Math.sin(now*.00113+2.1)*.055+Math.sin(now*.00231+.4)*.025;
    spawnCarry+=dt*(22.5*breathe);
    while(spawnCarry>=1){spawn(.96+Math.random()*.13);spawnCarry-=1;}
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.age+=dt;if(p.age>=p.life||p.y<-unit*8){particles.splice(i,1);continue;}
      const t=p.age/p.life;
      // Layered eddies create the rolling S-shaped billows seen in real hot steam.
      const eddy1=Math.sin(p.phase+p.age*p.wobble*1.32);
      const eddy2=Math.sin(p.phase2+p.age*.47+t*5.4);
      const eddy3=Math.sin(p.phase*1.6-p.age*.24+t*8.1);
      const turbulence=eddy1+.58*eddy2+.25*eddy3;
      p.vx+=turbulence*unit*(.012+.009*t)*dt+p.curl*unit*.0021*dt;
      p.vx*=Math.pow(.9945,dt*60);
      p.vy-=unit*(.012+.024*t)*dt;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      drawPuff(p);
    }
    requestAnimationFrame(frame);
  }
  function seed(){
    // Pre-fill the full vertical column so the plume is already tall and connected on load.
    for(let i=0;i<126;i++){
      const life=7.8+Math.random()*5.8;
      spawn(.94+Math.random()*.12,Math.random()*life*.72);
    }
  }
  if(photo.complete&&photo.naturalWidth){layout();seed();}else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});requestAnimationFrame(frame);
})();
