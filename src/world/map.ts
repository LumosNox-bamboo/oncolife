export const W=960,H=640;
export const rooms=[
 {name:'肿瘤科门诊',x:16,y:16,w:292,h:228,color:0xe6efe4,door:160,side:'top'},
 {name:'检验科',x:328,y:16,w:292,h:228,color:0xe3edf0,door:470,side:'top'},
 {name:'影像科',x:640,y:16,w:304,h:228,color:0xe4e8f1,door:790,side:'top'},
 {name:'病房',x:16,y:396,w:292,h:228,color:0xf1ecdf,door:160,side:'bottom'},
 {name:'医生办公室',x:328,y:396,w:292,h:228,color:0xe7e9df,door:470,side:'bottom'},
 {name:'治疗室',x:640,y:396,w:304,h:228,color:0xe6ede8,door:790,side:'bottom'}
];
export const objects=[
 {id:'clinic',label:'患者 · 门诊',x:164,y:128,room:'肿瘤科门诊',kind:'person'},
 {id:'lab',label:'检验工作站',x:474,y:118,room:'检验科',kind:'computer'},
 {id:'scan',label:'影像工作站',x:794,y:128,room:'影像科',kind:'scanner'},
 {id:'ward',label:'患者 · 床旁',x:164,y:512,room:'病房',kind:'bed'},
 {id:'office',label:'指南与会诊',x:474,y:512,room:'医生办公室',kind:'computer'},
 {id:'therapy',label:'医嘱核对台',x:794,y:512,room:'治疗室',kind:'computer'},
 {id:'lobby',label:'接待 · 家属与支持',x:478,y:306,room:'医院大厅',kind:'reception'}
];
export type Rect={x:number;y:number;w:number;h:number};
export const walls:Rect[]=[{x:0,y:0,w:960,h:10},{x:0,y:630,w:960,h:10},{x:0,y:0,w:10,h:640},{x:950,y:0,w:10,h:640},...rooms.flatMap(r=>[{x:r.x,y:r.y,w:8,h:r.h},{x:r.x+r.w-8,y:r.y,w:8,h:r.h},{x:r.x,y:r.side==='top'?r.y:r.y+r.h-8,w:r.w,h:8},{x:r.x,y:r.side==='top'?r.y+r.h-8:r.y,w:r.door-r.x-30,h:8},{x:r.door+30,y:r.side==='top'?r.y+r.h-8:r.y,w:r.x+r.w-r.door-30,h:8}])];
export const furniture:Rect[]=objects.map(o=>({x:o.x-23,y:o.y-18,w:46,h:30}));
export function blocked(x:number,y:number){return [...walls,...furniture].some(r=>x+9>r.x&&x-9<r.x+r.w&&y+6>r.y&&y-6<r.y+r.h);}
export function roomAt(x:number,y:number){return rooms.find(r=>x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h)?.name||'医院大厅';}

export const destinations:Record<string,{x:number;y:number}>={clinic:{x:160,y:180},lab:{x:470,y:180},scan:{x:790,y:180},ward:{x:160,y:460},office:{x:470,y:460},therapy:{x:790,y:460},lobby:{x:470,y:350}};
// Grid BFS follows the same collision rules as manual movement. No diagonal wall shortcuts.
export function findPath(start:{x:number;y:number},end:{x:number;y:number}):{x:number;y:number}[]{
 const grid=10;const sx=Math.round(start.x/grid)*grid,sy=Math.round(start.y/grid)*grid;
 const key=(x:number,y:number)=>`${x},${y}`;const queue=[{x:sx,y:sy}];const parents=new Map<string,string|null>([[key(sx,sy),null]]);let found='';
 for(let i=0;i<queue.length;i++){const p=queue[i];if(Math.hypot(p.x-end.x,p.y-end.y)<8){found=key(p.x,p.y);break;}for(const [dx,dy] of [[grid,0],[-grid,0],[0,grid],[0,-grid]]){const x=p.x+dx,y=p.y+dy,k=key(x,y);if(x<10||x>950||y<10||y>630||parents.has(k)||blocked(x,y))continue;parents.set(k,key(p.x,p.y));queue.push({x,y});}}
 const path=[];while(found){const [x,y]=found.split(',').map(Number);path.push({x,y});found=parents.get(found)||'';}return path.reverse();
}
