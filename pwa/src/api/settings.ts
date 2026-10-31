// Runtime backend settings, persisted to localStorage so you can point the PWA at a live
// portal (QA or prod) and flip mock/live WITHOUT rebuilding. Env vars provide the defaults.

export interface BackendSettings {
  useMock: boolean;
  /** Origin the dev-server proxy forwards /portal and /udm to (dev). In prod builds this is
   *  informational; real routing is same-origin /portal & /udm (see deploy notes in README). */
  portalOrigin: string;
  /** Path prefixes (after the proxy). Mirror appSetting.json. */
  portalPath: string;
  udmPath: string;
  encryption: boolean;
  /** Override the ACS device-search identifier; blank = use the logged-in username. */
  deviceQueryOverride: string;
}

const KEY = 'gigantic.backend';

const defaults: BackendSettings = {
  useMock: (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false',
  portalOrigin: import.meta.env.VITE_PORTAL_ORIGIN ?? 'http://172.16.0.2',
  portalPath: '/portal/qabuild/PortalApi/',
  udmPath: '/udm/qabuild/api/h8UDMProxy.ashx/',
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
