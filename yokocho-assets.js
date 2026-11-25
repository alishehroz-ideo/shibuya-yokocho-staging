'use strict';
// Two background downloads at a time; the opening shop is the only startup gate.
(()=>{const jobs=new Map(),queue=[];let active=0,opened=false;const bays=new Map();
function paint(n){const bay=bays.get(n);if(bay)bay.style.backgroundImage=`url('assets/optimized/shop-${String(n).padStart(2,'0')}.webp')`;}
function pump(){while(active<2&&queue.length){const job=queue.shift();active++;const img=new Image();img.decoding='async';img.fetchPriority=job.n===0?'high':'low';img.onload=()=>{job.ready=true;paint(job.n);job.resolve();active--;pump();};img.onerror=()=>{active--;jobs.delete(job.n);job.reject(new Error('Shop image unavailable'));pump();};img.src=`assets/optimized/shop-${String(job.n).padStart(2,'0')}.webp`;}}
function load(n,priority=false){n=Math.max(0,Math.min(19,n));if(jobs.has(n)){const job=jobs.get(n),at=queue.indexOf(job);if(priority&&at>=0){queue.splice(at,1);queue.unshift(job);}return job.promise;}let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});const job={n,promise,resolve,reject,ready:false};jobs.set(n,job);priority?queue.unshift(job):queue.push(job);pump();return promise;}
window.yokochoAssets={load,attach(n,bay){bays.set(n,bay);if(jobs.get(n)?.ready)paint(n);},focus(n){if(!opened){load(0,true).catch(()=>{});return;}for(let i=Math.min(19,n+3);i>=Math.max(0,n-1);i--)load(i,true).catch(()=>{});},warm(){opened=true;for(let n=1;n<20;n++)load(n).catch(()=>{});}};
})();
