#!/usr/bin/env python3
"""
GeoTrace GIS - hackathon submission files generator.

Run this INSIDE the geotrace_workspace folder (the one that contains
flutter_app and react_dashboard):

    python add_hackathon_docs.py

It creates / updates:
  README.md                      setup steps + environment variables
  LICENSE                        MIT
  .gitignore                     root ignore file
  docs/TECHNICAL_DESIGN.md       design document with Mermaid diagrams
  docs/TEST_CASES.md             manual + automated test cases
  sample_data/*.json|geojson     sample data
  tests/test_sample_data.py      automated test (no extra installs)
  react_dashboard/.env.example   env variables for the dashboard

It also makes the API address configurable (env variables) in:
  react_dashboard/src/App.jsx
  flutter_app/lib/services/sync_service.dart
"""
import sys
from pathlib import Path

ROOT = Path.cwd()


def write(rel: str, content: str) -> None:
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.lstrip("\n"), encoding="utf-8", newline="\n")
    print(f"  wrote {rel}")


def patch(rel: str, old: str, new: str) -> None:
    path = ROOT / rel
    if not path.exists():
        print(f"  WARNING: {rel} not found, skipped")
        return
    text = path.read_text(encoding="utf-8")
    if new in text:
        print(f"  already patched: {rel}")
        return
    if old not in text:
        print(f"  WARNING: expected text not found in {rel}; edit it by hand (see README)")
        return
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")
    print(f"  patched {rel}")


FILES = {}

# ---------------------------------------------------------------------------
FILES["LICENSE"] = r"""
MIT License

Copyright (c) 2026 GeoTrace GIS Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""

# ---------------------------------------------------------------------------
FILES[".gitignore"] = r"""
__pycache__/
*.pyc
.DS_Store
.vscode/
.env
"""

# ---------------------------------------------------------------------------
FILES["react_dashboard/.env.example"] = r"""
# Copy this file to .env and edit the values.
# Address of the GeoTrace backend (FastAPI).
VITE_API_BASE_URL=http://localhost:8000
# Set to true only when the backend review endpoint is running.
# false = decisions are kept in the browser only (demo mode).
VITE_USE_BACKEND=false
"""

# ---------------------------------------------------------------------------
FILES["README.md"] = r"""
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
"""

# ---------------------------------------------------------------------------
FILES["docs/TECHNICAL_DESIGN.md"] = r"""
# GeoTrace GIS: Technical Design Document

Scope of this document: the mobile, AR and review-dashboard parts in this repository, and the interfaces they need from the backend. Items that are not built yet are labelled **Planned**.

## 1. Purpose

Underground pipes are often laid differently from the CAD plan, and the changes are not recorded before the trench is backfilled. GeoTrace records the exposed pipe with evidence, compares planned and actual routes, and gives an owner a way to approve the record. Later crews can then work from verified records.

## 2. Status: what is built and what is planned

| Capability | Where | Status |
|---|---|---|
| Camera video capture | `flutter_app` | Built |
| GNSS track logging with accuracy | `flutter_app` | Built |
| SHA-256 evidence hash | `flutter_app` | Built |
| Offline SQLite queue and auto-retry upload | `flutter_app` | Built |
| AR overlay of stored record (mock data) with safe-dig warning | `flutter_app`, Android | Prototype |
| Planned vs actual map with deviation layer | `react_dashboard` | Built (sample data) |
| Approve, reject, request more evidence, audit log | `react_dashboard` | Built (local state) |
| REST API, evidence storage, PostgreSQL + PostGIS | Backend | Planned (backend owner) |
| AI pipe and fitting detection, photogrammetry | Backend | Planned |
| DXF / GeoPackage export | Backend | Planned |
| iOS ARKit overlay, real geo-anchoring | `flutter_app` | Planned |

## 3. System architecture

```mermaid
flowchart LR
  subgraph Field["Field capture: flutter_app (built)"]
    CAM["Camera video"] --> CAP["Capture screen"]
    GNSS["GNSS position stream"] --> CAP
    CAP --> HASH["SHA-256 hash"]
    HASH --> Q[("SQLite offline queue")]
    Q --> SYNC["Sync service"]
  end

  SYNC -->|"multipart upload, proposed API"| API["FastAPI backend (planned)"]
  API --> DB[("PostgreSQL + PostGIS (planned)")]
  API --> AI["AI detection + photogrammetry (planned)"]
  AI --> DB

  subgraph Web["Review dashboard: react_dashboard (built)"]
    REVIEW["React + MapLibre"]
  end

  DB -->|"records, deviations"| REVIEW
  REVIEW -->|"review decision"| API
  DB -.->|"stored records"| AR["AR view: ARCore overlay (prototype)"]
```

