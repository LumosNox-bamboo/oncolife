import {describe,it,expect} from 'vitest';
import {initialV03,run,read,levelReady} from '../src/engine/v03-engine';
import {nextEvent} from '../src/engine/v03-clock';
import {GameState} from '../src/engine/v03-types';
import {cases} from '../src/medical/cases';
function action(s:GameState,type:any,rest:any={}){return run(s,{type,...rest});}
function reports(s:GameState){for(let i=0;i<30;i++){const e=nextEvent(s);if(!e||e.kind!=='report')break;s=action(s,'advance',{days:'next'});s=action(s,'ack',{id:e.id});}return s;}
function ready(mode:'learning'|'challenge'|'gauntlet'='learning',id:GameState['caseId']='driver-negative'){
 let s=initialV03('doctor',mode,id);s=action(s,'clue',{id:'goal'});
 for(const testId of ['ct',cases[id].uniqueChecks.includes('pleura')?'pleura':'ebus','pathology','molecular','blood'].filter(x=>x!=='molecular'||cases[id].uniqueChecks.includes(x))){s=action(s,'order',{testId});s=reports(s);const o=s.orders.at(-1)!;if(o.status==='failed'){s=action(s,'orderAction',{action:'recollect',orderId:o.id});s=reports(s);}}
 s=action(s,'diagnosis',{...cases[id].diagnosis,reason:'影像、组织与分子证据',submit:true});return action(s,'therapy',{action:'start'});
}
function finish(s:GameState){for(let i=0;i<100&&!s.complete;i++){
 s=action(s,'advance',{days:'next'});const e=nextEvent(s);if(!e)throw Error('dead end '+s.message);
 if(e.kind==='administration'){s=action(s,'therapy',{action:'prepare'});s=action(s,'therapy',{action:'give'});}
 else if(e.kind==='assessment')s=action(s,'therapy',{action:'response'});
 else if(e.kind==='adverse'){s=action(s,'adverse',{action:'assess'});s=action(s,'adverse',{action:'investigate'});s=action(s,'adverse',{action:'treat'});}
 else if(e.kind==='finance')s=action(s,'life',{choice:'transport'});else s=action(s,'ack',{id:e.id});
 }return s;}
