#!/usr/bin/env python3
"""
GeoTrace GIS - workspace generator (run once).

Creates, in the folder where you run it:
  geotrace_workspace/
    flutter_app/       Flutter capture app (camera, GNSS, offline queue, AR overlay)
    react_dashboard/   React + MapLibre review dashboard (Vite)
    fix_arcore.py      helper to run after `flutter pub get`

Usage:  python generate_geotrace_workspace.py
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path.cwd() / "geotrace_workspace"
FLUTTER = ROOT / "flutter_app"
REACT = ROOT / "react_dashboard"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.lstrip("\n"), encoding="utf-8", newline="\n")
    print(f"  wrote {path.relative_to(ROOT)}")


# ---------------------------------------------------------------------------
# REACT DASHBOARD FILES
# ---------------------------------------------------------------------------
REACT_FILES = {}

REACT_FILES["package.json"] = r"""
{
  "name": "geotrace-dashboard",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "maplibre-gl": "^4.7.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
"""

REACT_FILES["vite.config.js"] = r"""
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
"""

REACT_FILES["index.html"] = r"""
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GeoTrace GIS - Review Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"""

REACT_FILES[".gitignore"] = r"""
node_modules
dist
.env
.env.local
*.log
.DS_Store
"""

REACT_FILES["src/main.jsx"] = r"""
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
"""

REACT_FILES["src/index.css"] = r"""
html, body, #root { margin: 0; height: 100%; }
button:disabled { opacity: 0.4; cursor: not-allowed; }
"""

REACT_FILES["src/sampleData.js"] = r"""
// All coordinates are [longitude, latitude]. This is MOCK data, not a real site.
// The actual route detours about 6 m east around a boulder.

export const record = {
  id: 'REC-0001',
  utility: 'Water',
  site: 'Sample site (mock data)',
  plannedDepthM: 1.2,
  actualDepthM: 1.6,
  maxDeviationM: 6.0,
};

export const routeData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { kind: 'planned' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.87, 26.4],
          [75.87, 26.4004],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'actual' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.87, 26.4],
          [75.87, 26.40015],
          [75.87006, 26.4002],
          [75.87, 26.40025],
          [75.87, 26.4004],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'deviation' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [75.87, 26.40015],
          [75.87006, 26.4002],
          [75.87, 26.40025],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { kind: 'survey', label: 'S1' },
      geometry: { type: 'Point', coordinates: [75.87, 26.40015] },
    },
    {
      type: 'Feature',
      properties: { kind: 'survey', label: 'S2' },
      geometry: { type: 'Point', coordinates: [75.87006, 26.4002] },
    },
    {
      type: 'Feature',
      properties: { kind: 'survey', label: 'S3' },
      geometry: { type: 'Point', coordinates: [75.87, 26.40025] },
    },
  ],
};
"""

REACT_FILES["src/DeviationMap.jsx"] = r"""
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const style = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const kind = (k) => ['==', ['get', 'kind'], k];

export default function DeviationMap({ data }) {
  const container = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: container.current,
      style,
      center: [75.87003, 26.4002],
      zoom: 18.5,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      map.addSource('route', { type: 'geojson', data });

      map.addLayer({
        id: 'planned',
        type: 'line',
        source: 'route',
        filter: kind('planned'),
        paint: { 'line-color': '#22d3ee', 'line-width': 4, 'line-dasharray': [2, 2] },
      });
      map.addLayer({
        id: 'actual',
        type: 'line',
        source: 'route',
        filter: kind('actual'),
        paint: { 'line-color': '#2563eb', 'line-width': 4 },
      });
      map.addLayer({
        id: 'deviation',
        type: 'line',
        source: 'route',
        filter: kind('deviation'),
        paint: { 'line-color': '#ef4444', 'line-width': 7, 'line-opacity': 0.8 },
      });
      map.addLayer({
        id: 'survey',
        type: 'circle',
        source: 'route',
        filter: kind('survey'),
        paint: {
          'circle-radius': 6,
          'circle-color': '#fb923c',
          'circle-stroke-color': '#0b2342',
          'circle-stroke-width': 2,
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false });
      map.on('mouseenter', 'survey', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        popup
          .setLngLat(e.features[0].geometry.coordinates)
          .setText('Survey point ' + e.features[0].properties.label)
          .addTo(map);
      });
      map.on('mouseleave', 'survey', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
    });

    return () => map.remove();
  }, [data]);

  return <div ref={container} style={{ width: '100%', height: '100%' }} />;
}
"""

REACT_FILES["src/App.jsx"] = r"""
import { useState } from 'react';
import DeviationMap from './DeviationMap.jsx';
import { record, routeData } from './sampleData.js';

