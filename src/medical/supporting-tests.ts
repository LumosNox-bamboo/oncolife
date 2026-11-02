import {CaseId} from '../engine/v03-types';
export const supportingTests={
 liver:{name:'肝功能',days:1,cost:90,purpose:'评估肝脏生化基线，结合病史、合并用药及方案决定复查。',information:'ALT、AST、总胆红素；单次值不能替代完整器官功能评估。'},
 electrolytes:{name:'电解质',days:1,cost:60,purpose:'评估钠钾等基线，尤其关注进食差、呕吐、利尿剂及心肾合并症。',information:'血钠、血钾；不由单项数值自动决定用药。'},
 coagulation:{name:'凝血功能',days:1,cost:80,purpose:'按侵入性取材、出血史或抗凝用药等指征评估。',information:'INR、APTT；不能单独保证操作无出血风险。'},
 ecg:{name:'心电图',days:1,cost:70,purpose:'结合心血管病史、症状和拟用药评估基线心律。',information:'静息心律和 QTc 记录；不能排除全部心脏病。'}
};
// Authored fictional specimens, not observations or sourced safety thresholds.
const values:Record<CaseId,number[]>={
 'early-nsclc':[20,19,11,140,4.1,1.0,29,415],
 'locally-advanced':[26,28,14,138,4.2,1.0,30,430],
 'driver-positive':[24,22,12,139,4.0,1.0,28,420],
 'driver-negative':[23,25,13,140,4.1,1.0,29,422],
 'small-cell':[42,39,17,132,3.8,1.1,31,445],
 recurrent:[31,33,15,137,3.9,1.0,30,438],
 'early-squamous':[25,24,12,139,4.3,1.0,28,425],
 'alk-positive':[18,20,10,141,4.0,1.0,29,410],
 'frail-elderly':[34,36,16,135,4.8,1.1,32,452],
 oligometastatic:[22,23,11,140,4.2,1.0,28,418]
};
export function supportingResult(id:CaseId,testId:string){const [alt,ast,bili,na,k,inr,aptt,qtc]=values[id];const report:Record<string,string>={liver:`ALT ${alt} U/L；AST ${ast} U/L；总胆红素 ${bili} μmol/L。`,electrolytes:`血钠 ${na} mmol/L；血钾 ${k} mmol/L。`,coagulation:`INR ${inr.toFixed(1)}；APTT ${aptt} 秒。`,ecg:`本次静息记录为窦性心律，QTc ${qtc} ms；既往间歇性心律异常不能由单次记录排除。`};return report[testId]?report[testId]+' 新增虚构教学样本；参考区间依实验室／方法而异，结果需临床解读，不自动视为治疗许可。':null;}