describe('V0.3 P0 regressions',()=>{
 it('reports generated on available date; all time buttons stop until acknowledged',()=>{let s=action(initialV03(),'order',{testId:'ct'});s=action(s,'advance',{days:7});expect(s.day).toBe(2);expect(s.orders[0].result).toContain('3.6 cm');expect(s.orders[0].result).not.toContain('IVA');expect(s.events[0].occurredAt).toBe(2);for(const days of ['next',1,7]){s=action(s,'advance',{days});expect(s.day).toBe(2);}s=action(s,'ack',{id:s.events[0].id});expect(s.events[0].acknowledgedAt).toBe(2);});
 it('pending earlier reports take precedence over later bookings',()=>{let s=action(initialV03(),'order',{testId:'ct'});s=action(s,'order',{testId:'pleura'});s=action(s,'advance',{days:'next'});expect(s.day).toBe(2);s=action(s,'advance',{days:'next'});expect(s.day).toBe(2);s=action(s,'ack',{id:s.events[0].id});s=action(s,'advance',{days:'next'});expect(s.day).toBe(3);});
 it('cancellation refunds only once; cancelled event cannot block time',()=>{let s=action(initialV03('doctor','challenge'),'order',{testId:'ct'});const id=s.orders[0].id;s=action(s,'orderAction',{action:'cancel',orderId:id});expect(s.balance).toBe(4920);s=action(s,'orderAction',{action:'cancel',orderId:id});expect(s.balance).toBe(4920);s=action(s,'advance',{days:7});expect(s.day).toBe(8);});
 it('sample shortage preserves paid fee; retry charges once and succeeds',()=>{let s=reports(action(initialV03('doctor','challenge','driver-positive'),'order',{testId:'needle'}));expect(s.orders[0].status).toBe('insufficient_sample');s=action(s,'orderAction',{action:'recollect',orderId:s.orders[0].id});const b=s.balance;s=action(s,'orderAction',{action:'recollect',orderId:s.orders[0].id});expect(s.balance).toBe(b);s=reports(s);expect(s.orders[0].status).toBe('completed');expect(s.transactions).toHaveLength(2);});
 it('technical failure can be retried without double charge',()=>{const s=ready('challenge');expect(read(s,'molecular')).toBe(true);expect(s.transactions.filter(t=>t.description==='检查：分子检测')).toHaveLength(1);});
 it('budget prevents unaffordable orders; aid and urgent slots are not repeatable',()=>{let s=initialV03('doctor','challenge');s.balance=10;s=action(s,'order',{testId:'ct'});expect(s.orders).toHaveLength(0);s=action(s,'challenge',{action:'aid'});s=action(s,'challenge',{action:'aid'});expect(s.balance).toBe(1510);s=action(s,'challenge',{action:'reserveUrgent'});s=action(s,'challenge',{action:'reserveUrgent'});expect(s.resources.urgentSlots).toBe(0);});
 it('admissions need assessment; cannot discharge requested patient or release phantom bed',()=>{let s=action(initialV03(),'admission',{action:'request'});s=action(s,'admission',{action:'discharge'});expect(s.resources.beds).toBe(3);s=action(s,'admission',{action:'admit'});expect(s.admissions[0].admittedAt).toBe(1);s=action(s,'admission',{action:'assess'});s=action(s,'admission',{action:'discharge'});expect(s.admissions[0].dischargedAt).toBe(1);expect(s.resources.beds).toBe(3);});
 it('first administration does not finish; four cycles and post-treatment followup do',()=>{let s=ready();s=action(s,'advance',{days:'next'});s=action(s,'therapy',{action:'prepare'});s=action(s,'therapy',{action:'give'});expect(s.complete).toBe(false);expect(s.admissions).toHaveLength(0);s=finish(s);expect(s.complete,s.message).toBe(true);expect(s.therapy?.administrations.filter(x=>x.status==='given')).toHaveLength(4);expect(s.therapy?.assessments.every(x=>x.status==='done')).toBe(true);});
 it('hold/resume shifts all subsequent therapy dates and does not skip a held dose',()=>{let s=ready();const date=s.therapy!.administrations[0].scheduledAt;s=action(s,'therapy',{action:'hold'});s=action(s,'therapy',{action:'give'});expect(s.therapy!.administrations[0].status).toBe('held');s=action(s,'therapy',{action:'resume'});expect(s.therapy!.administrations[0].scheduledAt).toBe(date+1);expect(s.events.find(e=>e.id==='admin:2:1')!.scheduledAt).toBe(date+22);});
 it('cannot complete treatment via generic ack or bypass evidence gates',()=>{let s=initialV03();s=action(s,'diagnosis',{disease:'肺腺癌',stage:'IVA 教学情境',reason:'猜测',submit:true});expect(s.flags).not.toContain('diagnosis');s=ready();s=action(s,'advance',{days:'next'});s=action(s,'ack',{id:'admin:1:1'});expect(s.therapy!.administrations[0].status).toBe('scheduled');});
 it('six cases have separate paths and all finish their teaching followup',()=>{for(const id of Object.keys(cases) as GameState['caseId'][]){const s=finish(ready('learning',id));expect(s.complete,id+': '+s.message).toBe(true);}expect(new Set(Object.values(cases).map(c=>c.regimen!.id)).size).toBe(6);});
 it('JSON save restore is deterministic and preserves finite budget/cycles/events',()=>{const s=ready('challenge');expect(JSON.parse(JSON.stringify(s))).toEqual(s);expect(action(s,'advance',{days:'next'})).toEqual(action(JSON.parse(JSON.stringify(s)),'advance',{days:'next'}));});
 it('patient story completes independently with NPC evidence-driven plan',()=>{let s=initialV03('patient');s=action(s,'patient',{action:'describe'});s=action(s,'patient',{action:'family'});s=action(s,'patient',{action:'visit'});s=reports(s);for(let i=0;i<5;i++){s=action(s,'patient',{action:'consent'});s=reports(s);}expect(s.therapy).toBeDefined();s=finish(s);expect(s.complete,s.message).toBe(true);});
 it('six gauntlet objectives unlock sequentially',()=>{let s=ready('gauntlet');for(let i=1;i<=3;i++){expect(levelReady(s)).toBe(true);s=action(s,'level');}s=finish(s);for(let i=4;i<=6;i++){expect(levelReady(s)).toBe(true);s=action(s,'level');}expect(s.unlocked).toBe(6);});
});

