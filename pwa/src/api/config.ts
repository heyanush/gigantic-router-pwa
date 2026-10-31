// App config. Base paths point at the dev-server proxy (see vite.config.ts) so calls are
// same-origin. Values come from runtime settings (localStorage) with env defaults — see settings.ts.
//
// Real backend (QA): http://172.16.0.2/qabuild/...  -> proxied under /portal and /udm.

import { getSettings } from './settings';

const s = getSettings();

export const config = {
  // PortalApi handler (account, token, sessions, CPE password). Single endpoint; dispatch via `apiName`.
  portalURL: s.portalPath,
  regenerateTokenPath: s.portalPath,
  // UDM proxy -> GenieACS-style TR-069 ACS (router control). REST + jobs. Same Bearer token as PortalApi.
  udmURL: s.udmPath,

  appName: 'gigantic',
  systemId: 'AndroidAppAdmin',
  systemPass: 'AndroidAppPass',
  centralApiKey: '123456',
  // The app ships encryption:false in QA. If prod enforces `enc`, that must be handled
  // server-side for a web client — see PWA_API_CONTRACT.md (the static key must NOT ship in-browser).
  encryption: s.encryption,
  lengthForOTP: 6,
  sourceType: 'Customer',
  deviceQueryOverride: s.deviceQueryOverride,
} as const;

// Use the in-memory mock backend instead of real HTTP. Default ON so the app runs anywhere
// (the QA backend is only reachable on the ISP network). Toggle in Settings or via VITE_USE_MOCK.
export const USE_MOCK = s.useMock;

export type LoginType =
  | 'userNameWithPassword'
  | 'mobileWithPassword'
  | 'mobileWithOtp'
  | 'emailWithPassword';