### Components

| Component | Technology | Responsibility |
|---|---|---|
| Capture screen | Flutter, `camera`, `geolocator` | Record video and log GNSS points while recording |
| Evidence integrity | `crypto` (SHA-256) | Hash the saved video file so the backend can detect changes |
| Offline queue | `sqflite` | Persist every clip before upload |
| Sync service | `http`, `connectivity_plus` | Upload pending clips, retry when the connection returns |
| AR view | `arcore_flutter_plugin`, `vector_math` | Draw stored pipe geometry on the camera feed |
| Review dashboard | React 18, Vite, MapLibre GL JS | Show planned vs actual, manage approval workflow |

## 4. Mobile capture design

### 4.1 Capture and upload sequence

```mermaid
sequenceDiagram
  participant U as Field crew
  participant A as Flutter app
  participant D as SQLite queue
  participant S as Backend (planned)
  U->>A: Tap record
  A->>A: Start video and log GNSS points
  U->>A: Tap stop
  A->>A: Save file and compute SHA-256
  A->>D: Insert row with status pending
  A->>S: POST /api/v1/evidence
  alt Online and server answers 200 or 201
    S-->>A: OK
    A->>D: Set status uploaded
  else Offline or server error
    A->>D: Increase attempts, row stays pending
    Note over A,D: Retry on Sync tap or when connectivity returns
  end
```

### 4.2 Offline queue schema

Table `queue` in `geotrace_queue.db`:

| Column | Type | Meaning |
|---|---|---|
| `id` | TEXT, primary key | UUID v4 of the evidence item |
| `video_path` | TEXT | Path of the saved `.mp4` in app storage |
| `sha256` | TEXT | Hex SHA-256 of the saved video |
| `track` | TEXT | JSON array of GNSS points (below) |
| `captured_at` | TEXT | UTC ISO 8601 time when recording stopped |
| `status` | TEXT | `pending` or `uploaded` |
| `attempts` | INTEGER | Number of failed upload attempts |

GNSS point format inside `track`:

```json
{"lat": 26.4, "lng": 75.87, "alt": 412.3, "acc_m": 3.2, "t": "2026-10-14T08:00:00.000Z"}
```

### 4.3 Design decisions

- **Write locally first.** A clip is saved and queued before any network call, so a dropped connection never loses evidence.
- **Hash on the device.** The hash is computed from the saved file, so the backend can recompute it and detect any change after capture.
- **Only one camera user at a time.** The home screen builds only the selected tab, so the camera and AR views never run together.
- **Accuracy is recorded.** Every GNSS point stores its reported accuracy in metres. Phone GNSS is not survey grade, which is why the pitch uses survey points as the geometry anchor.

## 5. AR design

```mermaid
flowchart TD
  A["Stored pipe record: lat and lng vertices"] --> B["Convert to local metres: east and north"]
  B --> C["Apply depth and forward offset"]
  C --> D["AR world coordinates: x east, y depth, minus z forward"]
  D --> E["One cylinder per segment, one sphere per vertex"]
  E --> F["ARCore camera overlay"]
  F --> G["Permanent banner: stored records only, verify before digging"]
```

Conversion used by the prototype (relative to the first vertex):

- `north_m = (lat - lat0) * 111320`
- `east_m = (lng - lng0) * 111320 * cos(lat0)`

**Guardrail.** The AR screen always shows a banner that cannot be dismissed: AR shows stored records only, it does not detect buried pipes, and users must verify with the owner, a licensed surveyor and by hand-digging. On non-Android devices the AR tab shows only this warning.

**Limitations of the prototype.** The mock pipe is anchored to the phone's starting pose, with no compass or geo-anchoring, so it does not appear at its real-world location. Real geo-anchoring is planned.

## 6. Review dashboard design

### 6.1 Review workflow

```mermaid
stateDiagram-v2
  [*] --> pending_review
  pending_review --> approved: Approve
  pending_review --> rejected: Reject, comment required
  pending_review --> needs_evidence: Request more evidence, comment required
  needs_evidence --> approved: Approve
  needs_evidence --> rejected: Reject, comment required
  approved --> pending_review: Reopen
  rejected --> pending_review: Reopen
```

Every decision is appended to the audit log with a timestamp and the reviewer comment. Approved and rejected records are locked until reopened.

### 6.2 Map layers