const STATUS = {
  pending_review: { label: 'Pending review', color: '#f59e0b' },
  approved: { label: 'Approved', color: '#16a34a' },
  rejected: { label: 'Rejected', color: '#dc2626' },
  needs_evidence: { label: 'More evidence requested', color: '#2563eb' },
};

// Change this to your teammate's backend address when it is ready.
const API_BASE = 'http://localhost:8000';
const USE_BACKEND = false; // set to true once the review endpoint exists

const btn = (bg) => ({
  background: bg,
  color: '#fff',
  border: 0,
  padding: '10px 12px',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer',
});

export default function App() {
  const [status, setStatus] = useState('pending_review');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState([
    { at: new Date().toISOString(), msg: 'Record submitted by field crew (mock)' },
  ]);

  const locked = status === 'approved' || status === 'rejected';

  const addLog = (msg) =>
    setLog((l) => [{ at: new Date().toISOString(), msg }, ...l]);

  const decide = async (next) => {
    setError('');
    if ((next === 'rejected' || next === 'needs_evidence') && !comment.trim()) {
      setError('Please add a comment explaining this decision.');
      return;
    }
    setSaving(true);
    try {
      if (USE_BACKEND) {
        const res = await fetch(API_BASE + '/api/v1/records/' + record.id + '/review', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next, comment }),
        });
        if (!res.ok) throw new Error('Server answered ' + res.status);
      }
      setStatus(next);
      addLog(STATUS[next].label + (comment ? ': ' + comment : ''));
      setComment('');
    } catch (e) {
      setError('Could not save decision: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const reopen = () => {
    setStatus('pending_review');
    addLog('Reopened for review');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <aside
        style={{
          width: 340,
          padding: 16,
          overflowY: 'auto',
          background: '#0b2342',
          color: '#fff',
          boxSizing: 'border-box',
        }}
      >
        <h2 style={{ marginTop: 0 }}>GeoTrace review</h2>
        <p style={{ opacity: 0.7, marginTop: -8 }}>Sample data, not a real record</p>

        <div style={{ marginBottom: 12, lineHeight: 1.6 }}>
          <div>
            <b>{record.id}</b> · {record.utility}
          </div>
          <div>{record.site}</div>
          <div>Planned depth: {record.plannedDepthM} m</div>
          <div>Actual depth: {record.actualDepthM} m</div>
          <div>Max deviation: {record.maxDeviationM} m</div>
        </div>

        <span
          style={{
            background: STATUS[status].color,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {STATUS[status].label}
        </span>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Reviewer comment (required for reject / more evidence)"
          disabled={locked}
          rows={3}
          style={{ width: '100%', marginTop: 14, boxSizing: 'border-box' }}
        />

        {error && <div style={{ color: '#fca5a5', marginTop: 8, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          <button disabled={locked || saving} onClick={() => decide('approved')} style={btn('#16a34a')}>
            Approve
          </button>
          <button disabled={locked || saving} onClick={() => decide('needs_evidence')} style={btn('#2563eb')}>
            Request more evidence
          </button>
          <button disabled={locked || saving} onClick={() => decide('rejected')} style={btn('#dc2626')}>
            Reject
          </button>
          {locked && (
            <button onClick={reopen} style={btn('#475569')}>
              Reopen
            </button>
          )}
        </div>

        <h3>Audit log</h3>
        <ul style={{ paddingLeft: 16, fontSize: 13 }}>
          {log.map((e, i) => (
            <li key={i}>
              <span style={{ opacity: 0.6 }}>{e.at.slice(11, 19)}</span> {e.msg}
            </li>
          ))}
        </ul>

        <h3>Legend</h3>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          <div><span style={{ color: '#22d3ee' }}>- - Planned (CAD)</span></div>
          <div><span style={{ color: '#60a5fa' }}>━━ Actual (as built)</span></div>
          <div><span style={{ color: '#f87171' }}>━━ Deviation</span></div>
          <div><span style={{ color: '#fb923c' }}>● Survey point</span></div>
        </div>
      </aside>

      <main style={{ flex: 1 }}>
        <DeviationMap data={routeData} />
      </main>
    </div>
  );
}
"""

# ---------------------------------------------------------------------------
# FLUTTER FILES
# ---------------------------------------------------------------------------
FLUTTER_FILES = {}

FLUTTER_FILES["pubspec.yaml"] = r"""
name: geotrace_capture
description: GeoTrace GIS field capture app with GNSS, offline queue and AR overlay prototype.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  camera: ^0.10.5+9
  geolocator: ^12.0.0
  path_provider: ^2.1.3
  path: ^1.9.0
  sqflite: ^2.3.3
  connectivity_plus: ^6.0.3
  http: ^1.2.1
  uuid: ^4.4.0
  crypto: ^3.0.3
  arcore_flutter_plugin: ^0.1.0
  vector_math: ^2.1.4

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
"""

FLUTTER_FILES["lib/main.dart"] = r"""
import 'package:flutter/material.dart';
import 'screens/ar_screen.dart';
import 'screens/capture_screen.dart';
import 'services/sync_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SyncService.start();
  runApp(const GeoTraceApp());
}

class GeoTraceApp extends StatelessWidget {
  const GeoTraceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GeoTrace GIS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF0B2342),
        useMaterial3: true,
      ),
      home: const HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Only the selected tab is built, so camera and AR never run together.
      body: _index == 0 ? const CaptureScreen() : const ArScreen(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.videocam), label: 'Capture'),
          NavigationDestination(icon: Icon(Icons.view_in_ar), label: 'AR view'),
        ],
      ),
    );
  }
}
"""

FLUTTER_FILES["lib/db/queue_db.dart"] = r"""
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

