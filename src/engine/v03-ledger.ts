import {GameState,Order} from './v03-types';
export function charge(s:GameState,id:string,amount:number,description:string,relatedId?:string){
 if(s.transactions.some(t=>t.id===id)||!Number.isFinite(amount)||amount<0)return s;
 const n=structuredClone(s);n.transactions.push({id,kind:'charge',amount,day:n.day,description,relatedId,settled:true});n.balance-=amount;return n;
}
export function refund(s:GameState,order:Order,amount:number,description:string){
 const original=s.transactions.find(t=>t.id===order.transactionId&&t.kind==='charge');if(!original)return s;
 const already=s.transactions.filter(t=>t.kind==='refund'&&t.relatedId===original.id).reduce((a,t)=>a+t.amount,0);
 const value=Math.max(0,Math.min(amount,original.amount-already));if(!value)return s;
 const n=structuredClone(s),id=`refund:${order.id}:${already+value}`;
 n.transactions.push({id,kind:'refund',amount:value,day:n.day,description,relatedId:original.id,settled:true});n.balance+=value;
 const o=n.orders.find(o=>o.id===order.id);if(o)o.refundTransactionId=id;return n;
}
export const spent=(s:GameState)=>s.transactions.reduce((a,t)=>a+(t.kind==='charge'?t.amount:-t.amount),0);
