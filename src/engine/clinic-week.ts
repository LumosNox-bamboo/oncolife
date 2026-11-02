import type {Campaign} from './v03-campaign';
import {campaignRun} from './v03-campaign';
import type {Command} from './v03-engine';
export type Upgrade='nurse'|'lounge'|'planner';
export type WeekState={week:number;shift:number;phase:'work'|'summary';actions:number;funds:number;trust:number;fatigue:number;done:string[];clinical:string[];resolved:boolean;upgrades:Upgrade[];souvenirs:string[];history:{week:number;shift:number;day:number;reward:number;work:number;clinical:number}[];journal:string[];message:string};
export type WeekCommand={type:'start'}|{type:'end'}|{type:'buy';id:Upgrade}|{type:'next'};
export const upgrades:Record<Upgrade,{name:string;cost:number;text:string}>={nurse:{name:'聘请门诊协作护士',cost:120,text:'小夏帮你找到已有报告的患者，直接带你去查看。'},lounge:{name:'买一张新沙发',cost:90,text:'大厅里放上沙发和盆栽，现在就能看到。'},planner:{name:'升级团队日程板',cost:240,text:'办公室添一块日程板，记录科室的变化。'}};
export function initialWeek():WeekState{return {week:1,shift:1,phase:'work',actions:3,funds:60,trust:0,fatigue:0,done:[],clinical:[],resolved:false,upgrades:[],souvenirs:[],history:[],journal:[],message:'医生，有位病人等你。先去门诊聊聊；等报告的时候，可以接下一位。'};}
// A patient encounter earns a fixed fictional stipend, never a fee per test.
export function seenToday(w:WeekState){return [...new Set(w.clinical.filter(k=>!k.endsWith(':orders')).map(k=>k.split(':')[0]))];}
export function clinicalProgress(before:Campaign,after:Campaign,cmd:Command){const w=after.week;if(!w||w.phase!=='work')return after;const a=before.patients[before.activeId]!,b=after.patients[before.activeId]!;let seen=false;
 if(cmd.type==='clue'&&b.flags.length>a.flags.length)seen=true;
 if(cmd.type==='ack'&&b.events.filter(e=>e.completedAt!==undefined).length>a.events.filter(e=>e.completedAt!==undefined).length)seen=true;
 if(cmd.type==='adverse'&&b.flags.length>a.flags.length)seen=true;
 if(seen&&!seenToday(w).includes(b.caseId))w.clinical.push(`${b.caseId}:visit`);return after;
}
export function weekRun(before:Campaign,command:WeekCommand,_room:string):Campaign{
 let c=structuredClone(before);if(c.journey!=='doctor')return c;if(command.type==='start'){c.week??=initialWeek();return c;}const w=c.week;if(!w)return c;
 const tell=(message:string)=>{w.message=message;return c;};
 if(command.type==='buy'){const u=upgrades[command.id];if(w.upgrades.includes(command.id)||w.funds<u.cost)return tell('已经买过了，或存下的钱还不够。');w.funds-=u.cost;w.upgrades.push(command.id);w.journal.push(`第 ${w.week} 周：${u.name}`);return tell('升级已安装：'+u.text);}
 if(command.type==='next'){if(w.phase!=='summary')return c;if(w.shift===7){w.week++;w.shift=1;}else w.shift++;w.phase='work';w.done=[];w.clinical=[];w.resolved=false;w.actions=3+Number(w.upgrades.includes('nurse'))-(w.fatigue>=8?1:0);return tell('早上好，医生。昨天的患者和预约都在，今天继续。');}
 if(w.phase!=='work')return tell('已经下班了，点第二天上班继续。');
 // Leaving work cannot skip a report or urgent event that is already due.
 const moved=campaignRun(c,{type:'advance',days:1});if(moved.day===c.day)return tell('还有报告或病情变化等你处理。先看完，再下班。');
 c=moved;const n=c.week!;const visits=seenToday(n).length;const reward=visits*40;n.funds+=reward;
 n.history.push({week:n.week,shift:n.shift,day:before.day,reward,work:0,clinical:visits});
 n.phase='summary';n.message=`今天看了 ${visits} 位病人，收入 ${reward} 游戏币。现在有 ${n.funds} 游戏币。${n.upgrades.includes('lounge')?'明天大厅的新沙发还等着你。':n.funds>=90?'可以买一张新沙发了。':`离新沙发还差 ${90-n.funds} 游戏币。`}`;
 return c;
}
