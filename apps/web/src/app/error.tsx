'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <div className="page empty" role="alert"><h1>Có chút gián đoạn</h1><p>Thử tải lại để tiếp tục với BrewLite.</p><button className="button" onClick={reset}>Thử lại</button></div>;}
