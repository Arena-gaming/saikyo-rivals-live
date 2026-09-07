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
    const q=Math.random();let type=q<.44?'body':q<.72?'haze':q<.92?'wisp':'thread';
    const cfg=type==='body'?[10,17,.10,.23,.52,.98,.13,.25]:type==='haze'?[12,20,.17,.34,.78,1.38,.045,.11]:type==='wisp'?[8,15,.055,.14,.42,.88,.055,.13]:[6,12,.025,.065,.24,.55,.035,.085];
    const life=cfg[0]+Math.random()*(cfg[1]-cfg[0]),side=Math.random()-.5;
    const p={type,x:emitterX+side*unit*(type==='thread'?.68:.42),y:emitterY+(Math.random()-.5)*unit*.03,
      vx:side*unit*(.018+Math.random()*.052)+(Math.random()-.5)*unit*.045,vy:-unit*(.35+Math.random()*.27),
      r:unit*(cfg[2]+Math.random()*(cfg[3]-cfg[2])),grow:unit*(cfg[4]+Math.random()*(cfg[5]-cfg[4])),alpha:cfg[6]+Math.random()*(cfg[7]-cfg[6]),
      age:0,life,phase:Math.random()*6.283,phase2:Math.random()*6.283,wobble:.28+Math.random()*.88,curl:(Math.random()-.5)*2,stretch:.78+Math.random()*.56,
      lobes:2+Math.floor(Math.random()*5)};
    if(seedAge){p.age=seedAge;p.x+=p.vx*seedAge;p.y+=p.vy*seedAge-unit*.0045*seedAge*seedAge;}particles.push(p);
  }
  function blob(x,y,r,a,stretch=1,phase=0){
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(phase)*.09);ctx.scale(1,stretch);
    const g=ctx.createRadialGradient(-r*.15,-r*.16,r*.025,0,0,r);
    // Neutral charcoal-grey translucent smoke: darker body, soft transparent edges.
    g.addColorStop(0,`rgba(164,166,172,${a})`);g.addColorStop(.18,`rgba(145,148,155,${a*.86})`);g.addColorStop(.44,`rgba(119,124,133,${a*.52})`);g.addColorStop(.70,`rgba(94,101,111,${a*.20})`);g.addColorStop(.88,`rgba(78,87,98,${a*.055})`);g.addColorStop(1,'rgba(70,80,92,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.fill();ctx.restore();
  }
  function draw(p){
    const t=p.age/p.life,fi=Math.min(1,t/.075),fo=Math.max(0,1-Math.max(0,t-.66)/.34),a=p.alpha*fi*fo*(1-t*.22);if(a<.001)return;
    const r=p.r+p.grow*(1-Math.pow(1-t,1.34));
    blob(p.x,p.y,r,a*.78,p.stretch,p.phase+p.age*.035);
    if(p.type!=='thread')for(let j=0;j<p.lobes;j++){const ang=p.phase2+j*2.399+p.age*(j%2?.021:-.017),off=r*(.10+.12*j/p.lobes),rr=r*(.25+.25*(.5+.5*Math.sin(p.phase+j*1.83)));blob(p.x+Math.cos(ang)*off,p.y+Math.sin(ang)*off*.65,rr,a*(.11+.09*(j%2)),.72+p.stretch*.28,p.phase2+j);}
    if(p.type==='wisp'||p.type==='thread'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(p.phase+p.age*.22)*.30);ctx.strokeStyle=`rgba(125,130,140,${a*.24})`;ctx.lineWidth=Math.max(.35,r*(p.type==='thread'?.018:.027));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-r*.06,r*.18);ctx.bezierCurveTo(r*.42,-r*.06,-r*.50,-r*.48,r*(.30+.34*Math.sin(p.phase2)),-r*1.05);ctx.stroke();ctx.restore();}
  }
  function frame(now){
    const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,W,H);
    // Slower, heavier smoke with irregular output instead of hot, fast steam.
    const flow=.78+.22*Math.sin(now*.00033)+.12*Math.sin(now*.00083+1.8)+.07*Math.sin(now*.00191+4.2);
    carry+=dt*(16.2*Math.max(.38,flow));while(carry>=1){spawn();carry-=1;if(Math.random()<.08)spawn();}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age+=dt;if(p.age>=p.life||p.y<-unit*8){particles.splice(i,1);continue;}const t=p.age/p.life;
      const n1=Math.sin(p.phase+p.age*p.wobble*1.15),n2=Math.sin(p.phase2-p.age*.39+t*6.2),n3=Math.sin(p.phase*2.1+p.age*.19+t*10.4);
      p.vx+=(n1*.60+n2*.29+n3*.11)*unit*(.009+.013*t)*dt+p.curl*unit*.0018*dt;p.vx*=Math.pow(.996,dt*60);p.vy-=unit*(.004+.010*t)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;draw(p);}
    requestAnimationFrame(frame);
  }
  function seed(){for(let i=0;i<108;i++){spawn();const p=particles[particles.length-1],age=Math.random()*p.life*.68;p.age=age;p.x+=p.vx*age;p.y+=p.vy*age-unit*.0045*age*age;}}
  if(photo.complete&&photo.naturalWidth){layout();seed();}else photo.addEventListener('load',()=>{layout();seed();},{once:true});window.addEventListener('resize',layout,{passive:true});requestAnimationFrame(frame);
})();
