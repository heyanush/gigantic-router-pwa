import { USE_MOCK } from './config';
import { mockApi } from './mockApi';
import { realApi, pingBackend } from './realApi';
import type { RouterApi } from './RouterApi';

export const api: RouterApi = USE_MOCK ? mockApi : realApi;
export { USE_MOCK, pingBackend };
export { getSettings, saveSettings } from './settings';
export type { BackendSettings } from './settings';
export type { RouterApi } from './RouterApi';
export * from './types';

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
