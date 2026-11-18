(() => {
  'use strict';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, fraction) => from + (to - from) * fraction;
  const ease = (t) => t * t * (3 - 2 * t);

  function center(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function blend(first, second, fraction) {
    return { x: lerp(first.x, second.x, fraction), y: lerp(first.y, second.y, fraction) };
  }

  function makeFill(vessel, low, high, color, clearers) {
    const cells = Array.from(vessel.querySelectorAll('.liquid')).reverse();
    const layers = cells.slice(Math.min(low, high), Math.max(low, high));
    for (const layer of layers) {
      layer.classList.add('pour-motion-cell');
      layer.style.setProperty('--pour-motion-light', color.light);
      layer.style.setProperty('--pour-motion-deep', color.deep);
      clearers.push(() => {
        layer.classList.remove('pour-motion-cell');
        layer.removeAttribute('data-pour-surface');
        for (const name of ['light', 'deep', 'fill', 'symbol']) layer.style.removeProperty(`--pour-motion-${name}`);
      });
    }
    return (units) => {
      const top = Math.ceil(units - 0.001) - low - 1;
      layers.forEach((layer, index) => {
        const fill = clamp(units - low - index);
        layer.style.setProperty('--pour-motion-fill', `${fill * 100}%`);
        layer.style.setProperty('--pour-motion-symbol', String(clamp((fill - 0.45) * 3)));
        if (index === top) layer.setAttribute('data-pour-surface', '');
        else layer.removeAttribute('data-pour-surface');
      });
    };
  }

  function drawStream(ctx, start, end, direction, color, phase) {
    const head = clamp(phase / 0.15);
    const tail = clamp((phase - 0.83) / 0.17);
    if (head <= tail) return;
    const control = { x: end.x + direction * 2, y: start.y + (end.y - start.y) * 0.20 };
    function point(t) {
      const u = 1 - t;
      return {
        x: u * u * start.x + 2 * u * t * control.x + t * t * end.x,
        y: u * u * start.y + 2 * u * t * control.y + t * t * end.y,
      };
    }
    // A short curved ribbon narrows as it falls, with a lighter moving core.
    const edges = [[], []];
    const shimmer = [];
    const width = lerp(2.0, 4.8, ease(clamp(phase / 0.18))) * lerp(1, 0.58, tail);
    for (let i = 0; i <= 16; i += 1) {
      const t = lerp(tail, head, i / 16);
      const p = point(t);
      const dx = 2 * ((1 - t) * (control.x - start.x) + t * (end.x - control.x));
      const dy = 2 * ((1 - t) * (control.y - start.y) + t * (end.y - control.y));
      const length = Math.hypot(dx, dy) || 1;
      const half = width * lerp(0.56, 0.33, t) * (1 + 0.08 * Math.sin(34 * phase - 8 * t));
      edges[0].push({ x: p.x + dy / length * half, y: p.y - dx / length * half });
      edges[1].push({ x: p.x - dy / length * half, y: p.y + dx / length * half });
      shimmer.push({ x: p.x + dy / length * 0.5, y: p.y - dx / length * 0.5 });
    }
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    gradient.addColorStop(0, color.deep);
    gradient.addColorStop(0.62, color.light);
    gradient.addColorStop(1, color.deep);
    ctx.globalAlpha = 0.94;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    const outline = [...edges[0], ...edges[1].reverse()];
    outline.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.46;
    ctx.strokeStyle = '#fffdf1';
    ctx.lineWidth = 0.75;
    ctx.lineCap = 'round';
    ctx.beginPath();
    shimmer.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();

    if (head === 1 && tail < 0.9) {
      const ripple = (phase * 7) % 1;
      ctx.globalAlpha = (1 - ripple) * 0.6;
      ctx.strokeStyle = color.light;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(end.x, end.y, lerp(1.5, 6, ripple), lerp(0.6, 2, ripple), 0, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
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
      const mouth = vessel.querySelector('.glass-mouth').getBoundingClientRect();
      const targetMouth = receiver.querySelector('.glass-mouth').getBoundingClientRect();
      const start = center(mouth);
      const end = center(targetMouth);
      const selectedTransform = window.getComputedStyle(vessel).transform;
      const originalOffset = selectedTransform !== 'none' && typeof DOMMatrixReadOnly === 'function'
        ? new DOMMatrixReadOnly(selectedTransform) : null;
      const resting = originalOffset
        ? { x: start.x - originalOffset.m41, y: start.y - originalOffset.m42 } : start;
      if ([vesselRect.width, vesselRect.height, targetMouth.width].some((value) => !value)) {
        finish();
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        finish();
        return;
      }
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;
      const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
      canvas.className = 'pour-motion-water';
      canvas.width = Math.ceil(viewWidth * pixelRatio);
      canvas.height = Math.ceil(viewHeight * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const anchor = { x: start.x - vesselRect.left, y: start.y - vesselRect.top };
      const clone = vessel.cloneNode(true);
      clone.classList.add('pour-motion-vessel');
      clone.style.width = `${vesselRect.width}px`;
      clone.style.height = `${vesselRect.height}px`;
      clone.style.transformOrigin = `${anchor.x}px ${anchor.y}px`;
      scene = document.createElement('div');
      scene.className = 'pour-motion-scene';
      scene.setAttribute('aria-hidden', 'true');
      scene.append(clone, canvas);

      const distance = vesselRect.height + 10;
      let direction = end.x >= start.x ? 1 : -1;
      if (direction > 0 && end.x < distance) direction = -1;
      else if (direction < 0 && viewWidth - end.x < distance) direction = 1;
      const gap = clamp(targetMouth.width * 0.85, 17, 27);
      const spout = { x: end.x - direction * 9, y: end.y - gap };
      const hover = { x: spout.x - direction * 10, y: spout.y - 5 };
      const incoming = { x: end.x, y: end.y + 1 };
      const tiltAngle = direction * 106;
      const liftTime = 200;
      const turnTime = 130;
      const waterTime = 220 + 68 * clamp(amount, 1, 4);
      const landTime = 220;
      const streamStart = liftTime + turnTime;
      const returnStart = streamStart + waterTime;
      const total = returnStart + landTime;
      const fillSource = makeFill(clone, fromAfter, fromBefore, color, clearers);
      const fillTarget = makeFill(receiver, toBefore, toAfter, color, clearers);
      fillSource(fromBefore);
      fillTarget(toBefore);

      function pose(pos, angle) {
        clone.style.transform = `translate3d(${pos.x - anchor.x}px, ${pos.y - anchor.y}px, 0) rotate(${angle}deg)`;
      }

      pose(start, 0);
      document.body.appendChild(scene);
      source.classList.add('pour-motion-source');
      target.classList.add('pour-motion-target');
      window.addEventListener('scroll', finish, { capture: true, passive: true });
      window.addEventListener('resize', finish);
      visualViewport?.addEventListener('resize', finish);
      document.addEventListener('visibilitychange', onVisibility);
      timeout = window.setTimeout(finish, total + 240);

      let timeOrigin;
      function step(timestamp) {
        if (closed) return;
        try {
          if (timeOrigin === undefined) timeOrigin = timestamp;
          const elapsed = timestamp - timeOrigin;
          if (elapsed >= total || !source.isConnected || !target.isConnected) {
            finish();
            return;
          }
          if (elapsed < liftTime) {
            const p = ease(elapsed / liftTime);
            const point = blend(start, hover, p);
            point.y -= 19 * Math.sin(Math.PI * p);
            pose(point, lerp(0, direction * 13, p));
          } else if (elapsed < streamStart) {
            const p = ease((elapsed - liftTime) / turnTime);
            pose(blend(hover, spout, p), lerp(direction * 13, tiltAngle, p));
          } else if (elapsed < returnStart) {
            const phase = (elapsed - streamStart) / waterTime;
            const height = Math.sin(Math.PI * phase);
            const nozzle = { x: spout.x, y: spout.y - 2 * height };
            pose(nozzle, tiltAngle + 6 * height * direction);
            fillSource(lerp(fromBefore, fromAfter, ease(clamp(phase / 0.91))));
            fillTarget(lerp(toBefore, toAfter, ease(clamp((phase - 0.10) / 0.90))));
            ctx.clearRect(0, 0, viewWidth, viewHeight);
            drawStream(ctx, nozzle, incoming, direction, color, phase);
          } else {
            const p = ease((elapsed - returnStart) / landTime);
            const point = blend(spout, resting, p);
            point.y -= 15 * Math.sin(Math.PI * p);
            pose(point, lerp(tiltAngle, 0, ease(clamp(p / 0.75))));
            fillSource(fromAfter);
            fillTarget(toAfter);
            ctx.clearRect(0, 0, viewWidth, viewHeight);
          }
          request = window.requestAnimationFrame(step);
        } catch {
          finish();
        }
      }
      request = window.requestAnimationFrame(step);
    } catch {
      finish();
    }
  }

  globalThis.PourMotion = { play };
})();
