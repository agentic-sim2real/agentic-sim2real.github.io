/* Page script: theme, the before/after pairs, the results table and charts, the step-by-step replays (loaded on demand), deep links. */
const LIVE = {}, DATA = {}; window.S2R = window.S2R || {data:{}};
const HEAD = {platform:'LEAP hand on a Franka arm', model:'Claude Opus'};
const STAGES = {};

/* ---------- Table 1 of the paper (main.tex, 23 Oct 2026), with PickPlace switched to the second run (user, 23 Oct): the only numbers on this page ---------- */
const ROWS = [
  // Table 1 of the paper (24 Oct): 25 held-out starts for every task, no n or p columns, no footnotes.
  {group:'arm', task:'Strike', hidden:'puck friction ×0.25', z:0, f:100, attr:'yes', diag:'friction ×0.34'},
  {group:'arm', task:'PickPlace', hidden:'camera roll 3.0°, 18 mm', z:28, f:100, attr:'yes', diag:'camera (cube 2.3 cm off)'},   // second run (user, 23 Oct); the paper's Table 1 prints the first run: 28 -> 88, 2.4 cm. DECISION(user) pending.
  {group:'arm', task:'Insert', hidden:'cube mass ×8.3', z:24, f:100, attr:'yes', diag:'mass ×2–4'},
  {group:'arm', task:'Push', hidden:'servo ×0.6, damping ×2.5', z:48, f:100, attr:'partial', diag:'servo ×0.4–0.6'},
  {group:'dex', task:'Reorient', hidden:'cube mass ×2.5', z:36, f:76, attr:'yes', diag:'mass ×2.50'},   // first 25 of the 75 evaluator starts, as in the paper
  {group:'dex', task:'Valve', hidden:'hinge damping ×3', z:0, f:100, attr:'yes', diag:'damping ×3.15'},
  {group:'dex', task:'Spin', hidden:'<i>none (engine only)</i>', z:0, f:92, attr:'no', diag:'cube friction ×3–4'},
  {group:'dex', task:'HandOver', hidden:'gripper servo ×0.4', z:16, f:64, attr:'yes', diag:'servo ×0.40'}];
function buildResults(){
  const tb = document.querySelector('#results-table tbody'); if (!tb) return; tb.innerHTML = '';
  ROWS.forEach(r => {
    const mk = r.attr === 'yes' ? '<span class="mk ok">✓</span>' : r.attr === 'partial' ? '<span class="mk part pmark">✓</span>' : '<span class="mk no">✗</span>';
    const tr = h('tr'); tr.innerHTML = '<td class="task">' + r.task + '</td><td>' + r.hidden + '</td><td class="n num zs">' + r.z + '</td><td class="n num fin">' + r.f + '</td><td class="diag">' + mk + r.diag + '</td>';
    tb.appendChild(tr);
  });
}

/* ---------- static charts (re-drawn on a theme change, since they read the palette) ---------- */
function drawStatic(){
  const wr = document.getElementById('wrist-chart'); if (wr && S2R.figs) { wr.innerHTML = ''; wr.appendChild(wristChart(S2R.figs.wrist, S2R.figs.wrist_facts)); }
  const tl = document.getElementById('timeline-chart');
  if (tl && S2R.figs && S2R.data.cube) { const T = S2R.figs.timeline, ev = S2R.data.cube.data.evals; const ends = T.deploys.map(d => d.end);
    // the evaluator ran after each diagnosis: zero-shot before the run, then after the three later deployments
    const pts = [[0, ev.zeroshot], [ends[1], ev.iter2], [ends[2], ev.iter3], [ends[3], ev.final]]; tl.innerHTML = ''; tl.appendChild(runTimeline(T, pts)); }
}

