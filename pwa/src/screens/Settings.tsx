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

        <label>Portal origin (dev proxy target)</label>
        <input value={s.portalOrigin} onChange={(e) => set('portalOrigin', e.target.value)} placeholder="http://172.16.0.2" />

        <label>Portal API path</label>
        <input value={s.portalPath} onChange={(e) => set('portalPath', e.target.value)} />

        <label>UDM / router proxy path</label>
        <input value={s.udmPath} onChange={(e) => set('udmPath', e.target.value)} />

        <label>Router search identifier (blank = use username)</label>
        <input value={s.deviceQueryOverride} onChange={(e) => set('deviceQueryOverride', e.target.value)} placeholder="account / serial" />

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
