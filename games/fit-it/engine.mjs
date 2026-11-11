// Each letter marks one piece in a known valid packing; a dot is a blocked cell.
const LEVELS = [
  {name:'先放一放',map:['ABB','AAC','DDC']},
  {name:'转个方向',map:['AABB','ACCB','DDCC']},
  {name:'留一点位置',map:['AAAB','ACBB','CCDB','CCDD']},
  {name:'缺角的小盒',map:['AA.B','ACBB','CCDB','.CDD']},
  {name:'抽屉里见',map:['AAABB','ACCBB','ACCDD','EEEED']},
  {name:'绕开缺口',map:['.AAAB','.ACCB','DDCCB','DEEFF','DE.FF']},
  {name:'七块小拼图',map:['AABBC','ADBBC','ADDEC','FFEEE','FFGGG']},
  {name:'最后一格',map:['.AABB','AAABB','ACCCB','DDCBB','DDEEE','.DFFF']},
];
const PALETTE=['#e99483','#edc569','#76b9ac','#9a9acb','#bd91b9','#93b46f','#e3a96b','#7aaed0'];
// Seeds selected offline via exhaustive no-flip search. No solving occurs at runtime.
const MIRROR_ATTEMPTS=[7,0,4,33,14,17,75,108,18,66,51,32,63,608,112,51,45,120,180,5,1,3,5,2,0,3,2,2,1,7];

// Return a fresh, normalized shape. Positive quarter turns are clockwise.
export function shape(piece, rotation=0, flipped=false) {
  let cells=piece.cells.map(([x,y])=>[x,y]);
  if(flipped) cells=cells.map(([x,y])=>[-x,y]);
  const turns=((rotation%4)+4)%4;
  for(let i=0;i<turns;i++) cells=cells.map(([x,y])=>[-y,x]);
  const minX=Math.min(...cells.map(([x])=>x)), minY=Math.min(...cells.map(([,y])=>y));
  return cells.map(([x,y])=>[x-minX,y-minY]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
}

function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function isChiral(cells) {
  const p={cells}, normal=JSON.stringify(shape(p));
  return ![0,1,2,3].some(r=>JSON.stringify(shape(p,r,true))===normal);
}
// Grow pieces from seeds, adding only neighbouring cells so each is connected.
// Regenerate uneven partitions and require a truly asymmetric piece in mirror mode.
function generatedConfig(number,mode,startAttempt=0){
  const laterClassic=mode==='classic'&&number>=9;
  const cols=laterClassic?5:number<=10?4:5, rows=laterClassic?6:number<=3?4:number<=22?5:6;
  const pieces=laterClassic?(number<=19?6:number<=25?7:8):mode==='mirror'&&number>=20?5:number<=3?4:number<=10?5:number<=19?6:number<=25?7:8;
  const salt=mode==='classic'?11:mode==='mirror'?37:73;
  for(let attempt=startAttempt;attempt<startAttempt+3000;attempt++){
    const rng=random(number*100003+salt*3191+attempt*1237), cells=[];
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      if(number>=12&&((x===0&&y===0)||(number%2===0&&x===cols-1&&y===rows-1)))continue;
      cells.push([x,y]);
    }
    const map=Array.from({length:rows},()=>Array(cols).fill('.')),remaining=cells.slice();
    for(let i=0;i<pieces;i++){
      const idx=Math.floor(rng()*remaining.length),[x,y]=remaining.splice(idx,1)[0];map[y][x]=String.fromCharCode(65+i);
    }
    const counts=Array(pieces).fill(1);
    while(remaining.length){
      const candidates=[];
      for(let i=0;i<remaining.length;i++){
        const [x,y]=remaining[i], neighbours=new Set();
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const c=map[y+dy]?.[x+dx]; if(c&&c!=='.')neighbours.add(c.charCodeAt(0)-65);
        }
        for(const piece of neighbours)if(counts[piece]<7)candidates.push({i,piece});
      }
      if(!candidates.length)break;
      // Favour smaller pieces to prevent useless singleton scraps.
      const min=Math.min(...candidates.map(c=>counts[c.piece]));
      const pool=candidates.filter(c=>counts[c.piece]<=min+1);
      const c=pool[Math.floor(rng()*pool.length)],[x,y]=remaining.splice(c.i,1)[0];
      map[y][x]=String.fromCharCode(65+c.piece);counts[c.piece]++;
    }
    if(remaining.length||counts.some(n=>n<2))continue;
    if(mode==='mirror'){
      const groups=Array.from({length:pieces},()=>[]);
      map.forEach((row,y)=>row.forEach((c,x)=>{if(c!=='.')groups[c.charCodeAt(0)-65].push([x,y]);}));
      if(!groups.some(isChiral))continue;
    }
    return {name:mode==='mirror'?`翻转小盒 ${number}`:mode==='ordered'?`按序整理 ${number}`:`慢慢收纳 ${number}`,map:map.map(row=>row.join('')),attempt};
  }
  throw new Error(`第 ${number} 关无法生成`);
}

