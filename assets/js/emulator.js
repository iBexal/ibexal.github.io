// Spectrum emulator page: built by emulator_project/spectrophot/explainer/build.py from charts.js and
// playground.js; the data (assets/data/emulator.json) comes from make_data.py. Do not edit here.
(function () {
'use strict';
// Small SVG chart helpers shared by the explainer page and the website's emulator page (build.py inlines
// this file). Colours come from CSS variables on the page: --rule, --ink, --ink-2, --ink-3, --paper, --panel.
const NS = 'http://www.w3.org/2000/svg';
function f32(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Float32Array(u.buffer); }
function mk(tag, attrs, parent) { const e = document.createElementNS(NS, tag); if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
const pow10 = e => '10' + String(e).split('').map(c => SUP[c]).join('');
function sci(v, d) { if (v === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(v))); if (e >= -2 && e <= 4) return (+v.toPrecision(d || 3)).toLocaleString('en-US'); return (v / 10 ** e).toFixed(d === undefined ? 1 : d - 1) + '×' + pow10(e); }
function niceTicks(lo, hi, n) { const span = hi - lo, s0 = span / n, mag = 10 ** Math.floor(Math.log10(s0)), r = s0 / mag;
  const step = (r >= 7.5 ? 10 : r >= 3.5 ? 5 : r >= 1.5 ? 2 : 1) * mag; const t = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) t.push(+v.toFixed(10)); return t; }
function logTicks(lo, hi) { const t = []; for (let e = Math.ceil(Math.log10(lo) - 1e-9); e <= Math.floor(Math.log10(hi) + 1e-9); e++) t.push(10 ** e); return t; }
function scale(ax, a, b) { const lg = !!ax.log, f = v => lg ? Math.log10(v) : v; const lo = f(ax.min), hi = f(ax.max);
  if (ax.reverse) [a, b] = [b, a]; const s = v => a + (f(v) - lo) / (hi - lo) * (b - a);
  s.inv = p => { const v = lo + (p - a) / (b - a) * (hi - lo); return lg ? 10 ** v : v; }; return s; }
const fmtTick = (v, ax) => ax.fmt ? ax.fmt(v) : ax.log ? pow10(Math.round(Math.log10(v))) : Math.abs(v) >= 1000 ? v.toLocaleString('en-US') : String(+v.toPrecision(4));

// a plotting frame sized to its container: axes, recessive grid, clipped plot group
function frame(host, o) {
  host.innerHTML = ''; host.style.position = 'relative';
  const W = Math.max(280, host.clientWidth), H = o.height || 280;
  const m = Object.assign({ l: 58, r: 16, t: 12, b: 42 }, o.margin || {});
  const svg = mk('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': o.aria || '' }, host);
  svg.style.display = 'block';
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const sx = scale(o.x, m.l, m.l + pw), sy = scale(o.y, m.t + ph, m.t);
  const g = mk('g', null, svg);
  const yt = o.y.ticks || (o.y.log ? logTicks(o.y.min, o.y.max) : niceTicks(o.y.min, o.y.max, o.y.n || 5));
  for (const v of yt) { const y = sy(v); if (y < m.t - 0.5 || y > m.t + ph + 0.5) continue;
    mk('line', { x1: m.l, x2: m.l + pw, y1: y, y2: y, style: 'stroke:var(--rule)', 'stroke-width': 1 }, g);
    if (!o.y.hideLabels) { const t = mk('text', { x: m.l - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 11, style: 'fill:var(--ink-3)' }, g); t.textContent = fmtTick(v, o.y); } }
  const xt = o.x.ticks || (o.x.log ? logTicks(o.x.min, o.x.max) : niceTicks(Math.min(o.x.min, o.x.max), Math.max(o.x.min, o.x.max), o.x.n || Math.max(3, Math.floor(pw / 90))));
  for (const v of xt) { const x = sx(v); if (x < m.l - 0.5 || x > m.l + pw + 0.5) continue;
    mk('line', { x1: x, x2: x, y1: m.t + ph, y2: m.t + ph + 4, style: 'stroke:var(--ink-3)', 'stroke-width': 1 }, g);
    if (!o.x.hideLabels) { const t = mk('text', { x: x, y: m.t + ph + 17, 'text-anchor': 'middle', 'font-size': 11, style: 'fill:var(--ink-3)' }, g); t.textContent = fmtTick(v, o.x); } }
  mk('line', { x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph, style: 'stroke:var(--ink-3)', 'stroke-width': 1 }, g);
  if (o.x.label) { const t = mk('text', { x: m.l + pw / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 12, style: 'fill:var(--ink-2)' }, g); t.textContent = o.x.label; }
  if (o.y.label) { const t = mk('text', { x: 13, y: m.t + ph / 2, 'text-anchor': 'middle', 'font-size': 12, transform: `rotate(-90 13 ${m.t + ph / 2})`, style: 'fill:var(--ink-2)' }, g); t.textContent = o.y.label; }
  const clipId = 'cl' + Math.random().toString(36).slice(2);
  const cp = mk('clipPath', { id: clipId }, mk('defs', null, svg)); mk('rect', { x: m.l, y: m.t - 2, width: pw, height: ph + 4 }, cp);
  const plot = mk('g', { 'clip-path': `url(#${clipId})` }, svg);
  return { svg, plot, sx, sy, m, pw, ph, W, H, host };
}
function pathOf(F, xs, ys) { let d = '', pen = false;
  for (let i = 0; i < xs.length; i++) { const y = ys[i]; if (y === null || !isFinite(y)) { pen = false; continue; }
    d += (pen ? 'L' : 'M') + F.sx(xs[i]).toFixed(1) + ' ' + F.sy(y).toFixed(1); pen = true; } return d; }
