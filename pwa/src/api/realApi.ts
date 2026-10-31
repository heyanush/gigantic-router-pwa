// Real backend client. PortalApi (apiName dispatch + tokenAPI/Bearer) and the UDM/ACS REST proxy.
// Wiring matches PWA_API_CONTRACT.md and the decompiled h8cportal code:
//  - network_util.apiRequestUDM() -> base = UDMURL, header Authorization: Bearer <token>.
//  - DeviceController.getDeviceList() resolves the ACS device via
//    api/_search/devices?query=<keyUserName>&sort=id,desc&page=0&size=100, then uses device._id.
// The live endpoint is set at runtime (Settings) or build time (VITE_PORTAL_API/VITE_UDM_API);
// nothing is hardcoded. The app defaults to the mock. Flip to live in Settings.

import { config } from './config';
import type {
  WlanDto, HostDto, WanDto, Tr098Summary, Job, AccountRights, PortalResponse,
} from './types';
import type { LoginParams, RouterApi } from './RouterApi';

let token: string | null = null;
let lastCreds: LoginParams | null = null;
let username = '';
let deviceIdCache: string | null = null;

function rights(data: Record<string, unknown>): AccountRights {
  const has = (k: string) => Boolean(data?.[k]);
  return {
    changeModemPassword: has('Account Change Modem Password'),
    macReset: has('Account MacReset'),
    disconnect: has('Account Disconnect'),
    mrtg: has('Account MRTG'),
  };
}

