import { useState } from 'react';
import DeviationMap from './DeviationMap.jsx';
import { record, routeData } from './sampleData.js';

const STATUS = {
  pending_review: { label: 'Pending review', bg: '#fef3c7', fg: '#92400e', dot: '#f59e0b' },
  approved: { label: 'Approved', bg: '#dcfce7', fg: '#166534', dot: '#16a34a' },
  rejected: { label: 'Rejected', bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626' },
  needs_evidence: { label: 'More evidence requested', bg: '#dbeafe', fg: '#1e40af', dot: '#2563eb' },
};

const THEME = {
  page: '#f1f5f9',
  panel: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  muted: '#64748b',
  accent: '#0b2342',
};

// Change this to your teammate's backend address when it is ready.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const btn = (bg) => ({
  background: bg,
  color: '#fff',
  border: 0,
  padding: '10px 12px',
  borderRadius: 8,
  fontWeight: 600,
  cursor: 'pointer',
});

export default function App() {
  const [status, setStatus] = useState('pending_review');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState([
    { at: new Date().toISOString(), msg: 'Record submitted by field crew (mock)' },
  ]);

  const locked = status === 'approved' || status === 'rejected';

  const addLog = (msg) =>
    setLog((l) => [{ at: new Date().toISOString(), msg }, ...l]);

  const decide = async (next) => {
    setError('');
    if ((next === 'rejected' || next === 'needs_evidence') && !comment.trim()) {
      setError('Please add a comment explaining this decision.');
      return;
    }
    setSaving(true);
    try {
      if (USE_BACKEND) {
        const res = await fetch(API_BASE + '/api/v1/records/' + record.id + '/review', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next, comment }),
        });
        if (!res.ok) throw new Error('Server answered ' + res.status);
      }
      setStatus(next);
      addLog(STATUS[next].label + (comment ? ': ' + comment : ''));
      setComment('');
    } catch (e) {
      setError('Could not save decision: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const reopen = () => {
    setStatus('pending_review');
    addLog('Reopened for review');
  };

  const s = STATUS[status];

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: THEME.page,
        color: THEME.text,
      }}
    >
      <aside
        style={{
          width: 340,
          padding: 16,
          overflowY: 'auto',
          background: THEME.panel,
          borderRight: '1px solid ' + THEME.border,
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ marginTop: 0, color: THEME.accent }}>GeoTrace review</h2>
        <p style={{ color: THEME.muted, marginTop: -8 }}>Sample data, not a real record</p>

        <div
          style={{
            marginBottom: 14,
            lineHeight: 1.7,
            padding: 12,
            background: '#f8fafc',
            border: '1px solid ' + THEME.border,
            borderRadius: 8,
          }}
        >
          <div>
            <b>{record.id}</b> · {record.utility}
          </div>
          <div>{record.site}</div>
          <div>Planned depth: {record.plannedDepthM} m</div>
          <div>Actual depth: {record.actualDepthM} m</div>
          <div>Max deviation: {record.maxDeviationM} m</div>
        </div>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: s.bg,
            color: s.fg,
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: 999, background: s.dot }} />
          {s.label}
        </span>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Reviewer comment (required for reject / more evidence)"
          disabled={locked}
          rows={3}
          style={{
            width: '100%',
            marginTop: 14,
            boxSizing: 'border-box',
            padding: 8,
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: '#fff',
            color: THEME.text,
            fontFamily: 'inherit',
          }}
        />

        {error && <div style={{ color: '#b91c1c', marginTop: 8, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          <button disabled={locked || saving} onClick={() => decide('approved')} style={btn('#16a34a')}>
            Approve
          </button>
          <button disabled={locked || saving} onClick={() => decide('needs_evidence')} style={btn('#2563eb')}>
            Request more evidence
          </button>
          <button disabled={locked || saving} onClick={() => decide('rejected')} style={btn('#dc2626')}>
            Reject
          </button>
          {locked && (
            <button onClick={reopen} style={btn('#475569')}>
              Reopen
            </button>
          )}
        </div>

        <h3 style={{ color: THEME.accent }}>Audit log</h3>
        <ul style={{ paddingLeft: 16, fontSize: 13, color: THEME.text }}>
          {log.map((e, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <span style={{ color: THEME.muted }}>{e.at.slice(11, 19)}</span> {e.msg}
            </li>
          ))}
        </ul>

        <h3 style={{ color: THEME.accent }}>Legend</h3>
        <div style={{ fontSize: 13, lineHeight: 1.9 }}>
          <div><span style={{ color: '#0891b2', fontWeight: 600 }}>- - Planned (CAD)</span></div>
          <div><span style={{ color: '#2563eb', fontWeight: 600 }}>━━ Actual (as built)</span></div>
          <div><span style={{ color: '#dc2626', fontWeight: 600 }}>━━ Deviation</span></div>
          <div><span style={{ color: '#ea580c', fontWeight: 600 }}>● Survey point</span></div>
        </div>
      </aside>

      <main style={{ flex: 1 }}>
        <DeviationMap data={routeData} />
      </main>
    </div>
  );
}