import {test,expect,Page} from '@playwright/test';
async function position(p:Page){return p.evaluate(async()=>{const m=await import('/src/world/Hospital.ts' as string);return {x:m.activeScene.px,y:m.activeScene.py};});}
async function axis(p:Page,key:string,coord:'x'|'y',target:number){const pos=await position(p);if(Math.abs(pos[coord]-target)<4)return;await p.keyboard.down(key);try{await expect.poll(async()=>{const v=(await position(p))[coord];return ['ArrowRight','ArrowDown'].includes(key)?v>=target:v<=target;},{timeout:10000,intervals:[20]}).toBe(true);}finally{await p.keyboard.up(key);}}
async function move(p:Page,x:number,y:number){const pos=await position(p);await axis(p,pos.x<x?'ArrowRight':'ArrowLeft','x',x);const now=await position(p);await axis(p,now.y<y?'ArrowDown':'ArrowUp','y',y);}
async function close(p:Page){if(await p.getByRole('dialog').count())await p.getByRole('button',{name:'返回医院 ×'}).click();}
const places:Record<string,[number,number]>={clinic:[160,185],lab:[470,180],scan:[790,185],ward:[160,460],office:[470,460],therapy:[790,460],lobby:[470,350]};
async function room(p:Page,id:string){
 await close(p);const pos=await position(p);
 if(pos.y<245){await axis(p,'ArrowDown','y',260);const mid=await position(p);await move(p,mid.x-65,260);await axis(p,'ArrowDown','y',350);}
 else if(pos.y>395)await axis(p,'ArrowUp','y',350);
 const [x,y]=places[id];
 if(y<245){await move(p,x-65,350);await axis(p,'ArrowUp','y',260);await move(p,x,260);await axis(p,'ArrowUp','y',y);}
 else await move(p,x,y);
 await p.keyboard.press('e');await expect(p.getByRole('dialog')).toBeVisible();
}
async function click(p:Page,name:string){await p.getByRole('button',{name,exact:false}).click();}
async function role(p:Page,r:string){await room(p,'lobby');await p.getByRole('button',{name:r,exact:false}).click();await close(p);}
async function time(p:Page,label:string){await close(p);await click(p,label);}
async function state(p:Page){return p.evaluate(()=>JSON.parse(localStorage.getItem('oncolife-v1')!));}
test('真实键盘探索、完整病例与刷新续档',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await page.waitForTimeout(500);await page.screenshot({path:'docs/hospital-desktop.png',fullPage:true});
 // Move into a solid partition, then verify movement stops before the wall.
 await move(page,350,280);await page.keyboard.down('ArrowUp');await page.waitForTimeout(700);await page.keyboard.up('ArrowUp');expect((await position(page)).y).toBeGreaterThan(248);await move(page,350,325);
 await room(page,'clinic');await click(page,'与林晓禾交谈');await click(page,'采集病史与体检');const flags=(await state(page)).flags;
 await role(page,'患者');expect((await state(page)).flags).toEqual(flags);await room(page,'clinic');await click(page,'表达治疗偏好');await click(page,'确认诊断与分期');await expect(page.locator('.feedback')).toContainText('需要医生身份');
 await role(page,'肿瘤科医生');await room(page,'lab');await click(page,'申请血常规与肾功能');await click(page,'申请病理与分子检测');await room(page,'scan');await click(page,'申请分期影像');await time(page,'＋1 天');await time(page,'＋1 天');
 await room(page,'lab');await expect(page.locator('.report').first()).toContainText('ANC 3.2');await room(page,'clinic');await click(page,'确认诊断与分期');await room(page,'office');await click(page,'申请多学科会诊');await room(page,'clinic');await click(page,'共同选择培美曲塞＋顺铂');await room(page,'therapy');await click(page,'确认治疗前准备');await time(page,'＋1 周');await room(page,'lab');await click(page,'申请血常规与肾功能');await time(page,'下一次预约');await room(page,'therapy');await click(page,'审核当日治疗医嘱');
 await role(page,'护士');await room(page,'therapy');await click(page,'执行首周期治疗');expect((await state(page)).treatmentDay).not.toBeNull();await time(page,'＋1 周');expect((await state(page)).event).toBe(true);await page.screenshot({path:'docs/clinical-event.png',fullPage:true});const day=(await state(page)).day;await time(page,'＋1 周');expect((await state(page)).day).toBe(day);
 await room(page,'ward');await click(page,'测量生命体征');await click(page,'上报异常');await click(page,'支线：倾听');await role(page,'肿瘤科医生');await room(page,'ward');await click(page,'评估发热');await room(page,'lab');await click(page,'感染检查与培养采样');await room(page,'ward');await click(page,'开立紧急处置');await role(page,'护士');await room(page,'ward');await click(page,'执行紧急医嘱');await role(page,'肿瘤科医生');await room(page,'lab');await click(page,'申请恢复复查');await time(page,'下一次预约');expect((await state(page)).resolved).toBe(true);
 await room(page,'scan');await click(page,'申请随访影像');await time(page,'下一次预约');await room(page,'clinic');await click(page,'完成随访与后续决策');expect((await state(page)).phase).toBe('完成');await expect(page.locator('.success')).toContainText('未自动继续用药');await page.screenshot({path:'docs/completed-case.png',fullPage:true});
 await close(page);await click(page,'存档');const before=await state(page);await page.reload();await expect(page.locator('canvas')).toBeVisible();expect(await state(page)).toEqual(before);await click(page,'病历 / 时间线');await expect(page.locator('.success')).toBeVisible();expect(errors).toEqual([]);
});
test('触屏布局与虚拟方向键',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await page.waitForTimeout(400);const before=await position(page);const b=page.getByRole('button',{name:'移动→'});await b.dispatchEvent('pointerdown',{pointerId:1});await page.waitForTimeout(350);await b.dispatchEvent('pointerup',{pointerId:1});expect((await position(page)).x).toBeGreaterThan(before.x);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'docs/hospital-mobile.png',fullPage:true});});
