import { useState } from 'react';
import DeviationMap from './DeviationMap.jsx';
import { buildDepthBars } from './geo3d.js';
import { record, routeData } from './sampleData.js';

const STATUS = {
  pending_review: { label: 'Pending review', bg: '#ffe9cf', fg: '#8a4b0f', dot: '#f5a04b' },
  approved: { label: 'Approved', bg: '#d3f2e2', fg: '#17613f', dot: '#3fae7a' },
  rejected: { label: 'Rejected', bg: '#fbd9d9', fg: '#8a1f1f', dot: '#e26d6d' },
  needs_evidence: { label: 'More evidence requested', bg: '#d9e8fb', fg: '#1f4a8a', dot: '#5b93e0' },
};

// Backend address (optional). Create react_dashboard/.env from .env.example.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const LAYERS = [
  { key: 'planned', label: 'Planned (CAD)', color: '#1fa5c4' },
  { key: 'actual', label: 'Actual (as built)', color: '#2563eb' },
  { key: 'deviation', label: 'Deviation', color: '#ef4444' },
  { key: 'survey', label: 'Survey points', color: '#fb923c' },
  { key: 'depth', label: '3D depth bars', color: '#7aa8f5' },
];

const QUICK_COMMENTS = [
  'Route matches the design',
  'Depth label missing in video',
  'Video or photo is unclear',
  'GNSS accuracy is too low',
];

const depthBars = buildDepthBars(routeData, record.plannedDepthM, record.actualDepthM);

export default function App() {
  const [status, setStatus] = useState('pending_review');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState([
    { at: new Date().toISOString(), msg: 'Record submitted by field crew (mock)' },
  ]);
  const [visible, setVisible] = useState({
    planned: true,
    actual: true,
    deviation: true,
    survey: true,
    depth: true,
  });
  const [is3d, setIs3d] = useState(true);
  const [resetToken, setResetToken] = useState(0);

  const locked = status === 'approved' || status === 'rejected';
  const s = STATUS[status];
  const depthDiff = (record.actualDepthM - record.plannedDepthM).toFixed(1);

  const addLog = (msg) => setLog((l) => [{ at: new Date().toISOString(), msg }, ...l]);

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
      addLog(STATUS[next].label + (comment.trim() ? ': ' + comment.trim() : ''));
      setComment('');
    } catch (e) {
      setError('Could not save decision: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const reopen = () => {
    setError('');
    setStatus('pending_review');
    addLog('Reopened for review');
  };

  const addQuick = (text) => {
    if (locked) return;
    setComment((c) => (c.trim() ? c.trim() + '. ' + text : text));
  };

  const toggleLayer = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  const downloadReview = () => {
    const blob = new Blob([JSON.stringify({ record, status, auditLog: log }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = record.id + '-review.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="layout">
      <aside className="panel">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <h1>GeoTrace review</h1>
            <p className="muted">Sample data, not a real record</p>
          </div>
        </div>

        <section className="card">
          <div className="card-head">
            <b>{record.id}</b>
            <span className="tag">{record.utility}</span>
          </div>
          <div className="muted small">{record.site}</div>
          <div className="stats">
            <div className="stat">
              <span>Planned depth</span>
              <b>{record.plannedDepthM} m</b>
            </div>
            <div className="stat">
              <span>Actual depth</span>
              <b>{record.actualDepthM} m</b>
            </div>
            <div className="stat">
              <span>Max deviation</span>
              <b>{record.maxDeviationM} m</b>
            </div>
            <div className="stat">
              <span>Depth difference</span>
              <b>+{depthDiff} m</b>
            </div>
          </div>
        </section>

        <div className="status-row">
          <span className="badge" style={{ background: s.bg, color: s.fg }}>
            <span className="dot" style={{ background: s.dot }} />
            {s.label}
          </span>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Reviewer comment (required for reject / more evidence)"
          disabled={locked}
          rows={3}
        />
        <div className="chips">
          {QUICK_COMMENTS.map((q) => (
            <button key={q} className="chip" disabled={locked} onClick={() => addQuick(q)}>
              {q}
            </button>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button className="btn approve" disabled={locked || saving} onClick={() => decide('approved')}>
            Approve
          </button>
          <button className="btn evidence" disabled={locked || saving} onClick={() => decide('needs_evidence')}>
            Request more evidence
          </button>
          <button className="btn reject" disabled={locked || saving} onClick={() => decide('rejected')}>
            Reject
          </button>
          {locked && (
            <button className="btn reopen" onClick={reopen}>
              Reopen
            </button>
          )}
        </div>

        <h3>Audit log</h3>
        <ul className="log">
          {log.map((e, i) => (
            <li key={i}>
              <span className="muted">{e.at.slice(11, 19)}</span> {e.msg}
            </li>
          ))}
        </ul>
        <button className="btn ghost" onClick={downloadReview}>
          Download review as JSON
        </button>
      </aside>

      <main className="mapwrap">
        <DeviationMap
          data={routeData}
          depthBars={depthBars}
          visible={visible}
          is3d={is3d}
          resetToken={resetToken}
        />
        <div className="toolbar">
          <div className="toolbar-row">
            {LAYERS.map((l) => (
              <label key={l.key} className={'layer-chip' + (visible[l.key] ? ' on' : '')}>
                <input type="checkbox" checked={visible[l.key]} onChange={() => toggleLayer(l.key)} />
                <span className="swatch" style={{ background: l.color }} />
                {l.label}
              </label>
            ))}
          </div>
          <div className="toolbar-row">
            <button className="tool-btn" onClick={() => setIs3d((v) => !v)}>
              {is3d ? 'Switch to 2D view' : 'Switch to 3D view'}
            </button>
            <button className="tool-btn" onClick={() => setResetToken((t) => t + 1)}>
              Reset view
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
