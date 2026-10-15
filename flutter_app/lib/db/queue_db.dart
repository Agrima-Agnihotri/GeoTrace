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
