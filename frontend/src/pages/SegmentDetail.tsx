import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { segmentsApi, measurementsApi } from '../services/api';
import { PipelineSegment, Measurement } from '../types';
import { MapPin, Settings, Edit, Loader2, AlertCircle, ArrowLeft, Ruler, FileText, Plus } from 'lucide-react';

const statusColors: Record<string, 'success' | 'neutral' | 'danger' | 'warning'> = {
  approved: 'success',
  planned: 'neutral',
  rejected: 'danger',
  draft: 'warning',
  pending_verification: 'warning',
  pending_review: 'warning',
  needs_additional_evidence: 'danger',
};

export default function SegmentDetail() {
  const { projectId, assetId, segmentId } = useParams<{ projectId: string; assetId: string; segmentId: string }>();
  const [segment, setSegment] = useState<PipelineSegment | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'measurements' | 'geometry'>('details');

  useEffect(() => {
    const fetchData = async () => {
      if (!segmentId) return;
      try {
        const [segmentRes, measurementsRes] = await Promise.all([
          segmentsApi.get(Number(segmentId)),
          measurementsApi.list(Number(segmentId)),
        ]);
        setSegment(segmentRes.data);
        setMeasurements(measurementsRes.data);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || 'Failed to load segment');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [segmentId]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-8 h-8 spinner" strokeWidth={2.5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto' }}>
        <div className="card-body" style={{ textAlign: 'center' }}>
          <AlertCircle className="w-12 h-12 text-danger" style={{ margin: '0 auto 16px' }} strokeWidth={1.5} />
          <h3>Error</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!segment) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}/assets/${assetId}`} className="btn btn-sm btn-outline" style={{ marginBottom: '16px' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Asset
          </Link>
          <h1 className="page-title">Segment {segment.segment_type}</h1>
          <p className="page-subtitle">Version {segment.version} • {segment.geometry_crs}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={`/projects/${projectId}/assets/${assetId}/segments/${segmentId}/edit`} className="btn btn-outline">
            <Settings className="w-4 h-4" />
            Edit
          </Link>
          <Link to={`/projects/${projectId}/map`} className="btn btn-secondary">
            <MapPin className="w-4 h-4" />
            View on Map
          </Link>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'details'}
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <FileText className="w-4 h-4" style={{ marginRight: '8px' }} />
          Details
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'geometry'}
          className={`tab ${activeTab === 'geometry' ? 'active' : ''}`}
          onClick={() => setActiveTab('geometry')}
        >
          <MapPin className="w-4 h-4" style={{ marginRight: '8px' }} />
          Geometry
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'measurements'}
          className={`tab ${activeTab === 'measurements' ? 'active' : ''}`}
          onClick={() => setActiveTab('measurements')}
        >
          <Ruler className="w-4 h-4" style={{ marginRight: '8px' }} />
          Measurements
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="tab-content active">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="card">
              <div className="card-header">Basic Information</div>
              <div className="card-body">
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Segment Type</dt>
                  <dd style={{ fontWeight: 500 }}>{segment.segment_type}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Status</dt>
                  <dd>
                    <span className={`badge badge-${statusColors[segment.status] || 'neutral'}`}>
                      {segment.status.replace('_', ' ')}
                    </span>
                  </dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Source</dt>
                  <dd>{segment.source || '—'}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Version</dt>
                  <dd>v{segment.version}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Notes</dt>
                  <dd style={{ gridColumn: '1 / -1', color: 'var(--color-text-muted)' }}>{segment.notes || '—'}</dd>
                </dl>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Geometry</div>
              <div className="card-body">
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>CRS</dt>
                  <dd style={{ fontWeight: 500 }}>{segment.geometry_crs}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Length</dt>
                  <dd>{segment.length_m ? `${segment.length_m.toFixed(2)} m` : 'Not calculated'}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Accuracy</dt>
                  <dd>{segment.accuracy_m ? `${segment.accuracy_m.toFixed(3)} m` : '—'}</dd>
                </dl>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Depth</div>
              <div className="card-body">
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Depth</dt>
                  <dd style={{ fontWeight: 500 }}>
                    {segment.depth_m !== null && segment.depth_m !== undefined
                      ? `${segment.depth_m.toFixed(3)} m`
                      : 'Unknown'}
                  </dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Reference</dt>
                  <dd>{segment.depth_reference || 'Not specified'}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Method</dt>
                  <dd>{segment.depth_method || 'Not specified'}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Confidence</dt>
                  <dd>
                    {segment.depth_confidence !== null && segment.depth_confidence !== undefined
                      ? `${(segment.depth_confidence * 100).toFixed(0)}%`
                      : 'Not specified'}
                  </dd>
                </dl>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Timestamps</div>
              <div className="card-body">
                <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px' }}>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Created</dt>
                  <dd>{new Date(segment.created_at).toLocaleString()}</dd>
                  <dt style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Updated</dt>
                  <dd>{new Date(segment.updated_at).toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'geometry' && (
        <div className="tab-content active">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div className="card">
              <div className="card-header">Planned Geometry</div>
              <div className="card-body">
                <pre style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto', background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  {segment.geometry_planned ? JSON.stringify(segment.geometry_planned, null, 2) : 'Not defined'}
                </pre>
              </div>
            </div>
            <div className="card">
              <div className="card-header">Draft Geometry</div>
              <div className="card-body">
                <pre style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto', background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  {segment.geometry_draft ? JSON.stringify(segment.geometry_draft, null, 2) : 'Not defined'}
                </pre>
              </div>
            </div>
            <div className="card">
              <div className="card-header">Approved Geometry</div>
              <div className="card-body">
                <pre style={{ fontSize: '0.75rem', maxHeight: '300px', overflow: 'auto', background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  {segment.geometry_approved ? JSON.stringify(segment.geometry_approved, null, 2) : 'Not defined'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'measurements' && (
        <div className="tab-content active">
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Measurements</h3>
              <Link to={`/projects/${projectId}/assets/${assetId}/segments/${segmentId}/measurements/new`} className="btn btn-sm btn-primary">
                <Plus className="w-4 h-4" />
                Add Measurement
              </Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {measurements.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                  <Ruler className="w-10 h-10" strokeWidth={1.5} />
                  <h4 className="empty-state-title">No measurements recorded</h4>
                  <p className="empty-state-description">Add depth, offset, or other measurements for this segment.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Method</th>
                        <th>Reference Surface</th>
                        <th>Datum</th>
                        <th>Accuracy</th>
                        <th>Measured At</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 500 }}>{m.measurement_type}</td>
                          <td>{m.value}</td>
                          <td>{m.unit}</td>
                          <td><span className="badge badge-neutral">{m.method}</span></td>
                          <td>{m.reference_surface || '—'}</td>
                          <td>{m.datum || '—'}</td>
                          <td>{m.accuracy ? `${m.accuracy} ${m.unit}` : '—'}</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            {m.measured_at ? new Date(m.measured_at).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <Link to={`/projects/${projectId}/assets/${assetId}/segments/${segmentId}/measurements/${m.id}/edit`} className="btn btn-sm btn-outline" style={{ padding: '6px' }}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}