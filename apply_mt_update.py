#!/usr/bin/env python3
"""
GeoTrace GIS - update script (pastel theme, MT-01..MT-21, 3D dashboard).

Run INSIDE the geotrace_workspace folder (the one containing flutter_app and
react_dashboard):

    python apply_mt_update.py

It OVERWRITES these files with the new versions:
  flutter_app/lib/theme.dart                     (new)
  flutter_app/lib/main.dart
  flutter_app/lib/db/queue_db.dart
  flutter_app/lib/services/sync_service.dart
  flutter_app/lib/screens/capture_screen.dart
  flutter_app/lib/screens/ar_screen.dart
  react_dashboard/src/App.jsx
  react_dashboard/src/DeviationMap.jsx
  react_dashboard/src/geo3d.js                   (new)
  react_dashboard/src/index.css
No new packages are needed.
"""
import sys
from pathlib import Path

ROOT = Path.cwd()
F = {}

# ============================================================================
# FLUTTER
# ============================================================================
F["flutter_app/lib/theme.dart"] = r"""
import 'package:flutter/material.dart';

/// One pastel palette used everywhere in the mobile app.
class Pastel {
  static const Color cream = Color(0xFFFBF8F3); // warm off-white background
  static const Color sky = Color(0xFFCFE3FA); // soft blue
  static const Color skyDeep = Color(0xFF5B8DB8);
  static const Color mint = Color(0xFFCDEEDD); // mint green
  static const Color mintDeep = Color(0xFF3F8F6B);
  static const Color peach = Color(0xFFFFE0C2);
  static const Color lavender = Color(0xFFE3DDF5);
  static const Color ink = Color(0xFF2B3A55);
  static const Color muted = Color(0xFF6B7A90);
  static const Color pipeBlue = Color(0xFF5B9BEA);
  static const Color jointOrange = Color(0xFFFF9A3C);
  static const Color warnOrange = Color(0xFFFFA24C);
  static const Color recordRed = Color(0xFFE5484D);
}

ThemeData buildPastelTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: Pastel.skyDeep,
    brightness: Brightness.light,
  ).copyWith(
    surface: Pastel.cream,
    onSurface: Pastel.ink,
    primary: Pastel.skyDeep,
    secondary: Pastel.mintDeep,
    primaryContainer: Pastel.sky,
    secondaryContainer: Pastel.mint,
    tertiaryContainer: Pastel.peach,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: Pastel.cream,
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: Pastel.mint,
      labelTextStyle: const WidgetStatePropertyAll(
        TextStyle(color: Pastel.ink, fontWeight: FontWeight.w600),
      ),
      iconTheme: const WidgetStatePropertyAll(IconThemeData(color: Pastel.ink)),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: Pastel.sky,
        foregroundColor: Pastel.ink,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
  );
}
"""

F["flutter_app/lib/main.dart"] = r"""
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/ar_screen.dart';
import 'screens/capture_screen.dart';
import 'services/sync_service.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
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
      theme: buildPastelTheme(),
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
  bool _switching = false;

  /// The camera and AR must never run together. While switching, neither
  /// screen is built, which gives the old screen time to release the camera
  /// before the new screen opens it.
  Future<void> _select(int value) async {
    if (value == _index) return;
    setState(() {
      _index = value;
      _switching = true;
    });
    await Future<void>.delayed(const Duration(milliseconds: 700));
    if (mounted) setState(() => _switching = false);
  }

  @override
  Widget build(BuildContext context) {
    final Widget body;
    if (_switching) {
      body = const Center(child: CircularProgressIndicator(color: Pastel.skyDeep));
    } else if (_index == 0) {
      body = const CaptureScreen(key: ValueKey('capture'));
    } else {
      body = const ArScreen(key: ValueKey('ar'));
    }
    return Scaffold(
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _select,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.videocam_outlined), selectedIcon: Icon(Icons.videocam), label: 'Capture'),
          NavigationDestination(icon: Icon(Icons.view_in_ar_outlined), selectedIcon: Icon(Icons.view_in_ar), label: 'AR view'),
        ],
      ),
    );
  }
}
"""

F["flutter_app/lib/db/queue_db.dart"] = r"""
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

/// Persistent local queue (SQLite). Every clip is stored here first and stays
/// until it has been uploaded, even after the app is closed.
class QueueDb {
  static Database? _db;

  /// Number of clips waiting for upload. The UI listens to this.
  static final ValueNotifier<int> pendingCount = ValueNotifier<int>(0);

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

  static Future<void> refreshCount() async {
    final db = await _database;
    final rows = await db.rawQuery("SELECT COUNT(*) AS c FROM queue WHERE status = 'pending'");
    pendingCount.value = (rows.first['c'] as int?) ?? 0;
  }

  static Future<void> insert(Map<String, Object?> row) async {
    final db = await _database;
    await db.insert('queue', row);
    await refreshCount();
  }

  static Future<List<Map<String, Object?>>> pending() async {
    final db = await _database;
    return db.query('queue', where: "status = 'pending'", orderBy: 'captured_at');
  }

  static Future<void> markUploaded(String id) async {
    final db = await _database;
    await db.update('queue', {'status': 'uploaded'}, where: 'id = ?', whereArgs: [id]);
    await refreshCount();
  }

  static Future<void> bumpAttempts(String id) async {
    final db = await _database;
    await db.rawUpdate('UPDATE queue SET attempts = attempts + 1 WHERE id = ?', [id]);
  }
}
"""

