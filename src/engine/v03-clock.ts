import {GameState} from './v03-types';
export const pending=(s:GameState)=>s.events.filter(e=>e.requiresAction&&e.completedAt===undefined).sort((a,b)=>a.availableAt-b.availableAt||a.priority-b.priority||a.id.localeCompare(b.id));
export const nextEvent=(s:GameState)=>pending(s)[0];
/** All advance buttons stop at the first unhandled attention event. */
export function advanceClock(s:GameState,target:number):GameState{
 const n=structuredClone(s),next=nextEvent(n);target=Math.max(n.day,Math.floor(target));
 if(next)target=Math.min(target,Math.max(n.day,next.availableAt));
 n.clock.lastAdvance=n.day;if(target>n.day){n.resources.urgentSlots=n.mode==='challenge'?1:3;n.resources.infusionSlots=n.mode==='challenge'?1:3;}
 n.day=target;n.clock.now=target;
 n.events.forEach(e=>{if(e.occurredAt===undefined&&e.availableAt<=target)e.occurredAt=e.availableAt;});
 return n;
}
export function advanceToNext(s:GameState):GameState{const e=nextEvent(s);return e?advanceClock(s,e.availableAt):{...s,message:'暂无预约，请先完成当前决策。'};}
export function acknowledge(s:GameState,id:string):GameState{const n=structuredClone(s),e=n.events.find(x=>x.id===id);if(!e||e.availableAt>n.day)return n;e.acknowledgedAt=n.day;e.requiresAction=false;e.completedAt=n.day;return n;}
