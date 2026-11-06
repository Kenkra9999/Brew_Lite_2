import {NextRequest} from 'next/server';
export const dynamic='force-dynamic';
async function proxy(req:NextRequest,{params}:{params:Promise<{path:string[]}>}){
 const {path}=await params;
 if(!['products','toppings','auth','orders','payments','promotions','health'].includes(path[0])||path.some(s=>s==='..'||s.includes('/')||s.includes('\\')))return Response.json({message:'Không tìm thấy API'},{status:404});
 const url=new URL(path.map(encodeURIComponent).join('/'),(process.env.API_INTERNAL_URL||'http://localhost:3001').replace(/\/$/,'')+'/');url.search=req.nextUrl.search;
 const headers=new Headers({'Content-Type':'application/json'});for(const h of ['authorization','idempotency-key','x-request-id']){const v=req.headers.get(h);if(v)headers.set(h,v);}
 try{const body=['GET','HEAD'].includes(req.method)?undefined:await req.text();if(body&&body.length>65536)return Response.json({message:'Nội dung quá lớn'},{status:413});const response=await fetch(url,{method:req.method,headers,body,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});const outHeaders=new Headers({'Content-Type':response.headers.get('content-type')||'application/json','Cache-Control':'no-store'});for(const h of ['idempotent-replayed','x-request-id']){const v=response.headers.get(h);if(v)outHeaders.set(h,v);}return new Response(response.body,{status:response.status,headers:outHeaders});}catch{return Response.json({message:'Máy chủ đang bận. Vui lòng thử lại.',code:'UPSTREAM_UNAVAILABLE'},{status:502,headers:{'Cache-Control':'no-store'}});}
}
export {proxy as GET,proxy as POST,proxy as PATCH};
