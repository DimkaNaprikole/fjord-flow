import importlib.util
import json
import sqlite3
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("catalogue_db", Path(__file__).with_name("public_catalogue_db.py"))
catalogue = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalogue)

class PublicDatabaseTests(unittest.TestCase):
    def test_snapshot_matches_all_public_sources(self):
        report = catalogue.verify()
        self.assertEqual(report["total"], sum(report["datasets"].values()))
        self.assertEqual(report["datasets"]["catalogue"], len(catalogue.read("norway-catalog.json")))
        self.assertFalse(report["private_data_included"])

    def test_queries_cannot_modify_the_export(self):
        with catalogue.connect() as db:
            with self.assertRaises(sqlite3.OperationalError):
                db.execute("DELETE FROM places")

    def test_search_handles_norwegian_characters_and_fts_operators(self):
        results = catalogue.search("Tromso")
        self.assertTrue(any("Tromsø" in r["town"] or "Tromsø" in r["name"] for r in results))
        self.assertEqual(catalogue.search("\" OR * ("), catalogue.search("or"))
        self.assertTrue(catalogue.search("Torghatten"))
        self.assertLessEqual(len(catalogue.search("Gran", 1000)), 50)

    def test_gran_nearby_results_use_actual_distance_and_category(self):
        rows = catalogue.nearby(60.3592, 10.5728, 20, "cafe")
        self.assertTrue(rows)
        self.assertTrue(all(r["category"] == "cafe" and r["distance_km"] <= 20 for r in rows))
        self.assertEqual([r["distance_km"] for r in rows], sorted(r["distance_km"] for r in rows))
        self.assertFalse(any("Tromsø" in r["name"] for r in rows))
        self.assertEqual(catalogue.nearby(0, 0, 20), [])

    def test_missing_bua_coordinates_are_not_fabricated(self):
        report = catalogue.verify()
        expected = {r["id"] for r in catalogue.read("bua-locations.json")["locations"] if r.get("latitude") is None or r.get("longitude") is None}
        self.assertEqual({r["key"].split(":", 1)[1] for r in report["unmapped"]}, expected)

    def test_unknown_hours_remain_null_not_closed(self):
        with catalogue.connect() as db:
            row = db.execute("SELECT hours_json,verified_hours FROM places WHERE key=?", ("catalogue:alta-museum-rock-art",)).fetchone()
            self.assertIsNone(json.loads(row["hours_json"]))
            self.assertEqual(row["verified_hours"], 0)

    def test_invalid_geography_is_rejected(self):
        for args in [(91, 10), (60, float("nan")), (60, 181)]:
            with self.assertRaises(ValueError): catalogue.nearby(*args)
        with self.assertRaises(ValueError): catalogue.nearby(60, 10, category="tickets")

if __name__ == "__main__": unittest.main()
