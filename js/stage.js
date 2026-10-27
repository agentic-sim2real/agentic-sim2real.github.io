/* Replay stage: one trial, phase by phase. Inherited from the trial demo page (October 2026) and restyled; one stage per task,
   mounted when the task's "step by step" block is opened. Clips are separate mp4 files; the per-frame readouts and evidence data
   come from data/<task>.js (globals LIVE[task], DATA[task]). */
const STAGE_HTML = `
<header>
  <div class="eyebrow" data-id="h-eyebrow"></div>
  <h2 data-id="h-title"></h2>
  <div class="facts" data-id="h-facts"></div>
</header>
<div class="ctl">
  <div class="transport">
    <button data-id="prev" aria-label="Previous phase"><svg viewBox="0 0 16 16"><path d="M11 2v12L4 8z"/></svg></button>
    <button data-id="play" class="play" aria-label="Play or pause"><svg data-id="icoPlay" viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg><svg data-id="icoPause" viewBox="0 0 16 16" style="display:none"><path d="M3 2h4v12H3zM9 2h4v12H9z"/></svg></button>
    <button data-id="next" aria-label="Next phase"><svg viewBox="0 0 16 16"><path d="M5 2v12l7-6z"/></svg></button>
  </div>
  <div class="tl"><div class="tlbar" data-id="tlbar"></div><div class="tlx"><span data-id="tl-left"></span><span>click any segment · ← → keys · width = time spent</span><span data-id="tl-right"></span></div></div>
</div>
<div class="top"><div class="legend" data-id="legend"></div></div>
<div class="stage">
  <div class="left">
  <div class="worlds">
    <div class="world sim"><div class="frame" data-id="simframe">
      <div class="tag"><i></i><span>Agent simulator · MuJoCo</span></div><div class="chip" data-id="simchip"></div>
      <div class="verdict" data-id="simverdict"></div>
      <div class="veil" data-id="simveil"><div><div class="t" data-id="simveil-t"></div><div class="b" data-id="simveil-b"></div></div></div>
      <div class="read" data-id="simread"><div><div class="lab" data-id="simlab"></div><div class="big num" data-id="simbig">0</div></div><div><div class="lab" data-id="simlab2"></div><div class="v num" data-id="simfz">—</div></div></div>
    </div></div>
    <div class="world real"><div class="frame" data-id="realframe">
      <div class="tag"><i></i><span data-id="realtag">Real world · PhysX (Isaac Lab)</span></div><div class="chip" data-id="realchip"></div>
      <div class="verdict" data-id="realverdict"></div>
      <div class="veil" data-id="realveil"><div><div class="t" data-id="realveil-t"></div><div class="b" data-id="realveil-b"></div></div></div>
      <div class="read" data-id="realread"><div><div class="lab" data-id="reallab"></div><div class="big num" data-id="realbig">0</div></div><div><div class="lab" data-id="reallab2"></div><div class="v num" data-id="realfz">—</div></div></div>
    </div></div>
  </div>
  <div class="visual"><div class="cap"><span class="k" data-id="vis-k"></span><span class="key num" data-id="vis-key"></span></div><div data-id="vis-body"></div></div>
  </div>
  <div class="right">
    <div class="trace">
      <div class="head"><div class="pill" data-id="pill"><i></i><span data-id="pill-type"></span><span class="t num" data-id="pill-time"></span></div><h2 data-id="headline"></h2></div>
      <div class="log" data-id="log"></div>
    </div>
  </div>
</div>
<div class="after" data-id="after"></div>
<p class="note" data-id="note"></p>`;

const fmt = s => { s = Math.round(s); const m = Math.floor(s / 60), h = Math.floor(m / 60); return h ? h + ' h ' + String(m % 60).padStart(2, '0') + ' min' : m ? m + ' min ' + String(s % 60).padStart(2, '0') + ' s' : s + ' s'; };

