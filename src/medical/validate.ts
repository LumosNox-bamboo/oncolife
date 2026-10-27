import {CaseDefinition,caseList} from './cases';
/** Structural/obvious mismatch check, not independent clinical expert validation. */
export function validateCases(list:CaseDefinition[]=caseList){
 const errors:string[]=[];
 for(const c of list){const r=c.regimen;
  if(!r||!r.source||!r.teachingPlaceholder)errors.push(c.id+': missing evidence boundary');
  if(!r)continue;
  if(r.cycles<1||r.cycleLength<1||r.administrationDays.some(d=>d<1||d>r.cycleLength)||r.monitoringDays.some(d=>d<1||d>r.cycleLength))errors.push(c.id+': invalid schedule');
  if(c.id==='small-cell'&&r.id==='pemetrexedPlatinum')errors.push('Pemetrexed not configured for small-cell');
  if(c.id==='early-nsclc'&&r.id!=='surgery')errors.push('Early case surgical evaluation missing');
  if(c.id==='driver-positive'&&!c.uniqueChecks.includes('molecular'))errors.push('Driver-positive case needs molecular evidence');
  if(!c.uniqueChecks.includes('pathology')||!c.uniqueChecks.some(t=>['needle','pleura','ebus'].includes(t)))errors.push(c.id+': tissue route missing');
 }
 return errors;
}
