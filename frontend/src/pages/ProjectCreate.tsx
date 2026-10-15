import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../services/api';
import { ProjectStatus } from '../types';
import { ChevronRight, Save, X, Loader2, MapPin, Search } from 'lucide-react';

export default function ProjectCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as ProjectStatus,
    crs: 'EPSG:4326 (WGS84)',
    address: '',
    bounds: '',
  });

  // Mock geocoding - auto-fills bounds when address changes
  useEffect(() => {
    if (formData.address.trim().length > 3) {
      setGeocoding(true);
      // Simulate API delay
      const timer = setTimeout(() => {
        // Mock bounds based on address (in real app, this would call Nominatim/Google Maps API)
        const mockBounds = generateMockBounds(formData.address);
        setFormData(prev => ({ ...prev, bounds: mockBounds }));
        setGeocoding(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.address]);

  const generateMockBounds = (address: string) => {
    const normalized = address.toLowerCase().trim();
    
    // Specific handling for Khandari Agra, India
    if (normalized.includes('khandari') && normalized.includes('agra')) {
      return '27.200000, 78.010000 (±0.01°)';
    }
    
    // Specific handling for Agra, India
    if (normalized.includes('agra') && (normalized.includes('india') || normalized.includes('up') || normalized.includes('uttar pradesh'))) {
      return '27.176700, 78.008100 (±0.01°)';
    }
    
    // Specific handling for Taj Mahal area
    if (normalized.includes('taj mahal')) {
      return '27.175100, 78.042100 (±0.01°)';
    }
    
    // Specific handling for Khandari area
    if (normalized.includes('khandari')) {
      return '27.200000, 78.010000 (±0.01°)';
    }
    
    // Fallback: hash-based deterministic mock coordinates
    const hash = address.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const baseLat = 27.2 + (hash % 100) / 10000;
    const baseLng = 78.01 + (hash % 100) / 10000;
    return `${baseLat.toFixed(6)}, ${baseLng.toFixed(6)} (±0.01°)`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload = {
      name: formData.name,
      description: formData.description || null,
      status: formData.status,
      crs: formData.crs,
      site_boundary: null,
      owner_id: 1,
    };

    try {
      const response = await projectsApi.create(payload);
      navigate(`/projects/${response.data.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline" style={{ marginBottom: '16px' }}>
            <ChevronRight className="w-4 h-4" style={{ transform: 'rotate(180deg)' }} />
            Back to Projects
          </button>
          <h1 className="page-title">New Project</h1>
          <p className="page-subtitle">Create a new pipeline infrastructure project</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '700px' }}>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Project Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Downtown Gas Pipeline Alignment"
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical' }}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description and scope..."
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status" className="form-label">Status</label>
              <select
                id="status"
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                disabled={isLoading}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="crs" className="form-label">Coordinate Reference System (CRS)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="crs"
                  type="text"
                  className="form-input"
                  value={formData.crs}
                  onChange={(e) => setFormData({ ...formData, crs: e.target.value })}
                  required
                  disabled={isLoading}
                  style={{ background: 'var(--color-bg)', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 500 }}>
                  ✓ WGS84 Locked
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                Hardcoded to EPSG:4326 (WGS84) for global GPS compatibility
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin className="w-4 h-4" />
                  Project Location (Address Lookup)
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="address"
                  type="text"
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address (e.g., 450 Main St, San Francisco, CA)"
                  disabled={isLoading}
                />
                {geocoding && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                    <Search className="w-5 h-5 spinner" strokeWidth={2} style={{ color: 'var(--color-primary)' }} />
                  </div>
                )}
              </div>
              {formData.bounds && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--color-text-light)' }}>Auto-detected bounds: </span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{formData.bounds}</span>
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                Enter a street address to auto-detect spatial bounds for the project site
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary" disabled={isLoading || !formData.name.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 spinner" strokeWidth={2.5} /> : <>
                  <Save className="w-4 h-4" />
                  Create Project
                </>}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" disabled={isLoading}>
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}