export function buildLevel(number,mode='classic') {
  if(!Number.isInteger(number) || number<1 || number>30 || !['classic','mirror','ordered'].includes(mode)) throw new RangeError('不存在的关卡');
  const {name,map}=mode==='classic'&&number<=8?LEVELS[number-1]:generatedConfig(number,mode,mode==='mirror'?MIRROR_ATTEMPTS[number-1]:0), rows=map.length, cols=map[0].length;
  if(map.some(row=>row.length!==cols)) throw new Error('关卡宽度不一致');
  const board=[], groups=new Map();
  map.forEach((row,y)=>[...row].forEach((label,x)=>{
    if(label==='.') return;
    board.push([x,y]);
    if(!groups.has(label))groups.set(label,[]);
    groups.get(label).push([x,y]);
  }));
  const pieces=[],solution=[];
  for(const [label,coords] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))) {
    const x=Math.min(...coords.map(c=>c[0])),y=Math.min(...coords.map(c=>c[1]));
    const id=label, i=pieces.length;
    const cells=coords.map(([cx,cy])=>[cx-x,cy-y]);
    const all=new Set(cells.map(([cx,cy])=>`${cx},${cy}`)), stack=[cells[0]],seen=new Set();
    while(stack.length){const [cx,cy]=stack.pop(),k=`${cx},${cy}`;if(seen.has(k))continue;seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(all.has(`${cx+dx},${cy+dy}`))stack.push([cx+dx,cy+dy]);}
    if(seen.size!==all.size)throw new Error(`关卡 ${number} 物件 ${id} 不连续`);
    const mirrored=mode==='mirror'&&isChiral(cells)&&(solution.every(q=>!q.flip)||((number+i)%3===0));
    const actual=mirrored?shape({cells},0,true):cells;
    pieces.push({id,cells:actual,color:PALETTE[i%PALETTE.length],name:`物件 ${i+1}`});
    solution.push(mirrored?{id,x,y,rotation:0,flip:true}:{id,x,y,rotation:0});
  }
  const result={number,name,cols,rows,board,pieces,solution};
  if(mode!=='classic')result.mode=mode;
  return result;
}

