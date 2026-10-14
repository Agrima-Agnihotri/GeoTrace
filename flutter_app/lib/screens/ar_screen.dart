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
