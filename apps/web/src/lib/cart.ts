import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import type {Product,Size,Topping} from './types';
export type CartItem = {key:string; productId:number; name:string; imageUrl:string; size:Size; toppings:Topping[]; qty:number; unitPrice:number};
export const itemKey = (id:number,size:Size,toppings:Topping[]) => `${id}-${size}-${toppings.map(t=>t.id).sort((a,b)=>a-b).join(',')}`;
export const cartTotal = (items:CartItem[]) => items.reduce((s,i)=>s+i.unitPrice*i.qty,0);
type State = {items:CartItem[]; add:(p:Product,size:Size,toppings:Topping[],qty:number)=>void; quantity:(key:string,qty:number)=>void; remove:(key:string)=>void; clear:()=>void};
export const useCart = create<State>()(persist((set)=>({items:[],
add:(p,size,toppings,qty)=>set(s=>{const key=itemKey(p.id,size,toppings); const old=s.items.find(i=>i.key===key); if(!old && s.items.length>=20) return s; const count=Math.min(20,(old?.qty||0)+qty); return {items:old?s.items.map(i=>i.key===key?{...i,qty:count}:i):[...s.items,{key,productId:p.id,name:p.name,imageUrl:p.imageUrl,size,toppings,qty:count,unitPrice:p.price+({S:0,M:5000,L:10000}[size])+toppings.reduce((s,t)=>s+t.price,0)}]};}),
quantity:(key,qty)=>set(s=>({items:s.items.map(i=>i.key===key?{...i,qty:Math.max(1,Math.min(20,qty))}:i)})),
remove:key=>set(s=>({items:s.items.filter(i=>i.key!==key)})), clear:()=>set({items:[]})
}),{name:'brewlite-cart',version:1}));
