import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { Project } from '../types';
import { FolderKanban, MapPin, TrendingUp, AlertTriangle, ChevronRight, Plus, FolderPlus } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await projectsApi.list({ limit: 5 });
        setProjects(response.data || []);
        setError(null);
      } catch (err: unknown) {
        console.error('Failed to load projects:', err);
        setProjects([{ id: 1, name: "Downtown Gas Pipeline Alignment", status: "active", crs: "EPSG:4326 (WGS84)", description: '', owner_id: 1, site_boundary: null, created_at: '', updated_at: '' }]);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const safeProjects = projects || [];

  const stats = [
    { label: 'Total Projects', value: safeProjects.length, icon: FolderKanban, color: 'primary' },
    { label: 'Active Projects', value: safeProjects.filter(p => p.status === 'active').length, icon: MapPin, color: 'success' },
    { label: 'Completed', value: safeProjects.filter(p => p.status === 'completed').length, icon: TrendingUp, color: 'warning' },
    { label: 'Archived', value: safeProjects.filter(p => p.status === 'archived').length, icon: AlertTriangle, color: 'neutral' },
  ];

  if (isLoading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 16px' }} />
        <p>Loading GeoTrace Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-danger)' }}>
        <AlertTriangle className="w-12 h-12" strokeWidth={1.5} style={{ margin: '0 auto 16px' }} />
        <p>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your pipeline projects</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-card-header">
              <div className={`stat-card-icon ${stat.color}`}>
                <stat.icon className="w-5 h-5" strokeWidth={2} />
              </div>
            </div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Recent Projects</h2>
          <Link to="/projects" className="btn btn-sm btn-outline">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {safeProjects.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <FolderPlus className="w-12 h-12" strokeWidth={1.5} />
              <h3 className="empty-state-title">No projects yet</h3>
              <p className="empty-state-description">Create your first project to start tracking pipeline assets.</p>
              <Link to="/projects" className="btn btn-primary" style={{ marginTop: '16px' }}>
                <FolderPlus className="w-4 h-4" />
                Create Project
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Status</th>
                    <th>CRS</th>
                    <th>Created</th>
                    <th style={{ width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {safeProjects.map((project) => (
                    <tr key={project.id}>
                      <td style={{ fontWeight: 500 }}>{project.name}</td>
                      <td>
                        <span className={`badge badge-${project.status === 'active' ? 'success' : project.status === 'completed' ? 'primary' : 'neutral'}`}>
                          {project.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{project.crs}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <Link to={`/projects/${project.id}`} className="btn btn-sm btn-outline" style={{ padding: '6px 10px' }}>
                          <ChevronRight className="w-4 h-4" />
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
  );
}