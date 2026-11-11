import {buildLevel,fresh,move,undo,solved,hint,isSolvable} from './engine.mjs?v=20261110a';

const $=id=>document.getElementById(id), TOTAL=30, SAVE_KEY='one-stroke-garden-v1', GUIDE_KEY='one-stroke-garden-guide-v1';
const MODES={classic:{name:'经典游园',description:'每段小路走一次，路口可以再次经过。',guide:'从起点出发，走遍所有小路；同一条路不能重复走。'},oneway:{name:'单行小路',description:'沿路上的箭头方向前进，每段小路走一次。',guide:'留意每条小路的箭头：只能顺箭头方向走，已走过的小路不能再走。'},checkpoints:{name:'顺序游园',description:'按 1、2、3 的顺序首次到达编号路口。',guide:'请按数字从小到大首次到达编号路口；已经到过的路口可以再次经过，走遍所有小路。'}};
let storageOK=true;
function read(key){try{return localStorage.getItem(key)}catch{storageOK=false;return null}}
function write(key,value){try{localStorage.setItem(key,value)}catch{storageOK=false}}
let mode='classic';const previousMode=read('one-stroke-garden-mode-v1');if(MODES[previousMode])mode=previousMode;
const saveKey=()=>mode==='classic'?SAVE_KEY:`${SAVE_KEY}-${mode}`;
const guideKey=()=>mode==='classic'?GUIDE_KEY:`${GUIDE_KEY}-${mode}`;
function loadData(){try{const parsed=JSON.parse(read(saveKey()));if(parsed&&Number.isInteger(parsed.current)&&parsed.current>=1&&parsed.current<=TOTAL&&parsed.progress&&typeof parsed.progress==='object'&&!Array.isArray(parsed.progress))return parsed}catch{}return {current:1,progress:{}}}
let data=loadData();
let number=data.current,level=buildLevel(number,mode),state=restore(level,data.progress[number]),hinted=null;
function restore(puzzle,saved){
 let result=fresh(puzzle);
 if(!saved||!Array.isArray(saved.path)||saved.path[0]!==puzzle.start||saved.path.length>puzzle.edges.length+1)return result;
 for(const node of saved.path.slice(1)){const next=move(puzzle,result,node);if(!next.ok)return fresh(puzzle);result=next.state}
 return result;
}
function save(){data.current=number;data.progress[number]={path:[...state.path]};write(saveKey(),JSON.stringify(data))}
function say(message,warning=false){$('status').textContent=storageOK?message:'当前浏览器无法保存进度，但可以继续玩。';$('status').classList.toggle('warning',warning||!storageOK)}
function edgeFor(a,b){return level.edges.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))}
function usedEdges(){const ids=new Set();for(let i=1;i<state.path.length;i++){const edge=edgeFor(state.path[i-1],state.path[i]);if(edge)ids.add(edge.id)}return ids}
function render(){
 document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
 const checkpoints=level.checkpoints||[], reached=checkpoints.filter(id=>state.path.includes(id)).length;
 $('mode-description').textContent=mode==='checkpoints'?`${MODES[mode].description} 已到 ${reached} / ${checkpoints.length} 个。`:MODES[mode].description;
 $('guide-mode-title').textContent=`${MODES[mode].name}怎么玩`;$('guide-mode-copy').textContent=MODES[mode].guide;
 $('level-current').textContent=`第 ${number} / ${TOTAL} 关`;
 $('level-open').setAttribute('aria-label',`选择关卡，当前第 ${number} / ${TOTAL} 关`);
 $('level-name').textContent=level.name;
 $('count').textContent=`已走 ${state.path.length-1} / ${level.edges.length} 条`;
 const used=usedEdges(),current=state.path[state.path.length-1],byId=new Map(level.nodes.map(n=>[n.id,n]));
 const xs=level.nodes.map(n=>n.x),ys=level.nodes.map(n=>n.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const scale=Math.min(140,296/Math.max(1,maxX-minX,maxY-minY)),px=x=>200+(x-(minX+maxX)/2)*scale,py=y=>200+(y-(minY+maxY)/2)*scale;
 const svg=$('routes');svg.replaceChildren();
 for(const edge of level.edges){const a=byId.get(edge.a),b=byId.get(edge.b),line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',px(a.x));line.setAttribute('y1',py(a.y));line.setAttribute('x2',px(b.x));line.setAttribute('y2',py(b.y));line.setAttribute('class',`road${used.has(edge.id)?' walked':''}`);svg.append(line);
  if(mode==='oneway'&&edge.from&&edge.to){const from=byId.get(edge.from),to=byId.get(edge.to),x=(px(from.x)+px(to.x))/2,y=(py(from.y)+py(to.y))/2,dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y),size=7;const arrow=document.createElementNS('http://www.w3.org/2000/svg','path');arrow.setAttribute('d',`M ${x+dx*size} ${y+dy*size} L ${x-dx*size-dy*size*.75} ${y-dy*size+dx*size*.75} L ${x-dx*size+dy*size*.75} ${y-dy*size-dx*size*.75} Z`);arrow.setAttribute('class',`road-arrow${used.has(edge.id)?' walked':''}`);svg.append(arrow)}
 }
 const nodes=$('nodes');nodes.replaceChildren();
 for(const node of level.nodes){const checkpointIndex=checkpoints.indexOf(node.id),visited=checkpointIndex>=0&&state.path.includes(node.id);const button=document.createElement('button');button.type='button';button.className=`node${node.id===level.start?' start':''}${node.id===current?' current':''}${node.id===hinted?' hinted':''}${checkpointIndex>=0?' checkpoint':''}${visited?' visited':''}`;button.dataset.node=node.id;button.style.left=`${px(node.x)/4}%`;button.style.top=`${py(node.y)/4}%`;button.setAttribute('aria-label',`第 ${node.y+1} 行第 ${node.x+1} 列${checkpointIndex>=0?`，${checkpointIndex+1} 号路口${visited?'，已到达':''}`:''}${node.id===level.start?'，起点':''}${node.id===current?'，当前位置':''}${node.id===hinted?'，提示位置':''}`);if(checkpointIndex>=0){const label=document.createElement('span');label.className='node-number';label.textContent=String(checkpointIndex+1);label.setAttribute('aria-hidden','true');button.append(label)}nodes.append(button)}
 $('undo').disabled=state.path.length<=1;$('hint').disabled=solved(level,state);
 $('complete').hidden=!solved(level,state);$('next').textContent=number===TOTAL?'再玩本关':'下一关';
 if(!storageOK)say('');
}
function chooseNode(id,quiet=false){
 if(id===state.path[state.path.length-1])return;
 const result=move(level,state,id);
 if(!result.ok){if(!quiet){const messages={used:'这条小路已经走过啦，试试别的方向。',direction:'这条小路只能顺箭头方向走。',checkpoint:'请按数字顺序到达路口。'};say(messages[result.reason]||'从当前位置沿着相连的小路走。',true)}return}
 state=result.state;hinted=null;save();render();
 if(solved(level,state))say('所有小路都走过啦，可以撤回或进入下一关。');
 else if(!isSolvable(level,state))say('这条路线可能走不完，撤回一步再试试。',true);
 else say('走过的小路亮起来啦，继续慢慢走。');
}
function changeLevel(n,reset=false){if(!Number.isInteger(n)||n<1||n>TOTAL)return;save();number=n;level=buildLevel(n,mode);state=reset?fresh(level):restore(level,data.progress[n]);hinted=null;save();render();say(MODES[mode].description)}
$('undo').addEventListener('click',()=>{const previous=undo(state);if(!previous)return;state=previous;hinted=null;save();render();say('已撤回一步。')});
$('hint').addEventListener('click',()=>{if(solved(level,state))return;const next=hint(level,state);if(next==null){hinted=null;render();say('现在的路线走不完，试试撤回几步。',true);return}hinted=next;render();say('亮起来的点是可以尝试的下一步。')});
$('reset').addEventListener('click',()=>{if(confirm('重新开始这一关？当前路线会清空。'))changeLevel(number,true)});
$('next').addEventListener('click',()=>number===TOTAL?changeLevel(number,true):changeLevel(number+1));

