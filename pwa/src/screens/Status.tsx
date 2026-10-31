import { useEffect, useState } from 'react';
import { api, waitForJob, type Tr098Summary, type WanDto } from '../api';
import { useAuth } from '../auth';
import { Card, Confirm, Loading, useToast } from '../components';
import ModemPassword from './ModemPassword';

function fmtUptime(s?: number | string) {
  const n = typeof s === 'string' ? parseInt(s, 10) : s;
  if (!n || Number.isNaN(n)) return '—';
  const d = Math.floor(n / 86400), h = Math.floor((n % 86400) / 3600), m = Math.floor((n % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
function fmtBytes(b?: number | string) {
  const n = typeof b === 'string' ? parseInt(b, 10) : b;
  if (!n || Number.isNaN(n)) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0; let v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(1)} ${u[i]}`;
}

export default function Status() {
  const { session } = useAuth();
  const dev = session!.deviceId;
  const [sum, setSum] = useState<Tr098Summary | null>(null);
  const [wan, setWan] = useState<WanDto | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const { toast, toastNode } = useToast();

  async function load() {
    const [s, w] = await Promise.all([api.getSummary(dev), api.getWan(dev)]);
    setSum(s); setWan(w);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function reboot() {
    setConfirm(false); setRebooting(true);
    try {
      const job = await api.reboot(dev);
      toast('Reboot requested…');
      const status = await waitForJob(dev, job._id ?? '', (s) => toast(`Router: ${s.toLowerCase()}…`), 60000);
      toast(status === 'COMPLETED' ? 'Router rebooted ✓' : `Reboot ${status.toLowerCase()}`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setRebooting(false);
    }
  }

  async function refresh() {
    try { await api.refresh(dev); toast('Refreshing from router…'); await load(); toast('Up to date ✓'); }
    catch (e) { toast((e as Error).message); }
  }

  if (!sum || !wan) return <Loading label="Reading router status…" />;

  const connected = /connect|up/i.test(wan.connectionStatus ?? '');

  return (
    <>
      <Card title="Connection">
        <div className="kv"><span className="k">Internet</span><span className="v">{connected ? <span className="pill on">{wan.connectionStatus}</span> : <span className="pill off">{wan.connectionStatus}</span>}</span></div>
        <div className="kv"><span className="k">WAN IP</span><span className="v">{wan.externalIPAddress ?? '—'}</span></div>
        <div className="kv"><span className="k">Type</span><span className="v">{wan.addressingType ?? wan.connectionType ?? '—'}</span></div>
        <div className="kv"><span className="k">Gateway</span><span className="v">{wan.defaultGateway ?? '—'}</span></div>
        <div className="kv"><span className="k">DNS</span><span className="v">{wan.dnsServers ?? '—'}</span></div>
        <div className="kv"><span className="k">Uptime</span><span className="v">{fmtUptime(wan.uptime ?? sum.uptime)}</span></div>
        <div className="kv"><span className="k">Downloaded</span><span className="v">{fmtBytes(wan.receivedByte)}</span></div>
        <div className="kv"><span className="k">Uploaded</span><span className="v">{fmtBytes(wan.sentByte)}</span></div>
      </Card>

      <Card title="Router">
        <div className="kv"><span className="k">Model</span><span className="v">{sum.manufacturer} {sum.modelName}</span></div>
        <div className="kv"><span className="k">Firmware</span><span className="v">{sum.softwareVersion ?? '—'}</span></div>
        <div className="kv"><span className="k">Serial</span><span className="v">{sum.serialNumber ?? '—'}</span></div>
        <div className="kv"><span className="k">CPU</span><span className="v">{sum.cpuUsage != null ? `${sum.cpuUsage}%` : '—'}</span></div>
        <button className="btn secondary" style={{ marginTop: 12 }} onClick={refresh}>Refresh from router</button>
      </Card>

      {session!.rights.changeModemPassword && <ModemPassword onToast={toast} />}

      <Card title="Reboot" hint="Restarts the modem. Your connection will drop for 1–2 minutes.">
        <button className="btn danger" disabled={rebooting} onClick={() => setConfirm(true)}>
          {rebooting ? 'Rebooting…' : 'Reboot router'}
        </button>
      </Card>

      {confirm && (
        <Confirm danger text="Reboot the router now?" onYes={reboot} onNo={() => setConfirm(false)} />
      )}
      {toastNode}
    </>
  );
}
