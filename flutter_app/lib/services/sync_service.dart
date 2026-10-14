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
  static const String baseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:8000');
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
