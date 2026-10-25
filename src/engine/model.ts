export type Role='doctor'|'nurse'|'patient';
export type Mode='learn'|'clinical';
export type Action='talk'|'preference'|'history'|'blood'|'ct'|'biopsy'|'diagnose'|'plan'|'prepare'|'review'|'infuse'|'vitals'|'report'|'assess'|'infection'|'urgent'|'care'|'recheck'|'followct'|'followup'|'consult'|'comfort'|'targetPlan'|'surgeryPlan'|'immunoPlan'|'symptom';
export type Report={id:string;due:number;ready:boolean;text:string};
export type State={version:1;role:Role;mode:Mode;day:number;budget:number;spent:number;flags:string[];reports:Report[];log:{day:number;text:string}[];phase:'初诊'|'治疗'|'异常事件'|'随访'|'完成';treatmentDay:number|null;preparedDay:number|null;event:boolean;resolved:boolean;message:string;source:string};
export const initial=(mode:Mode='learn'):State=>({version:1,role:'doctor',mode,day:1,budget:8000,spent:0,flags:[],reports:[],log:[{day:1,text:'林晓禾来到晴光医院。所有病例数据均为虚构。'}],phase:'初诊',treatmentDay:null,preparedDay:null,event:false,resolved:false,message:'欢迎来到晴光医院。前往门诊与林晓禾交谈。',source:'nci'});
export const has=(s:State,f:string)=>s.flags.includes(f);
export const ready=(s:State,id:string)=>s.reports.some(r=>r.id===id&&r.ready);
export const task=(s:State)=> s.phase==='完成'?'病例完成 · 查看教学总结':s.event&&!s.resolved?'紧急：病房评估 → 感染检查 → 医生处置 → 护士执行 → 复查':!has(s,'history')?'到门诊：交谈、病史与患者意愿':!has(s,'diagnose')?'完成检验、CT 与病理分子检查；回门诊确认诊断':!has(s,'plan')?'门诊讨论方案，医生办公室申请会诊':!has(s,'prepare')?'治疗室：医生确认预处理与安全准备':s.treatmentDay===null?'等待准备满 7 天；复查血液 → 医生审核 → 护士执行':!s.event?'推进至周期第 8 天，观察症状与血常规':!ready(s,'followct')?'影像科申请随访 CT，查看恢复后的患者':'门诊完成随访与后续共同决策';
