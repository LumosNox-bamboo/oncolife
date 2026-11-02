import {it,expect} from 'vitest';
import {campaign,campaignRun} from '../src/engine/v03-campaign';
import {weekRun,clinicalProgress,seenToday} from '../src/engine/clinic-week';
const start=()=>weekRun(campaign('doctor','driver-negative','learning'),{type:'start'},'医院大厅');
it('ends a day without chores and preserves patients and furniture on the next morning',()=>{
 let c=start();const cmd={type:'clue' as const,id:'goal'};c=clinicalProgress(c,campaignRun(c,cmd),cmd);
 c=weekRun(c,{type:'end'},'医院大厅');expect(c.day).toBe(2);expect(c.week!.funds).toBe(100);expect(c.week!.phase).toBe('summary');
 c=weekRun(c,{type:'buy',id:'lounge'},'医院大厅');expect(c.week!.funds).toBe(10);const saved=JSON.parse(JSON.stringify(c));
 c=weekRun(saved,{type:'buy',id:'lounge'},'医院大厅');expect(c.week!.funds).toBe(10);
 const patients=structuredClone(c.patients);c=weekRun(c,{type:'next'},'医院大厅');expect(c.patients).toEqual(patients);expect(c.week!.upgrades).toContain('lounge');expect(seenToday(c.week!)).toEqual([]);
});
it('does not pay for unnecessary tests or repeated interviews and does not double-settle',()=>{
 let c=start();for(const cmd of [{type:'clue' as const,id:'goal'},{type:'clue' as const,id:'goal'},{type:'order' as const,testId:'ct'}])c=clinicalProgress(c,campaignRun(c,cmd),cmd);
 expect(seenToday(c.week!)).toHaveLength(1);c=weekRun(c,{type:'end'},'医院大厅');expect(c.week!.funds).toBe(100);c=weekRun(c,{type:'end'},'医院大厅');expect(c.week!.funds).toBe(100);expect(c.week!.history).toHaveLength(1);
 c=weekRun(c,{type:'next'},'医院大厅');c=weekRun(c,{type:'end'},'医院大厅');expect(c.day).toBe(2);expect(c.week!.history).toHaveLength(1);
});
it('can take a day off with no income and continue beyond seven days',()=>{
 let c=start();for(let i=0;i<9;i++){c=weekRun(c,{type:'end'},'医院大厅');c=weekRun(c,{type:'next'},'医院大厅');}expect(c.day).toBe(10);expect(c.week!.funds).toBe(60);expect(c.week!.week).toBe(2);
});
it('preserves legacy savings and counts legacy clinical entries once per patient, excluding orders',()=>{
 let c=start();c.week!.clinical=['driver-negative:interview','driver-negative:review','early-nsclc:orders'];c.week!.funds=234;c.week!.upgrades=['nurse'];c=weekRun(c,{type:'end'},'医院大厅');expect(c.week!.funds).toBe(274);expect(c.week!.upgrades).toEqual(['nurse']);
});