/// Local SQLite queue. Every captured clip is stored here first,
/// then uploaded whenever the network is available.
class QueueDb {
  static Database? _db;

  static Future<Database> get _database async {
    _db ??= await openDatabase(
      p.join(await getDatabasesPath(), 'geotrace_queue.db'),
      version: 1,
      onCreate: (db, version) => db.execute(
        'CREATE TABLE queue('
        'id TEXT PRIMARY KEY, '
        'video_path TEXT NOT NULL, '
        'sha256 TEXT NOT NULL, '
        'track TEXT NOT NULL, '
        'captured_at TEXT NOT NULL, '
        'status TEXT NOT NULL, '
        'attempts INTEGER NOT NULL DEFAULT 0)',
      ),
    );
    return _db!;
  }

  static Future<void> insert(Map<String, Object?> row) async {
    final db = await _database;
    await db.insert('queue', row);
  }

  static Future<List<Map<String, Object?>>> pending() async {
    final db = await _database;
    return db.query('queue', where: "status = 'pending'", orderBy: 'captured_at');
  }

  static Future<int> pendingCount() async {
    final rows = await pending();
    return rows.length;
  }

  static Future<void> markUploaded(String id) async {
    final db = await _database;
    await db.update('queue', {'status': 'uploaded'}, where: 'id = ?', whereArgs: [id]);
  }

  static Future<void> bumpAttempts(String id) async {
    final db = await _database;
    await db.rawUpdate('UPDATE queue SET attempts = attempts + 1 WHERE id = ?', [id]);
  }
}
"""

FLUTTER_FILES["lib/services/sync_service.dart"] = r"""
import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import '../db/queue_db.dart';

/// Uploads queued evidence when the phone is online.
///
/// baseUrl:
///   Android emulator -> http://10.0.2.2:8000   (this is your laptop)
///   Real phone       -> http://<your-laptop-LAN-IP>:8000  e.g. http://192.168.1.10:8000
/// If the backend is not running, clips simply stay in the queue.
class SyncService {
  static const String baseUrl = 'http://10.0.2.2:8000';
  static const String evidencePath = '/api/v1/evidence';