F["flutter_app/lib/services/sync_service.dart"] = r"""
import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import '../db/queue_db.dart';

/// Uploads queued evidence whenever the phone is online and the backend answers.
///
/// Backend address (set at run time, no code change needed):
///   flutter run -d <id> --dart-define=API_BASE_URL=http://192.168.1.10:8000
/// Default 10.0.2.2 is the host computer as seen from the Android emulator.
/// If the backend is down or the phone is offline, clips simply stay queued.
class SyncService {
  static const String baseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:8000');
  static const String evidencePath = '/api/v1/evidence';

  static bool _busy = false;
  static StreamSubscription<List<ConnectivityResult>>? _sub;

  static void start() {
    QueueDb.refreshCount();
    flush();
    _sub ??= Connectivity().onConnectivityChanged.listen((results) {
      if (!results.contains(ConnectivityResult.none)) {
        flush();
      }
    });
  }

  /// Quick check so a dead backend never freezes the app for a minute.
  static Future<bool> _backendReachable() async {
    try {
      final uri = Uri.parse(baseUrl);
      final port = uri.hasPort ? uri.port : (uri.scheme == 'https' ? 443 : 80);
      final socket = await Socket.connect(uri.host, port, timeout: const Duration(seconds: 3));
      socket.destroy();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Tries to upload every pending clip. Returns how many succeeded.
  /// Never throws.
  static Future<int> flush() async {
    if (_busy) return 0;
    _busy = true;
    var uploaded = 0;
    try {
      final net = await Connectivity().checkConnectivity();
      if (net.contains(ConnectivityResult.none)) return 0;
      if (!await _backendReachable()) return 0;

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
          final response = await request.send().timeout(const Duration(seconds: 120));
          if (response.statusCode == 200 || response.statusCode == 201) {
            await QueueDb.markUploaded(id);
            uploaded++;
          } else {
            await QueueDb.bumpAttempts(id);
          }
        } catch (_) {
          await QueueDb.bumpAttempts(id);
        }
      }
    } catch (_) {
      // Any unexpected problem: keep everything queued.
    } finally {
      _busy = false;
    }
    return uploaded;
  }
}
"""

