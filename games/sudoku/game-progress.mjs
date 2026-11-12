import { createPuzzle } from './engine.mjs?v=20261112-v3';

const editions = new Set(['legacy', 'easier', 'v3']);

// Older saves do not carry an edition. Their board and every undo snapshot
// must continue to be interpreted against the original puzzle.
export function restoreGame(mode, level, saved) {
  const exists = !!saved && typeof saved === 'object';
  const edition = exists ? (editions.has(saved.edition) ? saved.edition : 'legacy') : 'v3';
  const puzzles = {};
  const puzzleFor = version => puzzles[version] ??= createPuzzle(mode, level, version).puzzle;
  const valid = (values, version) => Array.isArray(values) && values.length === 81 && values.every((n, i) => Number.isInteger(n) && n >= 0 && n <= 9 && (!puzzleFor(version)[i] || puzzleFor(version)[i] === n));
  const values = valid(saved?.values, edition) ? saved.values.slice() : puzzleFor(edition).slice();
  const history = [];
  if (Array.isArray(saved?.history)) for (const item of saved.history) {
    const version = Array.isArray(item) ? edition : item?.edition;
    const board = Array.isArray(item) ? item : item?.values;
    if (editions.has(version) && valid(board, version)) history.push({ edition: version, values: board.slice() });
  }
  return { edition, values, history };
}

export function recordGame(state) {
  return { edition: state.edition, values: state.values.slice(), history: [...state.history, { edition: state.edition, values: state.values.slice() }] };
}

export function resetGame(mode, level, state) {
  const next = recordGame(state);
  next.edition = 'v3';
  next.values = createPuzzle(mode, level, 'v3').puzzle;
  return next;
}

export function undoGame(state) {
  if (!state.history.length) return null;
  const previous = state.history[state.history.length - 1];
  return { edition: previous.edition, values: previous.values.slice(), history: state.history.slice(0, -1) };
}
