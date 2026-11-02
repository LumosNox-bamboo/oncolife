import {useV03} from '../engine/v03-store';
import {seenToday,upgrades,Upgrade} from '../engine/clinic-week';
import {nextPatientId} from '../engine/v03-campaign';
import {nextEvent} from '../engine/v03-clock';
import {cases} from '../medical/cases';
import {activeScene} from '../world/Hospital';
export function ClinicWeek(){const g=useV03(),pool=g.campaign,w=pool?.week;
 const visit=()=>{activeScene?.travel('clinic');g.open('clinic');};
 const report=pool&&Object.values(pool.patients).find(s=>{const e=nextEvent(s);return e&&e.availableAt<=pool.day;});
 const next=pool&&nextPatientId(pool);
 return <div className="overlay"><section className="modal" role="dialog" aria-label="我的小科室"><div className="modalhead"><h2>我的小科室</h2><button onClick={()=>g.open(null)}>返回医院 ×</button></div>{!w?<><p>每天接诊，等报告时看看下一位。下班攒下的钱，可以给医院添点东西。</p><button onClick={()=>g.week({type:'start'})}>开始上班</button></>:<>
 <div className="week-stats"><b>存钱罐：{w.funds} 游戏币</b><span>今天看过 {seenToday(w).length} 位病人</span></div>
 {w.phase==='work'?<><h3>医生，有位病人等你。</h3><p>先聊聊哪里不舒服。检查开好后，不用守着等报告，可以接下一位。</p><div className="actions"><button onClick={visit}>去门诊看病人</button><button disabled={!next} onClick={()=>{if(next){g.dispatch({type:'case',caseId:next});visit();}}}>{next?'请下一位进来':'今天所有病例都已接诊'}</button>{w.upgrades.includes('nurse')&&<button disabled={!report} onClick={()=>{if(report){g.dispatch({type:'case',caseId:report.caseId});activeScene?.travel('office');g.open('record');}}}>{report?`小夏：${cases[report.caseId].title.split(' · ')[0]}有事情等你看`:'小夏：现在没有到期的报告或预约'}</button>}<button onClick={()=>g.week({type:'end'})}>下班，明天再来</button></div></>:<><h3>今天辛苦了，医生。</h3><p>{w.message}</p><button onClick={()=>{g.week({type:'next'});g.open(null);}}>第二天上班</button></>}
 <details><summary>给科室添点东西</summary><div className="testgrid">{Object.entries(upgrades).map(([id,u])=><article className="testcard" key={id}><h3>{u.name}</h3><p>{u.text}</p><button disabled={w.upgrades.includes(id as Upgrade)||w.funds<u.cost} onClick={()=>g.week({type:'buy',id:id as Upgrade})}>{w.upgrades.includes(id as Upgrade)?'已经添置':`${u.name} · ${u.cost} 游戏币`}</button></article>)}</div></details>
 {w.phase==='work'&&<div className="feedback" role="status">{w.message}</div>}<small>每位当天实际问诊或查看报告的患者提供 40 游戏币工作津贴，同一天只算一次。多开检查不会多赚钱。</small>
 <details><summary>看看以前的收支</summary>{w.history.map(h=><p key={h.week+':'+h.shift}>第 {h.day} 天：看了 {h.clinical} 位，收入 {h.reward} 游戏币</p>)}{w.journal.map((j,i)=><p key={i}>{j}</p>)}</details></>}
 </section></div>;
}