function line(F, xs, ys, color, w, extra) { return mk('path', Object.assign({ d: pathOf(F, xs, ys), fill: 'none', 'stroke-width': w || 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', style: `stroke:${color}` }, extra || {}), F.plot); }
function hline(F, y, text, opts) { opts = opts || {}; const Y = F.sy(y);
  mk('line', { x1: F.m.l, x2: F.m.l + F.pw, y1: Y, y2: Y, 'stroke-width': 1.2, 'stroke-dasharray': opts.dash || '5 4', style: `stroke:${opts.color || 'var(--ink-3)'}` }, F.svg);
  if (text) { const t = mk('text', { x: opts.left ? F.m.l + 6 : F.m.l + F.pw - 4, y: Y - 5, 'text-anchor': opts.left ? 'start' : 'end', 'font-size': 11, style: 'fill:var(--ink-2)' }, F.svg); t.textContent = text; } }
function vline(F, x, text) { const X = F.sx(x); mk('line', { x1: X, x2: X, y1: F.m.t, y2: F.m.t + F.ph, 'stroke-width': 1, 'stroke-dasharray': '3 4', style: 'stroke:var(--ink-3)' }, F.plot);
  if (text) { const t = mk('text', { x: X + 4, y: F.m.t + 11, 'font-size': 10.5, style: 'fill:var(--ink-3)' }, F.svg); t.textContent = text; } }
function label(F, x, y, text, color, anchor, dy) { const t = mk('text', { x: F.sx(x) + (anchor === 'end' ? -6 : 6), y: F.sy(y) + (dy || 0), 'text-anchor': anchor || 'start', 'font-size': 11.5, 'font-weight': 600, style: `fill:${color || 'var(--ink-2)'}; paint-order:stroke; stroke:var(--paper); stroke-width:3px` }, F.svg); t.textContent = text; return t; }
function tipEl(host) { const t = document.createElement('div'); t.className = 'tip'; t.hidden = true; host.appendChild(t); return t; }
function placeTip(F, tip, px, py) { tip.hidden = false; const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = px + 14; if (x + w > F.W - 2) x = px - w - 14; let y = py - h - 10; if (y < 0) y = py + 14;
  tip.style.left = Math.max(0, x) + 'px'; tip.style.top = y + 'px'; }
// crosshair hover for line charts: series = [{xs, ys, color, name}], xs ascending
function crosshair(F, series, fmtX, fmtY) {
  const tip = tipEl(F.host); const g = mk('g', { 'pointer-events': 'none' }, F.svg); g.style.display = 'none';
  const vl = mk('line', { y1: F.m.t, y2: F.m.t + F.ph, 'stroke-width': 1, style: 'stroke:var(--ink-3)' }, g);
  const dots = series.map(s => mk('circle', { r: 4, 'stroke-width': 2, style: `fill:${s.color};stroke:var(--paper)` }, g));
  const ov = mk('rect', { x: F.m.l, y: F.m.t, width: F.pw, height: F.ph, fill: 'transparent' }, F.svg);
  const near = (xs, x) => { let lo = 0, hi = xs.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (xs[mid] < x) lo = mid; else hi = mid; } return Math.abs(xs[lo] - x) < Math.abs(xs[hi] - x) ? lo : hi; };
  ov.addEventListener('pointermove', ev => { const r = F.svg.getBoundingClientRect(); const px = ev.clientX - r.left, py = ev.clientY - r.top;
    const x = F.sx.inv(px); g.style.display = ''; let rows = '', X0 = null;
    series.forEach((s, j) => { const i = near(s.xs, x); const X = F.sx(s.xs[i]), v = s.ys[i]; if (X0 === null) X0 = X;
      if (v === null || !isFinite(v)) { dots[j].style.display = 'none'; return; } dots[j].style.display = '';
      dots[j].setAttribute('cx', X); dots[j].setAttribute('cy', F.sy(v)); rows += `<div><i style="background:${s.color}"></i>${s.name}: ${fmtY(v)}</div>`; });
    vl.setAttribute('x1', X0); vl.setAttribute('x2', X0);
    tip.innerHTML = `<div style="color:var(--ink-3)">${fmtX(F.sx.inv(X0))}</div>` + rows; placeTip(F, tip, X0, py); });
  ov.addEventListener('pointerleave', () => { g.style.display = 'none'; tip.hidden = true; });
}
// nearest-point hover for scatter and bars: pts = [{x, y, html}]
function pointHover(F, pts, radius) {
  const tip = tipEl(F.host); const ring = mk('circle', { r: 6, fill: 'none', 'stroke-width': 2, 'pointer-events': 'none', style: 'stroke:var(--ink)' }, F.svg); ring.style.display = 'none';
  const P = pts.map(p => [F.sx(p.x), F.sy(p.y)]);
  const ov = mk('rect', { x: F.m.l, y: F.m.t, width: F.pw, height: F.ph, fill: 'transparent' }, F.svg);
  ov.addEventListener('pointermove', ev => { const r = F.svg.getBoundingClientRect(); const px = ev.clientX - r.left, py = ev.clientY - r.top;
    let best = -1, bd = (radius || 18) ** 2; for (let i = 0; i < P.length; i++) { const dx = P[i][0] - px, dy = P[i][1] - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } }
    if (best < 0) { ring.style.display = 'none'; tip.hidden = true; return; }
    ring.style.display = ''; ring.setAttribute('cx', P[best][0]); ring.setAttribute('cy', P[best][1]); tip.innerHTML = pts[best].html; placeTip(F, tip, P[best][0], P[best][1]); });
  ov.addEventListener('pointerleave', () => { ring.style.display = 'none'; tip.hidden = true; });
}
// chart(host or id, draw): draws now and again whenever the host's width changes; returns the redraw function
const renders = [];
const lastW = new Map();
let resizeTimer = null;
const resizeObs = new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => {
  for (const [h, r] of renders) { const w = h.clientWidth; if (lastW.get(h) !== w) { lastW.set(h, w); r(); } } }, 120); });
