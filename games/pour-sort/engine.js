(function () {
  'use strict';

  const capacity = 4;
  const colors = [
    { name: '柚橙', icon: '●', light: '#ffac58', deep: '#db6234' },
    { name: '梅紫', icon: '◆', light: '#ae95df', deep: '#6d4fae' },
    { name: '薄荷', icon: '✦', light: '#77d9b6', deep: '#21947e' },
    { name: '海蓝', icon: '■', light: '#8cb7fb', deep: '#395ab5' },
    { name: '杏金', icon: '▲', light: '#ffde7b', deep: '#cc8a2f' },
    { name: '莓红', icon: '✿', light: '#f48b9c', deep: '#c34262' },
    { name: '松绿', icon: '✚', light: '#92ba72', deep: '#507542' },
    { name: '藕粉', icon: '♥', light: '#f5bdde', deep: '#a86395' },
    { name: '湖青', icon: '⬟', light: '#8bdde8', deep: '#30849a' },
    { name: '蜜棕', icon: '⬢', light: '#d3aa85', deep: '#835850' },
    { name: '青柠', icon: '⌁', light: '#d1df7d', deep: '#738d33' },
    { name: '霞红', icon: '☀', light: '#fa9479', deep: '#b5333c' },
  ];

  const layouts = [
    ['初次分杯', false, [[0, 0, 1, 1], [1, 1, 0, 0]]],
    ['三色试饮', false, [[1, 2, 1, 2], [1, 0, 0, 2], [0, 0, 1, 2]]],
    ['玻璃架', false, [[2, 1, 1, 0], [0, 2, 1, 0], [2, 1, 2, 3], [0, 3, 3, 3]]],
    ['雾里青梅', true, [[2, 1, 3, 0], [2, 0, 3, 0], [1, 0, 1, 1], [3, 3, 2, 2]]],
    ['一瓶藏一味', true, [[4, 0, 2, 3], [0, 4, 3, 0], [2, 4, 2, 2], [0, 1, 3, 1], [1, 1, 4, 3]]],
    ['见底才知', true, [[2, 5, 3, 4], [3, 0, 0, 1], [0, 4, 0, 3], [1, 5, 5, 1], [2, 1, 5, 4], [3, 2, 2, 4]]],
    ['晚风调饮', true, [[3, 1, 6, 6], [0, 2, 6, 4], [5, 5, 6, 3], [2, 0, 3, 2], [2, 5, 5, 0], [1, 4, 3, 1], [4, 0, 1, 4]]],
    ['夜色满柜', true, [[7, 6, 2, 7], [0, 1, 0, 0], [4, 5, 1, 1], [1, 5, 3, 6], [0, 5, 3, 6], [7, 5, 6, 2], [3, 4, 3, 7], [4, 2, 4, 2]]],
  ];
  const original = layouts.map(([name, fog, fullBottles]) => ({
    name, fog, bottles: [...fullBottles, [], []], capacity, goals: {},
  }));

  function parseLevel([name, rows, recipe = ''], fog) {
    const bottles = rows.split(' ').map(row => Array.from(row, color => parseInt(color, 36)));
    const goals = {};
    if (recipe) {
      recipe.split(' ').forEach(([index, color]) => { goals[parseInt(index, 36)] = parseInt(color, 36); });
    }
    return { name, fog, bottles: [...bottles, [], []], capacity, goals };
  }

  // Each four-character group lists a bottle from bottom to top. A recipe
  // marker (such as 'a5') identifies the required bottle and its color.
  const campaign = {
    classic: [
      ['初见果香', '1100 1100'],
      ['三味上桌', '1022 0020 2111'],
      ['清晨试饮', '1200 0122 0121'],
      ['窗边四味', '0111 0332 2213 2030'],
      ['架上果瓶', '2102 3300 2031 3121'],
      ['倒成一排', '2233 1130 0221 3001'],
      ['五色小站', '3301 3011 4014 2034 2224'],
      ['瓶口交错', '2304 3112 4120 1304 3042'],
      ['果香小巷', '1124 1304 0040 2342 2313'],
      ['青瓷一柜', '1431 0301 2243 2324 4001'],
      ['午后的六味', '4150 0205 3215 0432 5231 4134'],
      ['暖阳玻璃', '4053 3451 5202 2040 1353 1421'],
      ['循色摆瓶', '2012 3030 4524 5532 4015 1413'],
      ['柜台换班', '2343 0610 5652 4315 3026 2451 4160'],
      ['七色果园', '0316 0265 0313 2454 4025 5631 1264'],
      ['玻璃小径', '1525 6451 2514 0204 3036 1663 0432'],
      ['饮品方阵', '6352 3104 3250 1246 0236 0416 5451'],
      ['八色长桌', '4753 2057 2012 3450 1567 4126 6140 3673'],
      ['谷雨拼色', '2370 0536 7542 6704 2467 6341 1510 5132'],
      ['杯边等候', '2305 3153 2326 1760 0747 6517 2405 4146'],
      ['转角甜香', '4713 2536 5106 7405 2465 3071 7214 0236'],
      ['九色仓房', '0876 3454 3401 0673 8528 7518 1602 2375 6142'],
      ['一柜日光', '2526 5875 8721 4318 4013 0307 6356 8441 6072'],
      ['果汁午市', '4172 4824 0487 0821 1350 0653 3586 6237 1576'],
      ['十味全开', '6386 7820 2629 5740 4183 9349 7102 5451 7106 8935'],
      ['玻璃回廊', '6803 7618 9231 9217 4505 5306 7492 6103 4542 7898'],
      ['桌上彩虹', '6709 0698 7634 7345 2819 4031 2475 8610 9385 2152'],
      ['十一味集市', '68a7 6994 a673 5a10 8127 5206 5904 4428 3a01 9712 5383'],
      ['清透深处', '4743 252a 1501 7398 7839 060a 3462 91a6 6815 8972 540a'],
      ['满柜果香', 'ba70 337b 446a 2398 a469 2308 495a 085b 60b7 5171 6152 2918'],
    ],
    mystery: [
      ['雾中来客', '1741 0356 0432 7613 1627 2702 5306 4554'],
      ['隔瓶听雨', '4267 2647 0143 1563 0725 1450 3270 3156'],
      ['暗色杯沿', '0171 3742 3174 2663 4561 2567 5030 4250'],
      ['看见第一层', '6033 4022 5210 6761 5551 0213 4774 6437'],
      ['晨雾长架', '7172 5762 2530 5446 0533 1410 0312 7466'],
      ['云下八味', '5343 7112 7732 1650 6446 2100 0742 3655'],
      ['窗雾成纹', '1437 2401 6312 2400 6407 6726 5355 7351'],
      ['九瓶藏味', '0357 0685 3246 4318 2177 6041 2650 7428 5381'],
      ['颜色不说话', '6555 0466 3781 8275 1840 2321 0164 3307 4827'],
      ['试味之间', '1088 1528 2376 8070 6734 3416 2623 4551 7540'],
      ['雾后玻璃', '5423 2572 1615 6508 3766 4320 7884 1341 0708'],
      ['瓶中线索', '8404 5575 6421 2637 4082 8206 1713 5731 0638'],
      ['傍晚九味', '7243 8660 1373 3078 5482 0154 1726 4801 5625'],
      ['十色藏一柜', '3981 2509 7510 8794 0491 3560 4372 4662 8358 6721'],
      ['倒影相叠', '7805 9909 0736 4162 7173 4183 1282 5255 4698 4306'],
      ['雾色斑驳', '8715 1837 8120 7123 9365 8043 4629 6995 5074 4602'],
      ['十一味上桌', '30a4 978a 2a63 866a 5959 2193 7167 0421 1035 2470 8548'],
      ['巷口夜雾', '5774 23a8 0661 a981 7744 0325 6492 5158 a233 a019 9806'],
      ['深柜的秘密', '0467 9882 3584 6155 0027 2930 9a71 6243 4aa1 98a6 5317'],
      ['灯下十二色', 'b7bb 0670 0265 45b3 8a97 1a32 4956 86a1 9489 51a7 3123 2084'],
      ['雾散前一刻', '1718 2046 9873 5b45 3181 b567 4023 a0a9 625a b387 029b a469'],
      ['辨尽瓶底', '484b b957 7195 122b 5132 8584 4013 2669 83a3 7a76 0a69 b00a'],
    ],
    recipe: [
      ['第一张签', '0001 1110', '00'],
      ['三味订单', '2101 2102 0012', '12'],
      ['三味交接', '2211 1012 0020', '11'],
      ['四味装瓶', '1120 3200 0311 2323', '32'],
      ['标签朝前', '0332 1020 1103 2123', '32'],
      ['换一只瓶', '1021 0212 2033 0331', '22'],
      ['一签五味', '0103 1240 3234 1402 1423', '41'],
      ['两签见面', '1042 4402 0241 3102 3331', '01 33'],
      ['双签对照', '4342 0320 3310 4121 0412', '10 23'],
      ['五果送达', '1431 0233 4320 1224 0401', '24 40'],
      ['等待交杯', '0234 5253 0130 5212 4404 3151', '21 53'],
      ['签贴两边', '4301 3512 5032 5230 4415 0124', '35 50'],
      ['顺着标签', '4555 0432 2133 2104 4131 2500', '11 52'],
      ['七味清单', '4342 5206 1023 6515 1135 4660 3024', '00 21'],
      ['瓶口签名', '2354 2265 6106 3140 5036 1125 4403', '26 51'],
      ['记住位置', '6314 6122 5313 0042 5261 0445 0635', '44 60'],
      ['七色出单', '1154 3060 3546 5115 6242 6330 4220', '23 46'],
      ['八味排签', '7763 6225 4364 0211 0500 5467 4521 1733', '07 71'],
      ['三签新客', '1124 0314 1527 5076 3665 3364 7040 2275', '10 43 67'],
      ['三签交错', '1402 3623 6675 0456 1335 7104 2770 1245', '01 30 57'],
      ['八色配好', '2056 2201 6133 7401 5567 0741 5644 3372', '14 37 50'],
      ['签上有约', '1066 0578 3243 8184 3674 2540 8265 2315 0771', '43 67 80'],
      ['九味分配', '5287 8653 7382 4600 6062 5345 1028 4134 7711', '46 50 74'],
      ['标签不乱', '4878 7551 8606 3712 0124 3516 8300 2246 5347', '17 33 85'],
      ['十味配方', '9614 9844 3943 1023 0850 6101 9758 5235 2627 8776', '17 69 98'],
      ['四签登场', '4692 9582 3370 0882 5446 1937 1270 0156 8731 9465', '23 37 61 88'],
      ['四签分桌', '5446 9291 3527 8816 4057 8743 1098 0032 5173 2669', '19 61 70 85'],
      ['十一味上架', 'a812 6a04 9343 7098 2424 7175 52a6 3396 7680 5901 5a18', '16 57 9a a5'],
      ['临窗四签', '5a03 2257 9770 29aa 6894 0510 1383 6914 6a34 8165 4278', '2a 61 86 98'],
      ['满架配方', '1841 708b 659b 3344 9905 3576 326a 0aab 27ba 6745 9028 8112', '44 57 63 96'],
    ],
  };

  const modes = {
    classic: {
      name: '经典整理',
      description: '看清每一层，把同色果饮倒在一起。',
      levels: campaign.classic.map(level => parseLevel(level, false)),
    },
    mystery: {
      name: '迷雾揭晓',
      description: '从第 4 关起，倒开上层才知道下面的颜色。',
      levels: [...original, ...campaign.mystery.map(level => parseLevel(level, true))],
    },
    recipe: {
      name: '定向装瓶',
      description: '查看瓶上的标签，最后把指定颜色装满对应的瓶子。',
      levels: campaign.recipe.map(level => parseLevel(level, false)),
    },
  };
  const levels = modes.mystery.levels;

  function create(levelIndex, mode = 'mystery') {
    const level = modes[mode]?.levels[levelIndex];
    if (!level) throw new RangeError('未知关卡');
    return {
      bottles: level.bottles.map(bottle => bottle.slice()),
      revealed: level.bottles.map(bottle => bottle.map((_, index) => !level.fog || index === bottle.length - 1)),
      goals: { ...level.goals },
      moves: 0,
      extra: 0,
    };
  }

  function isCompleteBottle(bottle) {
    return bottle.length === capacity && bottle.every(color => color === bottle[0]);
  }

  function isSolved(state) {
    return state.bottles.every((bottle, index) => {
      const goal = state.goals?.[index];
      if (goal !== undefined) return isCompleteBottle(bottle) && bottle[0] === goal;
      return bottle.length === 0 || isCompleteBottle(bottle);
    });
  }

  function top(bottle) {
    return bottle[bottle.length - 1];
  }

  function visibleRun(bottle, known) {
    const color = top(bottle);
    let count = 0;
    for (let index = bottle.length - 1; index >= 0; index--) {
      if ((known && !known[index]) || bottle[index] !== color) break;
      count++;
    }
    return count;
  }

  function pour(state, from, to) {
    const source = state.bottles[from];
    const destination = state.bottles[to];
    if (!source || !destination) return { ok: false, reason: 'missing' };
    if (from === to) return { ok: false, reason: 'same' };
    if (!source.length) return { ok: false, reason: 'empty' };
    if (destination.length === capacity) return { ok: false, reason: 'full' };

    const color = top(source);
    if (destination.length && top(destination) !== color) return { ok: false, reason: 'color' };
    const amount = Math.min(visibleRun(source, state.revealed[from]), capacity - destination.length);
    if (!amount) return { ok: false, reason: 'empty' };

    const split = source.length - amount;
    const bottles = state.bottles.slice();
    const revealed = state.revealed.slice();
    bottles[from] = source.slice(0, split);
    bottles[to] = destination.concat(source.slice(split));
    revealed[from] = state.revealed[from].slice(0, split);
    revealed[to] = state.revealed[to].concat(state.revealed[from].slice(split));
    if (split) revealed[from][split - 1] = true;

    const completed = isCompleteBottle(bottles[to]);
    if (completed) revealed[to].fill(true);
    const next = { ...state, bottles, revealed, moves: state.moves + 1 };
    return { ok: true, state: next, amount, color, completed, won: isSolved(next) };
  }

  function addBottle(state) {
    return {
      ...state,
      bottles: [...state.bottles, []],
      revealed: [...state.revealed, []],
      extra: state.extra + 1,
    };
  }

  // Mask every unrevealed layer before looking for a suggestion. Hidden colors
  // can be used by the game rules after a pour, but cannot affect the hint.
  function publicBoard(state) {
    return state.bottles.map((bottle, index) => bottle.map((color, layer) =>
      state.revealed[index][layer] ? color : -1));
  }

  function isPublicComplete(bottle) {
    return bottle[0] >= 0 && isCompleteBottle(bottle);
  }

  function candidateMoves(board, goals) {
    const candidates = [];
    for (let from = 0; from < board.length; from++) {
      const source = board[from];
      if (!source.length) continue;
      const color = top(source);
      if (color < 0) continue;
      const sourceGoal = goals[from];
      if (isPublicComplete(source) && sourceGoal === color) continue;
      const run = visibleRun(source);
      const destinations = new Set();
      for (let to = 0; to < board.length; to++) {
        const target = board[to];
        const targetGoal = goals[to];
        if (to === from || target.length === capacity) continue;
        if (target.length && top(target) !== color) continue;
        // Moving an entire single-color bottle to an equivalent empty bottle
        // changes the positions, but cannot help progress toward a solution.
        if (!target.length && run === source.length && sourceGoal === targetGoal) continue;
        const key = `${targetGoal ?? '_'}:${target.join(',')}`;
        if (destinations.has(key)) continue;
        destinations.add(key);

        const count = Math.min(run, capacity - target.length);
        const remainder = source.length - count;
        const exposesUnknown = remainder > 0 && source[remainder - 1] === -1;
        const finishesColor = target.length + count === capacity && target.every(unit => unit === color);
        let score = count * 2 + (target.length ? 45 : 0) + (remainder ? 0 : 32)
          + (exposesUnknown ? 25 : 0) + (finishesColor ? 90 : 0);
        if (targetGoal === color) score += 45;
        else if (targetGoal !== undefined) score -= 40;
        if (sourceGoal !== undefined && sourceGoal !== color) score += 26;
        candidates.push({ from, to, count, score });
      }
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  function visibleSolution(board, opening, goals) {
    const visited = new Set();
    const budget = Object.keys(goals).length ? 2800 : 900;
    let states = 0;
    function solve(current, depth) {
      if (current.every((bottle, index) => {
        const goal = goals[index];
        if (goal !== undefined) return isPublicComplete(bottle) && bottle[0] === goal;
        return !bottle.length || isPublicComplete(bottle);
      })) return true;
      if (++states > budget || depth > 65) return false;
      const key = current.map((bottle, index) => `${goals[index] ?? '_'}:${bottle.join(',')}`).sort().join('|');
      if (visited.has(key)) return false;
      visited.add(key);
      return candidateMoves(current, goals).some(move => solve(projectMove(current, move), depth + 1));
    }
    return opening.find(move => solve(projectMove(board, move), 1)) || null;
  }

  function projectMove(board, { from, to, count }) {
    const result = board.slice();
    result[from] = board[from].slice(0, -count);
    result[to] = board[to].concat(board[from].slice(-count));
    return result;
  }

  function boardKey(board) {
    return board.map(bottle => bottle.join(',')).join('|');
  }

  function avoidRepeats(board, moves, history) {
    if (!history.length) return moves;
    const prior = new Set(history.map(previous => boardKey(publicBoard(previous))));
    return moves.filter(move => {
      const projected = projectMove(board, move);
      // An exposed question mark will gain information, regardless of its
      // color. Do not guess what that layer will become.
      if (top(projected[move.from]) === -1) return true;
      return !prior.has(boardKey(projected));
    });
  }

  function hint(state, history = []) {
    const board = publicBoard(state);
    const goals = state.goals || {};
    const moves = avoidRepeats(board, candidateMoves(board, goals), history);
    if (!moves.length) return null;
    const fog = board.some(bottle => bottle.includes(-1));
    const move = fog ? moves[0] : visibleSolution(board, moves, goals) || moves[0];
    return { from: move.from, to: move.to };
  }

  globalThis.PourGame = { colors, levels, modes, create, pour, addBottle, isSolved, isCompleteBottle, hint };
})();
