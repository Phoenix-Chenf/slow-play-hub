export const OLD_KEY='fit-it-v1';
export const KEY='fit-it-v2';
export const MODES=['classic','mirror','ordered'];
const blank=()=>({version:2,mode:'classic',levels:{classic:1,mirror:1,ordered:1},progress:{classic:{},mirror:{},ordered:{}}});
// History is checked with the level geometry by restoreState. A broken history
// must still let an otherwise valid current position reach that recovery step.
const validState=s=>s && s.placed && typeof s.placed==='object' && s.rotations && typeof s.rotations==='object' && Number.isInteger(s.moves) && s.moves>=0;
const validLevel=n=>Number.isInteger(n)&&n>=1&&n<=30;
export function loadProgress(storage) {
  const data=blank();let raw;
  try{raw=JSON.parse(storage.getItem(KEY))}catch{raw=null}
  if(raw&&raw.version===2){
    if(MODES.includes(raw.mode))data.mode=raw.mode;
    for(const mode of MODES){
      if(validLevel(raw.levels?.[mode]))data.levels[mode]=raw.levels[mode];
      const bucket=raw.progress?.[mode];
      if(bucket&&typeof bucket==='object') for(const [n,state] of Object.entries(bucket))
        if(validLevel(Number(n))&&validState(state))data.progress[mode][n]=state;
    }
    return data;
  }
  try{raw=JSON.parse(storage.getItem(OLD_KEY))}catch{raw=null}
  if(!raw||typeof raw!=='object')return data;
  if(validLevel(raw.current)&&raw.current<=8)data.levels.classic=raw.current;
  if(raw.progress&&typeof raw.progress==='object')for(const [n,state] of Object.entries(raw.progress))
    if(validLevel(Number(n))&&Number(n)<=8&&validState(state))data.progress.classic[n]=state;
  return data;
}
export function saveProgress(storage,data){storage.setItem(KEY,JSON.stringify(data));}
