/* Chart helpers of the replay stage (inherited from the trial demo page) and the page's own charts. Colours are read from the palette at draw time. */
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const svg = (w, hh) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${hh}`); s.setAttribute('class', 'chart'); s.setAttribute('preserveAspectRatio', 'xMidYMid meet'); return s; };
const el = (s, tag, attrs, text) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; s.appendChild(e); return e; };
const TAU = 2 * Math.PI;
function dotPairs(B, rk, sk, o){
  const real = B[rk], sim = B[sk], n = real.length; const W = 600, H = 150, L = o.L || 30, R = 10, T = 22, B0 = 24; const s = svg(W, H);
  const lo = o.lo != null ? o.lo : 0, hi = o.hi != null ? o.hi : Math.max(o.min || 0, ...sim, ...real);
  const x = i => L + (i + .5) * (W - L - R) / n, y = v => T + (hi - Math.min(Math.max(v, lo), hi)) * (H - T - B0) / (hi - lo);
  (o.ticks || []).forEach(v => { if (v >= lo && v <= hi) { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, o.fmt ? o.fmt(v) : v); } });
  if (o.success != null) { el(s, 'line', {x1:L, x2:W - R, y1:y(o.success), y2:y(o.success), stroke:css('--good'), 'stroke-dasharray':'4 3', 'stroke-width':1}); el(s, 'text', {x:W - R, y:y(o.success) - 5, 'text-anchor':'end', class:'lbl'}, o.successLabel); }
  for (let i = 0; i < n; i++) { el(s, 'line', {x1:x(i), x2:x(i), y1:y(sim[i]), y2:y(real[i]), stroke:css('--line'), 'stroke-width':1.5}); el(s, 'circle', {cx:x(i), cy:y(sim[i]), r:4.4, fill:'none', stroke:css('--sim'), 'stroke-width':1.8});
    el(s, 'circle', {cx:x(i), cy:y(real[i]), r:4.6, fill:o.success != null ? (real[i] >= o.success ? css('--good') : css('--bad')) : css('--real')}); el(s, 'text', {x:x(i), y:H - 8, 'text-anchor':'middle'}, B.episodes[i].replace('ep00', 'ep')); }
  (o.labels || []).forEach(([v, txt, color, above]) => el(s, 'text', {x:W - R, y:y(v) + (above ? -7 : 15), 'text-anchor':'end', class:'lbl', style:color ? 'fill:' + color : ''}, txt));
  return s;
}
function linesChart(series, o){
  const W = 600, H = 150, L = o.L || 36, R = 10, T = 22, B0 = 24; const s = svg(W, H); const n = series[0][0].length, ymax = o.ymax;
  const x = i => L + i * (W - L - R) / (n - 1), y = v => T + (ymax - Math.min(v, ymax)) * (H - T - B0) / ymax;
  o.ticks.forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v + o.unit); });
  [[0, 'start'], [Math.floor((n - 1) / 2), 'middle'], [n - 1, 'end']].forEach(([i, a], k) => el(s, 'text', {x:x(i), y:H - 8, 'text-anchor':a}, k + ' s'));
  series.forEach(([arr, color, dash]) => el(s, 'path', {d:arr.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '), fill:'none', stroke:color, 'stroke-width':2, 'stroke-dasharray':dash || 'none'}));
  let lx = L + 6; series.forEach(([arr, color, dash, label]) => { el(s, 'line', {x1:lx, x2:lx + 16, y1:9, y2:9, stroke:color, 'stroke-width':2, 'stroke-dasharray':dash || 'none'}); el(s, 'text', {x:lx + 21, y:12.5, class:'lbl'}, label + ' ' + arr[arr.length - 1].toFixed(1) + o.unit); lx += 21 + label.length * 6.6 + 62; });
  return s;
}
function scanChart(pts, realv, o){
  const W = 600, H = 150, L = 40, R = 14, T = 24, B0 = 24; const s = svg(W, H);
  const x = m => L + (m - o.x0) * (W - L - R) / (o.x1 - o.x0), y = v => T + (o.hi - v) * (H - T - B0) / (o.hi - o.lo);
  o.ticks.forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v + o.unit); });
  o.xs.forEach(m => el(s, 'text', {x:x(m), y:H - 8, 'text-anchor':'middle'}, '×' + m));
  el(s, 'line', {x1:L, x2:W - R, y1:y(realv), y2:y(realv), stroke:css('--real'), 'stroke-width':1.5, 'stroke-dasharray':'5 4'}); el(s, 'text', {x:L + 6, y:y(realv) + (o.realBelow ? 14 : -6), class:'lbl'}, o.realLabel);
  if (o.line) el(s, 'path', {d:'M' + x(o.line[0][0]) + ' ' + y(o.line[0][1]) + ' L' + x(o.line[1][0]) + ' ' + y(o.line[1][1]), fill:'none', stroke:css('--sim'), 'stroke-width':1.2, opacity:.5});
  else el(s, 'path', {d:pts.map(([m, v], i) => (i ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '), fill:'none', stroke:css('--sim'), 'stroke-width':1.2, opacity:.5});
  pts.forEach(([m, v, lab]) => { const above = v < (o.lo + o.hi) / 2 && m < o.x1 - 0.3; el(s, 'circle', {cx:x(m), cy:y(v), r:4.6, fill:css('--sim')}); el(s, 'text', {x:x(m) + (m >= o.x1 - 0.3 ? -8 : 8), y:y(v) + (above ? -8 : 14), class:'lbl', 'text-anchor':m >= o.x1 - 0.3 ? 'end' : 'start'}, lab); });
  el(s, 'text', {x:L, y:9, class:'lbl'}, o.title);
  return s;
}
function curveChart(curves, name){
  const C = curves[name].curve; const W = 600, H = 150, L = 40, R = 14, T = 16, B0 = 24; const s = svg(W, H); const ys = C.map(c => c[1]); const span = Math.max(...ys) - Math.min(...ys); const stp = [5, 10, 20, 50, 100, 200, 250, 500].find(v => span / v <= 6) || 500; const lo = Math.floor(Math.min(...ys) / stp) * stp, hi = Math.ceil(Math.max(...ys) / stp) * stp; const xmax = C[C.length - 1][0];
  const x = v => L + v / xmax * (W - L - R), y = v => T + (hi - v) * (H - T - B0) / (hi - lo);
  for (let v = lo; v <= hi; v += stp) { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v); }
  [0, 0.25, 0.5, 0.75, 1].forEach(f => el(s, 'text', {x:x(f * xmax), y:H - 8, 'text-anchor':f == 0 ? 'start' : f == 1 ? 'end' : 'middle'}, Math.round(f * xmax / 1e6) + ' M'));
  el(s, 'path', {d:C.map((c, i) => (i ? 'L' : 'M') + x(c[0]).toFixed(1) + ' ' + y(c[1]).toFixed(1)).join(' '), fill:'none', stroke:css('--c-train'), 'stroke-width':2});
  el(s, 'circle', {cx:x(C[C.length - 1][0]), cy:y(C[C.length - 1][1]), r:4, fill:css('--c-train')}); el(s, 'text', {x:L, y:9, class:'lbl'}, 'episode reward in the simulator · steps');
  return s;
}
function profileChart(P){
  const W = 600, H = 150, L = 40, R = 14, T = 20, B0 = 24; const s = svg(W, H); const x0 = 0.5, x1 = 1.7;
  const x = m => L + (m - x0) * (W - L - R) / (x1 - x0), y = v => T + (100 - v) * (H - T - B0) / 100;
  el(s, 'rect', {x:x(P.real_band[0]), y:T, width:x(P.real_band[1]) - x(P.real_band[0]), height:H - T - B0, fill:css('--real'), opacity:.08}); el(s, 'text', {x:(x(P.real_band[0]) + x(P.real_band[1])) / 2, y:T - 6, 'text-anchor':'middle', class:'lbl'}, 'real robot, from its scores');
  [0, 50, 100].forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v + '%'); });
  [0.6, 0.9, 1.2, 1.35, 1.6].forEach(m => el(s, 'text', {x:x(m), y:H - 8, 'text-anchor':'middle'}, 'μ ' + m));
  [['spin_cf_v2', css('--muted'), '4 3'], ['spin_cf_v3', css('--good'), null]].forEach(([k, color, dash]) => { const pts = P[k]; el(s, 'path', {d:pts.map(([m, v], i) => (i ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '), fill:'none', stroke:color, 'stroke-width':2, 'stroke-dasharray':dash || 'none'});
    pts.forEach(([m, v]) => el(s, 'circle', {cx:x(m), cy:y(v), r:4.4, fill:color})); const last = pts[pts.length - 1]; el(s, 'text', {x:x(last[0]) + 8, y:y(last[1]) + 4, class:'lbl', style:'fill:' + color}, k); });
  return s;
}
function outcomePairs(B, o){
  const n = B.episodes.length; const W = 600, H = 150, L = 36, R = 10, T = 22, B0 = 24; const s = svg(W, H); const hi = 95;
  const x = i => L + (i + .5) * (W - L - R) / n, y = v => T + (hi - Math.min(v, hi)) * (H - T - B0) / hi;
  [0, 30, 60, 90].forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v + '°'); });
  el(s, 'line', {x1:L, x2:W - R, y1:y(60), y2:y(60), stroke:css('--bad'), 'stroke-dasharray':'4 3', 'stroke-width':1}); el(s, 'text', {x:W - R, y:y(60) - 5, 'text-anchor':'end', class:'lbl'}, 'box swivels past 60°');
  for (let i = 0; i < n; i++) { const rt = B.real_tilt[i], st = B.sim_tilt[i];
    if (st != null && rt != null) el(s, 'line', {x1:x(i), x2:x(i), y1:y(st), y2:y(rt), stroke:css('--line'), 'stroke-width':1.5});
    if (st != null) el(s, 'circle', {cx:x(i), cy:y(st), r:4.4, fill:'none', stroke:css('--sim'), 'stroke-width':1.8}); else el(s, 'text', {x:x(i), y:y(0) + 4, 'text-anchor':'middle', style:'fill:' + css('--sim') + ';font-size:12px'}, '×');
    if (rt != null) el(s, 'circle', {cx:x(i), cy:y(rt), r:4.6, fill:B.real_success[i] ? css('--good') : css('--bad')}); else el(s, 'text', {x:x(i), y:y(0) + 4, 'text-anchor':'middle', style:'fill:' + css('--bad') + ';font-size:13px;font-weight:700'}, '×');
    el(s, 'text', {x:x(i), y:H - 8, 'text-anchor':'middle'}, B.episodes[i].replace('ep00', 'ep')); }
  el(s, 'text', {x:L + 4, y:9, class:'lbl'}, '× = never picked up · filled green/red = real success/failure · hollow = simulator');
  return s;
}
function offsetPairs(B, o){
  // per-episode final offset of the object from its goal (cm): hollow = the agent's simulator from the same start, filled = real, band = success zone
  const n = B.episodes.length; const W = 600, H = 150, L = 40, R = 10, T = 22, B0 = 24; const s = svg(W, H); const lo = o.lo, hi = o.hi;
  const x = i => L + (i + .5) * (W - L - R) / n, y = v => T + (hi - Math.min(Math.max(v, lo), hi)) * (H - T - B0) / (hi - lo);
  if (o.band) { el(s, 'rect', {x:L, y:y(o.band[1]), width:W - L - R, height:y(o.band[0]) - y(o.band[1]), fill:css('--good'), opacity:.12}); el(s, 'text', {x:W - R, y:y(o.band[1]) - 5, 'text-anchor':'end', class:'lbl'}, o.bandLabel || 'success zone'); }
  o.ticks.forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, (v > 0 && o.signed ? '+' : '') + v + (o.unit || '')); });
  for (let i = 0; i < n; i++) { const rv = B.real[i], sv = B.sim[i]; el(s, 'line', {x1:x(i), x2:x(i), y1:y(sv), y2:y(rv), stroke:css('--line'), 'stroke-width':1.5});
    el(s, 'circle', {cx:x(i), cy:y(sv), r:4.4, fill:'none', stroke:css('--sim'), 'stroke-width':1.8}); el(s, 'circle', {cx:x(i), cy:y(rv), r:4.6, fill:B.real_success[i] ? css('--good') : css('--bad')});
    if (rv > hi) el(s, 'text', {x:x(i), y:T - 6, 'text-anchor':'middle', class:'lbl'}, '+' + Math.round(rv)); el(s, 'text', {x:x(i), y:H - 8, 'text-anchor':'middle'}, B.episodes[i].replace('ep00', 'ep')); }
  return s;
}
function fitChart(D, o){
  // the agent's stopping-distance law: travel against v^2, its simulator sweep and its instrumented real episodes, with its two fits
  const W = 600, H = 160, L = 44, R = 14, T = 22, B0 = 26; const s = svg(W, H); const x0 = 0, x1 = 3.4, lo = 0, hi = 0.7;
  const x = v => L + (v - x0) * (W - L - R) / (x1 - x0), y = v => T + (hi - v) * (H - T - B0) / (hi - lo);
  [0, 0.2, 0.4, 0.6].forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, (100 * v).toFixed(0) + ' cm'); });
  [0, 1, 2, 3].forEach(v => el(s, 'text', {x:x(v), y:H - 8, 'text-anchor':'middle'}, 'v² = ' + v));
  const line = (c, color, dash, label, lx) => { const xe = Math.min(x1, hi / c); el(s, 'path', {d:'M' + x(0) + ' ' + y(0) + ' L' + x(xe) + ' ' + y(c * xe), fill:'none', stroke:color, 'stroke-width':1.6, 'stroke-dasharray':dash || 'none', opacity:.8}); el(s, 'text', {x:x(lx), y:y(c * lx) - 7, class:'lbl', style:'fill:' + color}, label); };
  line(D.fit.sim_C1, css('--sim'), null, 'simulator · μ 0.30', 2.6); if (o.real) line(D.fit.real_C1, css('--real'), null, 'real · μ 0.095', 0.55);
  D.sweep_sim.forEach(([v, t]) => el(s, 'circle', {cx:x(v * v), cy:y(t), r:3.8, fill:'none', stroke:css('--sim'), 'stroke-width':1.6}));
  if (o.real) D.sweep_real.forEach(([v, t]) => el(s, 'circle', {cx:x(v * v), cy:y(t), r:4.2, fill:css('--real')}));
  el(s, 'text', {x:L, y:9, class:'lbl'}, o.title || '');
  return s;
}
function codeBlock(lines){
  const g = h('div', 'code'); lines.forEach(([txt, cls]) => g.appendChild(h('div', 'ln' + (cls ? ' ' + cls : ''), txt))); return g;
}
function xyChart(pts, o){
  // measured points with an optional straight-line fit: x and y in the units given
  const W = 600, H = 150, L = 46, R = 14, T = 22, B0 = 26; const s = svg(W, H);
  const x = v => L + (v - o.x0) * (W - L - R) / (o.x1 - o.x0), y = v => T + (o.hi - v) * (H - T - B0) / (o.hi - o.lo);
  o.yticks.forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, (v > 0 && o.signed ? '+' : '') + v + o.yunit); });
  o.xticks.forEach(v => el(s, 'text', {x:x(v), y:H - 8, 'text-anchor':'middle'}, (v > 0 && o.signed ? '+' : '') + v + o.xunit));
  if (o.fit) { const [m, c] = o.fit; el(s, 'path', {d:'M' + x(o.x0) + ' ' + y(m * o.x0 + c) + ' L' + x(o.x1) + ' ' + y(m * o.x1 + c), fill:'none', stroke:css('--real'), 'stroke-width':1.6, opacity:.75}); if (m < 0) el(s, 'text', {x:L + 6, y:y(m * o.x0 + c) - 8, class:'lbl'}, o.fitLabel || ''); else el(s, 'text', {x:W - R, y:y(m * o.x1 + c) - 7, 'text-anchor':'end', class:'lbl'}, o.fitLabel || ''); }
  pts.forEach(([px, py]) => el(s, 'circle', {cx:x(px), cy:y(py), r:4.6, fill:css('--real')}));
  el(s, 'text', {x:L, y:9, class:'lbl'}, o.title || '');
  return s;
}
function tableEl(head, rows){
  const t = h('table', 'meas'); const tr = h('tr'); head.forEach(c => tr.appendChild(h('th', '', c))); t.appendChild(tr);
  rows.forEach(r => { const tr2 = h('tr'); r.forEach((c, i) => tr2.appendChild(h('td', i ? 'num' : '', c))); t.appendChild(tr2); }); return t;
}
function suspectsEl(rows){ const g = h('div', 'suspects'); rows.forEach(([c, t, cls]) => { const s = h('div', 's' + (cls ? ' ' + cls : '')); s.appendChild(h('div', 'c num', c.toFixed(2) + '<i><b style="width:' + (c * 100) + '%"></b></i>')); s.appendChild(h('div', '', t)); g.appendChild(s); }); return g; }
function hbars(rows, o){
  const W = 600, H = o.H || 150, L = o.L || 200, R = 60, T = 12, B0 = 26; const s = svg(W, H); const x = v => L + v * (W - L - R) / 100, rh = (H - T - B0) / rows.length;
  [0, 25, 50, 75, 100].forEach(v => { el(s, 'line', {x1:x(v), x2:x(v), y1:T, y2:H - B0, class:'grid'}); el(s, 'text', {x:x(v), y:H - 8, 'text-anchor':'middle'}, v + '%'); });
  rows.forEach(([lab, v, c, suffix], i) => { const yy = T + i * rh; el(s, 'text', {x:L - 10, y:yy + rh / 2 + 4, 'text-anchor':'end', class:'lbl'}, lab); el(s, 'rect', {x:x(0), y:yy + rh * .22, width:Math.max(2, x(v) - x(0)), height:rh * .56, rx:3, fill:c == 'good' ? css('--good') : c == 'bad' ? css('--bad') : css('--muted')}); el(s, 'text', {x:x(v) + 7, y:yy + rh / 2 + 4, class:'lbl'}, v + '%' + (suffix || '')); });
  if (o.ceiling) { el(s, 'line', {x1:x(o.ceiling[0]), x2:x(o.ceiling[0]), y1:T - 2, y2:H - B0, stroke:css('--ink2'), 'stroke-dasharray':'4 3', 'stroke-width':1.2}); el(s, 'text', {x:x(o.ceiling[0]), y:T - 2, 'text-anchor':'middle', class:'lbl'}, o.ceiling[1]); }
  return s;
}
function torqueBins(L1, L2){
  const W = 600, H = 170, L = 50, R = 14, T = 30, B0 = 36; const s = svg(W, H); const xmax = 2.4, ymax = 0.45;
  const x = v => L + v / xmax * (W - L - R), y = v => T + (ymax - v) / ymax * (H - T - B0);
  [0, 0.1, 0.2, 0.3, 0.4].forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v.toFixed(1) + ' N m'); });
  [0, 0.5, 1, 1.5, 2].forEach(v => el(s, 'text', {x:x(v), y:H - B0 + 16, 'text-anchor':'middle'}, v + ' rad/s')); el(s, 'text', {x:(L + W - R) / 2, y:H - 4, 'text-anchor':'middle', class:'lbl'}, 'wheel turning rate');
  [[L1, css('--sim'), 'simulator, nominal hinge'], [L2, css('--real'), 'real, hinge ×3']].forEach(([Lv, color, label], si) => {
    const r = Lv.rate_all, t = Lv.tz_all; for (let i = 0; i < r.length; i += 2) if (r[i] > -0.5) el(s, 'circle', {cx:x(Math.min(Math.max(r[i], 0), xmax)), cy:y(Math.max(0, Math.min(t[i], ymax))), r:2, fill:color, opacity:.2});
    const bins = []; for (let b0 = 0.15; b0 < xmax; b0 += 0.3) { const ys = []; r.forEach((v, i) => { if (v >= b0 && v < b0 + 0.3) ys.push(t[i]); }); if (ys.length >= 12) { ys.sort((p, q) => p - q); const med = ys[ys.length >> 1]; if (med > 0.02) bins.push([b0 + 0.15, med]); } }
    bins.forEach(([bx, by]) => el(s, 'circle', {cx:x(bx), cy:y(Math.min(by, ymax)), r:5.5, fill:color, stroke:css('--panel'), 'stroke-width':2}));
    el(s, 'path', {d:bins.map(([bx, by], i) => (i ? 'L' : 'M') + x(bx).toFixed(1) + ' ' + y(Math.min(by, ymax)).toFixed(1)).join(' '), fill:'none', stroke:color, 'stroke-width':1.5, 'stroke-dasharray':'3 3'});
    el(s, 'circle', {cx:L + 10, cy:T - 20 + si * 14, r:4.5, fill:color}); el(s, 'text', {x:L + 22, y:T - 16 + si * 14, class:'lbl', style:'fill:' + color}, label + ' · median torque per rate bin');
  });
  return s;
}

/* ---------- added for the project page ---------- */
function fitChart2(D, o){
  // the striker agent's stopping law: travel from the release point against v^2; its 15-strike simulator sweep (hollow blue) and its
  // 8 instrumented real strikes (orange), with the two fits it stated (sim d = v^2 / 4.45; real d = 0.661 v^2 + 0.021)
  const W = 600, H = 160, L = 44, R = 14, T = 22, B0 = 26; const s = svg(W, H); const x0 = 0, x1 = 4.0, lo = 0, hi = 0.95;
  const x = v => L + (v - x0) * (W - L - R) / (x1 - x0), y = v => T + (hi - v) * (H - T - B0) / (hi - lo);
  [0, 0.25, 0.5, 0.75].forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, (100 * v).toFixed(0) + ' cm'); });
  [0, 1, 2, 3, 4].forEach(v => el(s, 'text', {x:x(v), y:H - 8, 'text-anchor':'middle'}, 'v² = ' + v));
  const line = (c1, c0, color, label, lx) => { const xe = Math.min(x1, (hi - c0) / c1); el(s, 'path', {d:'M' + x(0) + ' ' + y(c0) + ' L' + x(xe) + ' ' + y(c0 + c1 * xe), fill:'none', stroke:color, 'stroke-width':1.6, opacity:.8}); el(s, 'text', {x:x(lx), y:y(c0 + c1 * lx) - 7, class:'lbl', style:'fill:' + color}, label); };
  line(D.fit.sim_C1, D.fit.sim_C0, css('--sim'), 'simulator · d = v² / 4.45 · μ 0.30', 2.6); if (o.real) line(D.fit.real_C1, D.fit.real_C0, css('--real'), 'real · d = 0.661 v² + 0.021 · μ ≈ 0.10', 0.95);
  D.sweep_sim.forEach(([v, t]) => el(s, 'circle', {cx:x(v * v), cy:y(t), r:3.8, fill:'none', stroke:css('--sim'), 'stroke-width':1.6}));
  if (o.real) D.sweep_real.forEach(([v, t]) => el(s, 'circle', {cx:x(v * v), cy:y(t), r:4.2, fill:css('--real')}));
  el(s, 'text', {x:L, y:9, class:'lbl'}, o.title || '');
  return s;
}

function wristChart(Wd, F){
  // Reorient run: wrist force F_z (N) over the 50 s episode, real world (PhysX, orange) against the agent's simulator (MuJoCo, blue),
  // for the first deployment (nominal simulator) and the second (simulator cube mass ×2.5). Values clipped at 16 N as in the paper figure.
  const W = 640, H = 300, L = 46, R = 70, T = 22, PB = 18, B0 = 30; const s = svg(W, H); s.setAttribute('class', 'chart');
  const t = Wd.t_s, n = t.length, cap = 16; const ph = (H - T - B0 - PB) / 2;
  const panels = [['deployment 1 · nominal simulator', 'real_ep0001', 'sim_ep0001', F.fz_median_dep1], ['deployment 2 · simulator cube mass ×2.5', 'real_ep0012', 'sim_ep0012', F.fz_median_dep2]];
  panels.forEach(([title, rk, sk, med], pi) => {
    const top = T + pi * (ph + PB); const lo = 6, hi = cap;
    const x = i => L + i * (W - L - R) / (n - 1), y = v => top + (hi - Math.min(v, hi)) * ph / (hi - lo);
    [8, 12, 16].forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v); });
    el(s, 'text', {x:L + 4, y:top + 11, class:'lbl'}, title);
    [[sk, css('--sim')], [rk, css('--real')]].forEach(([k, color]) => el(s, 'path', {d:Wd[k].map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '), fill:'none', stroke:color, 'stroke-width':1.1, opacity:.95}));
    const same = Math.abs(med.real - med.sim) < 0.2;
    if (same) el(s, 'text', {x:W - R + 6, y:y(med.real) + 4, class:'lbl'}, 'both ' + med.real.toFixed(1) + ' N');
    else { el(s, 'text', {x:W - R + 6, y:y(med.real) + 4, class:'lbl', style:'fill:' + css('--real')}, med.real.toFixed(1) + ' N'); el(s, 'text', {x:W - R + 6, y:y(med.sim) + 4, class:'lbl', style:'fill:' + css('--sim')}, med.sim.toFixed(1) + ' N'); }
    if (pi === 1) [0, 10, 20, 30, 40, 50].forEach(v => el(s, 'text', {x:x(Math.round(v / 50 * (n - 1))), y:H - 10, 'text-anchor':'middle'}, v + ' s'));
  });
  el(s, 'text', {x:12, y:T + (H - T - B0) / 2, 'text-anchor':'middle', class:'lbl', transform:'rotate(-90 12 ' + (T + (H - T - B0) / 2) + ')'}, 'wrist force F₂ (N)');
  return s;
}

function runTimeline(Tl, ev){
  // Reorient run: hidden-evaluator success after each checkpoint (the first 25 of its 75 held-out starts, as in the paper) against minutes into the run, with the real
  // batches the agent saw, its two retrainings and the time of each diagnosis.
  const W = 640, H = 260, L = 46, R = 16, T = 54, B0 = 34; const s = svg(W, H); s.setAttribute('class', 'chart');
  const tmax = 88; const x = m => L + m / tmax * (W - L - R), y = v => T + (100 - v) * (H - T - B0) / 100;
  [0, 50, 100].forEach(v => { el(s, 'line', {x1:L, x2:W - R, y1:y(v), y2:y(v), class:'grid'}); el(s, 'text', {x:L - 6, y:y(v) + 3.5, 'text-anchor':'end'}, v + '%'); });
  [0, 20, 40, 60, 80].forEach(m => el(s, 'text', {x:x(m), y:H - 12, 'text-anchor':'middle'}, m + ' min'));
  Tl.deploys.forEach(d => el(s, 'rect', {x:x(d.start), y:T, width:Math.max(2, x(d.end) - x(d.start)), height:H - T - B0, fill:css('--real'), opacity:.14}));
  Tl.trainings.forEach(tr => { el(s, 'rect', {x:x(tr.start), y:T - 30, width:x(tr.end) - x(tr.start), height:18, rx:3, fill:css('--sim')}); el(s, 'text', {x:(x(tr.start) + x(tr.end)) / 2, y:T - 17, 'text-anchor':'middle', class:'lbl', style:'fill:#fff'}, tr.policy === 'mass25' ? 'retrain · cube mass ×2.5' : 'retrain · + finger friction 0.6'); });
  Tl.diagnoses.forEach((d, i) => { el(s, 'path', {d:'M0 -6 L6 0 L0 6 L-6 0 Z', transform:'translate(' + x(d.time) + ' ' + (T - 44) + ')', fill:css('--ink')}); el(s, 'text', {x:x(d.time), y:T - 52, 'text-anchor':'middle', class:'lbl'}, String(i + 1)); });
  // the evaluator's step curve: the checkpoints in order, held until the next one
  const pts = ev; let d = ''; pts.forEach(([m, v], i) => { d += (i ? ' L' + x(m) + ' ' + y(pts[i - 1][1]) + ' L' : 'M') + x(m) + ' ' + y(v); }); d += ' L' + x(tmax) + ' ' + y(pts[pts.length - 1][1]);
  el(s, 'path', {d, fill:'none', stroke:css('--ink'), 'stroke-width':2});
  pts.forEach(([m, v], i) => { el(s, 'circle', {cx:x(m), cy:y(v), r:4.5, fill:css('--ink')}); el(s, 'text', {x:x(m) + (i === pts.length - 1 ? 8 : 8), y:y(v) + (i === 0 ? 16 : -8), class:'lbl'}, v + '%'); });
  Tl.deploys.forEach(dp => { const v = 100 * dp.successes / dp.n; el(s, 'circle', {cx:x(dp.real_end), cy:y(v), r:5, fill:'none', stroke:css('--real'), 'stroke-width':2}); el(s, 'text', {x:x(dp.real_end) + 8, y:y(v) + 4, class:'lbl', style:'fill:' + css('--real')}, dp.successes + '/' + dp.n + (dp.policy === 'mass25_fric6' ? ' · rejected' : '')); });
  return s;
}
