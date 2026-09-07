(()=>{
  'use strict';
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
    const roll=Math.random();
    const kind=roll<.57?'body':roll<.72?'haze':roll<.92?'wisp':'filament';
    const life=kind==='filament'?7+Math.random()*5:kind==='wisp'?9+Math.random()*6:12+Math.random()*6.5;
    const base=kind==='body'?.19:kind==='haze'?.25:kind==='wisp'?.09:.045;
    const alphaBase=kind==='body'?.35+Math.random()*.19:kind==='haze'?.095+Math.random()*.085:kind==='wisp'?.12+Math.random()*.11:.075+Math.random()*.075;
    particles.push({
      kind,x:emitterX+(Math.random()-.5)*unit*(kind==='filament'?.72:.56),y:emitterY+(Math.random()-.5)*unit*.032,
      vx:(Math.random()-.5)*unit*(kind==='filament'?.30:kind==='wisp'?.25:.14),
      vy:-unit*(kind==='haze'?.64+Math.random()*.28:kind==='filament'?.86+Math.random()*.42:.76+Math.random()*.38),
      r:unit*(base+Math.random()*(kind==='filament'?.055:kind==='wisp'?.11:.21)),
      grow:unit*(kind==='haze'?.76+Math.random()*.55:kind==='body'?.48+Math.random()*.48:kind==='wisp'?.38+Math.random()*.42:.18+Math.random()*.25),
      age:0,life,phase:Math.random()*6.283,phase2:Math.random()*6.283,wobble:.20+Math.random()*.72,alpha:alphaBase*strength,
      squash:.78+Math.random()*.42,lean:(Math.random()-.5)*.28,
      lobe1:.24+Math.random()*.20,lobe2:.18+Math.random()*.19,lobe3:.13+Math.random()*.18,
      off1:(Math.random()-.5)*.46,off2:(Math.random()-.5)*.58,off3:(Math.random()-.5)*.70,
      bend:(Math.random()-.5)*.8,thin:.65+Math.random()*.65
    });
  }
  function cloud(x,y,r,a,squash,tone){
    if(a<=.001)return;
    ctx.save();ctx.translate(x,y);ctx.scale(1,squash);
    const g=ctx.createRadialGradient(-r*.12,-r*.14,r*.02,0,0,r);
    if(tone==='haze'){
      g.addColorStop(0,`rgba(211,214,218,${a*.67})`);g.addColorStop(.28,`rgba(182,187,193,${a*.48})`);g.addColorStop(.64,`rgba(139,146,154,${a*.15})`);g.addColorStop(1,'rgba(105,114,125,0)');
    }else{
      g.addColorStop(0,`rgba(222,224,226,${a})`);g.addColorStop(.18,`rgba(193,197,201,${a*.91})`);g.addColorStop(.44,`rgba(151,157,164,${a*.55})`);g.addColorStop(.72,`rgba(110,119,129,${a*.18})`);g.addColorStop(1,'rgba(82,92,104,0)');
    }
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.fill();ctx.restore();
  }
  function drawStrand(p,r,a,t){
    const upperFade=Math.pow(1-t,1.25);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.lean+Math.sin(p.phase2+p.age*.25)*.18);
    ctx.strokeStyle=`rgba(169,175,182,${a*.52*upperFade})`;
    ctx.lineWidth=Math.max(.35,r*.020*p.thin);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-r*.04,r*.24);
    ctx.bezierCurveTo(r*(.34+p.bend*.10),-r*.05,-r*(.42-p.bend*.08),-r*.55,r*(.22+p.bend*.14),-r*1.18);
    ctx.stroke();
    ctx.strokeStyle=`rgba(205,208,211,${a*.20*upperFade})`;ctx.lineWidth=Math.max(.25,r*.009);
    ctx.beginPath();ctx.moveTo(r*.05,r*.05);ctx.bezierCurveTo(-r*.28,-r*.28,r*.38,-r*.67,-r*.13,-r*1.38);ctx.stroke();ctx.restore();
  }
  function drawPuff(p){
    const t=p.age/p.life;
    const fadeIn=Math.min(1,t/.035),lifeFade=Math.max(0,1-Math.max(0,t-.68)/.32);
    const heightFade=Math.pow(1-t,1.12);
    const baseBoost=1+1.05*Math.pow(Math.max(0,1-t/.28),2);
    const a=p.alpha*fadeIn*lifeFade*(.17+.83*heightFade)*baseBoost;if(a<=.0015)return;
    const radius=p.r+p.grow*(1-Math.pow(1-t,1.25));
    const curl=Math.sin(p.phase+p.age*.32)*radius*(.10+.08*t);
    if(p.kind!=='filament'){
      cloud(p.x,p.y,radius,a,p.squash,p.kind==='haze'?'haze':'body');
      cloud(p.x+radius*p.off1+curl,p.y-radius*.10,radius*p.lobe1,a*.52,p.squash*.91,p.kind==='haze'?'haze':'body');
      cloud(p.x+radius*p.off2-curl*.6,p.y+radius*.07,radius*p.lobe2,a*.38,p.squash*1.08,p.kind==='haze'?'haze':'body');
      cloud(p.x+radius*p.off3+curl*.35,p.y-radius*.24,radius*p.lobe3,a*.25,p.squash*.84,'haze');
    }
    if(p.kind==='wisp'||p.kind==='filament')drawStrand(p,radius,a,t);
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,W,H);
    const breathe=.98+Math.sin(now*.00071)*.09+Math.sin(now*.00161+1.7)*.05+Math.sin(now*.00307+4.1)*.025;
    spawnCarry+=dt*(23*breathe);
    while(spawnCarry>=1){spawn(.98+Math.random()*.17);spawnCarry-=1;if(Math.random()<.16)spawn(.64+Math.random()*.27);}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life||p.y<-unit*7){particles.splice(i,1);continue;}
      const t=p.age/p.life;
      const curl1=Math.sin(p.age*p.wobble*1.65+p.phase),curl2=Math.sin(p.age*.47+p.phase2+t*7.1),curl3=Math.sin(p.age*.21+p.phase*1.8+t*12.3);
      const turbulence=p.kind==='filament'||p.kind==='wisp'?1.35:1;
      p.vx+=(curl1*.62+curl2*.27+curl3*.11)*unit*(.0065+.0075*t)*turbulence*dt;p.vx*=Math.pow(.997,dt*60);
      p.vy-=unit*(.015+.014*t)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;drawPuff(p);}
    requestAnimationFrame(frame);
  }
  function seed(){for(let i=0;i<136;i++){spawn(.94+Math.random()*.16);const p=particles[particles.length-1];p.age=Math.random()*p.life*.73;p.x+=p.vx*p.age;p.y+=p.vy*p.age-unit*.009*p.age*p.age;}}
  if(photo.complete&&photo.naturalWidth){layout();seed();}else photo.addEventListener('load',()=>{layout();seed();},{once:true});
  window.addEventListener('resize',layout,{passive:true});requestAnimationFrame(frame);
})();
