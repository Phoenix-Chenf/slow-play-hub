import { MODES, LEVEL_COUNT, createPuzzle, canPlace, finished, place } from './engine.mjs?v=2';
const $ = (id) => document.getElementById(id);
const key = 'slow-sudoku-v1';
let saved = null, writable = true;
try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch { writable = false; }
const data = saved && typeof saved === 'object' ? saved : {};
data.games = data.games && typeof data.games === 'object' ? data.games : {};
let mode = Object.prototype.hasOwnProperty.call(MODES, data.mode) ? data.mode : 'easy';
let level = Number.isInteger(data.level) && data.level >= 1 && data.level <= LEVEL_COUNT ? data.level : 1;
let selected = null, current, given, solution, message = '先选一个空格，再填入数字。';
const keyFor = () => `${mode}-${level}`;
function save() {
  data.mode = mode; data.level = level; data.games[keyFor()] = current;
  try { localStorage.setItem(key, JSON.stringify(data)); writable = true; } catch { writable = false; }
  $('save-warning').hidden = writable;
}
function validBoard(values) {
  return Array.isArray(values) && values.length === 81 && values.every((n, i) => Number.isInteger(n) && n >= 0 && n <= 9 && (!given[i] || given[i] === n));
}
function load() {
  ({ puzzle: given, solution } = createPuzzle(mode, level));
  const v = data.games[keyFor()];
  current = v && validBoard(v.values) ? { values: v.values.slice(), history: Array.isArray(v.history) ? v.history.filter(validBoard).map(b => b.slice()) : [] } : { values: given.slice(), history: [] };
  selected = null; message = '先选一个空格，再填入数字。'; render(); save();
}
function setMessage(s) { message = s; $('message').textContent = s; }
function render() {
  const values = current.values;
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
  $('level').value = String(level);
  $('progress').textContent = `已填 ${values.filter(Boolean).length} / 81 格`;
  $('board').textContent = '';
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9), col = i % 9, val = values[i];
    const button = document.createElement('button'); button.type = 'button'; button.className = 'cell';
    if (col % 3 === 2 && col !== 8) button.classList.add('box-right');
    if (row % 3 === 2 && row !== 8) button.classList.add('box-bottom');
    if (given[i]) button.classList.add('given');
    if (selected !== null) {
      const sr = Math.floor(selected / 9), sc = selected % 9;
      if (row === sr || col === sc || (Math.floor(row / 3) === Math.floor(sr / 3) && Math.floor(col / 3) === Math.floor(sc / 3))) button.classList.add('peer');
      if (values[selected] && values[selected] === val) button.classList.add('same');
    }
    if (i === selected) button.classList.add('selected');
    if (val && !canPlace(values, i, val)) button.classList.add('conflict');
    button.textContent = val || ''; button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', `第${row + 1}行第${col + 1}列，${given[i] ? '题目数字' : '可填写'}${val || '空'}`);
    button.setAttribute('aria-selected', String(i === selected));
    button.addEventListener('click', () => { selected = i; setMessage(given[i] ? '这是题目给出的数字，请选空格填写。' : '选择下方的数字。'); render(); });
    $('board').appendChild(button);
  }
  $('undo').disabled = current.history.length === 0;
  $('erase').disabled = selected === null || Boolean(given[selected]) || !values[selected];
  $('complete').hidden = !finished(values);
  $('next').textContent = level < LEVEL_COUNT ? '下一关' : '再玩第一关';
  $('message').textContent = message;
}
function input(n) {
  if (selected === null) { setMessage('请先选择一个空格。'); return; }
  const next = place(given, current.values, selected, n);
  if (!next) { setMessage('题目给出的数字不能改动，请选空格。'); return; }
  if (next[selected] === current.values[selected]) return;
  current.history.push(current.values.slice()); current.values = next;
  message = finished(next) ? '完成啦，慢慢数独也可以很有成就感。' : n && !canPlace(next, selected, n) ? '有重复的数字，换一个试试。' : n ? '填好了，可以继续。' : '已经擦除。';
  render(); save();
}
for (let n = 1; n <= 9; n++) { const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.setAttribute('aria-label', `填写数字 ${n}`); b.addEventListener('click', () => input(n)); $('numbers').appendChild(b); }
for (let n = 1; n <= LEVEL_COUNT; n++) { const o = document.createElement('option'); o.value = n; o.textContent = `第 ${n} / ${LEVEL_COUNT} 关`; $('level').appendChild(o); }
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; level = 1; load(); }));
$('level').addEventListener('change', e => { level = Number(e.target.value); load(); });
$('undo').addEventListener('click', () => { if (!current.history.length) return; current.values = current.history.pop(); message = '已撤回一步。'; render(); save(); });
$('erase').addEventListener('click', () => input(0));
$('hint').addEventListener('click', () => {
  let i = selected !== null && !given[selected] && current.values[selected] !== solution[selected] ? selected : current.values.findIndex((v, j) => !given[j] && v !== solution[j]);
  if (i < 0) { setMessage('这一关已经填好了。'); return; }
  selected = i; current.history.push(current.values.slice()); current.values[i] = solution[i];
  message = finished(current.values) ? '完成啦，慢慢数独也可以很有成就感。' : '已帮你填入一个数字，也可以撤回。'; render(); save();
});
$('next').addEventListener('click', () => { level = level < LEVEL_COUNT ? level + 1 : 1; load(); });
$('reset').addEventListener('click', () => { if (!confirm('重新开始本关？当前填写会清空。')) return; current.history.push(current.values.slice()); current.values = given.slice(); selected = null; message = '已重新开始，也可以撤回。'; render(); save(); });
const overlay = $('overlay');
function showHelp() { overlay.hidden = false; $('close-help').focus(); }
function closeHelp() { overlay.hidden = true; data.seen = true; save(); $('help').focus(); }
$('help').addEventListener('click', showHelp); $('close-help').addEventListener('click', closeHelp);
document.addEventListener('keydown', (e) => { if (!overlay.hidden && e.key === 'Escape') { closeHelp(); return; } if (!overlay.hidden || e.target.tagName === 'SELECT') return; if (/^[1-9]$/.test(e.key)) input(Number(e.key)); else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); input(0); } });
load(); if (!data.seen) showHelp();
