# GeoTrace GIS

**AI-assisted as-built mapping for underground utilities.**
Pipelines are rarely laid exactly as the CAD plan shows, and the changes go unrecorded before the trench is backfilled. GeoTrace captures the exposed pipe before backfill, keeps the evidence, compares planned vs actual, and lets an owner approve the record.

> **Safety:** The AR view shows **stored records only**. It does **not** detect buried pipes. Always verify with the utility owner and a licensed surveyor, and hand-dig to expose the line before digging.

This repository contains the **mobile, AR and review-dashboard** parts of GeoTrace. The backend (FastAPI, PostgreSQL + PostGIS, AI processing) is built by the backend teammate and is not part of this repository.

## What is in this repository

| Folder / file | What it is | Status |
|---|---|---|
| `flutter_app/` | Field capture app: camera video, GNSS track, SHA-256 evidence hash, offline SQLite queue, auto-upload when online | Working prototype |
| `flutter_app/lib/screens/ar_screen.dart` | ARCore overlay of a **mock** water pipe with a permanent safe-dig warning | Prototype, Android only |
| `react_dashboard/` | Review dashboard: MapLibre map with planned vs actual route, deviation highlight, approve / reject / request more evidence, audit log | Working prototype on sample data |
| `sample_data/` | Sample GeoJSON route, sample evidence record, sample AR pipe | Included |
| `tests/` | Automated test for the sample data | Included |
| `docs/TECHNICAL_DESIGN.md` | Technical design document with architecture diagrams | Included |
| `docs/TEST_CASES.md` | Manual and automated test cases | Included |
| `fix_arcore.py` | Helper that patches the old ARCore Flutter plugin so it builds | Helper |

## Quick start

### Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Node.js | 18 or newer (20+ recommended) | Dashboard |
| Flutter SDK | 3.x stable (Dart 3.3 or newer) | Mobile app |
| Android Studio | Latest, with SDK + command-line tools | Android build |
| Python | 3.8 or newer | Tests and `fix_arcore.py` |
| Git | Any recent version | Clone and push |
| Android phone | Android 7.0 (API 24) or newer, USB debugging on, ARCore supported for the AR tab | Camera, GNSS and AR need a real device |

Run `flutter doctor` and make sure Flutter and Android toolchain have green ticks.

### 1. Clone

```bash
git clone https://github.com/Agrima-Agnihotri/geotrace.git
cd geotrace
```

### 2. Review dashboard

```bash
cd react_dashboard
npm install
npm run dev
```

Open http://localhost:5173. The dashboard runs on built-in sample data, so no backend is needed for the demo.

Optional: connect to the backend.

```bash
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
```

Then edit `.env` (see the environment variables table below) and restart `npm run dev`.

### 3. Flutter capture app

Plug in the phone, then:

```bash
cd flutter_app
flutter pub get
python ../fix_arcore.py
flutter clean
flutter pub get
flutter devices
flutter run -d <your-device-id>
```

The first build takes 5 to 10 minutes. To point the app at a backend:

```bash
flutter run -d <your-device-id> --dart-define=API_BASE_URL=http://192.168.1.10:8000
```

Without a backend, recorded clips simply stay in the offline queue, which is the intended offline behaviour.

### 4. Run the automated test

```bash
python tests/test_sample_data.py
```

Expected: `OK` with 6 tests passing.

## Environment variables

There are no secrets in this repository. All settings are addresses and switches.

| Variable | Where | Default | Meaning |
|---|---|---|---|
| `VITE_API_BASE_URL` | `react_dashboard/.env` | `http://localhost:8000` | Backend address used by the dashboard |
| `VITE_USE_BACKEND` | `react_dashboard/.env` | `false` | `true` = send review decisions to the backend; `false` = demo mode, decisions stay in the browser |
| `API_BASE_URL` | Flutter, passed with `--dart-define` | `http://10.0.2.2:8000` | Backend address used by the upload queue. `10.0.2.2` is the host computer seen from the Android emulator. On a real phone use your computer's LAN IP, for example `http://192.168.1.10:8000` |

Never commit a real `.env` file. Only `.env.example` is committed.

## Backend contract (proposed)

The apps expect these endpoints from the backend. They are a proposal and must be confirmed with the backend owner.

| Method and path | Used by | Body |
|---|---|---|
| `POST /api/v1/evidence` | Flutter app | multipart: `id`, `sha256`, `captured_at`, `track` (JSON string), `video` (file) |
| `PATCH /api/v1/records/{id}/review` | Dashboard | JSON: `status`, `comment` |

Details and examples are in [docs/TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md).

## Documentation

- [Technical design document](docs/TECHNICAL_DESIGN.md) with architecture diagrams
- [Test cases](docs/TEST_CASES.md)
- [Sample data](sample_data/)

## Known limitations

- The AR overlay uses a hardcoded mock pipe anchored to the phone's starting pose. It is not geo-anchored and has no compass alignment.
- AR works on Android (ARCore) only. iOS (ARKit) is planned.
- AI pipe detection, photogrammetry, PostGIS storage and DXF / GeoPackage export belong to the backend and roadmap and are not in this repository.
- The dashboard audit log is local to the browser session until the backend endpoint exists.
- `arcore_flutter_plugin` is unmaintained, which is why `fix_arcore.py` exists.

## Team

| Member | Role |
|---|---|
| Agrima Agnihotri | Mobile, AR and Product |
| Shivangi | AI, Backend and GIS |

## License

MIT. See [LICENSE](LICENSE).