F["flutter_app/lib/screens/capture_screen.dart"] = r"""
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
import '../theme.dart';

enum _Problem {
  none,
  locationDenied,
  locationBlocked,
  gpsOff,
  cameraDenied,
  cameraBlocked,
  noCamera,
  other,
}

class CaptureScreen extends StatefulWidget {
  const CaptureScreen({super.key});

  @override
  State<CaptureScreen> createState() => _CaptureScreenState();
}

class _CaptureScreenState extends State<CaptureScreen> with WidgetsBindingObserver {
  CameraController? _cam;
  StreamSubscription<Position>? _posSub;
  Timer? _trackTimer;
  Position? _last;
  final List<Map<String, dynamic>> _track = [];
  bool _recording = false;
  bool _saving = false;
  bool _starting = false;
  _Problem _problem = _Problem.none;
  String _problemText = '';
  String _syncMsg = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  /// When the user comes back from phone Settings, try again automatically.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _problem != _Problem.none && !_starting) {
      _init();
    }
  }

  void _fail(_Problem problem, String text) {
    if (!mounted) return;
    setState(() {
      _problem = problem;
      _problemText = text;
    });
  }

  Future<void> _releaseHardware() async {
    _trackTimer?.cancel();
    _trackTimer = null;
    await _posSub?.cancel();
    _posSub = null;
    final c = _cam;
    _cam = null;
    await c?.dispose();
  }

  Future<void> _init() async {
    if (_starting) return;
    _starting = true;
    try {
      await _releaseHardware();
      if (mounted) {
        setState(() {
          _problem = _Problem.none;
          _problemText = '';
        });
      }

      // 1. Location permission (the system dialog appears on first launch).
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        _fail(_Problem.locationBlocked,
            'Location permission is blocked.\n\nOpen Settings > Apps > GeoTrace > Permissions and allow Location, then come back.');
        return;
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.unableToDetermine) {
        _fail(_Problem.locationDenied,
            'Location permission was denied. GeoTrace needs it to log where the evidence was captured.\n\nTap Try again and choose Allow, or enable it in Settings > Apps > GeoTrace > Permissions.');
        return;
      }

      // 2. Device GPS switch.
      if (!await Geolocator.isLocationServiceEnabled()) {
        _fail(_Problem.gpsOff,
            'The phone GPS is turned off.\n\nTurn on Location (GPS) so GeoTrace can log coordinates, then come back.');
        return;
      }

      // 3. Camera (initialize() shows the camera permission dialog).
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _fail(_Problem.noCamera, 'No camera was found on this device.');
        return;
      }
      final controller = CameraController(cameras.first, ResolutionPreset.high, enableAudio: false);
      try {
        await controller.initialize();
      } on CameraException catch (e) {
        await controller.dispose();
        if (e.code == 'CameraAccessDeniedWithoutPrompt' || e.code == 'CameraAccessRestricted') {
          _fail(_Problem.cameraBlocked,
              'Camera permission is blocked.\n\nOpen Settings > Apps > GeoTrace > Permissions and allow Camera, then come back.');
        } else if (e.code == 'CameraAccessDenied') {
          _fail(_Problem.cameraDenied,
              'Camera permission was denied. GeoTrace needs the camera to record evidence.\n\nTap Try again and choose Allow, or enable it in Settings > Apps > GeoTrace > Permissions.');
        } else {
          _fail(_Problem.other, 'Camera error: ${e.description ?? e.code}');
        }
        return;
      }
      if (!mounted) {
        await controller.dispose();
        return;
      }

      _posSub = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          distanceFilter: 0,
        ),
      ).listen(
        (pos) {
          _last = pos;
          if (mounted) setState(() {});
        },
        onError: (_) {},
      );

      await QueueDb.refreshCount();
      if (mounted) setState(() => _cam = controller);
    } catch (e) {
      _fail(_Problem.other, 'Could not start capture: $e');
    } finally {
      _starting = false;
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

  Future<void> _toggleRecord() async {
    final cam = _cam;
    if (cam == null || _saving) return;
    try {
      if (!_recording) {
        _track.clear();
        if (_last != null) _addPoint(_last!);
        await cam.startVideoRecording();
        // One track point per second, so the counter also rises while standing still.
        _trackTimer = Timer.periodic(const Duration(seconds: 1), (_) {
          final pos = _last;
          if (pos != null && mounted) setState(() => _addPoint(pos));
        });
        setState(() {
          _recording = true;
          _syncMsg = '';
        });
        return;
      }

      setState(() => _saving = true);
      _trackTimer?.cancel();
      _trackTimer = null;
      final xfile = await cam.stopVideoRecording();
      _recording = false;

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
      if (mounted) setState(() => _syncMsg = 'Saved to queue');
      _syncNow();
    } catch (e) {
      _recording = false;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _syncNow() async {
    if (mounted) setState(() => _syncMsg = 'Syncing...');
    var uploaded = 0;
    try {
      uploaded = await SyncService.flush();
    } catch (_) {}
    await QueueDb.refreshCount();
    if (!mounted) return;
    final left = QueueDb.pendingCount.value;
    setState(() {
      if (uploaded > 0) {
        _syncMsg = 'Uploaded $uploaded';
      } else if (left > 0) {
        _syncMsg = 'Queued: will upload when the backend is reachable';
      } else {
        _syncMsg = 'Nothing to upload';
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _trackTimer?.cancel();
    _posSub?.cancel();
    _cam?.dispose();
    super.dispose();
  }

  // ------------------------------------------------------------------ UI

  Widget _problemView() {
    final blocked = _problem == _Problem.locationBlocked || _problem == _Problem.cameraBlocked;
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Pastel.peach, width: 2),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _problem == _Problem.gpsOff ? Icons.location_off : Icons.lock_outline,
                  size: 44,
                  color: Pastel.warnOrange,
                ),
                const SizedBox(height: 12),
                Text(_problemText,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Pastel.ink, fontSize: 15, height: 1.4)),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  alignment: WrapAlignment.center,
                  children: [
                    FilledButton.icon(
                      onPressed: _init,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try again'),
                    ),
                    if (_problem == _Problem.gpsOff)
                      FilledButton.icon(
                        style: FilledButton.styleFrom(backgroundColor: Pastel.mint),
                        onPressed: () => Geolocator.openLocationSettings(),
                        icon: const Icon(Icons.location_on),
                        label: const Text('Open location settings'),
                      ),
                    if (blocked ||
                        _problem == _Problem.locationDenied ||
                        _problem == _Problem.cameraDenied)
                      FilledButton.icon(
                        style: FilledButton.styleFrom(backgroundColor: Pastel.mint),
                        onPressed: () => Geolocator.openAppSettings(),
                        icon: const Icon(Icons.settings),
                        label: const Text('Open app settings'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _preview(CameraController cam) {
    final size = cam.value.previewSize;
    if (size == null) return CameraPreview(cam);
    return ClipRect(
      child: SizedBox.expand(
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: size.height,
            height: size.width,
            child: CameraPreview(cam),
          ),
        ),
      ),
    );
  }

  Widget _statusCard(Position? pos) {
    const mono = TextStyle(color: Pastel.ink, fontFamily: 'monospace', fontSize: 13, height: 1.45);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Pastel.sky, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            pos == null
                ? 'Waiting for GNSS fix...'
                : 'Latitude:  ${pos.latitude.toStringAsFixed(6)}\n'
                    'Longitude: ${pos.longitude.toStringAsFixed(6)}\n'
                    'Accuracy:  ±${pos.accuracy.toStringAsFixed(1)} m',
            style: mono,
          ),
          const SizedBox(height: 6),
          ValueListenableBuilder<int>(
            valueListenable: QueueDb.pendingCount,
            builder: (context, pending, _) => Text(
              'Track pts: ${_track.length}    Queue: $pending pending',
              style: mono.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          if (_syncMsg.isNotEmpty) Text(_syncMsg, style: mono.copyWith(color: Pastel.muted)),
          if (_recording)
            const Text('● Recording', style: TextStyle(color: Pastel.recordRed, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_problem != _Problem.none) return _problemView();
    final cam = _cam;
    if (cam == null || !cam.value.isInitialized) {
      return const Center(child: CircularProgressIndicator(color: Pastel.skyDeep));
    }
    final canRecord = _recording || _last != null;
    return Stack(
      fit: StackFit.expand,
      children: [
        _preview(cam),
        Positioned(
          top: 0,
          left: 12,
          right: 12,
          child: SafeArea(child: Padding(padding: const EdgeInsets.only(top: 8), child: _statusCard(_last))),
        ),
        Positioned(
          bottom: 24,
          left: 0,
          right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              FloatingActionButton(
                heroTag: 'sync',
                backgroundColor: Pastel.mint,
                foregroundColor: Pastel.ink,
                onPressed: _syncNow,
                child: const Icon(Icons.sync),
              ),
              FloatingActionButton.large(
                heroTag: 'rec',
                backgroundColor: Pastel.recordRed,
                foregroundColor: Colors.white,
                onPressed: canRecord && !_saving ? _toggleRecord : null,
                child: Icon(_recording ? Icons.stop : Icons.fiber_manual_record, size: 44),
              ),
              const SizedBox(width: 56),
            ],
          ),
        ),
      ],
    );
  }
}
"""

