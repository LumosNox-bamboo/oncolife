import {test,expect,Page} from '@playwright/test';
const button=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
async function close(p:Page){if(await button(p,'返回医院 ×').count())await button(p,'返回医院 ×').click();}
async function go(p:Page,id:string){await close(p);await p.getByLabel('旅行目的地').selectOption(id);await button(p,'快速旅行').click();await p.keyboard.press('e');await expect(p.getByRole('dialog')).toBeVisible();}
async function next(p:Page){await close(p);await button(p,'下一事件').click();}
async function state(p:Page,j='doctor',m='learning',c='driver-negative'){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)!),`oncolife-v3-${j}-${m}-${c}`);}
async function start(p:Page,j='doctor',m='learning'){if(m==='challenge')await p.addInitScript(()=>{crypto.getRandomValues=((a:Uint32Array)=>{a.fill(1503238553);return a;}) as typeof crypto.getRandomValues;});await p.goto('/');await p.getByRole('button',{name:j==='doctor'?/医生模式 Clinical/:/患者模式 Patient/}).click();if(m==='challenge'){await button(p,'主菜单').click();await button(p,'挑战模式 · 有限资源').click();}await expect(p.locator('canvas')).toBeVisible();}
async function confirmReports(p:Page){await go(p,'lab');while(await button(p,'查看并确认报告').count())await button(p,'查看并确认报告').first().click();}
async function order(p:Page,name:string){await go(p,'lab');await button(p,'申请'+name).click();await next(p);await confirmReports(p);}
async function setup(p:Page,m='learning'){
 await go(p,'clinic');await expect(p.getByRole('dialog')).not.toContainText('PD-L1 TPS 10%');await button(p,'患者目标与意愿').click();
 for(const name of ['增强 CT','胸膜取样','组织病理','分子检测','血常规与肾功能']){await order(p,name);if(name==='分子检测'&&m==='challenge'){await button(p,'免费重做').click();await next(p);await confirmReports(p);}}
 await go(p,'clinic');await p.getByLabel('疾病假设').selectOption('肺腺癌');await p.getByLabel('分期假设').selectOption('IVA 教学情境');await p.getByLabel('诊断依据').fill('组织及胸膜证据，结合影像分期和分子结果。');await button(p,'提交诊断').click();await go(p,'therapy');await button(p,'建立结构化治疗方案').click();
}
async function finish(p:Page,j='doctor',m='learning'){
 for(let i=0;i<80;i++){
  const s=await state(p,j,m);if(s.complete)return s;
  await next(p);const n=await state(p,j,m);const e=n.events.filter((e:any)=>e.requiresAction&&e.completedAt===undefined).sort((a:any,b:any)=>a.availableAt-b.availableAt||a.priority-b.priority||a.id.localeCompare(b.id))[0];
  expect(e,'must always have next event').toBeTruthy();
  if(e.kind==='administration'){await go(p,'therapy');await button(p,j==='doctor'?'完成治疗前安全复核':'参加治疗前评估').click();await button(p,j==='doctor'?'执行下一次治疗':'参加下一次治疗').click();}
  else if(e.kind==='assessment'){await go(p,'therapy');await button(p,j==='doctor'?'完成周期评估':'参加周期评估').click();}
  else if(e.kind==='adverse'){await go(p,'ward');for(const name of j==='doctor'?['紧急临床评估','感染与血液检查','启动急诊处置与支持']:['向医生求助并接受评估','配合紧急检查','接受医护急诊处置与支持'])await button(p,name).click();}
  else if(e.kind==='finance'){await go(p,'office');await button(p,'公共交通（40 币）').click();}
  else {await go(p,'office');const item=p.locator('.report').filter({has:p.getByText(`第 ${e.scheduledAt} 天 · ${e.title}`,{exact:true})});await item.getByRole('button',{name:'查看并确认',exact:true}).click();}
 }
 throw Error('playthrough exceeded iteration bound');
}
test('医生线：报告当天、四周期、急性处置、后续随访与刷新',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await page.screenshot({path:'docs/v03-hospital.png',fullPage:true});
 await go(page,'lab');await button(page,'申请增强 CT').click();await next(page);let s=await state(page);expect(s.day).toBe(2);await next(page);expect((await state(page)).day).toBe(2);await confirmReports(page);
 await setup(page);s=await finish(page);expect(s.therapy.administrations.filter((a:any)=>a.status==='given')).toHaveLength(4);expect(s.complete).toBe(true);await page.screenshot({path:'docs/v03-doctor-ending.png',fullPage:true});await page.reload();await page.getByRole('button',{name:/医生模式 Clinical/}).click();expect(await state(page)).toEqual(s);expect(errors).toEqual([]);
});
test('患者线：症状、家庭、NPC 检查与四周期独立结局',async({page})=>{
 await start(page,'patient');await go(page,'clinic');for(const name of ['再观察两天','描述症状与担忧','与家属讨论支持','前往就医'])await button(page,name).click();await next(page);await confirmReports(page);
 for(let i=0;i<5;i++){await go(page,'clinic');await button(page,'了解并同意下一项检查／治疗').click();const s=await state(page,'patient');if(s.orders.some((o:any)=>o.status==='scheduled')){await next(page);await confirmReports(page);}}
 expect((await state(page,'patient')).therapy).toBeDefined();const ending=await finish(page,'patient');expect(ending.complete).toBe(true);await page.screenshot({path:'docs/v03-patient-ending.png',fullPage:true});await close(page);await button(page,'主菜单').click();await page.getByRole('button',{name:/医生模式 Clinical/}).click();expect((await state(page)).day).toBe(1);expect(await state(page,'patient')).toEqual(ending);
});
test('挑战：技术失败免费重做、有限预算、互斥资源和完整疗程',async({page})=>{
 await start(page,'doctor','challenge');await setup(page,'challenge');await page.getByText('挑战资源：援助、转诊与加急安排',{exact:true}).click();await button(page,'预留本日加急检查').click();await button(page,'预留本日加急检查').click();await expect(page.locator('.feedback')).toContainText('已被另一预约占用');await button(page,'申请一次援助').click();const s=await finish(page,'doctor','challenge');expect(s.complete).toBe(true);expect(s.balance).toBeLessThan(6500);expect(s.balance).toBeGreaterThanOrEqual(0);expect(s.transactions.filter((t:any)=>t.description==='检查：分子检测')).toHaveLength(1);await page.screenshot({path:'docs/v03-challenge-ending.png',fullPage:true});
});
test('地图房间、移动碰撞、寻路、旧档保护和移动端',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('oncolife-v2-doctor',JSON.stringify({version:2,day:42})));
 await start(page);for(const id of ['clinic','lab','scan','ward','office','therapy','lobby'])await go(page,id);await close(page);await page.getByLabel('旅行目的地').selectOption('clinic');await button(page,'自动寻路').click();await expect(page.locator('.status')).toContainText('肿瘤科门诊',{timeout:15000});await expect.poll(()=>page.locator('canvas').getAttribute('data-route-length').then(Number),{timeout:15000}).toBe(0);
 await page.keyboard.down('ArrowLeft');await page.waitForTimeout(1800);await page.keyboard.up('ArrowLeft');const x=await page.locator('canvas').getAttribute('data-player-x').then(Number);expect(x).toBeGreaterThan(30);expect(x).toBeLessThan(155);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('oncolife-v2-doctor')!).day)).toBe(42);await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'docs/v03-mobile.png',fullPage:true});
});
test('挑战多患者：共享预算、床位冲突与后台报告暂停',async({page})=>{
 await start(page,'doctor','challenge');await go(page,'lab');await button(page,'申请增强 CT').click();await go(page,'ward');await button(page,'申请住院评估').click();await button(page,'办理入院').click();await button(page,'完成入院评估').click();await close(page);await button(page,'接诊下一位').click();const otherId=await page.getByLabel('当前患者').inputValue();await go(page,'ward');await button(page,'申请住院评估').click();await button(page,'办理入院').click();await expect(page.locator('.feedback')).toContainText('床位不足');await next(page);expect((await state(page,'doctor','challenge',otherId)).day).toBe(2);await next(page);expect((await state(page,'doctor','challenge',otherId)).day).toBe(2);await page.getByLabel('当前患者').selectOption('driver-negative');await confirmReports(page);expect((await state(page,'doctor','challenge')).balance).toBe(4600);
});
test('具体病历：问诊数值、分项报告解锁及报告档案',async({page})=>{
 await start(page);await go(page,'clinic');const sheet=page.getByRole('region',{name:'结构化病历'});
 await expect(sheet).toContainText('128/78 mmHg');await expect(sheet).not.toContainText('3.6 cm');
 await button(page,'症状与持续时间').click();await button(page,'危险因素与家族史').click();await button(page,'既往史与用药').click();await button(page,'体格检查').click();await button(page,'患者目标与意愿').click();
 await expect(sheet).toContainText('20 包年');await expect(sheet).toContainText('ECOG 1');await page.screenshot({path:'docs/v03-case-record-restored.png',fullPage:true});
 await order(page,'增强 CT');await expect(page.getByRole('dialog')).toContainText('3.6 cm');await expect(page.getByRole('dialog')).not.toContainText('TPS 10%');
 await go(page,'office');await page.getByText('检查档案 · 已查看 1 份（按日期保留）',{exact:true}).click();await expect(page.getByRole('region',{name:'结构化病历'})).toContainText('3.6 cm');await expect(page.getByRole('region',{name:'结构化病历'})).not.toContainText('脑 MRI');
 await order(page,'脑 MRI');await go(page,'office');await page.getByText('检查档案 · 已查看 2 份（按日期保留）',{exact:true}).click();await expect(page.getByRole('region',{name:'结构化病历'})).toContainText('未见颅内转移');const before=await state(page);await page.reload();await page.getByRole('button',{name:/医生模式 Clinical/}).click();expect(await state(page)).toEqual(before);
});
test('普通医生模式交错接诊与住院区分',async({page})=>{
 await start(page);await expect(page.getByLabel('当前患者')).toBeVisible();await go(page,'lab');await button(page,'申请增强 CT').click();await close(page);
 await button(page,'接诊下一位').click();const nextId=await page.getByLabel('当前患者').inputValue();expect(nextId).not.toBe('driver-negative');await expect(page.locator('.status')).toContainText('门诊评估 · 未住院');
 await button(page,'＋1 天').click();await expect(page.locator('.toast')).toContainText('林晓禾');await page.getByLabel('当前患者').selectOption('driver-negative');await confirmReports(page);
 await go(page,'ward');await expect(page.getByRole('dialog')).toContainText('入院评估不能替代每周期治疗前安全复核');await close(page);
 await page.reload();await page.getByRole('button',{name:/医生模式 Clinical/}).click();await expect(page.getByLabel('当前患者')).toBeVisible();await page.getByLabel('当前患者').selectOption(nextId);expect((await state(page,'doctor','learning',nextId)).day).toBe(2);
 await page.screenshot({path:'docs/v03-multi-clinic.png',fullPage:true});
});
test('开场隐藏病例，教学可指定，挑战随机后继续原进度',async({page})=>{
 await page.addInitScript(()=>{crypto.getRandomValues=((a:Uint32Array)=>{a.fill(0);return a;}) as typeof crypto.getRandomValues;});
 await page.goto('/');const menu=page.getByRole('dialog');await expect(menu.getByRole('button',{name:/周岚 · 早期/})).not.toBeVisible();
 await menu.getByText('指定教学病例 · 仅学习模式',{exact:true}).click();await expect(menu.getByRole('button',{name:/周岚 · 早期/})).toBeVisible();await menu.getByRole('button',{name:/周岚 · 早期/}).click();expect((await state(page,'doctor','learning','early-nsclc')).caseId).toBe('early-nsclc');
 await button(page,'主菜单').click();await button(page,'挑战模式 · 有限资源').click();await expect(page.getByLabel('当前患者')).toHaveValue('early-nsclc');await expect(page.getByLabel('当前患者').locator('option')).toHaveCount(1);await button(page,'＋1 天').click();
 await page.reload();await button(page,'挑战模式 · 有限资源').click();expect((await state(page,'doctor','challenge','early-nsclc')).day).toBe(2);
 await button(page,'主菜单').click();await page.screenshot({path:'docs/pixel-mode-menu.png',fullPage:true});
});
test('默认多患者：批量并行检查后在弹窗接诊下一位',async({page})=>{
 await start(page);await expect(page.getByLabel('当前患者')).toBeVisible();await go(page,'lab');
 for(const name of ['增强 CT','血常规与肾功能','肝功能','电解质'])await page.getByRole('checkbox',{name:'选择'+name,exact:true}).check();
 await button(page,'批量申请所选检查').click();let s=await state(page);expect(s.orders).toHaveLength(4);expect(s.day).toBe(1);expect(s.orders.every((o:any)=>o.availableAt===2)).toBe(true);
 await page.getByRole('dialog').getByRole('button',{name:'接诊下一位',exact:true}).click();const id=await page.getByLabel('切换接诊患者').inputValue();expect(id).not.toBe('driver-negative');await expect(page.getByRole('dialog')).toContainText('在管患者 2 人');
 await next(page);expect((await state(page)).orders.every((o:any)=>o.status==='completed')).toBe(true);await page.getByLabel('当前患者').selectOption('driver-negative');await go(page,'lab');await expect(page.getByRole('dialog')).toContainText('ALT 23');await page.screenshot({path:'docs/batch-investigations.png',fullPage:true});
});
test('七天门诊周：院内工作、临床奖励、事件阻断、升级及下周恢复',async({page})=>{
 await page.goto('/');await button(page,'七天门诊周 · 建设我的科室').click();await page.getByRole('dialog').getByRole('button',{name:'开始七天门诊周',exact:true}).click();
 const week=async()=>{await close(page);await page.getByRole('button',{name:/^科室周记 ·/}).click();};
 await go(page,'clinic');await button(page,'患者目标与意愿').click();await go(page,'lab');await page.getByRole('checkbox',{name:'选择增强 CT',exact:true}).check();await button(page,'批量申请所选检查').click();
 for(let day=1;day<=7;day++){
  await week();if(await button(page,'前往病房').count())await button(page,'前往病房').click();await button(page,'执行和护士小夏交班').click();
  const labels=['亲自整理交接本（1 行动）','协调返程信息（1 行动）','协助核对通知（1 行动）','一起午休（1 行动）','讨论可执行的生活计划（1 行动）','分担交接（2 行动）','组织团队复盘（1 行动）'];
  await page.getByRole('button',{name:new RegExp('^'+labels[day-1].replace(/[（）]/g,'\\$&'))}).click();
  await button(page,'结束当天并结算').click();
  if(day===2){await expect(page.getByRole('dialog')).toContainText('先处理后再下班');await confirmReports(page);await week();await button(page,'结束当天并结算').click();}
 }
 await expect(page.getByRole('dialog')).toContainText('第 1 周结算');await page.getByRole('button',{name:/购买聘请门诊协作护士/}).click();await page.getByRole('button',{name:/购买布置休息角/}).click();
 const pool=await page.evaluate(()=>JSON.parse(localStorage.getItem('oncolife-v3-campaign-doctor-learning')!));expect(pool.week.history).toHaveLength(7);expect(pool.week.upgrades).toEqual(['nurse','lounge']);expect(pool.week.history[0].clinical).toBe(2);expect(pool.patients['driver-negative'].orders).toHaveLength(1);
 await page.screenshot({path:'docs/clinic-week-summary.png',fullPage:true});await page.reload();await button(page,'七天门诊周 · 建设我的科室').click();await expect(page.getByRole('dialog')).toContainText('第 1 周结算');await button(page,'开始下一周').click();await expect(page.getByRole('dialog')).toContainText('第 2 周');await expect(page.getByRole('dialog')).toContainText('行动 4');await close(page);await page.screenshot({path:'docs/clinic-week-hospital.png',fullPage:true});await page.setViewportSize({width:390,height:844});await week();await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'docs/clinic-week-mobile.png',fullPage:true});
});