function Stage(sec, task, head){
  sec.innerHTML = STAGE_HTML; const $ = id => sec.querySelector('[data-id="' + id + '"]');
  const Tk = TASKS[task], P = Tk.P; let cur = 0, playing = false, timer = null, typeTimer = null, loops = 0, typingDone = true, clipDone = true;
  const T = Tk.group === 'basic' ? TYPES_BASIC : TYPES;
  // the task's clips: one <video> per clip, sim clips (and the training grid) in the simulator frame, real clips in the real frame
  const vids = {};
  (S2R.data[task].clips || []).forEach(clip => {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.dataset.clip = clip;
    v.src = 'video/' + task + '/' + clip + '.mp4'; v.poster = 'video/' + task + '/' + clip + '.jpg'; vids[clip] = v;
    (clip.startsWith('sim') || clip === 'train_grid' ? $('simframe') : $('realframe')).prepend(v);
  });
  const V = (side, clip) => vids[clip];
  const legend = $('legend'); for (const k in T) { const s = document.createElement('span'); s.dataset.type = k; s.innerHTML = '<i style="background:' + T[k].c + '"></i>' + T[k].l; legend.appendChild(s); }
  if (Tk.realTag) $('realtag').textContent = Tk.realTag;

  function buildTimeline(){
    const bar = $('tlbar'); bar.innerHTML = ''; const widths = P.map(p => p.pro ? 9 : Math.max(2.2, 100 * (p.t1 - p.t0) / Tk.S));
    P.forEach((p, i) => { if (i === 1 && P[0].pro) { const dv = document.createElement('div'); dv.className = 'divider'; bar.appendChild(dv); } const d = document.createElement('div'); d.className = 'seg'; d.style.flex = widths[i] + ' 1 0px'; d.style.background = T[p.type].c; d.title = (p.pro ? 'before' : fmt(p.t0)) + ' · ' + T[p.type].l; d.innerHTML = '<div class="fill"></div>'; d.addEventListener('click', () => show(i)); bar.appendChild(d); });
    $('tl-left').textContent = Tk.tlLeft; $('tl-right').textContent = Tk.tlRight;
  }
  function init(opts){
    opts = opts || {}; stopAll();
    $('h-eyebrow').textContent = (Tk.platform || head.platform) + ' · agent ' + (Tk.model || head.model) + ' · simulator MuJoCo · real world Isaac Lab PhysX';
    $('h-title').textContent = Tk.title; $('h-facts').innerHTML = Tk.facts.map(([b, t]) => '<span><b>' + b + '</b> ' + t + '</span>').join('');
    $('realchip').textContent = Tk.realChip; $('after').innerHTML = Tk.after.map(([v, l]) => '<div class="box"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>').join(''); $('note').innerHTML = (Tk.lede ? Tk.lede + ' ' : '') + Tk.note;
    ['sim', 'real'].forEach(s => { $(s + 'lab').textContent = Tk.read.lab; $(s + 'lab2').textContent = Tk.read.lab2; });
    buildTimeline(); show(opts.start || 0, {silent:true});
  }
  function stopAll(){ for (const id in vids) { vids[id].pause(); vids[id].classList.remove('on'); } clearTimeout(timer); clearTimeout(typeTimer); }
  function playClip(side, clip){ const v = V(side, clip); if (!v) return; v.classList.add('on'); v.currentTime = 0; if (playing) v.play().catch(() => {}); }
  function freezeClip(side, clip, t){ const v = V(side, clip); if (!v) return; v.classList.add('on'); v.pause(); v.currentTime = t == null ? Math.max(0, (v.duration || 12.5) - 0.1) : t; }
  function entry(kind, html, tm, cls){ const e = h('div', 'ent' + (cls ? ' ' + cls : '')); e.appendChild(h('div', 'tm num', tm || '')); e.appendChild(h('div', kind, html)); return e; }
  function renderLog(upto){ const log = $('log'); log.innerHTML = ''; for (let i = 0; i < upto; i++) P[i].log.forEach((it, j) => log.appendChild(entry(it[0], it[1], j == 0 ? (P[i].pro ? 'before' : fmt(P[i].t0)) : '', 'past'))); return log; }
  function typeEntries(items, tm){
    const log = $('log'); let idx = 0; typingDone = false;
    function next(){
      if (idx >= items.length) { typingDone = true; maybeAdvance(); return; }
      const [kind, html] = items[idx]; const e = entry(kind, kind === 'tool' ? html : '', idx == 0 ? tm : '', 'cur'); log.appendChild(e); log.scrollTop = log.scrollHeight; idx++;
      if (kind === 'tool') { typeTimer = setTimeout(next, 650); return; }
      const box = e.querySelector('.say') || e.querySelector('.note'); const caret = h('span', 'caret'); box.appendChild(caret);
      const tmp = h('div', '', html); const nodes = Array.from(tmp.childNodes); let ni = 0, ci = 0;
      function step(){
        if (ni >= nodes.length) { caret.remove(); typeTimer = setTimeout(next, 900); return; }
        const n = nodes[ni];
        if (n.nodeType === 3) { if (ci < n.textContent.length) { box.insertBefore(document.createTextNode(n.textContent[ci++]), caret); } else { ni++; ci = 0; } }
        else { box.insertBefore(n.cloneNode(true), caret); ni++; }
        log.scrollTop = log.scrollHeight; typeTimer = setTimeout(step, 1000 / 46);
      }
      step();
    }
    next();
  }
  function maybeAdvance(){ if (playing && typingDone && clipDone) timer = setTimeout(() => { if (playing) show(cur + 1); }, P[cur].type === 'reason' ? 2200 : 1200); }
  function show(i, opts){
    opts = opts || {}; cur = (i + P.length) % P.length; const p = P[cur]; stopAll(); loops = 0;
    legend.querySelectorAll('span').forEach(s => s.classList.toggle('on', s.dataset.type === p.type));
    $('pill').querySelector('i').style.background = T[p.type].c; $('pill-type').textContent = T[p.type].l; $('pill-time').textContent = p.pro ? 'before the trial' : 't = ' + fmt(p.t0); $('headline').textContent = p.head;
    const lastChip = P.slice(0, cur + 1).reverse().find(q => q.simchip); $('simchip').textContent = lastChip ? lastChip.simchip : '';
    $('tlbar').querySelectorAll('.seg').forEach((s, j) => { s.className = 'seg' + (j === cur ? ' on' : j < cur ? ' done' : ''); s.querySelector('.fill').style.width = j < cur ? '100%' : '0'; });
    ['sim', 'real'].forEach(s => { $(s + 'veil').className = 'veil'; $(s + 'verdict').className = 'verdict'; $(s + 'read').className = 'read off'; });
    $('vis-k').innerHTML = p.vis.k; $('vis-key').innerHTML = p.vis.key[0] + '<small>' + p.vis.key[1] + '</small>'; const vb = $('vis-body'); vb.innerHTML = ''; vb.appendChild(p.vis.fn());
    clipDone = p.type === 'reason';
    if (p.type === 'deploy' || p.type === 'probe' || p.type === 'calib') { playClip('sim', p.sim); playClip('real', p.real); $('simread').className = 'read'; $('realread').className = 'read'; }
    else if (p.type === 'train') { playClip('sim', p.sim); freezeClip('real', p.real, p.pro ? 0 : null); $('realveil').className = 'veil on'; $('realveil-t').textContent = p.veil[0]; $('realveil-b').textContent = p.veil[1]; }
    else { const prev = P.slice(0, cur).reverse().find(q => q.sim && q.type !== 'train') || P.find(q => q.sim && q.type !== 'train') || P[0]; freezeClip('sim', prev.sim); freezeClip('real', prev.real);
           $('simveil').className = 'veil on'; $('simveil-t').textContent = 'Paused'; $('simveil-b').textContent = 'the agent is reading its evidence'; $('realveil').className = 'veil on'; $('realveil-t').textContent = 'Paused'; $('realveil-b').textContent = 'robot idle'; }
    renderLog(cur); const log = $('log'); log.scrollTop = log.scrollHeight; const tm = p.pro ? 'before' : fmt(p.t0);
    if (playing) typeEntries(p.log, tm); else { p.log.forEach((it, j) => log.appendChild(entry(it[0], it[1], j == 0 ? tm : '', 'cur'))); log.scrollTop = log.scrollHeight; typingDone = true; }
    if (!opts.silent) { try { history.replaceState(null, '', '#' + task + '-p' + (cur + 1)); } catch (e) {} }
  }
  function readouts(){
    if (!sec.isConnected) return;
    const p = P[cur]; const seg = $('tlbar').querySelectorAll('.seg')[cur]; const lead = p.type === 'train' ? V('sim', p.sim) : V('real', p.real);
    if (p.live) { ['sim', 'real'].forEach((s, k) => { const L = LIVE[task][p.live[k]], vv = V(s, k ? p.real : p.sim); if (!vv || !L) return; const f = Math.floor((vv.currentTime || 0) * (L.fps || Tk.read.fps)), i = Math.min(f, Tk.read.len(L) - 1);
        $(s + 'lab').textContent = Tk.read.lab; $(s + 'lab2').textContent = Tk.read.lab2; $(s + 'big').innerHTML = Tk.read.big(L, i); $(s + 'fz').textContent = Tk.read.v(L, i);
        const ended = vv.ended || (vv.duration && vv.currentTime >= vv.duration - 0.05); const vd = $(s + 'verdict'); if (ended) { const n = Tk.read.final(L); vd.textContent = Tk.read.verdict(n); vd.className = 'verdict show' + (Tk.read.ok(n) ? '' : ' bad'); } else vd.className = 'verdict'; }); }
    if (p.probe) { const PB = LIVE[task].probes || LIVE[task].probe1; ['sim', 'real'].forEach((s, k) => { const A = PB && PB[p.probe[k]], vv = V(s, k ? p.real : p.sim); if (!vv || !A) return; const f = Math.floor((vv.currentTime || 0) * Tk.probeRead.fps), i = Math.min(f, A.length - 1);
        $(s + 'lab').textContent = p.probeLab || Tk.probeRead.lab; $(s + 'lab2').textContent = Tk.probeRead.lab2; $(s + 'big').innerHTML = (p.probeBig || Tk.probeRead.big)(A, i); $(s + 'fz').textContent = Tk.probeRead.v(s, p); }); }
    if (seg && lead && lead.classList.contains('on') && lead.duration) seg.querySelector('.fill').style.width = Math.min(100, 100 * lead.currentTime / lead.duration) + '%';
    requestAnimationFrame(readouts);
  }
  function onEnded(e){
    const p = P[cur]; if (!playing) return;
    const lead = p.type === 'train' ? V('sim', p.sim) : V('real', p.real); if (e.target !== lead) return;
    if (p.type === 'probe' || p.type === 'calib') { loops++; if (loops < 2 || !typingDone) { playClip('sim', p.sim); playClip('real', p.real); return; } }
    if (p.type === 'train' && !typingDone) { playClip('sim', p.sim); return; }
    clipDone = true; maybeAdvance();
  }
  for (const id in vids) vids[id].addEventListener('ended', onEnded);
  function setIcon(){ $('icoPlay').style.display = playing ? 'none' : ''; $('icoPause').style.display = playing ? '' : 'none'; }
  function setPlaying(on){ if (on === playing) return; playing = on; setIcon(); if (playing) show(cur, {silent:true}); else stopAll(); }
  $('play').addEventListener('click', () => { setPlaying(!playing); if (!playing) stopAll(); });
  $('prev').addEventListener('click', () => show(cur - 1)); $('next').addEventListener('click', () => show(cur + 1));
  const api = {sec, task, show: d => show(cur + d), goto: i => show(i), setPlaying, isPlaying: () => playing};
  sec.addEventListener('pointerdown', () => { window.activeStage = api; });
  setIcon(); init(head); requestAnimationFrame(readouts); return api;
}