F["flutter_app/lib/screens/ar_screen.dart"] = r"""
import 'dart:io';
import 'dart:math' as math;
import 'package:arcore_flutter_plugin/arcore_flutter_plugin.dart';
import 'package:flutter/material.dart';
import 'package:vector_math/vector_math_64.dart' as v;
import '../theme.dart';

const String kArWarning =
    'AR shows STORED RECORDS ONLY. It does NOT detect buried pipes.\n'
    'VERIFY BEFORE DIGGING: contact the utility owner, confirm with a licensed '
    'surveyor, and hand-dig or pothole to expose the line first.';

enum _ArState { checking, ready, unsupported, notInstalled }

class ArScreen extends StatefulWidget {
  const ArScreen({super.key});

  @override
  State<ArScreen> createState() => _ArScreenState();
}

class _ArScreenState extends State<ArScreen> {
  ArCoreController? _ctrl;
  _ArState _state = _ArState.checking;
  String _detail = '';

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

  @override
  void initState() {
    super.initState();
    _check();
  }

  void _set(_ArState state, String detail) {
    if (!mounted) return;
    setState(() {
      _state = state;
      _detail = detail;
    });
  }

  Future<void> _check() async {
    if (!Platform.isAndroid) {
      _set(_ArState.unsupported, 'AR preview is Android-only in this build (ARKit is planned).');
      return;
    }
    try {
      final available = await ArCoreController.checkArCoreAvailability();
      if (!available) {
        _set(_ArState.unsupported, 'This device does not support ARCore, so the AR view cannot run here.');
        return;
      }
      final installed = await ArCoreController.checkIsArCoreInstalled();
      if (!installed) {
        _set(_ArState.notInstalled,
            'Install or update "Google Play Services for AR" from the Play Store, then open this tab again.');
        return;
      }
      _set(_ArState.ready, '');
    } catch (e) {
      _set(_ArState.unsupported, 'AR could not start on this device.');
    }
  }

  /// Converts lat/lng to local metres relative to the first vertex. The
  /// prototype anchors the pipe to the phone's start pose (no compass).
  List<v.Vector3> _toLocalMeters() {
    final lat0 = _pipeLatLng.first[0];
    final lng0 = _pipeLatLng.first[1];
    const mPerLat = 111320.0;
    final mPerLng = 111320.0 * math.cos(lat0 * math.pi / 180);
    return _pipeLatLng.map((pt) {
      final east = (pt[1] - lng0) * mPerLng;
      final north = (pt[0] - lat0) * mPerLat;
      return v.Vector3(east, _depthM, -(north + _aheadM)); // -Z is forward
    }).toList();
  }

  void _onCreated(ArCoreController controller) {
    _ctrl = controller;
    final pts = _toLocalMeters();
    final pipeMat = ArCoreMaterial(color: Pastel.pipeBlue);
    final jointMat = ArCoreMaterial(color: Pastel.jointOrange);

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

  Widget _warningBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Pastel.warnOrange,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Text(
        kArWarning,
        style: TextStyle(color: Pastel.ink, fontWeight: FontWeight.bold, fontSize: 13, height: 1.35),
      ),
    );
  }

  /// Shown when AR cannot run. It never crashes and always shows the warning.
  Widget _fallbackView() {
    return SafeArea(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.view_in_ar_outlined, size: 56, color: Pastel.skyDeep),
              const SizedBox(height: 12),
              Text(_detail,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Pastel.ink, fontSize: 15, height: 1.4)),
              if (_state == _ArState.notInstalled) ...[
                const SizedBox(height: 14),
                FilledButton(
                  onPressed: () => _set(_ArState.ready, ''),
                  child: const Text('Try AR anyway'),
                ),
              ],
              const SizedBox(height: 20),
              _warningBanner(),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_state == _ArState.checking) {
      return const Center(child: CircularProgressIndicator(color: Pastel.skyDeep));
    }
    if (_state != _ArState.ready) return _fallbackView();

    return Stack(
      children: [
        ArCoreView(onArCoreViewCreated: _onCreated, enableTapRecognizer: false),
        Positioned(
          top: 0,
          left: 12,
          right: 12,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.92),
                  border: Border.all(color: Pastel.mint, width: 2),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Water pipe',
                        style: TextStyle(color: Pastel.ink, fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('Stored record (mock data)', style: TextStyle(color: Pastel.mintDeep)),
                    Text('Depth: sample data', style: TextStyle(color: Pastel.muted)),
                  ],
                ),
              ),
            ),
          ),
        ),
        // Guardrail: always visible, cannot be dismissed.
        Positioned(bottom: 12, left: 12, right: 12, child: _warningBanner()),
      ],
    );
  }
}
"""

