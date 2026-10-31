# Gigantic Router Manager (PWA)

An installable PWA to manage the WiFi modem/router through the h8 ISP portal — WiFi settings,
connected devices, and reboot/status. Built from the contract reverse-engineered in
[`../PWA_API_CONTRACT.md`](../PWA_API_CONTRACT.md).

## Run

```bash
cd pwa
npm install
npm run dev        # http://localhost:5173
```

The app is **live-only** — it talks to a real portal, no mock/demo mode. In dev, the Vite proxy
(`/portal`, `/udm`) forwards to `VITE_PORTAL_ORIGIN` so you can test against a backend without CORS:

```bash
VITE_PORTAL_ORIGIN=https://portal.example.com npm run dev
```

Build / preview:

```bash
npm run build
npm run preview
```

## Hosting (Cloudflare Pages — recommended, works against a live portal)

GitHub Pages is static with no proxy, so a browser there hits CORS calling a real portal.
Cloudflare Pages bundles **Pages Functions**, so the frontend and a same-origin reverse proxy
live on one domain — the browser calls `/portal/*` and `/udm/*` on its own origin (no CORS,
no mixed content), and the function forwards to the portal server-side. The portal host stays
out of the public bundle.

**Deploy (dashboard, ~2 min):**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages →
   Connect to Git** → pick `gigantic-router-pwa`.
2. Build settings:
   - Build command: `cd pwa && npm install && npm run build`
   - Build output directory: `pwa/dist`
   - Root directory: `/` (the `functions/` proxy is auto-detected here)
3. **Settings → Environment variables** → add `PORTAL_ORIGIN` = your portal host,
   e.g. `https://selfcare.example.com` (no trailing path).
4. Save & Deploy. Site: `https://<project>.pages.dev`.

The app then calls `/portal/PortalApi/` and `/udm/api/h8UDMProxy.ashx/` same-origin; the function
rewrites those to `${PORTAL_ORIGIN}/PortalApi/` etc. If your portal's PortalApi path differs,
change it in **⚙︎ Settings** (path only — the host is the server-side env var).

> Files: `functions/_proxy.js`, `functions/portal/[[path]].js`, `functions/udm/[[path]].js`,
> and `pwa/public/_redirects` (SPA fallback).

### Hosting (GitHub Pages — demo shell only)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds under the repo subpath
and deploys to Pages. No backend is baked in. Note: Pages is static (no proxy), so it **cannot
reach a real portal from the browser** (CORS) — it's a UI preview, not a working deployment.

Live URL: `https://<user>.github.io/<repo>/`.

### Using it on live devices
Pages is **static — there is no proxy**, so in production the app calls the portal **directly**
from the browser. Two backend-side requirements (you control these):

1. **HTTPS** — the portal must be served over HTTPS (Pages is HTTPS; an HTTP portal is blocked as
   mixed content).
2. **CORS** — the portal must send `Access-Control-Allow-Origin` for the Pages origin
   (and allow the `Authorization`, `Content-Type`, `centralApiKey` headers + `POST`/`GET`).

Then on the device: open **⚙︎ Settings**, paste your Portal API URL and UDM proxy URL
(full `https://…` URLs), **Test connection**, and sign in. Settings persist in localStorage.
To bake defaults instead, set `VITE_PORTAL_API` / `VITE_UDM_API` at build time (e.g. via CI secrets
— don't commit a real URL to a public repo).

> If you can't add CORS to the portal, host behind a small reverse proxy (Cloudflare Worker,
> nginx) that adds CORS and forwards to the portal, and point the app at the proxy URL.

### How the live client works (matches the decompiled app)
- **Auth:** `Token` apiName → token sent as `Authorization: Bearer` *and* body `tokenAPI`;
  auto-refresh via `ReGenarateToken` on `"Invalid token"`.
- **ACS device:** resolved from the logged-in username via
  `api/_search/devices?query=<username>&sort=id,desc&page=0&size=100` → first hit's `_id`,
  cached. Override the identifier in Settings if your proxy keys devices differently.
- **Router ops:** `GET api/device/{id}/{wlan|host|wan|tr098Summary}`; actions are
  `POST api/jobs {type,device,...}` then poll `api/_search/jobs`.

### ⚠️ Not verified against the live server
The QA portal (`172.16.0.2`) is only reachable on the ISP network, so the live path was built
from the contract and type-checked but **not exercised end-to-end from this machine**. On-network,
open ⚙︎ → set Live → Test connection, then sign in. Likely first-run adjustments: the exact
`query=` value for device search, and the `SET_WLAN_PARAMETER` sub-field casing.

## Structure

| Path | What |
|---|---|
| `src/api/config.ts` | base URLs, flags (mirrors `appSetting.json`) |
| `src/api/types.ts` | DTOs — exact JSON keys from the decompiled app |
| `src/api/RouterApi.ts` | backend-agnostic interface the screens use |
| `src/api/realApi.ts` | live client: PortalApi (`apiName`/`tokenAPI`/Bearer) + UDM/ACS REST + jobs |
| `src/screens/Wifi.tsx` | WiFi settings (GET/SET `wlan`) |
| `src/screens/Devices.tsx` | connected devices (GET `host` + blacklist job) |
| `src/screens/Status.tsx` | status + reboot (`tr098Summary`/`wan` + RESTART job) |

## Notes / TODO before production

- **Auth:** `realApi` sends the token as both `Authorization: Bearer` and body `tokenAPI`, and
  refreshes via `ReGenarateToken` on `"Invalid token"` — matching the app. Confirm the exact
  `Token` response field for `deviceId` (ACS `device.id`) against your backend.
- **Feature gating:** wire the account-rights flags (`Account Change Modem Password`,
  `Account MacReset`, `Account Disconnect`, `Account MRTG`) into the UI.
- **Encryption:** if prod enforces `enc`, do NOT ship the app's hard-coded AES key to the browser
  — terminate encryption server-side. See the contract doc.
- **Change modem password** — done: a rights-gated card on the Status screen
  ([`src/screens/ModemPassword.tsx`](src/screens/ModemPassword.tsx)), calling
  `ChangeCPEPPassword`. Shown only when the account has `Account Change Modem Password`.
