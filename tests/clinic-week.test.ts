import {it,expect} from 'vitest';
import {campaign,campaignRun} from '../src/engine/v03-campaign';
import {weekRun,clinicalProgress} from '../src/engine/clinic-week';
const start=()=>weekRun(campaign('doctor','driver-negative','learning'),{type:'start'},'医院大厅');
it('plays seven shifts, purchases meaningful upgrades and continues without resetting patients',()=>{
 let c=start();for(let i=0;i<7;i++){c=weekRun(c,{type:'work',id:'round'},'病房');c=weekRun(c,{type:'choice',index:0},'病房');c=weekRun(c,{type:'end'},'病房');}
 expect(c.week!.phase).toBe('summary');expect(c.day).toBe(8);expect(c.week!.history).toHaveLength(7);expect(c.week!.souvenirs).toContain('小夏的手写便签');
 c=weekRun(c,{type:'buy',id:'nurse'},'医生办公室');const balance=c.week!.funds;c=weekRun(c,{type:'buy',id:'nurse'},'医生办公室');expect(c.week!.funds).toBe(balance);
 const patient=structuredClone(c.patients);c=weekRun(c,{type:'next'},'医生办公室');expect(c.week!.week).toBe(2);expect(c.week!.actions).toBe(4);expect(c.patients).toEqual(patient);expect(c.balance).toBe(1000000000);
});
it('requires visiting rooms and enforces daily action and event uniqueness',()=>{
 let c=start();c=weekRun(c,{type:'work',id:'round'},'医院大厅');expect(c.week!.actions).toBe(3);
 c=weekRun(c,{type:'work',id:'round'},'病房');c=weekRun(c,{type:'work',id:'round'},'病房');expect(c.week!.actions).toBe(2);
 c=weekRun(c,{type:'choice',index:1},'病房');const w=structuredClone(c.week!);c=weekRun(c,{type:'choice',index:0},'病房');expect(c.week!.funds).toBe(w.funds);expect(c.week!.trust).toBe(w.trust);
});
it('settlement cannot bypass due reports or grant rewards twice',()=>{
 let c=start();c=campaignRun(c,{type:'order',testId:'ct'});c=campaignRun(c,{type:'advance',days:1});c=weekRun(c,{type:'work',id:'round'},'病房');c=weekRun(c,{type:'choice',index:0},'病房');const day=c.day,funds=c.week!.funds;c=weekRun(c,{type:'end'},'病房');expect(c.day).toBe(day);expect(c.week!.funds).toBe(funds);expect(c.week!.history).toHaveLength(0);
 c=campaignRun(c,{type:'ack',id:'report:ord-1:0'});c=weekRun(c,{type:'end'},'病房');expect(c.week!.history).toHaveLength(1);c=weekRun(c,{type:'end'},'病房');expect(c.week!.history).toHaveLength(1);
});
it('records clinical work without spending action points or farming repeated clicks',()=>{
 let c=start();const cmd={type:'clue' as const,id:'goal'};c=clinicalProgress(c,campaignRun(c,cmd),cmd);c=clinicalProgress(c,campaignRun(c,cmd),cmd);expect(c.week!.clinical).toHaveLength(1);expect(c.week!.actions).toBe(3);expect(JSON.parse(JSON.stringify(c))).toEqual(c);
});
it('has a no-money fallback and distinct choice consequences',()=>{
 let a=start(),b=start();a=weekRun(a,{type:'choice',index:0},'病房');b=weekRun(b,{type:'choice',index:1},'病房');expect(a.week!.actions).not.toBe(b.week!.actions);expect(a.week!.funds).not.toBe(b.week!.funds);
 let c=start();c.week!.funds=0;c=weekRun(c,{type:'work',id:'round'},'病房');c=weekRun(c,{type:'choice',index:2},'病房');c=weekRun(c,{type:'end'},'病房');expect(c.week!.shift).toBe(2);
});