# ============================================================================
# REACT DASHBOARD
# ============================================================================
F["react_dashboard/src/geo3d.js"] = r"""
// Builds simple 3D "depth bars" along a route so the dashboard can show depth
// as extruded ribbons. Height = depth in metres (visual aid only, the pipe is
// really below ground).
const M_PER_LAT = 111320;

function ribbonPolygons(feature, widthM, heightM, kind) {
  const coords = feature.geometry.coordinates;
  const lat0 = coords[0][1];
  const mPerLng = M_PER_LAT * Math.cos((lat0 * Math.PI) / 180);
  const half = widthM / 2;
  const out = [];
  for (let i = 0; i < coords.length - 1; i += 1) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    const dx = (x2 - x1) * mPerLng;
    const dy = (y2 - y1) * M_PER_LAT;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;
    const offLng = ((-dy / len) * half) / mPerLng;
    const offLat = ((dx / len) * half) / M_PER_LAT;
    const ring = [
      [x1 + offLng, y1 + offLat],
      [x2 + offLng, y2 + offLat],
      [x2 - offLng, y2 - offLat],
      [x1 - offLng, y1 - offLat],
      [x1 + offLng, y1 + offLat],
    ];
    out.push({
      type: 'Feature',
      properties: { kind, height: heightM },
      geometry: { type: 'Polygon', coordinates: [ring] },
    });
  }
  return out;
}

export function buildDepthBars(routeData, plannedDepthM, actualDepthM) {
  const planned = routeData.features.find((f) => f.properties.kind === 'planned');
  const actual = routeData.features.find((f) => f.properties.kind === 'actual');
  return {
    type: 'FeatureCollection',
    features: [
      ...ribbonPolygons(planned, 0.9, plannedDepthM, 'planned'),
      ...ribbonPolygons(actual, 0.5, actualDepthM, 'actual'),
    ],
  };
}
"""

