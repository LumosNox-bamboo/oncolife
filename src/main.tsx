import {useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useGame} from './engine/store';
import {Journey,objective} from './engine/journey';
import {readSlot} from './engine/persistence';
import {startGame,activeScene,controls} from './world/Hospital';
import {objects} from './world/map';
import {toggleAudio} from './ui/audio';
import {JourneyPanel} from './ui/JourneyPanel';
import './ui/style.css';
function App(){const ref=useRef<HTMLDivElement>(null);const g=useGame(),s=g.state;const [sound,setSound]=useState(false),[travel,setTravel]=useState('clinic'),[collapsed,setCollapsed]=useState(false),[seconds,setSeconds]=useState(0);const target=objective(s);
 useEffect(()=>{const game=startGame(ref.current!);return()=>game.destroy(true);},[]);
 useEffect(()=>{const t=setInterval(()=>setSeconds(v=>v+1),1000);return()=>clearInterval(t);},[]);
 useEffect(()=>{const f=(e:KeyboardEvent)=>{if(e.key==='Escape')g.open(null);};window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f);},[g.open]);
 const enter=(j:Journey)=>{g.enter(j);activeScene?.travel('lobby');};
 return <main className={s.journey}><header><div className="brand"><span className="logo">✚</span><div><b>OncoLife</b><small>晴光医院 · 两种视角，一份关怀</small></div><span className="version">V0.2</span></div><div className="toplinks"><button onClick={g.mainMenu}>主菜单</button><button onClick={()=>g.open('help')}>操作手册</button><button onClick={()=>{toggleAudio(!sound);setSound(!sound);}}>环境音 {sound?'开':'关'}</button><button onClick={g.save}>存档</button></div></header>
 <section className="status"><div><span className="eyebrow">第 {s.day} 天 · {s.phase}</span><strong>{g.room}</strong><small>院内 08:{String(Math.floor(seconds/60)%60).padStart(2,'0')} · 临床时间独立</small></div><div className="mission"><button className="textbutton" onClick={()=>setCollapsed(!collapsed)}>{collapsed?'展开':'折叠'}任务提示</button>{!collapsed&&<strong>{target.text}</strong>}</div><div className="identity"><span className={'avatar '+s.role}>✚</span><div><b>{s.journey==='doctor'?'医生线 · 临床判断':'患者线 · 我的旅程'}</b><small>{s.mode==='learn'?'学习预算不限':`预算 ${s.budget} 币`} · 已支出 {s.spent} 币</small></div></div></section>
 <section className="gamewrap"><div id="game" ref={ref} aria-label="可探索的像素医院"/><div className="mapnote">自由探索 · E 互动 <span>医生与患者独立存档 · 其他职业由 NPC 协作</span></div></section>
 <nav className="travel"><label>院内导航 <select aria-label="旅行目的地" value={travel} onChange={e=>setTravel(e.target.value)}>{objects.map(o=><option value={o.id} key={o.id}>{o.room}</option>)}</select></label><button onClick={()=>activeScene?.travel(travel)}>快速旅行</button><button onClick={()=>activeScene?.travel(travel,true)}>自动寻路</button><button onClick={()=>activeScene?.travel(target.place)}>返回任务地点</button><button onClick={()=>g.open('record')}>{s.journey==='doctor'?'病历 / 决策时间线':'日记 / 预约'}</button></nav>
 <section className="bottom"><div><span className="dot"/> {g.notice}<small>虚构病例 · 非临床建议 · {s.journey==='doctor'?'医生决策、NPC 执行':'患者表达、NPC 诊疗'}</small></div><div className="time"><button onClick={()=>g.time(1)}>＋1 天</button><button onClick={()=>g.time(7)}>＋1 周</button><button onClick={()=>g.time('next')}>快进至结果 / 事件</button></div></section>
 {s.journey==='patient'&&<div className="wellbeing"><span>平静感 {s.experience.calm}</span><span>疲劳 {s.experience.fatigue}</span><span>经济压力 {s.experience.pressure}</span><span>生活感受 {s.experience.quality}</span><small>0–100 教学叙事值；不是医学量表或结局预测</small></div>}
 <div className={'toast '+(s.event&&!s.resolved?'alert':'')} role="status">{s.message}</div>
 <div className="touch"><div>{[['↑',0,-1],['←',-1,0],['↓',0,1],['→',1,0]].map(([l,x,y])=><button key={l} aria-label={'移动'+l} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);controls.x=Number(x);controls.y=Number(y);}} onPointerUp={()=>{controls.x=0;controls.y=0;}} onPointerCancel={()=>{controls.x=0;controls.y=0;}}>{l}</button>)}</div><button onClick={()=>{controls.interact=true;}}>互动 E</button></div>
 {g.menu?<div className="overlay journey-menu"><section className="modal" role="dialog" aria-label="选择旅程"><small>ONCOLIFE / V0.2</small><h1>同一座医院，<br/>两段属于自己的旅程。</h1><p>做出判断，也学会倾听。保留自由探索，让每次选择都有来由。</p><div className="journey-choices"><button onClick={()=>enter('doctor')}><span>✚</span><h2>医生模式</h2><small>Clinical Journey</small><p>询问线索、自主选检、修订假设。<br/>从尚不确定，到有依据的共同决策。</p><b>{readSlot('doctor').log.length?'继续医生存档':'开始医生旅程'} →</b></button><button onClick={()=>enter('patient')}><span>☀</span><h2>患者模式</h2><small>Patient Journey</small><p>从症状出现开始，表达顾虑、<br/>参与治疗，也重新安排生活。</p><b>{readSlot('patient').log.length?'继续患者存档':'开始患者旅程'} →</b></button></div><small>两条主线独立保存，无需职业切换。护士、家属与其他医生由 NPC 扮演。</small></section></div>:g.panel&&<JourneyPanel key={s.journey+g.panel}/>}
 {!g.menu&&!s.log.length&&<button className="mode" onClick={g.mode}>预算设置：{s.mode==='learn'?'学习模式（不限）':'临床模式（9000 币）'} · 点击切换</button>}
 <footer>ONCOLIFE <span>在知识与关怀之间，练习每一次选择。</span><small>原创像素美术 · 本地保存</small></footer></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
