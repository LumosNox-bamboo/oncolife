import {GameState} from './v03-types';
export function careSetting(s:GameState){
 const adm=s.admissions.find(a=>a.status==='admitted'||a.status==='observing');
 if(adm)return `住院 · ${adm.bed||'待分床'} · ${adm.status==='admitted'?'待入院评估':'住院观察'}`;
 if(s.therapy?.administrations.some(a=>a.status==='given'&&a.scheduledAt===s.day))return '门诊治疗后 · 按预约监测';
 if(s.therapy?.administrations.some(a=>a.status!=='given'&&a.scheduledAt<=s.day))return '门诊治疗日 · 需当日安全复核';
 if(s.orders.some(o=>['ordered','scheduled','collected','processing'].includes(o.status)))return '门诊检查中 · 可回家候报';
 return s.therapy?'门诊随诊 · 按预约返院':'门诊评估 · 未住院';
}
