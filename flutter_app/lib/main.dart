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
