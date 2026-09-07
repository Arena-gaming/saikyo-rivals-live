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
  const SOURCE_X=.78380,SOURCE_Y=.79000;
  let emitterX=0,emitterY=0,unit=1;
  function layout(){
    const r=stage.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
    const iw=photo.naturalWidth,ih=photo.naturalHeight;if(!iw||!ih)return;
    const scale=Math.max(W/iw,H/ih)*IMG_SCALE,dw=iw*scale,dh=ih*scale,ox=(W-dw)*OBJ_POS_X,oy=(H-dh)*OBJ_POS_Y;
    emitterX=ox+SOURCE_X*dw;emitterY=oy+SOURCE_Y*dh;unit=Math.max(30,Math.min(W,H)*.086);
  }
  function spawn(strength=1){
    const life=11.5+Math.random()*5.5;
    particles.push({x:emitterX+(Math.random()-.5)*unit*.62,y:emitterY+(Math.random()-.5)*unit*.035,
      vx:(Math.random()-.5)*unit*.18,vy:-unit*(.88+Math.random()*.42),r:unit*(.22+Math.random()*.25),grow:unit*(.48+Math.random()*.44),
      age:0,life,phase:Math.random()*Math.PI*2,wobble:.24+Math.random()*.56,alpha:(.25+Math.random()*.16)*strength,squash:.9+Math.random()*.2});
  }
  function drawPuff(p){
    const t=p.age/p.life,fadeIn=Math.min(1,t/.05),fadeOut=Math.max(0,1-Math.max(0,t-.78)/.22),a=p.alpha*fadeIn*fadeOut;if(a<=.002)return;
    const radius=p.r+p.grow*t;ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,p.squash);
    const g=ctx.createRadialGradient(-radius*.08,-radius*.10,radius*.03,0,0,radius);
    g.addColorStop(0,`rgba(238,242,243,${a})`);g.addColorStop(.24,`rgba(222,230,232,${a*.88})`);g.addColorStop(.58,`rgba(199,211,215,${a*.46})`);g.addColorStop(1,'rgba(184,199,204,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,W,H);
    const breathe=1+Math.sin(now*.00082)*.05+Math.sin(now*.0019+1.7)*.035;spawnCarry+=dt*(18*breathe);
    while(spawnCarry>=1){spawn(.98+Math.random()*.16);spawnCarry-=1;}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life||p.y<-unit*7){particles.splice(i,1);continue;}
      const t=p.age/p.life;p.vx+=Math.sin(p.age*p.wobble*2+p.phase)*unit*.0085*dt;p.vy-=unit*(.035+.023*t)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;drawPuff(p);}
    requestAnimationFrame(frame);
  }
  function seed(){for(let i=0;i<92;i++){spawn(.97+Math.random()*.13);const p=particles[particles.length-1];p.age=Math.random()*p.life*.84;p.x+=p.vx*p.age;p.y+=p.vy*p.age-unit*.020*p.age*p.age;}}
  if(photo.complete&&photo.naturalWidth){layout();seed();}else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});requestAnimationFrame(frame);
})();
