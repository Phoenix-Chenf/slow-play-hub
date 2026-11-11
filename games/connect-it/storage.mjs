export const OLD_KEY = 'connect-it-v1';
export const KEY = 'connect-it-v2';
export const MODES = ['classic', 'sealed', 'duo'];
const validState = s => s && Array.isArray(s.rotations) && Array.isArray(s.history) && Number.isInteger(s.moves) && s.moves >= 0;
const validLevel = n => Number.isInteger(n) && n >= 1 && n <= 30;
const empty = () => ({version:2, mode:'classic', levels:{classic:1,sealed:1,duo:1}, progress:{classic:{},sealed:{},duo:{}}});

export function loadProgress(storage) {
  const data=empty(); let raw;
  try { raw=JSON.parse(storage.getItem(KEY)); } catch { raw=null; }
  if(raw && raw.version===2) {
    if(MODES.includes(raw.mode)) data.mode=raw.mode;
    for(const mode of MODES) {
      if(validLevel(raw.levels?.[mode])) data.levels[mode]=raw.levels[mode];
      const saved=raw.progress?.[mode];
      if(saved && typeof saved==='object') for(const [n,state] of Object.entries(saved))
        if(validLevel(Number(n)) && validState(state)) data.progress[mode][n]=state;
    }
    return data;
  }
  try { raw=JSON.parse(storage.getItem(OLD_KEY)); } catch { raw=null; }
  if(!raw || typeof raw!=='object') return data;
  if(validLevel(raw.current) && raw.current<=8) data.levels.classic=raw.current;
  if(raw.progress && typeof raw.progress==='object') for(const [n,state] of Object.entries(raw.progress))
    if(validLevel(Number(n)) && Number(n)<=8 && validState(state)) data.progress.classic[n]=state;
  return data;
}
export function saveProgress(storage, data) { storage.setItem(KEY,JSON.stringify(data)); }
