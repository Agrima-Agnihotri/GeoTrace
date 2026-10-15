import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetsApi } from '../services/api';
import { UtilityType, PipelineStatus } from '../types';
import { ChevronRight, Save, X, Loader2, ChevronDown, Video, CheckCircle, AlertTriangle } from 'lucide-react';

const utilityTypeLabels: Record<UtilityType, string> = {
  water: 'Water',
  gas: 'Gas',
  sewage: 'Sewage',
  electrical: 'Electrical',
  telecom: 'Telecom',
};

const statusLabels: Record<PipelineStatus, string> = {
  planned: 'Planned',
  draft: 'Draft',
  pending_verification: 'Pending Verification',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
  needs_additional_evidence: 'Needs Additional Evidence',
};

export default function AssetCreate() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    utility_type: 'gas' as UtilityType,
    material: 'HDPE',
    diameter_mm: 150,
    installation_date: '',
    status: 'draft' as PipelineStatus,
    description: '',
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProcessing, setVideoProcessing] = useState(false);
  const [videoHash, setVideoHash] = useState<string>('');

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setVideoFile(file);
    setVideoProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate mock hash
    const mockHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setVideoHash(mockHash);
    setVideoProcessing(false);
    
    // Auto-reset after showing result
    setTimeout(() => {
      setVideoProcessing(false);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const payload = {
      ...formData,
      project_id: Number(projectId),
      diameter_mm: formData.diameter_mm || null,
      installation_date: formData.installation_date || null,
      description: formData.description || null,
    };

    try {
      const response = await assetsApi.create(Number(projectId), payload);
      navigate(`/projects/${projectId}/assets/${response.data.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Failed to create asset');
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: isMobile ? '100vh' : 'auto',
      maxWidth: isMobile ? '100%' : '500px',
      margin: '0 auto',
      background: 'var(--color-surface)',
      borderRadius: isMobile ? 0 : 'var(--radius-lg)',
      boxShadow: isMobile ? 'none' : '0 4px 24px rgba(0,0,0,0.1)',
    }}>
      {/* Header - sticky on mobile */}
      <div style={{ 
        position: isMobile ? 'sticky' : 'relative',
        top: 0,
        zIndex: 10,
        padding: '16px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button 
          onClick={() => navigate(-1)} 
          className="btn btn-sm btn-outline"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <ChevronRight className="w-5 h-5" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, flex: 1, textAlign: 'center', margin: 0 }}>
          Add Pipeline Asset
        </h2>
        <div style={{ width: '44px' }} />
      </div>

      {/* Form Content - Scrollable on mobile */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: isMobile ? '16px' : '24px',
        paddingBottom: isMobile ? '100px' : '24px',
      }}>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="asset-form">
          <div className="form-group">
            <label htmlFor="name" className="form-label">Asset Name <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Gas Line - Segment A"
              required
              disabled={isLoading}
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="utility_type" className="form-label">Utility Type <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <select
                id="utility_type"
                className="form-select"
                value={formData.utility_type}
                onChange={(e) => setFormData({ ...formData, utility_type: e.target.value as UtilityType })}
                disabled={isLoading}
                style={{ 
                  fontSize: '1rem', 
                  paddingRight: '44px',
                  appearance: 'none',
                }}
              >
                {Object.entries(utilityTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5" style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none',
                color: 'var(--color-text-light)',
              }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="material" className="form-label">Material</label>
            <input
              id="material"
              type="text"
              className="form-input"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              placeholder="e.g., HDPE, PVC, Steel, Concrete"
              disabled={isLoading}
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="diameter_mm" className="form-label">Diameter (mm)</label>
            <input
              id="diameter_mm"
              type="number"
              className="form-input"
              value={formData.diameter_mm}
              onChange={(e) => setFormData({ ...formData, diameter_mm: parseInt(e.target.value) || 0 })}
              placeholder="150"
              min="1"
              disabled={isLoading}
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="installation_date" className="form-label">Installation Date</label>
            <input
              id="installation_date"
              type="date"
              className="form-input"
              value={formData.installation_date}
              onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
              disabled={isLoading}
              style={{ fontSize: '1rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">Status</label>
            <div style={{ position: 'relative' }}>
              <select
                id="status"
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PipelineStatus })}
                disabled={isLoading}
                style={{ 
                  fontSize: '1rem', 
                  paddingRight: '44px',
                  appearance: 'none',
                }}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5" style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                pointerEvents: 'none',
                color: 'var(--color-text-light)',
              }} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              className="form-input"
              style={{ minHeight: '100px', resize: 'vertical', fontSize: '1rem' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Asset description and notes..."
              disabled={isLoading}
            />
          </div>

          {/* Video Capture HUD Field */}
          <div className="form-group">
            <label htmlFor="video_capture" className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Video className="w-4 h-4" />
                Live Field Video Capture
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="video_capture"
                type="file"
                accept="video/*"
                capture="environment"
                className="form-input"
                style={{ 
                  padding: '16px',
                  cursor: 'pointer',
                  background: 'var(--color-bg)',
                  border: '2px dashed var(--color-border)',
                  transition: 'all 0.2s ease',
                  fontSize: '1rem',
                }}
                onChange={handleVideoChange}
                disabled={isLoading || videoProcessing}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              />
              {videoFile && (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px',
                  zIndex: 10,
                }}>
                  {videoProcessing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600, 
                        color: '#f59e0b',
                        textAlign: 'center',
                        animation: 'pulse 1.5s infinite',
                      }}>
                        AI Pipeline Processing Frame Hashes...
                      </div>
                      <div style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 700, 
                        color: '#10b981',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        Depth Extracted: 1.2m
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        SHA-256: {videoHash?.slice(0, 16)}...
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle className="w-12 h-12" style={{ color: '#10b981' }} />
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981' }}>
                        Video Captured Successfully
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                        {videoFile.name} • {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p style={{ 
              fontSize: '0.8125rem', 
              color: '#f59e0b', 
              marginTop: '10px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              lineHeight: 1.5,
              background: '#fef3c7',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #f59e0b',
            }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b', marginTop: '1px' }} />
              <span>⚠️ Live Field Capture Only: Point camera directly at the exposed trench line to automatically stream frame hashes to the AI depth calculation engine.</span>
            </p>
          </div>
        </form>
      </div>

      {/* Fixed Action Bar at bottom on mobile */}
      {isMobile && (
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          padding: '16px',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
        }}>
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="btn btn-outline" 
            style={{ flex: 1, minHeight: '48px', fontSize: '1rem' }}
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button 
            type="submit" 
            form="asset-form" 
            className="btn btn-primary" 
            style={{ flex: 1, minHeight: '48px', fontSize: '1rem' }}
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? <Loader2 className="w-4 h-4 spinner" strokeWidth={2.5} /> : <>
              <Save className="w-4 h-4" />
              Create Asset
            </>}
          </button>
        </div>
      )}

      {!isMobile && (
        <div style={{ 
          padding: '24px', 
          borderTop: '1px solid var(--color-border)', 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end',
        }}>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline" disabled={isLoading}>
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button type="submit" form="asset-form" className="btn btn-primary" disabled={isLoading || !formData.name.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 spinner" strokeWidth={2.5} /> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save className="w-4 h-4" />
                <span>Create Asset</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}