F["react_dashboard/src/DeviationMap.jsx"] = r"""
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const HOME = { center: [75.87003, 26.4002], zoom: 19, pitch: 60, bearing: -25 };

const style = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      // Soft, pastel-looking base map.
      paint: { 'raster-saturation': -0.35, 'raster-brightness-min': 0.12, 'raster-opacity': 0.95 },
    },
  ],
};

const kind = (k) => ['==', ['get', 'kind'], k];

const LAYER_GROUPS = {
  planned: ['planned'],
  actual: ['actual'],
  deviation: ['deviation'],
  survey: ['survey'],
  depth: ['depth-planned', 'depth-actual'],
};

function applyVisibility(map, visible) {
  Object.entries(LAYER_GROUPS).forEach(([key, ids]) => {
    ids.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible[key] ? 'visible' : 'none');
      }
    });
  });
}

export default function DeviationMap({ data, depthBars, visible, is3d, resetToken }) {
  const container = useRef(null);
  const mapRef = useRef(null);
  const loaded = useRef(false);
  const latest = useRef({ visible, is3d });
  latest.current = { visible, is3d };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: container.current,
      style,
      center: HOME.center,
      zoom: HOME.zoom,
      pitch: HOME.pitch,
      bearing: HOME.bearing,
      maxPitch: 75,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    // Keep the map correct when only its container changes size (split view).
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);

    map.on('load', () => {
      map.addSource('route', { type: 'geojson', data });
      map.addSource('depth', { type: 'geojson', data: depthBars });

      // 3D depth bars (height = depth in metres, visual aid).
      map.addLayer({
        id: 'depth-planned',
        type: 'fill-extrusion',
        source: 'depth',
        filter: kind('planned'),
        paint: {
          'fill-extrusion-color': '#8fd8e8',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.5,
        },
      });
      map.addLayer({
        id: 'depth-actual',
        type: 'fill-extrusion',
        source: 'depth',
        filter: kind('actual'),
        paint: {
          'fill-extrusion-color': '#7aa8f5',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.75,
        },
      });

      map.addLayer({
        id: 'planned',
        type: 'line',
        source: 'route',
        filter: kind('planned'),
        paint: { 'line-color': '#1fa5c4', 'line-width': 4, 'line-dasharray': [2, 2] },
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
        paint: { 'line-color': '#ef4444', 'line-width': 6, 'line-opacity': 0.9 },
      });
      map.addLayer({
        id: 'survey',
        type: 'circle',
        source: 'route',
        filter: kind('survey'),
        paint: {
          'circle-radius': 7,
          'circle-color': '#fb923c',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-pitch-alignment': 'map',
        },
      });

      const popup = new maplibregl.Popup({ closeButton: false, offset: 12 });
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
      map.on('mouseenter', 'deviation', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        popup.setLngLat(e.lngLat).setText('Deviation from the planned route').addTo(map);
      });
      map.on('mouseleave', 'deviation', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      loaded.current = true;
      applyVisibility(map, latest.current.visible);
    });

    return () => {
      observer.disconnect();
      loaded.current = false;
      map.remove();
    };
  }, [data, depthBars]);

  useEffect(() => {
    if (loaded.current && mapRef.current) applyVisibility(mapRef.current, visible);
  }, [visible]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      pitch: is3d ? HOME.pitch : 0,
      bearing: is3d ? HOME.bearing : 0,
      duration: 700,
    });
  }, [is3d]);

  useEffect(() => {
    if (resetToken === 0 || !mapRef.current) return;
    mapRef.current.flyTo({
      center: HOME.center,
      zoom: HOME.zoom,
      pitch: latest.current.is3d ? HOME.pitch : 0,
      bearing: latest.current.is3d ? HOME.bearing : 0,
      duration: 900,
    });
  }, [resetToken]);

  return <div ref={container} className="map" />;
}
"""