  static bool _busy = false;
  static StreamSubscription<List<ConnectivityResult>>? _sub;

  static void start() {
    flush();
    _sub ??= Connectivity().onConnectivityChanged.listen((results) {
      if (!results.contains(ConnectivityResult.none)) {
        flush();
      }
    });
  }

  /// Tries to upload every pending clip. Returns how many succeeded.
  static Future<int> flush() async {
    if (_busy) return 0;
    _busy = true;
    var uploaded = 0;
    try {
      final rows = await QueueDb.pending();
      for (final row in rows) {
        final id = row['id'] as String;
        final file = File(row['video_path'] as String);
        if (!await file.exists()) continue;
        try {
          final request = http.MultipartRequest('POST', Uri.parse('$baseUrl$evidencePath'))
            ..fields['id'] = id
            ..fields['sha256'] = row['sha256'] as String
            ..fields['captured_at'] = row['captured_at'] as String
            ..fields['track'] = row['track'] as String
            ..files.add(await http.MultipartFile.fromPath('video', file.path));
          final response = await request.send().timeout(const Duration(seconds: 60));
          if (response.statusCode == 200 || response.statusCode == 201) {
            await QueueDb.markUploaded(id);
            uploaded++;
          } else {
            await QueueDb.bumpAttempts(id);
          }
        } catch (_) {
          // Offline or server down: the clip stays queued.
          await QueueDb.bumpAttempts(id);
        }
      }
    } finally {
      _busy = false;
    }
    return uploaded;
  }
}
"""

FLUTTER_FILES["lib/screens/capture_screen.dart"] = r"""
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:camera/camera.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';
import '../db/queue_db.dart';
import '../services/sync_service.dart';

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> {
  CameraController? _cam;
  StreamSubscription<Position>? _posSub;
  Position? _last;
  final List<Map<String, dynamic>> _track = [];
  bool _recording = false;
  int _pending = 0;
  String? _error;
  String _syncMsg = '';

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        throw 'Location permission denied. Enable it in phone Settings > Apps > GeoTrace.';
      }
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw 'Please turn on the phone GPS (Location).';
      }

      final cameras = await availableCameras();
      if (cameras.isEmpty) throw 'No camera found on this device.';
      final controller = CameraController(cameras.first, ResolutionPreset.high, enableAudio: false);
      await controller.initialize();

      _posSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          distanceFilter: 1,
        ),
      ).listen((pos) {
        _last = pos;
        if (_recording) _addPoint(pos);
        if (mounted) setState(() {});
      });

      await _refreshPending();
      if (mounted) {
        setState(() => _cam = controller);
      } else {
        await controller.dispose();
      }
    } catch (e) {
      if (mounted) setState(() => _error = '$e');
    }
  }

  void _addPoint(Position pos) {
    _track.add({
      'lat': pos.latitude,
      'lng': pos.longitude,
      'alt': pos.altitude,
      'acc_m': pos.accuracy,
      't': DateTime.now().toUtc().toIso8601String(),
    });
  }

  Future<void> _refreshPending() async {
    final n = await QueueDb.pendingCount();
    if (mounted) setState(() => _pending = n);
  }

  Future<void> _toggleRecord() async {
    final cam = _cam;
    if (cam == null) return;
    try {
      if (!_recording) {
        _track.clear();
        if (_last != null) _addPoint(_last!);
        await cam.startVideoRecording();
        setState(() => _recording = true);
        return;
      }

      final xfile = await cam.stopVideoRecording();
      setState(() => _recording = false);

      final dir = await getApplicationDocumentsDirectory();
      final id = const Uuid().v4();
      final dest = p.join(dir.path, 'evidence_$id.mp4');
      await File(xfile.path).copy(dest);
      final digest = await sha256.bind(File(dest).openRead()).first;

      await QueueDb.insert({
        'id': id,
        'video_path': dest,
        'sha256': digest.toString(),
        'track': jsonEncode(_track),
        'captured_at': DateTime.now().toUtc().toIso8601String(),
        'status': 'pending',
      });
      await _refreshPending();
      _syncNow();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _syncNow() async {
    setState(() => _syncMsg = 'Syncing...');
    final n = await SyncService.flush();
    await _refreshPending();
    if (mounted) {
      setState(() => _syncMsg = n > 0 ? 'Uploaded $n' : 'Queued (offline or server down)');
    }
  }

  @override
  void dispose() {
    _posSub?.cancel();
    _cam?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(_error!, textAlign: TextAlign.center),
        ),
      );
    }
    final cam = _cam;
    if (cam == null || !cam.value.isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }
    final pos = _last;
    return Stack(
      fit: StackFit.expand,
      children: [
        CameraPreview(cam),
        Positioned(
          top: 40,
          left: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.all(10),
            color: Colors.black54,
            child: Text(
              pos == null
                  ? 'Waiting for GNSS fix...'
                  : 'Lat ${pos.latitude.toStringAsFixed(6)}  Lng ${pos.longitude.toStringAsFixed(6)}\n'
                      'Accuracy ±${pos.accuracy.toStringAsFixed(1)} m   Track pts: ${_track.length}\n'
                      'Queue: $_pending pending   $_syncMsg',
              style: const TextStyle(color: Colors.white, fontFamily: 'monospace'),
            ),
          ),
        ),
        Positioned(
          bottom: 30,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              FloatingActionButton(
                heroTag: 'sync',
                onPressed: _syncNow,
                child: const Icon(Icons.sync),
              ),
              FloatingActionButton.large(
                heroTag: 'rec',
                backgroundColor: _recording ? Colors.red : Colors.white,
                onPressed: _toggleRecord,
                child: Icon(
                  _recording ? Icons.stop : Icons.fiber_manual_record,
                  color: _recording ? Colors.white : Colors.red,
                  size: 40,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
"""

FLUTTER_FILES["lib/screens/ar_screen.dart"] = r"""
import 'dart:io';
import 'dart:math' as math;
import 'package:arcore_flutter_plugin/arcore_flutter_plugin.dart';
import 'package:flutter/material.dart';
import 'package:vector_math/vector_math_64.dart' as v;

const String kArWarning =
    'AR shows STORED RECORDS ONLY. It does NOT detect buried pipes.\n'
    'VERIFY BEFORE DIGGING: contact the utility owner, confirm with a licensed '
    'surveyor, and hand-dig or pothole to expose the line first.';

class ArScreen extends StatefulWidget {
  const ArScreen({super.key});

  @override
  State<ArScreen> createState() => _ArScreenState();
}

class _ArScreenState extends State<ArScreen> {
  ArCoreController? _ctrl;

  // MOCK stored record: hardcoded [lat, lng] vertices of a water pipe.
  static const List<List<double>> _pipeLatLng = [
    [26.40000, 75.87000],
    [26.40002, 75.87000],
    [26.40004, 75.87002],
    [26.40006, 75.87002],
  ];
  static const double _depthM = -1.2; // sample depth below the phone
  static const double _aheadM = 1.5; // pipe starts 1.5 m in front of the phone
  static const double _radiusM = 0.06;

  /// Converts lat/lng to local meters relative to the first vertex.
  /// The prototype anchors the pipe to the phone's start pose (no compass
  /// alignment). Real geo-anchoring is a later phase.
  List<v.Vector3> _toLocalMeters() {
    final lat0 = _pipeLatLng.first[0];
    final lng0 = _pipeLatLng.first[1];
    const mPerLat = 111320.0;
    final mPerLng = 111320.0 * math.cos(lat0 * math.pi / 180);
    return _pipeLatLng.map((pt) {
      final east = (pt[1] - lng0) * mPerLng;
      final north = (pt[0] - lat0) * mPerLat;
      return v.Vector3(east, _depthM, -(north + _aheadM)); // -Z is forward in AR space
    }).toList();
  }

  void _onCreated(ArCoreController controller) {
    _ctrl = controller;
    final pts = _toLocalMeters();
    final pipeMat = ArCoreMaterial(color: const Color(0xFF3B82F6));
    final jointMat = ArCoreMaterial(color: const Color(0xFFFF8A2B));

    for (var i = 0; i < pts.length - 1; i++) {
      final a = pts[i];
      final b = pts[i + 1];
      final dir = b - a;
      final len = dir.length;
      final mid = (a + b) * 0.5;
      final q = v.Quaternion.fromTwoVectors(v.Vector3(0, 1, 0), dir.normalized());
      controller.addArCoreNode(ArCoreNode(
        shape: ArCoreCylinder(materials: [pipeMat], radius: _radiusM, height: len),
        position: mid,
        rotation: v.Vector4(q.x, q.y, q.z, q.w),
      ));
    }
    for (final pt in pts) {
      controller.addArCoreNode(ArCoreNode(
        shape: ArCoreSphere(materials: [jointMat], radius: _radiusM * 1.6),
        position: pt,
      ));
    }
  }

  @override
  void dispose() {
    _ctrl?.dispose();
    super.dispose();
  }

  Widget _warningBox() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFF8A2B),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const Text(
        kArWarning,
        style: TextStyle(
          color: Color(0xFF0B2342),
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // ARCore plugin is Android-only. On other platforms show the guardrail only.
    if (!Platform.isAndroid) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('AR preview is Android-only in this build (ARKit comes later).',
                  textAlign: TextAlign.center),
              const SizedBox(height: 16),
              _warningBox(),
            ],
          ),
        ),
      );
    }

    return Stack(
      children: [
        ArCoreView(onArCoreViewCreated: _onCreated, enableTapRecognizer: false),
        Positioned(
          top: 40,
          left: 12,
          right: 12,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0B2342),
              border: Border.all(color: const Color(0xFFFF8A2B), width: 2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Water pipe',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                Text('Stored record (mock data)', style: TextStyle(color: Color(0xFF4DD6E3))),
                Text('Depth: sample data', style: TextStyle(color: Colors.white)),
              ],
            ),
          ),
        ),
        // Guardrail: always visible, cannot be dismissed.
        Positioned(bottom: 12, left: 12, right: 12, child: _warningBox()),
      ],
    );
  }
}
"""

# ---------------------------------------------------------------------------
# ARCore plugin fix helper (written to geotrace_workspace/fix_arcore.py)
# ---------------------------------------------------------------------------
FIX_ARCORE = r"""
#!/usr/bin/env python3
# Patches the old arcore_flutter_plugin so it builds with modern Android Gradle.
# Run AFTER `flutter pub get`. Safe to run more than once.
import glob
import os
import re
import sys

