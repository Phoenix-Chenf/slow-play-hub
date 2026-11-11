import {buildLevel, fresh, move, undo, addSlot, isCovered, isLocked, TILES} from './engine.mjs?v=20261110c';
import {readProgress, writeProgress, MODES} from './storage.mjs?v=20261110c';

const $ = id => document.getElementById(id);
// Older mobile webviews may not implement Element.replaceChildren.
function clearChildren(element) {
  if (typeof element.replaceChildren === 'function') element.replaceChildren();
  else while (element.firstChild) element.removeChild(element.firstChild);
}
const LIMIT = 30;
const MODE_TEXT = {
  classic: '经典整理：挑露出的片片，凑齐三个一样的图案。',
  mystery: '迷雾揭晓：问号片拿起放进槽里才揭晓图案，可随时撤回。',
  keys: '钥匙解锁：先拿钥匙片，再拿相同编号的锁片。'
};

let storage, saving = true;
try { storage = window.localStorage; } catch { saving = false; storage = {getItem(){return null;},setItem(){throw new Error('storage unavailable');}}; }
const data = readProgress(storage, () => { saving = false; });
let mode = data.mode;
let index = data.levels[mode];
let level = buildLevel(index, mode);
let state = data.progress[mode][index] || fresh(level);

const select = $('level-select');
for (let i = 1; i <= LIMIT; i++) select.add(new Option(`第 ${i} / ${LIMIT} 关`, String(i)));

