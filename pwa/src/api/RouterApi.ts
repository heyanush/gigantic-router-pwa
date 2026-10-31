import type { WlanDto, HostDto, WanDto, Tr098Summary, Job, Session } from './types';
import type { LoginType } from './config';

export interface LoginParams {
  loginType: LoginType;
  username?: string;
  password?: string;
  mobile?: string;
  otp?: string;
  email?: string;
}

/** Backend-agnostic surface the screens use. Implemented by the real API and the mock. */
export interface RouterApi {
  // auth
  generateOtp(target: { mobile?: string; email?: string }): Promise<void>;
  login(p: LoginParams): Promise<Session>;

  // wifi
  getWlans(deviceId: string): Promise<WlanDto[]>;
  setWlan(deviceId: string, wlan: WlanDto): Promise<Job>;

  // connected devices
  getHosts(deviceId: string): Promise<HostDto[]>;
  blockDevice(deviceId: string, macAddress: string): Promise<Job>;

  // status / reboot
  getSummary(deviceId: string): Promise<Tr098Summary>;
  getWan(deviceId: string): Promise<WanDto>;
  reboot(deviceId: string): Promise<Job>;
  refresh(deviceId: string): Promise<Job>;

  // poll a job to completion
  getJob(deviceId: string, jobId: string): Promise<Job>;

  // security
  changeModemPassword(current: string, next: string): Promise<void>;
}