/* ---------- theme ---------- */
(function(){
  const b = document.getElementById('theme'), root = document.documentElement; if (!b) return; let saved = null; try { saved = localStorage.getItem('s2r-theme'); } catch (e) {}
  if (saved) root.dataset.theme = saved;
  const isDark = () => root.dataset.theme === 'dark' || (!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const label = () => { b.textContent = isDark() ? 'Light' : 'Dark'; };
  b.addEventListener('click', () => { root.dataset.theme = isDark() ? 'light' : 'dark'; try { localStorage.setItem('s2r-theme', root.dataset.theme); } catch (e) {} label(); drawStatic(); for (const k in STAGES) STAGES[k].goto(STAGES[k].cur || 0); });
  label();
})();

/* ---------- before / after pairs: play together while in view, loop together ---------- */
document.querySelectorAll('.pair').forEach(pair => {
  const vids = Array.from(pair.querySelectorAll('video')); if (!vids.length) return; let ended = 0, visible = false;
  const restart = () => { ended = 0; vids.forEach(v => { v.currentTime = 0; if (visible) v.play().catch(() => {}); }); };
  vids.forEach(v => { v.addEventListener('playing', () => v.classList.add('on')); v.addEventListener('ended', () => { if (++ended >= vids.length) setTimeout(() => { if (visible) restart(); }, 900); }); });
  const io = new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; if (visible) { if (vids.every(v => v.paused)) restart(); } else vids.forEach(v => v.pause()); }), {threshold:0.3});
  io.observe(pair);
});

/* ---------- teaser: the page's own labels and a task strip follow the montage (segment times and posters from data/teaser.js).
   Click a task: the video loops over that task alone until "Play all" or a second click on the same task. ---------- */