import {campaign,campaignRun,selectPatient} from '../src/engine/v03-campaign';
describe('shared challenge campaign',()=>{
 it('patients share budget and one bed, cannot reserve occupied resources twice',()=>{
  let p=campaign('doctor');p=campaignRun(p,{type:'order',testId:'ct'});expect(p.balance).toBe(4600);
  p=campaignRun(p,{type:'admission',action:'request'});p=campaignRun(p,{type:'admission',action:'admit'});
  p=selectPatient(p,'early-nsclc');expect(p.patients['early-nsclc']!.balance).toBe(4600);
  p=campaignRun(p,{type:'admission',action:'request'});p=campaignRun(p,{type:'admission',action:'admit'});
  expect(p.patients['early-nsclc']!.admissions[0].status).toBe('requested');expect(p.resources.beds).toBe(0);
 });
 it('inactive patient events update and pause shared time',()=>{
  let p=campaignRun(campaign('doctor'),{type:'order',testId:'ct'});p=selectPatient(p,'early-nsclc');p=campaignRun(p,{type:'advance',days:7});
  expect(p.day).toBe(2);expect(p.patients['driver-negative']!.orders[0].status).toBe('completed');p=campaignRun(p,{type:'advance',days:7});expect(p.day).toBe(2);
  p=selectPatient(p,'driver-negative');p=campaignRun(p,{type:'ack',id:'report:ord-1:0'});p=campaignRun(p,{type:'advance',days:1});expect(p.day).toBe(3);
 });
});
import {validateCases} from '../src/medical/validate';
import {teachingDraw} from '../src/engine/v03-engine';
it('medical content passes structural checks; seeded story is repeatable',()=>{expect(validateCases()).toEqual([]);expect(teachingDraw(2026)).toBe(teachingDraw(2026));expect(teachingDraw(2026)).not.toBe(teachingDraw(2030));});
it('technical refunds link original charge and never exceed payment',()=>{
 let s=initialV03('doctor','challenge');for(const testId of ['ct','pleura','pathology','molecular'])s=reports(action(s,'order',{testId}));const o=s.orders.at(-1)!;expect(o.status).toBe('failed');s=action(s,'orderAction',{action:'refund',orderId:o.id});const balance=s.balance;s=action(s,'orderAction',{action:'refund',orderId:o.id});expect(s.balance).toBe(balance);const refund=s.transactions.find(t=>t.kind==='refund')!;expect(refund.relatedId).toBe(o.transactionId);expect(refund.amount).toBe(620);s=action(s,'orderAction',{action:'recollect',orderId:o.id});expect(s.orders.at(-1)!.status).toBe('failed');
});
it('revising a diagnosis revokes treatment authorization until resubmitted',()=>{let s=ready();s=action(s,'diagnosis',{disease:'感染性病变',stage:'待定',reason:'修订',submit:false});expect(s.flags).not.toContain('diagnosis');s=action(s,'advance',{days:'next'});s=action(s,'therapy',{action:'give'});expect(s.therapy!.administrations[0].status).toBe('scheduled');});