F["react_dashboard/src/App.jsx"] = r"""
import { useState } from 'react';
import DeviationMap from './DeviationMap.jsx';
import { buildDepthBars } from './geo3d.js';
import { record, routeData } from './sampleData.js';

const STATUS = {
  pending_review: { label: 'Pending review', bg: '#ffe9cf', fg: '#8a4b0f', dot: '#f5a04b' },
  approved: { label: 'Approved', bg: '#d3f2e2', fg: '#17613f', dot: '#3fae7a' },
  rejected: { label: 'Rejected', bg: '#fbd9d9', fg: '#8a1f1f', dot: '#e26d6d' },
  needs_evidence: { label: 'More evidence requested', bg: '#d9e8fb', fg: '#1f4a8a', dot: '#5b93e0' },
};

// Backend address (optional). Create react_dashboard/.env from .env.example.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';

const LAYERS = [
  { key: 'planned', label: 'Planned (CAD)', color: '#1fa5c4' },
  { key: 'actual', label: 'Actual (as built)', color: '#2563eb' },
  { key: 'deviation', label: 'Deviation', color: '#ef4444' },
  { key: 'survey', label: 'Survey points', color: '#fb923c' },
  { key: 'depth', label: '3D depth bars', color: '#7aa8f5' },
];

const QUICK_COMMENTS = [
  'Route matches the design',
  'Depth label missing in video',
  'Video or photo is unclear',
  'GNSS accuracy is too low',
];

const depthBars = buildDepthBars(routeData, record.plannedDepthM, record.actualDepthM);

export default function App() {
  const [status, setStatus] = useState('pending_review');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [log, setLog] = useState([
    { at: new Date().toISOString(), msg: 'Record submitted by field crew (mock)' },
  ]);
  const [visible, setVisible] = useState({
    planned: true,
    actual: true,
    deviation: true,
    survey: true,
    depth: true,
  });
  const [is3d, setIs3d] = useState(true);
  const [resetToken, setResetToken] = useState(0);

  const locked = status === 'approved' || status === 'rejected';
  const s = STATUS[status];
  const depthDiff = (record.actualDepthM - record.plannedDepthM).toFixed(1);

  const addLog = (msg) => setLog((l) => [{ at: new Date().toISOString(), msg }, ...l]);

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
      addLog(STATUS[next].label + (comment.trim() ? ': ' + comment.trim() : ''));
      setComment('');
    } catch (e) {
      setError('Could not save decision: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const reopen = () => {
    setError('');
    setStatus('pending_review');
    addLog('Reopened for review');
  };

  const addQuick = (text) => {
    if (locked) return;
    setComment((c) => (c.trim() ? c.trim() + '. ' + text : text));
  };

  const toggleLayer = (key) => setVisible((v) => ({ ...v, [key]: !v[key] }));

  const downloadReview = () => {
    const blob = new Blob([JSON.stringify({ record, status, auditLog: log }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = record.id + '-review.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="layout">
      <aside className="panel">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <h1>GeoTrace review</h1>
            <p className="muted">Sample data, not a real record</p>
          </div>
        </div>

        <section className="card">
          <div className="card-head">
            <b>{record.id}</b>
            <span className="tag">{record.utility}</span>
          </div>
          <div className="muted small">{record.site}</div>
          <div className="stats">
            <div className="stat">
              <span>Planned depth</span>
              <b>{record.plannedDepthM} m</b>
            </div>
            <div className="stat">
              <span>Actual depth</span>
              <b>{record.actualDepthM} m</b>
            </div>
            <div className="stat">
              <span>Max deviation</span>
              <b>{record.maxDeviationM} m</b>
            </div>
            <div className="stat">
              <span>Depth difference</span>
              <b>+{depthDiff} m</b>
            </div>
          </div>
        </section>

        <div className="status-row">
          <span className="badge" style={{ background: s.bg, color: s.fg }}>
            <span className="dot" style={{ background: s.dot }} />
            {s.label}
          </span>
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Reviewer comment (required for reject / more evidence)"
          disabled={locked}
          rows={3}
        />
        <div className="chips">
          {QUICK_COMMENTS.map((q) => (
            <button key={q} className="chip" disabled={locked} onClick={() => addQuick(q)}>
              {q}
            </button>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button className="btn approve" disabled={locked || saving} onClick={() => decide('approved')}>
            Approve
          </button>
          <button className="btn evidence" disabled={locked || saving} onClick={() => decide('needs_evidence')}>
            Request more evidence
          </button>
          <button className="btn reject" disabled={locked || saving} onClick={() => decide('rejected')}>
            Reject
          </button>
          {locked && (
            <button className="btn reopen" onClick={reopen}>
              Reopen
            </button>
          )}
        </div>

        <h3>Audit log</h3>
        <ul className="log">
          {log.map((e, i) => (
            <li key={i}>
              <span className="muted">{e.at.slice(11, 19)}</span> {e.msg}
            </li>
          ))}
        </ul>
        <button className="btn ghost" onClick={downloadReview}>
          Download review as JSON
        </button>
      </aside>

      <main className="mapwrap">
        <DeviationMap
          data={routeData}
          depthBars={depthBars}
          visible={visible}
          is3d={is3d}
          resetToken={resetToken}
        />
        <div className="toolbar">
          <div className="toolbar-row">
            {LAYERS.map((l) => (
              <label key={l.key} className={'layer-chip' + (visible[l.key] ? ' on' : '')}>
                <input type="checkbox" checked={visible[l.key]} onChange={() => toggleLayer(l.key)} />
                <span className="swatch" style={{ background: l.color }} />
                {l.label}
              </label>
            ))}
          </div>
          <div className="toolbar-row">
            <button className="tool-btn" onClick={() => setIs3d((v) => !v)}>
              {is3d ? 'Switch to 2D view' : 'Switch to 3D view'}
            </button>
            <button className="tool-btn" onClick={() => setResetToken((t) => t + 1)}>
              Reset view
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
"""

