// Bits are the pipe openings in clockwise order: north, east, south, west.
export const NORTH=1, EAST=2, SOUTH=4, WEST=8;
const DIRS = [
  {dr:-1,dc:0,bit:NORTH,opposite:SOUTH},
  {dr:0,dc:1,bit:EAST,opposite:WEST},
  {dr:1,dc:0,bit:SOUTH,opposite:NORTH},
  {dr:0,dc:-1,bit:WEST,opposite:EAST},
];

// Paths form connected reference networks. Loose ends never prevent success.
const LEVELS = [
  {name:'第一滴水',cols:3,rows:3,paths:[
    [[0,0],[0,1],[1,1],[1,2],[2,2]]
  ]},
  {name:'拐个弯',cols:4,rows:3,paths:[
    [[0,0],[1,0],[1,1],[1,2],[0,2],[0,3],[1,3],[2,3]]
  ]},
  {name:'水分两路',cols:4,rows:4,paths:[
    [[0,0],[0,1],[1,1],[2,1],[2,2],[3,2],[3,3]],
    [[1,1],[1,2],[1,3],[0,3]]
  ]},
  {name:'绕一小圈',cols:4,rows:4,paths:[
    [[0,0],[1,0],[2,0],[2,1],[1,1],[1,2],[1,3],[0,3]],
    [[2,1],[2,2],[3,2],[3,3]]
  ]},
  {name:'三处花园',cols:4,rows:5,paths:[
    [[0,0],[0,1],[1,1],[2,1],[2,2],[2,3],[1,3],[0,3]],
    [[2,1],[3,1],[4,1],[4,0]],
    [[2,3],[3,3],[4,3],[4,2]]
  ]},
  {name:'分岔小径',cols:5,rows:5,paths:[
    [[0,0],[1,0],[2,0],[2,1],[1,1],[0,1],[0,2],[0,3],[1,3],[1,4],[0,4]],
    [[2,1],[2,2],[3,2],[4,2],[4,3],[4,4]],
    [[3,2],[3,1],[3,0],[4,0]]
  ]},
  {name:'四方来水',cols:5,rows:5,paths:[
    [[0,0],[0,1],[1,1],[2,1],[2,2],[1,2],[0,2],[0,3],[0,4]],
    [[2,1],[3,1],[4,1],[4,0]],
    [[2,2],[2,3],[2,4],[1,4]],
    [[2,3],[3,3],[4,3],[4,4]]
  ]},
  {name:'满园都接通',cols:5,rows:6,paths:[
    [[0,0],[1,0],[1,1],[2,1],[2,2],[1,2],[0,2],[0,3],[0,4],[1,4]],
    [[2,1],[3,1],[4,1],[5,1],[5,0]],
    [[2,2],[2,3],[3,3],[4,3],[5,3],[5,4]],
    [[2,3],[2,4],[3,4]],
    [[3,1],[3,0],[4,0]]
  ]},
];

export function rotatedMask(mask, turns) {
  let bits=mask&15;
  for(let i=0;i<((turns%4)+4)%4;i++) bits=((bits<<1)&15)|(bits>>3);
  return bits;
}

