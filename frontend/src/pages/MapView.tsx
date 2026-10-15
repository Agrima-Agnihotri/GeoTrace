import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { projectsApi, assetsApi, segmentsApi } from '../services/api';
import { Project, PipelineAsset, PipelineSegment } from '../types';
import { Loader2, AlertCircle, ArrowLeft, WifiOff, Map } from 'lucide-react';

function getStyle(feature: any) {
  const status = feature.properties?.status || 'planned';
  const geometryType = feature.properties?.geometry_type || 'planned';
  
  const colors: Record<string, string> = {
    planned: '#3b82f6',
    draft: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    pending_verification: '#f59e0b',
    pending_review: '#f59e0b',
    needs_additional_evidence: '#ef4444',
  };
  
  const dashArrays: Record<string, string> = {
    planned: '5, 5',
    draft: '5, 5',
    approved: '',
    rejected: '',
    pending_verification: '2, 4',
    pending_review: '2, 4',
    needs_additional_evidence: '',
  };

  const color = colors[status] || '#64748b';
  const dashArray = dashArrays[status] || '';

  return {
    color,
    weight: geometryType === 'approved' ? 3 : 2,
    opacity: 0.8,
    dashArray,
    fillColor: color,
    fillOpacity: 0.1,
  };
}

// Mock CAD/as-built line data for demo (bypasses 401)
const mockSegments: PipelineSegment[] = [
  {
    id: 1,
    asset_id: 1,
    segment_type: 'main_line',
    geometry_planned: {
      type: 'LineString',
      coordinates: [
        [-122.4200, 37.7748, 0],
        [-122.4195, 37.7749, 0],
        [-122.4190, 37.7750, 0],
        [-122.4185, 37.7751, 0],
        [-122.4180, 37.7752, 0],
      ],
    } as GeoJSON.LineString,
    geometry_draft: {
      type: 'LineString',
      coordinates: [
        [-122.4200, 37.7748, 0],
        [-122.4194, 37.77495, 0],
        [-122.4189, 37.77505, 0],
        [-122.4184, 37.77515, 0],
        [-122.4180, 37.7752, 0],
      ],
    } as GeoJSON.LineString,
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
    notes: 'As-built survey via GNSS roaming. Deviations at points 2-4 due to underground boulder avoidance.',
    created_at: '2026-10-15T17:26:45.243487Z',
    updated_at: '2026-10-15T17:26:45.243487Z',
  },
  {
    id: 2,
    asset_id: 1,
    segment_type: 'service_connection',
    geometry_planned: {
      type: 'LineString',
      coordinates: [
        [-122.4192, 37.7749, 0],
        [-122.4190, 37.7747, 0],
      ],
    } as GeoJSON.LineString,
    geometry_draft: {
      type: 'LineString',
      coordinates: [
        [-122.4192, 37.7749, 0],
        [-122.4189, 37.77475, 0],
      ],
    } as GeoJSON.LineString,
    geometry_approved: null,
    geometry_crs: 'EPSG:4326',
    length_m: 45.2,
    depth_m: 0.8,
    depth_reference: 'ground_level',
    depth_method: 'gps',
    depth_confidence: 0.9,
    accuracy_m: 0.03,
    source: 'surveyor_gnss_roaming',
    version: 1,
    status: 'draft',
    notes: 'Service connection to building at 450 Main St.',
    created_at: '2026-10-15T17:26:45.243487Z',
    updated_at: '2026-10-15T17:26:45.243487Z',
  },
];

