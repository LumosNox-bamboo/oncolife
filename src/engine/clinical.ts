import {Action,State,has,ready} from './model';
import {safeToTreat} from '../medical/knowledge';
const doctor:Action[]=['history','blood','ct','biopsy','diagnose','plan','prepare','review','assess','infection','urgent','recheck','followct','followup','consult','targetPlan','surgeryPlan','immunoPlan'];
const nurse:Action[]=['infuse','care','report'];
const costs:Partial<Record<Action,number>>={blood:120,ct:400,biopsy:900,infuse:2400,infection:250,urgent:600,recheck:120,followct:400};
export function act(original:State,a:Action):State {
 const s:State=structuredClone(original); const fail=(m:string)=>({...original,message:m,source:'label'});
 if(doctor.includes(a)&&s.role!=='doctor')return fail('此操作需要医生身份。请回大厅切换身份。');
 if(nurse.includes(a)&&s.role!=='nurse')return fail('此操作需要护士身份。请回大厅切换身份。');
 if((a==='preference'||a==='symptom')&&s.role!=='patient')return fail('请以患者身份表达治疗偏好。');
 if(has(s,a)&&a!=='blood'&&a!=='vitals'&&a!=='review'&&a!=='symptom')return fail('这项工作已经记录，无需重复收费或执行。');
 let text='';let source='label';
 const addReport=(id:string,delay:number,text:string)=>{s.reports.push({id,due:s.day+delay,ready:false,text});};
 switch(a){
 case 'targetPlan':return {...original,message:'暂不采用：本例未检出可靶向驱动异常，不能凭腺癌病理直接选择靶向治疗。请结合完整分子报告。',source:'nci'};
 case 'surgeryPlan':return {...original,message:'暂不采用：本例胸膜转移 IVA 期，不能以局限期根治性手术作为默认治疗。需多学科评估。',source:'nci'};
 case 'immunoPlan':return {...original,message:'免疫联合化疗是应讨论的系统治疗选项；本例患者暂拒免疫治疗，不能越过知情同意直接执行。',source:'nci'};
 case 'symptom':text=s.event&&!s.resolved?'患者主动表达：“我发冷、很乏力，感觉发烧了，请帮我联系医护。”':'患者表达：“我仍有些咳嗽，也担心治疗会拖累家里。”';source='nci';break;
 case 'talk':text='林晓禾：“我想知道还要做哪些检查，也担心治疗后没人照顾家里。” 已解锁病史对话。';source='nci';break;
 case 'preference':text='患者表达：以控制症状和生活质量为目标，了解免疫联合等方案后暂拒免疫治疗。愿意接受化疗并按期复诊。';break;
 case 'history':if(!has(s,'talk'))return fail('请先与患者交谈。');text='病史与体检已记录：58 岁女性，既往吸烟、高血压，ECOG 1，生命体征平稳。';source='nci';break;
 case 'blood':if(!has(s,'history'))return fail('请先完成门诊病史。');if(s.reports.some(r=>r.id==='blood'&&!r.ready))return fail('血液检查正在处理中。');if(s.event&&!s.resolved)return fail('异常期请申请感染检查及恢复复查。');s.reports=s.reports.filter(r=>r.id!=='blood');addReport('blood',1,'ANC 3.2×10⁹/L；血小板 210×10⁹/L；CrCl 82 mL/min。');text='已申请血常规与肾功能，次日出报告。';break;
 case 'ct':case 'biopsy':if(!has(s,'history'))return fail('请先完成病史。');addReport(a,a==='ct'?1:2,a==='ct'?'右肺 3.6 cm 肿块及同侧胸膜结节；脑 MRI 未见转移。胸膜转移待病理确认。':'肺腺癌，胸膜结节活检同源转移；EGFR、ALK、ROS1、BRAF V600E、MET exon14、RET、NTRK、KRAS G12C、HER2 未检出可靶向异常；PD-L1 TPS 10%。');text=a==='ct'?'已申请分期影像组合（CT 与脑 MRI），次日出报告。':'已申请活检、胸膜评估及分子检测，2 天后出报告（压缩教学时间）。';source='nci';break;
 case 'diagnose':if(!['blood','ct','biopsy'].every(r=>ready(s,r)))return fail('需要血液、分期影像和病理分子报告。');text='确认：转移性肺腺癌，胸膜转移 M1a，IVA 期。治疗目标：控制病情、改善症状与生活质量。';source='nci';break;
 case 'plan':if(!has(s,'diagnose')||!has(s,'preference')||!has(s,'consult'))return fail('先确认诊断、由患者表达意愿，并在办公室完成会诊。');s.phase='治疗';text='共同决策：培美曲塞＋顺铂，21 天周期；不自动外推至其他病例。免疫联合等选择已讨论。';break;
 case 'prepare':if(!has(s,'plan'))return fail('尚未制定方案。');s.preparedDay=s.day;text='记录叶酸、B12 准备；首次给药至少等待 7 天。地塞米松、止吐、水化、听力及合并用药安全性列入给药前核对。';break;
 case 'review':{const blood=s.reports.find(r=>r.id==='blood'&&r.ready);if(s.preparedDay===null||s.day-s.preparedDay<7)return fail('首次治疗准备尚未满 7 天。');if(!blood||s.day-blood.due>1)return fail('请更新血常规与肾功能；报告新鲜度 ≤1 天为教学规则。');if(!safeToTreat(3.2,210,82)||s.event)return fail('当前不满足治疗安全条件。');text='医生审核通过：血液与肾功能达标签门槛，已核对支持治疗和顺铂安全事项。审核限本日。';s.flags.push('reviewDay:'+s.day);break;}
 case 'infuse':if(!has(s,'reviewDay:'+s.day))return fail('需要医生当日审核后护士才能执行。');s.treatmentDay=s.day;text='护士完成身份、医嘱、过敏史与支持治疗核对，执行首周期治疗。预约周期第 8、15 天血常规，第 22 天原计划复评。';break;
 case 'vitals':text=s.event&&!s.resolved?'床旁测量：38.6℃，脉搏 112 次/分，血压 108/68，SpO₂ 95%；立即通知医生。':'床旁测量：36.7℃，生命体征平稳。';break;
 case 'report':if(!s.event||s.resolved||!has(s,'vitals'))return fail('先在异常发生后测量生命体征。');text='护士向医生上报发热、乏力和周期第 8 天 ANC 0.4×10⁹/L。';break;
 case 'assess':if(!has(s,'report'))return fail('需要床旁测量与护理上报。');source='ctcae';text='本例 CTCAE v5.0 教学分级：中性粒细胞计数降低 4 级；发热性中性粒细胞减少满足 3 级条件。医生评估发热伴严重中性粒细胞减少，疑似感染急症；立即暂停后续抗肿瘤治疗并启动院内急诊评估。';break;
 case 'infection':source='nice';if(!has(s,'assess'))return fail('先到病房评估患者。');addReport('infection',0,'已采集培养并评估感染灶；培养结果待回报，请同步启动紧急处理。');s.reports[s.reports.length-1].ready=true;text='完成紧急感染检查与培养采集（剧情压缩）；不等待培养结果开始临床处置。';break;
 case 'urgent':source='nice';if(!has(s,'infection'))return fail('先完成临床评估及感染检查采样。');text='医生启动当地院内发热伴中性粒细胞减少急诊流程，开立监测及经验性抗感染处置。';break;
 case 'care':source='nice';if(!has(s,'urgent'))return fail('需要医生开立紧急处置。');text='护士执行已审核的紧急医嘱、监测与支持护理；下一步由医生申请恢复复查。';break;
 case 'recheck':if(!has(s,'care'))return fail('尚未执行紧急处置。');addReport('recheck',2,'退热，ANC 1.8×10⁹/L，血小板 175×10⁹/L，CrCl 78 mL/min；需重新评估后续治疗，不能自动给药。');text='已安排两天后复查。';break;
 case 'followct':if(!s.resolved)return fail('先处理紧急事件并完成恢复复查。');addReport('followct',2,'靶病灶 3.6 → 3.5 cm，未见新病灶。与前次大小相近，继续结合症状复评。');text='已安排随访影像。';break;
 case 'followup':if(!s.resolved||!ready(s,'followct'))return fail('需要恢复复查和随访影像。');s.phase='完成';text='病例完成：回顾毒性与患者负担，暂缓下一周期，提交多学科复评减量及支持方案，重新讨论患者意愿。未自动再次给药。';break;
 case 'consult':if(!has(s,'diagnose'))return fail('请先确认诊断。');text='会诊记录：讨论系统治疗选项、患者意愿和支持照护；后续严重毒性需再次个体化评估。';break;
 case 'comfort':text='完成支线「听见顾虑」：为林晓禾记录家庭照护需求，安排社工支持。';source='nci';break;
 }
 const cost=costs[a]||0;if(s.mode==='clinical'&&s.budget<cost)return fail('游戏币不足：请在大厅申请一次援助，或重新开始学习模式。');
 s.spent+=cost;if(s.mode==='clinical')s.budget-=cost;s.flags.push(a);s.message=text;s.source=source;s.log.push({day:s.day,text:text+(cost?`（${cost} 游戏币）`:'')});return s;
}
export function advance(original:State,days:number):State{
 const s=structuredClone(original);if(s.phase==='完成')return {...s,message:'本例已完成，可以回看记录或重新开始。'};
 if(s.event&&!s.resolved&&!has(s,'recheck'))return {...s,message:'关键临床事件已暂停时间。请完成评估、检查、医嘱与护理，再申请恢复复查。'};
 for(let i=0;i<days;i++){
 s.day++;s.reports.forEach(r=>{if(!r.ready&&r.due<=s.day){r.ready=true;s.log.push({day:s.day,text:`报告就绪：${r.text}`});}});
 if(s.treatmentDay!==null&&s.day===s.treatmentDay+7&&!s.event){s.event=true;s.phase='异常事件';s.flags=s.flags.filter(f=>f!=='vitals');s.reports.push({id:'day8',due:s.day,ready:true,text:'周期第 8 天计划血常规：ANC 0.4×10⁹/L。'});s.message='紧急：林晓禾发热 38.6℃，周期第 8 天 ANC 0.4。时间已自动暂停，请去病房。';s.log.push({day:s.day,text:s.message});return s;}
 if(ready(s,'recheck')&&!s.resolved){s.resolved=true;s.phase='随访';s.log.push({day:s.day,text:'恢复复查已就绪，转入随访；后续治疗保持暂停。'});}
 if(s.treatmentDay!==null&&s.day===s.treatmentDay+14)s.log.push({day:s.day,text:'周期第 15 天血常规监测：ANC 2.1，血小板 180；仍需医生复评。'});
 }
 s.message=`已推进至第 ${s.day} 天。${s.resolved?'请安排随访影像与门诊复评。':'检查与预约已更新。'}`;return s;
}
export const nextAppointment=(s:State)=>Math.max(1,Math.min(...[...s.reports.filter(r=>!r.ready).map(r=>r.due-s.day),s.preparedDay!==null&&s.treatmentDay===null?s.preparedDay+7-s.day:Infinity,s.treatmentDay!==null&&!s.event?s.treatmentDay+7-s.day:Infinity].filter(n=>n>0),7));
