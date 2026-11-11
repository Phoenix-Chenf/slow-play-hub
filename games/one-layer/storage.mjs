export const OLD_KEY = 'one-layer-preview-v1';
export const KEY = 'one-layer-preview-v2';
export const MODES = ['classic', 'mystery', 'keys'];

const EARLY_TILE_COUNTS = [9, 12, 15, 21, 24, 30, 36, 45];
function tileCount(level) {
  return level <= 8 ? EARLY_TILE_COUNTS[level - 1] : 45 + 3 * Math.floor((level - 8) * 0.8);
}
function validSnapshot(value, level) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.remaining) || !Array.isArray(value.tray)) return false;
  if (!Number.isSafeInteger(value.capacity) || value.capacity < 5 || !Number.isSafeInteger(value.extra) || value.extra < 0 || value.capacity !== value.extra + 5 || !Number.isSafeInteger(value.moves) || value.moves < 0) return false;
  const count = tileCount(level);
  return value.remaining.length <= count && new Set(value.remaining).size === value.remaining.length &&
    value.remaining.every(id => Number.isInteger(id) && id >= 0 && id < count) &&
    value.tray.length <= Math.min(value.capacity, count - value.remaining.length) &&
    value.tray.every(kind => Number.isInteger(kind) && kind >= 0 && kind < 12 && value.tray.filter(k => k === kind).length <= 2);
}
function restoreState(value, level) {
  if (!validSnapshot(value, level)) return null;
  let previousMoves = -1;
  const history = Array.isArray(value.history) && value.history.every(entry => {
    // Adding a slot records an undo snapshot without incrementing moves.
    if (!validSnapshot(entry, level) || entry.moves < previousMoves || entry.moves > value.moves) return false;
    previousMoves = entry.moves;
    return true;
  }) ? value.history : [];
  return {...value, history};
}
function validLevel(n) { return Number.isInteger(n) && n >= 1 && n <= 30; }
function blank() { return { version: 2, mode: 'classic', levels: {classic: 1, mystery: 1, keys: 1}, progress: {classic: {}, mystery: {}, keys: {}} }; }

// Do not remove the old key: users can still return to the original eight-level build.
export function readProgress(storage, onUnavailable = () => {}) {
  const data = blank();
  let parsed;
  let raw;
  try { raw = storage.getItem(KEY); } catch { onUnavailable(); }
  try { parsed = JSON.parse(raw); } catch {}
  if (parsed && parsed.version === 2) {
    if (MODES.includes(parsed.mode)) data.mode = parsed.mode;
    for (const mode of MODES) {
      const n = parsed.levels?.[mode];
      if (validLevel(n)) data.levels[mode] = n;
      const bucket = parsed.progress?.[mode];
      if (bucket && typeof bucket === 'object') {
        for (const [key, state] of Object.entries(bucket)) {
          const level = Number(key);
          if (!validLevel(level)) continue;
          const restored = restoreState(state, level);
          if (restored) data.progress[mode][key] = restored;
        }
      }
    }
    return data;
  }
  try { raw = storage.getItem(OLD_KEY); } catch { onUnavailable(); raw = null; }
  try { parsed = JSON.parse(raw); } catch { parsed = null; }
  if (!parsed || typeof parsed !== 'object') return data;
  const index = parsed.index;
  if (validLevel(index) && index <= 8) data.levels.classic = index;
  if (parsed.progress && typeof parsed.progress === 'object') {
    for (const [key, state] of Object.entries(parsed.progress)) {
      const n = Number(key);
      const restored = validLevel(n) && n <= 8 ? restoreState(state, n) : null;
      if (restored) data.progress.classic[n] = restored;
    }
  }
  const restored = validLevel(index) && index <= 8 ? restoreState(parsed.state, index) : null;
  if (restored) data.progress.classic[index] = restored;
  return data;
}

export function writeProgress(storage, data) {
  storage.setItem(KEY, JSON.stringify(data));
}
