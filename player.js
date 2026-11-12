const games = {
  clear: ['空一点', 'games/clear-a-little/index.html'],
  nut: ['理一理', 'games/nut-sort/index.html'],
  layer: ['一层层', 'games/one-layer/index.html?v=20261111-guide'],
  connect: ['接上啦', 'games/connect-it/index.html'],
  fit: ['放得下', 'games/fit-it/index.html?v=20261112-hint'],
  traffic: ['让一让', 'games/let-it-pass/index.html'],
  garden: ['一笔游园', 'games/one-stroke-garden/index.html?v=2'],
  sudoku: ['慢慢数独', 'games/sudoku/index.html?v=20261112-v3']
};
const item = games[new URLSearchParams(location.search).get('game')];
const frame = document.getElementById('game');
if (item) {
  document.getElementById('game-name').textContent = item[0];
  document.title = item[0] + ' · 慢慢玩';
  frame.title = item[0];
  frame.src = item[1];
} else {
  frame.hidden = true;
  document.getElementById('frame-error').hidden = false;
}
