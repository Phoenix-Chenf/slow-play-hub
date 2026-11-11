// 关卡数据由搜索器生成并验证。
import {LEVELS} from "./level-data.mjs?v=9";
const NAMES=['先让一让','两辆挡路车','绕开路口','错开车位','转出空间','先后顺序','留条通道','停车场谜题'];
const COLORS=['#e37e6f','#e2b969','#84b7ab','#959dcc','#d2a0b1','#a3bf8a','#d5a579','#78abc3','#bd9fc4','#c3b27b','#9ab7b4','#d49b89'];

export function buildLevel(number,mode="classic"){
 if(!LEVELS[mode])throw new RangeError('不存在的玩法');
 if(!Number.isInteger(number)||number<1||number>LEVELS[mode].length)throw new RangeError('不存在的关卡');
 const data=LEVELS[mode][number-1],cars=data.cars.map((c,i)=>({...c,id:i?'car'+i:'goal',target:i===0,color:COLORS[i%COLORS.length]}));
 return {number,mode,name:NAMES[number-1]??(number<=15?'错位挪车':number<=23?'交错车位':'重重围堵'),width:6,height:6,cars,exitRow:2,
   ...(data.parking?{parking:data.parking}:{}),...(data.obstacles?{obstacles:data.obstacles}:{}),
   solution:[...data.path.map(([i,delta])=>({id:cars[i].id,delta})),{exit:true}],minimumMoves:data.dist};
}
export function fresh(level){return {positions:Object.fromEntries(level.cars.map(c=>[c.id,{x:c.x,y:c.y}])),moves:0,history:[],exited:false};}
function readSnapshot(level,saved){
 if(!saved||!saved.positions||typeof saved.positions!=='object'||Array.isArray(saved.positions)||!Number.isSafeInteger(saved.moves)||saved.moves<0||typeof saved.exited!=='boolean')return null;
 const positions={},blocked=new Set((level.obstacles||[]).map(p=>`${p.x},${p.y}`));
 for(const car of level.cars){
  const p=saved.positions[car.id];
  if(!p||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0)return null;
  if(car.axis==='H'&&(p.y!==car.y||p.x+car.length>level.width))return null;
  if(car.axis==='V'&&(p.x!==car.x||p.y+car.length>level.height))return null;
  for(let i=0;i<car.length;i++){
   const key=`${p.x+(car.axis==='H'?i:0)},${p.y+(car.axis==='V'?i:0)}`;
   if(blocked.has(key))return null;
   blocked.add(key);
  }
  positions[car.id]={x:p.x,y:p.y};
 }
 const result={positions,moves:saved.moves,exited:saved.exited};
 if(result.exited&&(result.moves===0||!exit(level,{...result,history:[],exited:false}).ok))return null;
 return result;
}
function follows(level,previous,next){
 if(previous.exited||next.moves!==previous.moves+1)return false;
 const changed=level.cars.filter(car=>{
  const before=previous.positions[car.id],after=next.positions[car.id];
  return before.x!==after.x||before.y!==after.y;
 });
 if(next.exited)return changed.length===0&&exit(level,{...previous,history:[]}).ok;
 if(changed.length!==1)return false;
 const car=changed[0],before=previous.positions[car.id],after=next.positions[car.id];
 const result=move(level,{...previous,history:[]},car.id,car.axis==='H'?after.x-before.x:after.y-before.y);
 return result.ok&&!result.state.exited;
}
// Keep a valid current board even if its optional undo trail was damaged.
export function restore(level,saved){
 const current=readSnapshot(level,saved);
 if(!current)return fresh(level);
 let history=[];
 if(Array.isArray(saved.history)){
  const snapshots=saved.history.map(item=>readSnapshot(level,item));
  if(snapshots.every((item,index)=>item&&follows(level,item,snapshots[index+1]||current)))history=snapshots;
 }
 return {...current,history};
}
const copyPositions=positions=>Object.fromEntries(Object.entries(positions).map(([id,p])=>[id,{...p}]));
function snapshot(state){return {positions:copyPositions(state.positions),moves:state.moves,exited:state.exited};}
function occupied(level,state,excluding){
 const set=new Set((level.obstacles||[]).map(p=>`${p.x},${p.y}`));
 for(const car of level.cars){
  if(car.id===excluding||(car.target&&state.exited))continue;
  const position=state.positions[car.id];
  for(let i=0;i<car.length;i++)set.add(`${position.x+(car.axis==='H'?i:0)},${position.y+(car.axis==='V'?i:0)}`);
 }
 return set;
}
export function move(level,state,id,delta){
 const car=level.cars.find(c=>c.id===id);
 if(state.exited)return {ok:false,reason:'finished'};
 if(!car||!Number.isInteger(delta)||delta===0)return {ok:false,reason:'invalid'};
 const position=state.positions[id], dx=car.axis==='H'?Math.sign(delta):0,dy=car.axis==='V'?Math.sign(delta):0;
 const nextX=position.x+dx*Math.abs(delta),nextY=position.y+dy*Math.abs(delta);
 if(car.target&&delta>0&&car.axis==='H'&&nextX+car.length>level.width)return exit(level,state);
 if(nextX<0||nextY<0||nextX+(car.axis==='H'?car.length:1)>level.width||nextY+(car.axis==='V'?car.length:1)>level.height)return {ok:false,reason:'outside'};
 const blockers=occupied(level,state,id);
 for(let step=1;step<=Math.abs(delta);step++){
  const x=position.x+dx*step,y=position.y+dy*step;
  for(let i=0;i<car.length;i++)if(blockers.has(`${x+(car.axis==='H'?i:0)},${y+(car.axis==='V'?i:0)}`))return {ok:false,reason:'blocked'};
 }
 const positions=copyPositions(state.positions);positions[id]={x:nextX,y:nextY};
 return {ok:true,state:{positions,moves:state.moves+1,history:[...state.history,snapshot(state)],exited:false}};
}
export function exit(level,state){
 if(state.exited)return {ok:false,reason:'finished'};
 const car=level.cars.find(c=>c.target),position=car&&state.positions[car.id];
 if(!car||car.axis!=='H'||position.y!==level.exitRow)return {ok:false,reason:'invalid'};
 if(level.parking){const p=state.positions[level.parking.id];if(!p||p.x!==level.parking.x||p.y!==level.parking.y)return {ok:false,reason:'parking'};}
 const blockers=occupied(level,state,car.id);
 for(let x=position.x+car.length;x<level.width;x++)if(blockers.has(`${x},${position.y}`))return {ok:false,reason:'blocked'};
 return {ok:true,state:{positions:copyPositions(state.positions),moves:state.moves+1,history:[...state.history,snapshot(state)],exited:true}};
}
export function undo(state){
 if(!state.history.length)return null;
 const previous=state.history[state.history.length-1];
 return {positions:copyPositions(previous.positions),moves:previous.moves,exited:previous.exited,history:state.history.slice(0,-1)};
}
export function solved(level,state){return state.exited===true;}
