// DTOs recovered verbatim from the AOT snapshot (blutter): asm/h8cportal/udm/dto/*.dart
// Keys match the on-the-wire JSON exactly. See recovered_udm_dtos.md.

/** WiFi radio / SSID — udm/dto/wlanDto.dart */
export interface WlanDto {
  name?: string;
  ssid?: string;
  password?: string;
  enable?: boolean;
  interfaceEnable?: boolean;
  band?: '2.4GHz' | '5GHz' | string;
  channel?: number | string;
  channelInUse?: number | string;
  autoChannelEnable?: boolean;
  possibleChannels?: string;
  encryptionMode?: 'WPA' | 'WPA2' | 'WPA/WPA2' | string;
  encryptionType?: string;
  operatingStandard?: string;
  signalStrength?: number | string;
  noise?: number | string;
  transmissionPower?: number | string;
  transmissionPowerSupported?: string;
  status?: string;
  macAddress?: string;
  ipAddress?: string;
  receivedByte?: number | string;
  sentByte?: number | string;
  parent?: string;
  createdDate?: string;
  wlanHosts?: HostDto[];
}

/** Connected device / host — udm/dto/hostDto.dart */
export interface HostDto {
  active?: boolean;
  hostname?: string;
  ipAddress?: string;
  macAddress?: string;
  interfaceType?: string;
  name?: string;
  status?: string;
  ssid?: string;
  band?: string;
  signalStrength?: number | string;
}

/** LAN interface — udm/dto/lanDto.dart */
export interface LanDto {
  enable?: boolean;
  name?: string;
  macAddress?: string;
  status?: string;
  duplixMode?: string;
  maximumBitRate?: string;
  macAddressControlEnable?: boolean;
}

/** WAN interface — udm/dto/wanDto.dart */
export interface WanDto {
  name?: string;
  enable?: boolean;
  connectionStatus?: string;
  connectionType?: string;
  type?: string;
  addressingType?: string;
  authenticationProtocol?: string;
  externalIPAddress?: string;
  defaultGateway?: string;
  dnsServers?: string;
  dnsEnable?: boolean;
  natEnable?: boolean;
  subnetMask?: string;
  uptime?: number | string;
  userName?: string;
  macAddress?: string;
  remoteIpAddress?: string;
  receivedByte?: number | string;
  sentByte?: number | string;
}

/** Nearby WiFi scan — udm/dto/neighboringDto.dart */
export interface NeighboringDto {
  ssid?: string;
  channel?: number | string;
  operatingFrequencyBand?: string;
  radio?: string;
  securityModeEnabled?: string;
  signalStrength?: number | string;
  width?: string;
}

/** TR-098 summary / status overview — api/device/{id}/tr098Summary */
export interface Tr098Summary {
  manufacturer?: string;
  modelName?: string;
  softwareVersion?: string;
  additionalSoftwareVersion?: string;
  additionalHardwareVersion?: string;
  uptime?: number | string;
  cpuUsage?: number | string;
  serialNumber?: string;
  [k: string]: unknown;
}

/** ACS action job — POST api/jobs */
export type JobType =
  | 'RESTART'
  | 'REFRESH'
  | 'RESET'
  | 'SET_WLAN_PARAMETER'
  | 'BLACKLIST_MAC_ADDRESS'
  | 'FIRMWARE_UPGRADE'
  | 'VERIFY';

export type JobStatus = 'CREATED' | 'RUNNING' | 'COMPLETED' | 'DROPPED';

export interface Job {
  _id?: string;
  type: JobType;
  device: string;
  status?: JobStatus;
  [k: string]: unknown;
}

/** PortalApi response envelope (confirmed): { ReturnCode, ReturnMessage, Message, Data, Success } */
export interface PortalResponse<T = unknown> {
  ReturnCode?: string | number;
  ReturnMessage?: string;
  Message?: string;
  Success?: boolean | string;
  IsSuccess?: boolean | string;
  Token?: string;
  Data?: T;
}

export interface AccountRights {
  changeModemPassword: boolean;
  macReset: boolean;
  disconnect: boolean;
  mrtg: boolean;
}

export interface Session {
  token: string;
  username: string;
  deviceId: string; // ACS device.id for UDM calls
  rights: AccountRights;
}
