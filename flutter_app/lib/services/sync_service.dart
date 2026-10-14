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
