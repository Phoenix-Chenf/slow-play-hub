import {shape,place} from './engine.mjs?v=20261111-ease';

// Return positions to tap for the currently oriented piece. These show a
// locally legal placement only; the rest of the puzzle may still need work.
export function placementTargets(level,state,id){
 const piece=level.pieces.find(p=>p.id===id);
 if(!piece)return [];
 const [ax,ay]=shape(piece,state.rotations[id]||0,!!state.flips?.[id])[0];
 const targets=[];
 for(const [x,y] of level.board){
  if(place(level,state,id,x-ax,y-ay).ok)targets.push([x,y]);
 }
 return targets;
}
