import {describe,it,expect} from 'vitest';
import {act,advance} from '../src/engine/clinical';
import {initial,State,Action,has} from '../src/engine/model';
import {safeToTreat,sources,cards} from '../src/medical/knowledge';
import {blocked,rooms} from '../src/world/map';
function diagnosis(mode:'learn'|'clinical'='learn'){let s=initial(mode);for(const a of ['talk','history','blood','ct','biopsy'] as Action[])s=act(s,a);s=advance(s,2);s=act(s,'diagnose');s=act(s,'consult');s=act({...s,role:'patient'},'preference');return act({...s,role:'doctor'},'plan');}
function treated(mode:'learn'|'clinical'='learn'){let s=act(diagnosis(mode),'prepare');s=advance(s,7);s=act(s,'blood');s=advance(s,1);s=act(s,'review');return act({...s,role:'nurse'},'infuse');}
describe('诊疗闭环与安全约束',()=>{
 it('完成诊断、首剂、异常评估、恢复、随访',()=>{let s=treated();expect(s.treatmentDay).not.toBeNull();s=advance(s,30);expect(s.day).toBe(s.treatmentDay!+7);expect(s.event).toBe(true);const paused=advance(s,7);expect(paused.day).toBe(s.day);s=act(s,'vitals');s=act(s,'report');s={...s,role:'doctor'};for(const a of ['assess','infection','urgent'] as Action[])s=act(s,a);s=act({...s,role:'nurse'},'care');s=act({...s,role:'doctor'},'recheck');s=advance(s,2);expect(s.resolved).toBe(true);s=act(s,'followct');s=advance(s,2);s=act(s,'followup');expect(s.phase).toBe('完成');expect(s.log.length).toBeGreaterThan(25);});
 it('护士患者不能开抗肿瘤方案，医生不能代执行',()=>{for(const role of ['nurse','patient'] as const){const s=act({...diagnosis(),role},'prepare');expect(s.preparedDay).toBeNull();}expect(act({...treated(),role:'doctor'},'care').message).toContain('护士');});
 it('临床模式有限预算完成病例，费用严格累计',()=>{let s=advance(treated('clinical'),7);s=act(s,'vitals');s=act(s,'report');s={...s,role:'doctor'};for(const a of ['assess','infection','urgent'] as Action[])s=act(s,a);s=act({...s,role:'nurse'},'care');s=act({...s,role:'doctor'},'recheck');s=advance(s,2);s=act(s,'followct');s=advance(s,2);s=act(s,'followup');expect(s.phase).toBe('完成');expect(s.spent).toBe(5310);expect(s.budget).toBe(2690);});
 it('过期审核可重做，错误路径不执行治疗',()=>{let s=treated();s={...s,role:'doctor',treatmentDay:null,flags:s.flags.filter(f=>f!=='infuse')};s=advance(s,1);s=act(s,'review');expect(has(s,'reviewDay:'+s.day)).toBe(true);for(const a of ['targetPlan','surgeryPlan','immunoPlan'] as Action[]){const n=act(s,a);expect(n.treatmentDay).toBeNull();expect(n.spent).toBe(s.spent);expect(n.source).toBe('nci');}});
 it('门槛边界与来源可追溯',()=>{expect(safeToTreat(1.5,100,45)).toBe(true);expect(safeToTreat(1.49,100,45)).toBe(false);expect(safeToTreat(1.5,99,45)).toBe(false);expect(safeToTreat(1.5,100,44.9)).toBe(false);cards.forEach(c=>expect(sources.some(s=>s.id===c.source)).toBe(true));});
 it('不得跳过维生素准备和新鲜报告',()=>{let s=act(diagnosis(),'prepare');expect(has(act(s,'review'),'review')).toBe(false);s=advance(s,7);expect(act(s,'review').message).toContain('更新血常规');expect(act({...s,role:'nurse'},'infuse').treatmentDay).toBeNull();});
 it('审核隔天失效，不可重复给药或重复收费',()=>{let s=treated();expect(act(s,'infuse').spent).toBe(s.spent);s={...s,treatmentDay:null,flags:s.flags.filter(f=>f!=='infuse')};s=advance(s,1);expect(act(s,'infuse').treatmentDay).toBeNull();});
 it('预算不足不执行收费操作且不改变临床状态',()=>{const s={...diagnosis(),mode:'clinical' as const,budget:0};const n=act(s,'blood');expect(n.reports).toEqual(s.reports);expect(n.spent).toBe(s.spent);expect(n.message).toContain('不足');});
 it('角色切换保留状态与未就绪报告不会提前出现',()=>{const s=act(act(act(initial(),'talk'),'history'),'biopsy');expect(s.reports[0].ready).toBe(false);expect(advance(s,1).reports[0].ready).toBe(false);expect(advance({...s,role:'patient'},2).reports[0].ready).toBe(true);});
 it('异常不在病房也会发生且不能靠等待消除',()=>{const s=advance(treated(),7);expect(advance(s,100).resolved).toBe(false);expect(act({...s,role:'doctor'},'recheck').reports.some(r=>r.id==='recheck')).toBe(false);});
});
describe('地图连通性与碰撞',()=>{
 it('外围及家具不可穿越',()=>{expect(blocked(5,300)).toBe(true);expect(blocked(164,128)).toBe(true);expect(blocked(350,325)).toBe(false);});
 it('六间临床房间均从大厅可达',()=>{const seen=new Set<string>();const queue:[[number,number]]=[[350,320]];while(queue.length){const [x,y]=queue.shift()!;const k=x+','+y;if(seen.has(k)||blocked(x,y))continue;seen.add(k);for(const [dx,dy] of [[10,0],[-10,0],[0,10],[0,-10]])queue.push([x+dx,y+dy]);}for(const r of rooms)expect(seen.has((r.door===160?160:r.door===470?470:790)+','+(r.side==='top'?180:460))).toBe(true);});
});
