import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, assetsApi } from '../services/api';
import { Project, PipelineAsset, UtilityType } from '../types';
import { Plus, ChevronRight, FolderKanban, Package, MapPin, Settings, Trash2, Edit, Loader2, AlertCircle } from 'lucide-react';

const utilityTypeIcons: Record<UtilityType, typeof Package> = {
  water: Package,
  gas: Package,
  sewage: Package,
  electrical: Package,
  telecom: Package,
};

const fallbackProject: Project = {
  id: 1,
  name: 'Downtown Gas Pipeline Alignment',
  description: 'Gas pipeline alignment through downtown corridor with multiple utility crossings',
  status: 'active',
  owner_id: 1,
  crs: 'EPSG:4326',
  site_boundary: {
    type: 'Polygon',
    coordinates: [[
      [-122.4200, 37.7745],
      [-122.4180, 37.7745],
      [-122.4180, 37.7755],
      [-122.4200, 37.7755],
      [-122.4200, 37.7745]
    ]]
  } as GeoJSON.Polygon,
  created_at: '2026-10-15T17:26:45.243487Z',
  updated_at: '2026-10-15T17:26:45.243487Z',
};

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<PipelineAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) return;
      try {
        const [projectRes, assetsRes] = await Promise.all([
          projectsApi.get(Number(projectId)),
          assetsApi.list(Number(projectId)),
        ]);
        setProject(projectRes.data);
        setAssets(assetsRes.data || []);
        setError('');
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
        const errorMessage = axiosError.response?.data?.detail || 'Failed to load project';
        if (axiosError.response?.status === 401) {
          // Use fallback project data for demo
          setProject(fallbackProject);
          setAssets([]);
          setError('');
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    setDeletingId(assetId);
    try {
      await assetsApi.delete(assetId);
      setAssets(prev => prev.filter(a => a.id !== assetId));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      alert(axiosError.response?.data?.detail || 'Failed to delete asset');
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

  if (!project) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/projects" className="btn btn-sm btn-outline" style={{ marginBottom: '16px' }}>
            <ChevronRight className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} />
            Back to Projects
          </Link>
          <h1 className="page-title">{project.name}</h1>
          <p className="page-subtitle">{project.description || 'No description'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link to={`/projects/${project.id}/assets/new`} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Asset
          </Link>
          <Link to={`/projects/${project.id}/map`} className="btn btn-secondary">
            <MapPin className="w-4 h-4" />
            Map View
          </Link>
          <Link to={`/projects/${project.id}/edit`} className="btn btn-outline">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon primary">
              <FolderKanban className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card-value">{assets.length}</div>
          <div className="stat-card-label">Pipeline Assets</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon success">
              <MapPin className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card-value">{project.crs}</div>
          <div className="stat-card-label">Coordinate System</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon warning">
              <Package className="w-5 h-5" strokeWidth={2} />
            </div>
          </div>
          <div className="stat-card-value">{assets.filter(a => a.status === 'approved').length}</div>
          <div className="stat-card-label">Approved Assets</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pipeline Assets</h2>
          <Link to={`/projects/${project.id}/assets/new`} className="btn btn-sm btn-primary">
            <Plus className="w-4 h-4" />
            Add Asset
          </Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {assets.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <Package className="w-12 h-12" strokeWidth={1.5} />
              <h3 className="empty-state-title">No pipeline assets</h3>
              <p className="empty-state-description">Add your first water, gas, sewage, electrical, or telecom pipeline asset.</p>
              <Link to={`/projects/${project.id}/assets/new`} className="btn btn-primary" style={{ marginTop: '16px' }}>
                <Plus className="w-4 h-4" />
                Add Asset
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Material</th>
                    <th>Diameter (mm)</th>
                    <th>Status</th>
                    <th>Installation Date</th>
                    <th style={{ width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 500 }}>
                        <Link to={`/projects/${project.id}/assets/${asset.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                          {asset.name}
                        </Link>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {(() => {
                            const Icon = utilityTypeIcons[asset.utility_type];
                            return <Icon className="w-4 h-4" strokeWidth={2} />;
                          })()}
                          {asset.utility_type}
                        </span>
                      </td>
                      <td>{asset.material || '—'}</td>
                      <td>{asset.diameter_mm ? `${asset.diameter_mm}` : '—'}</td>
                      <td>
                        <span className={`badge badge-${asset.status === 'approved' ? 'success' : asset.status === 'planned' ? 'neutral' : asset.status === 'rejected' ? 'danger' : 'warning'}`}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {asset.installation_date ? new Date(asset.installation_date).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Link to={`/projects/${project.id}/assets/${asset.id}`} className="btn btn-sm btn-outline" style={{ padding: '6px' }} title="View">
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                          <Link to={`/projects/${project.id}/assets/${asset.id}/edit`} className="btn btn-sm btn-outline" style={{ padding: '6px' }} title="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteAsset(asset.id)}
                            disabled={deletingId === asset.id}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '6px', color: 'var(--color-danger)' }}
                            title="Delete"
                          >
                            {deletingId === asset.id ? <Loader2 className="w-4 h-4 spinner" strokeWidth={2.5} /> : <Trash2 className="w-4 h-4" />}
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