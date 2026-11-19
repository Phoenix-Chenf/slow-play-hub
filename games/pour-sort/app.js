(() => {
  'use strict';

  const game = globalThis.PourGame;
  const $ = (id) => document.getElementById(id);
  const key = 'pour-sort-progress-v1';
  const modes = Object.keys(game.modes);
  const buttons = document.querySelectorAll('[data-mode]');
  const shell = document.querySelector('.shell');
  const board = $('board');
  const levelDialog = $('levels-dialog');
  const helpDialog = $('help-dialog');
  const winDialog = $('win-dialog');
  const openers = new Map();
  const levelsPerGroup = 20;
  const messages = {
    color: '顶层颜色不一样。试试同色的瓶子，或找一个空瓶。',
    full: '这个瓶子已经满了。',
    empty: '先选一个装有果饮的瓶子。',
    same: '再点另一个瓶子作为落点。',
    missing: '请重新选择瓶子。'
  };

  function colorUnits(bottles) {
    return bottles.flat().slice().sort((a, b) => a - b).join(',');
  }

  const inventories = Object.fromEntries(modes.map((mode) => [mode, game.modes[mode].levels.map((level) => colorUnits(level.bottles))]));

  function validState(value, mode, index) {
    if (!value || !Number.isInteger(value.moves) || value.moves < 0 ||
        !Number.isInteger(value.extra) || value.extra < 0) return false;
    const { bottles, revealed } = value;
    const level = game.modes[mode].levels[index];
    return Array.isArray(bottles) && Array.isArray(revealed) &&
      bottles.length === level.bottles.length + value.extra && bottles.length === revealed.length &&
      bottles.every((bottle, i) => Array.isArray(bottle) && bottle.length <= level.capacity &&
        bottle.every((color) => Number.isInteger(color) && Boolean(game.colors[color])) &&
        Array.isArray(revealed[i]) && revealed[i].length === bottle.length &&
        revealed[i].every((cell) => typeof cell === 'boolean') &&
        (!bottle.length || revealed[i][bottle.length - 1])) &&
      colorUnits(bottles) === inventories[mode][index];
  }

  let storageOK = true;
  function readMode(data, mode) {
    const levels = game.modes[mode].levels;
    const index = Number.isInteger(data?.index) && levels[data.index] ? data.index : 0;
    const entry = { index, runs: {}, finished: {} };
    for (let i = 0; i < levels.length; i += 1) {
      const run = data?.runs?.[i];
      if (validState(run?.state, mode, i) && (run.state.moves > 0 || run.state.extra > 0 || run.history?.length)) {
        const goals = levels[i].goals || {};
        entry.runs[i] = {
          state: { ...run.state, goals },
          history: Array.isArray(run.history) && run.history.every((s) => validState(s, mode, i))
            ? run.history.map((state) => ({ ...state, goals })) : []
        };
      }
      const best = data?.finished?.[i];
      if (Number.isInteger(best) && best > 0) entry.finished[i] = best;
    }
    return entry;
  }

  function readProgress() {
    const blank = { version: 2, mode: 'classic', modes: Object.fromEntries(modes.map((mode) => [mode, readMode(null, mode)])) };
    try {
      const data = JSON.parse(window.localStorage.getItem(key));
      if (data?.version === 1) {
        blank.modes.mystery = readMode(data, 'mystery');
        blank.mode = 'mystery';
      } else if (data?.version === 2) {
        if (modes.includes(data.mode)) blank.mode = data.mode;
        for (const mode of modes) blank.modes[mode] = readMode(data.modes?.[mode], mode);
      }
    } catch (error) {
      if (!(error instanceof SyntaxError)) storageOK = false;
    }
    return blank;
  }

  const progress = readProgress();
  let mode = progress.mode;
  let active = progress.modes[mode];
  let index = active.index;
  let run = active.runs[index] || { state: game.create(index, mode), history: [] };
  let selected = null;
  let highlighted = null;
  let activePour = null;

  function save() {
    progress.mode = mode;
    active.index = index;
    active.runs[index] = run;
    try {
      window.localStorage.setItem(key, JSON.stringify(progress));
    } catch {
      storageOK = false;
    }
  }

  function saveInterruptedPour() {
    if (activePour) save();
  }
  window.addEventListener('pagehide', saveInterruptedPour);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveInterruptedPour();
  });

  function announce(text, tone = 'normal') {
    const notice = $('notice');
    notice.dataset.tone = tone;
    notice.textContent = storageOK ? text : `${text}　当前浏览器无法保存进度。`;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function highlightBottle(button, i) {
    button.classList.toggle('is-selected', i === selected);
    button.classList.toggle('is-source-hint', i === highlighted?.from);
    button.classList.toggle('is-target-hint', i === highlighted?.to);
    const hint = i === highlighted?.from ? '，提示起点' : i === highlighted?.to ? '，提示落点' : '';
    button.setAttribute('aria-pressed', String(i === selected));
    button.setAttribute('aria-label', button.dataset.label + hint);
  }

  function updateHighlights() {
    for (const button of board.children) highlightBottle(button, Number(button.dataset.bottle));
  }

  function bottleButton(bottle, i) {
    const button = el('button', 'bottle');
    button.type = 'button';
    button.dataset.bottle = String(i);
    const complete = game.isCompleteBottle(bottle);
    const goal = game.colors[run.state.goals?.[i]];
    const ready = complete && (!goal || bottle[0] === run.state.goals[i]);
    button.classList.toggle('is-complete', ready);
    if (goal) {
      button.classList.add('has-goal');
      button.classList.toggle('is-goal-ready', ready);
      button.style.setProperty('--goal-color', goal.light);
    }
    const labels = [];
    const vessel = el('span', 'vessel');
    vessel.setAttribute('aria-hidden', 'true');
    vessel.appendChild(el('span', 'glass-mouth'));
    const body = el('span', 'glass-body');
    for (let j = game.modes[mode].levels[index].capacity - 1; j >= 0; j -= 1) {
      const layer = el('span', 'liquid');
      if (j >= bottle.length) {
        layer.classList.add('is-empty');
      } else if (!run.state.revealed[i][j]) {
        layer.classList.add('is-hidden');
        layer.appendChild(el('span', 'liquid-symbol', '?'));
        labels.push('未知');
      } else {
        const color = game.colors[bottle[j]];
        layer.style.setProperty('--liquid-light', color.light);
        layer.style.setProperty('--liquid-deep', color.deep);
        if (j === bottle.length - 1) layer.classList.add('is-surface');
        if (j > 0 && run.state.revealed[i][j - 1] && bottle[j - 1] === bottle[j]) layer.classList.add('is-connected-below');
        layer.appendChild(el('span', 'liquid-symbol', color.icon));
        labels.push(color.name);
      }
      body.appendChild(layer);
    }
    const detail = labels.length ? `从上到下：${labels.join('、')}` : '空瓶';
    button.dataset.label = `${i + 1} 号瓶，${detail}${goal ? `，目标${goal.name}` : ''}${ready ? '，已装好' : ''}`;
    highlightBottle(button, i);
    vessel.appendChild(body);
    button.append(vessel, el('span', 'bottle-number', `${String(i + 1).padStart(2, '0')}${ready ? ' ✓' : ''}`));
    if (goal) button.append(el('span', 'bottle-goal', goal.name));
    return button;
  }

  function findBottle(i) {
    return board.querySelector(`[data-bottle="${i}"]`);
  }

  function renderCounts() {
    const level = game.modes[mode].levels[index];
    const { bottles, moves } = run.state;
    $('moves').textContent = `${moves} 步`;
    const sorted = bottles.filter((bottle, i) => {
      const goal = run.state.goals?.[i];
      return game.isCompleteBottle(bottle) && (goal == null || bottle[0] === goal);
    }).length;
    $('progress').textContent = `${sorted} / ${new Set(level.bottles.flat()).size} 瓶完成`;
    $('undo').disabled = run.history.length === 0;
    const solved = game.isSolved(run.state);
    $('hint').disabled = solved;
    $('add').disabled = solved;
  }

  function render() {
    const currentMode = game.modes[mode];
    const level = currentMode.levels[index];
    const { bottles } = run.state;
    const levelLabel = `第 ${index + 1} / ${currentMode.levels.length} 关`;
    $('level-label').textContent = levelLabel;
    $('level-button').setAttribute('aria-label', `选择关卡，当前${levelLabel}`);
    $('mode-description').textContent = currentMode.description;
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    $('level-name').textContent = level.fog ? `${level.name} · 迷雾` : level.name;
    board.classList.toggle('is-recipe', mode === 'recipe');
    shell.classList.toggle('has-dense-board', bottles.length >= 16);
    board.classList.toggle('is-extra-dense', bottles.length >= 22);
    board.style.setProperty('--columns', bottles.length <= 4 ? bottles.length : bottles.length === 6 ? 3 : bottles.length <= 8 ? 4 : 5);

    const nodes = document.createDocumentFragment();
    bottles.forEach((bottle, i) => nodes.appendChild(bottleButton(bottle, i)));
    board.replaceChildren(nodes);
    renderCounts();
  }

  function openDialog(dialog, trigger) {
    if (dialog.open || activePour) return;
    if (trigger) openers.set(dialog, trigger);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      openers.get(dialog)?.focus();
    }
  }

  [levelDialog, helpDialog, winDialog].forEach((dialog) => {
    dialog.addEventListener('close', () => {
      openers.get(dialog)?.focus({ preventScroll: true });
      openers.delete(dialog);
    });
  });

  function selectLevel(i, reset = false) {
    if (activePour) return;
    index = i;
    run = !reset && active.runs[i] ? active.runs[i] : { state: game.create(i, mode), history: [] };
    selected = null;
    highlighted = null;
    save();
    render();
    if (game.isSolved(run.state)) announce('这一关已经分好啦。可以选下一关，或重新整理。', 'success');
    else if (game.modes[mode].levels[i].fog) announce('问号藏着颜色，倒开后就能看见。');
    else if (mode === 'recipe') announce('带标签的瓶子最后要装满对应颜色。');
    else announce('点一只瓶子，再点同色或空瓶。');
  }

  function showWin() {
    const { moves, extra } = run.state;
    $('win-summary').textContent = `本次 ${moves} 步 · 最少 ${active.finished[index]} 步${extra ? ` · 加了 ${extra} 个空瓶` : ''}`;
    const next = $('next');
    next.textContent = index < game.modes[mode].levels.length - 1 ? '下一关' : '选择关卡';
    announce('都分好啦！', 'success');
    openDialog(winDialog, $('level-button'));
  }

  function animatePour(from, to, before, result, callback) {
    const source = findBottle(from);
    const target = findBottle(to);
    const animation = globalThis.PourMotion;
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      board.removeAttribute('aria-busy');
      callback();
    }
    if (!source || !target || !animation) {
      finish();
      return;
    }
    board.setAttribute('aria-busy', 'true');
    try {
      return animation.play({
        source, target, amount: result.amount, color: game.colors[result.color],
        fromBefore: before.bottles[from].length, toBefore: before.bottles[to].length,
        fromAfter: result.state.bottles[from].length, toAfter: result.state.bottles[to].length,
        done: finish
      });
    } catch {
      finish();
    }
  }

  board.addEventListener('click', (event) => {
    const button = event.target.closest('[data-bottle]');
    if (!button || activePour || game.isSolved(run.state)) return;
    const target = Number(button.dataset.bottle);
    const focusIndex = event.detail === 0 ? target : null;
    if (selected === target) {
      selected = null;
      highlighted = null;
      updateHighlights();
      announce('已取消选择。');
      return;
    }
    if (selected === null) {
      if (!run.state.bottles[target].length) {
        announce(messages.empty, 'error');
        return;
      }
      if (highlighted?.from !== target) highlighted = null;
      selected = target;
      updateHighlights();
      announce(`已选 ${target + 1} 号瓶，点同色或空瓶。`);
      return;
    }
    const from = selected;
    const before = run.state;
    const result = game.pour(before, from, target);
    if (!result.ok) {
      announce(messages[result.reason] || messages.missing, 'error');
      return;
    }
    run.history.push(before);
    run.state = result.state;
    const previousBest = active.finished[index];
    if (result.won) {
      const { moves } = run.state;
      active.finished[index] = previousBest ? Math.min(previousBest, moves) : moves;
    }
    selected = null;
    highlighted = null;
    const job = { cancel: null, undo: false };
    activePour = job;
    $('undo').disabled = false;
    job.cancel = animatePour(from, target, before, result, () => {
      activePour = null;
      if (job.undo) {
        if (result.won && previousBest) active.finished[index] = previousBest;
        else if (result.won) delete active.finished[index];
        undoMove();
        return;
      }
      for (const i of [from, target]) findBottle(i).replaceWith(bottleButton(run.state.bottles[i], i));
      updateHighlights();
      renderCounts();
      if (focusIndex !== null) findBottle(focusIndex)?.focus({ preventScroll: true });
      save();
      if (result.won) showWin();
      else if (mode === 'recipe' && run.state.bottles.every((bottle) => !bottle.length || game.isCompleteBottle(bottle))) {
        announce('颜色分好了，再把带标签的瓶子换成对应颜色。');
      }
      else if (result.completed) announce(`${game.colors[result.color].name}装满一瓶啦。`, 'success');
      else announce(`倒入了 ${result.amount} 层${game.colors[result.color].name}。`);
    });
  });

  function undoMove() {
    if (!run.history.length) return;
    run.state = run.history.pop();
    selected = null;
    highlighted = null;
    save();
    render();
    announce('已撤回一步。');
  }

  $('undo').addEventListener('click', () => {
    if (activePour) {
      activePour.undo = true;
      activePour.cancel?.();
    } else undoMove();
  });

  $('hint').addEventListener('click', () => {
    if (activePour || game.isSolved(run.state)) return;
    selected = null;
    highlighted = game.hint(run.state, run.history);
    updateHighlights();
    if (!highlighted) announce('暂时找不到合适的倒法，可以撤回或加一个空瓶。', 'error');
    else announce(`可以试试从 ${highlighted.from + 1} 号瓶倒进 ${highlighted.to + 1} 号瓶。`);
  });

  $('add').addEventListener('click', () => {
    if (activePour || game.isSolved(run.state)) return;
    run.history.push(run.state);
    run.state = game.addBottle(run.state);
    selected = null;
    highlighted = null;
    save();
    render();
    announce(`已加一个空瓶，编号 ${run.state.bottles.length}。`);
  });

  $('reset').addEventListener('click', () => {
    if (!activePour && window.confirm('重新整理这一关？本局进度会清空。')) selectLevel(index, true);
  });

  function showLevelGroup(start) {
    const levels = game.modes[mode].levels;
    const end = Math.min(start + levelsPerGroup, levels.length);
    for (const group of $('level-groups').children) {
      group.setAttribute('aria-pressed', String(Number(group.dataset.start) === start));
    }
    const choices = levels.slice(start, end).map((level, offset) => {
      const i = start + offset;
      const finished = active.finished[i];
      const button = el('button', 'level-option');
      button.type = 'button';
      button.append(el('span', '', String(i + 1)));
      if (finished) {
        const mark = el('span', 'level-done', '✓');
        mark.setAttribute('aria-hidden', 'true');
        button.appendChild(mark);
      }
      if (i === index) button.setAttribute('aria-current', 'true');
      button.setAttribute('aria-label', `第 ${i + 1} 关，${level.name}${level.fog ? '，迷雾' : ''}${finished ? '，已完成' : ''}`);
      button.addEventListener('click', () => {
        closeDialog(levelDialog);
        selectLevel(i);
      });
      return button;
    });
    const list = $('level-list');
    list.setAttribute('aria-label', `第 ${start + 1} 至 ${end} 关`);
    list.replaceChildren(...choices);
  }

  function openLevels() {
    if (activePour || levelDialog.open) return;
    const levels = game.modes[mode].levels;
    const groups = [];
    for (let start = 0; start < levels.length; start += levelsPerGroup) {
      const end = Math.min(start + levelsPerGroup, levels.length);
      const button = el('button', 'level-group', `${start + 1}–${end}`);
      button.type = 'button';
      button.dataset.start = String(start);
      button.setAttribute('aria-label', `第 ${start + 1} 至 ${end} 关`);
      button.addEventListener('click', () => showLevelGroup(start));
      groups.push(button);
    }
    $('level-groups').replaceChildren(...groups);
    showLevelGroup(Math.floor(index / levelsPerGroup) * levelsPerGroup);
    openDialog(levelDialog, $('level-button'));
    levelDialog.scrollTop = 0;
  }

  $('level-button').addEventListener('click', openLevels);
  buttons.forEach((button) => button.addEventListener('click', () => {
    const chosen = button.dataset.mode;
    if (activePour || chosen === mode || !modes.includes(chosen)) return;
    mode = chosen;
    active = progress.modes[mode];
    selectLevel(active.index);
  }));
  $('close-levels').addEventListener('click', () => closeDialog(levelDialog));
  $('help').addEventListener('click', () => openDialog(helpDialog, $('help')));
  $('close-help').addEventListener('click', () => closeDialog(helpDialog));
  $('close-win').addEventListener('click', () => closeDialog(winDialog));
  $('next').addEventListener('click', () => {
    closeDialog(winDialog);
    if (index + 1 < game.modes[mode].levels.length) selectLevel(index + 1);
    else openLevels();
  });

  selectLevel(index);
  try {
    if (!window.localStorage.getItem(`${key}-guide`)) {
      openDialog(helpDialog, $('help'));
      window.localStorage.setItem(`${key}-guide`, '1');
    }
  } catch {
    openDialog(helpDialog, $('help'));
  }
})();
