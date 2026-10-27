import {GameState,Order} from './v03-types';
import {cases} from '../medical/cases';
import {profiles,caseReport} from '../medical/profiles';
export function orderRead(s:GameState,o:Order){return o.status==='completed'&&o.availableAt<=s.day&&s.events.some(e=>e.id===`report:${o.id}:${o.attempt||0}`&&e.completedAt!==undefined);}
export function reportRead(s:GameState,id:string){return s.orders.some(o=>o.testId===id&&orderRead(s,o));}
export function orderResult(o:Order):string{
 if(o.status!=='completed')return '';
 // Historical summaries remain in the save; add corrected fixture content without replaying orders or charging.
 const detail=caseReport(o.caseId,o.testId);
 if(o.reportContentVersion===1||o.id.startsWith('precheck:')||!detail)return o.result||'';
 return `${detail}\n资料补充：本单原有摘要保留在存档中；当前为补齐的虚构病例资料，未重新采样、收费或改变日期。`;
}
export function interviewText(s:GameState,id:string){const c=cases[s.caseId],p=profiles[s.caseId];return ({symptoms:c.patient.symptoms,clue:c.patient.symptoms,risk:p.exposures+' '+p.family,history:c.patient.history+' '+p.medications+' '+p.allergies,exam:p.vitals+' '+p.exam+' '+p.performance,goal:c.patient.goal+' '+c.patient.finance} as Record<string,string>)[id]||id;}
export function clinicalRecord(s:GameState){
 const c=cases[s.caseId],p=profiles[s.caseId],own=s.journey==='patient';
 const section=(label:string,text:string,known:boolean,instruction:string)=>({label,text:known?text:instruction,unlocked:known});
 const reports=s.orders.filter(o=>orderRead(s,o)).map(o=>({id:o.id,testId:o.testId,day:o.completedAt??o.availableAt,text:orderResult(o)}));
 const acute=s.events.find(e=>e.id==='acute'&&e.availableAt<=s.day&&e.occurredAt!==undefined);
 return {provenance:p.provenance,name:c.title.split(' · ')[0],age:c.patient.age,sex:c.patient.sex,initialVitals:p.vitals,initialComplaint:c.initialClues.join('；'),
  sections:[section('症状与持续时间',c.patient.symptoms,own||s.flags.includes('symptoms')||s.flags.includes('clue'),'请问诊，获取症状变化与持续时间。'),section('既往史、用药及过敏',c.patient.history+' '+p.medications+' '+p.allergies,own||s.flags.includes('history'),'请询问既往史及用药。'),section('危险因素及家族史',p.exposures+' '+p.family,own||s.flags.includes('risk'),'请追问危险因素及家族史。'),section('体格检查与活动能力',p.exam+' '+p.performance,s.flags.includes('exam'),'请完成体格检查。'),section('治疗目标与生活负担',c.patient.goal+' '+c.patient.finance,own||s.flags.includes('goal'),'请讨论患者目标与意愿。')],reports,
  observations:acute?[{day:acute.occurredAt!,text:'异常期床旁记录：体温 38.6℃；脉搏 112 次/分；血压 108/68 mmHg；SpO₂ 95%；ANC 0.4×10⁹/L。来自原病例固定发热剧情。',resolved:acute.completedAt!==undefined}]:[]};
}
