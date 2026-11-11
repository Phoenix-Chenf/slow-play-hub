import {buildLevel,fresh,move,undo,solved,restore} from './engine.mjs?v=9';
import {resolveSlide} from './gesture.mjs?v=9';
import {loadProgress,saveProgress} from './storage.mjs?v=9';
const $=id=>document.getElementById(id),LIMIT=30,GUIDE='let-it-pass-guide-v1';
let storage,storageOK=true;try{storage=window.localStorage}catch{storageOK=false;storage={getItem(){return null},setItem(){throw Error('unavailable')}}}
const MODES={classic:{name:'经典出车',description:'挪开挡路的车，让目标车驶出。',guide:'拖动或点选车辆，腾出目标车通往出口的路。'},parking:{name:'指定停车',description:'先把指定编号的车停进绿色车位，再让目标车驶出。',guide:'绿色格子是指定车位：把对应编号的小车完整停入绿色区域，再让目标车驶出。'},obstacle:{name:'路障绕行',description:'灰色 × 是路障，车辆不能经过，要换一条路线。',guide:'灰色 × 格是固定路障，任何车辆都不能驶入或穿过；找一条可以让目标车驶出的路线。'}};
let mode='classic';try{const saved=storage.getItem('let-it-pass-mode-v1');if(MODES[saved])mode=saved}catch{}
let data=loadProgress(storage,mode),number=data.current,level=buildLevel(number,mode),selected=null;
let state=restore(level,data.progress[number]);
function save(){data.current=number;data.progress[number]=state;try{saveProgress(storage,data,mode)}catch{storageOK=false}}
function say(text,warning=false){$('status').textContent=storageOK?text:'当前浏览器无法保存进度，但可以继续玩。';$('status').classList.toggle('warning',warning||!storageOK)}
function selectedCar(){return level.cars.find(car=>car.id===selected)}
function measure(){return $('board').getBoundingClientRect().width/level.width}
function availableDistance(car,sign){let max=0;for(let amount=1;amount<=Math.max(level.width,level.height);amount++){if(!move(level,state,car.id,sign*amount).ok)break;max=amount}return max*measure()}
function carArt(axis){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('class','car-art');svg.setAttribute('aria-hidden','true');
 svg.setAttribute('viewBox',axis==='H'?'0 0 160 80':'0 0 80 160');
 svg.setAttribute('preserveAspectRatio','none');
 const group=document.createElementNS('http://www.w3.org/2000/svg','g');
 if(axis==='V')group.setAttribute('transform','translate(0 160) rotate(-90)');
 group.innerHTML=`
  <g fill="#34463f"><rect x="24" y="3" width="24" height="14" rx="4"/><rect x="24" y="63" width="24" height="14" rx="4"/><rect x="108" y="3" width="24" height="14" rx="4"/><rect x="108" y="63" width="24" height="14" rx="4"/></g>
  <path d="M19 12 Q9 12 7 24 L5 40 L7 55 Q9 68 20 68 L134 68 Q150 67 153 53 L155 40 L153 27 Q150 13 134 12 Z" fill="var(--car-color)" stroke="#334d42" stroke-opacity=".3" stroke-width="2"/>
  <path d="M34 18 H110 Q121 18 127 25 L132 40 L127 55 Q121 62 110 62 H34 Q28 58 27 50 V30 Q28 22 34 18Z" fill="#f8faf4" fill-opacity=".22"/>
  <path d="M103 20 H111 Q119 20 123 26 L127 40 L123 54 Q119 60 111 60 H103 Q109 50 109 40 Q109 30 103 20Z" fill="#536f72"/>
  <path d="M34 22 Q30 26 30 32 V48 Q30 54 34 58 H43 Q38 49 38 40 Q38 31 43 22Z" fill="#536f72"/>
  <path d="M49 20 H96 L101 25 H45Z M45 55 H101 L96 60 H49Z" fill="#536f72" fill-opacity=".84"/>
  <path d="M12 22 H17 V33 H11Z M11 47 H17 V58 H12Z" fill="#d85e59"/>
  <path d="M145 21 Q151 24 152 30 L146 32Z M146 48 L152 50 Q151 56 145 59Z" fill="#fff5c8"/>
  <path d="M137 25 Q141 40 137 55" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>
 `;
 svg.append(group);return svg;
}
for(const [selector,axis,color] of [['.demo-car-blocker','V','#88b6a6'],['.demo-car-goal','H','#e9937f']]){
 const previous=document.querySelector(selector),art=carArt(axis);
 art.classList.remove('car-art');art.classList.add(selector.slice(1));
 for(const attr of ['x','y','width','height'])art.setAttribute(attr,previous.getAttribute(attr));
 art.style.setProperty('--car-color',color);previous.replaceWith(art);
}
function act(car,delta){
 if(!car||!delta||solved(level,state))return false;
 const result=resolveSlide(level,state,car,delta);
 if(!result.ok){const park=level.parking,p=park&&state.positions[park.id],needsParking=park&&p&&(p.x!==park.x||p.y!==park.y);say(needsParking&&car.target&&delta>0?`请先把 ${park.id.slice(3)} 号车停进绿色车位。`:'这边被挡住了，试试挪开旁边的车。',true);return false}
 if(result.kind==='exited'){state=result.state;selected=null;save();render();say('让开啦！目标车顺利驶出，可以撤回或进入下一关。');return true}
 state=result.state;selected=car.id;save();render();say(car.target?'继续让路，通畅后向右滑出。':'挪开啦，继续找空位。');return true;
}
function render(){
 document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
 $('mode-description').textContent=mode==='parking'?`先把 ${level.parking.id.slice(3)} 号车停进绿色车位，再让目标车驶出。`:MODES[mode].description;
 $('guide-mode-title').textContent=`${MODES[mode].name}怎么玩`;
 $('guide-mode-copy').textContent=mode==='parking'?`本关请把 ${level.parking.id.slice(3)} 号车完整停入绿色区域，再让目标车驶出。`:MODES[mode].guide;
 $('level-current').textContent=`第 ${number} / ${LIMIT} 关`;$('level-open').setAttribute('aria-label',`选择关卡，当前第 ${number} / ${LIMIT} 关`);$('level-name').textContent=level.name;$('move-count').textContent=`已移动 ${state.moves} 次`;
 const board=$('board');board.replaceChildren();board.style.setProperty('--cols',level.width);board.style.setProperty('--rows',level.height);
 const wrap=$('exit-label');wrap.style.setProperty('--exit-top',`${(level.exitRow+.5)/level.height*100}%`);
 for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){const cell=document.createElement('span');cell.className='cell';
 if(level.obstacles?.some(p=>p.x===x&&p.y===y))cell.classList.add('obstacle-cell');
 if(level.parking){const parked=level.cars.find(c=>c.id===level.parking.id);const inSpot=parked.axis==='H'?y===level.parking.y&&x>=level.parking.x&&x<level.parking.x+parked.length:x===level.parking.x&&y>=level.parking.y&&y<level.parking.y+parked.length;if(inSpot)cell.classList.add('parking-cell');}
 cell.style.left=`calc(${x/level.width*100}% + 2px)`;cell.style.top=`calc(${y/level.height*100}% + 2px)`;cell.style.width=`calc(${100/level.width}% - 4px)`;cell.style.height=`calc(${100/level.height}% - 4px)`;cell.setAttribute('aria-hidden','true');board.append(cell)}
 const palette=['#94b8ab','#a8b9d3','#d0b989','#bba9c9','#a8b989','#d2a69a'];
 level.cars.forEach((car,i)=>{
  if(car.target&&state.exited)return;
  const p=state.positions[car.id],button=document.createElement('button');button.type='button';button.className=`car axis-${car.axis.toLowerCase()}${car.target?' goal':''}${selected===car.id?' selected':''}`;button.style.setProperty('--car-color',car.target?'#e99483':car.color||palette[i%palette.length]);
  // Transparent input covers only this car's cells; the SVG keeps its 3px inset.
  button.style.left=`${p.x/level.width*100}%`;button.style.top=`${p.y/level.height*100}%`;button.style.width=`${(car.axis==='H'?car.length:1)/level.width*100}%`;button.style.height=`${(car.axis==='V'?car.length:1)/level.height*100}%`;
  const label=car.target?'目标车':`小车 ${i}`;button.setAttribute('aria-label',`${label}，${car.axis==='H'?'可左右移动':'可上下移动'}，第 ${p.y+1} 行第 ${p.x+1} 列${selected===car.id?'，已选中':''}`);button.setAttribute('aria-pressed',String(selected===car.id));
  const labelEl=document.createElement('span');labelEl.className='car-label';labelEl.setAttribute('aria-hidden','true');labelEl.textContent=car.target?'目标':String(i);button.append(carArt(car.axis),labelEl);
  let start=null,dragged=false;
  button.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType!=='touch')return;start={x:e.clientX,y:e.clientY};dragged=false;try{button.setPointerCapture(e.pointerId)}catch{}});
  button.addEventListener('pointermove',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y,along=car.axis==='H'?dx:dy,cross=car.axis==='H'?dy:dx;if(Math.max(Math.abs(dx),Math.abs(dy))>10)dragged=true;if(Math.abs(along)<Math.abs(cross))return;const max=availableDistance(car,Math.sign(along));const displacement=Math.sign(along)*Math.min(Math.abs(along),max);button.style.transform=car.axis==='H'?`translateX(${displacement}px)`:`translateY(${displacement}px)`;});
  button.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y,along=car.axis==='H'?dx:dy,cross=car.axis==='H'?dy:dx;start=null;button.style.transform='';if(dragged){e.preventDefault();if(Math.abs(along)<14||Math.abs(cross)>Math.abs(along)){selected=car.id;render();say(car.axis==='H'?'这辆车只能左右移动。':'这辆车只能上下移动。',true);return}const distance=Math.sign(along)*Math.max(1,Math.round(Math.abs(along)/measure()));selected=car.id;if(!act(car,distance))render();}else{selected=car.id;render();say(car.target?'选中了目标车，路通后向右滑出。':car.axis==='H'?'选中了横车，可以左右移动。':'选中了竖车，可以上下移动。')}});
  button.addEventListener('pointercancel',()=>{start=null;button.style.transform=''});
  button.addEventListener('click',e=>{if(e.detail===0){selected=car.id;render();say(car.target?'选中了目标车，路通后向右驶出。':'已选中小车，可以使用方向按钮。')}});
  board.append(button);
 });
 const car=selectedCar(),negative=$('negative'),positive=$('positive');negative.disabled=!car||state.exited;positive.disabled=!car||state.exited;
 if(car){const h=car.axis==='H';negative.textContent=h?'←':'↑';positive.textContent=h?'→':'↓';negative.setAttribute('aria-label',h?'向左移动':'向上移动');positive.setAttribute('aria-label',car.target?'向右行驶或驶出':h?'向右移动':'向下移动');$('selected-label').textContent=car.target?'目标车：路通后向右驶出':h?'横车只能左右移动':'竖车只能上下移动'}else{negative.textContent='←';positive.textContent='→';$('selected-label').textContent='点选一辆车，也可用方向按钮'}
 $('undo').disabled=!state.history.length;const done=solved(level,state);$('complete').hidden=!done;$('complete-copy').textContent=`${state.moves} 次移动 · 目标车已驶出`;$('next').textContent=number===LIMIT?'再玩本关':'下一关';if(!storageOK)say('');
}
$('negative').addEventListener('click',()=>act(selectedCar(),-1));$('positive').addEventListener('click',()=>act(selectedCar(),1));
$('undo').addEventListener('click',()=>{const previous=undo(state);if(previous){state=previous;selected=null;save();render();say('已撤回一步。')}});
function changeLevel(n,reset=false){if(!Number.isInteger(n)||n<1||n>LIMIT)return;save();number=n;level=buildLevel(n,mode);state=reset?fresh(level):restore(level,data.progress[n]);selected=null;save();render();say('沿车身方向拖动，或者点选小车后使用方向按钮。')}
$('reset').addEventListener('click',()=>{if(confirm('重新开始这一关？当前关内进度会清空。'))changeLevel(number,true)});$('next').addEventListener('click',()=>number===LIMIT?changeLevel(number,true):changeLevel(number+1));
const levelDialog=$('level-dialog'),levelList=$('level-list'),dialog=$('help-dialog'),backdrop=$('modal-backdrop');
let fallbackDialog=null,previousFocus=null;
const guideKey=()=>mode==='classic'?GUIDE:`${GUIDE}-${mode}`;
function markGuideSeen(){try{storage.setItem(guideKey(),'seen')}catch{}}
function openModal(target,focusTarget){
 if(target.open||fallbackDialog)return;
 if(typeof target.showModal==='function'&&typeof target.close==='function'){target.showModal();return}
 previousFocus=document.activeElement;fallbackDialog=target;target.classList.add('fallback-dialog');target.setAttribute('open','');backdrop.hidden=false;focusTarget?.focus();
}
function closeModal(target){
 if(fallbackDialog===target){target.removeAttribute('open');target.classList.remove('fallback-dialog');backdrop.hidden=true;fallbackDialog=null;if(target===dialog)markGuideSeen();previousFocus?.focus();previousFocus=null}
 else if(target.open&&typeof target.close==='function')target.close();
}
backdrop.addEventListener('click',()=>{if(fallbackDialog)closeModal(fallbackDialog)});
for(const target of [dialog,levelDialog])target.addEventListener('keydown',e=>{
 if(fallbackDialog!==target)return;
 if(e.key==='Escape'){e.preventDefault();closeModal(target);return}
 if(e.key==='Tab'){
  const buttons=[...target.querySelectorAll('button:not([disabled])')];if(!buttons.length)return;
  const first=buttons[0],last=buttons[buttons.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 }
});
function showLevels(){
 $('level-dialog-title').textContent=`${MODES[mode].name} · ${LIMIT} 关`;
 levelList.replaceChildren();
 for(let n=1;n<=LIMIT;n++){
  const complete=(n===number?state:data.progress[n])?.exited===true;
  const choice=document.createElement('button');choice.type='button';choice.className='level-choice';choice.textContent=String(n);
  if(n===number){choice.classList.add('is-current');choice.setAttribute('aria-current','true')}
  if(complete){choice.classList.add('is-completed');const mark=document.createElement('span');mark.className='level-check';mark.setAttribute('aria-hidden','true');mark.textContent='✓';choice.append(mark)}
  choice.setAttribute('aria-label',`第 ${n} 关${n===number?'，当前关':''}${complete?'，已通关':''}`);
  choice.addEventListener('click',()=>{closeModal(levelDialog);if(n!==number)changeLevel(n)});
  levelList.append(choice);
 }
 if(!levelDialog.open)openModal(levelDialog,$('close-levels'));
 const current=levelList.querySelector('.is-current');current?.focus({preventScroll:true});current?.scrollIntoView({block:'nearest'});
}
$('level-open').addEventListener('click',showLevels);$('close-levels').addEventListener('click',()=>closeModal(levelDialog));
function maybeShowGuide(){let seen=false;try{seen=storage.getItem(guideKey())==='seen'}catch{}if(!seen&&!dialog.open)openModal(dialog,$('close-help'))}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{const nextMode=button.dataset.mode;if(!MODES[nextMode]||nextMode===mode)return;save();mode=nextMode;try{storage.setItem('let-it-pass-mode-v1',mode)}catch{}data=loadProgress(storage,mode);number=data.current;level=buildLevel(number,mode);state=restore(level,data.progress[number]);selected=null;render();say(MODES[mode].description);maybeShowGuide()}));$('help').addEventListener('click',()=>openModal(dialog,$('close-help')));$('guide').addEventListener('click',()=>openModal(dialog,$('close-help')));$('close-help').addEventListener('click',()=>closeModal(dialog));dialog.addEventListener('close',markGuideSeen);
render();if(!storageOK)say('');maybeShowGuide();
