import { useState } from 'react';
import { getSettings, saveSettings, pingBackend, type BackendSettings } from '../api';

export default function Settings({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<BackendSettings>(getSettings());
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function set<K extends keyof BackendSettings>(k: K, v: BackendSettings[K]) {
    setS({ ...s, [k]: v });
  }

  function save(reload: boolean) {
    saveSettings(s);
    if (reload) location.reload();
    else onClose();
  }

  async function test() {
    saveSettings(s); // ping uses current config
    setTesting(true); setResult(null);
    try {
      const r = await pingBackend();
      setResult(`Portal: ${r.portal ? 'OK ✓' : 'unreachable ✗'} · Router proxy: ${r.udm ? 'OK ✓' : 'unreachable ✗'}\n${r.detail}`);
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Backend settings</h2>
        <p className="hint">Point the app at a live portal and flip mock/live. Saved on this device.</p>

        <label>Data source</label>
        <select value={s.useMock ? 'mock' : 'live'} onChange={(e) => set('useMock', e.target.value === 'mock')}>
          <option value="mock">Demo (mock data)</option>
          <option value="live">Live portal</option>
        </select>

        <div className="banner" style={{ marginTop: 10 }}>
          Live mode calls the portal directly from the browser. The portal must be <strong>HTTPS</strong>
          and send <strong>CORS</strong> headers allowing this site's origin.
        </div>

        <label>Portal API URL (full)</label>
        <input value={s.portalApi} onChange={(e) => set('portalApi', e.target.value)} placeholder="https://portal.example.com/PortalApi/" />

        <label>Router / UDM proxy URL (full)</label>
        <input value={s.udmApi} onChange={(e) => set('udmApi', e.target.value)} placeholder="https://portal.example.com/api/h8UDMProxy.ashx/" />

        <label>Router search identifier (blank = use username)</label>
        <input value={s.deviceQueryOverride} onChange={(e) => set('deviceQueryOverride', e.target.value)} placeholder="account / serial" />

        <label>Central API key (optional)</label>
        <input value={s.centralApiKey} onChange={(e) => set('centralApiKey', e.target.value)} placeholder="only if your API needs it" />

        <div className="row" style={{ marginTop: 12 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={s.encryption} onChange={(e) => set('encryption', e.target.checked)} />
          <span style={{ flex: 1, fontSize: 13 }} className="muted">Payload encryption (<code>enc</code>) — handle server-side</span>
        </div>

        <button className="btn secondary" style={{ marginTop: 14 }} disabled={testing} onClick={test}>
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        {result && <pre className="pingresult">{result}</pre>}

        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn" onClick={() => save(true)}>Save & reload</button>
          <button className="btn secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
