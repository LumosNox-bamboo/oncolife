import {freshJourney,Journey,JourneyState} from './journey';
export const slot=(j:Journey)=>`oncolife-v2-${j}`;
export function readSlot(j:Journey,storage:Pick<Storage,'getItem'>=localStorage):JourneyState{
 try{const s=JSON.parse(storage.getItem(slot(j))||'null');if(s?.version===2&&s.journey===j&&s.role===j&&Array.isArray(s.flags)&&Array.isArray(s.orders)&&Array.isArray(s.log)&&Array.isArray(s.clues)&&Number.isFinite(s.day)&&s.experience&&s.hypothesis)return s;}catch{}return freshJourney(j);
}
export function writeSlot(s:JourneyState,storage:Pick<Storage,'setItem'>=localStorage){try{storage.setItem(slot(s.journey),JSON.stringify(s));return true;}catch{return false;}}
export function legacySave(){try{return localStorage.getItem('oncolife-v1');}catch{return null;}}