// Pointer capture keeps dragging on the board even as the current-node buttons redraw.
const board=$('board');let drag=null;
function nodeAt(x,y){return document.elementFromPoint(x,y)?.closest?.('[data-node]')?.dataset.node}
board.addEventListener('pointerdown',event=>{const node=event.target.closest?.('[data-node]');if(!node||event.button!==0)return;event.preventDefault();board.setPointerCapture(event.pointerId);drag={id:event.pointerId,x:event.clientX,y:event.clientY};chooseNode(node.dataset.node)});
board.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/8));for(let i=1;i<=steps;i++){const id=nodeAt(drag.x+dx*i/steps,drag.y+dy*i/steps);if(id)chooseNode(id,true)}drag.x=event.clientX;drag.y=event.clientY});
function stopDrag(event){if(drag?.id===event.pointerId)drag=null}
board.addEventListener('pointerup',stopDrag);board.addEventListener('pointercancel',stopDrag);board.addEventListener('lostpointercapture',stopDrag);
$('nodes').addEventListener('click',event=>{if(event.detail!==0)return;const node=event.target.closest?.('[data-node]');if(!node)return;const id=node.dataset.node;chooseNode(id);[...$('nodes').querySelectorAll('[data-node]')].find(item=>item.dataset.node===id)?.focus()});

const levelDialog=$('level-dialog'),helpDialog=$('help-dialog');
function fillLevels(){const list=$('level-list');$('level-dialog-title').textContent=`${MODES[mode].name} · ${TOTAL} 关`;list.replaceChildren();for(let n=1;n<=TOTAL;n++){const puzzle=buildLevel(n,mode),saved=restore(puzzle,data.progress[n]),complete=solved(puzzle,saved),button=document.createElement('button');button.type='button';button.textContent=String(n);button.setAttribute('aria-label',`第 ${n} 关${n===number?'，当前关':''}${complete?'，当前局面已走完':''}`);if(n===number)button.setAttribute('aria-current','true');if(complete){const tick=document.createElement('span');tick.className='tick';tick.textContent='✓';tick.setAttribute('aria-hidden','true');button.append(tick)}button.addEventListener('click',()=>{levelDialog.close();if(n!==number)changeLevel(n)});list.append(button)}}
$('level-open').addEventListener('click',()=>{fillLevels();levelDialog.showModal();$('level-list').querySelector('[aria-current="true"]')?.focus()});
$('close-levels').addEventListener('click',()=>levelDialog.close());
$('help').addEventListener('click',()=>helpDialog.showModal());$('close-help').addEventListener('click',()=>helpDialog.close());
helpDialog.addEventListener('close',()=>write(guideKey(),'seen'));
function maybeShowGuide(){if(read(guideKey())!=='seen'&&!helpDialog.open)helpDialog.showModal()}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{const nextMode=button.dataset.mode;if(!MODES[nextMode]||nextMode===mode)return;save();mode=nextMode;write('one-stroke-garden-mode-v1',mode);data=loadData();number=data.current;level=buildLevel(number,mode);state=restore(level,data.progress[number]);hinted=null;render();say(MODES[mode].description);maybeShowGuide()}));
render();maybeShowGuide();
