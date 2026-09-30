# Gym Routine

Version 1.2.1

A mobile-first **Progressive Web App** that tells me exactly what to do in the gym, shows how to do each exercise with an animation, logs every set, and tracks attendance with **photo-verified check-ins**.

Works offline once installed. No backend. All data (including photos) stays on the phone.

## Features

**Workout guide**
- No fixed weekdays: sessions rotate Push → Pull → Legs → Upper (3 upper days + 1 leg day, no deadlifts). The app works out what's next from the last workout you logged and reminds you on the home screen.
- 28 planned exercises plus swap options, 46 exercises in total, each with sharp start/finish photos (looping crossfade) or the original animation, step-by-step instructions, key cues and common mistakes
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
- **Rest days**: mark today (Home) or any day (tap it in the calendar, including past or future days) as a rest day; rest days show a moon, aren't counted as absent and don't break streaks
- Day streaks and monthly attendance %
- Photo gallery grouped by month (newest first); full-screen viewer with swipe/arrows between days, save or delete
- Monthly photo archive: download a month as a ZIP (photos + `attendance-YYYY-MM.csv`). Full-size photos of a finished month are erased 7 days after download; thumbnails and attendance are kept.

**Monthly gym edits (auto-generated video)**
- When a month ends, the app turns that month's check-in photos into a **30-second vertical video (720×1280)** and shows it on the home screen with Download and Share
- 3 templates: **Phonk Drift** (150 BPM, beat-synced cuts, zoom punches, glitch, "NO DAYS OFF" slams, stats outro), **Grind Mode** (130 BPM, B&W intro → drop, freeze frames, collage), **Calendar Stamp** (120 BPM, photos fly into their calendar day and get stamped, attendance ring)
- Music is **original phonk-style beats synthesised in the browser** (cowbell riffs, distorted 808, drums, risers) with the Web Audio API, so nothing is copyrighted. Users can also pick their own song file.
- Rendered entirely on-device: Canvas 2D + `MediaRecorder` (MP4 where supported, WebM otherwise); no server

**Offline & install**
- Installable from Chrome (Android and desktop) via *Add to Home screen* / *Install app*
- Photos and animations load from GitHub when online and from an on-device cache when offline (one-tap "Save all for offline", ≈ 11 MB)
- JSON backup export/import (attendance, logs, settings)

## Tech

| Area | Implementation |
|---|---|
| UI | Vanilla JavaScript, HTML, CSS. **No framework, no dependencies, no build step.** |
| Storage | IndexedDB (offline source of truth) plus optional Supabase backup for records and check-in photos |
| Offline | Service Worker: stale-while-revalidate app shell, network-first media with on-device cache fallback |
| Camera | `getUserMedia` → Canvas (mirror, resize, timestamp overlay) → JPEG blobs + thumbnails |
| Archives | Hand-written ZIP writer with CRC-32 (`js/zip.js`, ~100 lines) |
| Video edits | `js/edit.js`: canvas templates + Web Audio synth (OfflineAudioContext) → `MediaRecorder` |
| Design | "Athletic Dark": black + electric lime, Barlow Condensed display, Inter text (bundled, OFL) |
| Data pipeline | `tools/build_exercises.py` generates `js/exercises.js` from two open datasets (pinned commits); `tools/photo_map.json` maps exercises to public-domain photos |

```
index.html            app shell
css/app.css           styles (dark, mobile-first)
js/program.js         training program, progression rules, coach notes (cues + mistakes)
js/exercises.js       generated exercise data (names, muscles, steps, media paths)
js/db.js              IndexedDB wrapper
js/zip.js             ZIP writer
js/edit.js            monthly gym edit generator (templates + music synth + recorder)
fonts/                Inter + Barlow Condensed (SIL OFL 1.1, licenses included)
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
curl -L https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json -o /tmp/free-exercise-db.json
python3 tools/build_exercises.py /tmp/exercises-dataset/data/exercises.json /tmp/free-exercise-db.json
```

## Supabase backup

Run `supabase.sql` in the Supabase SQL Editor before using cloud backup. The app uses the publishable key in `js/cloud.js`, anonymous Supabase Auth, Row Level Security, and a private `checkin-photos` Storage bucket. Enable **Anonymous sign-ins** under Authentication → Providers.

Cloud backup is optional and does not replace IndexedDB. The current anonymous session is tied to the browser profile, so add a real email/provider login before relying on it for cross-device recovery.

## Privacy

Without cloud backup, check-in photos, set logs and attendance stay in the browser's IndexedDB. When enabled, records and full-size check-in photos are also uploaded to the configured private Supabase project under Row Level Security.

## Credits

- Exercise data (names, muscles, instructions): [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset), MIT License.
- Exercise photos: [yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db), Unlicense (public domain).
- Exercise animations and thumbnails: © [Gym visual](https://gymvisual.com/). They are **not included in this repository**; the app loads them from the dataset repository at runtime and caches them on the user's device. See `NOTICE.md`.
- Fonts: [Inter](https://github.com/rsms/inter) and [Barlow Condensed](https://github.com/jpt/barlow), SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
- Training program, coach notes, edit templates, music synth and app code: this repository (MIT).
