export const TILES = [
  { name:'柠檬', icon:'🍋', color:'#f3d685' }, {name:'草莓',icon:'🍓',color:'#efb8b2'},
  { name:'薄荷', icon:'🌿', color:'#b9d8bf' }, {name:'蓝莓',icon:'🫐',color:'#b7c8e2'},
  { name:'小花', icon:'🌼', color:'#edc9a5' }, {name:'葡萄',icon:'🍇',color:'#d7c1df'},
  { name:'樱桃', icon:'🍒', color:'#e8b7ba' }, {name:'叶子',icon:'🍃',color:'#c9d4ae'},
  { name:'桃子', icon:'🍑', color:'#f4c8b2' }, {name:'蘑菇',icon:'🍄',color:'#d8cabb'},
  { name:'小熊', icon:'🐻', color:'#dac5a5' }, {name:'星星',icon:'⭐',color:'#eadfa7'},
];
const CONFIGS = [
  {name:'初次见面',cols:3,rows:2,counts:[6,3],colors:3,seed:51},
  {name:'轻轻揭开',cols:3,rows:2,counts:[6,6],colors:4,seed:93},
  {name:'先看看下面',cols:3,rows:3,counts:[9,6],colors:5,seed:261},
  {name:'留个空位',cols:3,rows:3,counts:[9,9,3],colors:7,seed:51},
  {name:'花园小径',cols:4,rows:3,counts:[12,9,3],colors:8,seed:903},
  {name:'层层叠叠',cols:4,rows:3,counts:[12,12,6],colors:10,seed:53},
  {name:'绕一绕',cols:4,rows:3,counts:[12,12,9,3],colors:12,seed:71},
  {name:'藏在最下面',cols:4,rows:4,counts:[16,15,11,3],colors:12,seed:371},
];
// Keep the first eight configurations unchanged: existing saved tile ids depend on them.
// Later levels retain four columns for comfortable phone-sized touch targets.
const LATER_NAMES = ['枝叶间','留点空间','小路转弯','轻轻揭开','重叠的花园','藏着的答案','慢慢理清','再留一格','花园深处','先拆哪边','两条小路','一层一层','角落里的片','往下看看','越拆越开','花园迷局','错开的图案','耐心找找','层叠小径','仔细安排','最后的空位','慢慢清空'];
// Curated seeds limit immediately visible same-color triples while retaining a
// deterministic five-slot winning path. Mystery scoring ignores hidden tiles.
const LATER_SEEDS = {
  classic:[539955,60467,119471,83447,182046,74751,70403,105650,196330,263253,361852,294152,178938,237942,471164,205489,335764,228469,390420,100988,120397,179401],
  mystery:[163158,166729,249490,181790,185361,220608,445911,259426,270916,219054,198868,360819,229767,257095,300261,359265,228213,247622,235355,246845,353363,269825],
  keys:[699102,726430,476593,717734,349112,352683,324578,510286,695994,359048,552675,405785,441032,690092,361065,538854,494911,363859,430782,608571,493357,623632],
};
for(let n=9;n<=30;n++){
  const rows=n<15?4:5, cells=4*rows;
  const total=45+3*Math.floor((n-8)*0.8);
  let left=total;const counts=[];
  while(left>0){const layer=Math.min(cells,left);counts.push(layer);left-=layer;}
  CONFIGS.push({name:LATER_NAMES[n-9],cols:4,rows,counts,colors:12,seed:LATER_SEEDS.classic[n-9]});
}
const CELL_X=65, CELL_Y=72, W=55, H=62;
function rng(seed) { return () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed / 4294967296; }; }
const shuffle = (arr, rand) => { const a=arr.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
export function isCovered(tile, tiles, remaining) {
  return tiles.some(other => remaining.has(other.id) && other.layer>tile.layer && tile.x<other.x+W && tile.x+W>other.x && tile.y<other.y+H && tile.y+H>other.y);
}
export function buildLevel(number, mode='classic') {
  if(!['classic','mystery','keys'].includes(mode)) throw new Error('Invalid mode');
  const base=CONFIGS[number-1]; if(!Number.isInteger(number)||!base) throw new Error('Invalid level');
  const c=mode==='classic'?base:{...base,seed:number>8?LATER_SEEDS[mode][number-9]:base.seed+(mode==='mystery'?130019:270013)};
  const random=rng(c.seed), maxLayer=c.counts.length-1;
  const cells=Array.from({length:c.cols*c.rows},(_,i)=>i), tiles=[];
  c.counts.forEach((count,layer)=>{
    const chosen=layer===0?cells:shuffle(cells,random).slice(0,count);
    for(const cell of chosen) tiles.push({id:tiles.length, layer, x:(cell%c.cols)*CELL_X+layer*5, y:Math.floor(cell/c.cols)*CELL_Y+(maxLayer-layer)*7, kind:0});
  });
  const remaining=new Set(tiles.map(t=>t.id)), order=[];
  while(remaining.size){ const exposed=tiles.filter(t=>remaining.has(t.id)&&!isCovered(t,tiles,remaining)); const t=exposed[Math.floor(random()*exposed.length)]; order.push(t.id);remaining.delete(t.id); }
  // Construct a winning color sequence whose tray stays under five: no three-at-a-time giveaway.
  const count=tiles.length/3, bag=Array.from({length:count},(_,i)=>i%c.colors), queue=shuffle(bag,random), active=[], sequence=[];
  while(queue.length||active.length){
    const trayUse=active.reduce((s,a)=>s+a.used,0);
    const advanced=number>8;
    const mayAdd=queue.length && active.length<(advanced?3:2) && trayUse<3;
    if(mayAdd && (!active.length || random()<(advanced?0.88:0.70))) { let idx=queue.findIndex(color=>!active.some(a=>a.color===color)); if(idx>=0)active.push({color:queue.splice(idx,1)[0],used:0}); }
    const choices=advanced&&trayUse>=4?active.filter(a=>a.used===2):active;
    const current=choices[Math.floor(random()*choices.length)];sequence.push(current.color);current.used++;
    if(current.used===3)active.splice(active.indexOf(current),1);
  }
  order.forEach((id,i)=>tiles[id].kind=sequence[i]);
  if(mode==='mystery'){
    // Question-mark tiles are not a separate move: their true color is revealed on pickup.
    const chance=Math.min(.18+number*.008,.42);
    const fogRandom=rng(c.seed+839); let marked=0;
    for(const tile of tiles){if(fogRandom()<chance){tile.mystery=true;marked++;}}
    if(!marked)tiles[order[0]].mystery=true;
  }
  if(mode==='keys'){
    // Every key precedes its matching lock in the generated winning path. This gives
    // each puzzle a verifiable solution without adding untracked state to undo.
    const initial=new Set(tiles.map(t=>t.id));
    const initiallyVisible=new Set(tiles.filter(t=>!isCovered(t,tiles,initial)).map(t=>t.id));
    const targetCount=Math.min(1+Math.floor((number-1)/6),4);
    const used=new Set();let made=0;
    for(let lockPos=order.length-1;lockPos>0&&made<targetCount;lockPos--){
      const lockId=order[lockPos];
      if(!initiallyVisible.has(lockId)||used.has(lockId))continue;
      // Teach with an exposed key first, then from level 10 hide subsequent
      // keys in earlier parts of the solution path for a layered search.
      const wantHidden=number>=10 && made>=1;
      const keyId=order.slice(0,lockPos).find(id=>
        (wantHidden?!initiallyVisible.has(id):initiallyVisible.has(id))&&!used.has(id)&&id!==lockId);
      if(keyId==null)continue;
      tiles[lockId].lockBy=keyId;tiles[keyId].keyFor=lockId;
      used.add(keyId);used.add(lockId);made++;
    }
  }
  return {number,mode,name:c.name,cols:c.cols,rows:c.rows,tiles,solution:order,width:(c.cols-1)*CELL_X+W+maxLayer*5,height:(c.rows-1)*CELL_Y+H+maxLayer*7};
}
export function fresh(level) {return {remaining:level.tiles.map(t=>t.id),tray:[],capacity:5,extra:0,moves:0,history:[]};}
export function isLocked(tile, remaining) {return tile.lockBy!=null && remaining.has(tile.lockBy);}
export function move(level,state,id) {
 const remaining=new Set(state.remaining),tile=level.tiles.find(t=>t.id===id);
 if(!tile || !remaining.has(id))return {ok:false,reason:'missing'};
 if(isCovered(tile,level.tiles,remaining))return {ok:false,reason:'covered'};
 if(isLocked(tile,remaining))return {ok:false,reason:'locked'};
 if(state.tray.length>=state.capacity)return {ok:false,reason:'full'};
 const next=copyState(state);next.history.push(snapshot(state));next.remaining=next.remaining.filter(x=>x!==id);next.tray.push(tile.kind);next.moves++;
 if(next.tray.filter(x=>x===tile.kind).length===3) next.tray=next.tray.filter(x=>x!==tile.kind);
 return {ok:true,state:next,cleared:next.remaining.length===0 && next.tray.length===0};
}
function snapshot(s){return {remaining:s.remaining.slice(),tray:s.tray.slice(),capacity:s.capacity,extra:s.extra,moves:s.moves};}
// Game states contain only plain fields and arrays; copy them without requiring
// structuredClone, which is missing in some mobile webviews.
function copyState(s){return {...s,remaining:s.remaining.slice(),tray:s.tray.slice(),history:s.history.map(snapshot)};}
export function addSlot(state){const n=copyState(state);n.history.push(snapshot(state));n.capacity++;n.extra++;return n;}
export function undo(state){if(!state.history.length)return null;const n=copyState(state), prev=n.history.pop();return {...prev,history:n.history};}
export function available(level,state){const set=new Set(state.remaining);return level.tiles.filter(t=>set.has(t.id)&&!isCovered(t,level.tiles,set)&&!isLocked(t,set)).map(t=>t.id);}
