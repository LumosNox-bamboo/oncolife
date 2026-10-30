import {CaseId} from '../engine/v03-types';
import {patient} from './knowledge';
import {investigations} from './investigations';
export type CaseProfile={provenance:string;vitals:string;exam:string;exposures:string;family:string;medications:string;allergies:string;performance:string;labs:{anc:number;platelets:number;crcl:number};reports:Partial<Record<string,string>>};
// Fictional authored records, never observations from real people. Original values are preserved where available.
const oldReport=(id:string)=>investigations.find(t=>t.id===id)!.result;
export const profiles:Record<CaseId,CaseProfile>={
 'driver-negative':{
  provenance:'林晓禾：恢复原版虚构教学病例记录；未提供的药名／过敏史仍标记未记录。',
  vitals:patient.exam,exam:'ECOG 1；右侧呼吸音稍低，无明显急性呼吸窘迫。',exposures:'既往吸烟 20 包年，戒烟 8 年；无明确石棉暴露。',family:'父亲曾患肺癌，具体诊断年龄未记录。',medications:'高血压控制良好；具体降压药名、剂量尚未记录，需核对药盒。',allergies:'既有教学记录未提供，不能视为“无过敏”。',performance:'ECOG 1：可步行和轻体力活动，剧烈活动受限。',labs:{anc:3.2,platelets:210,crcl:82},
  reports:{ct:oldReport('ct'),xray:oldReport('xray'),pleura:oldReport('pleura'),pathology:oldReport('pathology'),molecular:oldReport('molecular'),brain:oldReport('brain'),pet:oldReport('pet'),needle:'重新取样后获得足量右肺病灶组织，送病理分型；取材成功本身不是确诊。'}
 },
 'early-nsclc':{
  provenance:'周岚：保留原 V0.3 年龄、结节大小与背景，新增数值为编写的虚构教学病例数据。',
  vitals:'体温 36.5℃；血压 118/74 mmHg；脉搏 72 次/分；呼吸 16 次/分；SpO₂ 99%（室内空气）。',exam:'双肺呼吸音清；未触及锁骨上淋巴结；无杵状指。',exposures:'本人不吸烟；与吸烟母亲共同居住约 15 年；否认已知石棉职业接触。',family:'母亲有吸烟史；无已知肺癌家族史。',medications:'否认长期处方药使用；无已知慢性病。',allergies:'患者自述无已知药物过敏，仍需术前再次核对。',performance:'ECOG 0：能完成日常工作及运动。',labs:{anc:3.8,platelets:245,crcl:96},
  reports:{ct:'右上肺外周实性结节 1.8 × 1.5 cm，边缘毛刺；未见明确胸膜侵犯或胸腔积液；肺门及纵隔未见明显肿大淋巴结。影像不能确定组织类型，也不能单独完成最终分期。',xray:'右上肺约 2 cm 局灶阴影，胸片不能可靠评价纵隔或微小病灶。',pet:'右上肺结节摄取增高；本次未见明确纵隔或远处异常摄取灶。阴性结果不能排除微小转移。',needle:'第二次肺病灶取样取得组织条 2 条，送病理；出血及气胸仍需观察。',ebus:'已获取纵隔淋巴结样本；取材记录不提供肺内结节组织类型，仍需肺病灶病理评估。',pathology:'肺病灶标本见腺样结构，TTF-1 阳性、Napsin A 阳性、p40 阴性，支持肺腺癌。小标本不能完成术后病理分期；手术风险及最终分期需进一步评估。'}
 },
 'locally-advanced':{
  provenance:'何川：保留 COPD、纵隔病变线索与年龄；检查数值及组织描述为新增虚构教学设定。',
  vitals:'体温 36.8℃；血压 136/82 mmHg；脉搏 88 次/分；呼吸 20 次/分；SpO₂ 94%（室内空气）。',exam:'双肺呼气相延长，散在呼气性哮鸣音；无明显下肢水肿。',exposures:'吸烟 40 包年，戒烟 2 年；既往从事公交驾驶。',family:'父亲有 COPD；未报告一级亲属肺癌。',medications:'自述使用长效支气管扩张吸入剂；具体品名及使用方法需核对，无家庭长期氧疗。',allergies:'患者否认已知药物过敏，旧病历尚待确认。',performance:'ECOG 1；平地可步行，爬一层楼后气促。',labs:{anc:4.1,platelets:232,crcl:68},
  reports:{xray:'右上肺门影增宽，邻近约 5 cm 不规则阴影；胸片不足以判断纵隔淋巴结性质。',ct:'右上肺中央型肿块 4.8 × 4.1 cm，右侧 4R 组纵隔淋巴结短径 1.7 cm，7 组短径 1.4 cm；无胸腔积液；本次扫描范围未见明确肝／肾上腺病灶。淋巴结性质需组织证据。',ebus:'EBUS-TBNA 分别获取 4R 与 7 组淋巴结细胞块，样本可用于病理；不能凭取材过程确认转移。',pathology:'纵隔淋巴结细胞块检出非小细胞癌，p40 阳性、TTF-1 阴性，支持鳞状分化；结合肺原发病灶考虑纵隔淋巴结受累。',molecular:'本次检测范围内未检出 EGFR 敏感变异、ALK 或 ROS1 融合；PD-L1 TPS 35%。这是所测项目结果，不能排除所有分子改变或独立决定局部治疗。',brain:'脑 MRI 未见明确颅内转移灶；需结合胸部、全身分期及 MDT 讨论。'}
 },
 'driver-positive':{
  provenance:'苏禾：保留骨痛、晚期腺癌及驱动阳性框架；EGFR 结果、尺寸及生命体征为新增虚构教学数据。',
  vitals:'体温 36.6℃；血压 132/80 mmHg；脉搏 84 次/分；呼吸 18 次/分；SpO₂ 96%（室内空气）。',exam:'腰背部局部叩击痛；双下肢肌力 5 级，无新发感觉缺失；无急性呼吸窘迫。',exposures:'本人从不吸烟；否认已知职业性石棉或放射性暴露。',family:'未报告一级亲属肺癌；家属担心遗传性，需解释体细胞检测不等于胚系检测。',medications:'高血压病史 5 年，降压用药名称待核对；自行间断使用止痛药，需补充药名。',allergies:'过敏史未记录，需要询问。',performance:'ECOG 1；骨痛影响长距离步行，仍能独立自理。',labs:{anc:3.5,platelets:268,crcl:78},
  reports:{xray:'左下肺约 3 cm 局灶阴影；胸片不能完成胸椎病灶评估，需结合症状与进一步影像。',ct:'左下肺实性病灶 3.2 × 2.8 cm；胸 8 椎体可见溶骨性改变，需结合骨痛进一步评估；影像本身不能确认病理或驱动改变。',needle:'补样后获得足量左下肺病灶组织，送病理及后续标本评估。',ebus:'左侧肺门淋巴结穿刺细胞块已送检，样本可用于组织学及分子评估。',pathology:'标本见腺癌，TTF-1 与 Napsin A 阳性、p40 阴性，支持肺来源。仍需分子结果后讨论靶向路径。',molecular:'检出 EGFR exon 19 缺失（p.E746_A750del）；本次未检出 ALK／ROS1 融合；PD-L1 TPS 5%。该阳性结果改变系统治疗讨论方向，实际用药仍需专科及当地说明书审核。',bone:'胸 8 椎体病灶约 1.6 cm，MRI 信号及增强表现结合已取得的肺病理提示骨转移可能；未见明显椎管内占位。若出现新发无力、麻木或大小便异常应立即评估。'}
 },
 'small-cell':{
  provenance:'赵衡：保留吸烟、心律失常、症状负担及小细胞框架；以下数值为新增虚构教学数据。',
  vitals:'体温 36.9℃；血压 124/76 mmHg；脉搏 104 次/分；呼吸 22 次/分；SpO₂ 93%（室内空气）。',exam:'右肺呼吸音减低，右锁骨上可触及约 1.5 cm 淋巴结；暂无面颈部明显水肿。',exposures:'吸烟约 50 包年，仍吸烟；愿意听取戒烟支持。',family:'未报告肺癌家族史；配偶陪诊。',medications:'既往阵发性心律失常；抗心律失常药及是否抗凝需核对旧处方。',allergies:'患者不能回忆过敏史，需要家属和既往病历补充。',performance:'ECOG 2；仍可自理，但乏力使其无法继续工作。',labs:{anc:5.2,platelets:190,crcl:64},
  reports:{xray:'右肺门约 6 cm 肿块样阴影并纵隔影增宽；胸片不能决定组织学类型或胸外分期。',ct:'右肺门肿块 6.4 × 5.2 cm，纵隔多组淋巴结肿大；肝右叶低密度灶 2.3 cm，左肾上腺结节 1.8 cm，需进一步定性。',ebus:'右肺门及 7 组淋巴结获得细胞块；标本送病理，采样成功不等于确诊。',pathology:'标本为小细胞形态，细胞质少、核模塑明显；Synaptophysin、INSM1 阳性，Ki-67 约 85%，结合形态支持小细胞癌。Ki-67 数值是本病例设定。',brain:'脑 MRI 未见明确转移灶；阴性脑影像不能排除胸外其他部位受累。',pet:'右肺门及纵隔病灶明显异常摄取；肝右叶和左肾上腺病灶亦有异常摄取，结合组织证据支持胸外播散的教学情境；摄取本身不能单独替代定性。'}
 },
 recurrent:{
  provenance:'顾宁：保留既往含铂治疗与资料缺失；病灶变化、重复取材与检测细节为新增虚构教学数据。',
  vitals:'体温 36.7℃；血压 126/78 mmHg；脉搏 92 次/分；呼吸 20 次/分；SpO₂ 95%（室内空气）。',exam:'右侧呼吸音减低；双手指端麻木自述，肌力未见明显下降；暂无急性呼吸窘迫。',exposures:'既往吸烟 30 包年，戒烟 1 年；职业暴露资料未提供。',family:'妻子希望积极治疗，患者希望先明确收益、负担与照护安排。',medications:'旧记录提示曾接受含铂治疗，但联合药名、剂量和末次给药日期未完整转入；止痛药清单需核对。',allergies:'旧治疗记录未附过敏信息，不能默认为无过敏。',performance:'ECOG 2；疲劳和胸痛限制工作，仍可自理。',labs:{anc:2.4,platelets:156,crcl:56},
  reports:{xray:'右肺局灶阴影，右侧肋膈角变钝；仅凭当前胸片不能确认与旧肿瘤的关系或判定进展。',ct:'与转入的 3 个月前影像比较：右肺病灶最长径由 2.8 cm 增至 3.7 cm，新增同侧胸膜结节并少量积液。影像提示进展，需要核对可比性、再分期及组织性质。',pleura:'新发胸膜结节取材得到足量组织；送病理并与既往标本对照。',pathology:'胸膜组织检出非小细胞癌，腺样分化、TTF-1 阳性；结合肺病灶与旧记录考虑肺来源。旧完整病理仍需补齐，不将所有新病灶自动视作同一肿瘤。',molecular:'本次重检范围内未检出 EGFR 敏感变异或 ALK／ROS1 融合；PD-L1 TPS 20%。旧分子平台与完整结果未提供，不能推断具体耐药机制。',brain:'脑 MRI 未见明确颅内转移灶；仍需结合胸膜新病灶和其他部位评估。'}
 }
 ,'early-squamous':{provenance:'梁梅：新增编写的虚构教学病例数据。',vitals:'体温 36.8℃；血压 142/80 mmHg；脉搏 86 次/分；呼吸 18 次/分；SpO₂ 97%（室内空气）。',exam:'右肺门区呼吸音略粗；无锁骨上淋巴结肿大。',exposures:'吸烟 25 包年，戒烟 3 年；职业暴露史待补充。',family:'未报告一级亲属肺癌。',medications:'2 型糖尿病用药名称与近期 HbA1c 待核对。',allergies:'患者自述无已知药物过敏，需术前再次确认。',performance:'ECOG 1：可独立完成日常活动。',labs:{anc:4.0,platelets:238,crcl:71},reports:{xray:'右肺门旁约 2.1 cm 局灶阴影；胸片不能判断组织学或纵隔受累。',ct:'右肺门旁 2.1 × 1.8 cm 肿块，邻近支气管；未见明确胸腔积液或远处病灶。',ebus:'支气管镜下取得右肺门病灶组织，标本送病理；取材过程不能替代诊断。',pathology:'标本见非小细胞癌，鳞状细胞癌形态，p40 阳性、TTF-1 阴性，支持鳞状分化；最终分期需结合影像和手术评估。',pet:'右肺门病灶局部摄取增高，未见明确远处异常摄取。'}},
 'alk-positive':{provenance:'丁岚：新增编写的虚构教学病例数据。',vitals:'体温 36.6℃；血压 116/72 mmHg；脉搏 80 次/分；呼吸 17 次/分；SpO₂ 98%（室内空气）。',exam:'神经系统粗筛未见明显偏瘫；右侧胸壁轻压不适。',exposures:'从不吸烟；无已知石棉职业暴露。',family:'父亲有结直肠癌史；遗传风险需另行咨询。',medications:'无长期处方药；近期自行服用止痛药，名称待核对。',allergies:'过敏史未完成询问。',performance:'ECOG 0-1：仍在工作，头晕影响通勤。',labs:{anc:3.7,platelets:226,crcl:103},reports:{ct:'左下肺 3.0 × 2.6 cm 实性病灶，伴少量同侧胸膜结节；影像不能确定分子特征。',pleura:'胸膜结节取样取得足量组织，送病理和分子检测。',pathology:'标本见肺腺癌，TTF-1 与 Napsin A 阳性；需结合分子结果讨论系统治疗。',molecular:'检出 ALK 融合（检测平台教学设定）；未检出 EGFR exon 19 缺失。结果不提供药物剂量或疗效概率。',brain:'脑 MRI 未见明确颅内转移。'}},
 'frail-elderly':{provenance:'唐叔：新增编写的虚构教学病例数据。',vitals:'体温 36.7℃；血压 130/68 mmHg；脉搏 96 次/分；呼吸 24 次/分；SpO₂ 91%（室内空气）。',exam:'双下肢轻度水肿；双肺底湿啰音；步行需拐杖。',exposures:'既往吸烟 35 包年，戒烟 10 年。',family:'女儿陪诊；一级亲属肿瘤史未完整记录。',medications:'慢性心衰和慢性肾病用药清单缺失，需带药核对。',allergies:'过敏史由家属补充中。',performance:'ECOG 2-3 教学线索：日常活动需要家属协助。',labs:{anc:3.1,platelets:178,crcl:52},reports:{ct:'左上肺 5.2 × 4.6 cm 肿块，纵隔淋巴结增大；双侧少量胸腔积液需结合容量状态判断。',needle:'小标本取材量有限，已送病理；是否足够进行分子检测待实验室判断。',pathology:'小标本提示非小细胞癌，组织量有限；病理亚型和分子检测需评估是否足量。',molecular:'当前样本不足，未形成可解释的完整分子报告；不应把“未报告”当作阴性。',brain:'脑 MRI 未见明确颅内转移。'}},
 'oligometastatic':{provenance:'许安：新增编写的虚构教学病例数据。',vitals:'体温 36.5℃；血压 124/78 mmHg；脉搏 82 次/分；呼吸 18 次/分；SpO₂ 96%（室内空气）。',exam:'左肩活动受限伴疼痛；无明显神经缺损。',exposures:'吸烟 15 包年，戒烟 12 年；石棉暴露史未记录。',family:'母亲有乳腺癌史；家族史需进一步核对。',medications:'仅报告间断使用止痛药，名称剂量待核对。',allergies:'患者不确定青霉素过敏史，需查旧记录。',performance:'ECOG 1：可工作但肩痛影响睡眠。',labs:{anc:4.4,platelets:251,crcl:88},reports:{ct:'左上肺 4.1 × 3.5 cm 病灶，左肾上腺 1.2 cm 低密度结节；单凭 CT 不能确认转移。',pet:'左上肺病灶及左肾上腺结节摄取增高；摄取不能单独完成病理定性。',needle:'左上肺穿刺取得组织 3 条，送病理和分子检测；需观察出血与气胸。',pathology:'标本见肺腺癌，TTF-1 阳性；肾上腺结节尚未获得组织证据，不能自动视为转移。',molecular:'检测提示未检出 EGFR 敏感变异、ALK／ROS1 融合；完整检测范围和平台需核对。',brain:'脑 MRI 未见明确颅内转移。'}}

};
export function labText(id:CaseId){const l=profiles[id].labs;return `ANC ${l.anc}×10⁹/L；血小板 ${l.platelets}×10⁹/L；CrCl ${l.crcl} mL/min。固定教学样本值，不代表真实检测或恢复速度。`;}
export function caseReport(id:CaseId,testId:string){
 if(testId==='blood')return labText(id);
 return profiles[id].reports[testId]||null;
}