candidates = []
if os.environ.get("PUB_CACHE"):
    candidates.append(os.environ["PUB_CACHE"])
if os.environ.get("LOCALAPPDATA"):
    candidates.append(os.path.join(os.environ["LOCALAPPDATA"], "Pub", "Cache"))
candidates.append(os.path.expanduser("~/.pub-cache"))

found = []
for base in candidates:
    found += glob.glob(os.path.join(base, "hosted", "pub.dev", "arcore_flutter_plugin-*", "android"))

if not found:
    print("arcore_flutter_plugin not found. Run `flutter pub get` inside flutter_app first.")
    sys.exit(1)

NS = "com.difrancescogianmarco.arcore_flutter_plugin"

for android_dir in found:
    gradle = os.path.join(android_dir, "build.gradle")
    text = open(gradle, encoding="utf-8").read()
    if "namespace" not in text:
        text = text.replace(
            "android {",
            "android {\n    namespace '" + NS + "'",
            1,
        )
    if "kotlinOptions" not in text:
        text = text.replace(
            "android {",
            "android {\n    kotlinOptions { jvmTarget = '1.8' }",
            1,
        )
    text = re.sub(r"compileSdkVersion\s+\d+", "compileSdkVersion 34", text)
    open(gradle, "w", encoding="utf-8").write(text)

    manifest = os.path.join(android_dir, "src", "main", "AndroidManifest.xml")
    if os.path.exists(manifest):
        m = open(manifest, encoding="utf-8").read()
        m = re.sub(r'\s+package="[^"]*"', "", m, count=1)
        open(manifest, "w", encoding="utf-8").write(m)
    print("Patched", android_dir)

