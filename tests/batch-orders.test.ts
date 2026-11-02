import {it,expect} from 'vitest';
import {initialV03,run} from '../src/engine/v03-engine';
import {caseReport} from '../src/medical/profiles';
it('orders independent tests together without advancing time or duplicating fees',()=>{
 let s=run(initialV03(),{type:'orderBatch',testIds:['ct','blood','liver','electrolytes','coagulation','ecg','ct']});
 expect(s.orders).toHaveLength(6);expect(s.transactions).toHaveLength(6);expect(s.orders.every(o=>o.orderedAt===1&&o.availableAt===2)).toBe(true);
 s=run(s,{type:'orderBatch',testIds:['ct','blood']});expect(s.transactions).toHaveLength(6);
 s=run(s,{type:'advance',days:1});expect(s.orders.every(o=>o.status==='completed')).toBe(true);expect(s.orders.find(o=>o.testId==='liver')!.result).toContain('ALT 23');
});
it('does not charge dependent or unaffordable orders and explains individual results',()=>{
 let s=initialV03('doctor','challenge');s.balance=500;s=run(s,{type:'orderBatch',testIds:['pathology','molecular','ct','blood']});
 expect(s.orders.map(o=>o.testId)).toEqual(['ct']);expect(s.balance).toBe(100);expect(s.message).toContain('可用组织');expect(s.message).toContain('预算不足');
});
it('patient cannot open a batch; supplementary specimens are distinct and explicitly fictional',()=>{
 const s=run(initialV03('patient'),{type:'orderBatch',testIds:['blood']});expect(s.orders).toHaveLength(0);
 expect(caseReport('frail-elderly','electrolytes')).toContain('4.8');expect(caseReport('driver-negative','electrolytes')).toContain('4.1');expect(caseReport('small-cell','ecg')).toContain('虚构');
});
