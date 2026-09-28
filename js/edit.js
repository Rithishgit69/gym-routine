/* Monthly "gym edit" generator.
   - Music: original phonk-style beats synthesised with the Web Audio API (no samples, no copyright),
     or the user's own audio file.
   - Video: templates drawn on a <canvas>, recorded with MediaRecorder (720x1280, 30 fps, 30 s).
   Everything runs on the device; nothing is uploaded. */
(function () {
  'use strict';

  const W = 720;
  const H = 1280;
  const FPS = 30;
  const DUR = 30;
  const LIME = '#c6ff3d';
  const INK = '#0b1000';
  const DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';
  const BODY = 'Inter, system-ui, sans-serif';
  const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // ------------------------------------------------------------------ small helpers
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
  const easeIn = (t) => Math.pow(clamp(t), 3);
  const rnd = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };

  function text(ctx, str, x, y, size, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
    ctx.fillStyle = o.color || '#fff';
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'alphabetic';
    const family = o.body ? BODY : DISPLAY;
    ctx.font = `${o.italic === false || o.body ? '' : 'italic '}${o.weight || 800} ${size}px ${family}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing || 0}px`;
    if (o.scale && o.scale !== 1) { ctx.translate(x, y); ctx.scale(o.scale, o.scale); ctx.translate(-x, -y); }
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = 30; }
    if (o.stroke) { ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor || '#000'; ctx.strokeText(str, x, y); }
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function photo(ctx, bmp, zoom = 1, px = 0, py = 0) {
    const w = W * zoom; const h = H * zoom;
    ctx.drawImage(bmp, (W - w) / 2 + px, (H - h) / 2 + py, w, h);
  }

  function flash(ctx, alpha, color = '#fff') {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(alpha); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  function darken(ctx, a) { flash(ctx, a, '#000'); }

  function grayscale(ctx, amount = 1) {
    ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = amount; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  function sliceGlitch(ctx, seed, strength = 1) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const y = Math.floor(rnd(seed + i) * H);
      const h = 10 + Math.floor(rnd(seed + i * 3) * 70);
      const dx = (rnd(seed + i * 7) - 0.5) * 120 * strength;
      ctx.drawImage(ctx.canvas, 0, y, W, h, dx, y, W, h);
    }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.18 * strength; ctx.fillStyle = LIME;
    ctx.fillRect(0, Math.floor(rnd(seed * 2) * H), W, 6); ctx.restore();
  }

  function dateStamp(ctx, key, alpha = 1) {
    const d = parseKey(key);
    ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, H - 330, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = g; ctx.fillRect(0, H - 330, W, 330);
    ctx.fillStyle = LIME; ctx.fillRect(48, H - 200, 10, 120);
    ctx.restore();
    text(ctx, `DAY ${String(d.getDate()).padStart(2, '0')}`, 76, H - 120, 104, { align: 'left', alpha });
    text(ctx, `${DOW[d.getDay()]} · ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`, 80, H - 78, 30, { align: 'left', body: true, weight: 600, alpha: alpha * 0.85, spacing: 3 });
  }

  function brand(ctx, alpha = 1) {
    text(ctx, 'GYM ROUTINE', W / 2, H - 70, 26, { body: true, weight: 700, spacing: 10, color: 'rgba(255,255,255,0.7)', alpha });
  }

  // ------------------------------------------------------------------ templates
  const TEMPLATES = {
    drift: {
      name: 'Phonk Drift',
      bpm: 150,
      desc: 'Glitch title over a cowbell intro, drop at 3 s into photo cuts on every beat with zoom punches, flashes and shake. Then double-speed cuts, "NO DAYS OFF" word slams and a stats outro.',
      draw(ctx, t, env) {
        const b = 60 / 150;
        const P = env.photos;
        const n = P.length;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        const drop = 8 * b; // 3.2 s
        if (t < drop) {
          // glitch title
          const jitter = Math.floor(t / 0.1);
          const on = rnd(jitter) > 0.15;
          const sc = 1 + easeIn((t - (drop - 0.5)) / 0.5) * 0.6;
          text(ctx, env.month, W / 2 + (rnd(jitter + 1) - 0.5) * 18, H / 2 - 20, 170, { color: LIME, scale: sc, alpha: on ? 1 : 0.4, shadow: 'rgba(198,255,61,0.5)' });
          text(ctx, `GYM EDIT · ${env.year}`, W / 2, H / 2 + 60, 34, { body: true, weight: 700, spacing: 12, alpha: clamp(t / 0.8) });
          text(ctx, `${env.stats.sessions} SESSIONS`, W / 2, H / 2 + 150, 46, { alpha: clamp((t - 1.2) / 0.6) });
          if (rnd(jitter + 9) > 0.7) sliceGlitch(ctx, jitter, 0.6);
          flash(ctx, (t - (drop - 0.15)) / 0.15);
          return;
        }
        const ta = t - drop;
        let idx; let local; let zoom; let glitch = false; let words = null;
        if (t < 24 * b) { // 3.2–9.6 s: every beat
          idx = Math.floor(ta / b); local = (ta % b) / b; zoom = 1.18 - 0.18 * easeOut(local * 1.5);
        } else if (t < 40 * b) { // 9.6–16 s: every half beat
          const tb = t - 24 * b; idx = 16 + Math.floor(tb / (b / 2)); local = (tb % (b / 2)) / (b / 2); zoom = 1.1 - 0.1 * easeOut(local * 1.5); glitch = idx % 4 === 0;
        } else if (t < 56 * b) { // 16–22.4 s: every 2 beats + words
          const tb = t - 40 * b; idx = 48 + Math.floor(tb / (2 * b)); local = (tb % (2 * b)) / (2 * b); zoom = 1 + 0.08 * local;
          const WORDS = ['NO', 'DAYS', 'OFF', 'EARNED', 'NOT', 'GIVEN', 'KEEP', 'GOING', 'NO', 'EXCUSES', 'ONE', 'MORE', 'REP', 'EVERY', 'SINGLE', 'DAY'];
          const wi = Math.floor(tb / b); words = { w: WORDS[wi % WORDS.length], l: (tb % b) / b };
        } else if (t < 68 * b) { // 22.4–27.2 s: every beat, glitchy
          const tb = t - 56 * b; idx = 56 + Math.floor(tb / b); local = (tb % b) / b; zoom = 1.2 - 0.2 * easeOut(local * 1.5); glitch = idx % 2 === 1;
        } else {
          outroStats(ctx, t - 68 * b, env); return;
        }
        const p = P[idx % n];
        const shake = local < 0.3 ? (1 - local / 0.3) * 16 : 0;
        photo(ctx, p.bmp, zoom, (rnd(idx * 3 + Math.floor(t * 30)) - 0.5) * shake, (rnd(idx * 5 + Math.floor(t * 30)) - 0.5) * shake);
        ctx.drawImage(env.vignette, 0, 0);
        if (words) {
          darken(ctx, 0.5);
          text(ctx, words.w, W / 2, H / 2 + 70, 210, { scale: 1.5 - 0.5 * easeOut(words.l * 4), color: words.w.length > 4 ? LIME : '#fff' });
        } else {
          dateStamp(ctx, p.date);
          text(ctx, `${String((idx % n) + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`, W - 50, 110, 56, { align: 'right', color: LIME });
        }
        if (glitch) sliceGlitch(ctx, idx * 11 + Math.floor(t * 20), 1);
        flash(ctx, 0.8 - local * 5);
        grain(ctx, env, t);
      }
    },

    grind: {
      name: 'Grind Mode',
      bpm: 130,
      desc: 'Slow black-and-white intro with a dark drone ("NOBODY SAW THE MORNINGS…"). At 7 s the beat drops: colour and a lime flash, "BUT THEY\'LL SEE IT", then cuts on every beat with "DAY X" freeze frames and a 3×3 photo collage at the end.',
      draw(ctx, t, env) {
        const b = 60 / 130;
        const P = env.photos;
        const n = P.length;
        const drop = 16 * b; // ~7.4 s
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        if (t < drop) {
          const seg = Math.floor(t / (4 * b));
          const local = (t % (4 * b)) / (4 * b);
          const p = P[seg % n];
          photo(ctx, p.bmp, 1 + 0.12 * local, (seg % 2 ? -1 : 1) * 30 * local, 0);
          grayscale(ctx);
          darken(ctx, 0.35);
          ctx.drawImage(env.vignette, 0, 0);
          ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 150); ctx.fillRect(0, H - 150, W, 150);
          const LINES = ['NOBODY SAW', 'THE EARLY', 'MORNINGS', 'OR THE PAIN'];
          const line = LINES[seg % LINES.length];
          const chars = Math.floor(clamp(local / 0.55) * line.length);
          text(ctx, line.slice(0, chars), W / 2, H - 330, 96, { italic: false });
          grain(ctx, env, t, 0.12);
          flash(ctx, (t - (drop - 0.12)) / 0.12, LIME);
          return;
        }
        const ta = t - drop;
        if (ta < 2 * b) { // slam
          const p = P[0 % n];
          photo(ctx, p.bmp, 1.1 - 0.1 * easeOut(ta / (2 * b)));
          darken(ctx, 0.35);
          const first = ta < b;
          const l = (ta % b) / b;
          text(ctx, first ? "BUT THEY'LL" : 'SEE IT.', W / 2, H / 2 + 60, first ? 130 : 190, { scale: 1.6 - 0.6 * easeOut(l * 4), color: first ? '#fff' : LIME });
          flash(ctx, 1 - ta / 0.25, LIME);
          return;
        }
        const tb = ta - 2 * b;
        const end = 25.8 - drop - 2 * b;
        if (tb < end) {
          const beat = Math.floor(tb / b);
          const local = (tb % b) / b;
          const p = P[(beat + 1) % n];
          const freeze = beat % 8 === 7;
          if (freeze) {
            photo(ctx, p.bmp, 1);
            ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 24; ctx.strokeRect(40, 40, W - 80, H - 80); ctx.restore();
            dateStamp(ctx, p.date);
          } else {
            const big = beat % 4 === 0;
            const shake = local < 0.25 ? (1 - local / 0.25) * (big ? 24 : 10) : 0;
            photo(ctx, p.bmp, 1.16 - 0.16 * easeOut(local * 1.6), (rnd(beat + t) - 0.5) * shake, (rnd(beat * 7 + t) - 0.5) * shake);
            ctx.drawImage(env.vignette, 0, 0);
            text(ctx, env.month, 50, 130, 64, { align: 'left', color: LIME });
            flash(ctx, (big ? 0.7 : 0.35) - local * 4);
          }
          grain(ctx, env, t);
          return;
        }
        collage(ctx, t - 25.8, env);
      }
    },

    calendar: {
      name: 'Calendar Stamp',
      bpm: 120,
      desc: 'Your month\'s calendar fills the screen. On every beat a check-in photo flashes full-screen, then flies into its day box and gets stamped ✓. Ends with your attendance % counting up in a filling ring.',
      draw(ctx, t, env) {
        const c = env.cal;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        // title
        const titleA = t < 24 ? 1 : clamp(1 - (t - 24) / 0.6);
        text(ctx, env.month, W / 2, 190, 120, { color: LIME, alpha: titleA * clamp(t / 0.6) });
        text(ctx, String(env.year), W / 2, 240, 30, { body: true, weight: 700, spacing: 12, alpha: titleA * clamp((t - 0.3) / 0.6) });
        ctx.save(); ctx.fillStyle = LIME; ctx.globalAlpha = titleA; ctx.fillRect(W / 2 - 150, 262, 300 * easeOut(t / 1.2), 6); ctx.restore();
        if (t < 24) {
          const gridA = clamp((t - 1) / 0.8);
          drawCalendar(ctx, t, env, gridA);
        } else {
          ringOutro(ctx, t - 24, env);
        }
      }
    }
  };

  function grain(ctx, env, t, a = 0.07) {
    ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay';
    const ox = Math.floor(rnd(Math.floor(t * 24)) * 200); const oy = Math.floor(rnd(Math.floor(t * 24) + 5) * 200);
    ctx.translate(-ox, -oy); ctx.fillStyle = env.grainPattern; ctx.fillRect(0, 0, W + 200, H + 200);
    ctx.restore();
  }

  function outroStats(ctx, t, env) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const s = env.stats;
    const a = (d) => clamp((t - d) / 0.25);
    text(ctx, `${env.month} ${env.year}`, W / 2, 300, 44, { color: LIME, alpha: a(0), spacing: 4 });
    text(ctx, String(s.sessions), W / 2, 590, 300, { alpha: a(0.1), scale: 1.3 - 0.3 * easeOut(t / 0.3) });
    text(ctx, 'SESSIONS', W / 2, 660, 56, { alpha: a(0.2), spacing: 6 });
    text(ctx, `${s.pct}% ATTENDANCE`, W / 2, 800, 60, { color: LIME, alpha: a(0.6) });
    text(ctx, `BEST STREAK ${s.best} DAY${s.best === 1 ? '' : 'S'}`, W / 2, 880, 48, { alpha: a(1.0) });
    brand(ctx, a(1.3));
    flash(ctx, 0.6 - t * 4);
    darken(ctx, (t - 2.4) / 0.4);
  }

  function collage(ctx, t, env) {
    const P = env.photos;
    const cols = 3; const gap = 10; const cw = (W - gap * 4) / cols; const ch = cw * 16 / 9;
    const rows = Math.min(3, Math.ceil(Math.min(9, P.length) / cols));
    const top = (H - (rows * ch + (rows - 1) * gap)) / 2;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    const count = Math.min(9, P.length);
    for (let i = 0; i < count; i++) {
      const appear = clamp((t - i * 0.18) / 0.25);
      if (appear <= 0) continue;
      const r = Math.floor(i / cols); const cI = i % cols;
      const x = gap + cI * (cw + gap); const y = top + r * (ch + gap);
      ctx.save(); ctx.globalAlpha = appear;
      const s = 0.7 + 0.3 * easeOut(appear);
      ctx.translate(x + cw / 2, y + ch / 2); ctx.scale(s, s);
      ctx.drawImage(P[i].bmp, -cw / 2, -ch / 2, cw, ch);
      ctx.restore();
    }
    const tt = t - (count * 0.18 + 0.3);
    if (tt > 0) {
      ctx.save(); ctx.globalAlpha = clamp(tt / 0.3) * 0.85; ctx.fillStyle = '#000'; ctx.fillRect(0, H / 2 - 150, W, 300); ctx.restore();
      text(ctx, env.month, W / 2, H / 2 - 20, 130, { color: LIME, alpha: clamp(tt / 0.3), scale: 1.3 - 0.3 * easeOut(tt / 0.3) });
      text(ctx, `${env.stats.sessions} SESSIONS · ${env.stats.pct}%`, W / 2, H / 2 + 70, 54, { alpha: clamp((tt - 0.2) / 0.3) });
    }
    brand(ctx, clamp((t - 2) / 0.4));
    darken(ctx, (t - 3.7) / 0.5);
  }

  function drawCalendar(ctx, t, env, alpha) {
    const c = env.cal;
    const x0 = 40; const gap = 8; const cell = (W - 80 - gap * 6) / 7; const y0 = 360;
    ctx.save(); ctx.globalAlpha = alpha;
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach((d, i) => text(ctx, d, x0 + i * (cell + gap) + cell / 2, y0 - 22, 30, { body: true, weight: 700, color: '#666', italic: false }));
    const rects = {};
    for (let day = 1; day <= c.days; day++) {
      const i = c.lead + day - 1;
      const x = x0 + (i % 7) * (cell + gap); const y = y0 + Math.floor(i / 7) * (cell + gap);
      rects[day] = { x, y, w: cell, h: cell };
      ctx.fillStyle = '#151517';
      roundRect(ctx, x, y, cell, cell, 14); ctx.fill();
      text(ctx, String(day), x + 12, y + 32, 26, { align: 'left', italic: false, weight: 700, color: '#8d8d94' });
      const st = c.status[day];
      if (st === 'missed' && t > 22.3) {
        const k = clamp((t - 22.3 - day * 0.01) / 0.3);
        ctx.save(); ctx.globalAlpha = alpha * k; ctx.strokeStyle = '#ff4d4d'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + cell * 0.3, y + cell * 0.38); ctx.lineTo(x + cell * 0.7, y + cell * 0.78);
        ctx.moveTo(x + cell * 0.7, y + cell * 0.38); ctx.lineTo(x + cell * 0.3, y + cell * 0.78); ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
    // stamps
    let active = null;
    for (const s of c.stamps) {
      const r = rects[s.day];
      const k = (t - s.t0) / s.len;
      if (k < 0) continue;
      if (k >= 0.7) {
        const pop = k < 1 ? 1 + 0.25 * Math.sin(clamp((k - 0.7) / 0.3) * Math.PI) : 1;
        ctx.save(); ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.scale(pop, pop); ctx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
        roundRect(ctx, r.x, r.y, r.w, r.h, 14); ctx.save(); ctx.clip();
        if (s.bmp) ctx.drawImage(s.bmp, 0, 210, 540, 540, r.x, r.y, r.w, r.h); else { ctx.fillStyle = LIME; ctx.fillRect(r.x, r.y, r.w, r.h); }
        ctx.fillStyle = 'rgba(198,255,61,0.35)'; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.restore();
        ctx.strokeStyle = LIME; ctx.lineWidth = 5; roundRect(ctx, r.x, r.y, r.w, r.h, 14); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.28, r.y + r.h * 0.55); ctx.lineTo(r.x + r.w * 0.45, r.y + r.h * 0.72); ctx.lineTo(r.x + r.w * 0.74, r.y + r.h * 0.38); ctx.stroke();
        ctx.restore();
      } else active = { s, k, r };
    }
    if (active && active.s.bmp) {
      const { s, k, r } = active;
      if (k < 0.35) {
        const l = k / 0.35;
        photo(ctx, s.bmp, 1.08 - 0.08 * easeOut(l));
        ctx.drawImage(env.vignette, 0, 0);
        dateStamp(ctx, s.key);
        flash(ctx, 0.6 - l * 3);
      } else {
        const l = easeOut((k - 0.35) / 0.35);
        const x = lerp(0, r.x, l); const y = lerp(0, r.y, l); const w = lerp(W, r.w, l); const h = lerp(H, r.h, l);
        ctx.save(); roundRect(ctx, x, y, w, h, lerp(0, 14, l)); ctx.clip();
        const sy = lerp(0, 210, l); const sh = lerp(960, 540, l);
        ctx.drawImage(s.bmp, 0, sy, 540, sh, x, y, w, h);
        ctx.restore();
      }
    }
  }

  function ringOutro(ctx, t, env) {
    const s = env.stats;
    const cx = W / 2; const cy = 700; const R = 210;
    const k = easeOut(clamp((t - 0.3) / 2.2));
    ctx.save(); ctx.lineWidth = 34; ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1e21'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = LIME; ctx.shadowColor = 'rgba(198,255,61,0.6)'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (s.pct / 100) * k); ctx.stroke();
    ctx.restore();
    text(ctx, `${Math.round(s.pct * k)}%`, cx, cy + 50, 170);
    text(ctx, 'ATTENDANCE', cx, cy + 110, 36, { body: true, weight: 700, spacing: 8, color: '#8d8d94' });
    const a = (d) => clamp((t - d) / 0.3);
    text(ctx, `${s.sessions} SESSIONS`, cx, 1030, 64, { color: LIME, alpha: a(2.4) });
    text(ctx, `BEST STREAK ${s.best} DAY${s.best === 1 ? '' : 'S'}`, cx, 1100, 44, { alpha: a(2.8) });
    brand(ctx, a(3.2));
    darken(ctx, (t - 5.5) / 0.5);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ------------------------------------------------------------------ music (original phonk-style synth)
  function impulse(c, seconds, decay) {
    const len = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function engine(c) {
    const master = c.createGain(); master.gain.value = 0.9;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.15;
    master.connect(comp); comp.connect(c.destination);
    const rev = c.createConvolver(); rev.buffer = impulse(c, 2.4, 3);
    const revOut = c.createGain(); revOut.gain.value = 0.4; rev.connect(revOut); revOut.connect(master);
    const noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; curve[i] = Math.tanh(x * 4); }

    function env(g, t, peak, attack, decay) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    }
    function noiseSrc(t, dur) {
      const s = c.createBufferSource(); s.buffer = noise; s.start(t, Math.random() * 0.5); s.stop(t + dur); return s;
    }
    return {
      master,
      cowbell(t, semi = 0, vel = 1, wet = 0.25) {
        const r = Math.pow(2, semi / 12);
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100 * r; bp.Q.value = 0.9;
        const g = c.createGain(); env(g, t, 0.32 * vel, 0.002, 0.32);
        [587, 845].forEach((f) => { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f * r; o.connect(bp); o.start(t); o.stop(t + 0.4); });
        bp.connect(g); g.connect(master);
        const send = c.createGain(); send.gain.value = wet; g.connect(send); send.connect(rev);
      },
      kick(t, vel = 1) {
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
        const g = c.createGain(); env(g, t, 1.0 * vel, 0.002, 0.38);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.45);
      },
      bass(t, freq, dur = 0.5, vel = 1) {
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(freq * 1.6, t); o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
        const ws = c.createWaveShaper(); ws.curve = curve;
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1000;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55 * vel, t + 0.005);
        g.gain.setValueAtTime(0.55 * vel, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(ws); ws.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
      },
      snare(t, vel = 1) {
        const n = noiseSrc(t, 0.25);
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
        const g = c.createGain(); env(g, t, 0.55 * vel, 0.002, 0.18);
        n.connect(hp); hp.connect(g); g.connect(master);
        const send = c.createGain(); send.gain.value = 0.2; g.connect(send); send.connect(rev);
        const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 190;
        const g2 = c.createGain(); env(g2, t, 0.3 * vel, 0.002, 0.09); o.connect(g2); g2.connect(master); o.start(t); o.stop(t + 0.15);
      },
      clap(t, vel = 1) {
        [0, 0.011, 0.023].forEach((d, i) => {
          const n = noiseSrc(t + d, 0.2);
          const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 0.8;
          const g = c.createGain(); env(g, t + d, (i === 2 ? 0.5 : 0.3) * vel, 0.001, i === 2 ? 0.16 : 0.03);
          n.connect(bp); bp.connect(g); g.connect(master);
        });
      },
      hat(t, open = false, vel = 1) {
        const n = noiseSrc(t, open ? 0.3 : 0.06);
        const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 8000;
        const g = c.createGain(); env(g, t, 0.16 * vel, 0.001, open ? 0.22 : 0.04);
        n.connect(hp); hp.connect(g); g.connect(master);
      },
      riser(t, dur, vel = 1) {
        const n = c.createBufferSource(); n.buffer = noise; n.loop = true; n.start(t); n.stop(t + dur);
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
        bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(6000, t + dur);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3 * vel, t + dur);
        n.connect(bp); bp.connect(g); g.connect(master);
      },
      impact(t, vel = 1) {
        const o = c.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(28, t + 0.9);
        const g = c.createGain(); env(g, t, 0.9 * vel, 0.003, 1.1); o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.2);
        const n = noiseSrc(t, 1.2); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
        const g2 = c.createGain(); env(g2, t, 0.35 * vel, 0.002, 0.9); n.connect(lp); lp.connect(g2); g2.connect(master); g2.connect(rev);
      },
      pad(t, dur, freqs, vel = 1) {
        const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07 * vel, t + Math.min(1.5, dur / 3));
        g.gain.setValueAtTime(0.07 * vel, t + dur - 1); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        freqs.forEach((f) => [-6, 6].forEach((cents) => {
          const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = cents; o.connect(lp); o.start(t); o.stop(t + dur + 0.1);
        }));
        lp.connect(g); g.connect(master); g.connect(rev);
      },
      click(t) {
        const o = c.createOscillator(); o.type = 'square'; o.frequency.value = 1800;
        const g = c.createGain(); env(g, t, 0.12, 0.001, 0.04); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.06);
      },
      fadeOut(t, dur) { master.gain.setValueAtTime(0.9, t); master.gain.linearRampToValueAtTime(0.0001, t + dur); }
    };
  }

  // Cowbell riff (F minor, semitones from the base bell) and 808 roots, 2 bars of 16 steps
  const RIFF = [[0, 0], [3, 0], [6, 3], [8, 5], [10, 3], [12, 7], [14, 5], [16, 0], [19, 0], [22, 3], [24, 10], [26, 8], [28, 7], [30, 3]];
  const F1 = 43.65; const AB1 = 51.91; const EB1 = 38.89; const DB1 = 34.65;
  const BASS = [[0, F1, 0.55], [7, F1, 0.2], [10, AB1, 0.45], [16, DB1, 0.55], [23, DB1, 0.2], [26, EB1, 0.45]];

  function beatSection(e, from, to, bpm, opts = {}) {
    const s16 = 60 / bpm / 4;
    const barSteps = 32;
    for (let t0 = from, bar = 0; t0 < to - 1e-6; t0 += s16 * barSteps, bar++) {
      for (let step = 0; step < barSteps; step++) {
        const t = t0 + step * s16;
        if (t >= to) break;
        const s = step % 16;
        if (opts.cowbell !== false) RIFF.forEach(([st, semi]) => { if (st === step) e.cowbell(t, semi, opts.bellVel || 0.9); });
        if (opts.drums === false) continue;
        if (opts.half) {
          if (s === 0) e.kick(t);
          if (s === 8) e.snare(t);
        } else {
          if (s === 0 || s === 10 || (s === 7 && step >= 16)) e.kick(t);
          if (s === 4 || s === 12) { e.snare(t, 0.8); e.clap(t, 0.7); }
        }
        if (s % 2 === 0) e.hat(t, s === 14 && step >= 16, 0.9);
        if (!opts.half && step >= 28 && step % 1 === 0) e.hat(t + s16 / 2, false, 0.6); // trap roll
        if (opts.bass !== false) BASS.forEach(([st, f, d]) => { if (st === step) e.bass(t, f, d * (opts.half ? 1.6 : 1)); });
      }
    }
  }

  async function makeMusic(key, envData) {
    const c = new OfflineAudioContext(2, 44100 * DUR, 44100);
    const e = engine(c);
    if (key === 'drift') {
      const bpm = 150; const b = 60 / bpm;
      beatSection(e, 0, 8 * b, bpm, { drums: false, bass: false });
      e.riser(4 * b, 4 * b);
      e.impact(8 * b);
      beatSection(e, 8 * b, 40 * b, bpm);
      beatSection(e, 40 * b, 56 * b, bpm, { half: true });
      e.riser(52 * b, 4 * b, 0.8);
      beatSection(e, 56 * b, 68 * b, bpm);
      e.impact(68 * b);
      beatSection(e, 68 * b, DUR, bpm, { drums: false, bass: false, bellVel: 0.7 });
      e.fadeOut(28.4, 1.6);
    } else if (key === 'grind') {
      const bpm = 130; const b = 60 / bpm; const drop = 16 * b;
      e.pad(0, drop + 0.5, [87.31, 103.83, 130.81]);
      for (let i = 0; i < 8; i++) e.cowbell(i * 2 * b, i % 4 === 3 ? 3 : 0, 0.55, 0.6);
      for (let i = 0; i < 8; i++) e.kick(i * 2 * b, 0.35);
      e.riser(drop - 4 * b, 4 * b);
      e.impact(drop);
      beatSection(e, drop, 25.8, bpm);
      e.impact(25.8, 0.7);
      e.pad(25.8, 4.2, [87.31, 103.83, 130.81]);
      beatSection(e, 25.8, DUR, bpm, { drums: false, bass: false, bellVel: 0.6 });
      e.fadeOut(28.6, 1.4);
    } else {
      const bpm = 120; const b = 60 / bpm;
      e.riser(0, 2);
      e.impact(2, 0.6);
      beatSection(e, 2, 24, bpm, { bellVel: 0.6 });
      (envData && envData.cal ? envData.cal.stamps : []).forEach((s) => { e.click(s.t0 + s.len * 0.7); e.kick(s.t0 + s.len * 0.7, 0.5); });
      e.impact(24);
      e.pad(24, 6, [87.31, 103.83, 130.81, 174.61]);
      beatSection(e, 24, DUR, bpm, { drums: false, bass: false, bellVel: 0.5 });
      e.fadeOut(28.6, 1.4);
    }
    return c.startRendering();
  }

  async function songBuffer(file) {
    const tmp = new OfflineAudioContext(2, 44100, 44100);
    const decoded = await tmp.decodeAudioData(await file.arrayBuffer());
    const c = new OfflineAudioContext(2, 44100 * DUR, 44100);
    const src = c.createBufferSource(); src.buffer = decoded;
    const g = c.createGain(); g.gain.setValueAtTime(1, 0); g.gain.setValueAtTime(1, DUR - 2); g.gain.linearRampToValueAtTime(0.0001, DUR);
    src.connect(g); g.connect(c.destination);
    src.start(0, 0, DUR);
    return c.startRendering();
  }

  // ------------------------------------------------------------------ preparation + recording
  async function fontsReady() {
    if (!document.fonts) return;
    await Promise.all([
      document.fonts.load(`italic 800 100px ${DISPLAY}`),
      document.fonts.load(`800 100px ${DISPLAY}`),
      document.fonts.load('700 30px Inter'),
      document.fonts.load('600 30px Inter')
    ]).catch(() => {});
  }

  async function toBitmap(blob) {
    const src = await createImageBitmap(blob);
    const c = document.createElement('canvas'); c.width = 540; c.height = 960;
    const x = c.getContext('2d');
    const s = Math.max(540 / src.width, 960 / src.height);
    const w = src.width * s; const h = src.height * s;
    x.drawImage(src, (540 - w) / 2, (960 - h) / 2, w, h);
    src.close && src.close();
    return createImageBitmap(c);
  }

  async function prepare(input) {
    const { checkins, stats, month, template } = input; // checkins: [{key, blob}] sorted by date
    const [y, m] = month.split('-').map(Number);
    // up to 24 photos, evenly sampled
    const max = 24;
    const pick = checkins.length <= max ? checkins : Array.from({ length: max }, (_, i) => checkins[Math.floor(i * checkins.length / max)]);
    const photos = [];
    for (const p of pick) photos.push({ bmp: await toBitmap(p.blob), date: p.key });

    const vignette = document.createElement('canvas'); vignette.width = W; vignette.height = H;
    const vx = vignette.getContext('2d');
    const rg = vx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.72);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.7)');
    vx.fillStyle = rg; vx.fillRect(0, 0, W, H);
    const gc = document.createElement('canvas'); gc.width = 200; gc.height = 200;
    const gx = gc.getContext('2d'); const id = gx.createImageData(200, 200);
    for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gx.putImageData(id, 0, 0);
    const probe = document.createElement('canvas').getContext('2d');

    const envData = {
      photos, stats, month: MONTHS[m - 1], year: y, vignette,
      grainPattern: probe.createPattern(gc, 'repeat')
    };
    if (template === 'calendar') {
      const days = new Date(y, m, 0).getDate();
      const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
      const byKey = new Map(photos.map((p) => [p.date, p.bmp]));
      const keys = checkins.map((c) => c.key);
      const N = keys.length;
      const len = clamp(20 / N, 0.5, 7);
      const stamps = keys.map((key, i) => ({ key, day: Number(key.slice(8)), bmp: byKey.get(key) || null, t0: 2.2 + i * len, len }));
      envData.cal = { days, lead, stamps, status: stats.status };
    }
    return envData;
  }

  function pickMime() {
    const cands = [
      ['video/mp4;codecs=avc1.42E01F,mp4a.40.2', 'mp4'],
      ['video/mp4;codecs=avc1,mp4a', 'mp4'],
      ['video/mp4', 'mp4'],
      ['video/webm;codecs=vp9,opus', 'webm'],
      ['video/webm;codecs=vp8,opus', 'webm'],
      ['video/webm', 'webm']
    ];
    if (typeof MediaRecorder === 'undefined') return null;
    for (const [mime, ext] of cands) if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
    return null;
  }

  function supported() {
    return !!(pickMime() && HTMLCanvasElement.prototype.captureStream && window.AudioContext && window.OfflineAudioContext && window.createImageBitmap);
  }

  /* render({ template, month, checkins, stats, song, canvas, audioContext, onProgress, onStage })
     -> { blob, mime, ext } */
  async function render(o) {
    const tpl = TEMPLATES[o.template];
    const fmt = pickMime();
    if (!fmt) throw new Error('This browser cannot record video.');
    o.onStage && o.onStage('Preparing photos…');
    await fontsReady();
    const envData = await prepare(o);
    o.onStage && o.onStage(o.song ? 'Loading your song…' : 'Composing the beat…');
    const music = o.song ? await songBuffer(o.song) : await makeMusic(o.template, envData);

    const ac = o.audioContext;
    const canvas = o.canvas; canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    tpl.draw(ctx, 0, envData);
    const dest = ac.createMediaStreamDestination();
    const src = ac.createBufferSource(); src.buffer = music; src.connect(dest);
    const vStream = canvas.captureStream(FPS);
    const stream = new MediaStream([...vStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const rec = new MediaRecorder(stream, { mimeType: fmt.mime, videoBitsPerSecond: 5000000, audioBitsPerSecond: 160000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = res; });
    o.onStage && o.onStage('Recording your edit…');
    rec.start(500);
    const t0 = ac.currentTime + 0.15;
    src.start(t0);
    let failed = null;
    await new Promise((resolve) => {
      const frame = () => {
        if (document.hidden) { failed = new Error('interrupted'); resolve(); return; }
        const t = ac.currentTime - t0;
        if (t >= DUR) { resolve(); return; }
        tpl.draw(ctx, Math.max(0, t), envData);
        o.onProgress && o.onProgress(clamp(t / DUR));
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    try { src.stop(); } catch (_) { /* already stopped */ }
    rec.stop();
    await stopped;
    stream.getTracks().forEach((tr) => tr.stop());
    envData.photos.forEach((p) => p.bmp.close && p.bmp.close());
    if (failed) throw failed;
    const type = fmt.mime.split(';')[0];
    return { blob: new Blob(chunks, { type }), mime: type, ext: fmt.ext };
  }

  window.GymEdit = { TEMPLATES, ORDER: ['drift', 'grind', 'calendar'], render, supported, pickMime, W, H, DUR };
})();
