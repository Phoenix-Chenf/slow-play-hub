import {buildLevel,starter,restoreState,shape,place,rotate,flip,remove,undo,solved} from './engine.mjs?v=20261111-ease';
import {loadProgress,saveProgress,MODES} from './storage.mjs?v=5';
import {placementTargets} from './placement-guide.mjs?v=20261111-ease';
const $=id=>document.getElementById(id), LIMIT=30, GUIDE='fit-it-guide-v1';
const MODE_TEXT={
  classic:'经典收纳：把所有物件放进盒子。',
  mirror:'翻面收纳：选中物件后可左右翻面，再旋转放入。',
  ordered:'顺序收纳：按提示顺序放入；已放物件可移动、拿出，拿出前面的物件后要先补回。'
};
let storage,storageOK=true;
try{storage=window.localStorage}catch{storageOK=false;storage={getItem(){return null},setItem(){throw Error('unavailable')}}}
const data=loadProgress(storage);
let mode=data.mode,number=data.levels[mode],level=buildLevel(number,mode),selected=null;
const hasSaved=(m,n)=>Object.prototype.hasOwnProperty.call(data.progress[m],n);
let state=hasSaved(mode,number)?restoreState(level,data.progress[mode][number]):starter(level);
let showTargets=false;
const select=$('level-select');for(let n=1;n<=LIMIT;n++)select.add(new Option(`第 ${n} / ${LIMIT} 关`,String(n)));
function save(){data.mode=mode;data.levels[mode]=number;data.progress[mode][number]=state;try{saveProgress(storage,data)}catch{storageOK=false}}
function say(text,warning=false){$('status').textContent=storageOK?text:'当前浏览器无法保存进度，但可以继续玩。';$('status').classList.toggle('warning',warning||!storageOK)}
const pieceById=id=>level.pieces.find(p=>p.id===id);
const selectedPiece=()=>pieceById(selected);
const pieceShape=(p,rotation,mirrored)=>shape(p,rotation,!!mirrored);
const expectedPiece=()=>level.pieces.find(p=>!state.placed[p.id]);
function render(){
 select.value=String(number);$('level-name').textContent=level.name;$('placed-count').textContent=`已放 ${Object.keys(state.placed).length} / ${level.pieces.length}`;$('move-count').textContent=`已操作 ${state.moves} 次`;
 document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
 const expected=expectedPiece();$('mode-copy').textContent=MODE_TEXT[mode]+(mode==='ordered'&&expected?` 现在先放「${expected.name}」。`:'');
 const selectedObj=selectedPiece();$('rotate').disabled=!selectedObj;$('flip').hidden=mode!=='mirror';$('flip').disabled=!selectedObj;$('remove').hidden=!(selectedObj&&state.placed[selected]);$('piece-hint').textContent='左右滑动查看';
 const occupancy=new Map(),allowed=new Set(level.board.map(([x,y])=>`${x},${y}`));
 for(const p of level.pieces){const q=state.placed[p.id];if(!q)continue;for(const [dx,dy] of pieceShape(p,q.rotation,q.flip))occupancy.set(`${q.x+dx},${q.y+dy}`,p)}
 const targets=new Set(showTargets&&selectedObj?placementTargets(level,state,selected).map(([x,y])=>`${x},${y}`):[]);
 const board=$('board');board.style.setProperty('--cols',level.cols);board.replaceChildren();
 for(let y=0;y<level.rows;y++)for(let x=0;x<level.cols;x++){
  const key=`${x},${y}`,owner=occupancy.get(key),cell=document.createElement('button');cell.type='button';cell.className='cell';cell.setAttribute('role','gridcell');
  if(!allowed.has(key)){cell.classList.add('hole');cell.disabled=true;cell.setAttribute('aria-label','盒子外')}
  else{
   cell.classList.add('available');if(targets.has(key))cell.classList.add('guide-target');if(owner){cell.classList.add('filled');cell.style.setProperty('--piece-color',owner.color);if(owner.id===selected)cell.classList.add('selected')}
   cell.setAttribute('aria-label',`第 ${y+1} 行第 ${x+1} 列，${owner?owner.name:'空格'}${targets.has(key)?'，可放位置':''}${selectedObj?`，放置${selectedObj.name}`:''}`);
   cell.addEventListener('click',()=>{
    if(owner && owner.id!==selected){selected=owner.id;showTargets=false;render();say(`已选 ${owner.name}，可以旋转、移动或拿出。`);return}
    if(!selectedObj){say('先点选下方的一块物件。');return}
    const [anchorX,anchorY]=pieceShape(selectedObj,state.rotations[selected]||0,state.flips?.[selected])[0];
    const result=place(level,state,selected,x-anchorX,y-anchorY);
    if(!result.ok){const expected=expectedPiece();say(result.reason==='order'&&expected?`请先放入${expected.name}，拿出的前序物件也要先补回。已放物件仍可调整。`:result.reason==='outside'?'这里放不下，试试其他位置或旋转。':result.reason==='unchanged'?'这块已经在这里，点别的位置可移动。':'这里有重叠或放不下，试试别的位置。',true);return}
    state=result.state;selected=null;showTargets=false;save();render();say(solved(level,state)?'都放下啦！可以继续下一关，也可以撤回。':'放好了，继续选择下一块。');
   });
  }
  board.append(cell);
 }
 const list=$('pieces'),scrollPosition=list.scrollLeft,focusPiece=document.activeElement?.dataset?.pieceId;list.replaceChildren();let focusReplacement=null;
 for(const p of level.pieces){
  const occupied=!!state.placed[p.id],button=document.createElement('button');button.type='button';button.className='piece';button.dataset.pieceId=p.id;if(focusPiece===p.id)focusReplacement=button;button.classList.toggle('placed',occupied);button.classList.toggle('expected',mode==='ordered'&&expected?.id===p.id);button.style.setProperty('--piece-color',p.color);button.setAttribute('aria-pressed',String(selected===p.id));button.setAttribute('aria-label',`${p.name}，${occupied?'已放入，可以再次选中移动':'未放入'}${selected===p.id?'，已选中':''}`);
  const coords=pieceShape(p,state.rotations[p.id]||0,state.flips?.[p.id]),col=1+Math.max(...coords.map(q=>q[0])),row=1+Math.max(...coords.map(q=>q[1])),set=new Set(coords.map(q=>q.join(','))),mini=document.createElement('span');mini.className='piece-grid';mini.setAttribute('aria-hidden','true');mini.style.setProperty('--pc',col);mini.style.setProperty('--pr',row);mini.style.setProperty('--unit',`${Math.min(14,Math.floor(60/Math.max(col,row)))}px`);
  const [anchorX,anchorY]=coords[0];for(let y=0;y<row;y++)for(let x=0;x<col;x++){const dot=document.createElement('i');if(set.has(`${x},${y}`)){dot.className='filled';if(x===anchorX&&y===anchorY)dot.classList.add('anchor')}mini.append(dot)}
  const label=document.createElement('span');label.textContent=p.name;const flag=document.createElement('span');flag.className='piece-state';flag.textContent=occupied?'已放入':mode==='ordered'&&expected?.id===p.id?'先放这块':'待放入';button.append(mini,label,flag);button.addEventListener('click',()=>{selected=p.id;render();say(`已选 ${p.name}，点盒子里的格子放下白点；也可点“找放置点”。`)});list.append(button);
 }
 if(typeof scrollPosition==='number')list.scrollLeft=scrollPosition;if(focusReplacement)focusReplacement.focus({preventScroll:true});
 $('undo').disabled=!state.history.length;const done=solved(level,state);$('complete').hidden=!done;$('complete-copy').textContent=`${state.moves} 次操作 · 所有物件已放入`;$('next').textContent=number===LIMIT?'再玩本关':'下一关';if(!storageOK)say('');
}
$('rotate').addEventListener('click',()=>{if(!selectedPiece())return;const result=rotate(level,state,selected);if(!result.ok){say('这里转不开，可先拿出物件再旋转。',true);return}state=result.state;save();render();say('方向换好了，将白点对准盒中格子。')});
$('flip').addEventListener('click',()=>{if(!selectedPiece())return;const result=flip(level,state,selected);if(!result.ok){say('这里翻不开，可先拿出物件再翻面。',true);return}state=result.state;save();render();say('已经翻面，将白点对准盒中格子。')});
$('remove').addEventListener('click',()=>{if(!selectedPiece())return;const result=remove(level,state,selected);if(!result.ok)return;state=result.state;save();render();say('物件拿出来了，可以调整后再放入。')});
$('find-place').addEventListener('click',()=>{
 if(!selectedPiece())selected=expectedPiece()?.id??null;
 if(!selected){showTargets=false;say('所有物件都已放好。');return}
 const expected=expectedPiece();
 if(mode==='ordered'&&!state.placed[selected]&&expected&&selected!==expected.id){selected=expected.id}
 showTargets=true;const targets=placementTargets(level,state,selected);render();
 say(targets.length?'圈出的格子可放入白点；还要留意给其他物件留位置。':mode==='mirror'?'这个方向暂时没有可放位置，试试旋转、翻面或撤回调整。':'这个方向暂时没有可放位置，试试旋转或撤回调整。',!targets.length);
});
$('undo').addEventListener('click',()=>{const prev=undo(state);if(prev){state=prev;save();render();say('已撤回一步。')}});
function changeLevel(n,reset=false){if(!Number.isInteger(n)||n<1||n>LIMIT)return;save();number=n;level=buildLevel(n,mode);state=reset||!hasSaved(mode,n)?starter(level):restoreState(level,data.progress[mode][n]);selected=null;showTargets=false;save();render();say('先选一块，试试放在哪里。')}
function changeMode(next){if(!MODES.includes(next)||next===mode)return;save();mode=next;number=data.levels[mode];level=buildLevel(number,mode);state=hasSaved(mode,number)?restoreState(level,data.progress[mode][number]):starter(level);selected=null;showTargets=false;save();render();say('已切换玩法，之前的进度保存在本机。')}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>changeMode(button.dataset.mode)));
$('reset').addEventListener('click',()=>{if(confirm('重新开始这一关？当前关内进度会清空。'))changeLevel(number,true)});
$('next').addEventListener('click',()=>number===LIMIT?changeLevel(number,true):changeLevel(number+1));select.addEventListener('change',()=>changeLevel(Number(select.value)));
const dialog=$('help-dialog'),backdrop=$('modal-backdrop');
let fallbackOpen=false,previousFocus=null;
function markGuideSeen(){try{storage.setItem(GUIDE,'seen')}catch{}}
function openHelp(){
 if(dialog.open||fallbackOpen)return;
 if(typeof dialog.showModal==='function'&&typeof dialog.close==='function'){dialog.showModal();return}
 previousFocus=document.activeElement;fallbackOpen=true;dialog.classList.add('fallback-dialog');dialog.setAttribute('open','');backdrop.hidden=false;$('close-help').focus();
}
function closeHelp(){
 if(fallbackOpen){dialog.removeAttribute('open');dialog.classList.remove('fallback-dialog');backdrop.hidden=true;fallbackOpen=false;markGuideSeen();previousFocus?.focus();previousFocus=null}
 else if(dialog.open&&typeof dialog.close==='function')dialog.close();
}
$('help').addEventListener('click',openHelp);$('guide').addEventListener('click',openHelp);$('close-help').addEventListener('click',closeHelp);backdrop.addEventListener('click',closeHelp);
dialog.addEventListener('close',markGuideSeen);
dialog.addEventListener('keydown',e=>{if(!fallbackOpen)return;if(e.key==='Escape'){e.preventDefault();closeHelp()}else if(e.key==='Tab'){e.preventDefault();$('close-help').focus()}});
render();if(!storageOK)say('');let seen=false;try{seen=storage.getItem(GUIDE)==='seen'}catch{}if(!seen)openHelp();
