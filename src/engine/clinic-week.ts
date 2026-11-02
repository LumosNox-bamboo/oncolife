import type {Campaign} from './v03-campaign';
import {campaignRun} from './v03-campaign';
import type {Command} from './v03-engine';
export type Upgrade='nurse'|'lounge'|'planner';
export type WeekState={week:number;shift:number;phase:'work'|'summary';actions:number;funds:number;trust:number;fatigue:number;done:string[];clinical:string[];resolved:boolean;upgrades:Upgrade[];souvenirs:string[];history:{week:number;shift:number;day:number;reward:number;work:number;clinical:number}[];journal:string[];message:string};
export type WeekCommand={type:'start'}|{type:'work';id:string}|{type:'choice';index:number}|{type:'end'}|{type:'buy';id:Upgrade}|{type:'next'};
export const jobs=[{id:'round',name:'和护士小夏交班',room:'病房',destination:'ward',text:'一起核对患者安排，减少交接遗漏。',trust:2,fatigue:1},{id:'family',name:'倾听家属的生活困难',room:'肿瘤科门诊',destination:'clinic',text:'把接送、请假与照顾家人的难题记进工作计划。',trust:2,fatigue:2},{id:'equipment',name:'协调检验设备维护',room:'检验科',destination:'lab',text:'整理非紧急工作顺序，维护团队协作。',trust:1,fatigue:1},{id:'rest',name:'和同事一起休息',room:'医院大厅',destination:'lobby',text:'短暂休息能缓解工作疲劳，照护团队也需要被照护。',trust:1,fatigue:-3}];
export const upgrades:Record<Upgrade,{name:string;cost:number;text:string}>={nurse:{name:'聘请门诊协作护士',cost:120,text:'下周起每天多 1 格经营行动。'},lounge:{name:'布置休息角',cost:90,text:'下周起每日额外恢复 2 点疲劳，大厅出现休息角。'},planner:{name:'升级团队日程板',cost:240,text:'每天有效临床工作奖励每项增加 5 科室币（每日最多 3 项）。'}};
export const stories=[
 {title:'第一天：小夏的交接本',text:'护士小夏担心新团队忙起来后遗漏患者的生活安排。她希望你一起设计交接方式。',options:[{label:'亲自整理交接本（1 行动）',ap:1,cost:0,trust:3,fatigue:1,result:'小夏把你列为可靠的交班伙伴。'},{label:'购买交接用品（20 科室币）',ap:0,cost:20,trust:1,fatigue:0,result:'用品到位，留出了今日沟通时间。'}]},
 {title:'第二天：家属的末班车',text:'陪诊家属担心错过回家的车。检查并不会因此被取消，但团队需要帮助安排返程。',options:[{label:'协调返程信息（1 行动）',ap:1,cost:0,trust:3,fatigue:2,result:'家属拿到了路线和联系方式，愿意说出更多生活顾虑。'},{label:'使用交通关怀金（25 科室币）',ap:0,cost:25,trust:2,fatigue:0,result:'科室承担了虚构交通支持费用。'}]},
 {title:'第三天：设备维护通知',text:'检验团队希望整理设备维护后的预约通知。必要急诊检查仍走原流程。',options:[{label:'协助核对通知（1 行动）',ap:1,cost:0,trust:2,fatigue:1,result:'检验同事感谢你把行政工作分担了一部分。'},{label:'申请行政协作（20 科室币）',ap:0,cost:20,trust:1,fatigue:-1,result:'行政同事接手通知，你得以喘口气。'}]},
 {title:'第四天：午休还是加班',text:'你发现自己越来越疲劳，小夏也想和你聊聊第一次值班的经历。',options:[{label:'一起午休（1 行动）',ap:1,cost:0,trust:2,fatigue:-4,result:'小夏讲起她曾经的紧张，你们的距离近了些。'},{label:'整理明日安排（1 行动）',ap:1,cost:0,trust:3,fatigue:2,result:'准备工作更充分，但今晚需要好好休息。'}]},
 {title:'第五天：患者想保留的生活',text:'一位患者希望继续参加社区合唱。你们需要讨论交通、体力和复诊安排，不承诺疗效。',options:[{label:'讨论可执行的生活计划（1 行动）',ap:1,cost:0,trust:3,fatigue:1,result:'患者觉得自己的生活目标被认真对待。'},{label:'请社工协作（30 科室币）',ap:0,cost:30,trust:2,fatigue:0,result:'社工加入生活支持；并未替代医学评估。'}]},
 {title:'第六天：临时调班',text:'同事家里有事，需要有人帮忙整理非紧急的行政交接。',options:[{label:'分担交接（2 行动）',ap:2,cost:0,trust:4,fatigue:2,result:'同事记住了这次支持，也提醒你不要长期透支。'},{label:'安排临时行政支持（40 科室币）',ap:0,cost:40,trust:1,fatigue:0,result:'支援按时到位，团队不必超时承担行政工作。'}]},
 {title:'第七天：给团队的一封信',text:'第一轮七天即将结束。小夏邀请大家写下最想保留和最想改变的一件事。',options:[{label:'组织团队复盘（1 行动）',ap:1,cost:0,trust:3,fatigue:1,result:'大家留下了下一周的共同目标。'},{label:'准备感谢茶点（20 科室币）',ap:0,cost:20,trust:2,fatigue:-2,result:'一次轻松的聚会，让这周有了温暖的收尾。'}]}
];
export function initialWeek():WeekState{return {week:1,shift:1,phase:'work',actions:3,funds:60,trust:0,fatigue:0,done:[],clinical:[],resolved:false,upgrades:[],souvenirs:[],history:[],journal:[],message:'去病房和小夏交班，完成今日故事后结束工作日。科室币只用于经营，不是医疗预算。'};}
export function clinicalProgress(before:Campaign,after:Campaign,cmd:Command){const w=after.week;if(!w||w.phase!=='work')return after;const a=before.patients[before.activeId]!,b=after.patients[before.activeId]!;let key='';if(cmd.type==='clue'&&b.flags.length>a.flags.length)key=`${b.caseId}:interview`;if((cmd.type==='order'||cmd.type==='orderBatch')&&b.orders.length>a.orders.length)key=`${b.caseId}:orders`;if(cmd.type==='ack'&&b.events.filter(e=>e.completedAt!==undefined).length>a.events.filter(e=>e.completedAt!==undefined).length)key=`${b.caseId}:review`;if(cmd.type==='adverse'&&b.flags.length>a.flags.length)key=`${b.caseId}:urgent`;if(key&&!w.clinical.includes(key))w.clinical.push(key);return after;}
export function weekRun(before:Campaign,command:WeekCommand,room:string):Campaign{
 let c=structuredClone(before);if(c.journey!=='doctor')return c;if(command.type==='start'){c.week??=initialWeek();return c;}const w=c.week;if(!w)return c;
 const tell=(message:string)=>{w.message=message;return c;};
 if(command.type==='buy'){if(w.phase!=='summary')return tell('请在周末结算后购买升级。');const u=upgrades[command.id];if(w.upgrades.includes(command.id)||w.funds<u.cost)return tell('已拥有该升级，或科室币不足。');w.funds-=u.cost;w.upgrades.push(command.id);w.journal.push(`第 ${w.week} 周：${u.name}`);return tell('升级已安装：'+u.text);}
 if(command.type==='next'){if(w.phase!=='summary')return tell('先完成七天再开始新一周。');w.week++;w.shift=1;w.phase='work';w.done=[];w.clinical=[];w.resolved=false;w.actions=3+Number(w.upgrades.includes('nurse'))-(w.fatigue>=8?1:0);return tell('新一周开始，团队升级已生效；临床预约和患者进度继续。');}
 if(w.phase!=='work')return tell('本周已结算，可升级科室或开始下一周。');
 if(command.type==='work'){const job=jobs.find(j=>j.id===command.id);if(!job)return c;if(room!==job.room)return tell('请先前往'+job.room+'，再执行这项工作。');if(w.done.includes(job.id)||w.actions<1)return tell('今日已完成，或行动不足。');w.actions--;w.done.push(job.id);w.trust+=job.trust;w.fatigue=Math.max(0,w.fatigue+job.fatigue);return tell(job.text);}
 if(command.type==='choice'){const option=command.index===2?{label:'推迟非紧急行政安排',ap:0,cost:0,trust:-1,fatigue:2,result:'非紧急行政工作改期，团队信任下降，后续协调增加疲劳；医疗安排不变。'}:stories[w.shift-1].options[command.index];if(!option||w.resolved)return tell('今日故事已处理。');if(w.actions<option.ap||w.funds<option.cost)return tell('行动或科室币不足，可以选择推迟非紧急行政安排。');if(!w.done.length&&w.actions-option.ap<1)return tell('请先完成一项院内工作，或选择不占用行动的方案。');w.actions-=option.ap;w.funds-=option.cost;w.trust+=option.trust;w.fatigue=Math.max(0,w.fatigue+option.fatigue);w.resolved=true;w.journal.push(`第 ${w.week} 周第 ${w.shift} 天：${option.result}`);return tell(option.result);}
 // No clinical operation is charged an action point. End-of-day cannot skip due clinical events.
 if(!w.resolved)return tell('请先处理今日团队故事；保留所需行动或选择行政支持。');
 if(!w.done.length)return tell('至少完成一项院内工作再结束当天。');
 const moved=campaignRun(c,{type:'advance',days:1});if(moved.day===c.day)return tell('仍有到期报告或临床事件，先处理后再下班；急救不消耗经营行动。');
 c=moved;const n=c.week!;const reward=30+n.done.length*5+Math.min(3,n.clinical.length)*(n.upgrades.includes('planner')?15:10);n.funds+=reward;n.history.push({week:n.week,shift:n.shift,day:before.day,reward,work:n.done.length,clinical:n.clinical.length});
 n.fatigue=Math.max(0,n.fatigue-2-(n.upgrades.includes('lounge')?2:0));if(n.trust>=12&&!n.souvenirs.includes('小夏的手写便签'))n.souvenirs.push('小夏的手写便签');
 if(n.shift===7){n.phase='summary';if(n.history.filter(h=>h.week===n.week).every(h=>h.clinical>0)&&!n.souvenirs.includes('认真倾听纪念章'))n.souvenirs.push('认真倾听纪念章');n.message=`第 ${n.week} 周完成！本次获得 ${reward} 科室币。可在周末升级科室，再开始下一周。`;}
 else{n.shift++;n.done=[];n.clinical=[];n.resolved=false;n.actions=3+Number(n.upgrades.includes('nurse'))-(n.fatigue>=8?1:0);n.message=`下班结算 +${reward} 科室币。第 ${n.shift} 天开始${n.fatigue>=8?'；疲劳较高，经营行动减少 1 格，可安排休息':''}。`;}
 return c;
}
