import {writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
const base=process.env.API_URL||'http://localhost:3001';
for(let i=0;i<5;i++) await fetch(base+'/products');
const times=[];
for(let i=0;i<100;i++){const t=performance.now();const r=await fetch(base+'/products');if(!r.ok)throw Error('API '+r.status);await r.json();times.push(performance.now()-t);}
times.sort((a,b)=>a-b);
const result={at:new Date().toISOString(),node:process.version,platform:process.platform,samples:times.length,concurrency:1,warmup:5,endpoint:'/products',p50ms:+times[49].toFixed(2),p95ms:+times[94].toFixed(2),maxMs:+times[99].toFixed(2),targetP95ms:500,passed:times[94]<500,note:'Local warm sequential test on seed data, not a production SLA or load test.'};
await mkdir('docs/quality',{recursive:true});await writeFile('docs/quality/performance.json',JSON.stringify(result,null,2)+'\n');console.log(result);