function save() {
  data.mode = mode;
  data.levels[mode] = index;
  data.progress[mode][index] = state;
  try { writeProgress(storage, data); } catch { saving = false; }
}
function tell(text, warning = false) {
  $('message').textContent = text;
  $('message').classList.toggle('warning', warning);
}
function render() {
  select.value = String(index);
  $('level-name').textContent = level.name;
  $('left-count').textContent = `剩余 ${state.remaining.length} 片`;
  $('move-count').textContent = `已移动 ${state.moves} 次`;
  // Preserve unlimited capacity while bounding the number of empty DOM nodes.
  // Large, valid saved capacities must not block startup or make the tray unusable.
  const visibleSlots = Math.min(state.capacity, Math.max(24, state.tray.length + 5));
  const hiddenEmptySlots = state.capacity - visibleSlots;
  $('tray-caption').textContent = `${state.tray.length} / ${state.capacity}${hiddenEmptySlots ? ` · 省略 ${hiddenEmptySlots} 个空槽` : ''}`;
  $('mode-copy').textContent = MODE_TEXT[mode];
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));

  const board = $('board');
  clearChildren(board);
  board.style.setProperty('--board-ratio', `${level.height / level.width * 100}%`);
  const remains = new Set(state.remaining);
  const keys = level.tiles.filter(tile => tile.keyFor != null).sort((a, b) => a.id - b.id);
  const numbers = new Map(keys.map((tile, i) => [tile.id, i + 1]));
  for (const tile of level.tiles) {
    if (!remains.has(tile.id)) continue;
    const info = TILES[tile.kind];
    const covered = isCovered(tile, level.tiles, remains);
    const locked = isLocked(tile, remains);
    const concealed = mode === 'mystery' && !!tile.mystery;
    const name = concealed ? '迷雾片，图案未知' : info.name;
    const badgeNumber = tile.keyFor != null ? numbers.get(tile.id) : tile.lockBy != null ? numbers.get(tile.lockBy) : null;
    const badgeText = tile.keyFor != null ? `钥匙 ${badgeNumber}` : tile.lockBy != null ? `${locked ? '锁' : '已解锁'} ${badgeNumber}` : '';
    const reasons = [covered ? '被上层压住' : '', locked ? '已锁住' : ''].filter(Boolean);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tile';
    button.classList.toggle('mystery', concealed);
    button.classList.toggle('locked', locked);
    button.classList.toggle('keyed', tile.keyFor != null);
    button.disabled = covered || locked;
    button.style.setProperty('--tile-color', concealed ? '#d9d8e5' : info.color);
    button.style.left = `${tile.x / level.width * 100}%`;
    button.style.top = `${tile.y / level.height * 100}%`;
    button.style.width = `${55 / level.width * 100}%`;
    button.style.zIndex = String(tile.layer + 1);
    button.setAttribute('aria-label', [name, badgeText, reasons.length ? reasons.join('，') : '可以拿取'].filter(Boolean).join('，'));
    const pic = document.createElement('span');
    pic.className = 'pic';
    pic.textContent = concealed ? '?' : info.icon;
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = concealed ? '迷雾' : info.name;
    button.append(pic, label);
    if (badgeNumber != null) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = tile.keyFor != null ? `🔑${badgeNumber}` : `${locked ? '🔒' : '🔓'}${badgeNumber}`;
      button.append(badge);
    }
    button.addEventListener('click', () => take(tile.id));
    board.append(button);
  }
  const tray = $('tray');
  clearChildren(tray);
  for (let i = 0; i < visibleSlots; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    if (i < state.tray.length) {
      const item = TILES[state.tray[i]];
      slot.classList.add('filled');
      slot.style.setProperty('--slot-color', item.color);
      slot.textContent = item.icon;
      slot.setAttribute('aria-label', item.name);
    } else slot.setAttribute('aria-label', '空槽位');
    tray.append(slot);
  }
  $('undo').disabled = !state.history.length;
  const done = !state.remaining.length && !state.tray.length;
  $('complete').hidden = !done;
  $('complete-copy').textContent = `${state.moves} 次移动${state.extra ? ` · 加了 ${state.extra} 个槽位` : ' · 没有加槽位'}`;
  $('next').textContent = index === LIMIT ? '再玩本关' : '下一关';
  $('save-warning').hidden = saving;
}
function take(id) {
  const result = move(level, state, id);
  if (!result.ok) {
    const message = result.reason === 'full' ? '槽位满啦，撤回一步或加个槽位吧。' :
      result.reason === 'locked' ? '这片上锁了，先拿相同编号的钥匙片。' : '这片还被压着，先拿上面的。';
    tell(message, true);
    return;
  }
  const before = state.tray.length;
  const key = level.tiles.find(tile => tile.id === id)?.keyFor != null;
  state = result.state;
  save();
  render();
  if (result.cleared) tell('清空啦！你可以继续下一关，也可以撤回。');
  else if (state.tray.length < before + 1) tell('三个一样的片片消除了，继续找找。');
  else if (key) tell('拿到了钥匙，对应编号的锁打开了。');
  else if (state.tray.length >= state.capacity) tell('槽位满啦，撤回一步或加个槽位吧。', true);
  else tell('选露出的片片，三个一样就会消除。');
}
function setLevel(n, reset = false) {
  if (!Number.isInteger(n) || n < 1 || n > LIMIT) return;
  save();
  index = n;
  level = buildLevel(index, mode);
  state = !reset && data.progress[mode][index] ? data.progress[mode][index] : fresh(level);
  save();
  render();
  tell('从露出的片片开始，慢慢整理。');
}
function setMode(nextMode) {
  if (!MODES.includes(nextMode) || nextMode === mode) return;
  save();
  mode = nextMode;
  index = data.levels[mode];
  level = buildLevel(index, mode);
  state = data.progress[mode][index] || fresh(level);
  save();
  render();
  tell('已切换玩法，之前的进度保存在本机。');
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
$('add').addEventListener('click', () => { state = addSlot(state); save(); render(); $('tray').scrollLeft = $('tray').scrollWidth; tell('加了一个空槽位，可以继续整理。'); });
$('undo').addEventListener('click', () => { const previous = undo(state); if (previous) { state = previous; save(); render(); tell('已撤回一步。'); } });
$('reset').addEventListener('click', () => { if (confirm('重新开始这一关？当前关内进度会清空。')) setLevel(index, true); });
select.addEventListener('change', () => setLevel(Number(select.value)));
$('next').addEventListener('click', () => index === LIMIT ? setLevel(index, true) : setLevel(index + 1));
const GUIDE_KEY = 'one-layer-guide-seen-v1';
function rememberHelp() { try { storage.setItem(GUIDE_KEY, '1'); } catch {} }
const dialog = $('help-dialog');
const backdrop = $('help-backdrop');
let fallbackOpen = false, previousFocus = null;
function openHelp() {
  if (dialog.open || fallbackOpen) return;
  if (typeof dialog.showModal === 'function' && typeof dialog.close === 'function') {
    dialog.showModal();
    return;
  }
  previousFocus = document.activeElement;
  fallbackOpen = true;
  dialog.classList.add('fallback-dialog');
  dialog.setAttribute('open', '');
  backdrop.hidden = false;
  $('close-help').focus?.();
}
function closeHelp() {
  if (fallbackOpen) {
    dialog.removeAttribute('open');
    dialog.classList.remove('fallback-dialog');
    backdrop.hidden = true;
    fallbackOpen = false;
    rememberHelp();
    previousFocus?.focus?.();
    previousFocus = null;
  } else if (dialog.open && typeof dialog.close === 'function') dialog.close();
}
dialog.addEventListener('close', rememberHelp);
$('help').addEventListener('click', openHelp);
$('guide').addEventListener('click', openHelp);
$('close-help').addEventListener('click', closeHelp);
backdrop.addEventListener('click', closeHelp);
dialog.addEventListener('click', e => { if (e.target === dialog) closeHelp(); });
dialog.addEventListener('keydown', e => {
  if (!fallbackOpen) return;
  if (e.key === 'Escape') {e.preventDefault();closeHelp();}
  else if (e.key === 'Tab') {e.preventDefault();$('close-help').focus();}
});
render();
let helpSeen = false;
try { helpSeen = storage.getItem(GUIDE_KEY) === '1'; } catch {}
if (!helpSeen) openHelp();
