'use strict';
// Independent presentation layer; gameplay scoring is unchanged.
(()=>{
 const game=document.getElementById('game'),layer=document.createElement('div');layer.id='shatter-layer';game.append(layer);
 let cleanup,partyTimer,party;
 window.yokochoEffects={
  clearCelebration(){clearTimeout(partyTimer);party?.remove();party=null;game.classList.remove('score-impact');},
  celebrate(points){this.clearCelebration();const full=points===1800,jackpot=points===300,perfect=points>=90,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;party=document.createElement('div');party.className='score-party '+(full?'complete':jackpot?'perfect jackpot':perfect?'perfect':points>=60?'great':'nice');party.setAttribute('aria-hidden','true');(full?document.getElementById('result'):game).append(party);
   if(!full){const title=document.createElement('div');title.className='party-title';const label=document.createElement('strong');label.textContent=points===300?'大当たり！':points===100?'お見事！':perfect?'お見事！':points>=60?'乾杯！':'いいね！';const value=document.createElement('span');value.textContent='+'+points+'点';title.append(label,value);party.append(title);}
   const count=reduced?0:full?100:jackpot?120:perfect?72:points>=60?42:20;
   for(let n=0;n<count;n++){const bit=document.createElement('i'),burst=jackpot?n<75:perfect||points<60;bit.className=burst?'party-spark':'party-confetti';const cluster=n%3,angle=Math.random()*Math.PI*2,radius=12+Math.random()*28;bit.style.left=(burst?[24,76,50][cluster]:Math.random()*100)+'%';bit.style.top=(burst?[28,36,48][cluster]:-5)+'%';bit.style.setProperty('--px',Math.cos(angle)*radius+'cqw');bit.style.setProperty('--py',(burst?Math.sin(angle)*radius:90)+'cqw');bit.style.setProperty('--spin',Math.random()*720+'deg');bit.style.setProperty('--delay',(burst?cluster*(jackpot?.26:.12):Math.random()*(jackpot?.7:.35))+'s');bit.style.setProperty('--color',['#fff3b1','#ffd34d','#ff5b36','#7eece0'][n%4]);party.append(bit);}
   if(perfect&&!reduced)game.classList.add('score-impact');partyTimer=setTimeout(()=>this.clearCelebration(),full?4000:jackpot?2400:1600);
  },
  reset(){this.clearCelebration();clearTimeout(cleanup);layer.replaceChildren();game.classList.remove('impact');document.getElementById('mug').style.visibility='visible';},
  shatter(x){this.reset();const origin=Math.max(6,Math.min(94,x));document.getElementById('mug').style.visibility='hidden';game.classList.add('impact');
   const spill=document.createElement('i');spill.className='beer-spill';spill.style.left=origin+'%';layer.append(spill);
   const splash=document.createElement('i');splash.className='beer-splash';splash.style.left=origin+'%';layer.append(splash);
   for(let n=0;n<34;n++){const drop=document.createElement('i');drop.className=n%3===0?'beer-drop foam':'beer-drop';drop.style.left=origin+'%';drop.style.setProperty('--dx',((Math.random()-.5)*65)+'cqw');drop.style.setProperty('--up',(-8-Math.random()*26)+'cqw');drop.style.setProperty('--fall',(4+Math.random()*18)+'cqw');drop.style.setProperty('--drop',(1+Math.random()*3)+'cqw');drop.style.setProperty('--turn',(Math.random()*120-60)+'deg');layer.append(drop);}

   for(let n=0;n<26;n++){const shard=document.createElement('i');shard.className=n%4===0?'glass-shard amber':'glass-shard';shard.style.left=origin+'%';shard.style.setProperty('--dx',((Math.random()-.5)*180)+'px');shard.style.setProperty('--dy',(15+Math.random()*70)+'px');shard.style.setProperty('--rot',((Math.random()-.5)*700)+'deg');shard.style.setProperty('--size',(4+Math.random()*11)+'px');shard.style.animationDelay=(Math.random()*.07)+'s';layer.append(shard);}
   cleanup=setTimeout(()=>game.classList.remove('impact'),450);
  }
 };
})();
