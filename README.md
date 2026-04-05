# Inflight Manager's Hub

A private, offline-first Progressive Web App bundling three Thai Airways cabin-crew tools under one roof:

- **PA Announcements** — Welcome / Thank You / Refuel / Short Connect scripts in Thai + English
- **Cabin Briefing** — Full pre-flight briefing sheet with crew, meals, loads, special instructions
- **Crew Tools** — Flight-time calculator and rest-plan builder with UTC conversion

All three plugins share a single **flight context** (flight number, captain, route, times…) stored in `localStorage`, so entering data in any plugin auto-fills the others. No backend, no sync, no login — everything lives on your device.

---

## Features

- **Cross-platform**: works on iPhone, iPad, Android, Mac, Windows — anywhere with a modern browser.
- **Installable**: "Add to Home Screen" on iOS/Android gives you a full-screen icon identical to a native app.
- **Fully offline**: service worker caches every asset on first load; works in airplane mode and inflight with no wifi.
- **Shared flight context**: enter TG910 + captain name once, every plugin knows.
- **Unified design**: Thai Airways purple/gold identity across all plugins (Noto Sans Thai + DM Sans).
- **No dependencies**: pure HTML + CSS + vanilla JS. No build step. No npm. Deploy as static files.

---

## Project structure

```
Inflight Managers Hub/
├── index.html              Hub home (3-tile launcher + flight-context summary)
├── manifest.json           PWA metadata
├── sw.js                   Service worker (cache-first, full offline)
├── icons/                  SVG + PNG app icons (192, 512, maskable)
├── shared/
│   ├── theme.css           Design system (colors, cards, forms, buttons)
│   ├── flight-context.js   Shared state API (load/save/patch/subscribe)
│   └── ui.js               Toast + copy-to-clipboard + SW registration
└── plugins/
    ├── announcement/       Plugin 1: PA Announcements
    ├── briefing/           Plugin 2: Cabin Briefing
    └── crew-tools/         Plugin 3: Flight Time + Rest Plan
```

---

## Local development

Any static server works. From inside the project folder:

```bash
# macOS / Linux — Python
python3 -m http.server 4173

# Node
npx serve -l 4173

# Then open
open http://localhost:4173
```

The service worker only activates over `https://` or `http://localhost`, so use one of the above for testing install behavior.

---

## Deploy to GitHub Pages

**One-time setup:**

```bash
cd "Inflight Managers Hub"
git init
git add .
git commit -m "Initial commit"

# Create a new repo on github.com (e.g. "inflight-managers-hub"), then:
git branch -M main
git remote add origin https://github.com/<your-user>/inflight-managers-hub.git
git push -u origin main
```

**Enable Pages:**

1. Go to the repo → **Settings → Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` / `(root)` → **Save**
4. Wait ~1 minute. Your hub will be live at:
   `https://<your-user>.github.io/inflight-managers-hub/`

**Install on your phone:**

- **iOS**: Open the URL in Safari → Share → **Add to Home Screen**
- **Android**: Open the URL in Chrome → menu → **Install app** (or **Add to Home Screen**)

After the first launch, the service worker caches everything. From then on the app runs 100% offline.

---

## Updating

1. Edit files locally, commit, push.
2. Bump `CACHE_VERSION` in `sw.js` (e.g. `imh-v1.0.0` → `imh-v1.0.1`) — this forces all clients to re-download the updated assets on next launch.
3. Push. Within ~1 minute GitHub Pages picks it up.

---

## Shared flight context — the data contract

Any plugin can read/write the shared flight context:

```js
import { FlightContext } from '/shared/flight-context.js';

// Read
const ctx = FlightContext.load();
console.log(ctx.flightNo, ctx.pic);

// Write (partial merge)
FlightContext.patch({ flightNo: 'TG910', pic: 'Somchai' });

// Two-way bind an input to a path
FlightContext.bindInput(document.getElementById('flt'), 'flightNo');

// React to changes from other plugins
FlightContext.subscribe((ctx) => {
  console.log('Flight context updated', ctx);
});

// Clear
FlightContext.clear();
```

**Schema** (see `shared/flight-context.js` for the full default):

```
flightNo, date
pic, fo1, fo2, zs, codeshare
dep:  { airport, time, utc }
arr:  { airport, time, utc }
flightTime: { h, m }
taxi, landing
pax:  { c, y, inf }
meals:{ c, y, spmlC, spmlY }
blankets: { c, y }
luggage, weather, security, special
```

---

## License

Private tool — for personal use only.
