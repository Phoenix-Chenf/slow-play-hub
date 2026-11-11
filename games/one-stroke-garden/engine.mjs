// Each path generates an undirected graph without repeated edges; traversing
// intersections multiple times is allowed, but a road can only be used once.
const PATHS = [
 [[1,0],[2,0],[2,1],[1,1],[1,0]],
 [[2,2],[2,3],[1,3],[1,4],[2,4],[2,3],[3,3],[4,3]],
 [[2,2],[2,1],[1,1],[1,0],[0,0],[0,1],[1,1],[1,2],[2,2],[3,2],[3,3]],
 [[0,1],[1,1],[1,2],[2,2],[2,3],[2,4],[3,4],[3,3],[2,3],[1,3],[1,2],[0,2],[0,1],[0,0]],
 [[1,1],[1,2],[2,2],[2,1],[2,0],[3,0],[3,1],[3,2],[2,2],[2,3],[3,3],[3,2],[4,2],[4,1],[3,1],[2,1],[1,1]],
 [[2,2],[1,2],[1,3],[2,3],[2,2],[3,2],[3,3],[2,3],[2,4],[1,4],[1,3],[0,3],[0,2],[1,2],[1,1],[1,0],[2,0],[2,1],[1,1],[0,1]],
 [[0,2],[1,2],[1,3],[1,4],[2,4],[2,3],[3,3],[3,4],[4,4],[4,3],[3,3],[3,2],[2,2],[2,1],[1,1],[1,2],[2,2],[2,3],[1,3],[0,3],[0,2],[0,1],[0,0]],
 [[1,0],[2,0],[2,1],[3,1],[3,2],[2,2],[2,3],[2,4],[1,4],[1,3],[1,2],[2,2],[2,1],[1,1],[1,0],[0,0],[0,1],[1,1],[1,2],[0,2],[0,3],[1,3],[2,3],[3,3],[3,2],[4,2]]
];

import {GENERATED_PATHS} from './generated-paths.mjs?v=20261105a';
const NAMES=['小小回环','花园岔路','转角小径','树下漫步','绕个圈儿','石阶之间','蜿蜒花径','走遍花园'];
const nodeId=([x,y])=>`p${x}-${y}`;
const edgeKey=(a,b)=>a<b?`${a}|${b}`:`${b}|${a}`;
const modeIds=['classic','oneway','checkpoints'];

export function buildLevel(number,mode='classic'){
 if(!Number.isInteger(number)||number<1||number>30||!modeIds.includes(mode))throw new RangeError('不存在的关卡');
 const coords=mode==='classic'&&number<=8?PATHS[number-1]:GENERATED_PATHS[mode][mode==='classic'?number-9:number-1];
 const nodes=[],seen=new Set();
 for(const point of coords){const id=nodeId(point);if(!seen.has(id)){seen.add(id);nodes.push({id,x:point[0],y:point[1]})}}
 const solution=coords.map(nodeId),edges=solution.slice(1).map((id,i)=>({id:`e${i}`,a:solution[i],b:id,...(mode==='oneway'?{from:solution[i],to:id}:{})}));
 let checkpoints=[];
 if(mode==='checkpoints'){
  const first=solution.slice(1).filter((id,i,arr)=>id!==solution[0]&&arr.indexOf(id)===i);
  const count=Math.min(first.length,number<4?1:number<11?2:number<21?3:4);
  checkpoints=Array.from({length:count},(_,i)=>first[Math.floor((i+1)*(first.length-1)/(count+1))]);
 }
 return {number,mode,name:mode==='classic'&&number<=8?NAMES[number-1]:number<=10?'小径初探':number<=20?'花园漫步':'岔路深处',nodes,edges,start:solution[0],solution,checkpoints};
}
export function fresh(level){return {path:[level.start]}}
function checkpointProgress(level,path){
 let next=0;const points=level.checkpoints||[];
 for(const id of path){const index=points.indexOf(id);if(index<0||index<next)continue;if(index!==next)return -1;next++}
 return next;
}
function remaining(level,state){
 if(!state||!Array.isArray(state.path)||state.path.length<1||state.path[0]!==level.start)return null;
 const all=new Map(level.edges.map(e=>[edgeKey(e.a,e.b),e]));
 if(all.size!==level.edges.length||checkpointProgress(level,state.path)<0)return null;
 for(let i=1;i<state.path.length;i++){
  const key=edgeKey(state.path[i-1],state.path[i]), edge=all.get(key);
  if(!edge||(level.mode==='oneway'&&(edge.from!==state.path[i-1]||edge.to!==state.path[i])))return null;
  all.delete(key);
 }
 return [...all.values()];
}
export function move(level,state,node){
 const rest=remaining(level,state);if(!rest)return {ok:false,reason:'invalid'};
 if(rest.length===0)return {ok:false,reason:'finished'};
 const here=state.path[state.path.length-1],matches=e=>e.a===here&&e.b===node||e.b===here&&e.a===node;
 if(!level.edges.some(matches))return {ok:false,reason:'nonadjacent'};
 const edge=rest.find(matches);if(!edge)return {ok:false,reason:'used'};
 if(level.mode==='oneway'&&(edge.from!==here||edge.to!==node))return {ok:false,reason:'direction'};
 if(level.mode==='checkpoints'){
  const index=(level.checkpoints||[]).indexOf(node), next=checkpointProgress(level,state.path);
  if(index>=next+1)return {ok:false,reason:'checkpoint'};
 }
 return {ok:true,state:{path:[...state.path,node]}};
}
export function undo(state){return state?.path?.length>1?{path:state.path.slice(0,-1)}:null}
export function solved(level,state){const rest=remaining(level,state);return rest!==null&&rest.length===0&&checkpointProgress(level,state.path)===(level.checkpoints||[]).length}