(function(){
  const v = document.getElementById('teaser'), segs = document.getElementById('teaser-segs'); if (!v || !segs || !S2R.teaser) return;
  const S = S2R.teaser, $ = id => document.querySelector('.teaser [data-id="' + id + '"]'); let cur = -1, lock = -1;
  const mode = $('mode'), all = $('all');
  function unlock(){ lock = -1; segs.classList.remove('lock'); if (mode) mode.textContent = 'All eight tasks, in turn'; if (all) all.hidden = true; v.play().catch(() => {}); }
  S.forEach((s, i) => {
    const b = h('button', '', '<span class="th"><img src="' + s.img + '" alt="" loading="lazy"><i></i></span><b>' + s.label + '</b><span class="g">' + s.gap.replace(', ', ',<br>') + '</span>');
    b.type = 'button'; b.title = 'Watch ' + s.label + ' on repeat';
    b.addEventListener('click', () => { if (lock === i) { unlock(); return; } lock = i; segs.classList.add('lock'); v.currentTime = s.t0 + 0.05; v.play().catch(() => {}); if (mode) mode.textContent = s.label + ' on repeat'; if (all) all.hidden = false; });
    segs.appendChild(b);
  });
  if (all) all.addEventListener('click', unlock);
  const B = Array.from(segs.querySelectorAll('button')), bars = B.map(b => b.querySelector('.th i'));
  function tick(){
    let tm = v.currentTime || 0;
    if (lock >= 0) { const L = S[lock]; if (tm < L.t0 - 0.02 || tm >= L.t1 - 0.08) { v.currentTime = L.t0 + 0.05; tm = L.t0 + 0.05; } }
    let i = S.findIndex(s => tm < s.t1); if (i < 0) i = S.length - 1; const s = S[i];
    if (i !== cur) { cur = i; $('s0').textContent = s.s0; $('s1').textContent = s.s1; $('spA').textContent = s.spA; $('spB').textContent = s.spB; B.forEach((b, j) => b.classList.toggle('on', j === i)); }
    bars.forEach((bar, j) => { bar.style.width = j === i ? Math.min(100, 100 * (tm - s.t0) / (s.t1 - s.t0)) + '%' : '0'; });
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ---------- setup figure: the eight real-world clips loop while in view ---------- */
document.querySelectorAll('.tasks8 video').forEach(v => { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), {threshold:0.2}); io.observe(v); });

/* ---------- replays ---------- */
function loadScript(src){ return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const sio = new IntersectionObserver(es => es.forEach(en => { const st = Object.values(STAGES).find(s => s.sec === en.target); if (st) st.setPlaying(en.intersectionRatio >= 0.45); }), {threshold:[0, 0.45, 1]});
async function openReplay(det, start){
  const k = det.dataset.task;
  if (!STAGES[k]) {
    const host = det.querySelector('.stage-host'); host.innerHTML = '<p class="caption">Loading the trial…</p>';
    try { if (!S2R.data[k]) await loadScript('data/' + k + '.js'); } catch (e) { host.innerHTML = '<p class="caption">The replay data could not be loaded.</p>'; return; }
    LIVE[k] = S2R.data[k].live; DATA[k] = S2R.data[k].data; host.innerHTML = ''; const sec = h('section', 'demo'); host.appendChild(sec);
    STAGES[k] = Stage(sec, k, HEAD); sio.observe(sec); window.activeStage = STAGES[k];
  }
  if (start != null) STAGES[k].goto(start);
}
document.querySelectorAll('details.replay').forEach(det => det.addEventListener('toggle', () => { if (det.open) openReplay(det); else if (STAGES[det.dataset.task]) STAGES[det.dataset.task].setPlaying(false); }));
document.addEventListener('keydown', e => { const a = window.activeStage; if (!a) return; if (e.key === 'ArrowRight') { a.show(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { a.show(-1); e.preventDefault(); } });

/* ---------- boot ---------- */
buildResults(); drawStatic();
document.querySelectorAll('details.replay[open]').forEach(det => openReplay(det));
try {
  const m = /^#([a-z]+)(?:-p(\d+))?$/.exec(location.hash); const det = m && document.querySelector('details.replay[data-task="' + m[1] + '"]');
  if (det) { const art = det.closest('.task'); if (art) art.scrollIntoView(); det.open = true; openReplay(det, m[2] ? Math.max(0, +m[2] - 1) : null); }
} catch (e) {}

/* ---------- tabbed trial stage (versions with one stage and a task switch) ---------- */
(function(){
  const tabs = document.getElementById('trial-tabs'), host = document.getElementById('trial-host'); if (!tabs || !host) return;
  const KEYS = ['striker', 'pick', 'insert', 'push', 'cube', 'valve', 'spin', 'handover']; let curKey = null, cur = null;
  KEYS.forEach((k, i) => { const b = h('button', (i === 3 ? 'grp' : ''), '<span class="n">' + TASKS[k].label + '</span><b>' + TASKS[k].sub + '</b><i></i>'); b.dataset.task = k; b.type = 'button'; b.addEventListener('click', () => openTab(k)); tabs.appendChild(b); });
  async function openTab(k, start){
    if (curKey === k && cur) { if (start != null) cur.goto(start); return; }
    tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.task === k));
    if (cur) { cur.setPlaying(false); sio.unobserve(cur.sec); } host.innerHTML = '<p class="caption">Loading the trial…</p>';
    try { if (!S2R.data[k]) await loadScript('data/' + k + '.js'); } catch (e) { host.innerHTML = '<p class="caption">The replay data could not be loaded.</p>'; return; }
    LIVE[k] = S2R.data[k].live; DATA[k] = S2R.data[k].data; host.innerHTML = ''; const sec = h('section', 'demo'); host.appendChild(sec);
    cur = Stage(sec, k, HEAD); curKey = k; sio.observe(sec); window.activeStage = cur; if (start != null) cur.goto(start);
    try { history.replaceState(null, '', '#' + k); } catch (e) {}
  }
  let k0 = host.dataset.default || 'cube', s0 = null;
  try { const m = /^#([a-z]+)(?:-p(\d+))?$/.exec(location.hash); if (m && TASKS[m[1]]) { k0 = m[1]; s0 = m[2] ? Math.max(0, +m[2] - 1) : null; } } catch (e) {}
  openTab(k0, s0);
})();