F["react_dashboard/src/index.css"] = r"""
:root {
  --bg: #f6f3ee;
  --panel: #ffffff;
  --line: #e8e2d8;
  --ink: #2b3a55;
  --muted: #6b7a90;
  --sky: #cfe3fa;
  --mint: #cdeedd;
  --peach: #ffe0c2;
  --lavender: #e3ddf5;
  --rose: #fbd9d9;
  color-scheme: light;
}

* { box-sizing: border-box; }
html, body, #root { margin: 0; height: 100%; }
body {
  background: var(--bg);
  color: var(--ink);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
}
button:disabled { opacity: 0.45; cursor: not-allowed; }

.layout { display: flex; height: 100vh; }

.panel {
  width: 370px;
  flex: none;
  overflow-y: auto;
  padding: 18px;
  background: var(--panel);
  border-right: 1px solid var(--line);
  box-shadow: 4px 0 24px rgba(43, 58, 85, 0.06);
  z-index: 2;
}
.mapwrap { position: relative; flex: 1; min-width: 0; }
.map { position: absolute; inset: 0; }

.brand { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
.brand h1 { margin: 0; font-size: 20px; }
.brand p { margin: 2px 0 0; }
.brand-dot {
  width: 38px; height: 38px; border-radius: 12px;
  background: linear-gradient(135deg, var(--sky), var(--mint));
  border: 2px solid #fff; box-shadow: 0 2px 8px rgba(43, 58, 85, 0.15);
}
.muted { color: var(--muted); }
.small { font-size: 13px; }

.card {
  background: #fbf9f5;
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 14px;
}
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.tag { background: var(--sky); color: #1f4a8a; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.stat { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 8px 10px; }
.stat span { display: block; font-size: 12px; color: var(--muted); }
.stat b { font-size: 16px; }

.status-row { margin-bottom: 12px; }
.badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 700;
}
.dot { width: 9px; height: 9px; border-radius: 999px; }

textarea {
  width: 100%; padding: 10px; border-radius: 12px;
  border: 1px solid #d9d2c6; background: #fff; color: var(--ink);
  font-family: inherit; font-size: 14px; resize: vertical;
}
textarea:focus { outline: 2px solid var(--sky); border-color: #9bbfe9; }

.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 4px; }
.chip {
  border: 1px solid var(--line); background: var(--lavender); color: var(--ink);
  border-radius: 999px; padding: 4px 10px; font-size: 12px; cursor: pointer;
}
.chip:hover:not(:disabled) { background: #d6cdf0; }

.error {
  margin-top: 8px; padding: 8px 10px; border-radius: 10px;
  background: var(--rose); color: #8a1f1f; font-size: 13px;
}

.actions { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.btn {
  border: 0; border-radius: 12px; padding: 11px 12px;
  font-weight: 700; font-size: 14px; cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.15s ease;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(43, 58, 85, 0.12); }
.btn.approve { background: var(--mint); color: #17613f; }
.btn.evidence { background: var(--sky); color: #1f4a8a; }
.btn.reject { background: var(--rose); color: #8a1f1f; }
.btn.reopen { background: var(--lavender); color: #4a3d85; }
.btn.ghost { margin-top: 12px; width: 100%; background: #fff; border: 1px solid var(--line); color: var(--ink); }

h3 { margin: 20px 0 8px; font-size: 15px; }
.log { padding-left: 18px; margin: 0; font-size: 13px; line-height: 1.6; }

.toolbar {
  position: absolute; top: 12px; left: 12px; z-index: 3;
  display: flex; flex-direction: column; gap: 8px; max-width: calc(100% - 70px);
}
.toolbar-row { display: flex; flex-wrap: wrap; gap: 6px; }
.layer-chip, .tool-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255, 255, 255, 0.94); color: var(--ink);
  border: 1px solid var(--line); border-radius: 999px;
  padding: 5px 11px; font-size: 12px; font-weight: 600; cursor: pointer;
  box-shadow: 0 2px 8px rgba(43, 58, 85, 0.1);
}
.layer-chip input { display: none; }
.layer-chip:not(.on) { opacity: 0.55; }
.swatch { width: 10px; height: 10px; border-radius: 3px; }
.tool-btn { background: var(--mint); }
.tool-btn:hover { background: #bfe8d3; }

.maplibregl-popup-content {
  border-radius: 10px; font-weight: 600; color: var(--ink);
  box-shadow: 0 4px 14px rgba(43, 58, 85, 0.2);
}

/* Narrow windows: map on top, panel below */
@media (max-width: 860px) {
  .layout { flex-direction: column; height: 100vh; height: 100dvh; }
  .mapwrap { order: -1; flex: 1 1 55%; min-height: 260px; }
  .panel {
    width: 100%; flex: 0 0 auto; max-height: 45%;
    border-right: 0; border-top: 1px solid var(--line);
    box-shadow: 0 -4px 24px rgba(43, 58, 85, 0.08);
  }
}
"""


def main() -> None:
    if not (ROOT / "flutter_app").is_dir() or not (ROOT / "react_dashboard").is_dir():
        print("ERROR: run this script inside the geotrace_workspace folder")
        print("       (the folder that contains flutter_app and react_dashboard).")
        print("Current folder:", ROOT)
        sys.exit(1)
    for rel, content in F.items():
        path = ROOT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content.lstrip("\n"), encoding="utf-8", newline="\n")
        print("  wrote", rel)
    print("\nDONE. Next: run the dashboard and the phone app (see the steps in chat).")


if __name__ == "__main__":
    main()
