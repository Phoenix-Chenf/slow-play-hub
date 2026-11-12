import { PUZZLES } from './puzzles.mjs?v=2';
import { EASIER_PUZZLES } from './easier-puzzles.mjs?v=20261112';
import { V3_PUZZLES } from './puzzles-v3.mjs?v=20261112-v3';
export const MODES = { easy: '轻松', normal: '进阶', hard: '挑战' };
export const LEVEL_COUNT = 30;
export function canPlace(grid, i, n) {
  const row = Math.floor(i / 9), col = i % 9;
  for (let k = 0; k < 9; k++) {
    const box = (Math.floor(row / 3) * 3 + Math.floor(k / 3)) * 9 + Math.floor(col / 3) * 3 + k % 3;
    for (const j of [row * 9 + k, k * 9 + col, box]) if (j !== i && grid[j] === n) return false;
  }
  return true;
}
function solve(input, limit = 2) {
  const grid = input.slice(); let count = 0, solution = null;
  for (let i = 0; i < 81; i++) if (grid[i] && !canPlace(grid, i, grid[i])) return { count: 0, solution: null };
  function search() {
    if (count >= limit) return;
    let pos = -1, options = null;
    for (let i = 0; i < 81; i++) if (!grid[i]) {
      const c = []; for (let n = 1; n <= 9; n++) if (canPlace(grid, i, n)) c.push(n);
      if (!c.length) return;
      if (!options || c.length < options.length) { pos = i; options = c; if (c.length === 1) break; }
    }
    if (pos < 0) { count++; if (!solution) solution = grid.slice(); return; }
    for (const n of options) { grid[pos] = n; search(); grid[pos] = 0; if (count >= limit) break; }
  }
  search(); return { count, solution };
}
export function countSolutions(grid, limit = 2) { return solve(grid, limit).count; }
export function createPuzzle(mode, level, edition = 'v3') {
  if (!Object.hasOwn(PUZZLES, mode) || !Number.isInteger(level) || level < 1 || level > LEVEL_COUNT) throw new RangeError('invalid puzzle');
  if (!['legacy', 'easier', 'v3'].includes(edition)) throw new RangeError('invalid edition');
  const puzzle = Array.from((edition === 'legacy' ? PUZZLES : edition === 'easier' ? EASIER_PUZZLES : V3_PUZZLES)[mode][level - 1], Number);
  return { puzzle, solution: solve(puzzle, 1).solution };
}
export function place(given, values, index, n) {
  if (!Number.isInteger(index) || index < 0 || index >= 81 || given[index] || !Number.isInteger(n) || n < 0 || n > 9) return null;
  const next = values.slice(); next[index] = n; return next;
}
export function finished(values) { return values.length === 81 && values.every((n, i) => n >= 1 && n <= 9 && canPlace(values, i, n)); }