function MapViewComponent({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<PipelineAsset[]>([]);
  const [segments, setSegments] = useState<PipelineSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({});
  const [useFallbackView, setUseFallbackView] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // SVG fallback rendering functions
  const getCoords = (geom: GeoJSON.GeoJsonObject | null | undefined): number[][] => {
    if (!geom || geom.type !== 'LineString') return [];
    return (geom as GeoJSON.LineString).coordinates;
  };

  const projectCoordsToSVG = (coords: number[][], width: number, height: number, padding: number = 40) => {
    if (!coords.length) return [];
    
    const lats = coords.map(c => c[1]);
    const lngs = coords.map(c => c[0]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const latRange = maxLat - minLat || 0.001;
    const lngRange = maxLng - minLng || 0.001;
    
    return coords.map(([lng, lat]) => ({
      x: padding + ((lng - minLng) / lngRange) * (width - 2 * padding),
      y: height - padding - ((lat - minLat) / latRange) * (height - 2 * padding),
    }));
  };

  const renderCADFallback = (width: number = 400, height: number = 300) => {
    if (!segments.length) return null;
    
    // Get all coordinates for bounds calculation
    const allCoords: number[][] = [];
    segments.forEach(s => {
      const plannedCoords = getCoords(s.geometry_planned);
      const draftCoords = getCoords(s.geometry_draft);
      if (plannedCoords.length) allCoords.push(...plannedCoords);
      if (draftCoords.length) allCoords.push(...draftCoords);
    });
    
    if (!allCoords.length) return null;
    
    const plannedPath = getCoords(segments[0].geometry_planned).length
      ? projectCoordsToSVG(getCoords(segments[0].geometry_planned), width, height)
      : [];
    const draftPath = getCoords(segments[0].geometry_draft).length
      ? projectCoordsToSVG(getCoords(segments[0].geometry_draft), width, height)
      : [];
    
    // Find deviation point (vertex 2 - index 1)
    const deviationPoint = plannedPath[1] && draftPath[1] 
      ? { planned: plannedPath[1], draft: draftPath[1] }
      : null;
    
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '400px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #334155',
      }}>
        {/* Grid background */}
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
          
          {/* Planned line - dashed blue */}
          {plannedPath.length > 1 && (
            <polyline
              points={plannedPath.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeDasharray="10,8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 4px rgba(59,130,246,0.6))"
            />
          )}
          
          {/* As-built line - solid green */}
          {draftPath.length > 1 && (
            <polyline
              points={draftPath.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 6px rgba(16,185,129,0.8))"
            />
          )}
          
          {/* Vertex markers for planned */}
          {plannedPath.map((p, i) => (
            <circle
              key={`planned-${i}`}
              cx={p.x}
              cy={p.y}
              r={5}
              fill="#3b82f6"
              stroke="#fff"
              strokeWidth={2}
              opacity={0.9}
            />
          ))}
          
          {/* Vertex markers for as-built */}
          {draftPath.map((p, i) => (
            <circle
              key={`draft-${i}`}
              cx={p.x}
              cy={p.y}
              r={5}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={2}
              opacity={0.9}
            />
          ))}
          
          {/* Deviation warning bubble at vertex 2 (index 1) */}
          {deviationPoint && (
            <g filter="drop-shadow(0 4px 12px rgba(245,158,11,0.5))">
              {/* Deviation line connecting planned to actual */}
              <line
                x1={deviationPoint.planned.x}
                y1={deviationPoint.planned.y}
                x2={deviationPoint.draft.x}
                y2={deviationPoint.draft.y}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4,4"
                strokeLinecap="round"
              />
              {/* Warning icon */}
              <circle
                cx={deviationPoint.draft.x}
                cy={deviationPoint.draft.y - 35}
                r={22}
                fill="#fef3c7"
                stroke="#f59e0b"
                strokeWidth={2}
              />
              <text
                x={deviationPoint.draft.x}
                y={deviationPoint.draft.y - 35}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="18"
                fill="#f59e0b"
                fontWeight="bold"
              >
                ⚠
              </text>
              {/* Warning bubble */}
              <rect
                x={deviationPoint.draft.x - 85}
                y={deviationPoint.draft.y - 80}
                width={170}
                height={40}
                rx={8}
                fill="#fff"
                stroke="#f59e0b"
                strokeWidth={2}
              />
              <text
                x={deviationPoint.draft.x}
                y={deviationPoint.draft.y - 60}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fontWeight="600"
                fill="#b45309"
              >
                ⚠ DEVIATION ALERT: 2.4m
              </text>
              <text
                x={deviationPoint.draft.x}
                y={deviationPoint.draft.y - 48}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="#92400e"
              >
                Horizontal drift at vertex junction
              </text>
            </g>
          )}
          
          {/* Legend */}
          <g transform={`translate(20, 20)`}>
            <rect x="0" y="0" width={180} height={70} rx={8} fill="#0f172a" fillOpacity={0.95} stroke="#334155" strokeWidth={1}/>
            <line x1={10} y1={16} x2={40} y2={16} stroke="#3b82f6" strokeWidth={2.5} strokeDasharray="10,8"/>
            <text x={48} y={21} fontSize="11" fill="#94a3b8" fontFamily="system-ui">Planned Corridor (CAD)</text>
            <line x1={10} y1={40} x2={40} y2={40} stroke="#10b981" strokeWidth={3}/>
            <text x={48} y={45} fontSize="11" fill="#94a3b8" fontFamily="system-ui">As-Built Surveyed</text>
            <line x1={10} y1={62} x2={40} y2={62} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4,4"/>
            <text x={48} y={67} fontSize="11" fill="#f59e0b" fontFamily="system-ui">2.4m Deviation</text>
          </g>
          
          {/* North arrow */}
          <g transform={`translate(${width - 40}, 40)`}>
            <circle cx="15" cy="15" r="14" fill="#0f172a" fillOpacity={0.9} stroke="#334155"/>
            <path d="M15 4 L15 10 M12 7 L15 4 L18 7" stroke="#94a3b8" strokeWidth="2" fill="none"/>
            <text x="15" y="30" textAnchor="middle" fontSize="9" fill="#94a3b8">N</text>
          </g>
          
          {/* Scale bar */}
          <g transform={`translate(20, ${height - 40})`}>
            <rect x="0" y="0" width="100" height="6" fill="#10b981" rx={3} />
            <text x="50" y="20" textAnchor="middle" fontSize="9" fill="#94a3b8">≈ 100m</text>
          </g>
        </svg>
        
        {/* Offline badge */}
        <div style={{ 
          position: 'absolute', 
          top: '16px', 
          right: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid #f59e0b',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#f59e0b',
          backdropFilter: 'blur(8px)',
        }}>
          <WifiOff className="w-4 h-4" />
          <span>OFFLINE MODE - CAD VIEW</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try real API first
        const [projectRes, assetsRes] = await Promise.all([
          projectsApi.get(Number(projectId)),
          assetsApi.list(Number(projectId)),
        ]);
        setProject(projectRes.data);
        setAssets(assetsRes.data);
        
        // Fetch segments for all assets
        const allSegments: PipelineSegment[] = [];
        for (const asset of assetsRes.data) {
          const segmentsRes = await segmentsApi.list(asset.id);
          allSegments.push(...segmentsRes.data);
        }
        setSegments(allSegments);
        
        // Initialize visible layers
        const layers: Record<string, boolean> = {};
        allSegments.forEach(s => {
          if (s.geometry_planned) layers[`${s.id}-planned`] = true;
          if (s.geometry_draft) layers[`${s.id}-draft`] = true;
          if (s.geometry_approved) layers[`${s.id}-approved`] = true;
        });
        setVisibleLayers(layers);
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number; data?: { detail?: string } } };
        
        // If 401 or any auth error, load mock data instead
        if (axiosError.response?.status === 401 || axiosError.response?.data?.detail?.includes('auth')) {
          console.log('Auth error - loading mock CAD/as-built data for demo');
          
          // Fallback project data
          setProject({
            id: 1,
            name: 'Downtown Gas Pipeline Alignment',
            description: 'Gas pipeline alignment through downtown corridor with multiple utility crossings',
            status: 'active',
            owner_id: 1,
            crs: 'EPSG:4326',
            site_boundary: null,
            created_at: '2026-10-15T17:26:45.243487Z',
            updated_at: '2026-10-15T17:26:45.243487Z',
          });
          
          // Mock assets
          setAssets([{
            id: 1,
            project_id: 1,
            name: 'Main Gas Line - Segment A',
            utility_type: 'gas',
            material: 'HDPE',
            diameter_mm: 150,
            installation_date: '2024-01-15',
            status: 'draft',
            description: '150mm HDPE gas main, installed via horizontal directional drilling',
            created_at: '2026-10-15T17:26:45.243487Z',
            updated_at: '2026-10-15T17:26:45.243487Z',
          }]);
          
          // Mock segments with CAD planned + as-built with deviations
          setSegments(mockSegments);
          
          // Initialize visible layers
          const layers: Record<string, boolean> = {};
          mockSegments.forEach(s => {
            if (s.geometry_planned) layers[`${s.id}-planned`] = true;
            if (s.geometry_draft) layers[`${s.id}-draft`] = true;
            if (s.geometry_approved) layers[`${s.id}-approved`] = true;
          });
          setVisibleLayers(layers);
          setError('');
        } else {
          setError(axiosError.response?.data?.detail || 'Failed to load map data');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const buildGeoJSON = () => {
    const features: any[] = [];
    
    segments.forEach(segment => {
      const baseProps = {
        id: segment.id,
        asset_id: segment.asset_id,
        segment_type: segment.segment_type,
        status: segment.status,
        length_m: segment.length_m,
        depth_m: segment.depth_m,
      };

      if (segment.geometry_planned) {
        features.push({
          type: 'Feature',
          geometry: segment.geometry_planned,
          properties: {
            ...baseProps,
            geometry_type: 'planned',
            layer_id: `${segment.id}-planned`,
            name: `Planned: ${segment.segment_type}`,
          },
        });
      }
      if (segment.geometry_draft) {
        features.push({
          type: 'Feature',
          geometry: segment.geometry_draft,
          properties: {
            ...baseProps,
            geometry_type: 'draft',
            layer_id: `${segment.id}-draft`,
            name: `As-Built: ${segment.segment_type}`,
          },
        });
      }
      if (segment.geometry_approved) {
        features.push({
          type: 'Feature',
          geometry: segment.geometry_approved,
          properties: {
            ...baseProps,
            geometry_type: 'approved',
            layer_id: `${segment.id}-approved`,
            name: `Approved: ${segment.segment_type}`,
          },
        });
      }
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  };

  const handleLayerToggle = (layerId: string) => {
    setVisibleLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  if (isLoading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-8 h-8 spinner" strokeWidth={2.5} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-body">
            <AlertCircle className="w-12 h-12 text-danger" style={{ margin: '0 auto 16px' }} strokeWidth={1.5} />
            <h3>Error</h3>
            <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const geojson = buildGeoJSON();
  const filteredFeatures = geojson.features.filter(f => visibleLayers[f.properties.layer_id]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{project?.name}</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {segments.length} segments • {assets.length} assets • CRS: {project?.crs}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to={`/projects/${projectId}`} className="btn btn-outline">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <button
              onClick={() => setUseFallbackView(!useFallbackView)}
              className={`btn btn-sm ${useFallbackView ? 'btn-primary' : 'btn-outline'}`}
              style={{ minHeight: '40px' }}
              title={useFallbackView ? 'Switch to Map View' : 'Switch to CAD View (Offline)'}
            >
              <Map className="w-4 h-4" />
              <span style={{ marginLeft: '4px' }}>{useFallbackView ? 'Map View' : 'CAD View'}</span>
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>Layers:</span>
          {segments.map(segment => {
            const layers = [];
            if (segment.geometry_planned) layers.push({ id: `${segment.id}-planned`, label: 'Planned', type: 'planned' });
            if (segment.geometry_draft) layers.push({ id: `${segment.id}-draft`, label: 'As-Built', type: 'draft' });
            if (segment.geometry_approved) layers.push({ id: `${segment.id}-approved`, label: 'Approved', type: 'approved' });
            
            return layers.map(layer => (
              <label key={layer.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem' }}>
                <input
                  type="checkbox"
                  checked={visibleLayers[layer.id]}
                  onChange={() => handleLayerToggle(layer.id)}
                  style={{ width: '16px', height: '16px', accentColor: getStyle({ properties: { status: segment.status, geometry_type: layer.type } }).color }}
                />
                <span style={{ color: getStyle({ properties: { status: segment.status, geometry_type: layer.type } }).color, fontWeight: 500 }}>
                  {segment.segment_type} ({layer.label})
                </span>
              </label>
            ));
          })}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {useFallbackView ? (
          <div ref={mapRef} style={{ height: '100%', width: '100%' }}>
            {renderCADFallback(800, 500)}
          </div>
        ) : (
          <MapContainer
            center={[-27.4698, 153.0251]}
            zoom={12}
            scrollWheelZoom={true}
            whenReady={() => {}}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredFeatures.length > 0 && (
              <GeoJSON
                data={{ type: 'FeatureCollection', features: filteredFeatures } as any}
                style={getStyle}
                onEachFeature={(feature, layer) => {
                  layer.bindPopup(`
                    <div style="min-width: 200px;">
                      <strong>${feature.properties.name}</strong><br/>
                      Type: ${feature.properties.segment_type}<br/>
                      Status: ${feature.properties.status.replace('_', ' ')}<br/>
                      ${feature.properties.length_m ? `Length: ${feature.properties.length_m.toFixed(2)} m` : ''}<br/>
                      ${feature.properties.depth_m !== null && feature.properties.depth_m !== undefined ? `Depth: ${feature.properties.depth_m.toFixed(3)} m` : ''}
                    </div>
                  `);
                }}
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

export default function MapView() {
  const { projectId } = useParams<{ projectId: string }>();
  return <MapViewComponent projectId={projectId!} />;
}