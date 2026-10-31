import { useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { USE_MOCK } from './api';
import Login from './screens/Login';
import Wifi from './screens/Wifi';
import Devices from './screens/Devices';
import Status from './screens/Status';
import Settings from './screens/Settings';

function Shell() {
  const { session, logout } = useAuth();
  const loc = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const title =
    loc.pathname.startsWith('/devices') ? 'Connected Devices'
    : loc.pathname.startsWith('/status') ? 'Status & Reboot'
    : 'WiFi Settings';

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{title}</h1>
          <div className="sub">{session?.username} · {session?.deviceId || 'resolving…'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSettingsOpen(true)} aria-label="Settings">⚙︎</button>
          <button onClick={logout}>Log out</button>
        </div>
      </header>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}

      <main className="content">
        {USE_MOCK && <div className="banner">Demo mode — mock router data. Set <code>VITE_USE_MOCK=false</code> on the ISP network to use the live portal.</div>}
        <Routes>
          <Route path="/wifi" element={<Wifi />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/status" element={<Status />} />
          <Route path="*" element={<Navigate to="/wifi" replace />} />
        </Routes>
      </main>

      <nav className="bottomnav">
        <NavLink to="/wifi" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ico">📶</span>WiFi
        </NavLink>
        <NavLink to="/devices" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ico">💻</span>Devices
        </NavLink>
        <NavLink to="/status" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ico">🔌</span>Status
        </NavLink>
      </nav>
    </div>
  );
}

export default function App() {
  const { session } = useAuth();
  if (!session) return <Login />;
  return <Shell />;
}
