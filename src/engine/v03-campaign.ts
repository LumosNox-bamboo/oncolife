import {CaseId,GameState,Journey} from './v03-types';
import {initialV03,run,Command} from './v03-engine';
import {nextEvent} from './v03-clock';
export type Campaign={version:3;journey:Journey;activeId:CaseId;day:number;balance:number;resources:GameState['resources'];patients:Partial<Record<CaseId,GameState>>};
export function campaign(journey:Journey,id:CaseId='driver-negative'):Campaign{const s=initialV03(journey,'challenge',id);return {version:3,journey,activeId:id,day:1,balance:s.balance,resources:{...s.resources},patients:{[id]:s}};}
function shared(c:Campaign){for(const s of Object.values(c.patients)){s.balance=c.balance;s.day=c.day;s.clock.now=c.day;s.resources={...c.resources};}return c;}
export function selectPatient(before:Campaign,id:CaseId):Campaign{const c=structuredClone(before);c.activeId=id;c.patients[id]??=initialV03(c.journey,'challenge',id);return shared(c);}
export function campaignRun(before:Campaign,command:Command):Campaign{
 const c=structuredClone(before);if(command.type==='case')return selectPatient(c,command.caseId);
 if(command.type==='advance'){
  const es=Object.values(c.patients).filter(s=>!s.complete).map(nextEvent).filter(e=>!!e);
  const nearest=es.sort((a,b)=>a!.availableAt-b!.availableAt)[0];
  let target=command.days==='next'?(nearest?.availableAt??c.day):c.day+command.days;
  if(nearest)target=Math.min(target,Math.max(c.day,nearest.availableAt));target=Math.max(c.day,target);
  if(target>c.day){c.resources.urgentSlots=1;c.resources.infusionSlots=1;}
  for(const [id,s] of Object.entries(c.patients)){const n=run(s,{type:'advance',days:target-c.day});c.patients[id as CaseId]=n;}
  c.day=target;const active=c.patients[c.activeId]!;const waiting=Object.values(c.patients).find(s=>s.caseId!==c.activeId&&nextEvent(s)?.availableAt!==undefined&&nextEvent(s)!.availableAt<=c.day);
  if(waiting)active.message=`另一位患者 ${waiting.caseId} 有待处理事件；请在患者列表切换，时间不再前进。`;
  return shared(c);
 }
 const old=c.patients[c.activeId]!,n=run(old,command);c.balance+=n.balance-old.balance;
 for(const field of ['beds','urgentSlots','infusionSlots'] as const)c.resources[field]+=n.resources[field]-old.resources[field];
 c.patients[c.activeId]=n;return shared(c);
}
