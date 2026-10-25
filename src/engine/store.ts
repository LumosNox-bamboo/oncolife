import {create} from 'zustand';
import {act,advance,nextAppointment} from './clinical';
import {Action,initial,Mode,Role,State} from './model';
const KEY='oncolife-v1';
export function load():State{try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s?.version===1&&Array.isArray(s.flags)&&Array.isArray(s.reports)&&Array.isArray(s.log)&&['doctor','nurse','patient'].includes(s.role)&&Number.isFinite(s.day))return s;}catch{}return initial();}
function save(s:State){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch{return false;}}
type Store={state:State;room:string;panel:string|null;notice:string;dispatch:(a:Action)=>void;time:(d:number|'next')=>void;role:(r:Role)=>void;reset:(m:Mode)=>void;open:(p:string|null)=>void;setRoom:(r:string)=>void;save:()=>void;aid:()=>void};
export const useGame=create<Store>((set,get)=>{
 const update=(state:State)=>{const ok=save(state);set({state,notice:ok?'已自动存档':'存储不可用，请勿关闭本页'});};
 return {state:load(),room:'医院大厅',panel:null,notice:'本地存档就绪',dispatch:a=>update(act(get().state,a)),time:d=>update(advance(get().state,d==='next'?nextAppointment(get().state):d)),role:role=>update({...get().state,role,message:'身份已切换；病例与时间保持一致。'}),reset:m=>update(initial(m)),open:panel=>set({panel}),setRoom:room=>set({room}),save:()=>set({notice:save(get().state)?'手动存档成功':'存档失败：浏览器存储不可用'}),aid:()=>{const s=get().state;if(s.flags.includes('aid'))return update({...s,message:'本病例教学援助已领取。'});update({...s,budget:s.budget+3000,flags:[...s.flags,'aid'],log:[...s.log,{day:s.day,text:'领取一次教学援助 3000 游戏币。'}],message:'获得 3000 游戏币教学援助。'});}};
});