print("Done. Now run: flutter clean  then  flutter run")
"""

# ---------------------------------------------------------------------------
# PATCH HELPERS FOR GENERATED FLUTTER PLATFORM FILES
# ---------------------------------------------------------------------------
ANDROID_PERMS = """    <uses-permission android:name="android.permission.CAMERA"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-feature android:name="android.hardware.camera.ar" android:required="false"/>
"""

ANDROID_META = """        <meta-data android:name="com.google.ar.core" android:value="optional"/>
"""

IOS_KEYS = """	<key>NSCameraUsageDescription</key>
	<string>GeoTrace records exposed pipes as evidence.</string>
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>GeoTrace logs the GNSS position of captured evidence.</string>
"""


def patch_android() -> None:
    manifest = FLUTTER / "android/app/src/main/AndroidManifest.xml"
    if manifest.exists():
        t = manifest.read_text(encoding="utf-8")
        if "android.permission.CAMERA" not in t:
            t = t.replace("<application", ANDROID_PERMS + "    <application", 1)
            t = t.replace("<application", '<application android:usesCleartextTraffic="true"', 1)
            t = t.replace("</application>", ANDROID_META + "    </application>", 1)
            manifest.write_text(t, encoding="utf-8", newline="\n")
        print("  patched AndroidManifest.xml")
    else:
        print("  WARNING: AndroidManifest.xml not found")

    patched = False
    for name in ("build.gradle.kts", "build.gradle"):
        gradle = FLUTTER / "android/app" / name
        if gradle.exists():
            t = gradle.read_text(encoding="utf-8")
            new = re.sub(r"minSdk(?:Version)?\s*=?\s*flutter\.minSdkVersion", "minSdk = 24", t)
            if new != t:
                gradle.write_text(new, encoding="utf-8", newline="\n")
                patched = True
                print(f"  patched {name} (minSdk = 24)")
    if not patched:
        print("  WARNING: could not set minSdk automatically. Open android/app/build.gradle(.kts)")
        print("           and change the minSdk line to: minSdk = 24")


def patch_ios() -> None:
    plist = FLUTTER / "ios/Runner/Info.plist"
    if plist.exists():
        t = plist.read_text(encoding="utf-8")
        if "NSCameraUsageDescription" not in t:
            idx = t.rfind("</dict>")
            t = t[:idx] + IOS_KEYS + t[idx:]
            plist.write_text(t, encoding="utf-8", newline="\n")
        print("  patched Info.plist")


def main() -> None:
    print("GeoTrace workspace generator")
    print("Target folder:", ROOT)
    ROOT.mkdir(exist_ok=True)

    print("\n[1/3] React dashboard files")
    for rel, content in REACT_FILES.items():
        write(REACT / rel, content)

    print("\n[2/3] Flutter project")
    if shutil.which("flutter") is None:
        print("ERROR: 'flutter' command not found. Finish Step Zero (add Flutter to PATH),")
        print("       close and reopen VS Code, then run this script again.")
        sys.exit(1)
    if not (FLUTTER / "pubspec.yaml").exists():
        print("  running flutter create (takes a minute)...")
        result = subprocess.run(
            "flutter create --org com.geotrace --project-name geotrace_capture "
            "--platforms android,ios flutter_app",
            cwd=ROOT,
            shell=True,
        )
        if result.returncode != 0:
            print("ERROR: flutter create failed. Run `flutter doctor` and fix the red items.")
            sys.exit(1)
    for rel, content in FLUTTER_FILES.items():
        write(FLUTTER / rel, content)
    default_test = FLUTTER / "test/widget_test.dart"
    if default_test.exists():
        default_test.unlink()
        print("  removed default test/widget_test.dart")

    print("\n[3/3] Platform settings and helper")
    patch_android()
    patch_ios()
    write(ROOT / "fix_arcore.py", FIX_ARCORE)

    print("\nDONE. Next: follow Step 3 (run commands).")


if __name__ == "__main__":
    main()
