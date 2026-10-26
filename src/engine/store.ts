import {create} from 'zustand';
import {Command,Journey,JourneyState,command,freshJourney,nextDue,tick} from './journey';
import {readSlot,writeSlot} from './persistence';
type Store={state:JourneyState;menu:boolean;room:string;panel:string|null;notice:string;dispatch:(c:Command)=>void;time:(d:number|'next')=>void;enter:(j:Journey)=>void;reset:()=>void;open:(p:string|null)=>void;setRoom:(r:string)=>void;save:()=>void;mainMenu:()=>void;mode:()=>void};
export const useGame=create<Store>((set,get)=>{
 const update=(state:JourneyState)=>set({state,notice:writeSlot(state)?'独立主线已自动保存':'保存失败，请导出记录或保持页面打开'});
 return {state:freshJourney('doctor'),menu:true,room:'医院大厅',panel:null,notice:'两条主线独立保存；V0.1 旧档保留',
 dispatch:c=>update(command(get().state,c)),time:d=>update(tick(get().state,d==='next'?nextDue(get().state):d)),
 enter:j=>{const state=readSlot(j);set({state,menu:false,panel:null});writeSlot(state);},
 reset:()=>update(freshJourney(get().state.journey,get().state.mode)),open:panel=>set({panel}),setRoom:room=>set({room}),
 save:()=>set({notice:writeSlot(get().state)?'存档成功':'保存失败，浏览器存储不可用'}),mainMenu:()=>{writeSlot(get().state);set({menu:true,panel:null});},
 mode:()=>{if(get().state.log.length)return;update(freshJourney(get().state.journey,get().state.mode==='learn'?'clinical':'learn'));}};
});
