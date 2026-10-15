import { useState, useEffect } from 'react';
import { 
  Camera, 
  Satellite, 
  MapPin, 
  CircleDot,
  Square,
  Settings,
  AlertCircle,
  Compass,
  BatteryCharging,
  Signal,
} from 'lucide-react';

export default function Capture() {
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId] = useState(() => `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`);
  const [gnssAccuracy, setGnssAccuracy] = useState(2.4);
  const [gnssLat, setGnssLat] = useState(37.7749);
  const [gnssLng, setGnssLng] = useState(-122.4194);
  const [gnssAlt, setGnssAlt] = useState(15.2);
  const [satellites, setSatellites] = useState(12);
  const [hdop, setHdop] = useState(0.9);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<number>(0);

  useEffect(() => {
    const simulateGnss = () => {
      setGnssAccuracy(prev => Math.max(0.5, Math.min(10, prev + (Math.random() - 0.5) * 0.3)));
      setGnssLat(prev => prev + (Math.random() - 0.5) * 0.0001);
      setGnssLng(prev => prev + (Math.random() - 0.5) * 0.0001);
      setSatellites(prev => Math.max(4, Math.min(20, prev + Math.floor((Math.random() - 0.5) * 2))));
      setHdop(prev => Math.max(0.5, Math.min(3, prev + (Math.random() - 0.5) * 0.1)));
      if (isRecording) {
        setRecordingTime(prev => prev + 1);
        setCapturedFrames(prev => prev + Math.floor(Math.random() * 2) + 1);
      }
    };
    const interval = setInterval(simulateGnss, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
        .then(s => {
          setStream(s);
          setCameraPermission('granted');
          setError(null);
        })
        .catch(err => {
          setCameraPermission('denied');
          setError('Camera access denied. Please enable camera permissions.');
          console.error('Camera error:', err);
        });

      navigator.geolocation.getCurrentPosition(
        pos => {
          setGnssLat(pos.coords.latitude);
          setGnssLng(pos.coords.longitude);
          setGnssAlt(pos.coords.altitude || 0);
          setGnssAccuracy(pos.coords.accuracy);
          setLocationPermission('granted');
        },
        err => {
          setLocationPermission('denied');
          console.warn('Location error:', err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getAccuracyColor = (acc: number) => {
    if (acc <= 1) return 'var(--color-success)';
    if (acc <= 3) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const getAccuracyLabel = (acc: number) => {
    if (acc <= 1) return 'Excellent';
    if (acc <= 3) return 'Good';
    if (acc <= 5) return 'Fair';
    return 'Poor';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      background: '#000',
      position: 'relative',
    }}>
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 1,
        background: '#000',
      }}>
        {stream ? (
          <video 
            ref={(el) => { if (el && stream) el.srcObject = stream; }} 
            autoPlay 
            playsInline 
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '16px',
            color: 'white',
          }}>
            <Camera className="w-16 h-16" strokeWidth={1.5} style={{ opacity: 0.5 }} />
            <p style={{ fontSize: '1.125rem' }}>Camera preview will appear here when recording starts</p>
            {error && <p style={{ color: 'var(--color-danger)', textAlign: 'center', padding: '0 24px' }}>{error}</p>}
          </div>
        )}
      </div>

      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10,
        padding: '12px 16px 8px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          maxWidth: '1200px', 
          margin: '0 auto',
          pointerEvents: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              background: 'rgba(0,0,0,0.7)', 
              padding: '6px 12px', 
              borderRadius: '9999px', 
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              fontWeight: 600,
              letterSpacing: '0.05em',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {sessionId}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: isRecording ? 'var(--color-danger)' : 'var(--color-success)',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none',
              }} />
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                {isRecording ? 'RECORDING' : 'STANDBY'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(0,0,0,0.7)', 
              padding: '6px 10px', 
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <BatteryCharging className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>87%</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'rgba(0,0,0,0.7)', 
              padding: '6px 10px', 
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <Signal className="w-4 h-4" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{satellites} SAT</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        position: 'fixed', 
        top: '60px', 
        left: '16px', 
        right: '16px', 
        zIndex: 10,
        pointerEvents: 'none',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '8px',
          pointerEvents: 'auto',
        }}>
          <div style={{ 
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(8px)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px', 
            padding: '12px',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.625rem', 
              color: 'rgba(255,255,255,0.6)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>
              <Satellite className="w-3 h-3" />
              GNSS ACCURACY
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'baseline', 
              gap: '4px',
            }}>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                fontVariantNumeric: 'tabular-nums',
                color: getAccuracyColor(gnssAccuracy),
              }}>
                ±{gnssAccuracy.toFixed(1)}m
              </span>
              <span style={{ 
                fontSize: '0.7rem', 
                color: getAccuracyColor(gnssAccuracy),
                fontWeight: 500,
                background: `${getAccuracyColor(gnssAccuracy)}20`,
                padding: '2px 6px',
                borderRadius: '9999px',
              }}>
                {getAccuracyLabel(gnssAccuracy)}
              </span>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(8px)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px', 
            padding: '12px',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.625rem', 
              color: 'rgba(255,255,255,0.6)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>
              <MapPin className="w-3 h-3" />
              POSITION
            </div>
            <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: 1.6 }}>
              <div>Lat: <span style={{ fontWeight: 600 }}>{gnssLat.toFixed(6)}</span></div>
              <div>Lng: <span style={{ fontWeight: 600 }}>{gnssLng.toFixed(6)}</span></div>
              <div>Alt: <span style={{ fontWeight: 600 }}>{gnssAlt.toFixed(1)}m</span></div>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(8px)', 
            border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px', 
            padding: '12px',
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.625rem', 
              color: 'rgba(255,255,255,0.6)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em',
              marginBottom: '4px',
            }}>
              <Compass className="w-3 h-3" />
              QUALITY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.7rem', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>HDOP</span>
                <span style={{ fontWeight: 600, color: hdop < 1.5 ? 'var(--color-success)' : hdop < 2.5 ? 'var(--color-warning)' : 'var(--color-danger)' }}>{hdop.toFixed(1)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>SATS</span>
                <span style={{ fontWeight: 600 }}>{satellites}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>FRAMES</span>
                <span style={{ fontWeight: 600 }}>{capturedFrames}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 20,
        padding: '16px',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px', 
          alignItems: 'center',
          pointerEvents: 'auto',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '24px',
          }}>
            <button
              onClick={() => setIsRecording(!isRecording)}
              disabled={cameraPermission === 'denied' || locationPermission === 'denied'}
              style={{
                width: isRecording ? '80px' : '80px',
                height: isRecording ? '80px' : '80px',
                borderRadius: '50%',
                border: '4px solid white',
                background: isRecording ? 'var(--color-danger)' : 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: cameraPermission === 'denied' || locationPermission === 'denied' ? 'not-allowed' : 'pointer',
                opacity: cameraPermission === 'denied' || locationPermission === 'denied' ? 0.5 : 1,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                <Square className="w-12 h-12" style={{ color: 'white' }} />
              ) : (
                <CircleDot className="w-12 h-12" style={{ color: 'white' }} />
              )}
            </button>

            {!isRecording && (
              <button
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                aria-label="Settings"
              >
                <Settings className="w-6 h-6" style={{ color: 'white' }} />
              </button>
            )}
          </div>

          {isRecording && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'rgba(0,0,0,0.7)', 
              backdropFilter: 'blur(8px)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '9999px', 
              padding: '8px 16px',
              color: 'white',
            }}>
              <span style={{ 
                fontFamily: 'monospace', 
                fontSize: '1.25rem', 
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {formatTime(recordingTime)}
              </span>
              <span style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.6)',
              }}>
                {capturedFrames} frames
              </span>
            </div>
          )}

          {(cameraPermission === 'denied' || locationPermission === 'denied') && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: 'rgba(220,38,38,0.2)', 
              border: '1px solid var(--color-danger)', 
              borderRadius: '9999px', 
              padding: '8px 16px',
              color: 'var(--color-danger)',
              fontSize: '0.75rem',
            }}>
              <AlertCircle className="w-4 h-4" />
              <span>
                {cameraPermission === 'denied' && 'Camera permission required. '}
                {locationPermission === 'denied' && 'Location permission required. '}
                Enable in browser settings.
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}