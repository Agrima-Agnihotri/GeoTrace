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
