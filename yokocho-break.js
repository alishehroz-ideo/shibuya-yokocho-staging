// Glass fragments use the actual mug image; liquid follows gravity and settles on the bar.
(()=>{
 const fx=window.yokochoEffects,game=document.getElementById('game'),mug=document.getElementById('mug');
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';game.append(canvas);
 const ctx=canvas.getContext('2d');let frame=0;
 fx.clearBreak=()=>{cancelAnimationFrame(frame);ctx.clearRect(0,0,canvas.width,canvas.height);};
 const reset=fx.reset;
 fx.reset=function(){this.clearBreak();reset.call(this);};
 fx.shatter=function(x){
  cancelAnimationFrame(frame);this.reset();mug.style.visibility='hidden';game.classList.add('impact');setTimeout(()=>game.classList.remove('impact'),180);
  const w=game.clientWidth,h=game.clientHeight,dpr=Math.min(devicePixelRatio||1,2),floor=h*.635,ox=w*Math.max(.06,Math.min(.94,x/100)),oy=floor-w*.11;
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,rand=(a,b)=>a+Math.random()*(b-a),drops=[],shards=[],foam=[];
  for(let i=0;i<(reduced?12:110);i++)drops.push({x:ox+rand(-.025,.025)*w,y:oy+rand(-.08,.05)*w,vx:rand(-.12,.8)*w,vy:rand(-.85,.1)*w,r:rand(.0015,.007)*w,landed:false});
  for(let i=0;i<(reduced?8:30);i++){const sx=i%6,sy=Math.floor(i/6);shards.push({x:ox+(sx-2.5)*w*.03,y:floor-w*.26+sy*w*.045,vx:rand(-.18,.52)*w,vy:rand(-.65,-.12)*w,angle:rand(-.3,.3),spin:rand(-9,9),size:rand(.018,.043)*w,sx:sx/6,sy:sy/5,settled:false});}
  for(let i=0;i<30;i++)foam.push({x:ox+rand(-.06,.35)*w,y:floor+rand(-.006,.018)*w,r:rand(.002,.008)*w});
  const begin=performance.now();let previous=begin;
  function draw(now){const t=(now-begin)/1000,dt=Math.min(.035,(now-previous)/1000);previous=now;ctx.clearRect(0,0,w,h);if(t>2.1)return;
   ctx.globalAlpha=Math.min(1,(2.1-t)/.4);const spread=Math.min(1,t/.65);
   ctx.save();ctx.translate(ox+w*.13,floor+w*.015);ctx.scale(1,.17);const pool=ctx.createRadialGradient(0,0,0,0,0,w*.24);pool.addColorStop(0,'rgba(201,116,10,.76)');pool.addColorStop(.65,'rgba(238,174,34,.59)');pool.addColorStop(.93,'rgba(255,220,115,.42)');pool.addColorStop(1,'rgba(255,231,163,0)');ctx.fillStyle=pool;ctx.beginPath();ctx.ellipse(0,0,w*.24*spread,w*.19*spread,0,0,Math.PI*2);ctx.fill();ctx.restore();
   // Connected liquid streams break into fine beads, rather than a star-shaped burst.
   if(t<.42&&!reduced){ctx.save();ctx.globalAlpha*=1-t/.42;for(let j=0;j<9;j++){let reach=w*(.12+j*.025)*Math.min(1,t/.15);ctx.beginPath();ctx.moveTo(ox,oy);ctx.quadraticCurveTo(ox+reach*.5,oy-w*(.16+j*.012),ox+reach,oy+(j-4)*w*.025+t*t*w);ctx.strokeStyle=j%3?'rgba(238,172,35,.48)':'rgba(255,235,167,.72)';ctx.lineWidth=w*(.007-j*.0005);ctx.lineCap='round';ctx.stroke();}ctx.restore();}
   for(const d of drops){if(!d.landed){d.vy+=w*1.6*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;if(d.y>=floor){d.y=floor+rand(0,.015)*w;d.landed=true;}}ctx.fillStyle=d.landed?'rgba(230,172,46,.45)':'rgba(244,186,48,.8)';ctx.beginPath();ctx.ellipse(d.x,d.y,d.r*(d.landed?1.8:1),d.r*(d.landed?.3:1.35),0,0,Math.PI*2);ctx.fill();if(!d.landed){ctx.fillStyle='rgba(255,248,213,.8)';ctx.fillRect(d.x-d.r*.3,d.y-d.r*.7,Math.max(.6,d.r*.5),Math.max(.6,d.r*.4));}}
   for(const s of shards){if(!s.settled){s.vy+=w*1.8*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.angle+=s.spin*dt;if(s.y>=floor){s.y=floor;if(Math.abs(s.vy)>w*.13){s.vy*=-.22;s.vx*=.48;s.spin*=.4;}else{s.settled=true;}}}ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.beginPath();ctx.moveTo(-s.size*.6,-s.size*.8);ctx.lineTo(s.size*.55,-s.size*.35);ctx.lineTo(s.size*.3,s.size*.7);ctx.lineTo(-s.size*.4,s.size*.25);ctx.closePath();ctx.save();ctx.clip();ctx.fillStyle='rgba(201,230,223,.24)';ctx.fill();if(mug.complete&&mug.naturalWidth)ctx.drawImage(mug,s.sx*mug.naturalWidth,s.sy*mug.naturalHeight,mug.naturalWidth/6,mug.naturalHeight/5,-s.size*.65,-s.size*.8,s.size*1.3,s.size*1.6);ctx.restore();ctx.strokeStyle='rgba(255,250,223,.85)';ctx.lineWidth=.7;ctx.stroke();ctx.restore();}
   if(t>.2){ctx.save();ctx.globalAlpha*=Math.min(1,(t-.2)*4);for(const f of foam){ctx.fillStyle='rgba(255,247,215,.8)';ctx.beginPath();ctx.ellipse(f.x,f.y,f.r,f.r*.48,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(157,117,57,.3)';ctx.lineWidth=.5;ctx.stroke();}ctx.restore();}ctx.globalAlpha=1;frame=requestAnimationFrame(draw);
  }draw(begin+1);
 };
})();
