import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { Project, ProjectStatus } from '../types';
import { Plus, Search, Filter, ChevronRight, FolderKanban, Loader2 } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectsApi.list({
        skip: (page - 1) * pageSize,
        limit: pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      setProjects(response.data);
      setTotalPages(Math.ceil(response.data.length / pageSize) || 1);
    } catch (err: unknown) {
      // Error handling could be added here with a toast notification
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter]);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage your pipeline infrastructure projects</p>
        </div>
        <Link to="/projects/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search className="w-5 h-5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search projects..."
                style={{ paddingLeft: '40px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter className="w-5 h-5" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <select
                className="form-select"
                style={{ paddingLeft: '40px', minWidth: '180px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Loader2 className="w-8 h-8 spinner" strokeWidth={2.5} />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px' }}>
              <FolderKanban className="w-12 h-12" strokeWidth={1.5} />
              <h3 className="empty-state-title">No projects found</h3>
              <p className="empty-state-description">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first project to get started.'}
              </p>
              {!search && statusFilter === 'all' && (
                <Link to="/projects/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
                  <Plus className="w-4 h-4" />
                  Create Project
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>CRS</th>
                      <th>Created</th>
                      <th style={{ width: '80px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td style={{ fontWeight: 500 }}>{project.name}</td>
                        <td style={{ color: 'var(--color-text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {project.description || '—'}
                        </td>
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
              {totalPages > 1 && (
                <div className="card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}