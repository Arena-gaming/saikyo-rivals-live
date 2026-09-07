(()=>{
  'use strict';
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const stage=document.querySelector('.right'),photo=document.querySelector('.photo');if(!stage||!photo)return;
  const canvas=document.createElement('canvas');canvas.className='smoke-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7;';stage.appendChild(canvas);
  const ctx=canvas.getContext('2d');if(!ctx)return;
  let W=0,H=0,dpr=1,last=performance.now(),carry=0;const particles=[];
  const OBJ_POS_X=.56,OBJ_POS_Y=.31,IMG_SCALE=1.004;
  // Locked master source coordinates.
  const SOURCE_X=.79850,SOURCE_Y=.79000;
  let emitterX=0,emitterY=0,unit=1;
  function layout(){const r=stage.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);const iw=photo.naturalWidth,ih=photo.naturalHeight;if(!iw||!ih)return;const s=Math.max(W/iw,H/ih)*IMG_SCALE,dw=iw*s,dh=ih*s,ox=(W-dw)*OBJ_POS_X,oy=(H-dh)*OBJ_POS_Y;emitterX=ox+SOURCE_X*dw;emitterY=oy+SOURCE_Y*dh;unit=Math.max(30,Math.min(W,H)*.086);}
  function spawn(seedAge=0){
    const q=Math.random();let type=q<.38?'body':q<.70?'veil':q<.91?'wisp':'thread';
    const cfg=type==='body'?[8,13,.12,.25,.46,.86,.18,.31]:type==='veil'?[9,15,.18,.34,.70,1.25,.07,.15]:type==='wisp'?[6,11,.07,.16,.35,.72,.09,.18]:[4.5,8,.035,.075,.18,.42,.06,.13];
    const life=cfg[0]+Math.random()*(cfg[1]-cfg[0]),side=Math.random()-.5;
    const p={type,x:emitterX+side*unit*(type==='thread'?.72:.48),y:emitterY+(Math.random()-.5)*unit*.035,
      vx:side*unit*(.025+Math.random()*.07)+(Math.random()-.5)*unit*.055,vy:-unit*(.48+Math.random()*.38),
      r:unit*(cfg[2]+Math.random()*(cfg[3]-cfg[2])),grow:unit*(cfg[4]+Math.random()*(cfg[5]-cfg[4])),alpha:cfg[6]+Math.random()*(cfg[7]-cfg[6]),
      age:0,life,phase:Math.random()*6.283,phase2:Math.random()*6.283,wobble:.35+Math.random()*1.15,curl:(Math.random()-.5)*2,stretch:.72+Math.random()*.72,
      lobes:2+Math.floor(Math.random()*4),grain:.65+Math.random()*.7};
    if(seedAge){p.age=seedAge;p.x+=p.vx*seedAge;p.y+=p.vy*seedAge-unit*.009*seedAge*seedAge;}particles.push(p);
  }
  function blob(p,x,y,r,a,stretch=1){const g=ctx.createRadialGradient(x-r*.12,y-r*.16,r*.02,x,y,r);g.addColorStop(0,`rgba(242,235,240,${a})`);g.addColorStop(.20,`rgba(231,220,229,${a*.78})`);g.addColorStop(.48,`rgba(211,201,212,${a*.39})`);g.addColorStop(.75,`rgba(191,184,199,${a*.13})`);g.addColorStop(1,'rgba(178,174,190,0)');ctx.save();ctx.translate(x,y);ctx.scale(1,stretch);ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.fill();ctx.restore();}
  function draw(p){
    const t=p.age/p.life,fi=Math.min(1,t/.06),fo=Math.max(0,1-Math.max(0,t-.60)/.40),a=p.alpha*fi*fo*(1-t*.28);if(a<.001)return;
    const r=p.r+p.grow*(1-Math.pow(1-t,1.45));
    // Each particle is an irregular cluster rather than one perfect circle.
    const lobes=p.type==='thread'?1:p.lobes;
    for(let j=0;j<lobes;j++){const ang=p.phase2+j*2.399+p.age*.035*(j%2?1:-1),off=r*(.12+.11*j/lobes);const rr=r*(j===0?1:(.38+.24*Math.sin(p.phase+j*1.7)**2));blob(p,p.x+Math.cos(ang)*off,p.y+Math.sin(ang)*off*.62,rr,a*(j===0?.72:.23),p.stretch*(j===0?1:.78+Math.random()*.06));}
    // Fine translucent wisps peel away from the body.
    if(p.type==='wisp'||p.type==='thread'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(p.phase+p.age*.31)*.24);ctx.strokeStyle=`rgba(231,222,232,${a*.32})`;ctx.lineWidth=Math.max(.45,r*.035);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-r*.08,r*.18);ctx.bezierCurveTo(r*.42,-r*.05,-r*.52,-r*.52,r*(.35+.28*Math.sin(p.phase2)),-r*.92);ctx.stroke();ctx.restore();}
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,W,H);
    // Deliberately uneven emission: dense moments, thin transparent gaps and stray wisps.
    const flow=.86+.18*Math.sin(now*.00041)+.11*Math.sin(now*.00107+1.4)+.07*Math.sin(now*.00263+4.1);
    carry+=dt*(20.5*Math.max(.48,flow));while(carry>=1){spawn();carry-=1;if(Math.random()<.12)spawn();}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life||p.y<-unit*8){particles.splice(i,1);continue;}const t=p.age/p.life;
      const n1=Math.sin(p.phase+p.age*p.wobble*1.47),n2=Math.sin(p.phase2-p.age*.61+t*7.2),n3=Math.sin(p.phase*2.3+p.age*.27+t*12.1);
      p.vx+=(n1*.62+n2*.29+n3*.13)*unit*(.013+.012*t)*dt+p.curl*unit*.0023*dt;p.vx*=Math.pow(.995,dt*60);p.vy-=unit*(.009+.025*t)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;draw(p);}
    requestAnimationFrame(frame);
  }
  function seed(){for(let i=0;i<112;i++){spawn();const p=particles[particles.length-1],age=Math.random()*p.life*.70;p.age=age;p.x+=p.vx*age;p.y+=p.vy*age-unit*.009*age*age;}}
  if(photo.complete&&photo.naturalWidth){layout();seed();}else photo.addEventListener('load',()=>{layout();seed();},{once:true});window.addEventListener('resize',layout,{passive:true});requestAnimationFrame(frame);
})();
