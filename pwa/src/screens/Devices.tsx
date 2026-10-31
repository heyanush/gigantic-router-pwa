import { useEffect, useState } from 'react';
import { api, waitForJob, type HostDto } from '../api';
import { useAuth } from '../auth';
import { Card, Confirm, Loading, Signal, useToast } from '../components';

export default function Devices() {
  const { session } = useAuth();
  const dev = session!.deviceId;
  const [hosts, setHosts] = useState<HostDto[] | null>(null);
  const [confirm, setConfirm] = useState<HostDto | null>(null);
  const { toast, toastNode } = useToast();

  async function load() { setHosts(await api.getHosts(dev)); }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function block(h: HostDto) {
    setConfirm(null);
    try {
      const job = await api.blockDevice(dev, h.macAddress ?? '');
      toast(`Blocking ${h.hostname ?? h.macAddress}…`);
      const status = await waitForJob(dev, job._id ?? '');
      toast(status === 'COMPLETED' ? 'Device blocked ✓' : `Request ${status.toLowerCase()}`);
      await load();
    } catch (e) {
      toast((e as Error).message);
    }
  }

  if (!hosts) return <Loading label="Scanning connected devices…" />;

  const online = hosts.filter((h) => h.active);
  const offline = hosts.filter((h) => !h.active);

  return (
    <>
      <Card title={`${online.length} connected`} hint="Devices currently on your network">
        {online.length === 0 && <p className="muted">No devices online.</p>}
        {online.map((h) => (
          <div className="row" key={h.macAddress}>
            <div>
              <div style={{ fontWeight: 600 }}>{h.hostname || 'Unknown device'}</div>
              <div className="muted" style={{ fontSize: 12 }}>{h.ipAddress} · {h.macAddress}</div>
              <div className="muted" style={{ fontSize: 12 }}>{h.interfaceType}{h.band ? ` · ${h.band}` : ''}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              {h.band && <Signal dbm={h.signalStrength} />}
              <button className="btn small danger" onClick={() => setConfirm(h)}>Block</button>
            </div>
          </div>
        ))}
      </Card>

      {offline.length > 0 && (
        <Card title={`${offline.length} offline / blocked`} hint="Recently seen or blocked">
          {offline.map((h) => (
            <div className="row" key={h.macAddress}>
              <div>
                <div style={{ fontWeight: 600 }}>{h.hostname || 'Unknown device'}</div>
                <div className="muted" style={{ fontSize: 12 }}>{h.macAddress}</div>
              </div>
              <span className={`pill ${h.status === 'Blocked' ? 'off' : 'warn'}`}>{h.status}</span>
            </div>
          ))}
        </Card>
      )}

      {confirm && (
        <Confirm
          danger
          text={`Block ${confirm.hostname ?? confirm.macAddress}?`}
          onYes={() => block(confirm)}
          onNo={() => setConfirm(null)}
        />
      )}
      {toastNode}
    </>
  );
}