export function fresh(level) {
  const rotations={}; level.pieces.forEach((p,i)=>{rotations[p.id]=(level.number+i*3)%4;});
  const state={placed:{},rotations,history:[],moves:0};
  if(level.mode==='mirror')state.flips=Object.fromEntries(level.pieces.map(p=>[p.id,false]));
  return state;
}
// Offer a gentler start without changing any existing level geometry or saves.
// Preset pieces are ordinary pieces: players may move, remove, and undo them.
export function starter(level) {
  const state=fresh(level);
  if(level.number>5)return state;
  if(level.number<=3)level.pieces.forEach((p,i)=>{
    if(i < 5-level.number)state.rotations[p.id]=0;
  });
  const count=level.number===1?2:1;
  const candidates=level.mode==='mirror'?level.solution.filter(a=>!a.flip):level.solution;
  for(const a of candidates.slice(0,count)){
    state.rotations[a.id]=a.rotation;
    if(state.flips)state.flips[a.id]=!!a.flip;
    state.placed[a.id]=state.flips?{x:a.x,y:a.y,rotation:a.rotation,flip:!!a.flip}:{x:a.x,y:a.y,rotation:a.rotation};
  }
  return state;
}
function copyPlaced(placed) {return Object.fromEntries(Object.entries(placed).map(([id,p])=>[id,{...p}]));}
function withFlips(state,copy){if(state.flips)copy.flips={...state.flips};return copy;}
function snapshot(state) {return withFlips(state,{placed:copyPlaced(state.placed),rotations:{...state.rotations},moves:state.moves});}
function pieceFor(level,id){return level.pieces.find(p=>p.id===id);}
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
function restoredSnapshot(level,candidate){
  if(!record(candidate)||!record(candidate.placed)||!record(candidate.rotations)||!Number.isSafeInteger(candidate.moves)||candidate.moves<0)return null;
  const ids=new Set(level.pieces.map(p=>p.id)),mirror=level.mode==='mirror';
  if(candidate.flips!==undefined&&!record(candidate.flips))return null;
  for(const group of [candidate.placed,candidate.rotations,candidate.flips??{}])if(Object.keys(group).some(id=>!ids.has(id)))return null;
  for(const id of ids){
    const rotation=candidate.rotations[id],flipped=candidate.flips?.[id];
    if(!Number.isInteger(rotation)||rotation<0||rotation>3)return null;
    if(flipped!==undefined&&(typeof flipped!=='boolean'||(!mirror&&flipped)))return null;
  }
  for(const [id,p] of Object.entries(candidate.placed)){
    if(!record(p)||Object.keys(p).some(key=>!['x','y','rotation','flip'].includes(key)))return null;
    if(!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.rotation!==candidate.rotations[id])return null;
    if(p.flip!==undefined&&typeof p.flip!=='boolean')return null;
    if(!!p.flip!==!!candidate.flips?.[id]||(!mirror&&p.flip))return null;
  }
  for(const [id,p] of Object.entries(candidate.placed))if(!canPlace(level,candidate,id,p.x,p.y,p.rotation,!!p.flip).ok)return null;
  return snapshot(candidate);
}
// Validate saved data before it can reach rendering or undo. A bad history must
// not erase an otherwise valid current position; old saves may omit flip flags.
export function restoreState(level,candidate){
  const current=restoredSnapshot(level,candidate);
  if(!current)return fresh(level);
  const history=[];let previousMoves=-1;
  if(Array.isArray(candidate.history))for(const entry of candidate.history){
    const previous=restoredSnapshot(level,entry);
    if(!previous||previous.moves<=previousMoves||previous.moves>=current.moves)return {...current,history:[]};
    history.push(previous);previousMoves=previous.moves;
  }
  return {...current,history};
}
function canPlace(level,state,id,x,y,rotation,flipped=false) {
  const piece=pieceFor(level,id);
  if(!piece)return {ok:false,reason:'missing'};
  if(!Number.isInteger(x)||!Number.isInteger(y))return {ok:false,reason:'outside'};
  const allowed=new Set(level.board.map(c=>c.join(',')));
  const occupied=new Set();
  for(const [other,placement] of Object.entries(state.placed)) {
    if(other===id)continue;
    const found=pieceFor(level,other); if(!found)continue;
    for(const [cx,cy] of shape(found,placement.rotation,!!placement.flip))occupied.add(`${placement.x+cx},${placement.y+cy}`);
  }
  for(const [cx,cy] of shape(piece,rotation,flipped)) {
    const k=`${x+cx},${y+cy}`;
    if(!allowed.has(k))return {ok:false,reason:'outside'};
    if(occupied.has(k))return {ok:false,reason:'overlap'};
  }
  return {ok:true};
}
export function rotate(level,state,id) {
  if(!pieceFor(level,id))return {ok:false,reason:'missing'};
  const nextRotation=((state.rotations[id]??0)+1)%4, position=state.placed[id];
  if(position) {const check=canPlace(level,state,id,position.x,position.y,nextRotation,!!state.flips?.[id]);if(!check.ok)return check;}
  const next=withFlips(state,{placed:copyPlaced(state.placed),rotations:{...state.rotations},history:[...state.history,snapshot(state)],moves:state.moves+1});
  next.rotations[id]=nextRotation;
  if(position)next.placed[id]={...position,rotation:nextRotation};
  return {ok:true,state:next};
}
export function place(level,state,id,x,y) {
  if(level.mode==='ordered'&&!Object.prototype.hasOwnProperty.call(state.placed,id)){
    const expected=level.pieces.find(piece=>!Object.prototype.hasOwnProperty.call(state.placed,piece.id));
    if(expected&&id!==expected.id)return {ok:false,reason:'order'};
  }
  const rotation=state.rotations[id]??0,flipped=!!state.flips?.[id],check=canPlace(level,state,id,x,y,rotation,flipped);
  if(!check.ok)return check;
  const prev=state.placed[id];
  if(prev && prev.x===x && prev.y===y && prev.rotation===rotation && !!prev.flip===flipped)return {ok:false,reason:'unchanged'};
  const next=withFlips(state,{placed:copyPlaced(state.placed),rotations:{...state.rotations},history:[...state.history,snapshot(state)],moves:state.moves+1});
  next.placed[id]=state.flips?{x,y,rotation,flip:flipped}:{x,y,rotation};
  return {ok:true,state:next};
}
export function flip(level,state,id){
  if(level.mode!=='mirror'||!pieceFor(level,id))return {ok:false,reason:'missing'};
  const flipped=!state.flips?.[id],position=state.placed[id];
  if(position){const check=canPlace(level,state,id,position.x,position.y,state.rotations[id]??0,flipped);if(!check.ok)return check;}
  const next=withFlips(state,{placed:copyPlaced(state.placed),rotations:{...state.rotations},history:[...state.history,snapshot(state)],moves:state.moves+1});
  if(!next.flips)next.flips={};
  next.flips[id]=flipped;if(position)next.placed[id]={...position,flip:flipped};
  return {ok:true,state:next};
}
export function remove(level,state,id) {
  if(!pieceFor(level,id) || !Object.prototype.hasOwnProperty.call(state.placed,id))return {ok:false,reason:'missing'};
  const next=withFlips(state,{placed:copyPlaced(state.placed),rotations:{...state.rotations},history:[...state.history,snapshot(state)],moves:state.moves+1});
  delete next.placed[id];
  return {ok:true,state:next};
}
export function undo(state) {
  if(!state.history.length)return null;
  const previous=state.history[state.history.length-1];
  return withFlips(previous,{placed:copyPlaced(previous.placed),rotations:{...previous.rotations},moves:previous.moves,history:state.history.slice(0,-1)});
}
export function solved(level,state) {return level.pieces.every(p=>Object.prototype.hasOwnProperty.call(state.placed,p.id));}