| Layer | Meaning | Style |
|---|---|---|
| `planned` | CAD design route | Dashed teal line |
| `actual` | As-built route from survey points | Solid blue line |
| `deviation` | Part of the actual route that departs from the plan | Thick red line |
| `survey` | Survey control points with labels | Orange circles |

GeoJSON coordinates use `[longitude, latitude]` order everywhere in this repository.

## 7. Interfaces (proposed, to be confirmed with the backend owner)

### 7.1 Upload evidence

`POST /api/v1/evidence` with `multipart/form-data`:

| Field | Type | Example |
|---|---|---|
| `id` | string (UUID) | `3f2b8c1e-5a4d-4e0b-9c7a-1d2e3f4a5b6c` |
| `sha256` | string (hex) | `0f4f7987...862a` |
| `captured_at` | string (UTC ISO 8601) | `2026-10-14T08:00:30.000Z` |
| `track` | string (JSON array) | see section 4.2 |
| `video` | file (`.mp4`) | recorded clip |

The app treats status `200` or `201` as success. Anything else, or no connection, leaves the item queued.

### 7.2 Review decision

`PATCH /api/v1/records/{id}/review` with JSON:

```json
{"status": "rejected", "comment": "Depth label missing in video"}
```

Allowed `status` values: `approved`, `rejected`, `needs_evidence`, `pending_review`.

## 8. Security and integrity

| Topic | Current state | Planned |
|---|---|---|
| Evidence integrity | SHA-256 computed on device and sent with the upload | Backend recomputes and stores the hash |
| Transport | Plain HTTP allowed in the Android build for local development only | HTTPS only; remove the cleartext setting before release |
| Authentication and roles | Not implemented | Roles for crew, reviewer and owner; audit logs on the backend |
| Evidence storage | Local app storage on the phone | Encrypted evidence storage on the backend |
| Secrets | None in this repository | Keep it that way; `.env` is git-ignored |

## 9. Safety guardrails

- The AR view only displays stored records and says so permanently on screen.
- Map and AR show sample data in this prototype and label it as sample or mock.
- Records are drafts until a reviewer approves them, and approval state is always visible.

## 10. Testing

See [TEST_CASES.md](TEST_CASES.md). One automated test (`python tests/test_sample_data.py`) validates the sample GeoJSON, the expected 6 m deviation, and the SHA-256 of the sample evidence. The remaining tests are manual because they need a physical phone.

## 11. Known limitations and roadmap

1. Backend, AI detection and photogrammetry are not in this repository.
2. AR is a mock overlay on Android only.
3. The dashboard reads bundled sample data and keeps its audit log in the browser.
4. Next steps: connect both apps to the backend, real geo-anchored AR, ARKit on iOS, pilot on one water-pipeline site compared against a reference survey.
"""

# ---------------------------------------------------------------------------
FILES["docs/TEST_CASES.md"] = r"""
# GeoTrace GIS: Test Cases

## A. Automated

Run from the repository root:

```bash
python tests/test_sample_data.py
```

| ID | Test | Expected |
|---|---|---|
| AT-01 | `route_deviation.geojson` is a FeatureCollection with planned, actual, deviation and survey features | Pass |
| AT-02 | All coordinates are valid `[lng, lat]` values inside India's bounding box | Pass |
| AT-03 | Largest distance of the actual route from the planned route is between 5.5 m and 6.5 m | Pass |
| AT-04 | Sample evidence `sha256` equals the SHA-256 of its sample payload text | Pass |
| AT-05 | Sample evidence GNSS points have `lat`, `lng`, `alt`, `acc_m`, `t` and valid timestamps | Pass |
| AT-06 | Sample AR pipe has at least 2 vertices and a negative depth | Pass |

## B. Manual: Flutter capture app (real Android phone)

| ID | Steps | Expected result |
|---|---|---|
| MT-01 | Open the app first time | Camera and Location permission prompts appear |
| MT-02 | Deny location permission | Screen shows a clear message explaining how to enable it |
| MT-03 | Turn the phone GPS off, open the app | Message asks the user to turn on GPS |
| MT-04 | Allow permissions, go outside, wait | Overlay shows latitude, longitude and accuracy in metres |
| MT-05 | Tap the red button, walk a few metres, tap again | Recording stops; the "Track pts" counter was increasing; queue count goes up by 1 |
| MT-06 | Turn on airplane mode, record a clip | Clip is queued; status text says it is queued (offline) |
| MT-07 | Turn airplane mode off with the backend running | The queue empties automatically and the count goes down |
| MT-08 | Run with no backend, tap the sync button | Clip stays queued, no crash |
| MT-09 | Close and reopen the app with clips in the queue | Pending count is still correct (queue is persistent) |

