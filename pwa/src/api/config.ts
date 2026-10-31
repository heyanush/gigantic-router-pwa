// App config, derived from runtime settings (localStorage) with env defaults — see settings.ts.
// No QA endpoints or credentials are hardcoded here; the live endpoint is set on-device in
// Settings, or baked at build time via VITE_PORTAL_API / VITE_UDM_API.

import { getSettings } from './settings';

const s = getSettings();

export const config = {
  // PortalApi handler (account, token, sessions, CPE password). Full URL; dispatch via `apiName`.
  portalURL: s.portalApi,
  regenerateTokenPath: s.portalApi,
  // UDM proxy -> GenieACS-style TR-069 ACS (router control). Same Bearer token as PortalApi.
  udmURL: s.udmApi,

  appName: 'gigantic',
  // Optional app-level creds — blank unless configured. Only sent if present.
  systemId: s.systemId,
  systemPass: s.systemPass,
  centralApiKey: s.centralApiKey,
  // If the live portal enforces `enc`, terminate it server-side — never ship a key to the browser.
  encryption: s.encryption,
  lengthForOTP: 6,
  sourceType: 'Customer',
  deviceQueryOverride: s.deviceQueryOverride,
} as const;

export type LoginType =
  | 'userNameWithPassword'
  | 'mobileWithPassword'
  | 'mobileWithOtp'
  | 'emailWithPassword';
