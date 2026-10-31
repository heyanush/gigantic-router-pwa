// In-memory mock of the router backend so the PWA runs without the ISP network.
// Shapes match the recovered DTOs exactly, so swapping to realApi needs no screen changes.

import type { WlanDto, HostDto, WanDto, Tr098Summary, Job, Session } from './types';
import type { LoginParams, RouterApi } from './RouterApi';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let wlans: WlanDto[] = [
  {
    name: 'WLAN1', ssid: 'Gigantic-Home', password: 'sunrise-42', enable: true, interfaceEnable: true,
    band: '2.4GHz', channel: 6, autoChannelEnable: true, encryptionMode: 'WPA/WPA2',
    operatingStandard: '802.11n', signalStrength: -41, status: 'Up', macAddress: 'AC:9E:17:00:11:01',
  },
  {
    name: 'WLAN2', ssid: 'Gigantic-Home-5G', password: 'sunrise-42', enable: true, interfaceEnable: true,
    band: '5GHz', channel: 44, autoChannelEnable: false, encryptionMode: 'WPA2',
    operatingStandard: '802.11ac', signalStrength: -39, status: 'Up', macAddress: 'AC:9E:17:00:11:02',
  },
];

let hosts: HostDto[] = [
  { active: true, hostname: "Anush's iPhone", ipAddress: '192.168.1.24', macAddress: 'F0:18:98:1A:2B:3C', interfaceType: '802.11', band: '5GHz', signalStrength: -46, status: 'Online' },
  { active: true, hostname: 'Living-Room-TV', ipAddress: '192.168.1.31', macAddress: '44:65:0D:9C:11:22', interfaceType: '802.11', band: '2.4GHz', signalStrength: -58, status: 'Online' },
  { active: true, hostname: 'Work-Laptop', ipAddress: '192.168.1.42', macAddress: '3C:22:FB:88:77:66', interfaceType: 'Ethernet', status: 'Online' },
  { active: false, hostname: 'Guest-Phone', ipAddress: '192.168.1.57', macAddress: 'A4:83:E7:55:44:33', interfaceType: '802.11', band: '2.4GHz', signalStrength: -72, status: 'Offline' },
];

const wan: WanDto = {
  name: 'WAN1', enable: true, connectionStatus: 'Connected', connectionType: 'IP_Routed',
  addressingType: 'PPPoE', externalIPAddress: '103.214.118.42', defaultGateway: '103.214.118.1',
  dnsServers: '1.1.1.1, 8.8.8.8', natEnable: true, subnetMask: '255.255.255.0', uptime: 486210,
  userName: 'gigantic-9001', receivedByte: 824_113_664_000, sentByte: 91_233_280_000,
};

const summary: Tr098Summary = {
  manufacturer: 'Nokia', modelName: 'G-2425G-A', softwareVersion: '3FE49362IJKL49',
  additionalHardwareVersion: '3FE', uptime: 486210, cpuUsage: 17, serialNumber: 'ALCLB1A2C3D4',
};

let modemPassword = 'admin-current';
const jobs = new Map<string, Job>();

function makeJob(type: Job['type'], device: string): Job {
  const id = 'job_' + Math.random().toString(36).slice(2, 10);
  const job: Job = { _id: id, type, device, status: 'CREATED' };
  jobs.set(id, job);
  // CREATED -> RUNNING -> COMPLETED, like the ACS.
  setTimeout(() => { const j = jobs.get(id); if (j) j.status = 'RUNNING'; }, 500);
  setTimeout(() => { const j = jobs.get(id); if (j) j.status = 'COMPLETED'; }, 1800);
  return job;
}

export const mockApi: RouterApi = {
  async generateOtp() { await delay(400); },

  async login(p: LoginParams): Promise<Session> {
    await delay(600);
    if (p.loginType.includes('Otp') || p.loginType.includes('Otp')) {
      if (p.otp !== '000000' && p.otp !== '123456') throw new Error('Enter OTP 123456 (demo)');
    } else if (!p.password) {
      throw new Error('Password required');
    }
    return {
      token: 'mock-token',
      username: p.username ?? p.mobile ?? p.email ?? 'demo',
      deviceId: 'MOCK-DEVICE-1',
      rights: { changeModemPassword: true, macReset: true, disconnect: true, mrtg: true },
    };
  },

  async getWlans() { await delay(400); return structuredClone(wlans); },
  async setWlan(_dev, wlan) {
    await delay(300);
    wlans = wlans.map((w) => (w.name === wlan.name ? { ...w, ...wlan } : w));
    return makeJob('SET_WLAN_PARAMETER', _dev);
  },

  async getHosts() { await delay(400); return structuredClone(hosts); },
  async blockDevice(_dev, mac) {
    await delay(300);
    hosts = hosts.map((h) => (h.macAddress === mac ? { ...h, active: false, status: 'Blocked' } : h));
    return makeJob('BLACKLIST_MAC_ADDRESS', _dev);
  },

  async getSummary() { await delay(350); return structuredClone(summary); },
  async getWan() { await delay(350); return structuredClone(wan); },
  async reboot(dev) { await delay(300); return makeJob('RESTART', dev); },
  async refresh(dev) { await delay(300); return makeJob('REFRESH', dev); },

  async getJob(_dev, jobId) {
    await delay(300);
    return jobs.get(jobId) ?? { _id: jobId, type: 'VERIFY', device: _dev, status: 'DROPPED' };
  },

  async changeModemPassword(current, next) {
    await delay(500);
    if (current !== modemPassword) throw new Error('Current password is incorrect (demo current: admin-current)');
    modemPassword = next;
  },
};
