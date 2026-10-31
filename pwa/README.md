# Gigantic Router Manager (PWA)

An installable PWA to manage the WiFi modem/router through the h8 ISP portal — WiFi settings,
connected devices, and reboot/status. Built from the contract reverse-engineered in
[`../PWA_API_CONTRACT.md`](../PWA_API_CONTRACT.md).

## Run

```bash
cd pwa
npm install
npm run dev        # http://localhost:5173  (demo/mock mode by default)
```

Build / preview:

```bash
npm run build
npm run preview
```

## Mock vs live backend

The app runs against an **in-memory mock** by default so it works anywhere (the ISP backend is
only reachable on their network). Shapes match the recovered DTOs exactly, so no screen changes
are needed to go live.

- Demo login: any mobile number, OTP **123456**.
- To hit the real portal (on the ISP network / VPN):

```bash
VITE_USE_MOCK=false VITE_PORTAL_ORIGIN=http://172.16.0.2 npm run dev
```

The dev server proxies `/portal/*` and `/udm/*` to `VITE_PORTAL_ORIGIN` to avoid CORS.

You can also flip mock/live and point at a portal **at runtime** via the in-app **⚙︎ Settings**
panel (origin, API paths, device-search identifier, encryption, plus a **Test connection**
probe) — no rebuild. Settings persist in localStorage.

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
| `src/api/mockApi.ts` | in-memory backend for demo/offline dev |
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
