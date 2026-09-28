/* Gym Routine – main app (vanilla JS, no dependencies). */
(() => {
  'use strict';

  const P = window.PROGRAM;
  const EX = window.EXERCISES;
  const BASE = window.MEDIA_BASE;
  const MEDIA_CACHE = 'media-v1';
  const ERASE_AFTER_DAYS = 7;

  // ---------------------------------------------------------------- helpers
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const todayKey = () => keyOf(new Date());
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fmtDay = (d) => `${DOW[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  const fmtTime = (ts) => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtDate = (ts) => { const d = new Date(ts); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
  const fmtRest = (s) => (s >= 60 ? (s % 60 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : `${s / 60} min`) : `${s} s`);
  const fmtBytes = (b) => (b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  const exName = (id) => P.names[id] || titleCase(EX[id].name);
  const mediaUrl = (id, kind) => BASE + EX[id][kind];
  const monthKey = (k) => k.slice(0, 7);
  const monthLabel = (m) => { const [y, mo] = m.split('-').map(Number); return `${MONTHS[mo - 1]} ${y}`; };
  const monthEnd = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0, 23, 59, 59, 999); };
  const round25 = (x) => Math.round(x / 2.5) * 2.5;
  const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0);

  const ICON = {
    tick: '<svg class="mark" viewBox="0 0 24 24"><path d="M6.5 12.5l3.6 3.6L17.5 8.5"/></svg>',
    cross: '<svg class="mark" viewBox="0 0 24 24"><path d="M7.5 7.5l9 9M16.5 7.5l-9 9"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    chevron: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>'
  };

  let toastTimer;
  function toast(msg, ms = 2400) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function vibrate(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (_) { /* ignore */ } }

  // ---------------------------------------------------------------- state
  const state = {
    tab: 'today',
    session: null,
    settings: null,
    checkins: new Map(), // date -> record (with thumb Blob)
    thumbUrls: new Map(), // date -> object URL
    calMonth: null, // Date (1st of month)
    todayLogs: new Map(), // slot -> log record
    installPrompt: null,
    lastCheckinAnim: null
  };

  function thumbUrl(date) {
    const rec = state.checkins.get(date);
    if (!rec || !rec.thumb) return null;
    if (!state.thumbUrls.has(date)) state.thumbUrls.set(date, URL.createObjectURL(rec.thumb));
    return state.thumbUrls.get(date);
  }
  function dropThumbUrl(date) {
    const u = state.thumbUrls.get(date);
    if (u) URL.revokeObjectURL(u);
    state.thumbUrls.delete(date);
  }

  // ---------------------------------------------------------------- program logic
  function programWeek(d = new Date()) {
    const start = parseKey(state.settings.programStart);
    const diff = Math.floor((parseKey(keyOf(d)) - start) / 86400000);
    return diff < 0 ? 0 : Math.floor(diff / 7) + 1;
  }
  function phaseOf(week) {
    if (week <= 2) return { key: 'learn', label: week <= 0 ? 'Starts soon' : 'Learn', note: 'Do 2 sets of each exercise and stop 3–4 reps before failure. Learn the form and find your working weights.' };
    if (week >= 9 && (week - 9) % 7 === 0) return { key: 'deload', label: 'Deload', note: 'Half the sets, same weights, stop 4 reps before failure. Keep eating the same.' };
    return { key: 'build', label: 'Build', note: 'Full sets. Beat last week by 1 rep or a little weight.' };
  }
  function setsFor(item, phase) {
    if (phase.key === 'learn') return Math.min(item.sets, 2);
    if (phase.key === 'deload') return Math.ceil(item.sets / 2);
    return item.sets;
  }
  function rirFor(item, phase) {
    if (phase.key === 'learn') return '3–4';
    if (phase.key === 'deload') return '4';
    return item.rir;
  }
  const repText = (item) => `${item.reps[0]}–${item.reps[1]}${item.per ? ` ${item.per}` : ''}`;
  const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);

  // Routine follows the rotation (Push → Pull → Legs → Upper), not the weekday.
  async function routineInfo() {
    const today = todayKey();
    const logs = (await DB.all('logs')).filter((l) => l.session && l.sets.some((x) => x.r > 0));
    const todays = logs.filter((l) => l.date === today).sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
    const past = logs.filter((l) => l.date < today)
      .sort((a, b) => (a.date === b.date ? (b.updatedAt || 0) - (a.updatedAt || 0) : a.date < b.date ? 1 : -1));
    const last = past[0] || null;
    const next = last ? P.order[(P.order.indexOf(last.session) + 1) % P.order.length] : P.order[0];
    const lastCheckin = [...state.checkins.keys()].filter((k) => k < today).sort().pop() || null;
    return {
      current: todays.length ? todays[todays.length - 1].session : next,
      trainingToday: todays.length > 0,
      next,
      last: last ? { session: last.session, date: last.date } : null,
      daysSinceCheckin: lastCheckin ? daysBetween(lastCheckin, today) : null
    };
  }
  const ago = (n) => (n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`);
  const slotOf = (sessionKey, item) => `${sessionKey}:${item.n}`;

  // ---------------------------------------------------------------- logs
  async function loadTodayLogs() {
    const logs = (await DB.byIndex('logs', 'date', todayKey())).filter((l) => l.slot);
    logs.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
    state.todayLogs = new Map();
    for (const l of logs) {
      if (!state.todayLogs.has(l.slot)) state.todayLogs.set(l.slot, []);
      state.todayLogs.get(l.slot).push(l);
    }
  }
  const slotLogs = (slot) => state.todayLogs.get(slot) || [];
  const doneSets = (l) => l.sets.filter((s) => s.r > 0).length;
  async function lastLog(exId, beforeDate = todayKey()) {
    const logs = (await DB.byIndex('logs', 'exId', exId)).filter((l) => l.date < beforeDate && l.sets.some((s) => s.r > 0));
    logs.sort((a, b) => (a.date < b.date ? 1 : -1));
    return logs[0] || null;
  }
  async function exHistory(exId) {
    const logs = (await DB.byIndex('logs', 'exId', exId)).filter((l) => l.sets.some((s) => s.r > 0));
    return logs.sort((a, b) => (a.date < b.date ? 1 : -1));
  }
  function suggestion(item, last, phase) {
    if (!last) return null;
    const done = last.sets.filter((s) => s.r > 0);
    if (!done.length) return null;
    const w = Math.max(...done.map((s) => +s.w || 0));
    const reps = done.map((s) => s.r).join(', ');
    const inc = P.increments[item.inc];
    const allTop = done.length >= Math.min(item.sets, setsFor(item, phase)) && done.every((s) => s.r >= item.reps[1]);
    if (phase.key === 'deload') return { w, up: false, text: `Deload: keep ${w} kg, easy reps.` };
    if (allTop) {
      const nw = w > 0 ? w + inc.step : w;
      return { w: nw, up: true, text: `Last time every set hit ${item.reps[1]} (${reps}). Go up: ${inc.text}${w > 0 ? `, try ${nw} kg` : ''}.` };
    }
    return { w, up: false, text: `Last time: ${w > 0 ? `${w} kg × ` : ''}${reps}. Same weight, beat the reps.` };
  }

  // ---------------------------------------------------------------- render: shell
  function setHeader(title, sub) {
    $('#title').textContent = title;
    $('#subtitle').textContent = sub || '';
    const done = state.checkins.has(todayKey());
    const btn = $('#top-checkin');
    btn.classList.toggle('done', done);
    btn.innerHTML = done ? ICON.check : ICON.camera;
    btn.setAttribute('aria-label', done ? 'Checked in today' : 'Check in');
  }

  async function render() {
    $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === state.tab));
    const v = $('#view');
    if (state.tab === 'today') await renderToday(v);
    else if (state.tab === 'calendar') await renderCalendar(v);
    else if (state.tab === 'progress') await renderProgress(v);
    else await renderSettings(v);
  }

  function go(tab, opts = {}) {
    state.tab = tab;
    window.scrollTo(0, 0);
    if (opts.anim) state.lastCheckinAnim = opts.anim;
    render();
  }

  // ---------------------------------------------------------------- render: today
  async function renderToday(v) {
    const now = new Date();
    const week = programWeek(now);
    const phase = phaseOf(week);
    const rt = await routineInfo();
    if (!state.sessionPicked) state.session = rt.current;
    const sKey = state.session;
    const S = P.sessions[sKey];
    await loadTodayLogs();

    setHeader(fmtDay(now), week > 0 ? `Week ${week} · ${phase.label}` : `Program starts ${fmtDate(parseKey(state.settings.programStart))}`);

    const ci = state.checkins.get(todayKey());
    const nextS = P.sessions[rt.current];
    const lastLine = rt.trainingToday
      ? `You're training <b>${nextS.name}</b> today.`
      : rt.last
        ? `Last workout: ${P.sessions[rt.last.session].name}, ${ago(daysBetween(rt.last.date, todayKey()))}.`
        : 'First workout: start the rotation with Push.';
    const gap = !ci && rt.daysSinceCheckin !== null && rt.daysSinceCheckin >= 2
      ? `<div class="small" style="color:var(--warn);margin-top:4px">No check-in for ${rt.daysSinceCheckin} days. Your routine is waiting.</div>` : '';
    const checkinHtml = ci
      ? `<div class="card checkin-card">
          ${thumbUrl(todayKey()) ? `<button class="photo-btn" data-action="photo" data-date="${todayKey()}" aria-label="View today's photo"><img src="${thumbUrl(todayKey())}" alt=""></button>` : ''}
          <div class="grow"><div class="card-title">Checked in at ${fmtTime(ci.ts)}</div>
          <div class="muted small">Routine today: <b>${nextS.name}</b> · ${esc(nextS.focus)}</div></div>
          <button class="btn small ghost" data-action="goto" data-tab="calendar">Calendar</button></div>`
      : `<div class="card reminder">
          <div class="muted small" style="text-transform:uppercase;letter-spacing:.06em;font-weight:700">Your routine today</div>
          <div class="reminder-title">${nextS.name} <span class="muted">· ${esc(nextS.focus)}</span></div>
          <div class="muted small">${lastLine} ${nextS.items.length} exercises, ${nextS.duration}.</div>${gap}
          <button class="btn primary block" style="margin-top:12px" data-action="checkin">${ICON.camera}Check in with a gym photo</button></div>`;

    const seg = P.order.map((k) => `<button class="${k === sKey ? 'active' : ''}" data-action="session" data-s="${k}">${P.sessions[k].name}${k === rt.current ? '<span class="dot"></span>' : ''}</button>`).join('');

    let totalSets = 0; let setsDone = 0; let doneEx = 0;
    const rows = [];
    for (const item of S.items) {
      const planned = setsFor(item, phase);
      const logs = slotLogs(slotOf(sKey, item));
      const logged = logs.reduce((n, l) => n + doneSets(l), 0);
      const exId = logs.length ? logs[logs.length - 1].exId : item.id;
      totalSets += planned; setsDone += Math.min(logged, planned);
      const complete = logged >= planned;
      if (complete) doneEx++;
      rows.push(`<button class="ex ${complete ? 'done' : ''} ${item.main ? 'main' : ''}" data-action="open-ex" data-slot="${item.n}" data-ex="${exId}">
        <span class="num">${item.n}</span>
        <img class="thumb" src="${mediaUrl(exId, 'img')}" alt="" loading="lazy" crossorigin="anonymous">
        <span>
          ${item.main ? '<span class="tag">Main lift</span>' : ''}
          <div class="name">${esc(exName(exId))}${exId !== item.id ? ' <span class="muted small">(swap)</span>' : ''}</div>
          <div class="meta">${planned} × ${repText(item)} · ${item.rest ? `rest ${fmtRest(item.rest)}` : `then ${item.superset}, no rest`} · RIR ${rirFor(item, phase)}</div>
        </span>
        <span class="state">${complete ? ICON.check : `${logged}/${planned}`}</span>
      </button>${item.superset && item.n.endsWith('a') ? `<div class="superset-link">↓ Superset: do ${item.n} then ${item.superset}, then rest</div>` : ''}`);
    }

    const main = S.items.find((i) => i.main);
    const warm = await warmupHtml(sKey, main, phase);

    v.innerHTML = `
      ${checkinHtml}
      <div class="card phase ${phase.key}"><div class="row between"><div class="card-title">${week > 0 ? `Week ${week}: ${phase.label}` : 'Before week 1'}</div><span class="pill">${S.duration}</span></div>
        <div class="muted small">${phase.note}</div></div>
      <div class="seg">${seg}</div>
      <div class="row between" style="margin:0 2px 6px"><div><b>${S.name}</b> <span class="muted small">· ${esc(S.focus)}</span></div><span class="muted small">${doneEx}/${S.items.length} done</span></div>
      <div class="progress" style="margin-bottom:12px"><span style="width:${totalSets ? (setsDone / totalSets) * 100 : 0}%"></span></div>
      ${warm}
      <div class="ex-list">${rows.join('')}</div>
      <p class="muted small" style="margin-top:14px">Tap an exercise for the animation, how to do it, common mistakes and the set logger. Animations © Gym visual.</p>`;
  }

  async function warmupHtml(sKey, main, phase) {
    const upper = sKey !== 'legs';
    const general = upper
      ? '3 min easy cardio · 10 arm circles each way · 10 push-ups · 15 light face pulls'
      : '3 min easy cycling · 10 leg swings each way per leg · 10 bodyweight squats · 10 glute bridges';
    let ramp = '';
    if (main.inc === 'bodyweight') {
      ramp = '<div class="muted small" style="margin-top:8px">Before pull-ups: 1 set of 5 easy assisted pull-ups, or 8 lat pulldowns at about half effort.</div>';
    } else {
      const last = await lastLog(main.id);
      const sug = suggestion(main, last, phase);
      const work = sug && sug.w > 0 ? sug.w : null;
      const steps = [[0.5, 8], [0.7, 5], [0.85, 3]];
      const cells = [['Bar', '× 10', '20 kg']];
      for (const [pct, reps] of steps) {
        if (work) {
          const w = Math.max(20, round25(work * pct));
          if (w > 20 && w < work) cells.push([`${w} kg`, `× ${reps}`, `${Math.round(pct * 100)}%`]);
        } else cells.push([`${Math.round(pct * 100)}%`, `× ${reps}`, 'of work weight']);
      }
      cells.push([work ? `${work} kg` : 'Work', 'sets', 'start']);
      ramp = `<div class="muted small" style="margin-top:10px">Ramp-up sets for ${esc(exName(main.id))}${work ? '' : ' (log one session to get exact weights)'}:</div>
        <div class="ramp">${cells.map((c) => `<div><b>${c[0]}</b><span>${c[1]} · ${c[2]}</span></div>`).join('')}</div>`;
    }
    return `<details class="card warm"><summary>Warm-up (8–10 min) ${ICON.chevron}</summary>
      <div class="warm-body"><div class="small">${general}</div>${ramp}</div></details>`;
  }

  // ---------------------------------------------------------------- exercise sheet
  let sheetCtx = null;

  async function openExercise(exId, ctx = null, push = true) {
    sheetCtx = { exId, ctx };
    const sheet = $('#sheet');
    const phase = phaseOf(programWeek());
    const item = ctx && ctx.item;
    const isSwap = item && exId !== item.id;
    const S = ctx ? P.sessions[ctx.sessionKey] : null;
    const x = EX[exId];
    const notes = P.notes[exId] || { cues: [], mistakes: [] };

    $('#sheet-title').innerHTML = `${esc(exName(exId))}<small>${
      item ? `${S.name} · exercise ${item.n}${item.main ? ' · main lift' : ''}${isSwap ? ` · swap for ${esc(exName(item.id))}` : ''}` : esc(titleCase(x.bodyPart))
    }</small>`;

    let presc = '';
    let logger = '';
    if (item) {
      const planned = setsFor(item, phase);
      presc = `<div class="presc">
        <div><b>${planned}</b><span>Sets</span></div>
        <div><b>${item.reps[0]}–${item.reps[1]}</b><span>Reps${item.per ? ' ' + item.per.replace('per ', '/') : ''}</span></div>
        <div><b>${item.rest ? fmtRest(item.rest) : '—'}</b><span>Rest</span></div>
        <div><b>${rirFor(item, phase)}</b><span>RIR</span></div></div>`;
      const last = await lastLog(exId);
      const sug = suggestion(item, last, phase);
      const slot = slotOf(ctx.sessionKey, item);
      const today = slotLogs(slot).find((l) => l.exId === exId);
      const todaySets = today ? today.sets : [];
      const n = Math.max(planned, todaySets.length);
      let rows = '';
      for (let i = 0; i < n; i++) {
        const s = todaySets[i];
        const done = s && s.r > 0;
        const w = s ? s.w : (sug ? sug.w : '');
        rows += `<div class="set ${done ? 'done' : ''}" data-i="${i}">
          <label>Set ${i + 1}</label>
          <div><input type="number" inputmode="decimal" step="0.5" min="0" placeholder="0" value="${w === 0 || w ? esc(w) : ''}" aria-label="Weight set ${i + 1}"><div class="unit">kg</div></div>
          <div><input type="number" inputmode="numeric" min="0" placeholder="${item.reps[0]}–${item.reps[1]}" value="${done ? esc(s.r) : ''}" aria-label="Reps set ${i + 1}"><div class="unit">reps</div></div>
          <button class="tick" data-action="set-done" aria-label="Save set ${i + 1}">${ICON.check}</button></div>`;
      }
      logger = `<div class="section-h">Log your sets</div>
        ${sug ? `<div class="hint ${sug.up ? 'up' : ''}">${esc(sug.text)}</div>` : `<div class="hint">First time: pick a weight you can lift for ${item.reps[0]} clean reps with ${rirFor(item, phase)} reps left in the tank.</div>`}
        ${item.inc === 'bodyweight' ? '<div class="muted small" style="margin:-4px 0 8px">Bodyweight: enter 0 kg, added weight as +kg, or assistance as a minus number.</div>' : ''}
        <div class="set-head"><span></span><span>Weight</span><span>Reps</span><span>Done</span></div>
        <div class="sets" id="sets">${rows}</div>
        <button class="btn small ghost" style="margin-top:8px" data-action="add-set">+ Add set</button>`;
    }

    const hist = (await exHistory(exId)).filter((l) => l.date < todayKey()).slice(0, 5);
    const histHtml = hist.length
      ? `<div class="hist">${hist.map((l) => `<div><span>${fmtDay(parseKey(l.date))}</span><span>${l.sets.filter((s) => s.r > 0).map((s) => `${s.w ? s.w + '×' : ''}${s.r}`).join(' · ')}</span></div>`).join('')}</div>`
      : '<div class="muted small">No sets logged yet.</div>';

    const swaps = item ? [item.id, ...item.swap].filter((id) => id !== exId) : [];
    const swapHtml = swaps.length
      ? `<div class="section-h">${isSwap ? 'Other options' : 'Machine busy? Swap to'}</div><div class="stack">${swaps.map((id) => `
          <button class="swap" data-action="swap" data-ex="${id}"><img src="${mediaUrl(id, 'img')}" alt="" loading="lazy" crossorigin="anonymous">
          <span><b>${esc(exName(id))}</b><div class="muted small">${id === item.id ? 'Original exercise' : esc(titleCase(EX[id].equipment))}</div></span>${ICON.swap}</button>`).join('')}</div>`
      : '';

    $('#sheet-body').innerHTML = `
      <div class="media"><img src="${mediaUrl(exId, 'gif')}" alt="${esc(exName(exId))} animation" crossorigin="anonymous" data-role="gif"><span class="credit">© Gym visual</span></div>
      ${presc}
      ${logger}
      <div class="section-h">How to do it</div>
      <ol class="steps">${x.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      ${notes.cues.length ? `<div class="section-h">Key cues</div><ul class="cues">${notes.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${notes.mistakes.length ? `<div class="section-h">Common mistakes</div><ul class="mistakes">${notes.mistakes.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <div class="section-h">Muscles</div>
      <dl class="kv"><dt>Target</dt><dd>${esc(x.target)}</dd><dt>Also works</dt><dd>${esc(x.secondary.join(', ') || '—')}</dd><dt>Equipment</dt><dd>${esc(x.equipment)}</dd></dl>
      ${swapHtml}
      <div class="section-h">Previous sessions</div>${histHtml}
      <p class="muted small" style="margin-top:18px">Instructions: exercises-dataset (MIT). Animation © Gym visual, gymvisual.com. Dataset ID #${exId}.</p>`;

    const gif = $('[data-role="gif"]', sheet);
    gif.addEventListener('error', () => {
      gif.insertAdjacentHTML('afterend', '<div class="offline">Animation not saved on this phone yet.<br>Connect to the internet once, or use Settings → Save animations for offline.</div>');
    }, { once: true });

    if (sheet.hidden) {
      sheet.hidden = false;
      sheet.classList.remove('closing');
      document.body.style.overflow = 'hidden';
      document.body.classList.add('sheet-open');
      if (push) pushOverlay(closeSheet);
    }
    $('#sheet-body').scrollTop = 0;
  }

  function closeSheet() {
    const sheet = $('#sheet');
    if (sheet.hidden) return;
    sheet.classList.add('closing');
    setTimeout(() => {
      sheet.hidden = true;
      sheet.classList.remove('closing');
      document.body.style.overflow = '';
      document.body.classList.remove('sheet-open');
      sheetCtx = null;
      if (state.tab === 'today' || state.tab === 'progress') render();
    }, 200);
  }

  async function saveSet(row) {
    const { exId, ctx } = sheetCtx;
    const item = ctx.item;
    const i = +row.dataset.i;
    const [wIn, rIn] = $$('input', row);
    const w = wIn.value === '' ? 0 : +wIn.value;
    const r = +rIn.value;
    if (!r || r < 1) { rIn.focus(); toast('Enter the reps you did'); return; }
    const slot = slotOf(ctx.sessionKey, item);
    const date = todayKey();
    if (!state.todayLogs.has(slot)) state.todayLogs.set(slot, []);
    const list = state.todayLogs.get(slot);
    let log = list.find((l) => l.exId === exId);
    if (!log) {
      log = { key: `${date}|${slot}|${exId}`, date, exId, session: ctx.sessionKey, slot, sets: [] };
      list.push(log);
    }
    log.sets[i] = { w, r };
    for (let k = 0; k < log.sets.length; k++) if (!log.sets[k]) log.sets[k] = { w: 0, r: 0 };
    log.updatedAt = Date.now();
    list.sort((a, b) => a.updatedAt - b.updatedAt);
    await DB.put('logs', log);
    row.classList.add('done');
    vibrate(30);

    // prefill the next set's weight
    const next = row.nextElementSibling;
    if (next && !next.classList.contains('done')) {
      const nw = $('input', next);
      if (nw.value === '') nw.value = w;
      setTimeout(() => next.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
    }
    if (document.activeElement) document.activeElement.blur();
    const phase = phaseOf(programWeek());
    const planned = setsFor(item, phase);
    const doneCount = list.reduce((n, l) => n + doneSets(l), 0);
    if (item.superset && item.rest === 0) {
      toast(`Now do ${item.superset} (superset), then rest`);
    } else if (doneCount >= planned) {
      toast(`${exName(exId)} done`);
      startTimer(item.rest, 'Rest, then next exercise');
    } else {
      startTimer(item.rest, `Rest before set ${doneCount + 1}`);
    }
  }

  // ---------------------------------------------------------------- rest timer
  const timer = { end: 0, total: 0, raf: null, label: '' };
  let audioCtx = null;
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.22, 0.44].forEach((t) => {
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.18);
        o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
      });
    } catch (_) { /* audio not available */ }
  }
  function startTimer(seconds, label) {
    if (!seconds) return;
    timer.total = seconds * 1000;
    timer.end = Date.now() + timer.total;
    timer.label = label;
    timer.fired = false;
    const el = $('#timer');
    el.hidden = false;
    el.classList.remove('over');
    $('#timer-label').textContent = label;
    tick();
  }
  function tick() {
    clearTimeout(timer.raf);
    const left = timer.end - Date.now();
    const el = $('#timer');
    if (el.hidden) return;
    if (left <= 0) {
      $('#timer-time').textContent = 'Go!';
      $('#timer-label').textContent = 'Rest over';
      $('#timer-fill').style.width = '0%';
      el.classList.add('over');
      if (!timer.fired) { timer.fired = true; vibrate([250, 120, 250]); beep(); }
      timer.raf = setTimeout(() => { el.hidden = true; }, 6000);
      return;
    }
    const s = Math.ceil(left / 1000);
    $('#timer-time').textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
    $('#timer-fill').style.width = `${(left / timer.total) * 100}%`;
    timer.raf = setTimeout(tick, 250);
  }

  // ---------------------------------------------------------------- overlays & back button
  const overlays = [];
  function pushOverlay(closeFn) {
    overlays.push(closeFn);
    history.pushState({ ov: overlays.length }, '');
  }
  window.addEventListener('popstate', () => {
    const fn = overlays.pop();
    if (fn) fn();
  });
  function closeTop() {
    if (overlays.length) history.back();
  }

  // ---------------------------------------------------------------- camera check-in
  const cam = { stream: null, facing: 'user', full: null, thumb: null, previewUrl: null };

  async function openCamera() {
    const existing = state.checkins.get(todayKey());
    if (existing && !confirm(`You already checked in today at ${fmtTime(existing.ts)}. Replace that photo?`)) return;
    const el = $('#camera');
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    pushOverlay(closeCamera);
    showLive();
    await startStream();
  }
  function camMessage(msg) {
    const m = $('#cam-msg');
    m.hidden = !msg;
    m.textContent = msg || '';
  }
  async function startStream() {
    stopStream();
    camMessage('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      camMessage('Camera not available. Open the app over HTTPS (the installed app or your GitHub Pages link).');
      return;
    }
    try {
      cam.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cam.facing, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false
      });
      const v = $('#cam-video');
      v.srcObject = cam.stream;
      v.classList.toggle('mirror', cam.facing === 'user');
      await v.play().catch(() => {});
    } catch (e) {
      camMessage(e && e.name === 'NotAllowedError'
        ? 'Camera permission is blocked. Allow the camera for this app in Chrome site settings, then try again.'
        : 'Could not start the camera. Close other apps using it and try again.');
    }
  }
  function stopStream() {
    if (cam.stream) cam.stream.getTracks().forEach((t) => t.stop());
    cam.stream = null;
  }
  function showLive() {
    $('#cam-video').hidden = false;
    $('#cam-preview').hidden = true;
    $('#cam-live').hidden = false;
    $('#cam-confirm').hidden = true;
    $('#cam-hint').textContent = 'Take a photo of yourself in the gym';
  }
  function closeCamera() {
    stopStream();
    if (cam.previewUrl) URL.revokeObjectURL(cam.previewUrl);
    cam.previewUrl = null; cam.full = null; cam.thumb = null;
    $('#camera').hidden = true;
    document.body.style.overflow = '';
  }

  function drawStamp(ctx, w, h, when) {
    const bar = Math.round(h * 0.11);
    const g = ctx.createLinearGradient(0, h - bar * 1.6, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, h - bar * 1.6, w, bar * 1.6);
    const fs = Math.max(14, Math.round(h * 0.032));
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${fs}px system-ui, sans-serif`;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('GYM CHECK-IN', Math.round(w * 0.04), h - Math.round(bar * 0.55));
    ctx.font = `500 ${Math.round(fs * 0.85)}px system-ui, sans-serif`;
    const d = new Date(when);
    ctx.fillText(`${DOW_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${fmtTime(when)}`, Math.round(w * 0.04), h - Math.round(bar * 0.18));
  }

  function canvasBlob(canvas, q) {
    return new Promise((res) => canvas.toBlob(res, 'image/jpeg', q));
  }

  async function shoot() {
    const v = $('#cam-video');
    if (!cam.stream || !v.videoWidth) { toast('Camera is not ready yet'); return; }
    const when = Date.now();
    const vw = v.videoWidth; const vh = v.videoHeight;
    const scale = Math.min(1, 1600 / Math.max(vw, vh));
    const w = Math.round(vw * scale); const h = Math.round(vh * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (cam.facing === 'user') { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawStamp(ctx, w, h, when);
    const full = await canvasBlob(c, 0.82);

    const ts = document.createElement('canvas');
    const tScale = 320 / Math.max(w, h);
    ts.width = Math.round(w * tScale); ts.height = Math.round(h * tScale);
    ts.getContext('2d').drawImage(c, 0, 0, ts.width, ts.height);
    const thumb = await canvasBlob(ts, 0.72);

    cam.full = full; cam.thumb = thumb; cam.when = when;
    stopStream();
    const flash = document.createElement('div'); flash.className = 'flash'; document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
    vibrate(40);
    if (cam.previewUrl) URL.revokeObjectURL(cam.previewUrl);
    cam.previewUrl = URL.createObjectURL(full);
    const p = $('#cam-preview');
    p.src = cam.previewUrl;
    p.hidden = false;
    $('#cam-video').hidden = true;
    $('#cam-live').hidden = true;
    $('#cam-confirm').hidden = false;
    $('#cam-hint').textContent = 'Happy with this photo?';
  }

  async function useCheckin() {
    if (!cam.full) return;
    const { full, thumb, when } = cam;
    const date = keyOf(new Date(when));
    const rec = { date, ts: when, month: monthKey(date), thumb, hasFull: true, fullBytes: full.size };
    await DB.put('photos', { date, blob: full });
    await DB.put('checkins', rec);
    dropThumbUrl(date);
    state.checkins.set(date, rec);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    closeTop(); // closes the camera
    state.attView = 'calendar';
    const d = new Date(when);
    state.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    vibrate([60, 60, 120]);
    go('calendar', { anim: date });
  }

  // ---------------------------------------------------------------- attendance logic
  // Every day counts: checked in = done, past day without a check-in = missed.
  function dayStatus(k, today) {
    if (state.checkins.has(k)) return 'done';
    if (k > today) return 'future';
    if (k === today) return 'due';
    if (k < state.settings.trackStart) return 'none';
    return 'missed';
  }

  function streaks() {
    const today = todayKey();
    const start = parseKey(state.settings.trackStart);
    let best = 0; let run = 0;
    for (let d = new Date(start); keyOf(d) <= today; d = addDays(d, 1)) {
      const k = keyOf(d);
      if (state.checkins.has(k)) { run++; best = Math.max(best, run); } else if (k !== today) run = 0;
    }
    return { current: run, best };
  }

  function monthStats(y, m) {
    const today = todayKey();
    let due = 0; let done = 0;
    const days = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= days; i++) {
      const k = keyOf(new Date(y, m, i));
      if (k > today || k < state.settings.trackStart) continue;
      if (k === today && !state.checkins.has(k)) continue;
      due++;
      if (state.checkins.has(k)) done++;
    }
    return { due, done };
  }

  // ---------------------------------------------------------------- render: calendar
  async function renderCalendar(v) {
    if (state.attView === 'photos') return renderPhotos(v);
    const today = todayKey();
    if (!state.calMonth) { const n = new Date(); state.calMonth = new Date(n.getFullYear(), n.getMonth(), 1); }
    const y = state.calMonth.getFullYear(); const m = state.calMonth.getMonth();
    const st = monthStats(y, m);
    const sk = streaks();
    const anim = state.lastCheckinAnim;
    state.lastCheckinAnim = null;
    setHeader('Attendance', `${state.checkins.size} check-in${state.checkins.size === 1 ? '' : 's'} · check in any day`);

    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(y, m + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<div class="cell blank"></div>';
    let idx = 0;
    for (let i = 1; i <= days; i++) {
      const d = new Date(y, m, i); const k = keyOf(d);
      const s = dayStatus(k, today);
      const mark = s === 'done' ? ICON.tick : s === 'missed' ? ICON.cross : '';
      const stamp = anim === k ? ' stamp' : '';
      const extra = anim === k ? `;--stamp-delay:${idx * 22 + 450}ms` : '';
      cells += `<button class="cell ${s}${k === today ? ' today' : ''}${stamp}" style="--i:${idx++}${extra}" data-action="day" data-date="${k}" aria-label="${fmtDay(d)}: ${s}">
        <span class="n">${i}</span>${mark}</button>`;
    }
    const pct = st.due ? Math.round((st.done / st.due) * 100) : 0;
    const ci = state.checkins.get(today);

    let banner = '';
    if (anim) {
      banner = `<div class="banner row" style="gap:12px">${thumbUrl(anim) ? `<button class="photo-btn" data-action="photo" data-date="${anim}"><img src="${thumbUrl(anim)}" alt=""></button>` : ''}
        <div><b>Checked in!</b> ${fmtDay(parseKey(anim))} is marked. Streak: ${sk.current} day${sk.current === 1 ? '' : 's'}.
        <div><button class="link" data-action="photo" data-date="${anim}">View photo</button></div></div></div>`;
    }
    const pending = await pendingArchiveMonths();
    if (!anim && pending.length) banner = `<div class="banner warn"><b>${monthLabel(pending[0])} photos are ready.</b> <button class="link" data-action="att-view" data-view="photos">Open Photos</button> to download the ZIP.</div>`;

    v.innerHTML = `
      ${attTabs()}
      ${banner}
      ${ci ? '' : `<button class="btn primary block" style="margin-bottom:12px" data-action="checkin">${ICON.camera}Check in with a gym photo</button>`}
      <div class="stats">
        <div class="stat"><b>${st.done}/${st.due}</b><span>${MONTHS[m].slice(0, 3)} days${st.due ? ` · ${pct}%` : ''}</span></div>
        <div class="stat"><b>${sk.current}</b><span>Day streak</span></div>
        <div class="stat"><b>${sk.best}</b><span>Best streak</span></div>
      </div>
      <div class="card">
        <div class="cal-nav">
          <button class="icon-btn" data-action="cal-prev" aria-label="Previous month">${ICON.left}</button>
          <h2>${MONTHS[m]} ${y}</h2>
          <button class="icon-btn" data-action="cal-next" aria-label="Next month">${ICON.right}</button>
        </div>
        <div class="cal-week">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((c) => `<div>${c}</div>`).join('')}</div>
        <div class="cal-grid ${anim ? 'cascade' : ''}" id="cal-grid">${cells}</div>
        <div class="legend"><span><i class="l-done"></i>Checked in</span><span><i class="l-missed"></i>Missed</span><span><i class="l-today"></i>Today</span></div>
        <div class="muted small">Tap a ticked day to see that day's photo.</div>
      </div>
      <button class="btn block" data-action="att-view" data-view="photos">View all photos (${state.checkins.size})</button>`;

    if (anim) {
      const cell = v.querySelector(`.cell[data-date="${anim}"]`);
      if (cell) setTimeout(() => vibrate(50), (+cell.style.getPropertyValue('--i') || 0) * 22 + 650);
    }
  }

  function attTabs() {
    const v = state.attView || 'calendar';
    return `<div class="seg two"><button class="${v === 'calendar' ? 'active' : ''}" data-action="att-view" data-view="calendar">Calendar</button>
      <button class="${v === 'photos' ? 'active' : ''}" data-action="att-view" data-view="photos">Photos (${state.checkins.size})</button></div>`;
  }

  async function renderPhotos(v) {
    setHeader('Attendance', `${state.checkins.size} photo${state.checkins.size === 1 ? '' : 's'} · newest first`);
    const byMonth = new Map();
    for (const r of state.checkins.values()) {
      if (!byMonth.has(r.month)) byMonth.set(r.month, []);
      byMonth.get(r.month).push(r);
    }
    let html = attTabs();
    if (!byMonth.size) {
      html += `<div class="card empty">No check-in photos yet.<br><br><button class="btn primary" data-action="checkin">${ICON.camera}Check in with a gym photo</button></div>`;
      v.innerHTML = html;
      return;
    }
    for (const mo of [...byMonth.keys()].sort().reverse()) {
      const list = byMonth.get(mo).sort((a, b) => (a.date < b.date ? 1 : -1));
      html += `<div class="month-head"><div><b>${monthLabel(mo)}</b> <span class="muted small">· ${list.length} photo${list.length === 1 ? '' : 's'}</span></div></div>
        <div class="photo-grid">${list.map((r) => {
          const d = parseKey(r.date);
          const u = thumbUrl(r.date);
          return `<button class="ph" data-action="photo" data-date="${r.date}" aria-label="Photo ${fmtDay(d)}">
            ${u ? `<img src="${u}" alt="" loading="lazy">` : '<span class="ph-none">No photo</span>'}
            <span class="ph-cap"><b>${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}</b> ${DOW[d.getDay()]} · ${fmtTime(r.ts)}</span></button>`;
        }).join('')}</div>
        <div class="card archive-card">${await archiveRow(mo, byMonth.get(mo))}</div>`;
    }
    html += `<p class="muted small">Photos never leave this phone. Once a finished month is downloaded, its full-size photos are erased ${ERASE_AFTER_DAYS} days later. Small thumbnails and all attendance marks are kept.</p>`;
    v.innerHTML = html;
  }

  async function pendingArchiveMonths() {
    const cur = monthKey(todayKey());
    const months = [...new Set([...state.checkins.values()].map((r) => r.month))].filter((mo) => mo < cur);
    const out = [];
    for (const mo of months) {
      const a = await DB.meta(`archive:${mo}`, {});
      const hasFull = [...state.checkins.values()].some((r) => r.month === mo && r.hasFull);
      if (hasFull && !(a.downloadedAt && a.downloadedAt > monthEnd(mo).getTime())) out.push(mo);
    }
    return out.sort();
  }

  async function archiveRow(mo, list) {
    const cur = monthKey(todayKey());
    {
      const full = list.filter((r) => r.hasFull);
      const bytes = full.reduce((s, r) => s + (r.fullBytes || 0), 0);
      const a = await DB.meta(`archive:${mo}`, {});
      const finished = mo < cur;
      const validDl = a.downloadedAt && a.downloadedAt > monthEnd(mo).getTime();
      let status;
      let acts = `<button class="btn small" data-action="zip" data-month="${mo}">${ICON.download}${a.downloadedAt ? 'Download again' : 'Download ZIP'}</button>`;
      if (!full.length) {
        status = a.erasedAt ? `Full-size photos erased ${fmtDate(a.erasedAt)}. Thumbnails kept.` : 'Thumbnails only.';
        acts = `<button class="btn small ghost" data-action="zip" data-month="${mo}">${ICON.download}Thumbnails ZIP</button>`;
      } else if (!finished) {
        status = `In progress · ${a.downloadedAt ? `downloaded ${fmtDate(a.downloadedAt)} (download again after the month ends to enable clean-up)` : 'you can download it any time'}`;
      } else if (validDl) {
        const eraseOn = a.downloadedAt + ERASE_AFTER_DAYS * 86400000;
        status = `Downloaded ${fmtDate(a.downloadedAt)} · full-size photos erase on ${fmtDate(eraseOn)}`;
        acts += `<button class="btn small danger" data-action="erase" data-month="${mo}">Erase full-size now</button>`;
      } else {
        status = '<span style="color:var(--warn)">Not downloaded yet</span>';
      }
      return `<div class="month-row"><div><b>Download ${monthLabel(mo)}</b><div class="muted small">${list.length} photo${list.length === 1 ? '' : 's'}${full.length ? ` · ${fmtBytes(bytes)}` : ''} + attendance sheet</div><div class="small" style="margin-top:4px">${status}</div></div>
        <div class="acts">${acts}</div></div>`;
    }
  }

  async function downloadMonth(mo) {
    toast('Preparing ZIP…');
    const list = [...state.checkins.values()].filter((r) => r.month === mo).sort((a, b) => (a.date < b.date ? -1 : 1));
    const files = [];
    for (const r of list) {
      const d = new Date(r.ts);
      const base = `${r.date}_${DOW[d.getDay()]}_${pad(d.getHours())}-${pad(d.getMinutes())}`;
      const full = r.hasFull ? await DB.get('photos', r.date) : null;
      if (full) files.push({ name: `${base}.jpg`, data: full.blob, date: d });
      else if (r.thumb) files.push({ name: `${base}_thumb.jpg`, data: r.thumb, date: d });
    }
    // attendance sheet for the month
    const [y, m] = mo.split('-').map(Number);
    const today = todayKey();
    let csv = 'date,weekday,status,check_in_time\n';
    for (let i = 1; i <= new Date(y, m, 0).getDate(); i++) {
      const d = new Date(y, m - 1, i); const k = keyOf(d);
      const rec = state.checkins.get(k);
      csv += `${k},${DOW[d.getDay()]},${dayStatus(k, today)},${rec ? fmtTime(rec.ts) : ''}\n`;
    }
    files.push({ name: `attendance-${mo}.csv`, data: csv, date: new Date() });
    const blob = await Zip.build(files);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gym-checkins-${mo}.zip`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    const prev = await DB.meta(`archive:${mo}`, {});
    await DB.setMeta(`archive:${mo}`, { ...prev, downloadedAt: Date.now() });
    toast(`Downloaded ${files.length - 1} photo${files.length === 2 ? '' : 's'} (${fmtBytes(blob.size)})`);
    if (state.tab === 'calendar') render();
  }

  async function eraseMonth(mo, silent = false) {
    const list = [...state.checkins.values()].filter((r) => r.month === mo && r.hasFull);
    for (const r of list) {
      await DB.del('photos', r.date);
      r.hasFull = false; r.fullBytes = 0;
      await DB.put('checkins', r);
    }
    const prev = await DB.meta(`archive:${mo}`, {});
    await DB.setMeta(`archive:${mo}`, { ...prev, erasedAt: Date.now() });
    if (!silent) { toast(`Erased full-size photos for ${monthLabel(mo)}`); render(); }
  }

  async function autoCleanup() {
    const cur = monthKey(todayKey());
    const months = [...new Set([...state.checkins.values()].filter((r) => r.hasFull).map((r) => r.month))].filter((mo) => mo < cur);
    for (const mo of months) {
      const a = await DB.meta(`archive:${mo}`, {});
      if (a.downloadedAt && a.downloadedAt > monthEnd(mo).getTime() && Date.now() > a.downloadedAt + ERASE_AFTER_DAYS * 86400000) {
        await eraseMonth(mo, true);
      }
    }
  }

  function openDay(k) {
    if (state.checkins.has(k)) { openPhoto(k); return; }
    const s = dayStatus(k, todayKey());
    const msg = { missed: 'Missed. No check-in that day.', due: 'Today. Check in with a gym photo.', future: 'Coming up.', none: 'Before tracking started.' }[s];
    toast(`${fmtDay(parseKey(k))}: ${msg}`);
  }

  // Full-screen photo viewer, browsable date-wise (newest first)
  const viewer = { list: [], i: 0, url: null };
  async function showPhoto() {
    const k = viewer.list[viewer.i];
    const rec = state.checkins.get(k);
    if (viewer.url) { URL.revokeObjectURL(viewer.url); viewer.url = null; }
    const full = rec.hasFull ? await DB.get('photos', k) : null;
    if (full) viewer.url = URL.createObjectURL(full.blob);
    $('#viewer-img').src = viewer.url || thumbUrl(k) || '';
    const d = parseKey(k);
    $('#viewer-cap').innerHTML = `<b>${DOW_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}</b><br>
      <span class="small">Checked in ${fmtTime(rec.ts)} · ${viewer.i + 1} of ${viewer.list.length}${full ? '' : ' · thumbnail only'}</span>`;
    $('#viewer-actions').innerHTML = `${full ? `<button class="btn light ghost" data-action="photo-save" data-date="${k}">${ICON.download}Save</button>` : ''}
      <button class="btn danger" data-action="delete-checkin" data-date="${k}">Delete</button>`;
    $('#viewer-prev').disabled = viewer.i >= viewer.list.length - 1;
    $('#viewer-next').disabled = viewer.i <= 0;
  }
  async function openPhoto(k) {
    viewer.list = [...state.checkins.keys()].sort().reverse();
    viewer.i = Math.max(0, viewer.list.indexOf(k));
    const el = $('#viewer');
    if (el.hidden) {
      el.hidden = false;
      document.body.style.overflow = 'hidden';
      pushOverlay(closeViewer);
    }
    await showPhoto();
  }
  function stepPhoto(dir) {
    const n = viewer.i + dir; // +1 = older, -1 = newer
    if (n < 0 || n >= viewer.list.length) return;
    viewer.i = n;
    showPhoto();
  }
  function closeViewer() {
    if (viewer.url) URL.revokeObjectURL(viewer.url);
    viewer.url = null;
    $('#viewer').hidden = true;
    document.body.style.overflow = '';
  }
  async function savePhoto(k) {
    const rec = state.checkins.get(k);
    const full = await DB.get('photos', k);
    if (!full) return;
    const d = new Date(rec.ts);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(full.blob);
    a.download = `gym-checkin-${k}_${pad(d.getHours())}-${pad(d.getMinutes())}.jpg`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
  }
  async function deleteCheckin(k) {
    if (!confirm('Delete this check-in and its photo? That day will show as missed.')) return;
    await DB.del('checkins', k);
    await DB.del('photos', k);
    state.checkins.delete(k);
    dropThumbUrl(k);
    closeTop();
    toast('Check-in deleted');
    render();
  }

  // ---------------------------------------------------------------- render: progress
  function sparkline(values) {
    if (values.length < 2) return '';
    const min = Math.min(...values); const max = Math.max(...values);
    const W = 300; const H = 60; const span = max - min || 1;
    const pts = values.map((v, i) => [(i / (values.length - 1)) * (W - 8) + 4, H - 6 - ((v - min) / span) * (H - 12)]);
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="M${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join('L')}"/>${pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5"/>`).join('')}</svg>`;
  }

  async function renderProgress(v) {
    setHeader('Progress', 'Your logged sets and best lifts');
    const logs = (await DB.all('logs')).filter((l) => l.sets.some((s) => s.r > 0));
    const byDate = new Map();
    for (const l of logs) {
      if (!byDate.has(l.date)) byDate.set(l.date, []);
      byDate.get(l.date).push(l);
    }
    const weekAgo = keyOf(addDays(new Date(), -6));
    const setsWeek = logs.filter((l) => l.date >= weekAgo).reduce((s, l) => s + l.sets.filter((x) => x.r > 0).length, 0);
    const now = new Date();
    const st = monthStats(now.getFullYear(), now.getMonth());

    const recent = [...byDate.keys()].sort().reverse().slice(0, 12).map((dk) => {
      const ls = byDate.get(dk);
      const sess = P.sessions[ls[0].session];
      const sets = ls.reduce((s, l) => s + l.sets.filter((x) => x.r > 0).length, 0);
      return `<details class="card" style="padding:0"><summary style="padding:12px 14px;list-style:none;display:flex;justify-content:space-between;gap:10px"><span><b>${fmtDay(parseKey(dk))}</b> <span class="muted small">· ${sess ? sess.name : ''}</span></span><span class="muted small">${ls.length} exercise${ls.length === 1 ? '' : 's'} · ${sets} set${sets === 1 ? '' : 's'}</span></summary>
        <div class="hist" style="padding:0 14px 10px">${ls.map((l) => `<div><span>${esc(exName(l.exId))}</span><span>${l.sets.filter((s) => s.r > 0).map((s) => `${s.w ? s.w + '×' : ''}${s.r}`).join(' · ')}</span></div>`).join('')}</div></details>`;
    }).join('');

    const lifts = [];
    for (const key of P.order) {
      for (const item of P.sessions[key].items) {
        const h = logs.filter((l) => l.exId === item.id).sort((a, b) => (a.date < b.date ? -1 : 1));
        const best = h.map((l) => Math.max(...l.sets.map((s) => e1rm(+s.w, +s.r)))).filter((x) => x > 0);
        const last = h[h.length - 1];
        lifts.push(`<button class="swap" data-action="info-ex" data-ex="${item.id}"><img src="${mediaUrl(item.id, 'img')}" alt="" loading="lazy" crossorigin="anonymous">
          <span><b>${esc(exName(item.id))}</b><div class="muted small">${P.sessions[key].name}${last ? ` · last ${fmtDay(parseKey(last.date))}: ${last.sets.filter((s) => s.r > 0).map((s) => `${s.w ? s.w + '×' : ''}${s.r}`).join(' · ')}` : ' · not logged yet'}</div>
          ${best.length > 1 ? sparkline(best) : ''}</span>
          <span class="muted small">${best.length ? `${Math.round(Math.max(...best))} kg<br>e1RM` : ''}</span></button>`);
      }
    }

    v.innerHTML = `
      <div class="stats">
        <div class="stat"><b>${byDate.size}</b><span>Sessions logged</span></div>
        <div class="stat"><b>${setsWeek}</b><span>Sets, last 7 days</span></div>
        <div class="stat"><b>${st.done}/${st.due}</b><span>Check-ins this month</span></div>
      </div>
      <div class="section-h">Recent sessions</div>
      ${recent || '<div class="card empty">No sets logged yet. Open an exercise on the Workout tab and tap ✓ after each set.</div>'}
      <div class="section-h">Exercises (e1RM = estimated 1-rep max)</div>
      <div class="stack">${lifts.join('')}</div>`;
  }

  // ---------------------------------------------------------------- render: settings
  const allMediaUrls = () => Object.keys(EX).flatMap((id) => [mediaUrl(id, 'gif'), mediaUrl(id, 'img')]);

  async function mediaStatus() {
    if (!('caches' in window)) return { have: 0, total: allMediaUrls().length };
    const c = await caches.open(MEDIA_CACHE);
    let have = 0;
    for (const u of allMediaUrls()) if (await c.match(u, { ignoreVary: true })) have++;
    return { have, total: allMediaUrls().length };
  }

  async function renderSettings(v) {
    setHeader('Settings', 'Program, offline, photos, backup');
    const ms = await mediaStatus();
    let storage = '';
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      storage = `<div class="field"><span>Storage used</span><b>${fmtBytes(e.usage || 0)}</b></div>
        <div class="field"><span>Protected from auto-clear</span><b>${persisted ? 'Yes' : 'Not yet (after first check-in)'}</b></div>`;
    }
    const week = programWeek();
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    v.innerHTML = `
      <div class="card">
        <div class="card-title">Install on your phone</div>
        ${standalone ? '<div class="muted small">Installed. You\'re using the app version.</div>'
          : state.installPrompt ? '<button class="btn primary block" data-action="install">Install app</button>'
          : '<div class="muted small">In Chrome, tap ⋮ → <b>Add to Home screen</b> (or <b>Install app</b>). It then opens full-screen and works offline.</div>'}
      </div>
      <div class="section-h">Program</div>
      <div class="card">
        <div class="field"><span>Program start (week 1)</span><input type="date" id="set-start" value="${state.settings.programStart}"></div>
        <div class="field"><span>Track attendance from</span><input type="date" id="set-track" value="${state.settings.trackStart}"></div>
        <div class="field"><span>This week</span><b>${week > 0 ? `Week ${week} · ${phaseOf(week).label}` : 'Not started'}</b></div>
        <div class="field"><span>Routine order</span><b>Push → Pull → Legs → Upper</b></div>
      </div>
      <div class="section-h">Offline animations</div>
      <div class="card">
        <div class="small">With mobile data, animations load from GitHub. Without data, the app uses the copy saved on this phone.</div>
        <div class="field"><span>Saved on this phone</span><b id="media-count">${ms.have}/${ms.total} files</b></div>
        <div class="bar"><span id="media-bar" style="width:${(ms.have / ms.total) * 100}%"></span></div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button class="btn primary" data-action="save-media" ${ms.have === ms.total ? 'disabled' : ''}>${ms.have === ms.total ? 'All saved' : 'Save all (≈ 5 MB)'}</button>
          ${ms.have ? '<button class="btn ghost" data-action="clear-media">Remove</button>' : ''}
        </div>
      </div>
      <div class="section-h">Photos &amp; storage</div>
      <div class="card">
        ${storage}
        <div class="small muted" style="margin-top:8px">Check-in photos are saved only on this phone. Each month can be downloaded as a ZIP from the Attendance tab. ${ERASE_AFTER_DAYS} days after you download a finished month, its full-size photos are erased to free space. Thumbnails and attendance stay.</div>
      </div>
      <div class="section-h">Backup</div>
      <div class="card">
        <div class="small muted">Exports attendance, set logs and settings as a JSON file (without photos). Use it when you change phones.</div>
        <div class="row" style="margin-top:10px;gap:8px">
          <button class="btn" data-action="export">${ICON.download}Export</button>
          <label class="btn ghost" style="cursor:pointer">Import<input type="file" accept="application/json,.json" id="import-file" hidden></label>
        </div>
      </div>
      <div class="section-h">Danger zone</div>
      <div class="card"><button class="btn danger block" data-action="reset">Erase all data on this phone</button></div>
      <div class="section-h">About</div>
      <div class="card small muted">
        Exercise data: <b>hasaneyldrm/exercises-dataset</b> (MIT). Animations © <b>Gym visual</b> (gymvisual.com), loaded from the dataset repo and not redistributed.<br><br>
        Program: 3 upper days + 1 leg day, no deadlifts. Progression: when every set reaches the top of the rep range, add weight next session.
      </div>`;
  }

  async function saveMedia() {
    const btn = $('[data-action="save-media"]');
    btn.disabled = true;
    const c = await caches.open(MEDIA_CACHE);
    const urls = allMediaUrls();
    const queue = [...urls];
    let have = 0; let failed = 0;
    const worker = async () => {
      while (queue.length) {
        const u = queue.shift();
        try {
          if (!(await c.match(u, { ignoreVary: true }))) {
            const r = await fetch(u, { mode: 'cors' });
            if (!r.ok) throw new Error(r.status);
            await c.put(u, r);
          }
          have++;
        } catch (_) { failed++; }
        const count = $('#media-count');
        if (count) {
          count.textContent = `${have}/${urls.length} files`;
          $('#media-bar').style.width = `${(have / urls.length) * 100}%`;
          btn.textContent = `Saving… ${have}/${urls.length}`;
        }
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    toast(failed ? `Saved ${have}. ${failed} failed (check your connection).` : 'All animations saved for offline use');
    render();
  }

  async function exportData() {
    const data = {
      app: 'gym-routine', version: 1, exportedAt: new Date().toISOString(),
      settings: state.settings,
      checkins: [...state.checkins.values()].map(({ thumb, ...r }) => r),
      logs: await DB.all('logs')
    };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gym-routine-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000);
  }

  async function importData(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'gym-routine') throw new Error('not a backup');
      for (const l of data.logs || []) await DB.put('logs', l);
      for (const r of data.checkins || []) {
        if (!state.checkins.has(r.date)) {
          const rec = { ...r, thumb: null, hasFull: false, fullBytes: 0 };
          await DB.put('checkins', rec);
          state.checkins.set(r.date, rec);
        }
      }
      if (data.settings) { state.settings = { ...state.settings, ...data.settings }; await DB.setMeta('settings', state.settings); }
      toast(`Imported ${data.logs?.length || 0} logs and ${data.checkins?.length || 0} check-ins`);
      render();
    } catch (e) {
      toast('That file is not a Gym Routine backup');
    }
  }

  // ---------------------------------------------------------------- events
  document.addEventListener('click', async (e) => {
    const t = e.target.closest('[data-action], [data-tab]');
    if (!t) return;
    if (t.classList.contains('tab')) { go(t.dataset.tab); return; }
    const a = t.dataset.action;
    switch (a) {
      case 'goto': go(t.dataset.tab); break;
      case 'checkin': openCamera(); break;
      case 'session': state.session = t.dataset.s; state.sessionPicked = true; render(); break;
      case 'att-view': state.attView = t.dataset.view; window.scrollTo(0, 0); render(); break;
      case 'photo': openPhoto(t.dataset.date); break;
      case 'photo-save': savePhoto(t.dataset.date); break;
      case 'viewer-prev': stepPhoto(1); break;
      case 'viewer-next': stepPhoto(-1); break;
      case 'open-ex': {
        const S = P.sessions[state.session];
        const item = S.items.find((i) => i.n === t.dataset.slot);
        openExercise(t.dataset.ex, { sessionKey: state.session, item });
        break;
      }
      case 'info-ex': openExercise(t.dataset.ex, null); break;
      case 'swap': openExercise(t.dataset.ex, sheetCtx && sheetCtx.ctx, false); break;
      case 'sheet-close': closeTop(); break;
      case 'set-done': saveSet(t.closest('.set')); break;
      case 'add-set': {
        const list = $('#sets');
        const last = list.lastElementChild;
        const clone = last.cloneNode(true);
        const i = list.children.length;
        clone.dataset.i = i;
        clone.classList.remove('done');
        $('label', clone).textContent = `Set ${i + 1}`;
        $$('input', clone)[1].value = '';
        list.appendChild(clone);
        break;
      }
      case 'timer-add': timer.end += 30000; timer.total += 30000; timer.fired = false; $('#timer').classList.remove('over'); tick(); break;
      case 'timer-skip': $('#timer').hidden = true; clearTimeout(timer.raf); break;
      case 'cam-close': closeTop(); break;
      case 'cam-flip': cam.facing = cam.facing === 'user' ? 'environment' : 'user'; startStream(); break;
      case 'cam-shoot': shoot(); break;
      case 'cam-retake': showLive(); startStream(); break;
      case 'cam-use': t.disabled = true; await useCheckin(); t.disabled = false; break;
      case 'cal-prev': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1); render(); break;
      case 'cal-next': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1); render(); break;
      case 'day': openDay(t.dataset.date); break;
      case 'viewer-close': closeTop(); break;
      case 'delete-checkin': deleteCheckin(t.dataset.date); break;
      case 'zip': downloadMonth(t.dataset.month); break;
      case 'erase':
        if (confirm(`Erase full-size ${monthLabel(t.dataset.month)} photos from this phone? Make sure the ZIP is saved. Thumbnails and attendance stay.`)) eraseMonth(t.dataset.month);
        break;
      case 'save-media': saveMedia(); break;
      case 'clear-media': await caches.delete(MEDIA_CACHE); toast('Offline animations removed'); render(); break;
      case 'install':
        if (state.installPrompt) { state.installPrompt.prompt(); await state.installPrompt.userChoice; state.installPrompt = null; render(); }
        break;
      case 'export': exportData(); break;
      case 'reset':
        if (confirm('Erase ALL check-ins, photos, set logs and settings on this phone? This cannot be undone.') && confirm('Are you sure? Download your photo ZIPs first.')) {
          for (const s of ['checkins', 'photos', 'logs', 'meta']) await DB.clear(s);
          location.reload();
        }
        break;
      default: break;
    }
  });

  $('#top-checkin').addEventListener('click', () => {
    if (state.checkins.has(todayKey())) go('calendar');
    else openCamera();
  });

  document.addEventListener('change', async (e) => {
    if (e.target.id === 'set-start' && e.target.value) {
      state.settings.programStart = e.target.value; await DB.setMeta('settings', state.settings); toast('Program start updated'); render();
    } else if (e.target.id === 'set-track' && e.target.value) {
      state.settings.trackStart = e.target.value; await DB.setMeta('settings', state.settings); toast('Attendance start updated'); render();
    } else if (e.target.id === 'import-file' && e.target.files[0]) {
      importData(e.target.files[0]);
    }
  });

  // Save a set with the keyboard's "go"/enter key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest && e.target.closest('.set')) {
      e.preventDefault();
      saveSet(e.target.closest('.set'));
    }
  });

  // Swipe between photos in the viewer
  let touchX = null;
  $('#viewer').addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $('#viewer').addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) stepPhoto(dx > 0 ? 1 : -1); // swipe right = older, left = newer
  });
  document.addEventListener('keydown', (e) => {
    if ($('#viewer').hidden) return;
    if (e.key === 'ArrowLeft') stepPhoto(1);
    if (e.key === 'ArrowRight') stepPhoto(-1);
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.installPrompt = e;
    if (state.tab === 'settings') render();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (!$('#timer').hidden) tick();
      if (state.tab === 'calendar' || state.tab === 'today') render(); // date may have changed
    }
  });

  // ---------------------------------------------------------------- boot
  async function boot() {
    let s = await DB.meta('settings');
    if (!s) {
      const t = todayKey();
      s = { programStart: P.defaultStart, trackStart: t < P.defaultStart ? P.defaultStart : t };
      await DB.setMeta('settings', s);
    }
    state.settings = s;
    for (const r of await DB.all('checkins')) state.checkins.set(r.date, r);
    await autoCleanup();
    await render();
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'checkin') {
      history.replaceState(null, '', location.pathname);
      if (!state.checkins.has(todayKey())) openCamera();
    }
    const devNoSw = location.hostname === 'localhost' && !params.has('sw');
    if ('serviceWorker' in navigator && location.protocol !== 'file:' && !devNoSw) {
      const hadController = !!navigator.serviceWorker.controller;
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // a new version was installed: reload once so the update shows immediately
        if (hadController && !reloading && $('#camera').hidden) { reloading = true; location.reload(); }
      });
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }
  boot().catch((err) => {
    console.error(err);
    $('#view').innerHTML = `<div class="card">Something went wrong while loading: ${esc(err.message || err)}</div>`;
  });
})();
