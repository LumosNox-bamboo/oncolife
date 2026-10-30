import {cases} from '../medical/cases';
import {CaseId,GameState,Journey,Mode} from './v03-types';
import {initialV03,run,Command} from './v03-engine';
import {nextEvent} from './v03-clock';
export function nextPatientId(c:Campaign):CaseId|undefined{const ids=Object.keys(cases).filter(id=>!c.patients[id as CaseId]) as CaseId[];if(!ids.length)return undefined;let x=(c.day*2654435761+ids.length*97+Object.keys(c.patients).length*7919)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return ids[(x>>>0)%ids.length];}
export type Campaign={version:3;journey:Journey;activeId:CaseId;day:number;balance:number;resources:GameState['resources'];patients:Partial<Record<CaseId,GameState>>};
export function campaign(journey:Journey,id:CaseId='driver-negative',mode:Mode='challenge',existing?:GameState):Campaign{const s=existing?structuredClone(existing):initialV03(journey,mode,id);return {version:3,journey,activeId:id,day:s.day,balance:s.balance,resources:{...s.resources},patients:{[id]:s}};}
function shared(c:Campaign){for(const s of Object.values(c.patients)){s.balance=c.balance;s.day=c.day;s.clock.now=c.day;s.resources={...c.resources};}return c;}
export function selectPatient(before:Campaign,id:CaseId):Campaign{const c=structuredClone(before);c.activeId=id;c.patients[id]??=initialV03(c.journey,c.patients[before.activeId]!.mode,id);const current=c.patients[id]!;const e=nextEvent(current);current.message=`当前接诊：${cases[id].title.split(' · ')[0]}。${e&&e.availableAt<=c.day?'有待处理事件，请查看当前任务。':'可继续问诊、检查或按预约返院。'}`;return shared(c);}
export function campaignRun(before:Campaign,command:Command):Campaign{
 const c=structuredClone(before);if(command.type==='case')return selectPatient(c,command.caseId);
 if(command.type==='advance'){
  const es=Object.values(c.patients).filter(s=>!s.complete).map(nextEvent).filter(e=>!!e);
  const nearest=es.sort((a,b)=>a!.availableAt-b!.availableAt)[0];
  let target=command.days==='next'?(nearest?.availableAt??c.day):c.day+command.days;
  if(nearest)target=Math.min(target,Math.max(c.day,nearest.availableAt));target=Math.max(c.day,target);
  if(target>c.day){c.resources.urgentSlots=c.patients[c.activeId]!.mode==='challenge'?1:3;c.resources.infusionSlots=c.resources.urgentSlots;}
  for(const [id,s] of Object.entries(c.patients)){const n=run(s,{type:'advance',days:target-c.day});c.patients[id as CaseId]=n;}
  c.day=target;const active=c.patients[c.activeId]!;const waiting=Object.values(c.patients).find(s=>s.caseId!==c.activeId&&nextEvent(s)?.availableAt!==undefined&&nextEvent(s)!.availableAt<=c.day);
  if(waiting)active.message=`另一位患者 ${cases[waiting.caseId].title.split(' · ')[0]} 有待处理事件；请在患者列表切换，时间不再前进。`;
  return shared(c);
 }
 const old=c.patients[c.activeId]!,n=run(old,command);
 if(command.type==='admission'&&command.action==='admit'&&n.resources.beds<old.resources.beds){const used=new Set(Object.values(c.patients).flatMap(s=>s.admissions.filter(a=>a.status==='admitted'||a.status==='observing').map(a=>a.bed)));let number=1;while(used.has(`B${number}`))number++;const adm=n.admissions.at(-1)!;adm.bed=`B${number}`;const e=n.events.find(e=>e.id==='admission:'+adm.id);if(e)e.title=`入院评估与床位 ${adm.bed}`;}
 c.balance+=n.balance-old.balance;
 for(const field of ['beds','urgentSlots','infusionSlots'] as const)c.resources[field]+=n.resources[field]-old.resources[field];
 c.patients[c.activeId]=n;return shared(c);
}
