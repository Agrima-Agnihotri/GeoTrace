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
