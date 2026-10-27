import {cases} from '../medical/cases';
import {caseReport,profiles,labText} from '../medical/profiles';
import {interviewText,reportRead,orderRead} from './clinical-record';
import {CaseId,GameState,Journey,Mode,ClinicalEvent} from './v03-types';
import {base,applyOrder,regimenTherapy,testInfo,costs} from './v03-cases';
import {advanceClock,advanceToNext,acknowledge,nextEvent} from './v03-clock';
import {safeToTreat} from '../medical/knowledge';
import {refund,charge} from './v03-ledger';
export type Command={type:'case';caseId:CaseId}|{type:'mode';mode:Mode}|{type:'clue';id:string}|{type:'order';testId:string}|{type:'orderAction';action:'cancel'|'recollect'|'refund';orderId:string}|{type:'ack';id:string}|{type:'advance';days:number|'next'}|{type:'diagnosis';disease:string;stage:string;reason:string;submit:boolean}|{type:'admission';action:'request'|'admit'|'assess'|'discharge'}|{type:'therapy';action:'start'|'prepare'|'give'|'hold'|'resume'|'adjust'|'switch'|'stop'|'response'|'support'}|{type:'challenge';action:'aid'|'transfer'|'reserveUrgent'}|{type:'patient';action:'wait'|'visit'|'describe'|'family'|'consent'|'rest'|'report'|'refuse'}|{type:'adverse';action:'assess'|'investigate'|'treat'}|{type:'life';choice:'family'|'transport'}|{type:'level'};
// Seeded fictional logistics only; this is not a clinical probability model.
export function teachingDraw(seed:number){let x=seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}
export const initialV03=(journey:Journey='doctor',mode:Mode='learning',caseId:CaseId='driver-negative')=>base(caseId,journey,mode);
const mark=(s:GameState,x:string)=>{if(!s.flags.includes(x))s.flags.push(x);};
const say=(s:GameState,text:string,choice='系统',source='虚构教学规则')=>{s.message=text;s.source=source;s.log.push({day:s.day,choice,text,known:[...s.clues,...s.orders.filter(o=>orderRead(s,o)).map(o=>o.result||'')]});return s;};
export const read=reportRead;
const done=(s:GameState,id:string)=>{const e=s.events.find(e=>e.id===id);if(e){e.occurredAt??=s.day;e.acknowledgedAt=s.day;e.completedAt=s.day;e.requiresAction=false;}};
const event=(s:GameState,id:string,kind:ClinicalEvent['kind'],day:number,title:string,priority=3)=>{if(!s.events.some(e=>e.id===id))s.events.push({id,kind,caseId:s.caseId,scheduledAt:day,availableAt:day,title,priority,requiresAction:true});};
const unresolved=(s:GameState)=>s.events.some(e=>e.kind==='adverse'&&e.availableAt<=s.day&&e.completedAt===undefined);
function sync(s:GameState){
 for(const o of s.orders){if(!['ordered','scheduled','collected','processing'].includes(o.status))continue;
  if(s.day>=o.scheduledAt){o.collectedAt??=o.scheduledAt;o.status='processing';}
  if(s.day<o.availableAt)continue;
  o.completedAt=o.availableAt;
  if(o.testId==='needle'&&!o.attempt){o.status='insufficient_sample';o.failureReason='固定教学剧情：样本不足，不代表真实失败率。';}
  else if(o.testId==='molecular'&&s.mode==='challenge'&&!o.attempt){o.status='failed';o.failureReason='固定教学剧情：实验室技术失败，可免费重做或全额退款。';}
  else {o.status='completed';o.result=caseReport(s.caseId,o.testId)||testInfo[o.testId].result;o.reportContentVersion=1;}
 }
 const e=nextEvent(s);return say(s,e?`第 ${s.day} 天：${e.availableAt<=s.day?'待处理':'下次预约'} · ${e.title}`:'暂无未处理预约，请继续决策。','推进临床时间');
}
function eligible(s:GameState){const c=cases[s.caseId];return read(s,'ct')&&read(s,'pathology')&&(!c.uniqueChecks.includes('molecular')||read(s,'molecular'));}
function shift(s:GameState,from:number,days:number){if(!s.therapy)return;for(const a of s.therapy.administrations)if(a.status!=='given'&&a.scheduledAt>=from)a.scheduledAt+=days;for(const a of s.therapy.assessments)if(a.status==='pending'&&a.scheduledAt>=from)a.scheduledAt+=days;for(const e of s.events)if(e.completedAt===undefined&&e.scheduledAt>=from&&['administration','assessment','monitor'].includes(e.kind)){e.scheduledAt+=days;e.availableAt+=days;delete e.occurredAt;}}
export const levels=['肺部异常与初步检查','组织学诊断与分期','分子与共同治疗决策','治疗准备与首次治疗','毒性与多周期管理','随访与综合决策'];
export function levelReady(s:GameState){return [read(s,'ct'),read(s,'pathology')&&s.flags.includes('diagnosis'),!!s.therapy,s.therapy?.administrations.some(a=>a.status==='given'),(s.therapy?.assessments.filter(a=>a.status==='done').length||0)>=Math.min(2,cases[s.caseId].regimen!.cycles),s.complete][s.level-1]||false;}
export function run(before:GameState,c:Command):GameState{
 let s=structuredClone(before);const def=cases[s.caseId];
 if(c.type==='case')return base(c.caseId,s.journey,s.mode);
 if(c.type==='mode')return base(s.caseId,s.journey,c.mode);
 if(c.type==='level'){if(!levelReady(s))return say(s,'本关目标尚未完成。');s.unlocked=Math.max(s.unlocked,Math.min(6,s.level+1));s.level=Math.min(6,s.level+1);return say(s,'已解锁：'+levels[s.level-1],'闯关');}
 if(s.complete)return say(s,'阶段性结局已达成；可以查看记录或开始其他病例。');
 if(c.type==='advance')return sync(c.days==='next'?advanceToNext(s):advanceClock(s,s.day+c.days));
 if(c.type==='ack'){
  const e=s.events.find(e=>e.id===c.id);if(!e||e.availableAt>s.day)return say(s,'事件尚未发生。');
  if(['administration','assessment','adverse','finance'].includes(e.kind))return say(s,'这项事件需要实际临床操作，不能只点确认完成。');
  s=acknowledge(s,c.id);
  if(e.kind==='monitor')mark(s,'monitor:'+e.id);
  if(e.id==='surveillance'){s.complete=true;s.phase='阶段结局';s.outcome=s.journey==='patient'?'我的治疗阶段完成了：学会描述症状、寻求帮助、安排生活并参与复诊。仍需后续随访，这不是治愈证明。':'完成预设治疗与随访沟通，进入后续管理；不代表治愈或真实疗效。';s.score.communication+=5;}
  if(s.journey==='patient'&&eligible(s)){mark(s,'diagnosis');s.phase='诊断沟通';}
  return say(s,`已查看：${e.title}`,'查看事件',e.kind==='report'?'ng122':'教学规则');
 }
 if(c.type==='clue'){
  if(s.flags.includes(c.id))return say(s,'已记录：'+interviewText(s,c.id),'回看问诊','case');mark(s,c.id);
  const text=interviewText(s,c.id);s.clues.push(text);s.score.communication+=2;return say(s,text,'问诊','case');
 }
 if(c.type==='order'){
  if(s.journey==='patient')return say(s,'患者不能开医嘱，请通过就医与知情同意安排检查。');
  return order(s,c.testId);
 }
 if(c.type==='orderAction'){
  const o=s.orders.find(x=>x.id===c.orderId);if(!o)return say(s,'订单不存在。');
  if(c.action==='cancel'){
   if(!['ordered','scheduled'].includes(o.status))return say(s,'已执行，不能按未执行取消规则退款。');
   done(s,`report:${o.id}:${o.attempt||0}`);o.status='cancelled';s=refund(s,o,costs[o.testId]*.8,'未执行取消：80% 教学退款');return say(s,'已取消；保留 20% 教学预约成本，其余退回。','撤销订单');
  }
  if(!['failed','insufficient_sample','recollection_required'].includes(o.status))return say(s,'当前状态不能退款或重做。');
  if(c.action==='refund'){
   if(o.status!=='failed')return say(s,'样本不足已发生取材成本：本教学规则不退费，可重新取样。');
   done(s,`report:${o.id}:${o.attempt||0}`);s=refund(s,o,costs[o.testId],'实验室技术失败：全额退款');return say(s,'技术失败已退款；原失败状态保留，财务状态独立记录。','退款');
  }
  if(o.refundTransactionId)return say(s,'已退款订单不能免费重做，请重新申请。');
  done(s,`report:${o.id}:${o.attempt||0}`);
  if(o.status==='insufficient_sample'){
   if(s.mode!=='learning'&&s.balance<100)return say(s,'补样需 100 游戏币，可申请援助。');
   s=charge(s,`recollect:${o.id}`,100,'重新取样：额外教学成本',o.id);
  }
  const retry=s.orders.find(x=>x.id===o.id)!;retry.attempt=(retry.attempt||0)+1;retry.status='scheduled';retry.scheduledAt=s.day;retry.availableAt=s.day+testInfo[o.testId].days;delete retry.failureReason;delete retry.completedAt;
  event(s,`report:${o.id}:${retry.attempt}`,'report',retry.availableAt,`重做报告：${testInfo[o.testId].name}`,2);
  return say(s,'已安排重做。技术失败免费；重新取样另收 100 游戏币且增加出血／气胸负担，不提供发生概率。','重做');
 }
 if(c.type==='diagnosis'){
  if(s.journey==='patient')return say(s,'诊断由医生 NPC 根据证据形成。');
  s.hypothesis={disease:c.disease,stage:c.stage,reason:c.reason};s.flags=s.flags.filter(f=>f!=='diagnosis');if(!c.submit)return say(s,'已保存可修改的诊断假设。');
  if(!read(s,'ct')||!read(s,'pathology')||c.disease!==def.diagnosis.disease||c.stage!==def.diagnosis.stage||!c.reason.trim()){
   s.score.reasoning=Math.max(0,s.score.reasoning-3);return say(s,'请核对已查看的影像、组织证据与分期；目前判断不完整，可修订而不结束游戏。','诊断反馈','ng122');
  }
  mark(s,'diagnosis');s.phase='共同治疗决策';s.score.reasoning+=10;return say(s,'诊断与现有证据相符；还需分子特征、患者意愿及治疗安全评估。','诊断反馈','nci');
 }
 if(c.type==='life'){const e=s.events.find(e=>e.id==='logistics'&&e.availableAt<=s.day&&e.completedAt===undefined);if(!e)return say(s,'暂无待处理生活事件。');const cost=c.choice==='family'?100:40;if(s.mode!=='learning'&&s.balance<cost)return say(s,'可先申请援助；此项非急救资源。');s=charge(s,'logistics',cost,c.choice==='family'?'安排家属陪诊与交通':'预约公共交通');s.experience.pressure+=c.choice==='family'?4:1;s.experience.fatigue+=c.choice==='family'?-3:4;done(s,'logistics');return say(s,c.choice==='family'?'陪诊费用较高，但减轻疲劳。':'节省游戏币，但增加出行疲劳；不改变真实医学结局。','生活资源决策');}
 if(c.type==='patient')return patientAction(s,c.action);
 if(c.type==='admission')return admission(s,c.action);
 if(c.type==='adverse'){
  if(!unresolved(s))return say(s,'当前无未处理急性事件。');
  if(c.action==='assess'){mark(s,'acute-assessed');return say(s,'完成紧急评估：38.6℃、ANC 0.4，疑似中性粒细胞减少性败血症；立即处置，不等待自行恢复。','异常评估','nice');}
  if(c.action==='investigate'){mark(s,'acute-tests');return say(s,'已采集急诊血液、培养并评估感染灶；采样不得延误经验性治疗。','紧急检查','nice');}
  if(!s.flags.includes('acute-assessed'))return say(s,'需先进行临床评估，同时启动紧急处置。');
  mark(s,'acute-treated');done(s,'acute');s.score.safety+=10;event(s,'recovery','monitor',s.day+3,'急性事件后复评（固定剧情恢复节点）',1);return say(s,'已启动当地急诊抗感染与支持流程，无药物剂量输出。后续复评前不得再次抗肿瘤治疗。','紧急处置','nice');
 }
 if(c.type==='therapy'){if(s.journey==='patient'&&c.action==='support')mark(s,'goal');return therapy(s,c.action);}
 if(c.type==='challenge'){
  if(c.action==='aid'){if(s.flags.includes('aid'))return say(s,'本次援助已领取。');mark(s,'aid');s.balance+=1500;return say(s,'获得一次教学援助 1500 游戏币。','经济援助');}
  if(c.action==='transfer'){if(unresolved(s))return say(s,'急性事件需要立即处理，不能通过延迟转诊跳过。');s=advanceClock(s,s.day+1);mark(s,'transfer');return say(s,'已协调外院非紧急评估，等待一天；本院预约仍保留。','转诊');}
  if(s.resources.urgentSlots<1)return say(s,'本日唯一加急设备已被另一预约占用。紧急救治仍可直接启动。','资源冲突');
  s.resources.urgentSlots--;return say(s,'本日唯一加急影像名额已预留；同日不能再占用。','资源决策');
 }
 return s;
}
function order(s:GameState,id:string){
 if(!testInfo[id]||!cases[s.caseId].uniqueChecks.concat('blood','xray').includes(id))return say(s,'该检查不在当前可用候选中。');
 if(id==='pathology'&&!s.orders.some(o=>['pleura','needle','ebus'].includes(o.testId)&&o.status==='completed'))return say(s,'病理需要可用组织。先选择取样路径。','检查依赖','ng122');
 if(id==='molecular'&&!read(s,'pathology'))return say(s,'需要先查看组织病理、确认样本可用。','检查依赖','ng122');
 const n=applyOrder(s,id);if(n.orders.length>s.orders.length){n.score.appropriateness+=id==='xray'?0:2;n.score.resources+=1;const e=n.events.at(-1)!;e.id+=':0';n.orders.at(-1)!.attempt=0;}
 return say(n,n.message,'申请检查','ng122');
}
function patientAction(s:GameState,a:Extract<Command,{type:'patient'}>['action']){
 if(s.journey!=='patient')return say(s,'这是患者线的操作。');
 if(a==='wait'){if(s.flags.includes('visited'))return say(s,'已经就医，请查看预约。');s=advanceClock(s,s.day+2);s.experience.fatigue+=3;return say(s,'选择再观察两天，症状仍在；未推断分期或生存变化。','症状期');}
 if(a==='family'){if(s.flags.includes('family'))return say(s,'家属支持已记录。');mark(s,'family');s.experience.calm+=10;s.experience.pressure-=5;return say(s,'家属愿意分担陪诊和家务，平静感提高。','家庭交流');}
 if(a==='describe'){mark(s,'described');s.clues.push(cases[s.caseId].patient.symptoms);s.score.communication+=5;return say(s,'已描述症状持续时间、变化及担忧，医生将据此安排评估。','症状表达');}
 if(a==='visit'){mark(s,'visited');s.phase='就医与检查';return order(s,'ct');}
 if(a==='refuse'){mark(s,'declined');s.experience.calm+=3;return say(s,'已表达暂缓侵入性检查或治疗的意愿；医生解释不确定性并保留再次讨论机会。','治疗偏好');}
 if(a==='consent'){
  if(!read(s,'ct'))return say(s,'请先完成并查看胸部影像。');
  if(!read(s,'pathology')){const sample=s.orders.find(o=>['pleura','needle','ebus'].includes(o.testId)&&o.status==='completed');if(!sample)return order(s,cases[s.caseId].uniqueChecks.includes('pleura')?'pleura':'ebus');return order(s,'pathology');}
  if(cases[s.caseId].uniqueChecks.includes('molecular')&&!read(s,'molecular'))return order(s,'molecular');
  if(s.therapy&&!read(s,'blood'))return order(s,'blood');
  mark(s,'diagnosis');mark(s,'goal');s.phase='诊断沟通';if(!s.therapy)return therapy(s,'start');return say(s,'已记录治疗偏好，可参加治疗前评估。');
 }
 if(a==='report'){s.experience.calm+=3;if(unresolved(s))return run(s,{type:'adverse',action:'assess'});return say(s,'已向医护报告症状，列入下一次随访评估。','症状报告');}
 if(!s.flags.includes('rest')){mark(s,'rest');s.experience.fatigue=Math.max(0,s.experience.fatigue-8);}return say(s,'已与家属安排休息和交通；生活指标是叙事值，不预测医学结局。','生活安排');
}
function admission(s:GameState,a:'request'|'admit'|'assess'|'discharge'){
 if(a==='request'){if(s.admissions.some(x=>x.status!=='discharged'))return say(s,'已有住院申请。');s.admissions.push({id:`adm-${s.admissions.length+1}`,status:'requested',requestedAt:s.day,reason:cases[s.caseId].admissionReason,notes:[]});return say(s,'已申请住院评估；门诊治疗不会自动住院。');}
 const adm=s.admissions.at(-1);if(!adm)return say(s,'先申请住院。');
 if(a==='admit'){if(adm.status!=='requested'||s.resources.beds<1)return say(s,'状态或床位不足，不能办理入院。');s.resources.beds--;adm.status='admitted';adm.admittedAt=s.day;adm.bed='B1';event(s,'admission:'+adm.id,'admission',s.day,'入院评估与床位 B1',1);return say(s,'已入院，请完成床旁评估。');}
 if(a==='assess'){if(adm.status!=='admitted')return say(s,'尚未入院或已完成评估。');adm.status='observing';adm.notes.push('入院评估及治疗准备完成');done(s,'admission:'+adm.id);return say(s,'已评估症状、用药、护理和治疗准备，进入观察。');}
 if(adm.status!=='observing'||unresolved(s))return say(s,'需要完成入院评估，且急性事件未处理时不能出院。');
 adm.status='discharged';adm.dischargedAt=s.day;adm.notes.push('出院评估完成；继续原预约与出院复查');s.resources.beds++;event(s,'discharge:'+adm.id,'discharge',s.day,'出院记录',2);event(s,'post-discharge:'+adm.id,'appointment',s.day+3,'出院后复查',3);return say(s,'出院时间与复查已记录。');
}
function therapy(s:GameState,a:Extract<Command,{type:'therapy'}>['action']){
 const r=cases[s.caseId].regimen!;
 if(a==='support'){if(!s.flags.includes('diagnosis')||!s.flags.includes('goal'))return say(s,'先完成诊断沟通并确认患者目标。');mark(s,'support');s.phase='支持照护与复评';event(s,'surveillance','appointment',s.day+7,'支持照护后目标与症状复评');return say(s,'共同选择先支持照护；记录症状目标并约定复评，不宣称抗肿瘤疗效。','治疗选择','nci');}
 if(a==='start'){
  if(s.therapy)return say(s,'已有方案，不能重建或重复预约。');
  if(!s.flags.includes('diagnosis')||!eligible(s)||!s.flags.includes('goal'))return say(s,'需要完整证据、诊断判断和患者目标沟通后才能建立方案。','治疗门槛','nci');
  s.therapy=regimenTherapy(s,s.day+7);s.therapy.currentCycle=0;
  for(const x of s.therapy.administrations)event(s,`admin:${x.cycle}:${x.day}`,'administration',x.scheduledAt,`第 ${x.cycle} 周期：治疗节点（需安全复核）`,2);
  for(const x of s.therapy.assessments)event(s,`assessment:${x.cycle}`,'assessment',x.scheduledAt,`第 ${x.cycle} 周期综合评估`,3);
  if(s.mode==='challenge'){const delay=teachingDraw(s.seed)<.5?2:4;event(s,'logistics','finance',s.day+delay,'交通安排临时变化：选择陪诊或公共交通',4);}
  s.phase='治疗准备';return say(s,`建立 ${r.name}。${r.cycles} 个教学周期；治疗日程与必要监测见预约。非验证方案不输出实际处方。`,'共同治疗决策',r.source);
 }
 const t=s.therapy;if(!t)return say(s,'尚未建立治疗计划。');
 const next=t.administrations.find(x=>x.status!=='given');
 if(a==='prepare'){
  if(!next||s.day<next.scheduledAt)return say(s,'请在治疗日进行当日复查；不能提前把旧化验当作新结果。');
  if(unresolved(s))return say(s,'急性事件未处理，不能标记安全。');if(!read(s,'blood'))return say(s,'请先申请并查看基线血常规和肾功能。');if(s.events.some(e=>e.id==='recovery'&&e.completedAt===undefined))return say(s,'需先完成恢复复评。');
  const id=`precheck:${next.cycle}:${s.day}`;
  if(!s.orders.some(o=>o.id===id)){
   if(s.mode!=='learning'&&s.balance<120)return say(s,'当日复查需 120 游戏币，预算不足可申请援助。');
   s=charge(s,`charge:${id}`,120,'治疗日血液／肾功能复查（教学即时出报告）',id);
   s.orders.push({id,caseId:s.caseId,testId:'blood',status:'completed',orderedAt:s.day,scheduledAt:s.day,collectedAt:s.day,availableAt:s.day,completedAt:s.day,transactionId:`charge:${id}`,result:'当日复查（虚构教学样本）：'+labText(s.caseId),reportContentVersion:1});
   event(s,`report:${id}:0`,'report',s.day,'治疗日复查与核对',1);done(s,`report:${id}:0`);
  }
  const lab=profiles[s.caseId].labs;
  if(!safeToTreat(lab.anc,lab.platelets,lab.crcl))return say(s,'实验室值不满足标签门槛。','安全阻断','label');
  mark(s,'prepared:'+next.cycle+':'+s.day);return say(s,'当日复查并核对血液、器官功能、非血液毒性和意愿。培美曲塞路径要求提前叶酸、B12、预处理及联合药物核对。自动检测数值为固定剧情，真实诊疗仍需完整评估。','安全复核','label');
 }
 if(a==='give'){
  if(!s.flags.includes('diagnosis'))return say(s,'诊断被修订，需重新确认再执行治疗。');
  if(!next||next.status==='held'||t.decision==='stop'||t.decision==='switch')return say(s,'没有可执行治疗节点，或方案已暂缓／终止。');
  if(s.day<next.scheduledAt||unresolved(s)||!s.flags.includes('prepared:'+next.cycle+':'+s.day)){s.score.safety=Math.max(0,s.score.safety-3);return say(s,'尚未到治疗日，或安全复核／急性事件未完成。安全评价降低，可补齐评估后重试。','安全阻断','label');}
  if(s.events.some(e=>e.kind==='assessment'&&e.availableAt<s.day&&e.completedAt===undefined))return say(s,'先完成前一周期评估。');
  if(s.mode==='challenge'&&s.resources.infusionSlots<1)return say(s,'本日治疗资源已占用。');
  if(s.mode!=='learning'&&s.balance<350)return say(s,'治疗教学费用 350，预算不足，可援助或转诊。');
  const cycle=next.cycle,day=next.day;s=charge(s,`treatment:${cycle}:${day}`,350,'治疗节点（游戏费用）');
  const tx=s.therapy!;tx.administrations.find(x=>x.cycle===cycle&&x.day===day)!.status='given';tx.currentCycle=cycle;done(s,`admin:${cycle}:${day}`);s.resources.infusionSlots--;s.phase='治疗与监测';s.score.time+=s.day===next.scheduledAt?2:0;s.experience.fatigue+=5;
  if(cycle===1&&s.caseId==='driver-negative')event(s,'acute','adverse',s.day+7,'治疗后发热与异常血细胞（固定教学剧情）',0);
  for(const d of r.monitoringDays.filter(d=>d>1))event(s,`monitor:${cycle}:${d}`,'monitor',s.day+d-1,`第 ${cycle} 周期第 ${d} 天监测`,1);
  return say(s,`第 ${cycle} 周期治疗节点已执行；首剂不会结束游戏。`,'执行治疗',r.source);
 }
 if(a==='hold'){if(!next)return say(s,'无待执行节点。');next.status='held';t.decision='hold';const e=s.events.find(e=>e.id===`admin:${next.cycle}:${next.day}`);if(e)e.requiresAction=false;s.phase='治疗暂缓';return say(s,'已暂缓；重新评估后可恢复，后续时间表同步平移。');}
 if(a==='resume'){if(!next||next.status!=='held'||unresolved(s))return say(s,'无待恢复治疗，或急性事件尚未处理。');const delta=Math.max(1,s.day+1-next.scheduledAt);shift(s,next.scheduledAt,delta);next.status='scheduled';t.decision='continue';const e=s.events.find(e=>e.id===`admin:${next.cycle}:${next.day}`);if(e)e.requiresAction=true;return say(s,`恢复后后续预约整体延后 ${delta} 天；需重新核对安全。`);}
 if(a==='adjust'){if(!s.flags.includes('acute-treated'))return say(s,'需有毒性评估依据，不能无理由调整。');t.decision='adjust';mark(s,'dose-review');return say(s,'记录毒性后调整决定；实际减量需处方说明书与专科审核，本版不生成剂量。','毒性后调整','label');}
 if(a==='switch'||a==='stop'){
  if(!s.flags.includes('goal'))return say(s,'需先讨论患者目标。');t.decision=a==='stop'?'stop':'switch';for(const e of s.events)if(e.completedAt===undefined&&['administration','assessment','monitor'].includes(e.kind)){e.requiresAction=false;e.payload={cancelled:true};}
  s.phase=a==='switch'?'重新制定方案':'停止治疗后随访';event(s,'surveillance','appointment',s.day+7,a==='switch'?'MDT 重拟方案与目标复评':'停止治疗后症状与目标复评');return say(s,'已停止原计划未来治疗节点；必须完成后续复评才到阶段终点。');
 }
 const ass=t.assessments.find(x=>x.status==='pending');if(!ass||ass.scheduledAt>s.day)return say(s,'尚无到期周期评估。');
 if(t.administrations.some(x=>x.cycle===ass.cycle&&x.status!=='given')||unresolved(s))return say(s,'本周期治疗或急性事件仍未完成。');
 ass.status='done';ass.result=`第 ${ass.cycle} 周期：已完成 ${t.administrations.filter(x=>x.cycle===ass.cycle&&x.status==='given').length} 个治疗节点。最近治疗日血液复查：${labText(s.caseId)} ${s.flags.includes('acute-treated')?'既往发热异常已处置，后续仍需警惕感染。':''} 本次未新增影像测量，不能据此判定客观缓解。`;done(s,`assessment:${ass.cycle}`);s.score.safety+=3;
 if(t.assessments.every(x=>x.status==='done')){s.phase='疗程后随访';event(s,'surveillance','appointment',s.day+7,'疗程后影像、毒性与生活目标随访');}return say(s,ass.result,'周期评估',r.source);
}
export const nextAttention=(s:GameState)=>{const e=nextEvent(s);return e&&['adverse','finance'].includes(e.kind)&&e.availableAt>s.day?s.events.filter(x=>!['adverse','finance'].includes(x.kind)&&x.requiresAction&&x.completedAt===undefined).sort((a,b)=>a.availableAt-b.availableAt)[0]:e;};
