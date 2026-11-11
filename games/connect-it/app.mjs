import {buildLevel, fresh, rotate, undo, analyze} from './engine.mjs?v=2';
import {loadProgress, saveProgress, MODES} from './storage.mjs?v=2';
const $ = id => document.getElementById(id);
const LIMIT = 30;
const GUIDE_KEY='connect-it-guide-v1';
const MODE_TEXT={
 classic:'经典接通：让水流到所有终点，没接上的管口不影响通关。',
 sealed:'严丝合缝：所有管口都接好，所有管道都要通水。',
 duo:'双源汇合：让两个水源汇合，再让所有终点通水。'
};
let storage, storageOK = true;
try { storage = window.localStorage; } catch { storageOK = false; storage = {getItem(){return null;}, setItem(){throw Error('storage unavailable');}}; }
const data = loadProgress(storage);
let mode=data.mode;
let number = data.levels[mode];
let level = buildLevel(number,mode);
function restored(level, candidate) {
  if (!candidate || !Array.isArray(candidate.rotations) || candidate.rotations.length !== level.tiles.length || !candidate.rotations.every(x=>Number.isInteger(x)&&x>=0&&x<=3) || !Array.isArray(candidate.history) || !Number.isInteger(candidate.moves) || candidate.moves < 0) return fresh(level);
  return candidate;
}
let state = restored(level, data.progress[mode][number]);
const select = $('level-select');
for (let n=1;n<=LIMIT;n++) select.add(new Option(`第 ${n} / ${LIMIT} 关`,String(n)));
function save() {
  data.mode=mode; data.levels[mode]=number; data.progress[mode][number]=state;
  try { saveProgress(storage,data); } catch { storageOK=false; }
}
function say(message) { $('status').textContent = storageOK ? message : '当前浏览器无法保存进度，但可以继续玩。'; }
const directions = [[1,'上',50,0],[2,'右',100,50],[4,'下',50,100],[8,'左',0,50]];
const svgNS = 'http://www.w3.org/2000/svg';
function addSvgElement(svg, tag, attrs) {
  const el=document.createElementNS(svgNS,tag);
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
  svg.appendChild(el); return el;
}
function render() {
  const info=analyze(level,state), flow=new Set(info.flow), targetReached=new Set(info.connectedTargets);
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
  $('mode-copy').textContent=MODE_TEXT[mode];
  const modeStatus=$('mode-status');modeStatus.hidden=mode==='classic';
  if(mode==='sealed') modeStatus.textContent=`未接好的管口 ${info.leaks} · 未通水管道 ${info.dryCount}`;
  if(mode==='duo') modeStatus.textContent=info.merged?'两个水源已汇合':'两个水源尚未汇合';
  select.value=String(number);$('level-name').textContent=level.name;
  $('target-count').textContent=`已接通 ${targetReached.size} / ${level.targets.length}`;
  $('move-count').textContent=`已旋转 ${state.moves} 次`;
  const board=$('board');board.style.setProperty('--columns',level.cols);board.style.setProperty('--rows',level.rows);board.replaceChildren();
  level.tiles.forEach((tile, i) => {
    const button=document.createElement('button');button.type='button';button.className='pipe';
    if (!tile) {button.classList.add('empty');button.disabled=true;button.setAttribute('aria-hidden','true');board.append(button);return;}
    const sources=level.sources || [level.source], sourceIndex=sources.indexOf(i), isSource=sourceIndex>=0;
    const mask=info.masks[i], isTarget=level.targets.includes(i), inFlow=flow.has(i), reached=targetReached.has(i);
    button.classList.toggle('flow',inFlow);
    const dirNames=directions.filter(([bit])=>mask&bit).map(([,name])=>name).join('、');
    button.setAttribute('aria-label',`${isSource?(sources.length>1?`起点 ${sourceIndex+1}`:'起点'):isTarget?'终点':'管道'}，第 ${tile.row+1} 行第 ${tile.col+1} 列，管口朝${dirNames}，${inFlow?'已通水':'未通水'}，点击旋转`);
    const svg=document.createElementNS(svgNS,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');
    const path=directions.filter(([bit])=>mask&bit).map(([, ,x,y])=>`M50 50 L${x} ${y}`).join(' ');
    addSvgElement(svg,'path',{d:path,class:'outer'});addSvgElement(svg,'path',{d:path,class:'inner'});addSvgElement(svg,'circle',{cx:50,cy:50,r:6.5,class:'center'});button.append(svg);
    if(isSource||isTarget){const mark=document.createElement('span');mark.className=`mark${isTarget?' target':''}${reached?' reached':''}${isSource&&sources.length>1?` source${sourceIndex+1}`:''}`;mark.setAttribute('aria-hidden','true');mark.textContent=isSource?(sources.length>1?`源${sourceIndex+1}`:'源'):'终';button.append(mark);}
    button.addEventListener('click',()=>turn(i)); board.append(button);
  });
  $('undo').disabled=!state.history.length;
  $('complete').hidden=!info.done;
  $('complete-copy').textContent=`${state.moves} 次旋转 · ${mode==='sealed'?'管口全部接好':mode==='duo'?'双源汇合，终点通水':'所有终点已通水'}`;
  $('next').textContent=number===LIMIT?'再玩本关':'下一关';
}
function turn(i) {
  const before=analyze(level,state), result=rotate(level,state,i);
  if(!result.ok) return;
  state=result.state;save();render();
  const after=analyze(level,state);
  if(after.done) say('接好啦！可以撤回，也可以继续下一关。');
  else if(mode==='duo' && !before.merged && after.merged) say('两个水源汇合啦，继续把水接到终点。');
  else if(after.connectedTargets.length>before.connectedTargets.length) say('接上一个终点啦，继续找找。');
  else if(after.flow.length>before.flow.length) say('水流接上了一段，继续转转。');
  else say('继续旋转，让水流到终点。');
}
function changeLevel(n, reset=false){
  if(!Number.isInteger(n)||n<1||n>LIMIT)return;
  save();number=n;level=buildLevel(n,mode);state=reset?fresh(level):restored(level,data.progress[mode][n]);save();render();say('点一段管道，轻轻转一转。');
}
function changeMode(nextMode) {
 if(!MODES.includes(nextMode)||nextMode===mode)return;
 save();mode=nextMode;number=data.levels[mode];level=buildLevel(number,mode);state=restored(level,data.progress[mode][number]);save();render();say('已切换玩法，之前的进度保存在本机。');
}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>changeMode(button.dataset.mode)));
$('undo').addEventListener('click',()=>{const previous=undo(state);if(previous){state=previous;save();render();say('已撤回一步。');}});
$('reset').addEventListener('click',()=>{if(confirm('重新开始这一关？当前关内进度会清空。'))changeLevel(number,true);});
$('next').addEventListener('click',()=>number===LIMIT?changeLevel(number,true):changeLevel(number+1));
select.addEventListener('change',()=>changeLevel(Number(select.value)));
const dialog=$('help-dialog');$('help').addEventListener('click',()=>dialog.showModal());$('guide').addEventListener('click',()=>dialog.showModal());$('close-help').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{try{storage.setItem(GUIDE_KEY,'seen');}catch{}});
render();if(!storageOK)say('');
let seen=false;try{seen=storage.getItem(GUIDE_KEY)==='seen';}catch{}
if(!seen)dialog.showModal();
