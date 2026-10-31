// Runtime backend settings, persisted to localStorage so you can point the PWA at a live
// portal on-device WITHOUT rebuilding. No QA URLs or credentials are baked into the build.
//
// Production (GitHub Pages) is static — there is NO dev proxy — so the app calls the portal
// DIRECTLY. For that to work the live portal must be HTTPS and must send CORS headers allowing
// this site's origin. In dev, the Vite proxy (/portal, /udm) handles CORS for you.

export interface BackendSettings {
  /** Full URL to the PortalApi handler, e.g. https://portal.example.com/PortalApi/ */
  portalApi: string;
  /** Full URL to the UDM/ACS proxy, e.g. https://portal.example.com/api/h8UDMProxy.ashx/ */
  udmApi: string;
  /** Optional app-level credentials / key, only if your live API requires them. Blank by default. */
  systemId: string;
  systemPass: string;
  centralApiKey: string;
  encryption: boolean;
  /** Override the ACS device-search identifier; blank = use the logged-in username. */
  deviceQueryOverride: string;
}

const KEY = 'gigantic.backend';
const DEV = import.meta.env.DEV;

// Both dev (Vite proxy) and prod (Cloudflare Pages Functions) expose the portal under the
// same-origin paths /portal and /udm, so the app never makes a cross-origin call. The real
// portal host lives server-side (dev: VITE_PORTAL_ORIGIN; prod: the PORTAL_ORIGIN env var).
// Adjust the path portion here or in Settings if your portal's PortalApi lives elsewhere.
const defaults: BackendSettings = {
  portalApi: import.meta.env.VITE_PORTAL_API ?? (DEV ? '/portal/qabuild/PortalApi/' : '/portal/PortalApi/'),
  udmApi: import.meta.env.VITE_UDM_API ?? (DEV ? '/udm/qabuild/api/h8UDMProxy.ashx/' : '/udm/api/h8UDMProxy.ashx/'),
  systemId: import.meta.env.VITE_SYSTEM_ID ?? '',
  systemPass: import.meta.env.VITE_SYSTEM_PASS ?? '',
  centralApiKey: import.meta.env.VITE_CENTRAL_API_KEY ?? '',
  encryption: false,
  deviceQueryOverride: '',
};

export function getSettings(): BackendSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return { ...defaults };
}

export function saveSettings(patch: Partial<BackendSettings>): void {
  const next = { ...getSettings(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
}