function random(seed) {
  return () => {seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
}

// Grow a connected tree with at most three connections per cell.  The parent
// paths are a construction certificate: every opening is paired in the answer.
function generatedConfig(number, mode) {
  const cols=5, rows=number>=18?6:5;
  const size=Math.min(cols*rows,23+Math.floor((number-9)*7/21));
  const modeSeed=mode==='classic'?0:mode==='sealed'?193:419;
  for(let attempt=0;attempt<100;attempt++) {
    const rng=random(number*198491+modeSeed*4597+attempt*7919);
    const parent=new Map([[0,null]]), degree=new Map([[0,0]]);
    while(parent.size<size) {
      const choices=[];
      for(const id of parent.keys()) {
        if(degree.get(id)>=3) continue;
        const row=Math.floor(id/cols), col=id%cols;
        for(const d of DIRS) {
          const r=row+d.dr,c=col+d.dc;
          if(r<0||r>=rows||c<0||c>=cols) continue;
          const next=r*cols+c;
          if(!parent.has(next)) choices.push({id,next});
        }
      }
      if(!choices.length) break;
      const leaves=[...parent.keys()].filter(id=>id!==0&&degree.get(id)===1).length;
      const extensions=choices.filter(({id})=>id!==0&&degree.get(id)===1);
      const pool=leaves>=5&&extensions.length?extensions:choices;
      const {id,next}=pool[Math.floor(rng()*pool.length)];
      parent.set(next,id);degree.set(id,degree.get(id)+1);degree.set(next,1);
    }
    const leaves=[...parent.keys()].filter(id=>id!==0&&degree.get(id)===1);
    if(parent.size!==size||leaves.length<2||leaves.length>5) continue;
    const paths=leaves.map(leaf=>{
      const path=[]; for(let id=leaf;id!=null;id=parent.get(id))path.push([Math.floor(id/cols),id%cols]);
      return path.reverse();
    });
    return {name:`水路探险 ${number}`,cols,rows,paths};
  }
  throw new Error(`第 ${number} 关无法生成`);
}

export function buildLevel(number, mode='classic') {
  if(!Number.isInteger(number)||number<1||number>30||!['classic','sealed','duo'].includes(mode)) throw new RangeError('不存在的关卡');
  const config=number<=8?LEVELS[number-1]:generatedConfig(number,mode);
  const {cols,rows,paths,name}=config;
  const positions=new Map();
  const key=([r,c])=>r*cols+c;
  const note=([r,c])=>{
    if(r<0||r>=rows||c<0||c>=cols) throw new Error('关卡坐标越界');
    const i=r*cols+c;
    if(!positions.has(i)) positions.set(i,{row:r,col:c,base:0});
    return positions.get(i);
  };
  for(const path of paths) for(let i=0;i<path.length;i++) {
    const here=note(path[i]);
    if(i===0) continue;
    const previous=note(path[i-1]), dr=here.row-previous.row, dc=here.col-previous.col;
    const direction=DIRS.find(d=>d.dr===dr && d.dc===dc);
    if(!direction) throw new Error('管道路径不相邻');
    previous.base |= direction.bit; here.base |= direction.opposite;
  }
  const source=key(paths[0][0]), targets=paths.map(path=>key(path[path.length-1]));
  if(new Set(targets).size!==targets.length || targets.includes(source)) throw new Error('终点重复');
  const modeSeed=mode==='classic'?0:mode==='sealed'?517:1297;
  const rng=random(5021+number*7411+modeSeed), tiles=Array(cols*rows).fill(null);
  for(const [id,item] of positions){
    if(!item.base || item.base===15) throw new Error('关卡包含无法转动的管道');
    // A straight pipe rotated twice looks unchanged; use odd turns there.
    const straight=item.base===5 || item.base===10;
    const initial=straight ? (rng()<0.5?1:3) : 1+Math.floor(rng()*3);
    tiles[id]={...item,initial,kind:id===source?'source':targets.includes(id)?'target':'pipe'};
  }
  const level={number,name,cols,rows,tiles,source,targets,solution:tiles.map(()=>0)};
  if(mode!=='classic') {
    level.mode=mode;
    if(mode==='duo') {
      // A distant internal point is the second source; neither source is a target.
      const distances=new Map([[source,0]]), queue=[source];
      for(let cursor=0;cursor<queue.length;cursor++) {
        const id=queue[cursor], row=Math.floor(id/cols), col=id%cols;
        for(const d of DIRS) {
          const r=row+d.dr,c=col+d.dc;
          if(r<0||r>=rows||c<0||c>=cols||!(tiles[id].base&d.bit)) continue;
          const next=r*cols+c;
          if(tiles[next]&&(tiles[next].base&d.opposite)&&!distances.has(next)){distances.set(next,distances.get(id)+1);queue.push(next);}
        }
      }
      const choices=[...distances.keys()].filter(id=>id!==source&&!targets.includes(id));
      choices.sort((a,b)=>distances.get(b)-distances.get(a));
      if(!choices.length) throw new Error('缺少第二水源位置');
      level.sources=[source,choices[0]];tiles[choices[0]].kind='source2';
    }
  }
  if(!analyze(level,{rotations:level.solution}).done) throw new Error('关卡解答不连通');
  if(analyze(level,fresh(level)).done) throw new Error('初始布局已经通关');
  return level;
}

export function fresh(level) {
  return {rotations:level.tiles.map(tile=>tile?.initial ?? 0),moves:0,history:[]};
}

export function rotate(level,state,index) {
  if(!Number.isInteger(index) || !level.tiles[index]) return {ok:false,reason:'empty'};
  const previous={rotations:state.rotations.slice(),moves:state.moves};
  const rotations=state.rotations.slice();
  rotations[index]=(rotations[index]+1)%4;
  return {ok:true,state:{rotations,moves:state.moves+1,history:[...state.history,previous]}};
}

export function undo(state) {
  if(!state.history.length) return null;
  const previous=state.history[state.history.length-1];
  return {rotations:previous.rotations.slice(),moves:previous.moves,history:state.history.slice(0,-1)};
}

export function analyze(level,state) {
  const masks=level.tiles.map((tile,i)=>tile ? rotatedMask(tile.base,state.rotations[i] ?? 0) : 0);
  function reachable(source) {
    const seen=new Set(),queue=[];
    if(level.tiles[source]){seen.add(source);queue.push(source);}
    for(let cursor=0;cursor<queue.length;cursor++){
      const id=queue[cursor], row=Math.floor(id/level.cols), col=id%level.cols;
      for(const d of DIRS){
        if(!(masks[id]&d.bit)) continue;
        const r=row+d.dr,c=col+d.dc;
        if(r<0 || r>=level.rows || c<0 || c>=level.cols) continue;
        const next=r*level.cols+c;
        if(!seen.has(next) && (masks[next]&d.opposite)){seen.add(next);queue.push(next);}
      }
    }
    return queue;
  }
  const sources=level.sources||[level.source];
  const flowSources=sources.map(reachable),seen=new Set(flowSources.flat());
  const flow=[...seen], merged=sources.length<2||flowSources[0].includes(sources[1]);
  const connectedTargets=level.targets.filter(id=>seen.has(id));
  let leaks=0,dryCount=0;
  for(let id=0;id<level.tiles.length;id++){
    if(!level.tiles[id])continue;
    if(!seen.has(id))dryCount++;
    const row=Math.floor(id/level.cols),col=id%level.cols;
    for(const d of DIRS){
      if(!(masks[id]&d.bit))continue;
      const r=row+d.dr,c=col+d.dc;
      if(r<0||r>=level.rows||c<0||c>=level.cols||!(masks[r*level.cols+c]&d.opposite))leaks++;
    }
  }
  let done=connectedTargets.length===level.targets.length;
  if(level.mode==='sealed')done=done&&leaks===0&&dryCount===0;
  if(level.mode==='duo')done=done&&merged;
  return {flow,connectedTargets,done,masks,leaks,dryCount,merged,flowSources};
}