// Necessary and sufficient Euler-trail test for undirected paths.
function canFinish(edges,here){
 if(!edges.length)return true;
 const adjacent=new Map();
 for(const {a,b} of edges){if(!adjacent.has(a))adjacent.set(a,[]);if(!adjacent.has(b))adjacent.set(b,[]);adjacent.get(a).push(b);adjacent.get(b).push(a)}
 if(!adjacent.has(here))return false;
 const odd=[...adjacent].filter(([,neighbors])=>neighbors.length%2).map(([id])=>id);
 if(odd.length!==0&&(odd.length!==2||!odd.includes(here)))return false;
 const seen=new Set([here]),todo=[here];while(todo.length)for(const id of adjacent.get(todo.pop()))if(!seen.has(id)){seen.add(id);todo.push(id)}
 return seen.size===adjacent.size;
}
// The same criterion for a directed Euler trail: balanced degrees, at most one
// start/end imbalance, and weakly connected remaining edges.
function canFinishDirected(edges,here){
 if(!edges.length)return true;
 const adjacent=new Map(),delta=new Map();
 for(const {from:a,to:b} of edges){
  if(!adjacent.has(a))adjacent.set(a,[]);if(!adjacent.has(b))adjacent.set(b,[]);adjacent.get(a).push(b);adjacent.get(b).push(a);
  delta.set(a,(delta.get(a)||0)+1);delta.set(b,(delta.get(b)||0)-1);
 }
 if(!adjacent.has(here))return false;
 const plus=[...delta].filter(([,n])=>n===1).map(([n])=>n),minus=[...delta].filter(([,n])=>n===-1).map(([n])=>n);
 if([...delta.values()].some(n=>Math.abs(n)>1)||!(plus.length===0&&minus.length===0||plus.length===1&&minus.length===1&&plus[0]===here))return false;
 if(!edges.some(e=>e.from===here))return false;
 const seen=new Set([here]),todo=[here];while(todo.length)for(const id of adjacent.get(todo.pop()))if(!seen.has(id)){seen.add(id);todo.push(id)}
 return seen.size===adjacent.size;
}
function checkpointNext(level,state,rest){
 const points=level.checkpoints||[],initial=checkpointProgress(level,state.path),seen=new Set();
 function dfs(edges,here,progress){
  if(!edges.length)return progress===points.length?[]:null;
  if(!canFinish(edges,here))return null;
  const key=here+'|'+progress+'|'+edges.map(e=>e.id).join(',');if(seen.has(key))return null;seen.add(key);
  for(let i=0;i<edges.length;i++){
   const e=edges[i];if(e.a!==here&&e.b!==here)continue;
   const to=e.a===here?e.b:e.a,index=points.indexOf(to);
   if(index>progress)continue;
   const next=progress+(index===progress?1:0),path=dfs([...edges.slice(0,i),...edges.slice(i+1)],to,next);
   if(path)return [to,...path];
  }
  return null;
 }
 return dfs(rest,state.path[state.path.length-1],initial);
}
export function isSolvable(level,state){
 const rest=remaining(level,state);if(rest===null)return false;
 if(level.mode==='oneway')return canFinishDirected(rest,state.path[state.path.length-1]);
 if(level.mode==='checkpoints')return checkpointNext(level,state,rest)!==null;
 return canFinish(rest,state.path[state.path.length-1]);
}
export function hint(level,state){
 const rest=remaining(level,state);if(!rest||!rest.length)return null;
 if(level.mode==='checkpoints')return checkpointNext(level,state,rest)?.[0]??null;
 const here=state.path[state.path.length-1];
 for(const edge of rest){
  if(edge.a!==here&&edge.b!==here)continue;
  const next=edge.a===here?edge.b:edge.a;
  if(level.mode==='oneway'&&(edge.from!==here||edge.to!==next))continue;
  const others=rest.filter(e=>e!==edge);
  if((level.mode==='oneway'?canFinishDirected:canFinish)(others,next))return next;
 }
 return null;
}
