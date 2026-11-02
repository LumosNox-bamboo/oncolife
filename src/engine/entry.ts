import {cases} from '../medical/cases';
import {CaseId,Journey,Mode} from './v03-types';
export const entryKey=(journey:Journey,mode:Mode)=>`oncolife-v3-entry-${journey}-${mode}`;
/** Choose only on a new entry; the caller persists the selection before play. */
export function randomCase(draw:number):CaseId{const ids=Object.keys(cases) as CaseId[];return ids[Math.min(ids.length-1,Math.max(0,Math.floor(draw*ids.length)))];}
export function savedEntry(storage:Pick<Storage,'getItem'>,journey:Journey,mode:Mode):CaseId|undefined{
 const poolKey=mode==='challenge'?`oncolife-v3-campaign-${journey}`:`oncolife-v3-campaign-${journey}-${mode}`;
 try{const pool=JSON.parse(storage.getItem(poolKey)||'null');if(pool?.journey===journey&&pool.patients?.[pool.activeId]&&pool.activeId in cases)return pool.activeId;}catch{}
 const id=storage.getItem(entryKey(journey,mode));if(id&&id in cases)return id as CaseId;
 // Existing independent saves retain their progress when adopting the new menu.
 for(const id of Object.keys(cases) as CaseId[]){try{const s=JSON.parse(storage.getItem(`oncolife-v3-${journey}-${mode}-${id}`)||'null');if(s?.version===3&&s.journey===journey&&s.mode===mode&&s.caseId===id)return id;}catch{}}
}
