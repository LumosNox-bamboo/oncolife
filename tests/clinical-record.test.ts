import {it,expect} from 'vitest';
import {initialV03,run} from '../src/engine/v03-engine';
import {clinicalRecord,orderResult} from '../src/engine/clinical-record';
import {profiles,caseReport} from '../src/medical/profiles';
import {cases} from '../src/medical/cases';
import {CaseId} from '../src/engine/v03-types';
it('initial vitals visible; examination and unrequested reports are not revealed',()=>{
 const s=initialV03();const r=clinicalRecord(s);expect(r.initialVitals).toContain('128/78');expect(r.initialVitals).toContain('97%');expect(r.reports).toHaveLength(0);expect(r.sections.find(x=>x.label.includes('体格'))?.unlocked).toBe(false);expect(JSON.stringify(r)).not.toContain('PD-L1');expect(JSON.stringify(r)).not.toContain('3.6 cm');
});
it('interviews reveal case-specific findings rather than generic completion messages',()=>{
 let s=run(initialV03(),{type:'clue',id:'risk'});expect(s.message).toContain('20 包年');s=run(s,{type:'clue',id:'exam'});expect(s.message).toContain('128/78');expect(s.message).toContain('ECOG 1');s=run(s,{type:'clue',id:'exam'});expect(s.message).toContain('128/78');
});
it('CT does not unlock brain MRI, molecular evidence or final stage',()=>{
 let s=run(initialV03(),{type:'order',testId:'ct'});s=run(s,{type:'advance',days:'next'});expect(clinicalRecord(s).reports).toHaveLength(0);s=run(s,{type:'ack',id:s.events[0].id});const r=clinicalRecord(s);expect(r.reports[0].text).toContain('3.6 cm');expect(JSON.stringify(r)).not.toContain('脑 MRI');expect(JSON.stringify(r)).not.toContain('PD-L1');expect(r.reports[0].text).not.toContain('IVA');
});
it('legacy completed report gains detailed display without changing saved values or finances',()=>{
 const s=initialV03();const o={id:'ord-1',testId:'ct',caseId:s.caseId,status:'completed' as const,orderedAt:1,scheduledAt:1,availableAt:2,completedAt:2,transactionId:'charge:ord-1',result:'影像显示目标病灶及需进一步评估的范围。'};
 const before=JSON.stringify(o);expect(orderResult(o)).toContain('3.6 cm');expect(orderResult(o)).toContain('未重新采样');expect(JSON.stringify(o)).toBe(before);expect(orderResult({...o,status:'failed'})).toBe('');
});
it('six profiles contain distinct concrete findings and recorded uncertainty',()=>{
 for(const id of Object.keys(cases) as CaseId[]){const p=profiles[id];expect(p.vitals).toMatch(/mmHg/);expect(p.provenance).toContain('虚构');expect(caseReport(id,'ct')).toMatch(/\d+\.\d/);expect(caseReport(id,'pathology')).toMatch(/腺癌|非小细胞癌|小细胞/);expect(p.labs.crcl).toBeGreaterThan(0);}
 expect(new Set(Object.values(profiles).map(p=>p.reports.ct)).size).toBe(Object.keys(profiles).length);expect(caseReport('driver-positive','molecular')).toContain('EGFR exon 19');expect(caseReport('driver-negative','molecular')).toContain('TPS 10%');
});
it('unoccurred acute data stays hidden and historical precheck numbers are not rewritten',()=>{
 const s=initialV03();s.events.push({id:'acute',kind:'adverse',caseId:s.caseId,scheduledAt:8,availableAt:8,title:'急性事件',priority:0,requiresAction:true});expect(clinicalRecord(s).observations).toHaveLength(0);s.day=8;s.events[0].occurredAt=8;expect(clinicalRecord(s).observations[0].text).toContain('112');
 const o={id:'precheck:1:1',testId:'blood',caseId:s.caseId,status:'completed' as const,orderedAt:1,scheduledAt:1,availableAt:1,transactionId:'test',result:'保留该日原始检验值'};expect(orderResult(o)).toBe(o.result);
});
it('reading one blood report does not reveal later unacknowledged blood reports',()=>{
 let s=run(initialV03(),{type:'order',testId:'blood'});s=run(s,{type:'advance',days:'next'});s=run(s,{type:'ack',id:s.events[0].id});s.orders.push({...s.orders[0],id:'later',result:'尚未查看的新数值'});expect(clinicalRecord(s).reports).toHaveLength(1);
});
