# Setup Tutorial — Cesium Ion Token + Google Photorealistic 3D Tiles

This site renders its 3D globe with [CesiumJS](https://cesium.com/platform/cesiumjs/) consuming [Google Maps Platform Photorealistic 3D Tiles](https://developers.google.com/maps/documentation/tile/3d-tiles). You need **two free credentials** before the app will run:

1. A **Google Maps Platform API key** with the Map Tiles API enabled.
2. A **Cesium Ion access token** for Cesium's default assets.

Total setup time: about 10–15 minutes. Both providers have free monthly quotas suitable for development.

---

## Part 1 — Google Maps Platform (Photorealistic 3D Tiles)

### Step 1 — Open the Google Cloud Console

Go to <https://console.cloud.google.com/>. Sign in with a Google account.

If this is your first time, accept the Terms of Service when prompted.

### Step 2 — Create (or select) a project

In the top blue bar, click the project dropdown (left of the search bar — it shows your current project name, or "Select a project" if none).

- **New project:** Click **New Project**, give it a name like `world-view-3d`, and click **Create**. Wait ~10 seconds for the project to provision, then select it from the dropdown.
- **Existing project:** Select an existing project from the list.

### Step 3 — Enable billing

The Map Tiles API requires a billing account, **even though there is a free monthly quota and you may never be charged**. Without billing enabled, all API requests return `403 Forbidden`.

1. Left sidebar (☰ menu) → **Billing**.
2. If "This project has no billing account" is shown, click **Link a billing account**.
3. Either select an existing billing account or click **Manage billing accounts** → **Create account** and follow the prompts (requires a credit card).
4. Set a **budget alert** while you're here — see [Cost & billing](#cost--billing) at the bottom of this document.

### Step 4 — Enable the Map Tiles API

This is the one you want — **not** the "Maps JavaScript API", which is a different product.

1. Left sidebar → **APIs & Services** → **Library**.
2. Search for **Map Tiles API**.
3. Click the result titled exactly **Map Tiles API** (the icon shows a stylized 3D city block).
4. Click **Enable**. Wait ~10 seconds.

### Step 5 — Create an API key

1. Left sidebar → **APIs & Services** → **Credentials**.
2. Top bar → **+ Create credentials** → **API key**.
3. A popup shows your new key (`AIza...`). Copy it. You can also retrieve it later from this same Credentials page.
4. Click **Close** in the popup.

### Step 6 — Restrict the API key

**Do not skip this step.** An unrestricted key is a security risk; anyone who finds it in your bundle can run up your bill.

1. On the Credentials page, find your new key in the list and click its name (or the pencil icon).
2. Under **Application restrictions**, choose **Websites**.
3. Click **Add** under "Website restrictions" and add these entries one at a time:
   - `localhost:*/*` — for local development (with port wildcard)
   - `127.0.0.1:*/*` — alternative localhost form
   - Your production domain pattern (e.g. `https://world-view-3d.vercel.app/*`, `https://*.vercel.app/*` for preview deployments, or your custom domain)
4. Under **API restrictions**, choose **Restrict key**.
5. In the dropdown, tick **Map Tiles API** only.
6. Scroll down and click **Save**.

> Restrictions take ~5 minutes to propagate. If you test immediately after saving and get 403s, wait 5 minutes and try again.

### Step 7 — Verify the key works

Open a terminal and run:

```bash
curl "https://tile.googleapis.com/v1/3dtiles/root.json?key=YOUR_KEY_HERE"
```

**Expected response:** a `200 OK` with a JSON body that starts with something like `{"asset":{"version":"1.0",...},"root":{...}}`.

**If you get `403 Forbidden`:**
- The Map Tiles API isn't enabled on this project (Step 4).
- Billing isn't enabled on this project (Step 3).
- The key is correct but referrer restrictions are blocking `curl` (curl sends no Referer header). To verify the key works from the browser, open `http://localhost` in your browser DevTools console after running the dev server and check the Network tab for `tile.googleapis.com` requests — those should succeed.
- It's been less than 5 minutes since you saved the restrictions.

**If you get `401 Unauthorized`:**
- The key is malformed or doesn't exist. Re-copy it from the Credentials page.

**If you get `400 Bad Request`:**
- Check the URL. The `/v1/3dtiles/root.json` path matters; there's no trailing slash.

---

## Part 2 — Cesium Ion access token

CesiumJS works without Ion (the Photorealistic 3D Tiles come from Google, not Ion), but Cesium loads default assets (skybox imagery, default fonts) from Ion and prints a warning to the console if no token is configured. Setting a token suppresses the warning and gives you access to Cesium's free default scene assets.

### Step 1 — Sign up

Go to <https://ion.cesium.com/signup/>. Sign up free with email or Google.

The free tier gives you 5 GB of asset hosting and 30 GB of monthly streaming bandwidth — far more than you need for this project, since the only Ion asset we use is the default startup imagery.

### Step 2 — Generate a token

1. After signup, go to **Access Tokens** (left sidebar).
2. Cesium auto-creates a "Default Token" for new accounts. You can use this one.
3. Click on the token row → click **Copy token** → save it somewhere safe.

The token starts with `eyJhbGc...` (it's a JWT).

> The default token has scopes: `assets:read`, `geocode`. Both are needed by Cesium's defaults; no changes required.

---

## Part 3 — Add the keys to your local environment

In the project root, create a file named `.env.local`:

```
VITE_GOOGLE_MAPS_API_KEY=AIza...your_full_google_key
VITE_CESIUM_ION_TOKEN=eyJhbGc...your_full_ion_token
```

> **Both values must be set.** If either is missing, the app shows a red "Cesium setup issue" banner and the globe won't load.

### Verify `.env.local` is gitignored

```bash
git check-ignore .env.local && echo "ignored ✓" || echo "NOT IGNORED — fix .gitignore!"
```

If you see "ignored ✓" you're good. The project's `.gitignore` already covers `.env*` and `*.local`, so you should be fine.

### Restart the dev server

Vite reads env vars at startup. If `npm run dev` was already running, **stop it (`Ctrl+C`) and restart**, otherwise the new env vars won't be picked up.

```bash
npm run dev
```

You should see the Cesium globe load within a few seconds, with photorealistic Earth visible. Initial tiles take 1–2 seconds to sharpen — that's normal progressive loading, not a bug.

---

## Cost & billing

### Google Maps Platform — Map Tiles API

- **Pricing:** $0.005 per session-based request, after a free monthly quota of 100,000 session requests.
- **A "session"** lasts ~15 minutes per user. The first 3D tile request opens a session; subsequent requests within 15 minutes reuse the same session.
- **Dev impact:** Every hot-reload of `npm run dev` likely opens a new session. A heavy dev day with 50+ reloads burns ~50 sessions = ~$0.25. A normal day is closer to $0.10.
- **Production impact:** 1,000 unique daily visitors ≈ 30,000 sessions/month = $150/month after the free quota. Free quota covers ~3,000 unique visitors/month.

### Set a billing budget alert

To avoid surprise bills:

1. Google Cloud Console → **Billing** → **Budgets & alerts** → **Create budget**.
2. Scope: select your project.
3. Amount: choose a monthly budget (e.g., $10 for dev, higher for production).
4. Alerts: tick the boxes at 50%, 90%, 100% of budget.
5. Email recipients: your address.

Budget alerts are **notifications only** — they do not auto-disable the API. To hard-cap costs, you'd need to also write a billing-driven Cloud Function that disables the API when the budget is hit. For most dev work, alerts are sufficient.

### Cesium Ion

The free tier we use only for the default token / default assets. As long as you don't upload assets or use Ion's premium 3D tiles, you'll stay in the free tier indefinitely.

---

## Troubleshooting

### "Cesium setup issue" red banner on load
Either `VITE_GOOGLE_MAPS_API_KEY` or `VITE_CESIUM_ION_TOKEN` is missing from `.env.local`, or the dev server wasn't restarted after creating the file. Stop `npm run dev` (Ctrl+C) and restart it.

### "Google 3D Tiles failed: ..." error overlay
The tileset failed to load. Check the browser console for the exact error.
- **403 Forbidden:** API key restrictions are wrong (Step 6 above) or billing isn't enabled.
- **404 Not Found:** Typo in the API key, or the Map Tiles API isn't enabled.
- **Network error:** firewall / proxy / offline.

### Globe loads but tiles look blurry / patchy
This is **progressive loading working as intended**. Cesium streams the tiles in order of importance; the first few seconds of any new viewpoint will look low-resolution before sharpening. Wait 2–3 seconds. If it never sharpens, check the Network tab — successful `.glb` and `.json` responses from `tile.googleapis.com` mean tiles are loading; if they're stalled, your network is the problem.

### Console warning: "This application is using Cesium's default ion access token..."
Means `VITE_CESIUM_ION_TOKEN` is unset or the token string doesn't start with `eyJ`. Recheck `.env.local` — make sure there's no whitespace around the `=` and no quotes around the value.

### "WebGL not supported" or black canvas
The user's GPU / browser doesn't support WebGL 2 (Cesium requires it). Update the browser or test on a different machine.

### Site loads in dev but bundle fails in production
`vite-plugin-cesium` should copy Cesium's static assets (`Workers/`, `Assets/`, `Widgets/`, `ThirdParty/`) to `dist/cesium/` on build. If those folders are missing from your deployed `dist/`, re-check `vite.config.js` to confirm `cesium()` is in the `plugins` array.

### High bill on a dev day
Dev sessions add up fast with hot-reload. Mitigations:
- Use the production build for screenshots / demos (`npm run build && npm run preview`) — far fewer reloads.
- Avoid keeping the dev server running idle for hours.
- Lower the session count by minimizing browser tab refreshes; use HMR instead.

---

## Quick reference

| Item | Value / Location |
|---|---|
| Google Cloud Console | <https://console.cloud.google.com/> |
| Map Tiles API page | Library → search "Map Tiles API" |
| API key management | APIs & Services → Credentials |
| Cesium Ion signup | <https://ion.cesium.com/signup/> |
| Cesium Ion tokens | <https://ion.cesium.com/tokens> |
| Env file location | Project root: `.env.local` |
| Verification curl | `curl "https://tile.googleapis.com/v1/3dtiles/root.json?key=KEY"` |
| Dev server | `npm run dev` |
| Production build | `npm run build` |
