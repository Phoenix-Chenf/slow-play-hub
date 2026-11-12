import {shape} from './engine.mjs?v=20261111-ease';

// Search complete packings while holding the already placed pieces fixed.
// Yield regularly so a difficult search cannot freeze the phone UI.
export async function findNextHint(level,state,options={}) {
  const {maxNodes=30000,maxMillis=1200,shouldCancel=()=>false}=options;
  const start=Date.now();
  if(shouldCancel())return {status:'cancelled'};
  if(maxNodes<=0||maxMillis<=0||level.board.length>30)return {status:'limit'};
  const cells=new Map(level.board.map(([x,y],i)=>[`${x},${y}`,i]));
  let fixed=0;
  for(const p of level.pieces){
    const q=state.placed[p.id]; if(!q)continue;
    for(const [dx,dy] of shape(p,q.rotation,!!q.flip)){
      const index=cells.get(`${q.x+dx},${q.y+dy}`);
      if(index===undefined||(fixed&(1<<index)))return {status:'impossible'};
      fixed|=1<<index;
    }
  }
  const remaining=level.pieces.filter(p=>!state.placed[p.id]);
  if(!remaining.length)return {status:'solved',placements:{}};
  let area=0;for(const p of remaining)area+=p.cells.length;
  const fixedCount=level.board.length-[...cells.values()].filter(i=>!(fixed&(1<<i))).length;
  if(area>level.board.length-fixedCount)return {status:'impossible'};
  const allFilled=area===level.board.length-fixedCount;
  const choices=new Map();
  for(const p of remaining){
    const possible=[],seen=new Set(),current=state.rotations[p.id]||0;
    const flips=level.mode==='mirror'?[!!state.flips?.[p.id],!state.flips?.[p.id]]:[false];
    for(const mirrored of flips)for(let k=0;k<4;k++){
      const rotation=(current+k)%4, form=shape(p,rotation,mirrored), key=JSON.stringify(form);
      if(seen.has(key))continue; seen.add(key);
      const w=1+Math.max(...form.map(([x])=>x)),h=1+Math.max(...form.map(([,y])=>y));
      for(let y=0;y<=level.rows-h;y++)for(let x=0;x<=level.cols-w;x++){
        let mask=0,valid=true;
        for(const [dx,dy] of form){const index=cells.get(`${x+dx},${y+dy}`);if(index===undefined){valid=false;break}mask|=1<<index}
        if(valid&&!(mask&fixed))possible.push({id:p.id,x,y,rotation,flip:mirrored,mask});
      }
    }
    if(!possible.length)return {status:'impossible'};
    choices.set(p.id,possible);
  }
  const boardMask=(1<<level.board.length)-1;
  const stack=[{occupied:fixed,remaining:remaining.map(p=>p.id),placements:{}}];let nodes=0;
  while(stack.length){
    if(shouldCancel())return {status:'cancelled'};
    if(nodes>=maxNodes||Date.now()-start>=maxMillis)return {status:'limit'};
    let rounds=0;const sliceStart=Date.now();
    while(stack.length && rounds++<20 && Date.now()-sliceStart<8){
      if(shouldCancel())return {status:'cancelled'};
      if(Date.now()-start>=maxMillis)return {status:'limit'};
      if(nodes++>=maxNodes)return {status:'limit'};
      const node=stack.pop();
      if(!node.remaining.length)return {status:'solved',placements:node.placements};
      let best=null, dead=false;const validById=new Map();
      for(const id of node.remaining){
        const valid=choices.get(id).filter(c=>!(c.mask&node.occupied));
        if(!valid.length){dead=true;break}
        validById.set(id,valid); if(!best||valid.length<best.length)best=valid;
      }
      if(dead)continue;
      if(allFilled){
        const vacant=boardMask&~node.occupied;
        for(let i=0;i<level.board.length;i++)if(vacant&(1<<i)){
          const covering=[];
          for(const list of validById.values())for(const c of list)if(c.mask&(1<<i))covering.push(c);
          if(!covering.length){dead=true;break}
          if(covering.length<best.length)best=covering;
        }
      }
      if(dead)continue;
      for(let i=best.length-1;i>=0;i--){const c=best[i];stack.push({occupied:node.occupied|c.mask,remaining:node.remaining.filter(id=>id!==c.id),placements:{...node.placements,[c.id]:{x:c.x,y:c.y,rotation:c.rotation,flip:c.flip}}})}
    }
    if(stack.length)await new Promise(resolve=>setTimeout(resolve,0));
  }
  return {status:'impossible'};
}
