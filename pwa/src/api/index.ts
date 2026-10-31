import { realApi, pingBackend } from './realApi';
import { config } from './config';
import type { RouterApi } from './RouterApi';

export const api: RouterApi = realApi;
export { pingBackend };
export { config };
export { getSettings, saveSettings } from './settings';
export type { BackendSettings } from './settings';
export type { RouterApi } from './RouterApi';
export * from './types';

/** True once a live portal endpoint has been configured (Settings or build-time env). */
export function isConfigured(): boolean {
  return Boolean(config.portalURL);
}

/** Poll an ACS job until it leaves CREATED/RUNNING (or times out). */
export async function waitForJob(
  deviceId: string,
  jobId: string,
  onTick?: (status: string) => void,
  timeoutMs = 20000,
): Promise<string> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await api.getJob(deviceId, jobId);
    const status = (job.status ?? 'UNKNOWN').toString();
    onTick?.(status);
    if (status === 'COMPLETED' || status === 'DROPPED') return status;
    if (Date.now() - start > timeoutMs) return 'TIMEOUT';
    await new Promise((r) => setTimeout(r, 800));
  }
}
