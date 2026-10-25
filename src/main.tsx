import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useGame} from './engine/store';
import {Action,Role,has,task} from './engine/model';
import {sources,cards,patient} from './medical/knowledge';
import {startGame,controls} from './world/Hospital';
import {toggleAudio} from './ui/audio';
import './ui/style.css';
const labels:Record<Role,string>={doctor:'肿瘤科医生',nurse:'护士',patient:'患者'};
const menus:Record<string,{title:string;intro:string;actions:[Action,string][]}>={
 clinic:{title:'肿瘤科门诊',intro:'林晓禾坐在窗边，手里握着旧检查单。“医生，我最担心的是没法照顾家里。”',actions:[['talk','与林晓禾交谈'],['history','采集病史与体检'],['preference','表达治疗偏好（患者）'],['diagnose','确认诊断与分期'],['targetPlan','讨论直接靶向治疗'],['surgeryPlan','讨论根治性手术'],['immunoPlan','讨论免疫联合治疗'],['plan','共同选择培美曲塞＋顺铂'],['followup','完成随访与后续决策']]},
 lab:{title:'检验科',intro:'申请检查后，报告将随临床时间推进生成。异常期需要专门的感染评估与恢复复查。',actions:[['blood','申请血常规与肾功能'],['biopsy','申请病理与分子检测'],['infection','感染检查与培养采样'],['recheck','申请恢复复查']]},
 scan:{title:'影像科',intro:'分期影像与病理证据共同形成诊断。影像变化不能直接换算为生存获益。',actions:[['ct','申请分期影像'],['followct','申请随访影像']]},
 ward:{title:'病房 · 03 床',intro:'床旁观察能发现需要主动处理的变化。先观察，再上报、评估并执行经审核的处置。',actions:[['talk','与患者交谈'],['symptom','表达当前症状（患者）'],['vitals','测量生命体征'],['report','上报异常（护士）'],['assess','评估发热与血细胞异常'],['urgent','开立紧急处置'],['care','执行紧急医嘱（护士）'],['comfort','支线：倾听家庭照护顾虑']]},
 office:{title:'医生办公室',intro:'记录每一个依据，也记录每一个不确定性。以下知识卡可查阅参考来源。',actions:[['consult','申请多学科会诊']]},
 therapy:{title:'治疗室',intro:'首次治疗前完成准备并等待 7 天，更新血液报告；医生当日审核后，由护士执行。',actions:[['prepare','确认治疗前准备'],['review','审核当日治疗医嘱'],['infuse','执行首周期治疗（护士）']]}
};
function App(){const ref=useRef<HTMLDivElement>(null);const g=useGame();const s=g.state;const [sound,setSound]=useState(false);const [walkClock,setWalkClock]=useState(0);const [restart,setRestart]=useState(false);
 useEffect(()=>{const game=startGame(ref.current!);return()=>game.destroy(true);},[]);
 useEffect(()=>{const t=setInterval(()=>setWalkClock(c=>c+1),1000);return()=>clearInterval(t);},[]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')g.open(null);};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[g.open]);
 const menu=g.panel?menus[g.panel]:null;const source=sources.find(x=>x.id===s.source);
 return <main><header><div className="brand"><span className="logo">✚</span><div><b>OncoLife</b><small>晴光医院 · 肺癌诊疗故事</small></div><span className="version">V0.1</span></div><div className="toplinks"><button onClick={()=>g.open('help')}>操作手册</button><button onClick={()=>{toggleAudio(!sound);setSound(!sound);}}>环境音 {sound?'开':'关'}</button><button onClick={g.save}>存档</button></div></header>
 <section className="status"><div><span className="eyebrow">晴光 · 第 {s.day} 天</span><strong>{g.room}</strong><small>院内 {String(8+Math.floor(walkClock/3600)%12).padStart(2,'0')}:{String(Math.floor(walkClock/60)%60).padStart(2,'0')} · 行走不推进临床日期</small></div><div className="mission"><span className="eyebrow">{s.phase} / 主线任务</span><strong>{task(s)}</strong></div><div className="identity"><span className={'avatar '+s.role}>✚</span><div><b>{labels[s.role]}</b><small>{s.mode==='learn'?'学习模式 · 无限预算':`临床模式 · ${s.budget} 游戏币`}</small></div></div></section>
 <section className="gamewrap"><div ref={ref} id="game" aria-label="可探索的像素医院"/><div className="mapnote">晴光医院导览 <span>北：门诊 / 检验 / 影像　 南：病房 / 办公室 / 治疗</span></div></section>
 <section className="bottom"><div><span className="dot"/> {g.notice}<small>虚构病例 · 医学教育原型 · 不用于真实诊疗</small></div><div className="time"><span>临床时间</span><button onClick={()=>g.time(1)}>＋1 天</button><button onClick={()=>g.time(7)}>＋1 周</button><button onClick={()=>g.time('next')}>下一次预约 →</button><button onClick={()=>g.open('record')}>病历 / 时间线</button></div></section>
 <div className={'toast '+(s.event&&!s.resolved?'alert':'')} role="status">{s.message}</div>
 <div className="touch"><div>{[['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]].map(([l,x,y])=><button key={l} aria-label={'移动'+l} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);controls.x=Number(x);controls.y=Number(y);}} onPointerUp={()=>{controls.x=0;controls.y=0;}} onPointerCancel={()=>{controls.x=0;controls.y=0;}}>{l}</button>)}</div><button onClick={()=>{controls.interact=true;}}>互动 E</button></div>
 {g.panel&&<div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-label={menu?.title||'医院服务'}><div className="modalhead"><div><small>晴光医院 / {labels[s.role]}</small><h2>{menu?.title||({lobby:'欢迎来到晴光',record:'林晓禾 · 病例与时间线',help:'第一天，先认识医院'}[g.panel])}</h2></div><button autoFocus onClick={()=>g.open(null)}>返回医院 ×</button></div>
 {g.panel==='lobby'&&<><p>在这里换一个视角。同一位患者、同一段治疗历程，所有身份共享世界状态。</p><div className="roles">{(Object.keys(labels) as Role[]).map(r=><button className={s.role===r?'selected':''} key={r} onClick={()=>g.role(r)}>{labels[r]}<small>{r==='doctor'?'诊断 · 医嘱 · 评估':r==='nurse'?'观察 · 上报 · 执行':'意愿 · 安排 · 体验'}</small></button>)}</div><p>当前模式：{s.mode==='learn'?'学习':'临床'}。临床模式为有限虚构预算，学习模式可自由重试。</p><button onClick={()=>setRestart(!restart)}>重新开始 / 更换模式</button>{restart&&<div className="warning">将覆盖当前本地病例进度。<button onClick={()=>{g.reset('learn');setRestart(false);}}>确认：新建学习病例</button><button onClick={()=>{g.reset('clinical');setRestart(false);}}>确认：新建临床病例</button></div>}<button onClick={g.aid}>领取一次教学援助</button><p>挑战模式 🔒 · 多患者内容尚未开放</p></>}
 {menu&&<><p className="intro">{menu.intro}</p><div className="actions">{menu.actions.map(([a,l])=><button key={a} onClick={()=>g.dispatch(a)}><span>{has(s,a)?'✓':'＋'}</span>{l}</button>)}</div></>}
 {g.panel==='help'&&<><p>WASD / 方向键移动，走到目标旁按 E 或点击。Esc 关闭窗口。房间门在中央走廊两侧；家具和墙壁不能穿过。触屏使用底部方向键。</p><ol><li>门诊交谈、采集病史；大厅切换患者，回门诊表达偏好。</li><li>切回医生，在检验科申请血液、病理分子检测，在影像科申请分期检查。推进 2 天后查报告。</li><li>门诊确认诊断 → 办公室会诊 → 门诊制定方案 → 治疗室准备。</li><li>推进 7 天，重新申请血液并推进 1 天；治疗室医生审核，当日切护士执行。</li><li>推进一周触发异常。病房护士测量、上报；医生评估，检验科采样，回病房开立紧急处置；护士执行。</li><li>医生在检验科申请恢复复查，推进 2 天；影像科申请随访，推进 2 天，门诊完成病例。</li></ol><p>时间快进遇到关键事件会立即停止。周期第 1、8、15 天的血液监测均有记录。只有首周期可以执行，后续治疗停留在复评计划。</p></>}
 {(g.panel==='record'||g.panel==='clinic'||g.panel==='ward')&&<article><h3>{patient.name} · {patient.age} 岁 · {patient.sex}</h3><p>{patient.history}</p><p>{patient.symptoms}</p><p>{patient.exam}</p><p>{patient.wish}</p><small>{patient.finance} 累计负担：{s.spent} 游戏币；已等待 {s.day-1} 天。</small></article>}
 {['lab','scan','record','therapy'].includes(g.panel)&&<article><h3>检查报告与预约</h3>{s.reports.length===0?<p>暂无申请，请到检查科室开单。</p>:s.reports.map((r,i)=><div className="report" key={i}><b>{r.ready?'报告已就绪':'等待中'} · 第 {r.due} 天</b><p>{r.ready?r.text:'已排入队列，推进临床时间后查看。'}</p></div>)}{s.treatmentDay!==null&&<p>首剂：第 {s.treatmentDay} 天；计划血液监测：第 {s.treatmentDay+7}、{s.treatmentDay+14} 天；原定下一周期复评：第 {s.treatmentDay+21} 天。异常后暂停后续给药。</p>}</article>}
 <div className="feedback"><b>决策反馈</b><p>{s.message}</p>{source&&<small>依据：<a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> · {source.version}</small>}</div>
 {(g.panel==='office'||g.panel==='record'||s.phase==='完成')&&<><h3>临床知识卡 · {(s.phase==='完成'?cards.length:Math.min(cards.length,1+Math.floor(s.flags.length/4)))} 张已解锁</h3>{cards.slice(0,s.phase==='完成'?cards.length:Math.min(cards.length,1+Math.floor(s.flags.length/4))).map(c=><details key={c.title}><summary>{c.title}</summary><p>{c.text}</p><a href={sources.find(x=>x.id===c.source)?.url} target="_blank" rel="noreferrer">查阅来源</a></details>)}<details><summary>医学依据、地区范围与模拟边界</summary>{sources.map(x=><p key={x.id}><a href={x.url} target="_blank" rel="noreferrer">{x.name}</a>：{x.version}。{x.scope}</p>)}<p>确定性规则：权限与标签用药门槛。概率事件：本版未实现。虚构事件：固定发热、恢复时间、影像变化、费用与报告时长。紧急处置不提供可执行处方。</p></details></>}
 {s.phase==='完成'&&<article className="success"><h3>一段照护，告一段落。</h3><p>你完成了诊断、共同决策、首周期治疗、异常处理和随访。正确处理并不等于肿瘤治愈。</p><p>教学反馈：{has(s,'comfort')?'已关注家庭照护负担。':'下次可以在病房倾听家庭照护顾虑。'} 严重毒性后未自动继续用药；后续方案交由个体化复评。</p><p>本次累计 {s.day} 天，支出 {s.spent} 虚构游戏币，记录 {s.log.length} 条事件。</p></article>}
 {g.panel==='record'&&<><h3>完整治疗时间线</h3><ol className="timeline">{s.log.map((l,i)=><li key={i}><b>第 {l.day} 天</b> {l.text}</li>)}</ol></>}
 </section></div>}
 <footer>ONCOLIFE <span>在知识与关怀之间，练习每一次选择。</span><small>原创程序化像素美术 · 本地保存</small></footer>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
