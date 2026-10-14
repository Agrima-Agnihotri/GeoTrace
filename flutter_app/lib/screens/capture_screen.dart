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
