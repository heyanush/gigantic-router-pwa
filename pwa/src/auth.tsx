import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from './api';

interface AuthCtx {
  session: Session | null;
  setSession: (s: Session | null) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = 'gigantic.session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setSessionState(JSON.parse(raw));
    } catch { /* storage unavailable (private mode) — stay logged out */ }
  }, []);

  const setSession = (s: Session | null) => {
    setSessionState(s);
    try {
      if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
      else sessionStorage.removeItem(KEY);
    } catch { /* ignore */ }
  };

  return (
    <Ctx.Provider value={{ session, setSession, logout: () => setSession(null) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside provider');
  return c;
}
