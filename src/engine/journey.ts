import {TestId,testById,interview} from '../medical/investigations';
import {safeToTreat} from '../medical/knowledge';
export type Journey='doctor'|'patient';
export type Hypothesis={disease:string;stage:string;reason:string};
export type Order={id:TestId;due:number;ready:boolean;result?:string};
export type Entry={day:number;choice:string;known:string[];outcome:string};
export type JourneyState={version:2;journey:Journey;role:Journey;mode:'learn'|'clinical';day:number;phase:string;flags:string[];orders:Order[];clues:string[];hypothesis:Hypothesis;log:Entry[];message:string;source:string;budget:number;spent:number;experience:{calm:number;fatigue:number;pressure:number;quality:number};preparedDay:number|null;treatmentDay:number|null;recoveryDay:number|null;event:boolean;resolved:boolean;plan:'chemo'|'support'|null;complete:boolean};
export type Command={type:'interview';id:string}|{type:'order';id:TestId}|{type:'hypothesis';value:Hypothesis;submit:boolean}|{type:'action';id:string};
export const freshJourney=(journey:Journey,mode:'learn'|'clinical'='learn'):JourneyState=>({version:2,journey,role:journey,mode,day:1,phase:journey==='doctor'?'初诊':'发现症状',flags:[],orders:[],clues:[],hypothesis:{disease:'待定',stage:'待定',reason:''},log:[],message:journey==='doctor'?'林晓禾，58 岁，女。主诉咳嗽，初始体温 36.7℃，高血压病史。先听她描述，再选择检查。':'近来咳嗽总不见好。今天要预约就医，还是先与家人商量？这段故事从未知开始。',source:'nci',budget:9000,spent:0,experience:{calm:45,fatigue:25,pressure:20,quality:65},preparedDay:null,treatmentDay:null,recoveryDay:null,event:false,resolved:false,plan:null,complete:false});
export const done=(s:JourneyState,f:string)=>s.flags.includes(f);
export const resultReady=(s:JourneyState,id:TestId)=>s.orders.some(o=>o.id===id&&o.ready);
export const evidence=(s:JourneyState)=>[...s.clues,...s.orders.filter(o=>o.ready).map(o=>`${testById(o.id).name}：${o.result}`)];
const actionNames:Record<string,string>={aid:'社工援助',visit:'预约就医',delayVisit:'安排家庭事务后就医',describeFull:'完整描述症状',describeBrief:'简短描述症状',clarify:'补充症状',family:'向家属寻求支持',private:'独自整理信息',communicate:'医生解释诊断',askGoal:'询问治疗目标',askBurden:'询问治疗负担',discuss:'共同讨论目标与意愿',chemo:'选择化疗准备',support:'选择支持照护并复评',secondOpinion:'寻求第二意见',readyPatient:'患者表达准备就绪',treat:'审核并由护士执行首剂',rest:'独立休息与社工支持',accompanied:'家属陪诊',assess:'评估异常',urgent:'启动紧急处置',urgentConsult:'紧急处置与同步会诊',callTeam:'主动联系医护',callFamily:'家属陪同立即求助',finishClinical:'完成临床复诊',finishImage:'结合影像复诊',diaryEnd:'写下下一步',hypothesis:'诊断判断反馈',order:'检查申请反馈',action:'行动反馈',interview:'问诊反馈'};
const record=(s:JourneyState,before:JourneyState,choice:string,outcome:string,source='nci')=>{s.message=outcome;s.source=source;s.log.push({day:s.day,choice:actionNames[choice]||choice,known:evidence(before),outcome});return s;};
const mark=(s:JourneyState,f:string)=>{if(!done(s,f))s.flags.push(f);};
const change=(s:JourneyState,k:keyof JourneyState['experience'],n:number)=>{s.experience[k]=Math.max(0,Math.min(100,s.experience[k]+n));};
const pay=(s:JourneyState,n:number)=>{if(s.mode==='clinical'&&s.budget<n)return false;s.spent+=n;if(s.mode==='clinical')s.budget-=n;change(s,'pressure',Math.ceil(n/200));return true;};
export function orderBlock(s:JourneyState,id:TestId):string|null{
 if(s.complete)return '本章已结束。';
 if(s.event&&!s.resolved)return '先处理关键临床事件，常规检查暂缓。';
 if(s.orders.some(o=>o.id===id)&&!(id==='pathology'&&resultReady(s,'pleura')&&s.orders.find(o=>o.id==='pathology')?.result?.includes('标本不足')))return '已经申请，无需重复检查与收费。';
 if(s.journey==='doctor'&&!s.clues.length)return '先完成至少一项问诊或体检。';
 if(s.journey==='patient'&&!done(s,'visit'))return '先到门诊就医，由医生 NPC 判断检查适应证。';
 if(s.journey==='patient'&&!done(s,'describeFull')&&!done(s,'describeBrief'))return '请先向医生描述症状，NPC 才能评估检查适应证。';
 if(['needle','pleura'].includes(id)&&!resultReady(s,'ct'))return '需要 CT 定位后与操作团队评估取材靶点。';
 if(id==='pathology'&&!resultReady(s,'pleura')&&!resultReady(s,'needle'))return '需要先取得标本。';
 if(id==='molecular'&&!resultReady(s,'pathology'))return '先获得可用的病理诊断与标本。';
 if(id==='molecular'&&(!resultReady(s,'pleura')||!s.orders.find(o=>o.id==='pathology')?.result?.includes('检出腺癌')))return '当前标本不足，需补充取材。';
 if(['brain','pet'].includes(id)&&!resultReady(s,'ct'))return '先获取胸部影像线索再讨论分期评估。';
 if(id==='followct'&&!s.resolved)return '先完成治疗后的安全／症状复评。';
 return null;
}
function placeOrder(s:JourneyState,id:TestId){const t=testById(id);if(!pay(s,t.cost))return false;s.orders=s.orders.filter(o=>o.id!==id);s.orders.push({id,due:s.day+t.days,ready:false});change(s,'fatigue',id==='pleura'?8:id==='needle'?4:1);return true;}
export function command(before:JourneyState,c:Command):JourneyState{
 const s=structuredClone(before);const fail=(text:string,source='nci')=>record(s,before,c.type==='action'?c.id:c.type,text,source);
 if(s.complete)return {...s,message:'本章已完成，可查看记录、探索医院或从主菜单重新开始。'};
 if(c.type==='interview'){
 if(s.journey!=='doctor')return fail('患者可描述症状，不能执行医生问诊权限。');const q=interview.find(x=>x.id===c.id);if(!q)return fail('未知问诊项目。');if(done(s,q.id))return {...s,message:'这条线索已记录，可隐藏已读问答。'};mark(s,q.id);s.clues.push(q.text);return record(s,before,q.label,q.text);
 }
 if(c.type==='order'){
 const reason=orderBlock(s,c.id);if(reason)return fail(reason);if(!placeOrder(s,c.id))return fail('预算不足。大厅可申请一次教学援助。');s.phase='检查与等待';return record(s,before,(s.journey==='patient'?'参与 NPC 评估后的检查：':'申请：')+testById(c.id).name,`已安排，等待 ${testById(c.id).days} 天。费用 ${testById(c.id).cost} 虚构游戏币。检查结果不会提前揭示。`,'ng122');
 }
 if(c.type==='hypothesis'){
 if(s.journey!=='doctor')return fail('患者不能替医生提交临床诊断。');if(s.plan)return fail('已进入治疗阶段；本章保留已确认诊断，新的诊断问题需另行会诊。');s.hypothesis={...c.value,reason:c.value.reason.slice(0,800)};
 if(!c.submit)return record(s,before,'保存／修订诊断假设',`${c.value.disease}；${c.value.stage}。理由：${s.hypothesis.reason||'尚未填写'}。这是工作假设，不是确诊。`);
 s.flags=s.flags.filter(f=>f!=='diagnosis');
 if(!resultReady(s,'pathology')||!resultReady(s,'pleura')||!s.orders.find(o=>o.id==='pathology')?.result?.includes('检出腺癌'))return fail('当前证据不足以确认组织类型与胸膜性质。请考虑标本质量及病理结果；不会替你填写诊断。');
 if(!resultReady(s,'brain'))return fail('需要补充颅内分期评估。分型、分期和分子特征是不同问题。');
 if(c.value.disease!=='肺腺癌'||c.value.stage!=='IVA')return fail('提交与现有证据不一致。重新阅读组织来源、胸膜性质与分期卡；修订不会造成虚构的严重后果。');
 if(!s.hypothesis.reason.trim())return fail('请写下支持诊断与分期的证据。');mark(s,'diagnosis');s.phase='共同决策';return record(s,before,'提交诊断',`你的判断与已获得证据一致：${c.value.disease}、${c.value.stage}。分子检测仍独立决定后续可讨论的系统治疗选项。`);
 }
 const id=c.id;
 const doctorOnly=['discuss','assess','urgent','urgentConsult','finishClinical','finishImage'];
 const patientOnly=['visit','delayVisit','describeFull','describeBrief','clarify','family','private','communicate','askGoal','askBurden','readyPatient','callTeam','callFamily','diaryEnd'];
 if(doctorOnly.includes(id)&&s.journey!=='doctor'||patientOnly.includes(id)&&s.journey!=='patient')return fail('该行动不属于当前主线，身份不会切换。');
 if(done(s,id)&&!['clarify','assess'].includes(id))return {...s,message:'已完成这项选择，可直接跳过已读内容。'};
 let text='',source='nci';
 switch(id){
 case 'aid':if(done(s,'aid'))return fail('援助仅一次。');s.budget+=3000;text='社工协助申请 3000 虚构游戏币教学援助。';break;
 case 'visit':mark(s,'visit');s.phase='首次就医';text='医生 NPC：“请具体说说何时开始、有什么变化。先查原因，不先下结论。”';break;
 case 'delayVisit':if(done(s,'visit'))return fail('已经就医，不再回到就医前。');s.day+=2;change(s,'calm',5);change(s,'pressure',-3);text='先安排家里的照护，两天后再就医。只增加等待，不模拟肿瘤进展或惩罚性死亡。';break;
 case 'describeFull':case 'describeBrief':
 if(!done(s,'visit'))return fail('先就医。');if(done(s,'describeFull')||done(s,'describeBrief'))return fail('已经描述；如有遗漏可补充症状。');
 if(id==='describeFull'){s.clues.push('患者描述：咳嗽持续 6 周，伴气促与胸痛。');change(s,'calm',5);text='医生 NPC 了解持续症状，建议胸部 CT 与基础检查；你仍可询问检查的负担。';}
 else{s.clues.push('患者最初仅说“有些咳嗽”。');text='医生 NPC 追问持续时间与危险信号。信息尚少，可以先看 X 线，也可补充描述后讨论 CT。';}break;
 case 'clarify':if(!done(s,'visit'))return fail('先就医。');mark(s,'describeFull');s.clues.push('补充描述：持续 6 周且有活动后气促。');text='你补充了被遗漏的症状。医生 NPC 更新评估，检查不再只围绕短期咳嗽。';break;
 case 'family':case 'private':if(done(s,'family')||done(s,'private'))return fail('本次沟通方式已选择，后续仍可接受支持。');change(s,'calm',id==='family'?12:5);change(s,'quality',id==='family'?6:2);text=id==='family'?'你告诉姐姐还没有确定诊断，她答应陪同检查；之后可选家属陪诊路径。':'你先独自整理信息，保留隐私；之后仍可向社工求助。';break;
 case 'communicate':
 if(!resultReady(s,'pathology')||!resultReady(s,'pleura')||!s.orders.find(o=>o.id==='pathology')?.result?.includes('检出腺癌')||!resultReady(s,'brain'))return fail('医生 NPC 不会在证据不足时宣布确诊。请完成取材、病理与分期评估。');mark(s,'diagnosis');s.phase='诊断沟通';change(s,'calm',-12);text='医生 NPC 用已取得的病理与影像解释：肺腺癌伴胸膜转移，IVA 期。你听到诊断后沉默了，可以先问目标，也可以问治疗怎样影响生活。';break;
 case 'askGoal':case 'askBurden':if(!done(s,'diagnosis'))return fail('先与医生沟通现有结果。');change(s,'calm',8);text=id==='askGoal'?'医生：“系统治疗主要希望控制疾病和改善症状，不能承诺治愈或生存时长。你可以参与每一步决定。”':'护士解释等待、疲劳、监测与交通安排。费用只是虚构游戏币，不是实际收费。你可以请求家属或社工支持。';break;
 case 'discuss':if(!done(s,'diagnosis'))return fail('先提交基于证据的诊断。');text='患者 NPC：“希望兼顾生活质量。了解免疫联合等选项后，我暂不接受免疫治疗；也想知道先做支持照护意味着什么。”';break;
 case 'chemo':case 'support':
 if(!done(s,'diagnosis')||!resultReady(s,'molecular')||!resultReady(s,'blood'))return fail('治疗决策需要诊断、分子信息和基础安全评估。');
 if(s.journey==='doctor'&&!done(s,'discuss')||s.journey==='patient'&&!done(s,'askGoal')&&!done(s,'askBurden'))return fail('先进行目标／负担与知情意愿讨论。');
 if(s.plan)return fail('已记录本章共同决定；后续复评保留重新讨论权利。');s.plan=id;s.phase='治疗准备';
 if(id==='support'){s.recoveryDay=s.day+3;text='共同选择先行支持照护并三天后复评：缓解症状、处理生活负担，暂缓抗肿瘤治疗。这不是与抗肿瘤疗效等同的方案；可用复评窗口重新讨论。';change(s,'quality',5);}
 else{s.preparedDay=s.day;text='在无已检出可靶向变异、知情暂拒免疫治疗的本例，选择标签支持的培美曲塞＋顺铂。护士 NPC 协同叶酸／B12 与支持准备，至少 7 天后审核；不提供处方剂量。';source='label';}break;
 case 'secondOpinion':if(!done(s,'diagnosis')||s.plan)return fail('确诊后、选择治疗前可申请第二意见。');if(!pay(s,200))return fail('预算不足，可领取援助。');for(let i=0;i<2;i++)Object.assign(s,tick(s,1));change(s,'calm',10);text='两天会诊整理同一组证据，增加了讨论时间与 200 游戏币负担；没有凭空出现更好的疗效。仍由你参与共同决定。';break;
 case 'readyPatient':case 'treat':
 if(id==='treat'&&s.journey!=='doctor')return fail('患者只能表达准备就绪，由医生 NPC 审核和护士 NPC 执行。');
 if(s.plan!=='chemo'||s.preparedDay===null||s.day-s.preparedDay<7)return fail('方案或至少 7 天的准备尚未完成。');if(s.treatmentDay!==null)return fail('已执行首剂，不能重复给药。');
 if(!safeToTreat(3.2,210,82)||s.event)return fail('不满足安全核对。');if(!pay(s,2520))return fail('预算不足，可联系大厅援助。');
 s.treatmentDay=s.day;s.phase='治疗体验';text='医生／护士 NPC 完成当日血常规、肾功能、非血液毒性、合并药物与支持核对，执行首剂。固定安全数据 ANC 3.2、血小板 210、CrCl 82。21 天周期；第 8、15 天监测。';source='label';change(s,'fatigue',12);break;
 case 'rest':case 'accompanied':
 if(!s.plan)return fail('先参与治疗决策。');if(done(s,'rest')||done(s,'accompanied'))return fail('本次生活安排已记录。');
 if(id==='accompanied'&&!done(s,'family'))return fail('尚未联系家属，可选择独立休息与社工支持。');
 if(!pay(s,id==='accompanied'?100:40))return fail('预算不足，可领取援助。');change(s,'fatigue',id==='rest'?-8:-5);change(s,'quality',id==='rest'?5:9);text=id==='rest'?'你安排独立休息并请社工协助家庭事务，保留自己的节奏。':'家属陪诊并安排往返交通；增加 100 游戏币负担，减少孤立感。';break;
 case 'assess':if(!s.event||s.resolved)return fail('当前没有未处理的紧急事件。');text='护士 NPC 上报 38.6℃、ANC 0.4。你评估发热伴中性粒细胞减少；不能等培养结果再处理。';source='nice';break;
 case 'urgent':case 'urgentConsult':
 if(!s.event||!done(s,'assess'))return fail('先完成临床评估。');if(done(s,'urgent')||done(s,'urgentConsult'))return fail('急诊流程已经启动。');if(!pay(s,id==='urgent'?850:1050))return fail('预算不足，可领取援助。');
 s.recoveryDay=s.day+2;text=id==='urgent'?'你启动院内急诊路径：NPC 完成采样、经验性抗感染与监测，不等待培养。两天后教学复查。':'你启动急诊并同步请求感染科会诊；采样、经验性抗感染与监测不延迟，额外会诊增加费用和记录。两天后教学复查。';source='nice';break;
 case 'callTeam':case 'callFamily':
 if(!s.event||s.resolved)return fail('关键症状出现时才能执行求助。');if(done(s,'callTeam')||done(s,'callFamily'))return fail('已联系医护，无需重复。');if(id==='callFamily'&&!done(s,'family'))return fail('未联系家属，可直接联系医护。');
 if(!pay(s,id==='callFamily'?950:850))return fail('预算不足，可领取援助。');s.recoveryDay=s.day+2;change(s,'calm',12);text=id==='callTeam'?'你向护士清楚报告发热与乏力。医生 NPC 立即评估并启动紧急检查和治疗，不由你开药。':'姐姐陪你立即联系急诊，未因等家人而延迟医疗；医生 NPC 启动紧急处理。你不必独自承担。';source='nice';break;
 case 'finishClinical':case 'finishImage':
 if(!s.resolved)return fail('需要完成本阶段安全与症状复评。');if(id==='finishImage'&&!resultReady(s,'followct'))return fail('选择影像复评需先申请并等待报告。');s.complete=true;s.phase='阶段结局';text=id==='finishClinical'?'你完成以症状、毒性和患者意愿为重点的首次复诊，并安排后续影像；没有强行把一次提前 CT 当作必经任务。':'你综合了影像、症状、毒性与意愿，完成首次复诊。微小尺寸变化不等于客观缓解。';text+=' 后续治疗保持复评，不自动执行下一周期。';break;
 case 'diaryEnd':if(!s.resolved||!done(s,'rest')&&!done(s,'accompanied'))return fail('先完成本阶段复查和生活安排。');s.complete=true;s.phase='我的下一步';text=done(s,'family')?'姐姐记下了下次预约，你写下：我可以提问，也可以求助。阶段结束不意味着治愈，生活仍由自己参与安排。':'你在日记写下：独立不等于独自承受。我学会报告症状，也为自己安排了支持与复评。';break;
 default:return fail('未知行动。');
 }
 mark(s,id);return record(s,before,id,text,source);
}
export function tick(before:JourneyState,days:number):JourneyState{
 const s=structuredClone(before);if(s.complete)return {...s,message:'本章已完成，时间不再推进。'};
 if(s.event&&!s.resolved&&s.recoveryDay===null)return {...s,message:'关键事件暂停：请主动评估或求助，不能等待跳过。'};
 for(let i=0;i<Math.min(365,Math.max(0,Math.floor(days)));i++){
 s.day++;let arrived=false;
 for(const o of s.orders)if(!o.ready&&o.due<=s.day){o.ready=true;o.result=o.id==='pathology'&&!resultReady(s,'pleura')?'标本不足，不能可靠分型；建议补充组织取材。':testById(o.id).result;record(s,before,'报告就绪：'+testById(o.id).name,o.result);arrived=true;}
 if(s.treatmentDay!==null&&!s.event&&s.day>=s.treatmentDay+7){s.event=true;s.phase=s.journey==='doctor'?'安全事件':'不再独自忍耐';s.recoveryDay=null;change(s,'fatigue',15);return record(s,before,'关键临床事件',s.journey==='doctor'?'护士 NPC 呼叫：患者发热、血细胞异常，请到病房评估。':'你突然发冷、明显乏力，护士测到 38.6℃。这不是应该独自忍耐的负担；请主动联系医护。','nice');}
 if(s.treatmentDay!==null&&s.day===s.treatmentDay+14)record(s,before,'周期第 15 天监测','护士 NPC 记录教学血常规：ANC 2.1，血小板 180；不能据此自动再次给药。','label');
 if(s.recoveryDay!==null&&s.day>=s.recoveryDay&&!s.resolved){s.resolved=true;s.phase=s.journey==='doctor'?'首次随访':'重新安排生活';record(s,before,'阶段复评',s.plan==='support'?'支持照护复评：生活安排已落实，尚未评价抗肿瘤疗效；需要继续讨论系统治疗。':'固定剧情复查：已退热，ANC 1.8、血小板 175、CrCl 78；后续治疗需重新审核。','label');return s;}
 if(arrived)return s;
 }
 return {...s,message:`已到第 ${s.day} 天；未发生的新报告不会提前显示。`};
}
export function nextDue(s:JourneyState){return Math.max(1,Math.min(7,...[...s.orders.filter(o=>!o.ready).map(o=>o.due-s.day),s.preparedDay!==null&&s.treatmentDay===null?s.preparedDay+7-s.day:Infinity,s.treatmentDay!==null&&!s.event?s.treatmentDay+7-s.day:Infinity,s.recoveryDay!==null&&!s.resolved?s.recoveryDay-s.day:Infinity].filter(n=>n>0)));}
export function objective(s:JourneyState):{text:string;place:string}{
 if(s.complete)return {text:'本章已完成：回看选择与当时掌握的证据',place:'office'};
 if(s.event&&!s.resolved)return {text:s.journey==='doctor'?'病房主动评估并选择紧急处理路径':'报告异常症状，直接求助或请已联系的家属陪同',place:'ward'};
 if(s.resolved)return {text:s.journey==='doctor'?'选择临床复诊，或补充影像后复诊':'安排休息或陪诊，把下一步写进日记',place:s.journey==='doctor'?'clinic':'ward'};
 if(s.plan)return {text:s.plan==='support'?'安排生活支持，等待约定复评':s.treatmentDay===null?'等待准备完成，到治疗室核对首剂':'安排生活支持，快进至监测事件',place:s.treatmentDay===null&&s.plan==='chemo'?'therapy':'ward'};
 if(done(s,'diagnosis'))return {text:'补齐分子与安全证据，讨论治疗目标、负担和意愿',place:'clinic'};
 if(s.journey==='patient'&&!done(s,'visit'))return {text:'决定就医时间，也可先和家人交流',place:'lobby'};
 return {text:s.journey==='doctor'?'自由问诊与选检；阅读证据，记录并修订诊断假设':'描述症状、参与检查，等待结果后请医生解释',place:'clinic'};
}
