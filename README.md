# Star Accommodations — PWA Bundle (v2, modular)

A Progressive Web App (PWA) for Star Accommodations. Install it on Chrome,
Edge, or Android for a proper app-like experience: own window, own icon,
works offline. Every feature from the original build is here — bookings,
guest registry, loyalty points, cash book, full double-entry accounting
(Chart of Accounts, journal, general ledger, trial balance, income
statement, balance sheet, receivables aging), CSV/print exports, and
cross-computer sync via Dropbox/Google Drive.

## What changed in this version

The whole app used to live in one 6,500-line `index.html`. It's now split
into proper files by concern — same logic, same data, new structure and a
refreshed visual design (deeper navy/brass palette, refined shadows and
typography, a couple of long-standing CSS bugs fixed along the way).

```
index.html               Markup shell only
css/
  01-tokens.css           Design tokens: colors, shadows, radii, dark mode
  02-layout.css           Sidebar, topbar, page layout
  03-components.css       Cards, buttons, tables, forms, modals, tabs
  04-app.css              Charts, Chart-of-Accounts cards, badges, toast
  05-responsive.css        Mobile breakpoints + print stylesheets
js/
  sw-register.js          Registers the service worker
  00-state.js             Constants, Chart of Accounts defaults, app state
  01-sync.js              Dropbox/Drive file sync (File System Access API)
  02-core.js              Theme, sidebar, navigation, the page router
  03-dashboard.js …       One file per page (bookings, guests, loyalty,
  … 11-settings.js        analytics, cash book, accounting reports, COA,
                           settings)
  12-actions.js …         Action handlers: admin unlock, modals, petty
  … 20-reset-export.js    cash, bank transfer, add guest/booking, manual
                           journal entries, cash categories, admin, data
                           reset/export
  21-init.js              Kicks off the first render
sw.js                     Service worker — offline cache, lists every file
manifest.webmanifest      PWA install metadata
icon*.{svg,png}           App icons (unchanged)
```

**Keep the folder structure intact** — `index.html` loads everything by
relative path (`css/…`, `js/…`), and the service worker's cache list
mirrors that exact file list.

## Running it

The app must be served from a URL (`http://` or `https://`), not opened as
a local `file://` — the service worker only works over the web. Three easy
options:

### Option 1 — Free host (recommended)

- **Netlify Drop** — go to [app.netlify.com/drop](https://app.netlify.com/drop),
  drag the whole bundle folder in. You get a URL in seconds.
- **GitHub Pages** — upload the folder to a repository and enable Pages.
- **Cloudflare Pages / Vercel** — same idea.

All are free for a small hotel and give you HTTPS automatically (required
for full PWA features).

### Option 2 — Local computer only

```
# If you have Python:
python3 -m http.server 8080
# Then visit http://localhost:8080 in Chrome or Edge
```

### Option 3 — Local network (multiple computers on the same Wi-Fi)

Same as Option 2, but visit `http://<your-computer-ip>:8080` from other
computers. Sync across computers still needs the Dropbox/Drive file setup
below — the PWA install doesn't do that on its own.

## Installing the PWA

Once the app is served over a URL:

### Desktop (Chrome / Edge)
- Look for the **install icon** in the address bar (a small monitor or ⬇ icon)
- Or open the browser menu (⋮) → **"Install Star Accommodations"**
- The app opens in its own window with a Start-menu / Dock icon

### Android
- Open the URL in Chrome
- Tap menu (⋮) → **"Install app"** or **"Add to Home Screen"**

### iPhone
- Open the URL in Safari (not Chrome — iOS requires Safari for this)
- Tap the share icon → **"Add to Home Screen"**
- ⚠ Note: iPhone can't use the Dropbox/Drive file sync feature — use
  Backup/Restore to move data by hand.

## Syncing data across devices

Installing the PWA doesn't automatically sync data — the two features are
independent.

Inside the installed app: **Settings → Sync Across Computers → Create data file**
(or Connect existing file). Save the file inside your Dropbox or Google Drive
folder. Repeat on each computer. Full instructions are inside the app under
**Settings → 📖 Setup Instructions**.

## Updating the app

Replace the files on your host with the new versions (keep the same folder
layout). The service worker caches the previous version, so users may need
to close and reopen the PWA once to see the update (or refresh the browser
tab twice). If you rename or add any file, bump `CACHE_NAME` in `sw.js` (it's
currently `star-hotel-v2`) so the browser knows to fetch fresh copies.

## What's under the hood

This is still a single-page app in plain HTML/CSS/JavaScript — no build
step, no bundler, nothing to `npm install` — but it's now organized like a
real project instead of one file. All data is stored locally in the
browser (`localStorage`), with the optional Dropbox/Drive file as a sync
bridge between computers. There's no external server and no build
pipeline required; every file is exactly what the browser runs.
