import { useEffect, useState } from 'react';
import { api, waitForJob, type WlanDto } from '../api';
import { useAuth } from '../auth';
import { Card, Loading, Signal, useToast } from '../components';

export default function Wifi() {
  const { session } = useAuth();
  const dev = session!.deviceId;
  const [wlans, setWlans] = useState<WlanDto[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<WlanDto>({});
  const [saving, setSaving] = useState(false);
  const { toast, toastNode } = useToast();

  async function load() {
    setWlans(null);
    setWlans(await api.getWlans(dev));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function startEdit(w: WlanDto) {
    setEditing(w.name ?? w.ssid ?? '');
    setDraft({ name: w.name, ssid: w.ssid, password: w.password, enable: w.enable, band: w.band, encryptionMode: w.encryptionMode, autoChannelEnable: w.autoChannelEnable, channel: w.channel });
  }

  async function save() {
    setSaving(true);
    try {
      const job = await api.setWlan(dev, draft);
      toast('Applying WiFi changes…');
      const status = await waitForJob(dev, job._id ?? '', (s) => toast(`Router: ${s.toLowerCase()}…`));
      toast(status === 'COMPLETED' ? 'WiFi updated ✓' : `Request ${status.toLowerCase()}`);
      setEditing(null);
      await load();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (!wlans) return <Loading label="Reading WiFi settings…" />;

  return (
    <>
      {wlans.map((w) => {
        const id = w.name ?? w.ssid ?? '';
        const isEdit = editing === id;
        return (
          <Card key={id} title={`${w.band ?? ''} · ${w.ssid ?? 'SSID'}`} hint={`${w.operatingStandard ?? ''} · ch ${w.channelInUse ?? w.channel ?? '—'}`}>
            {!isEdit ? (
              <>
                <div className="kv"><span className="k">Status</span><span className="v">{w.enable ? <span className="pill on">Enabled</span> : <span className="pill off">Disabled</span>}</span></div>
                <div className="kv"><span className="k">Network name (SSID)</span><span className="v">{w.ssid}</span></div>
                <div className="kv"><span className="k">Security</span><span className="v">{w.encryptionMode ?? '—'}</span></div>
                <div className="kv"><span className="k">Channel</span><span className="v">{w.autoChannelEnable ? `Auto (${w.channelInUse ?? w.channel})` : w.channel}</span></div>
                <div className="kv"><span className="k">Signal</span><span className="v"><Signal dbm={w.signalStrength} /></span></div>
                <button className="btn secondary small" style={{ marginTop: 12 }} onClick={() => startEdit(w)}>Edit</button>
              </>
            ) : (
              <>
                <label>Network name (SSID)</label>
                <input value={draft.ssid ?? ''} onChange={(e) => setDraft({ ...draft, ssid: e.target.value })} />
                <label>Password</label>
                <input value={draft.password ?? ''} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
                <label>Security</label>
                <select value={draft.encryptionMode ?? 'WPA2'} onChange={(e) => setDraft({ ...draft, encryptionMode: e.target.value })}>
                  <option>WPA2</option><option>WPA/WPA2</option><option>WPA</option>
                </select>
                <label>Channel</label>
                <select
                  value={draft.autoChannelEnable ? 'auto' : String(draft.channel ?? '')}
                  onChange={(e) => e.target.value === 'auto'
                    ? setDraft({ ...draft, autoChannelEnable: true })
                    : setDraft({ ...draft, autoChannelEnable: false, channel: Number(e.target.value) })}
                >
                  <option value="auto">Auto</option>
                  {(w.band === '5GHz' ? [36, 40, 44, 48, 149, 153, 157, 161] : [1, 6, 11]).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="row" style={{ marginTop: 14 }}>
                  <button className="btn" disabled={saving} onClick={save}>{saving ? 'Applying…' : 'Apply'}</button>
                  <button className="btn secondary" disabled={saving} onClick={() => setEditing(null)}>Cancel</button>
                </div>
              </>
            )}
          </Card>
        );
      })}
      {toastNode}
    </>
  );
}
