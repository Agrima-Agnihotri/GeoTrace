import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { assetsApi, segmentsApi } from '../services/api';
import { PipelineAsset, PipelineSegment } from '../types';
import { Plus, ChevronRight, Package, MapPin, Settings, Trash2, Edit, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

const utilityTypeIcons: Record<string, typeof Package> = {
  water: Package,
  gas: Package,
  sewage: Package,
  electrical: Package,
  telecom: Package,
};

export default function AssetDetail() {
  const { projectId, assetId } = useParams<{ projectId: string; assetId: string }>();
  const [asset, setAsset] = useState<PipelineAsset | null>(null);
  const [segments, setSegments] = useState<PipelineSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!assetId) return;
      try {
        const [assetRes, segmentsRes] = await Promise.all([
          assetsApi.get(Number(assetId)),
          segmentsApi.list(Number(assetId)),
        ]);
        setAsset(assetRes.data);
        setSegments(segmentsRes.data);
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || 'Failed to load asset');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [assetId]);

  const handleDeleteSegment = async (segmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return;
    setDeletingId(segmentId);
    try {
      await segmentsApi.delete(segmentId);
      setSegments(prev => prev.filter(s => s.id !== segmentId));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      alert(axiosError.response?.data?.detail || 'Failed to delete segment');
    } finally {
      setDeletingId(null);
    }
  };

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

  if (!asset) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="btn btn-sm btn-outline" style={{ marginBottom: '16px' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div className="sidebar-logo" style={{ width: '40px', height: '40px' }}>
              {(() => {
              const Icon = utilityTypeIcons[asset.utility_type];
              return <Icon className="w-6 h-6" strokeWidth={2.5} />;
            })()}
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>{asset.name}</h1>
              <p className="page-subtitle" style={{ margin: 0 }}>{asset.utility_type} pipeline</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={`/projects/${projectId}/assets/${assetId}/segments/new`} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Segment
          </Link>
          <Link to={`/projects/${projectId}/assets/${assetId}/edit`} className="btn btn-outline">
            <Settings className="w-4 h-4" />
            Edit Asset
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon primary">
              <Package className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card-value">{segments.length}</div>
          <div className="stat-card-label">Segments</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon success">
              <MapPin className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card-value">{segments.filter(s => s.status === 'approved').length}</div>
          <div className="stat-card-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon warning">
              <Settings className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card-value">{asset.material || '—'}</div>
          <div className="stat-card-label">Material</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon neutral">
              <Package className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card-value">{asset.diameter_mm ? `${asset.diameter_mm}mm` : '—'}</div>
          <div className="stat-card-label">Diameter</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pipeline Segments</h2>
          <Link to={`/projects/${projectId}/assets/${assetId}/segments/new`} className="btn btn-sm btn-primary">
            <Plus className="w-4 h-4" />
            Add Segment
          </Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {segments.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <Package className="w-12 h-12" strokeWidth={1.5} />
              <h3 className="empty-state-title">No segments defined</h3>
              <p className="empty-state-description">Add pipeline segments to define the route geometry.</p>
              <Link to={`/projects/${projectId}/assets/${assetId}/segments/new`} className="btn btn-primary" style={{ marginTop: '16px' }}>
                <Plus className="w-4 h-4" />
                Add Segment
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Length (m)</th>
                    <th>Depth (m)</th>
                    <th>Accuracy (m)</th>
                    <th>Version</th>
                    <th style={{ width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((segment) => (
                    <tr key={segment.id}>
                      <td>{segment.segment_type}</td>
                      <td>
                        <span className={`badge badge-${segment.status === 'approved' ? 'success' : segment.status === 'planned' ? 'neutral' : segment.status === 'rejected' ? 'danger' : 'warning'}`}>
                          {segment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>{segment.length_m ? segment.length_m.toFixed(2) : '—'}</td>
                      <td>{segment.depth_m !== null && segment.depth_m !== undefined ? segment.depth_m.toFixed(2) : 'Unknown'}</td>
                      <td>{segment.accuracy_m ? segment.accuracy_m.toFixed(2) : '—'}</td>
                      <td>v{segment.version}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link to={`/projects/${projectId}/assets/${assetId}/segments/${segment.id}`} className="btn btn-sm btn-outline" style={{ padding: '6px' }} title="View">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <Link to={`/projects/${projectId}/assets/${assetId}/segments/${segment.id}/edit`} className="btn btn-sm btn-outline" style={{ padding: '6px' }} title="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteSegment(segment.id)}
                            disabled={deletingId === segment.id}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '6px', color: 'var(--color-danger)' }}
                            title="Delete"
                          >
                            {deletingId === segment.id ? <Loader2 className="w-4 h-4 spinner" strokeWidth={2.5} /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
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
  );
}