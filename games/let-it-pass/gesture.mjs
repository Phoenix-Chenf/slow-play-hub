import {move,exit,solved} from './engine.mjs?v=9';
// A gesture is one move; clamp it to the farthest unobstructed square.
export function resolveSlide(level,state,car,delta){
 if(!car||!Number.isInteger(delta)||delta===0||solved(level,state))return {ok:false,reason:'invalid'};
 if(car.target&&delta>0){const out=exit(level,state);if(out.ok)return {...out,kind:'exited'};}
 const sign=Math.sign(delta);let result;
 for(let amount=Math.min(Math.abs(delta),Math.max(level.width,level.height));amount>0;amount--){
  result=move(level,state,car.id,sign*amount);if(result.ok)return {...result,kind:result.state.exited?'exited':'moved'};
 }
 return {ok:false,reason:result?.reason||'blocked'};
}
