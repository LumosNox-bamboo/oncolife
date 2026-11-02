export const sources = [
 {id:'ng122',name:'NICE NG122 肺癌诊断与分期',version:'发布 2019-03-28；网页顶部更新 2024-03-08，部分条目标注 2026 修订；2026-10-26 核验',url:'https://www.nice.org.uk/guidance/ng122/chapter/Diagnosis-and-staging',scope:'英国；采用 1.2.2、1.2.11、1.2.13–14 的检查和取材原则。分期版本另参考 NCI，不能混用该页历史分期。'},
 {id:'label',name:'ALIMTA 美国处方说明书',version:'修订 08/2022；2026-10-25 下载核实',url:'https://pi.lilly.com/us/alimta-pi.pdf',scope:'美国标签；并非中国地区完整指南。已保存原始 PDF。'},
 {id:'nci',name:'NCI 非小细胞肺癌治疗 PDQ',version:'更新 2025-05-15；2026-10-25 下载核实分期与治疗章节',url:'https://www.cancer.gov/types/lung/hp/non-small-cell-lung-treatment-pdq',scope:'美国专业教育资料；不能据此宣称本病例为唯一或最新优选方案。'},
 {id:'nice',name:'NICE CG151 中性粒细胞减少性败血症',version:'发布 2012-09-19；2026-10-25 核实建议 1.4.1',url:'https://www.nice.org.uk/guidance/cg151/chapter/Recommendations',scope:'英国指南；用于立即评估、检查与经验性抗感染原则，不替代当地急诊方案。'},
 {id:'ctcae',name:'NCI CTCAE v5.0',version:'v5.0，2017-11-27；2026-10-25 核实官方工作簿',url:'https://dctd.cancer.gov/research/ctep-trials/trial-development/ctcae-v5.0.xlsx',scope:'采用指定历史版本 v5.0（不冒充最新版）；仅对本病例演示分级，真实分级需完整临床评估。'}
];
export const cards = [
 {title:'病理与分期',text:'非小细胞肺癌包括腺癌、鳞癌等。本例活检为腺癌，胸膜结节活检证实转移，构成 M1a、IVA 期教学情境；不是仅凭肺部肿块大小分期。',source:'nci'},
 {title:'选择治疗路径',text:'本例无已检出可靶向驱动变异，PD-L1 TPS 10%。必须讨论免疫联合等选择。患者暂不接受免疫治疗时可讨论标签支持的培美曲塞＋顺铂，也可在知情选择下先支持照护并约定复评。暂缓期间继续症状管理并按约复评。',source:'label'},
 {title:'周期与安全检查',text:'培美曲塞＋顺铂在每个 21 天周期第 1 天给药。标签要求血常规在周期第 1、8、15 天检查，每周期前评估肾功能；给药前 ANC ≥1.5×10⁹/L、血小板 ≥100×10⁹/L、CrCl ≥45 mL/min。还需完整评估非血液毒性和联合药物安全性。',source:'label'},
 {title:'治疗前准备',text:'叶酸在首次给药前 7 天开始，维生素 B12 在首剂前一周给予；另有地塞米松预处理。游戏仅记录完成核对，不提供可执行剂量。顺铂需额外核对水化、止吐、听力和肾功能。',source:'label'},
 {title:'发热与血细胞异常',text:'本例固定发生 38.6℃、ANC 0.4×10⁹/L 的紧急剧情。立即报告、临床评估、感染检查及紧急处理，暂停抗肿瘤治疗。抗感染药物与剂量依当地急诊流程决定；本版不提供处方。不可通过等待恢复代替处置。',source:'nice'},
 {title:'毒性分级：两个不同条目',text:'CTCAE v5.0 中，ANC <0.5×10⁹/L 对应中性粒细胞计数降低 4 级。本例 ANC 0.4、单次体温 38.6℃，符合发热性中性粒细胞减少条目的 3 级条件；该条目 4 级还需危及生命的后果。不要将两种条目混为一谈。',source:'ctcae'},
 {title:'恢复与随访',text:'严重骨髓抑制后需重新评估延迟、减量及支持治疗。本版结束于多学科复评，禁止自动再次给药。',source:'label'}
];
export const patient = {name:'林晓禾',age:58,sex:'女',history:'已戒烟 8 年，既往 20 包年；高血压控制良好，无自身免疫病。ECOG 1。',symptoms:'咳嗽 6 周、活动后气促、轻度胸痛；无咯血。',exam:'初诊体温 36.7℃，血压 128/78 mmHg，脉搏 78 次/分，SpO₂ 97%（空气）。',wish:'希望控制症状并保持生活质量，担心住院影响照顾家人；讨论后暂不接受免疫治疗。',finance:'退休，家庭可提供部分经济支持。'};
export const safeToTreat=(anc:number,platelets:number,crcl:number)=>anc>=1.5&&platelets>=100&&crcl>=45;
