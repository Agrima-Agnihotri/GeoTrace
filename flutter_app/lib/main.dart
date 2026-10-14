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