## C. Manual: AR view

| ID | Steps | Expected result |
|---|---|---|
| MT-10 | Open the AR tab on an ARCore phone and move the phone slowly | A blue pipe with orange joints appears in front of the camera |
| MT-11 | Look at the bottom of the AR screen | Orange banner says AR shows stored records only, does not detect buried pipes, and says to verify before digging |
| MT-12 | Switch tabs between Capture and AR several times | No crash; camera and AR work each time |
| MT-13 | Open the AR tab on a device without ARCore or on iOS | Screen shows the warning and does not crash |

## D. Manual: Review dashboard

| ID | Steps | Expected result |
|---|---|---|
| MT-14 | Run `npm run dev`, open http://localhost:5173 | Light-theme page with map and review panel; status is Pending review |
| MT-15 | Look at the map | Dashed planned line, solid blue actual line, red deviation, 3 orange survey points |
| MT-16 | Hover over a survey point | Popup shows its label, for example "Survey point S2" |
| MT-17 | Click Approve | Status becomes Approved; buttons are disabled; audit log gets a new line |
| MT-18 | Click Reopen, then Reject with an empty comment | Error message asks for a comment; status does not change |
| MT-19 | Type a comment, click Reject | Status becomes Rejected; log shows the comment |
| MT-20 | Reopen, type a comment, click Request more evidence | Status becomes More evidence requested |
| MT-21 | Resize the browser window | Panel and map stay usable |

## E. Pass criteria

Automated tests all pass, and MT-01 to MT-20 behave as described on one real Android phone and one browser.
"""

# ---------------------------------------------------------------------------
FILES["sample_data/route_deviation.geojson"] = r"""
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "kind": "planned" },
      "geometry": {
        "type": "LineString",
        "coordinates": [[75.87, 26.4], [75.87, 26.4004]]
      }
    },
    {
      "type": "Feature",
      "properties": { "kind": "actual" },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [75.87, 26.4],
          [75.87, 26.40015],
          [75.87006, 26.4002],
          [75.87, 26.40025],
          [75.87, 26.4004]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": { "kind": "deviation" },
      "geometry": {
        "type": "LineString",
        "coordinates": [[75.87, 26.40015], [75.87006, 26.4002], [75.87, 26.40025]]
      }
    },
    {
      "type": "Feature",
      "properties": { "kind": "survey", "label": "S1" },
      "geometry": { "type": "Point", "coordinates": [75.87, 26.40015] }
    },
    {
      "type": "Feature",
      "properties": { "kind": "survey", "label": "S2" },
      "geometry": { "type": "Point", "coordinates": [75.87006, 26.4002] }
    },
    {
      "type": "Feature",
      "properties": { "kind": "survey", "label": "S3" },
      "geometry": { "type": "Point", "coordinates": [75.87, 26.40025] }
    }
  ]
}
"""

FILES["sample_data/evidence_record.json"] = r"""
{
  "_note": "MOCK record. sha256 is the SHA-256 of sample_payload_text, not of a real video.",
  "id": "3f2b8c1e-5a4d-4e0b-9c7a-1d2e3f4a5b6c",
  "video_path": "evidence_3f2b8c1e-5a4d-4e0b-9c7a-1d2e3f4a5b6c.mp4",
  "sample_payload_text": "geotrace-sample-evidence",
  "sha256": "0f4f79879f0d70b7b60163a0ef3ed3fe99defd835e12f394cd440c02a2d2862a",
  "captured_at": "2026-10-14T08:00:30.000Z",
  "status": "pending",
  "attempts": 0,
  "track": [
    { "lat": 26.40000, "lng": 75.87000, "alt": 412.3, "acc_m": 3.2, "t": "2026-10-14T08:00:00.000Z" },
    { "lat": 26.40015, "lng": 75.87000, "alt": 412.4, "acc_m": 3.0, "t": "2026-10-14T08:00:12.000Z" },
    { "lat": 26.40025, "lng": 75.87000, "alt": 412.5, "acc_m": 2.8, "t": "2026-10-14T08:00:25.000Z" }
  ]
}
"""

FILES["sample_data/review_record.json"] = r"""
{
  "_note": "MOCK record shown in the review dashboard.",
  "id": "REC-0001",
  "utility": "Water",
  "site": "Sample site (mock data)",
  "plannedDepthM": 1.2,
  "actualDepthM": 1.6,
  "maxDeviationM": 6.0,
  "status": "pending_review"
}
"""

FILES["sample_data/ar_pipe.json"] = r"""
{
  "_note": "MOCK pipe used by the AR prototype. Vertices are [lat, lng].",
  "utility": "Water",
  "depthM": -1.2,
  "vertices": [
    [26.40000, 75.87000],
    [26.40002, 75.87000],
    [26.40004, 75.87002],
    [26.40006, 75.87002]
  ]
}
"""

# ---------------------------------------------------------------------------
FILES["tests/test_sample_data.py"] = r"""
#!/usr/bin/env python3
# Automated checks for the GeoTrace sample data. Needs only Python 3.8+.
# Run from the repository root:  python tests/test_sample_data.py
import hashlib
import json
import math
import re
import unittest
from datetime import datetime
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "sample_data"


