# Star Accommodations — PWA Bundle

A Progressive Web App (PWA) version of Star Accommodations. Install it on
Chrome, Edge, or Android for a proper app-like experience: own window, own
icon, works offline.

## Files in this bundle

| File | Purpose |
|---|---|
| `index.html` | The main app (single-file, everything embedded) |
| `manifest.webmanifest` | Tells the browser this is an installable app |
| `sw.js` | Service worker — caches assets for offline use |
| `icon.svg` | Vector icon (used at any size) |
| `icon-192.png` | Standard 192×192 app icon |
| `icon-512.png` | Standard 512×512 app icon |
| `icon-maskable-512.png` | Android adaptive icon (safe zone padded) |
| `icon-maskable.svg` | Source SVG for the maskable icon |

**Keep all files together in the same folder** — the app references them by
relative path.

## Running it

The app must be served from a URL (`http://` or `https://`), not opened as
a local `file://` — the service worker only works over the web. You have
three easy options:

### Option 1 — Free host (recommended)

- **Netlify Drop** — go to [app.netlify.com/drop](https://app.netlify.com/drop),
  drag the whole `pwa-bundle` folder in. You get a URL in seconds.
- **GitHub Pages** — upload the folder to a repository and enable Pages.
- **Cloudflare Pages / Vercel** — same idea.

All are free for a small hotel and give you HTTPS automatically (required
for full PWA features).

### Option 2 — Local computer only

If you only want it on one computer for now, you can run a tiny local
server. From this folder:

```
# If you have Python:
python3 -m http.server 8080
# Then visit http://localhost:8080 in Chrome or Edge
```

### Option 3 — Local network (multiple computers on the same Wi-Fi)

Same as Option 2, but visit `http://<your-computer-ip>:8080` from other
computers. Note: sync across computers still needs the Dropbox/Drive file
setup — the PWA install doesn't do that on its own.

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

Just replace `index.html` on your host with a new version. The service
worker caches the previous one, so users may need to close and reopen the
PWA once to see the update (or refresh the browser tab twice).
