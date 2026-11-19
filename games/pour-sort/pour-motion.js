(() => {
  'use strict';

  const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  function center(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function cellsIn(vessel) {
    return Array.from(vessel.querySelectorAll('.liquid')).reverse();
  }

  function liquidMetrics(vessel) {
    const body = vessel.querySelector('.glass-body');
    const cells = cellsIn(vessel);
    const top = cells[cells.length - 1].getBoundingClientRect().top;
    const bottom = cells[0].getBoundingClientRect().bottom;
    const left = cells[0].offsetLeft;
    const width = cells[0].offsetWidth;
    const rowHeight = (bottom - top) / cells.length;
    return { body, cells, top, bottom, left, width, rowHeight, floor: cells[0].offsetTop + cells[0].offsetHeight };
  }

  function fillBand(bottle, metrics, before, after, color, clearers) {
    let first = Math.min(before, after);
    const last = Math.max(before, after);
    // Merge the incoming/outgoing water with any visible matching liquid below it.
    // A covered question-mark layer remains untouched until the actual turn finishes.
    while (first > 0) {
      const lower = metrics.cells[first - 1];
      if (lower.classList.contains('is-hidden') || lower.style.getPropertyValue('--liquid-deep') !== color.deep) break;
      first -= 1;
    }
    const body = bottle.querySelector('.glass-body');
    const covered = cellsIn(bottle).slice(first, last);
    covered.forEach((cell) => cell.classList.add('pour-motion-replaced'));

    const holder = document.createElement('span');
    holder.className = 'pour-motion-fill';
    holder.style.left = `${metrics.left}px`;
    holder.style.width = `${metrics.width}px`;
    holder.style.top = `${metrics.floor - first * metrics.rowHeight}px`;
    holder.style.setProperty('--pour-light', color.light);
    holder.style.setProperty('--pour-deep', color.deep);
    const column = document.createElement('span');
    column.className = 'pour-motion-column';
    column.style.height = `${(last - first) * metrics.rowHeight}px`;
    const surface = document.createElement('span');
    surface.className = 'pour-motion-meniscus';
    holder.append(column, surface);
    body.appendChild(holder);
    clearers.push(() => {
      holder.remove();
      covered.forEach((cell) => cell.classList.remove('pour-motion-replaced'));
    });

    return (units) => {
      const amount = Math.max(0, units - first);
      const level = amount * metrics.rowHeight;
      column.style.transform = `scaleY(${(amount / (last - first)).toFixed(3)})`;
      surface.style.transform = `translate3d(0, ${(-level + 0.5).toFixed(2)}px, 0)`;
      surface.style.opacity = String(clamp(level / 3));
    };
  }

  function makeStream(outlet, mouth, floor, direction, color) {
    const x = Math.min(outlet.x, mouth.x) - 12;
    const y = outlet.y - 9;
    const width = Math.ceil(Math.abs(mouth.x - outlet.x) + 25);
    const height = Math.ceil(floor - y + 10);
    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.className = 'pour-motion-water';
    canvas.style.left = `${x}px`;
    canvas.style.top = `${y}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.ceil(width * pixelRatio);
    canvas.height = Math.ceil(height * pixelRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return { canvas, paint() {} };
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const start = { x: outlet.x - x, y: outlet.y - y };
    const end = { x: mouth.x - x, y: mouth.y - y + 0.8 };
    const bend = { x: end.x + direction * 1.7, y: start.y + 3.3 };
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, color.deep);
    gradient.addColorStop(0.40, color.light);
    gradient.addColorStop(1, color.deep);
    const intoGlass = ctx.createLinearGradient(end.x, end.y, end.x, Math.max(end.y + 2, floor - y));
    intoGlass.addColorStop(0, color.deep);
    intoGlass.addColorStop(0.22, color.light);
    intoGlass.addColorStop(1, color.deep);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Reuse the path constants and one small bitmap. Vary only its active length.
    function px(t) { return start.x + t * (2 * (bend.x - start.x) + t * (start.x - 2 * bend.x + end.x)); }
    function py(t) { return start.y + t * (2 * (bend.y - start.y) + t * (start.y - 2 * bend.y + end.y)); }

    function section(tail, tip, trim = 0) {
      const ax = px(tail);
      const ay = py(tail);
      const bx = px(tip);
      const by = py(tip);
      // The exact restricted quadratic, starting at the receding tail.
      const cx = ax + (tip - tail) * ((1 - tail) * (bend.x - start.x) + tail * (end.x - bend.x));
      const cy = ay + (tip - tail) * ((1 - tail) * (bend.y - start.y) + tail * (end.y - bend.y));
      ctx.beginPath();
      ctx.moveTo(ax - trim, ay);
      ctx.quadraticCurveTo(cx - trim, cy, bx, by);
    }

    return {
      canvas,
      paint(elapsed, feed, arcTime, bottleTime, surfaceY) {
        ctx.clearRect(0, 0, width, height);
        const tip = clamp(elapsed / arcTime);
        const tail = clamp((elapsed - feed) / arcTime);
        if (tip > tail) {
          const pressure = 0.84 + 0.16 * smooth(clamp(elapsed / 100));
          ctx.globalAlpha = 0.9 - tail * 0.2;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 4.1 * pressure;
          section(tail, tip);
          ctx.stroke();
          ctx.strokeStyle = '#fffcefc2';
          ctx.lineWidth = 0.95;
          section(tail, tip, direction * 0.72);
          ctx.stroke();
          const bead = ((elapsed / 178) % 1);
          if (bead > tail && bead < tip) {
            ctx.fillStyle = '#fffcefb8';
            ctx.beginPath();
            ctx.ellipse(px(bead), py(bead), 0.86, 1.65, direction * -0.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const innerElapsed = elapsed - arcTime;
        const innerTip = clamp(innerElapsed / bottleTime);
        const innerTail = clamp((innerElapsed - feed) / bottleTime);
        if (innerTip > innerTail) {
          const innerEnd = Math.max(end.y + 3, surfaceY - y + 0.65);
          ctx.globalAlpha = 0.57;
          ctx.strokeStyle = intoGlass;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(end.x, lerp(end.y, innerEnd, innerTail));
          ctx.lineTo(end.x, lerp(end.y, innerEnd, innerTip));
          ctx.stroke();
          if (innerTip === 1 && innerTail < 0.9) {
            const ripple = (innerElapsed / 145) % 1;
            ctx.globalAlpha = 0.38 * (1 - ripple);
            ctx.strokeStyle = color.light;
            ctx.lineWidth = 1.15;
            ctx.beginPath();
            ctx.ellipse(end.x, innerEnd, lerp(2, 6.3, ripple), lerp(0.6, 1.8, ripple), 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      },
    };
  }

  // Approximate a steady pour: the beginning and the last sip accelerate gently.
  function volumeAt(time, duration) {
    const p = clamp(time / duration);
    const ramp = 0.10;
    const normal = 1 - ramp;
    if (p < ramp) return (p * p / (2 * ramp)) / normal;
    if (p > 1 - ramp) return 1 - ((1 - p) ** 2 / (2 * ramp)) / normal;
    return (p - ramp / 2) / normal;
  }

  function play({ source, target, color, amount, fromBefore, toBefore, fromAfter, toAfter, done }) {
    if (!source || !target || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done();
      return;
    }

    let closed = false;
    let scene;
    let request;
    let timeout;
    const clearers = [];
    const visualViewport = window.visualViewport;
    function finish() {
      if (closed) return;
      closed = true;
      window.cancelAnimationFrame(request);
      window.clearTimeout(timeout);
      scene?.remove();
      source.classList.remove('pour-motion-source');
      target.classList.remove('pour-motion-target');
      clearers.forEach((clear) => clear());
      window.removeEventListener('scroll', finish, true);
      window.removeEventListener('resize', finish);
      visualViewport?.removeEventListener('resize', finish);
      document.removeEventListener('visibilitychange', onVisibility);
      done();
    }
    function onVisibility() {
      if (document.hidden) finish();
    }

    try {
      const vessel = source.querySelector('.vessel');
      const receiver = target.querySelector('.vessel');
      const vesselRect = vessel.getBoundingClientRect();
      const sourceMouth = vessel.querySelector('.glass-mouth').getBoundingClientRect();
      const targetMouth = receiver.querySelector('.glass-mouth').getBoundingClientRect();
      const sourceLiquid = liquidMetrics(vessel);
      const targetLiquid = liquidMetrics(receiver);
      if (![vesselRect.width, vesselRect.height, sourceLiquid.rowHeight, targetLiquid.rowHeight].every((n) => n > 0)) {
        finish();
        return;
      }
      const start = center(sourceMouth);
      const end = center(targetMouth);
      const transform = window.getComputedStyle(vessel).transform;
      const offset = transform !== 'none' && typeof DOMMatrixReadOnly === 'function' ? new DOMMatrixReadOnly(transform) : null;
      const resting = { x: start.x - (offset?.m41 || 0), y: start.y - (offset?.m42 || 0) };
      const anchorX = start.x - vesselRect.left;
      const anchorY = start.y - vesselRect.top;

      const gap = clamp(targetMouth.width * 1.48 + 6, 30, 44);
      const reach = vesselRect.height + 24;
      let direction = end.x >= start.x ? 1 : -1;
      if (direction > 0 && end.x < reach) direction = -1;
      else if (direction < 0 && window.innerWidth - end.x < reach) direction = 1;
      const outlet = { x: end.x - direction * 18, y: end.y - gap };
      const lip = Math.max(2, sourceMouth.height * 0.43);
      const angleOpen = direction * 98;
      const angleClose = direction * 110;
      function mouthX(angle) { return outlet.x - lip * Math.sin(angle * Math.PI / 180); }
      function mouthY(angle) { return outlet.y + lip * Math.cos(angle * Math.PI / 180); }

      const clone = vessel.cloneNode(true);
      clone.classList.add('pour-motion-vessel');
      clone.style.width = `${vesselRect.width}px`;
      clone.style.height = `${vesselRect.height}px`;
      clone.style.transformOrigin = `${anchorX}px ${anchorY}px`;
      const stream = makeStream(outlet, end, targetLiquid.bottom, direction, color);
      scene = document.createElement('div');
      scene.className = 'pour-motion-scene';
      scene.setAttribute('aria-hidden', 'true');
      scene.append(clone, stream.canvas);
      const fillSource = fillBand(clone, sourceLiquid, fromBefore, fromAfter, color, clearers);
      const fillTarget = fillBand(receiver, targetLiquid, toBefore, toAfter, color, clearers);

      const approach = Math.round(166 + clamp(Math.hypot(end.x - start.x, end.y - start.y) * 0.18, 0, 70));
      const feed = 365 + 58 * clamp(amount, 1, 4);
      const arcTime = 52;
      const bottleTime = 48;
      const settle = Math.round(167 + clamp(Math.hypot(end.x - resting.x, end.y - resting.y) * 0.14, 0, 56));
      const beginReturn = approach + feed + arcTime;
      const stop = beginReturn + settle;
      fillSource(fromBefore);
      fillTarget(toBefore);
      function pose(x, y, angle) {
        clone.style.transform = `translate3d(${(x - anchorX).toFixed(2)}px, ${(y - anchorY).toFixed(2)}px, 0) rotate(${angle.toFixed(2)}deg)`;
      }
      pose(start.x, start.y, 0);
      document.body.appendChild(scene);
      source.classList.add('pour-motion-source');
      target.classList.add('pour-motion-target');
      window.addEventListener('scroll', finish, { capture: true, passive: true });
      window.addEventListener('resize', finish);
      visualViewport?.addEventListener('resize', finish);
      document.addEventListener('visibilitychange', onVisibility);
      timeout = window.setTimeout(finish, stop + 240);

      let timeOrigin;
      let lastEmptyFrame = false;
      function step(timestamp) {
        if (closed) return;
        try {
          if (timeOrigin === undefined) timeOrigin = timestamp;
          const elapsed = timestamp - timeOrigin;
          if (elapsed >= stop || !source.isConnected || !target.isConnected) {
            finish();
            return;
          }
          if (elapsed < approach) {
            const p = smooth(elapsed / approach);
            pose(lerp(start.x, mouthX(angleOpen), p),
              lerp(start.y, mouthY(angleOpen), p) - 16 * Math.sin(Math.PI * p),
              angleOpen * smooth(clamp((p - 0.23) / 0.77)));
          } else {
            const pourTime = elapsed - approach;
            const leaving = volumeAt(pourTime, feed);
            const arriving = volumeAt(pourTime - arcTime - bottleTime, feed);
            if (elapsed < beginReturn) {
              const tilt = lerp(angleOpen, angleClose, leaving);
              pose(mouthX(tilt), mouthY(tilt), tilt);
            } else {
              const p = smooth((elapsed - beginReturn) / settle);
              pose(lerp(mouthX(angleClose), resting.x, p),
                lerp(mouthY(angleClose), resting.y, p) - 12 * Math.sin(Math.PI * p),
                angleClose * (1 - p));
            }
            if (!lastEmptyFrame) {
              const targetUnits = lerp(toBefore, toAfter, arriving);
              fillSource(lerp(fromBefore, fromAfter, leaving));
              fillTarget(targetUnits);
              stream.paint(pourTime, feed, arcTime, bottleTime, targetLiquid.bottom - targetLiquid.rowHeight * targetUnits);
              lastEmptyFrame = arriving === 1;
            }
          }
          request = window.requestAnimationFrame(step);
        } catch {
          finish();
        }
      }
      request = window.requestAnimationFrame(step);
      return finish;
    } catch {
      finish();
    }
  }

  globalThis.PourMotion = { play };
})();
