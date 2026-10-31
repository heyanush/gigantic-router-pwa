import { useEffect, useState, type ReactNode } from 'react';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="center">
      <div className="spinner" />
      <div className="muted">{label}</div>
    </div>
  );
}

export function Card({ title, hint, children }: { title?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="card">
      {title && <h2>{title}</h2>}
      {hint && <p className="hint">{hint}</p>}
      {children}
    </div>
  );
}

export function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  return <div className="toast">{msg}</div>;
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const node = msg ? <Toast msg={msg} onDone={() => setMsg(null)} /> : null;
  return { toast: setMsg, toastNode: node };
}

/** Signal bars from an RSSI dBm value (−30 strong … −90 weak). */
export function Signal({ dbm }: { dbm?: number | string }) {
  const v = typeof dbm === 'string' ? parseInt(dbm, 10) : dbm;
  const bars = v == null || Number.isNaN(v) ? 0 : v >= -50 ? 4 : v >= -60 ? 3 : v >= -70 ? 2 : 1;
  return (
    <span className="signal" title={v != null ? `${v} dBm` : 'unknown'}>
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= bars ? 'lit' : ''} style={{ height: `${4 + i * 2.5}px` }} />
      ))}
    </span>
  );
}

export function Confirm({ text, onYes, onNo, danger }: { text: string; onYes: () => void; onNo: () => void; danger?: boolean }) {
  return (
    <div className="toast" style={{ bottom: 120, display: 'flex', gap: 10, alignItems: 'center' }}>
      <span>{text}</span>
      <button className={`btn small ${danger ? 'danger' : ''}`} onClick={onYes}>Yes</button>
      <button className="btn small secondary" onClick={onNo}>No</button>
    </div>
  );
}
