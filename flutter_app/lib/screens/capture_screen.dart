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
