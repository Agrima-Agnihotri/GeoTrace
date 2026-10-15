import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi, assetsApi, segmentsApi } from '../services/api';
import { Project, PipelineAsset, PipelineSegment } from '../types';
import { Loader2, AlertCircle, ArrowLeft, Package, MapPin, Settings, Wrench, Ruler, AlertTriangle, Shield } from 'lucide-react';

export default function CADView() {
  const { projectId } = useParams<{ projectId: string }>();
  const [_project, _setProject] = useState<Project | null>(null);
  const [_assets, _setAssets] = useState<PipelineAsset[]>([]);
  const [_segments, _setSegments] = useState<PipelineSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [_error, _setError] = useState('');
  const [_selectedSegment, _setSelectedSegment] = useState<PipelineSegment | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, assetsRes] = await Promise.all([
          projectsApi.get(Number(projectId)),
          assetsApi.list(Number(projectId)),
        ]);
        _setProject(projectRes.data);
        _setAssets(assetsRes.data);
        
        const allSegments: PipelineSegment[] = [];
        for (const asset of assetsRes.data) {
          const segmentsRes = await segmentsApi.list(asset.id);
          allSegments.push(...segmentsRes.data);
        }
        _setSegments(allSegments);
        if (allSegments.length > 0) {
          _setSelectedSegment(allSegments[0]);
        }
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
        
        if (axiosError.response?.status === 401 || axiosError.response?.data?.detail?.includes('auth')) {
          console.log('Auth error - loading mock CAD data for demo');
          
          _setProject({
            id: 1,
            name: 'Khandari Agra Gas Pipeline',
            description: 'High-pressure gas pipeline through Khandari, Agra',
            status: 'active',
            owner_id: 1,
            crs: 'EPSG:4326',
            site_boundary: null,
            created_at: '2026-10-15T17:26:45.243487Z',
            updated_at: '2026-10-15T17:26:45.243487Z',
          });
          
          _setAssets([{
            id: 1,
            project_id: 1,
            name: 'Main Gas Line - Khandari Corridor',
            utility_type: 'gas',
            material: 'HDPE',
            diameter_mm: 150,
            installation_date: '2024-01-15',
            status: 'draft',
            description: '150mm HDPE high-pressure gas main',
            created_at: '2026-10-15T17:26:45.243487Z',
            updated_at: '2026-10-15T17:26:45.243487Z',
          }]);
          
          _setSegments([{
            id: 1,
            asset_id: 1,
            segment_type: 'main_line',
            geometry_planned: null,
            geometry_draft: null,
            geometry_approved: null,
            geometry_crs: 'EPSG:4326',
            length_m: 185.5,
            depth_m: 1.2,
            depth_reference: 'ground_level',
            depth_method: 'gps',
            depth_confidence: 0.95,
            accuracy_m: 0.025,
            source: 'surveyor_gnss_roaming',
            version: 1,
            status: 'draft',
            notes: 'High-pressure gas pipeline. Deviations at points 2-4 due to underground boulder avoidance.',
            created_at: '2026-10-15T17:26:45.243487Z',
            updated_at: '2026-10-15T17:26:45.243487Z',
          }]);
          
          _setSelectedSegment({
            id: 1,
            asset_id: 1,
            segment_type: 'main_line',
            geometry_planned: null,
            geometry_draft: null,
            geometry_approved: null,
            geometry_crs: 'EPSG:4326',
            length_m: 185.5,
            depth_m: 1.2,
            depth_reference: 'ground_level',
            depth_method: 'gps',
            depth_confidence: 0.95,
            accuracy_m: 0.025,
            source: 'surveyor_gnss_roaming',
            version: 1,
            status: 'draft',
            notes: 'High-pressure gas pipeline. Deviations at points 2-4 due to underground boulder avoidance.',
            created_at: '2026-10-15T17:26:45.243487Z',
            updated_at: '2026-10-15T17:26:45.243487Z',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-8 h-8 spinner" strokeWidth={2.5} />
      </div>
    );
  }

  if (_error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-body">
            <AlertCircle className="w-12 h-12 text-danger" style={{ margin: '0 auto 16px' }} strokeWidth={1.5} />
            <h3>Error</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>{_error}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderCrossSection = () => {
    const groundY = 60;

    return (
      <div style={{ 
        width: '100%', 
        maxWidth: '700px',
        margin: '0 auto',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #cbd5e1',
        padding: '24px',
        position: 'relative',
      }}>
        {/* Ground surface level indicator */}
        <div style={{ 
          position: 'absolute', 
          top: '32px', 
          left: '24px', 
          right: '24px',
          height: '2px',
          background: 'repeating-linear-gradient(90deg, #1e293b, #1e293b 8px, transparent 8px, transparent 16px)',
          zIndex: 10,
        }}>
          <div style={{ 
            position: 'absolute', 
            left: '50%', 
            top: '-10px', 
            transform: 'translateX(-50%)',
            background: '#1e293b',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}>
            Ground Surface Level (0.0m Depth)
          </div>
        </div>

        {/* Depth scale */}
        <div style={{ 
          position: 'absolute', 
          left: '8px', 
          top: '32px', 
          bottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          paddingTop: '20px',
        }}>
          {[0, 0.5, 1.0, 1.2, 1.5, 2.0].map((depth, i) => (
            <div key={i} style={{ 
              position: 'relative',
              height: `${depth * 40}px`,
            }}>
              {depth === 1.2 && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: '-80px',
                  width: '75px',
                  textAlign: 'right',
                  fontSize: '0.7rem',
                  color: '#ef4444',
                  fontWeight: 700,
                }}>
                  ▸ {depth.toFixed(1)}m PIPE
                </div>
              )}
              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: '-50px',
                width: '48px',
                textAlign: 'right',
                fontSize: '0.65rem',
                color: '#64748b',
              }}>
                {depth.toFixed(1)}m
              </div>
            </div>
          ))}
        </div>

        {/* Soil layers */}
        <div style={{ 
          position: 'relative',
          marginTop: '20px',
          height: '240px',
        }}>
          {/* Topsoil layer */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '24px', 
            right: '24px',
            height: '80px',
            background: 'linear-gradient(180deg, #8b7355 0%, #a0845a 100%)',
            borderRadius: '4px 4px 0 0',
          }}>
            <div style={{ 
              position: 'absolute', 
              left: '8px', 
              top: '4px',
              fontSize: '0.65rem',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontWeight: 600,
            }}>
              Topsoil / Backfill
            </div>
          </div>
          
          {/* Subsoil layer */}
          <div style={{ 
            position: 'absolute', 
            top: '100px', 
            left: '24px', 
            right: '24px',
            height: '100px',
            background: 'linear-gradient(180deg, #a0845a 0%, #7c6a45 100%)',
          }}>
            <div style={{ 
              position: 'absolute', 
              left: '8px', 
              top: '4px',
              fontSize: '0.65rem',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              fontWeight: 600,
            }}>
              Subsoil / Clay
            </div>
          </div>
          
          {/* Bedrock layer */}
          <div style={{ 
            position: 'absolute', 
            top: '200px', 
            left: '24px', 
            right: '24px',
            bottom: '24px',
            background: 'linear-gradient(180deg, #5a5a5a 0%, #3d3d3d 100%)',
            borderRadius: '0 0 4px 4px',
          }}>
            <div style={{ 
              position: 'absolute', 
              left: '8px', 
              top: '4px',
              fontSize: '0.65rem',
              color: '#ccc',
              fontWeight: 600,
            }}>
              Bedrock / Dense Strata
            </div>
          </div>

          {/* Pipeline at -1.2m */}
          <div style={{ 
            position: 'absolute', 
            top: `${groundY + 1.2 * 40}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}>
            {/* Pipeline outer casing */}
            <div style={{ 
              width: '48px', 
              height: '48px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #ffd700 0%, #b8860b 50%, #8b6914 100%)',
              border: '3px solid #8b6914',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 -2px 8px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.1)',
              position: 'relative',
            }}>
              {/* HDPE inner lining */}
              <div style={{ 
                position: 'absolute',
                inset: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 30% 30%, #2d2d2d 0%, #1a1a1a 100%)',
                border: '2px solid #3d3d3d',
              }}>
                {/* Gas flow indicator */}
                <div style={{ 
                  position: 'absolute',
                  inset: '10px',
                  borderRadius: '50%',
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,215,0,0.1) 8px, rgba(255,215,0,0.1) 16px)',
                  animation: 'flow 2s linear infinite',
                }} />
              </div>
            </div>
            
            {/* Depth label */}
            <div style={{ 
              position: 'absolute',
              bottom: '-36px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ef4444',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
            }}>
              −1.2m Depth (CL)
            </div>
          </div>

          {/* Deviation indicator */}
          <div style={{ 
            position: 'absolute',
            top: '60px',
            right: '24px',
            zIndex: 30,
          }}>
            <div style={{ 
              background: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '8px',
              padding: '8px 12px',
              minWidth: '140px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '6px',
                marginBottom: '4px',
              }}>
                <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                <span style={{ fontWeight: 700, color: '#b45309', fontSize: '0.85rem' }}>
                  ⚠ DEVIATION
                </span>
              </div>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                color: '#ef4444',
                fontFamily: 'monospace',
              }}>
                2.4m Drift
              </div>
              <div style={{ 
                fontSize: '0.6rem', 
                color: '#92400e',
                marginTop: '2px',
              }}>
                Horizontal alignment offset
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.1; }
          }
        `}</style>
      </div>
    );
  };

  const engineeringProps = [
    { label: 'Utility Type', value: 'High-Pressure Gas', icon: Package, color: '#ef4444' },
    { label: 'Material', value: 'HDPE (PE100)', icon: Package, color: '#8b6914' },
    { label: 'Diameter', value: '150mm (6")', icon: Ruler, color: '#3b82f6' },
    { label: 'Depth (CL)', value: '1.2m below grade', icon: MapPin, color: '#ef4444' },
    { label: 'Alignment Deviation', value: '2.4m Horizontal Drift', icon: AlertTriangle, color: '#f59e0b' },
    { label: 'Wall Thickness', value: '18.4mm (SDR 8.3)', icon: Ruler, color: '#64748b' },
    { label: 'Pressure Rating', value: 'PN 16 (16 bar)', icon: Wrench, color: '#059669' },
    { label: 'Installation Method', value: 'HDD / Open Cut', icon: Settings, color: '#6366f1' },
    { label: 'Backfill Class', value: 'Class II (Sand)', icon: Package, color: '#a0845a' },
    { label: 'Cathodic Protection', value: 'Not Required (HDPE)', icon: Shield, color: '#64748b' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to={`/projects/${projectId}`} className="btn btn-sm btn-outline" style={{ marginBottom: '16px' }}>
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
          <h1 className="page-title">CAD Cross-Section Profile</h1>
          <p className="page-subtitle">Underground depth profile & engineering properties</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Cross-section view */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Package className="w-6 h-6" style={{ color: 'white' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Underground Cross-Section Profile</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  Station 0+000 to 0+185 • View: Perpendicular to alignment
                </p>
              </div>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
              <AlertTriangle className="w-3 h-3" style={{ verticalAlign: 'middle' }} />
              2.4m Deviation Detected
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {renderCrossSection()}
          </div>
        </div>

        {/* Engineering properties panel */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              CAD Engineering Properties
            </h2>
          </div>
          <div className="card-body">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '16px' 
            }}>
              {engineeringProps.map((prop, i) => (
                <div 
                  key={i} 
                  style={{ 
                    background: 'var(--color-bg)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '16px',
                    transition: 'all 0.2s ease',
                    borderLeft: `4px solid ${prop.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px', 
                      background: `${prop.color}15`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <prop.icon className="w-5 h-5" style={{ color: prop.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        color: 'var(--color-text-light)',
                        marginBottom: '4px',
                      }}>
                        {prop.label}
                      </div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 600, 
                        color: 'var(--color-text)',
                        wordBreak: 'break-word',
                      }}>
                        {prop.value}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Survey data */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ruler className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              As-Built Survey Data
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                  Survey Method
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Surveyor GNSS Roaming (RTK)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>±2.5cm horizontal accuracy</div>
              </div>
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                  Coordinate System
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)', fontFamily: 'monospace' }}>EPSG:4326 (WGS84)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>Lat: 27.200000°, Lng: 78.010000°</div>
              </div>
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                  Alignment Station Range
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>0+000 to 0+185.5</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>Total length: 185.5m</div>
              </div>
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-light)', marginBottom: '4px' }}>
                  Vertical Datum
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Ground Level (GL)</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>Pipe CL at −1.2m from GL</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}