def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def all_coordinates(geojson):
    for feature in geojson["features"]:
        geom = feature["geometry"]
        if geom["type"] == "Point":
            yield tuple(geom["coordinates"])
        else:
            for c in geom["coordinates"]:
                yield tuple(c)


class SampleDataTests(unittest.TestCase):
    def setUp(self):
        self.route = load("route_deviation.geojson")

    def test_at01_feature_collection_has_all_kinds(self):
        self.assertEqual(self.route["type"], "FeatureCollection")
        kinds = {f["properties"]["kind"] for f in self.route["features"]}
        self.assertTrue({"planned", "actual", "deviation", "survey"} <= kinds)

    def test_at02_coordinates_are_lng_lat_in_india(self):
        for lng, lat in all_coordinates(self.route):
            self.assertTrue(68 < lng < 98, f"lng out of range: {lng}")
            self.assertTrue(6 < lat < 38, f"lat out of range: {lat}")

    def test_at03_max_deviation_is_about_six_metres(self):
        planned = next(f for f in self.route["features"] if f["properties"]["kind"] == "planned")
        actual = next(f for f in self.route["features"] if f["properties"]["kind"] == "actual")
        # The planned route runs due north along one longitude, so the
        # sideways distance is the longitude difference converted to metres.
        planned_lng = planned["geometry"]["coordinates"][0][0]
        lat0 = planned["geometry"]["coordinates"][0][1]
        m_per_lng = 111320 * math.cos(math.radians(lat0))
        worst = max(abs(lng - planned_lng) * m_per_lng for lng, _ in actual["geometry"]["coordinates"])
        self.assertTrue(5.5 < worst < 6.5, f"deviation was {worst:.2f} m")

    def test_at04_sample_evidence_hash_matches_payload(self):
        rec = load("evidence_record.json")
        self.assertRegex(rec["sha256"], r"^[0-9a-f]{64}$")
        expected = hashlib.sha256(rec["sample_payload_text"].encode("utf-8")).hexdigest()
        self.assertEqual(rec["sha256"], expected)

    def test_at05_gnss_points_are_complete(self):
        rec = load("evidence_record.json")
        self.assertGreaterEqual(len(rec["track"]), 2)
        for p in rec["track"]:
            for key in ("lat", "lng", "alt", "acc_m", "t"):
                self.assertIn(key, p)
            datetime.strptime(p["t"], "%Y-%m-%dT%H:%M:%S.%fZ")
        datetime.strptime(rec["captured_at"], "%Y-%m-%dT%H:%M:%S.%fZ")

    def test_at06_ar_pipe_is_valid(self):
        pipe = load("ar_pipe.json")
        self.assertGreaterEqual(len(pipe["vertices"]), 2)
        self.assertLess(pipe["depthM"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
"""


def main() -> None:
    if not (ROOT / "flutter_app").is_dir() or not (ROOT / "react_dashboard").is_dir():
        print("ERROR: run this script inside the geotrace_workspace folder")
        print("       (the folder that contains flutter_app and react_dashboard).")
        print("Current folder:", ROOT)
        sys.exit(1)

    print("Writing files")
    for rel, content in FILES.items():
        write(rel, content)

    print("\nMaking the backend address configurable")
    patch(
        "react_dashboard/src/App.jsx",
        "const API_BASE = 'http://localhost:8000';\n"
        "const USE_BACKEND = false; // set to true once the review endpoint exists",
        "const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';\n"
        "const USE_BACKEND = import.meta.env.VITE_USE_BACKEND === 'true';",
    )
    patch(
        "flutter_app/lib/services/sync_service.dart",
        "static const String baseUrl = 'http://10.0.2.2:8000';",
        "static const String baseUrl =\n"
        "      String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:8000');",
    )

    print("\nDONE. Next: run  python tests/test_sample_data.py")


if __name__ == "__main__":
    main()