function chart(host, fn) { if (typeof host === 'string') host = document.getElementById(host); if (!host) return () => {};
  const r = () => fn(host); renders.push([host, r]); r(); lastW.set(host, host.clientWidth); resizeObs.observe(host); return r; }

// Emulator playground: runs an sfit emulator (PCA basis + network, from make_data.py's `play` block) in the
// browser. Shared by the explainer page and the website's emulator page; needs charts.js. Everything is
// local to mountPlayground so it can sit inside another page's script.
function mountPlayground(root, P) {
  const INFO = {   // display name, unit, slider step, decimals
    TEFF: ['Teff', 'K', 10, 0], LOGG: ['log g', '', 0.01, 2], FE_H: ['[Fe/H]', '', 0.01, 2], VMICRO: ['vmic', 'km/s', 0.01, 2],
    VMACRO: ['vmac', 'km/s', 0.1, 1], ALPHA_FE: ['[α/Fe]', '', 0.01, 2], MG_FE: ['[Mg/Fe]', '', 0.01, 2], SI_FE: ['[Si/Fe]', '', 0.01, 2],
    TI_FE: ['[Ti/Fe]', '', 0.01, 2] };
  const CAT = [8498.02, 8542.09, 8662.14];
  const ABUND = ['ALPHA_FE', 'MG_FE', 'SI_FE', 'TI_FE'];
  const d0 = Math.max(0, P.presets.findIndex(p => p.name === P.start));   // the example star it opens on   // grouped below the spectrum on phones (playground.css)
  const decode = p => ({ n: p.n_pix, K: p.K, lo: p.lo, hi: p.hi, mean: f32(p.mean), V: f32(p.V), cs: f32(p.coef_scale),
    layers: p.layers.map(L => ({ n_in: L.n_in, n_out: L.n_out, W: f32(L.W), b: f32(L.b) })) });
  const E = decode(P), C = P.compare ? decode(P.compare) : null;
  const n = E.n, K = E.K, labels = P.labels, nl = labels.length;
  const WL = f32(P.wl), wl = Array.from(WL), TRAIN = P.train ? f32(P.train) : null;   // training labels: optional (not on the website)
  const split = ['MG_FE', 'SI_FE', 'TI_FE'].map(k => labels.indexOf(k)).filter(i => i >= 0), ia = labels.indexOf('ALPHA_FE');
  const Ang = v => v.toFixed(1) + ' Å';

  function emulate(M, theta, kKeep) {
    let h = theta.map((t, i) => (t - M.lo[i]) / (M.hi[i] - M.lo[i]) - 0.5);
    M.layers.forEach((L, li) => { const o = new Float64Array(L.n_out);
      for (let j = 0; j < L.n_out; j++) { let s = L.b[j]; for (let i = 0; i < L.n_in; i++) s += h[i] * L.W[i * L.n_out + j];
        o[j] = li < M.layers.length - 1 ? s / (1 + Math.exp(-s)) : s; }
      h = o; });
    const raw = h, c = Array.from(raw, (v, k) => v * M.cs[k]);
    const full = new Float64Array(M.n), part = new Float64Array(M.n);
    for (let p = 0; p < M.n; p++) { full[p] = M.mean[p]; part[p] = M.mean[p]; }
    for (let k = 0; k < M.K; k++) { const ck = c[k], off = k * M.n; for (let p = 0; p < M.n; p++) { const d = ck * M.V[off + p]; full[p] += d; if (k < kKeep) part[p] += d; } }
    return { raw, c, full, part };
  }
  function nnDist(theta) {   // distance (label-box units) to the nearest training label set
    const z = theta.map((t, i) => (t - E.lo[i]) / (E.hi[i] - E.lo[i])); let best = Infinity;
    for (let r = 0, N = TRAIN.length / nl; r < N; r++) { let d = 0;
      for (let i = 0; i < nl; i++) { const q = (TRAIN[r * nl + i] - E.lo[i]) / (E.hi[i] - E.lo[i]) - z[i]; d += q * q; if (d > best) break; }
      if (d < best) best = d; }
    return Math.sqrt(best);
  }

  // ---- controls and chart hosts
  root.innerHTML = `<div class="play-grid">
    <div class="controls">
      <div class="presets" role="group" aria-label="Example stars">${P.presets.map((p, i) => `<button class="chip" type="button" data-preset="${i}" aria-pressed="${i === d0}">${p.name}</button>`).join('')}</div>
      <div class="pg-sliders pg-stellar"></div>
      <div class="pg-sliders pg-abund"></div>
      ${split.length ? `<label class="tie pg-tie"><input type="checkbox" id="pg-tie" checked> Tie [Mg/Fe], [Si/Fe] and [Ti/Fe] to [α/Fe]</label>
        <p class="hint">In this model [α/Fe] sets O, Ne, S, Ar and Ca, so it drives the Ca II triplet. Mg, Si and Ti have their own labels; untie them to move their lines alone.</p>` : ''}
      <div class="ctl k"><div class="row"><label for="pg-k">Components kept, K</label><span class="val"><input class="num" type="number" step="any" min="1" max="${K}" id="pg-num-k" aria-label="Components kept, K"></span></div><input type="range" id="pg-k" min="1" max="${K}" step="1" value="${K}"></div>
      ${C ? `<label class="tie pg-cmp"><input type="checkbox" id="pg-cmp"> ${P.compare.title}</label>` : ''}
    </div>
    <div class="pg-plots">
      <div class="pg-legend-row"><div class="legend" id="pg-legend"></div><label class="tie pg-lock"><input type="checkbox" id="pg-lock"> Lock y-axis to 0–1</label></div>
      <div class="chart" id="pg-spec"></div>
      <div class="chart" id="pg-res"></div>
      <p class="ctitle pg-bars-title">Network outputs: c<sub>k</sub> / scale<sub>k</sub> for each of the ${K} components</p>
      <div class="chart" id="pg-bars"></div>
      <div class="readout" id="pg-readout"></div>
    </div></div>`;
  const q = sel => root.querySelector(sel);
  const inputs = labels.map((lab, i) => { const [name, unit, step] = INFO[lab] || [lab, '', 0.01];
    const w = document.createElement('div'); w.className = 'ctl';
    w.innerHTML = `<div class="row"><label for="pg-sl-${i}">${name}</label><span class="val"><input class="num" type="number" step="any" min="${E.lo[i]}" max="${E.hi[i]}" id="pg-num-${i}" aria-label="${name} value">${unit ? `<span class="unit">${unit}</span>` : ''}</span></div>` +
      `<input type="range" id="pg-sl-${i}" min="${E.lo[i]}" max="${E.hi[i]}" step="${step}" value="${P.presets[d0].theta[i]}">`;
    q(ABUND.includes(lab) ? '.pg-abund' : '.pg-stellar').appendChild(w); return w.querySelector('input[type=range]'); });
  const kIn = q('#pg-k'), tie = q('#pg-tie'), cmp = q('#pg-cmp'), lock = q('#pg-lock');
  const nums = labels.map((_, i) => q('#pg-num-' + i)), kNum = q('#pg-num-k');
  const decs = labels.map(lab => (INFO[lab] || [0, 0, 0, 2])[3]);
  let S = null;

  const drawSpec = chart(q('#pg-spec'), host => { if (!S) return;
    const ys = [S.r.full, S.kk < K ? S.r.part : null, S.cmp ? S.cmp.full : null].filter(Boolean);
    let lo = Infinity, hi = -Infinity; for (const a of ys) for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const F = frame(host, { height: host.clientWidth < 520 ? 200 : 250, x: { min: WL[0], max: WL[n - 1], label: '' }, y: lock.checked ? { min: 0, max: 1.02, ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], label: 'normalised flux' }   // locked: 0-1 (a little headroom for the continuum)
      : { min: Math.max(0, lo - 0.04), max: Math.min(1.15, hi + 0.04), label: 'normalised flux', n: 5 }, margin: { b: 22 }, aria: 'Emulated spectrum' });
    for (const l of CAT) vline(F, l);
    const ser = [];
    if (S.cmp) { line(F, wl, Array.from(S.cmp.full), 'var(--ink-3)', 1.3, { 'stroke-dasharray': '4 3' }); ser.push({ xs: wl, ys: Array.from(S.cmp.full), color: 'var(--ink-3)', name: P.compare.short }); }
    line(F, wl, Array.from(S.r.full), 'var(--ink)', 1.5); ser.unshift({ xs: wl, ys: Array.from(S.r.full), color: 'var(--ink)', name: `all ${K}` });
    // the first-K curve is thinner than the full one, so the full spectrum shows around it where they agree
    if (S.kk < K) { line(F, wl, Array.from(S.r.part), 'var(--s2)', 1.2); ser.push({ xs: wl, ys: Array.from(S.r.part), color: 'var(--s2)', name: `first ${S.kk}` }); }
    crosshair(F, ser, Ang, v => v.toFixed(4)); });
  const drawRes = chart(q('#pg-res'), host => { if (!S) return;
    const d = Array.from(S.r.part, (v, p) => v - S.r.full[p]); let a = 1e-4; for (const v of d) a = Math.max(a, Math.abs(v));
    const F = frame(host, { height: 120, x: { min: WL[0], max: WL[n - 1], label: 'Wavelength (Å, air)' }, y: { min: -a * 1.1, max: a * 1.1, label: 'difference', n: 3, fmt: v => sci(v, 1) }, margin: { t: 6 }, aria: 'Truncation residual' });
    mk('line', { x1: F.m.l, x2: F.m.l + F.pw, y1: F.sy(0), y2: F.sy(0), style: 'stroke:var(--ink-3)' }, F.svg);
    line(F, wl, d, 'var(--s2)', 1.2); crosshair(F, [{ xs: wl, ys: d, color: 'var(--s2)', name: 'difference' }], Ang, v => sci(v, 2)); });
  const drawBars = chart(q('#pg-bars'), host => { if (!S) return;
    const raw = Array.from(S.r.raw); let a = 3; for (const v of raw) a = Math.max(a, Math.abs(v));
    const ticks = [1].concat(niceTicks(0, K, 6).filter(t => t > 1 && t < K - K / 15), [K]);
    const F = frame(host, { height: 150, x: { min: 0.4, max: K + 0.6, label: 'component k', ticks }, y: { min: -a, max: a, n: 4 }, margin: { t: 6 }, aria: 'Network outputs' });
    mk('line', { x1: F.m.l, x2: F.m.l + F.pw, y1: F.sy(0), y2: F.sy(0), style: 'stroke:var(--ink-3)' }, F.svg);
    const bw = Math.max(1.2, F.pw / K - (K > 60 ? 1 : 2)), pts = [];
    raw.forEach((v, k) => { const x = F.sx(k + 1) - bw / 2, y0 = F.sy(0), y1 = F.sy(v), on = k < S.kk;
      mk('rect', { x: x.toFixed(1), y: Math.min(y0, y1).toFixed(1), width: bw.toFixed(1), height: Math.max(1, Math.abs(y1 - y0)).toFixed(1), rx: Math.min(2, bw / 3), style: `fill:${on ? 'var(--s1)' : 'var(--ink-3)'};opacity:${on ? 1 : 0.35}` }, F.plot);
      pts.push({ x: k + 1, y: v, html: `c<sub>${k + 1}</sub> / scale = ${v.toFixed(3)}<br>c<sub>${k + 1}</sub> = ${sci(S.r.c[k], 3)}${on ? '' : ' (dropped)'}` }); });
    pointHover(F, pts, Math.max(12, F.pw / K)); });

  function update() {
    if (tie) { split.forEach(i => { inputs[i].disabled = nums[i].disabled = tie.checked; if (tie.checked) inputs[i].value = inputs[ia].value; }); }
    const theta = inputs.map(x => +x.value), kk = +kIn.value;
    labels.forEach((lab, i) => { if (document.activeElement !== nums[i]) nums[i].value = theta[i].toFixed(decs[i]); });
    if (document.activeElement !== kNum) kNum.value = kk;
    const t0 = performance.now(); const r = emulate(E, theta, kk); const ms = performance.now() - t0;
    const c = cmp && cmp.checked ? emulate(C, theta.slice(0, C.lo.length), C.K) : null;
    let se = 0, sc = 0; for (let p = 0; p < n; p++) { se += (r.part[p] - r.full[p]) ** 2; if (c) sc += (c.full[p] - r.full[p]) ** 2; }
    S = { r, kk, cmp: c }; drawSpec(); drawRes(); drawBars();
    const dist = TRAIN ? nnDist(theta) : null;
    q('#pg-legend').innerHTML = `<span><i class="line" style="background:var(--ink)"></i>Emulator, all ${K} components</span>` +
      (kk < K ? `<span><i class="line" style="background:var(--s2)"></i>First ${kk} components only</span>` : '') +
      (c ? `<span><i class="line" style="background:var(--ink-3)"></i>${P.compare.short} (dashed)</span>` : '');
    q('#pg-readout').innerHTML = (kk < K ? `<span>First ${kk} against all ${K}: RMS <b>${sci(Math.sqrt(se / n), 2)}</b></span>` : '') +
      (c ? `<span>${P.compare.short} against this one: RMS <b>${sci(Math.sqrt(sc / n), 2)}</b></span>` : '') +
      `<span>One evaluation: <b>${ms.toFixed(1)} ms</b> in this browser</span>` +
      (dist === null ? '' : `<span>Nearest training spectrum: <b>${dist.toFixed(3)}</b> box units ${dist > P.nn_cut ? `<span class="warn">· beyond the fit's library cut (${P.nn_cut.toFixed(3)})</span>` : '· inside the library cut'}</span>`);
  }
  root.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
    const p = P.presets[+b.dataset.preset].theta; inputs.forEach((x, i) => { x.value = p[i]; });
    root.querySelectorAll('[data-preset]').forEach(o => o.setAttribute('aria-pressed', o === b ? 'true' : 'false')); update(); }));
  inputs.concat([kIn]).forEach(x => x.addEventListener('input', () => {
    if (x !== kIn) root.querySelectorAll('[data-preset]').forEach(o => o.setAttribute('aria-pressed', 'false')); update(); }));
  // a typed value is clamped to the slider's range and rounded to its nearest step, then handled like a drag
  function commit(num, slider, dec) {
    const v = parseFloat(String(num.value).replace('−', '-'));
    if (!isFinite(v)) { num.value = (+slider.value).toFixed(dec); return; }   // not a number: put the current value back
    const lo = +slider.min, hi = +slider.max, st = +slider.step;
    slider.value = Math.min(hi, Math.max(lo, lo + Math.round((v - lo) / st) * st)).toFixed(dec);
    slider.dispatchEvent(new Event('input'));
    num.value = (+slider.value).toFixed(dec);
  }
  nums.concat([kNum]).forEach((num, j) => {
    const slider = j < nums.length ? inputs[j] : kIn, dec = j < nums.length ? decs[j] : 0;
    num.addEventListener('change', () => commit(num, slider, dec));
    num.addEventListener('keydown', e => { if (e.key === 'Enter') num.blur(); }); });
  [tie, cmp].forEach(x => x && x.addEventListener('change', update));
  lock.addEventListener('change', () => drawSpec());
  emulate(E, P.presets[d0].theta, K);   // warm-up, so the displayed timing is not the first (slow) call
  update();
}

const root = document.getElementById('play-root');
fetch(root.dataset.src).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
  .then(P => mountPlayground(root, P))
  .catch(e => { root.innerHTML = '<p class="loading">Could not load the emulator data (' + e.message + ').</p>'; });
})();
