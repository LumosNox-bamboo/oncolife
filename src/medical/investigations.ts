export type TestId='xray'|'ct'|'blood'|'needle'|'pleura'|'pathology'|'molecular'|'brain'|'pet'|'followct';
export type Investigation={id:TestId;name:string;cost:number;days:number;purpose:string;information:string;limits:string;burden:string;result:string};
// All costs, waits and specimen yields below are authored teaching scenarios, not clinical estimates.
export const investigations:Investigation[]=[
 {id:'xray',name:'胸部 X 线',cost:80,days:1,purpose:'初步观察肺部异常',information:'发现需要进一步检查的阴影',limits:'不能定病理或可靠排除肺癌；已有 CT 时通常不增益',burden:'低剂量电离辐射，可能增加后续等待',result:'右肺有局灶阴影，性质不明；建议进一步横断面影像评估。'},
 {id:'ct',name:'胸部增强 CT',cost:400,days:1,purpose:'定位病灶，涵盖下颈部、肝与肾上腺，并评估取材靶点',information:'病灶形态、位置及胸膜线索',limits:'不能单凭影像确认组织类型或胸膜结节性质',burden:'辐射、造影剂过敏及肾功能评估；本例由 NPC 核对',result:'右肺外周 3.6 cm 实性病灶，伴同侧胸膜小结节；影像不能确定结节性质，建议组织学验证。'},
 {id:'blood',name:'血常规与肾功能',cost:120,days:1,purpose:'基线状态及治疗安全评估',information:'血细胞、肾功能',limits:'不能用正常血液结果排除肺部恶性病变',burden:'静脉采血、穿刺不适',result:'ANC 3.2×10⁹/L；血小板 210×10⁹/L；CrCl 82 mL/min。教学固定数值。'},
 {id:'needle',name:'肺病灶穿刺取样',cost:450,days:1,purpose:'影像引导下获得肺病灶标本',information:'可能提供细胞与组织用于后续病理',limits:'可能取材不足，不能保证得到确定诊断；不提供准确率或失败概率',burden:'出血、气胸风险；不模拟风险发生率',result:'少量异型上皮细胞；标本不足以完成可靠分型及分子检测。建议补充取材。'},
 {id:'pleura',name:'胸腔镜胸膜取样',cost:800,days:2,purpose:'在胸膜异常可及、评估适合后获取组织',information:'可兼顾组织诊断及胸膜性质判断',limits:'需侵入性操作评估；取样本身不等于病理结论',burden:'比经皮穿刺更侵入，需麻醉／出血风险评估；本例 NPC 核对适合',result:'胸膜结节取得足量组织，已送标本室；仍需申请病理分型，不能把标本量当作诊断。'},
 {id:'pathology',name:'组织病理与免疫组化',cost:280,days:1,purpose:'确认组织类型及来源',information:'组织形态、免疫组化及胸膜性质',limits:'不提供完整分子特征；依赖标本质量',burden:'使用已有标本，费用与等待',result:'胸膜组织检出腺癌，免疫表型支持肺来源；结合胸部影像为胸膜转移。尚未获得分子结果。'},
 {id:'molecular',name:'驱动基因与 PD-L1',cost:620,days:2,purpose:'系统治疗前评估可靶向变异与免疫标志物',information:'本例所检测变异及 PD-L1 表达',limits:'未检出不等于排除所有异常；PD-L1 不能单独决定全部治疗',burden:'消耗组织，可能补样；由标本评估决定能否开展',result:'EGFR、ALK、ROS1、BRAF V600E、MET exon14、RET、NTRK、KRAS G12C、HER2 未检出可靶向异常；PD-L1 TPS 10%。'},
 {id:'brain',name:'脑 MRI',cost:300,days:1,purpose:'评估颅内病灶',information:'颅内影像证据',limits:'不替代胸部病理或其他部位分期',burden:'检查时长、幽闭不适；植入物筛查由 NPC 完成',result:'本次脑 MRI 未见颅内转移征象；需结合其他证据判断总体分期。'},
 {id:'pet',name:'全身 PET-CT',cost:900,days:2,purpose:'评估全身病变线索并辅助分期',information:'其他部位异常代谢线索',limits:'炎症可异常摄取，不能替代组织诊断；已存在可靠远处病变证据时需评估额外信息价值',burden:'额外辐射、等待及较高费用',result:'肺部与胸膜异常摄取，未见其他明确远处病灶；摄取异常不等同于组织学诊断。'},
 {id:'followct',name:'随访胸部 CT',cost:400,days:2,purpose:'结合症状复评治疗后状态',information:'病灶变化及新病灶线索',limits:'本次提前影像为教学安排，非统一随访周期；不能推算生存获益',burden:'额外辐射及费用，可选择先临床复评再安排影像',result:'病灶 3.6 → 3.5 cm，未见新病灶；固定教学描述，不能宣称客观缓解。'}
];
export const testById=(id:TestId)=>investigations.find(t=>t.id===id)!;
export const interview=[
 {id:'symptoms',label:'询问症状与持续时间',text:'咳嗽 6 周，活动后气促、轻度胸痛；没有咯血。症状持续，不能仅按短暂感冒解释。'},
 {id:'risk',label:'追问吸烟及职业暴露',text:'既往吸烟 20 包年，戒烟 8 年；无明确石棉暴露。危险因素提高警惕，但不是癌症诊断。'},
 {id:'history',label:'询问既往史与家族史',text:'高血压控制良好，无已知自身免疫病；父亲曾患肺癌。需进一步评估用药、过敏史和治疗适合度。'},
 {id:'exam',label:'进行体格检查',text:'ECOG 1，空气下 SpO₂ 97%，右侧呼吸音稍低，无明显急性呼吸窘迫。阴性体征不能排除肿瘤。'},
 {id:'records',label:'查看转诊与既往病历',text:'转诊记录仅记载持续咳嗽与高血压；没有确诊病理。患者尚未接受抗肿瘤治疗。'}
];
