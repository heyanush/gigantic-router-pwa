import { useState } from 'react';
import { api, USE_MOCK } from '../api';
import type { LoginType } from '../api/config';
import { useAuth } from '../auth';

export default function Login() {
  const { setSession } = useAuth();
  const [mode, setMode] = useState<LoginType>('mobileWithOtp');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isOtp = mode === 'mobileWithOtp';

  async function sendOtp() {
    setErr(null); setBusy(true);
    try { await api.generateOtp({ mobile }); setOtpSent(true); }
    catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      const session = await api.login(
        isOtp
          ? { loginType: mode, mobile, otp }
          : { loginType: mode, username, password },
      );
      setSession(session);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar"><h1>Gigantic Router Manager</h1></header>
      <main className="content">
        <div className="card">
          <h2>Sign in</h2>
          <p className="hint">Manage your WiFi, connected devices, and router — right from the browser.</p>

          <div className="row" style={{ gap: 8 }}>
            <button className={`btn small ${isOtp ? '' : 'secondary'}`} onClick={() => setMode('mobileWithOtp')} type="button">Mobile + OTP</button>
            <button className={`btn small ${mode === 'userNameWithPassword' ? '' : 'secondary'}`} onClick={() => setMode('userNameWithPassword')} type="button">Username</button>
          </div>

          <form onSubmit={submit}>
            {isOtp ? (
              <>
                <label>Mobile number</label>
                <input inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" />
                {otpSent && (
                  <>
                    <label>OTP</label>
                    <input inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" />
                  </>
                )}
              </>
            ) : (
              <>
                <label>Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Subscriber ID / username" />
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </>
            )}

            {err && <div className="err">{err}</div>}

            {isOtp && !otpSent ? (
              <button className="btn" style={{ marginTop: 16 }} type="button" disabled={busy || !mobile} onClick={sendOtp}>
                {busy ? 'Sending…' : 'Send OTP'}
              </button>
            ) : (
              <button className="btn" style={{ marginTop: 16 }} disabled={busy} type="submit">
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            )}
          </form>

          {USE_MOCK && <p className="hint" style={{ marginTop: 14 }}>Demo: any mobile, OTP <strong>123456</strong>.</p>}
        </div>
      </main>
    </div>
  );
}
