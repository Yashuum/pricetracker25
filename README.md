# PrivEx — Private Browser + S25 Ultra Price Tracker

A lightweight PWA that doubles as a private browsing shell and a Samsung Galaxy S25 Ultra price tracker. No backend, no accounts, no analytics.

---

## Files

```
privex/
├── index.html          # App shell
├── styles.css          # All styles
├── app.js              # Logic: tracker + browser
├── service-worker.js   # Offline caching (tracker only)
├── manifest.json       # PWA metadata
├── price-data.json     # ← Edit this to update prices
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

---

## 1. Run locally

You need a local HTTPS or localhost server (service workers require secure context).

**Option A — Python**
```bash
cd privex
python3 -m http.server 8080
# Open: http://localhost:8080
```

**Option B — Node (npx)**
```bash
npx serve privex
```

Open the URL in your browser. On iPhone, use an HTTPS deployment (below) for full PWA install.

---

## 2. Deploy free on Cloudflare Pages

1. Push the `privex/` folder to a GitHub repository.
2. Go to [Cloudflare Pages](https://pages.cloudflare.com) → Create project → Connect to Git.
3. Select your repo. Set:
   - Build command: *(leave blank)*
   - Build output directory: `/` (or `privex` if repo root is one level up)
4. Deploy. Cloudflare gives you a free `*.pages.dev` HTTPS URL.

**Alternative: GitHub Pages**
1. Push to a `gh-pages` branch or enable Pages on `main` in repo Settings → Pages.
2. Use the generated `https://username.github.io/repo-name/` URL.

---

## 3. Install on iPhone

1. Open the HTTPS URL in **Safari** (other browsers can't install PWAs on iOS).
2. Tap the **Share** icon → **Add to Home Screen**.
3. Tap **Add**.
4. Open PrivEx from your home screen — it launches in standalone mode (no Safari UI).

---

## 4. Update price data

Open `price-data.json` in any text editor.

Key fields:
```json
{
  "currentPrice": 129999,
  "lowestPrice": 119999,
  "lowestPriceDate": "2025-09-14",
  "lastUpdated": "2025-10-13",
  "history": [
    { "date": "YYYY-MM-DD", "price": 129999 },
    ...
  ]
}
```

- Keep `history` as an array of 30 `{ date, price }` objects, oldest first.
- After editing, push to your repo — Cloudflare Pages redeploys automatically.
- The app fetches `price-data.json` fresh on each launch (cache-busted).

**⚠ All data is manually maintained demo data. It is not sourced from any live feed and is not verified.**

---

## Features and limitations

### What works
- Price tracker with 30-day chart, lowest price, vs-low comparison
- Private browsing shell via iframe (Google search, any address)
- Browse session cleared when app goes to background or on next launch
- No browsing history, search terms, or sessions stored by the app
- Offline support for the tracker shell (service worker cache)
- PWA install: standalone, no Safari chrome, home screen icon

### Limitations
- **iframe blocking**: Many sites (Twitter, Instagram, banks, Google Maps) block iframe embedding via `X-Frame-Options` or `Content-Security-Policy`. When blocked, the iframe shows a blank frame. The search page itself (Google) works. There is no workaround for this without a proxy backend.
- **Privacy**: The app does not log your browsing. However, websites you visit log your IP, device, and session on *their* servers. Cookies set by websites persist in the browser's own storage, not in app-managed storage — clearing Safari's website data removes them.
- **Phone lock detection**: iOS does not fire a reliable event when the screen locks. The app resets the browser on `visibilitychange` (app backgrounded), which covers most cases.
- **Ad/tracker blocking**: The service worker only intercepts requests to the app's own origin. It cannot filter third-party resources on external sites opened in the iframe. There is no way to implement a full content blocker in a PWA without native OS integration (which requires an App Store app).
- **Chart.js CDN**: The chart requires an internet connection on first load. After that, the service worker caches it for offline use.