/** One PortalApi call: POST { apiName, tokenAPI, ...params }. Retries once on "Invalid token". */
async function portal<T>(apiName: string, params: Record<string, unknown>, retry = true): Promise<PortalResponse<T>> {
  if (!config.portalURL) throw new Error('No portal URL configured — set it in Settings ⚙︎');
  const body = { apiName, tokenAPI: token ?? '', appName: config.appName, ...params };
  const res = await fetch(config.portalURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(config.centralApiKey ? { centralApiKey: config.centralApiKey } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Portal HTTP ${res.status}`);
  const json = (await res.json()) as PortalResponse<T>;
  const msg = (json.ReturnMessage || json.Message || '').toString();
  if (retry && /invalid token/i.test(msg) && lastCreds) {
    await regenerateToken();
    return portal<T>(apiName, params, false);
  }
  return json;
}

async function regenerateToken(): Promise<void> {
  if (!lastCreds) throw new Error('Session expired — please sign in again');
  const r = await portal<unknown>('ReGenarateToken', credsToParams(lastCreds), false);
  if (r.Token) token = r.Token;
  else throw new Error('Could not refresh session');
}

function credsToParams(p: LoginParams): Record<string, unknown> {
  return {
    LoginType: p.loginType,
    Username: p.username ?? p.mobile ?? p.email ?? '',
    Password: p.password ?? '',
    MobileNumber: p.mobile ?? '',
    OTP: p.otp ?? '',
    Email: p.email ?? '',
    SourceType: config.sourceType,
    DeviceID: 'web',
    // Only included if configured for your live API.
    ...(config.systemId ? { systemId: config.systemId } : {}),
    ...(config.systemPass ? { systemPass: config.systemPass } : {}),
  };
}

/** One ACS REST call through the UDM proxy (apiRequestUDM equivalent). */
async function acs<T>(path: string, init?: RequestInit): Promise<T> {
  if (!config.udmURL) throw new Error('No router (UDM) URL configured — set it in Settings ⚙︎');
  const res = await fetch(config.udmURL + path.replace(/^\//, ''), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Router service HTTP ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** Resolve the subscriber's ACS device._id from the username (cached). */
async function resolveDeviceId(): Promise<string> {
  if (deviceIdCache) return deviceIdCache;
  const q = config.deviceQueryOverride || username;
  const list = await acs<Array<{ _id?: string; id?: string }>>(
    `api/_search/devices?query=${encodeURIComponent(q)}&sort=id,desc&page=0&size=100`,
  );
  const id = Array.isArray(list) && list.length ? (list[0]._id ?? list[0].id ?? '') : '';
  if (!id) throw new Error('No router found for this account on the ACS');
  deviceIdCache = id;
  return id;
}

/** UDM calls take a deviceId from the screen, but '' means "resolve from the account". */
async function dev(deviceId: string): Promise<string> {
  return deviceId && deviceId !== 'MOCK-DEVICE-1' ? deviceId : resolveDeviceId();
}

async function postJob(deviceId: string, type: Job['type'], extra: Record<string, unknown> = {}): Promise<Job> {
  const id = await dev(deviceId);
  return acs<Job>('api/jobs', { method: 'POST', body: JSON.stringify({ type, device: id, ...extra }) });
}

export const realApi: RouterApi = {
  async generateOtp(target) {
    await portal('OtpGenerate', { MobileNo: target.mobile ?? '', Email: target.email ?? '', flow: 'login' });
  },

  async login(p) {
    lastCreds = p;
    deviceIdCache = null;
    const r = await portal<Record<string, unknown>>('Token', credsToParams(p));
    if (!r.Token) throw new Error(r.ReturnMessage || r.Message || 'Login failed');
    token = r.Token;
    username = p.username ?? p.mobile ?? p.email ?? '';
    const data = (r.Data as Record<string, unknown>) ?? {};
    // Resolve the ACS device now; don't fail login if the ACS is briefly unreachable.
    let deviceId = '';
    try { deviceId = await resolveDeviceId(); } catch { /* resolved lazily on first UDM call */ }
    return { token: r.Token, username, deviceId, rights: rights(data) };
  },

  async getWlans(deviceId) { return acs<WlanDto[]>(`api/device/${await dev(deviceId)}/wlan`); },
  setWlan: (deviceId, wlan) => postJob(deviceId, 'SET_WLAN_PARAMETER', { wlan }),

  async getHosts(deviceId) { return acs<HostDto[]>(`api/device/${await dev(deviceId)}/host`); },
  blockDevice: (deviceId, macAddress) => postJob(deviceId, 'BLACKLIST_MAC_ADDRESS', { macAddress, macBlock: true }),

  async getSummary(deviceId) { return acs<Tr098Summary>(`api/device/${await dev(deviceId)}/tr098Summary`); },
  async getWan(deviceId) { return acs<WanDto>(`api/device/${await dev(deviceId)}/wan`); },
  reboot: (deviceId) => postJob(deviceId, 'RESTART'),
  refresh: (deviceId) => postJob(deviceId, 'REFRESH'),

  async getJob(deviceId, jobId) {
    const id = await dev(deviceId);
    const list = await acs<Job[]>(
      `api/_search/jobs?query=device.id%3A${encodeURIComponent(id)}&sort=id,desc&page=0&size=20`,
    );
    return (Array.isArray(list) ? list.find((j) => j._id === jobId) : null) ?? { _id: jobId, type: 'VERIFY', device: id, status: 'RUNNING' };
  },

  async changeModemPassword(current, next) {
    const r = await portal('ChangeCPEPPassword', { Password: next, CurrentPassword: current });
    const ok = r.Success === true || r.Success === 'true' || /success/i.test((r.Message || '').toString());
    if (!ok) throw new Error(r.ReturnMessage || r.Message || 'Could not change modem password');
  },
};

/** Lightweight connectivity probe for the Settings panel. Does not need a session. */
export async function pingBackend(): Promise<{ portal: boolean; udm: boolean; detail: string }> {
  const out = { portal: false, udm: false, detail: '' };
  if (!config.portalURL && !config.udmURL) { out.detail = 'No endpoints configured'; return out; }
  try {
    const r = await fetch(config.portalURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiName: 'AppVersionCheck', appName: config.appName }),
    });
    out.portal = r.ok;
    if (!r.ok) out.detail += `portal HTTP ${r.status}; `;
  } catch (e) { out.detail += `portal: ${(e as Error).message}; `; }
  try {
    const r = await fetch(config.udmURL, { method: 'GET' });
    out.udm = r.status < 500; // any response means the proxy is reachable
    if (r.status >= 500) out.detail += `udm HTTP ${r.status}; `;
  } catch (e) { out.detail += `udm: ${(e as Error).message}; `; }
  if (!out.detail) out.detail = 'reachable';
  return out;
}
