import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

/// Local SQLite queue. Every captured clip is stored here first,
/// then uploaded whenever the network is available.
class QueueDb {
  static Database? _db;

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

  static Future<void> insert(Map<String, Object?> row) async {
    final db = await _database;
    await db.insert('queue', row);
  }

  static Future<List<Map<String, Object?>>> pending() async {
    final db = await _database;
    return db.query('queue', where: "status = 'pending'", orderBy: 'captured_at');
  }

  static Future<int> pendingCount() async {
    final rows = await pending();
    return rows.length;
  }

  static Future<void> markUploaded(String id) async {
    final db = await _database;
    await db.update('queue', {'status': 'uploaded'}, where: 'id = ?', whereArgs: [id]);
  }

  static Future<void> bumpAttempts(String id) async {
    final db = await _database;
    await db.rawUpdate('UPDATE queue SET attempts = attempts + 1 WHERE id = ?', [id]);
  }
}
