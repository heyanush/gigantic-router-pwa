import { useState } from 'react';
import { api } from '../api';
import { Card } from '../components';

// Change modem (CPE) password — PortalApi apiName "ChangeCPEPPassword".
// Warning text recovered from the app's confirmation dialog.
const WARN =
  'Changing the modem password will drop your internet until the modem is reconfigured with the new password.';

export default function ModemPassword({ onToast }: { onToast: (m: string) => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (next.length < 6) { setErr('New password must be at least 6 characters'); return; }
    if (next !== confirm) { setErr('New password and confirmation do not match'); return; }
    setBusy(true);
    try {
      await api.changeModemPassword(current, next);
      onToast('Modem password changed ✓');
      setCurrent(''); setNext(''); setConfirm(''); setOpen(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Modem password" hint="The admin password used to configure your modem.">
      {!open ? (
        <button className="btn secondary" onClick={() => setOpen(true)}>Change modem password</button>
      ) : (
        <form onSubmit={submit}>
          <div className="banner" style={{ marginBottom: 8 }}>{WARN}</div>
          <label>Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          <label>New password</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
          <label>Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          {err && <div className="err">{err}</div>}
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
            <button className="btn secondary" type="button" disabled={busy} onClick={() => { setOpen(false); setErr(null); }}>Cancel</button>
          </div>
        </form>
      )}
    </Card>
  );
}
