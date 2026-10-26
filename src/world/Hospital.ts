import Phaser from 'phaser';
import {useGame} from '../engine/store';
import {W,H,rooms,objects,walls,blocked,roomAt,destinations,findPath} from './map';
export let activeScene: Hospital;
export const controls={x:0,y:0,interact:false};
export class Hospital extends Phaser.Scene{
 px=350;py=325;keys!:Record<string,Phaser.Input.Keyboard.Key>;avatar!:Phaser.GameObjects.Container;hint!:Phaser.GameObjects.Text;walking=0;lastRoom='';
 route:{x:number;y:number}[]=[];
 travel(id:string,walk=false){const target=destinations[id];if(!target)return;useGame.getState().open(null);if(walk){this.route=findPath({x:this.px,y:this.py},target);useGame.setState({notice:this.route.length?'正在自动寻路；方向键可取消':'路线不可达，请使用快速旅行'});}else{this.route=[];this.px=target.x;this.py=target.y;useGame.getState().setRoom(roomAt(this.px,this.py));}}
 constructor(){super('hospital');}
 create(){
 activeScene=this;
 const g=this.add.graphics();g.fillStyle(0xcbd9d5).fillRect(0,0,W,H);
 for(let y=8;y<H;y+=32)for(let x=8;x<W;x+=32){g.fillStyle(((x+y)/32)%2?0xe4ece4:0xdce6df).fillRect(x,y,31,31);}
 rooms.forEach(r=>{g.fillStyle(r.color).fillRect(r.x,r.y,r.w,r.h);for(let y=r.y+10;y<r.y+r.h-8;y+=24)for(let x=r.x+10;x<r.x+r.w-8;x+=24){g.lineStyle(1,0xb6c9c0,0.3).strokeRect(x,y,24,24);}this.add.text(r.x+18,r.y+18,r.name,{fontFamily:'monospace',fontSize:'16px',color:'#456359',backgroundColor:'#ffffffb0',padding:{x:8,y:5}});});
 walls.forEach(r=>{g.fillStyle(0x819c96).fillRect(r.x,r.y,r.w,r.h);g.fillStyle(0xf4f7ed).fillRect(r.x,r.y,r.w,3);});
 // Original procedural pixel furniture, windows, plants and signage.
 rooms.forEach(r=>{for(let i=0;i<2;i++){const x=r.x+40+i*130,y=r.side==='top'?r.y+58:r.y+r.h-28;g.fillStyle(0x83acb5).fillRect(x,y,62,12);g.fillStyle(0xc9e9e6).fillRect(x+3,y+2,27,7).fillRect(x+33,y+2,26,7);}const x=r.x+r.w-40,y=r.y+75;g.fillStyle(0xb28766).fillRect(x,y+10,16,17);g.fillStyle(0x63916a).fillRect(x-5,y-8,26,21);g.fillStyle(0x88ad75).fillRect(x,y-14,16,12);});
 // seating along the central passage
 for(const x of [65,110,690,735,780,825]){g.fillStyle(0x789f99).fillRect(x,350,30,15);g.fillStyle(0xb9d5c9).fillRect(x,348,30,7);g.fillStyle(0x53766c).fillRect(x+3,365,3,6).fillRect(x+24,365,3,6);}
 this.add.text(54,280,'✚ 晴 光 医 院',{fontSize:'20px',fontFamily:'monospace',color:'#66877d'});
 this.add.text(684,286,'让每一次照护，都被看见',{fontSize:'12px',color:'#68877b'});
 objects.forEach(o=>{
 const x=o.x,y=o.y;
 g.fillStyle(0x6a8176,0.2).fillEllipse(x,y+20,64,16);
 if(o.kind==='bed'){g.fillStyle(0x829e99).fillRect(x-30,y-22,60,48);g.fillStyle(0xfefcf1).fillRect(x-27,y-20,54,14);g.fillStyle(0xa0c4b6).fillRect(x-27,y-3,54,26);g.fillStyle(0xe2b790).fillRect(x-8,y-17,16,14);}
 else if(o.kind==='person'){g.fillStyle(0xc49a79).fillRect(x-30,y+2,60,20);this.npc(x,y-12,0xb58477);}
 else if(o.kind==='scanner'){g.fillStyle(0x9faeb9).fillRect(x-32,y-28,64,48);g.fillStyle(0xf9fff9).fillRect(x-25,y-22,50,36);g.fillStyle(0x637c8e).fillRect(x-15,y-16,30,26);g.fillStyle(0xc2d6df).fillRect(x-11,y+3,22,34);}
 else {g.fillStyle(0x967d62).fillRect(x-30,y,60,24);g.fillStyle(0xc4ad86).fillRect(x-32,y-3,64,9);g.fillStyle(0x486869).fillRect(x-17,y-26,34,25);g.fillStyle(0xa5d9cc).fillRect(x-13,y-22,26,17);g.fillStyle(0xe5f6de).fillRect(x-10,y-19,17,3);}
 this.add.text(x,y+39,o.label,{fontSize:'12px',color:'#395e56',backgroundColor:'#ffffffa0',padding:{x:4,y:3}}).setOrigin(.5);
 this.add.zone(x,y,88,90).setInteractive({useHandCursor:true}).on('pointerdown',()=>{if(Math.hypot(this.px-x,this.py-y)<100)useGame.getState().open(o.id);else useGame.setState({notice:'请先走近目标，再点击或按 E 互动。'});});
 });
 this.npc(575,330,0xe2efef);this.npc(255,470,0x8cb3bd);
 const shadow=this.add.ellipse(0,7,24,9,0x456858,.25);const body=this.add.rectangle(0,-7,16,21,0xf7faf0);const head=this.add.rectangle(0,-26,14,14,0xe8bf99);const hair=this.add.rectangle(0,-33,16,6,0x4d5045);const leg1=this.add.rectangle(-5,7,5,11,0x455f6c);const leg2=this.add.rectangle(5,7,5,11,0x455f6c);const cross=this.add.text(-4,-16,'+',{fontSize:'12px',color:'#cf7966'});
 this.avatar=this.add.container(this.px,this.py,[shadow,leg1,leg2,body,head,hair,cross]).setDepth(10);
 this.hint=this.add.text(480,614,'',{fontSize:'14px',color:'#fffdf1',backgroundColor:'#375f55',padding:{x:12,y:7}}).setOrigin(.5).setDepth(20);
 this.keys=this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as typeof this.keys;
 this.input.keyboard!.on('keydown-E',()=>{if(!useGame.getState().panel&&!useGame.getState().menu)this.interact();});
 this.input.keyboard!.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
 }
 interact(){const nearest=objects.find(o=>Math.hypot(o.x-this.px,o.y-this.py)<88);if(nearest)useGame.getState().open(nearest.id);}
 npc(x:number,y:number,color:number){const g=this.add.graphics();g.fillStyle(0x57746b).fillRect(x-7,y+8,5,12).fillRect(x+2,y+8,5,12);g.fillStyle(color).fillRect(x-10,y-10,20,22);g.fillStyle(0xe4bc99).fillRect(x-7,y-24,14,14);g.fillStyle(0x555647).fillRect(x-8,y-27,16,6);}
 update(_:number,dt:number){
 if(!this.keys)return;const store=useGame.getState();if(store.panel||store.menu){this.route=[];controls.x=0;controls.y=0;controls.interact=false;return;}
 let dx=Number(this.keys.D.isDown||this.keys.RIGHT.isDown)-Number(this.keys.A.isDown||this.keys.LEFT.isDown)+controls.x;let dy=Number(this.keys.S.isDown||this.keys.DOWN.isDown)-Number(this.keys.W.isDown||this.keys.UP.isDown)+controls.y;
 if(dx||dy)this.route=[];
 if(this.route.length){const p=this.route[0];if(Math.hypot(p.x-this.px,p.y-this.py)<4){this.route.shift();}else{dx=p.x-this.px;dy=p.y-this.py;}}
 const n=Math.hypot(dx,dy);if(n){dx/=n;dy/=n;const step=Math.min(dt,35)*.15;const nx=this.px+dx*step,ny=this.py+dy*step;if(!blocked(nx,this.py))this.px=nx;if(!blocked(this.px,ny))this.py=ny;this.walking+=dt;}
 this.avatar.setPosition(Math.round(this.px),Math.round(this.py));const children=this.avatar.list as Phaser.GameObjects.Rectangle[];(children[3] as Phaser.GameObjects.Rectangle).setFillStyle(store.state.role==='doctor'?0xf9fcf1:0xd9a880);children[1].y=7+(n?Math.sin(this.walking/85)*3:0);children[2].y=7-(n?Math.sin(this.walking/85)*3:0);
 const room=roomAt(this.px,this.py);if(room!==this.lastRoom){store.setRoom(room);this.lastRoom=room;}
 const nearest=objects.find(o=>Math.hypot(o.x-this.px,o.y-this.py)<88);this.hint.setText(nearest?`E / 点击 · ${nearest.label}`:'WASD / 方向键移动 · 门口可以通行');
 if(controls.interact){controls.interact=false;if(nearest)store.open(nearest.id);}
 }
}
export function startGame(parent:HTMLElement){return new Phaser.Game({type:Phaser.AUTO,parent,width:W,height:H,backgroundColor:'#dce6df',pixelArt:true,antialias:false,scene:Hospital,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}});}
