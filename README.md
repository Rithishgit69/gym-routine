# Gym Routine

A mobile-first **Progressive Web App** that tells me exactly what to do in the gym, shows how to do each exercise with an animation, logs every set, and tracks attendance with **photo-verified check-ins**.

Works offline once installed. No backend. All data (including photos) stays on the phone.

## Features

**Workout guide**
- No fixed weekdays: sessions rotate Push → Pull → Legs → Upper (3 upper days + 1 leg day, no deadlifts). The app works out what's next from the last workout you logged and reminds you on the home screen.
- 28 planned exercises plus swap options, 46 exercises in total, each with an animation, step-by-step instructions, key cues and common mistakes
- Program phases computed from the start date: *Learn* (weeks 1–2), *Build*, *Deload* (week 9, then every 7 weeks), with sets and RIR adjusted automatically
- Warm-up ramp sets calculated from the last working weight
- "Machine busy?" swap suggestions for every exercise

**Set logger + rest timer**
- Log weight × reps per set; last session's numbers are shown to beat
- Double-progression hints: when every set hits the top of the rep range, the app suggests the next weight
- Rest timer starts after each set (vibration + beep); supersets handled
- Progress tab: session history, estimated 1RM (Epley) with sparklines

**Photo-verified attendance**
- Check-in any day, only via the **live in-app camera**. No gallery uploads. Each photo is stamped with date and time.
- Animated calendar: boxes cascade in, today's box gets stamped ✓; every past day without a check-in gets ✕
- Day streaks and monthly attendance %
- Photo gallery grouped by month (newest first); full-screen viewer with swipe/arrows between days, save or delete
- Monthly photo archive: download a month as a ZIP (photos + `attendance-YYYY-MM.csv`). Full-size photos of a finished month are erased 7 days after download; thumbnails and attendance are kept.

**Offline & install**
- Installable from Chrome (Android and desktop) via *Add to Home screen* / *Install app*
- Animations load from GitHub when online and from an on-device cache when offline (one-tap "Save all for offline", ≈ 5 MB)
- JSON backup export/import (attendance, logs, settings)

## Tech

| Area | Implementation |
|---|---|
| UI | Vanilla JavaScript, HTML, CSS. **No framework, no dependencies, no build step.** |
| Storage | IndexedDB (check-ins, photo blobs, set logs, settings) |
| Offline | Service Worker: stale-while-revalidate app shell, network-first media with on-device cache fallback |
| Camera | `getUserMedia` → Canvas (mirror, resize, timestamp overlay) → JPEG blobs + thumbnails |
| Archives | Hand-written ZIP writer with CRC-32 (`js/zip.js`, ~100 lines) |
| Data pipeline | `tools/build_exercises.py` generates `js/exercises.js` from the open exercise dataset (pinned commit) |

```
index.html            app shell
css/app.css           styles (dark, mobile-first)
js/program.js         training program, progression rules, coach notes (cues + mistakes)
js/exercises.js       generated exercise data (names, muscles, steps, media paths)
js/db.js              IndexedDB wrapper
js/zip.js             ZIP writer
js/app.js             views, logger, timer, camera, calendar, archive
sw.js                 service worker
tools/build_exercises.py
```

## Run locally

```bash
python3 -m http.server 5173
```

Open http://localhost:5173. The camera works on `localhost` or HTTPS only. The service worker is skipped on localhost unless you add `?sw=1`.

Regenerate exercise data:

```bash
git clone --depth 1 https://github.com/hasaneyldrm/exercises-dataset /tmp/exercises-dataset
python3 tools/build_exercises.py /tmp/exercises-dataset/data/exercises.json
```

## Privacy

Check-in photos, set logs and attendance are stored only in the browser's IndexedDB on the device. Nothing is uploaded anywhere.

## Credits

- Exercise data (names, muscles, instructions): [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), MIT License.
- Exercise animations and images: © [Gym visual](https://gymvisual.com/). They are **not included in this repository**; the app loads them from the dataset repository at runtime and caches them on the user's device. See `NOTICE.md`.
- Training program, coach notes and app code: this repository (MIT).
