// 新棋盘使用独立存档，保留旧版所有记录。
const KEY='let-it-pass-v2';
const blank=()=>({current:1,progress:{}});
const keyFor=mode=>!mode||mode==='classic'?KEY:`${KEY}-${mode}`;
export function loadProgress(storage,mode='classic'){try{const data=JSON.parse(storage.getItem(keyFor(mode)));if(!data || !Number.isInteger(data.current)||data.current<1||data.current>30||!data.progress||typeof data.progress!=='object'||Array.isArray(data.progress))return blank();return data}catch{return blank()}}
export function saveProgress(storage,data,mode='classic'){storage.setItem(keyFor(mode),JSON.stringify(data))}
