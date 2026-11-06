/* Phantom reticle cursor — shared by every page.
   Bracketed diamond + radiating dash halo, drawn once and driven by one rAF loop. */
(function () {
  'use strict';

  if (window.__phantomCursor) return;
  window.__phantomCursor = true;

  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  var SVGNS = 'http://www.w3.org/2000/svg';
  var BRACKET_SIZE = 68;   // diamond: 44px across, drawn in a 68px box
  var HALO_SIZE = 148;
  var R = 22;              // diamond corner radius from centre
  var ARM = 12.5;          // how far each bracket runs along its edges
  var DASH_COUNT = 20;

  /* ---- styles ---- */
  var css = [
    'body { cursor: none; }',
    '#cur-dot, #cur-ring, #cursor-dot, #cursor-ring { display: none !important; }',
    '#ph-cur { position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 99999;',
    '  pointer-events: none; mix-blend-mode: difference; opacity: 0; transition: opacity .3s ease; }',
    '#ph-cur.ph-on { opacity: 1; }',
    '#ph-cur > * { position: absolute; top: 0; left: 0; will-change: transform; }',
    '#ph-cur svg { display: block; overflow: visible; }',
    '#ph-dot { width: 5px; height: 5px; border-radius: 50%; background: #fff; }',
    '#ph-br svg { transition: transform .45s cubic-bezier(.22,1,.36,1), opacity .3s ease; }',
    '#ph-halo svg { transition: transform .6s cubic-bezier(.22,1,.36,1), opacity .3s ease; }',
    '#ph-cur.ph-hot #ph-br svg { transform: scale(1.3); }',
    '#ph-cur.ph-hot #ph-halo svg { transform: rotate(14deg) scale(1.06); }',
    '#ph-cur.ph-hot #ph-dot { transform-origin: center; }',
    '@media (hover: none), (pointer: coarse) { body { cursor: auto; } #ph-cur { display: none; } }'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'ph-cur-style';
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- markup ---- */
  var root = document.createElement('div');
  root.id = 'ph-cur';

  var halo = document.createElement('div');
  halo.id = 'ph-halo';
  var haloW = HALO_SIZE, haloC = haloW / 2;
  var haloBox = 'width:' + haloW + 'px;height:' + haloW + 'px;margin-left:' + (-haloC) + 'px;margin-top:' + (-haloC) + 'px;';
  halo.setAttribute('style', haloBox);

  function svg(w, h) {
    var el = document.createElementNS(SVGNS, 'svg');
    el.setAttribute('width', String(w));
    el.setAttribute('height', String(h));
    el.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    el.setAttribute('fill', 'none');
    return el;
  }

  // dash halo: deterministic jitter so the pattern is identical everywhere
  var haloEl = svg(haloW, haloW);
  var seed = 7;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

  for (var i = 0; i < DASH_COUNT; i++) {
    var a = (i / DASH_COUNT) * Math.PI * 2 + (rnd() - 0.5) * 0.12;
    var r1 = 42 + rnd() * 5;
    var len = 14 + rnd() * 14;
    var a2 = a + (rnd() - 0.5) * 0.04;
    var line = document.createElementNS(SVGNS, 'line');
    line.setAttribute('x1', (haloC + Math.cos(a) * r1).toFixed(2));
    line.setAttribute('y1', (haloC + Math.sin(a) * r1).toFixed(2));
    line.setAttribute('x2', (haloC + Math.cos(a2) * (r1 + len)).toFixed(2));
    line.setAttribute('y2', (haloC + Math.sin(a2) * (r1 + len)).toFixed(2));
    line.setAttribute('stroke', '#fff');
    line.setAttribute('stroke-width', (1.3 + rnd() * 1.0).toFixed(2));
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', (0.32 + rnd() * 0.62).toFixed(2));
    haloEl.appendChild(line);
  }
  halo.appendChild(haloEl);

  // brackets: four rounded caret pieces on the corners of a diamond
  var br = document.createElement('div');
  br.id = 'ph-br';
  var brBox = 'width:' + BRACKET_SIZE + 'px;height:' + BRACKET_SIZE + 'px;margin-left:' + (-BRACKET_SIZE / 2) + 'px;margin-top:' + (-BRACKET_SIZE / 2) + 'px;';
  br.setAttribute('style', brBox);

  var brEl = svg(BRACKET_SIZE, BRACKET_SIZE);
  var cx = BRACKET_SIZE / 2, cy = BRACKET_SIZE / 2;
  var d = ARM * Math.SQRT1_2;
  var corners = [
    [[cx, cy - R], [cx + R, cy], [cx - R, cy]],           // top
    [[cx + R, cy], [cx, cy + R], [cx, cy - R]],           // right
    [[cx, cy + R], [cx - R, cy], [cx + R, cy]],           // bottom
    [[cx - R, cy], [cx, cy - R], [cx, cy + R]]            // left
  ];

  corners.forEach(function (set) {
    var corner = set[0], n1 = set[1], n2 = set[2];
    function along(from, to, dist) {
      var dx = to[0] - from[0], dy = to[1] - from[1];
      var m = Math.sqrt(dx * dx + dy * dy);
      return [from[0] + (dx / m) * dist, from[1] + (dy / m) * dist];
    }
    var p1 = along(corner, n1, d);
    var p2 = along(corner, n2, d);
    var path = document.createElementNS(SVGNS, 'path');
    path.setAttribute('d', 'M' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) +
      'L' + corner[0].toFixed(2) + ' ' + corner[1].toFixed(2) +
      'L' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2));
    path.setAttribute('stroke', '#fff');
    path.setAttribute('stroke-width', '2.7');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    brEl.appendChild(path);
  });
  br.appendChild(brEl);

  var dot = document.createElement('div');
  dot.id = 'ph-dot';

  root.appendChild(halo);
  root.appendChild(br);
  root.appendChild(dot);
  document.body.appendChild(root);

  /* ---- motion ---- */
  var x = window.innerWidth / 2, y = window.innerHeight / 2;
  var brX = x, brY = y, haloX = x, haloY = y;
  var seen = false;

  document.addEventListener('mousemove', function (e) {
    x = e.clientX;
    y = e.clientY;
    if (!seen) {
      seen = true;
      brX = haloX = x;
      brY = haloY = y;
      root.classList.add('ph-on');
    }
    dot.style.transform = 'translate3d(' + (x - 2.5) + 'px,' + (y - 2.5) + 'px,0)';
  }, { passive: true });

  document.addEventListener('mouseleave', function () { root.classList.remove('ph-on'); });
  document.addEventListener('mouseenter', function () { if (seen) root.classList.add('ph-on'); });

  var HOT = 'a,button,[role="button"],input,textarea,select,label,summary';
  document.addEventListener('mouseover', function (e) {
    if (e.target && e.target.closest && e.target.closest(HOT)) root.classList.add('ph-hot');
  }, { passive: true });
  document.addEventListener('mouseout', function (e) {
    if (e.target && e.target.closest && e.target.closest(HOT)) root.classList.remove('ph-hot');
  }, { passive: true });

  function loop() {
    brX += (x - brX) * 0.16;
    brY += (y - brY) * 0.16;
    haloX += (x - haloX) * 0.08;
    haloY += (y - haloY) * 0.08;
    br.style.transform = 'translate3d(' + brX.toFixed(2) + 'px,' + brY.toFixed(2) + 'px,0)';
    halo.style.transform = 'translate3d(' + haloX.toFixed(2) + 'px,' + haloY.toFixed(2) + 'px,0)';
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
