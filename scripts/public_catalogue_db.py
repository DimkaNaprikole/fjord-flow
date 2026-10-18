"""Public catalogue workspace: reproducible SQLite, FTS search, nearby lookup and review queue.

Only the three explicitly listed public files are read. No Worker database, accounts,
email addresses, tokens, conversations or local settings enter this export.
Python standard library only; no service, API key or paid request is needed.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import re
import sqlite3
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ("norway-catalog.json", "bua-locations.json", "shopping-centres.json")
DB_PATH = ROOT / "data" / "fjord-public.sqlite"
LANGUAGES = ("nb", "en", "uk", "sv", "da")
SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE places(
 key TEXT PRIMARY KEY, id TEXT NOT NULL, dataset TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('cafe','cabin','sauna','rest','equipment','shopping')),
 name TEXT NOT NULL, town TEXT NOT NULL, county TEXT NOT NULL, municipality TEXT NOT NULL,
 latitude REAL CHECK(latitude BETWEEN -90 AND 90), longitude REAL CHECK(longitude BETWEEN -180 AND 180),
 website TEXT NOT NULL, source TEXT NOT NULL, checked TEXT NOT NULL,
 hours_json TEXT NOT NULL CHECK(json_valid(hours_json)), verified_hours INTEGER NOT NULL CHECK(verified_hours IN (0,1)),
 UNIQUE(dataset,id),CHECK((latitude IS NULL)=(longitude IS NULL))
);
CREATE INDEX places_county_category ON places(county,category);
CREATE INDEX places_position ON places(latitude,longitude);
CREATE INDEX places_checked ON places(checked);
CREATE TABLE translations(place_key TEXT NOT NULL REFERENCES places(key),language TEXT NOT NULL,
 description TEXT NOT NULL,hours_note TEXT NOT NULL,PRIMARY KEY(place_key,language));
CREATE TABLE photos(place_key TEXT NOT NULL REFERENCES places(key),position INTEGER NOT NULL,
 src TEXT NOT NULL,credit TEXT NOT NULL,license TEXT NOT NULL,license_url TEXT NOT NULL,
 source TEXT NOT NULL,PRIMARY KEY(place_key,position));
CREATE TABLE shops(place_key TEXT NOT NULL REFERENCES places(key),name TEXT NOT NULL,url TEXT NOT NULL,
 PRIMARY KEY(place_key,name));
CREATE TABLE review_queue(place_key TEXT NOT NULL REFERENCES places(key),reason TEXT NOT NULL,
 PRIMARY KEY(place_key,reason));
CREATE VIRTUAL TABLE place_search USING fts5(key UNINDEXED,name,location,description,
 tokenize='unicode61 remove_diacritics 2');
"""

def read(name):
    return json.loads((ROOT / name).read_text(encoding="utf-8-sig"))

def fingerprint():
    return {name: hashlib.sha256(json.dumps(read(name), ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest() for name in SOURCES}

def fold(text):
    text = str(text).casefold().replace("ø", "o").replace("æ", "ae").replace("å", "a")
    return "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))

def localized(value, language):
    return value if isinstance(value, str) else ((value or {}).get(language) or "")

def records():
    for row in read(SOURCES[0]):
        yield "catalogue", row
    for row in read(SOURCES[1])["locations"]:
        yield "bua", row
    for row in read(SOURCES[2]):
        yield "shopping", row

def connect(path=DB_PATH):
    # All query commands are read-only, even when a path accidentally points elsewhere.
    db = sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)
    db.row_factory = sqlite3.Row
    return db

def build():
    DB_PATH.parent.mkdir(exist_ok=True)
    staged = DB_PATH.with_suffix(".building.sqlite")
    if staged.exists():
        staged.unlink()
    db = sqlite3.connect(staged)
    try:
        db.executescript(SCHEMA)
        with db:
            db.executemany("INSERT INTO metadata VALUES (?,?)", [("schema_version", "1"), ("source_hashes", json.dumps(fingerprint(), sort_keys=True))])
            for dataset, r in records():
                key = dataset + ":" + r["id"]
                lat, lon = r.get("latitude"), r.get("longitude")
                valid = all(isinstance(v, (float, int)) and not isinstance(v, bool) and math.isfinite(v) for v in (lat, lon)) and abs(lat) <= 90 and abs(lon) <= 180
                if not valid:
                    lat = lon = None
                hours = r.get("openingHours")
                verified = bool(hours.get("verified")) if isinstance(hours, dict) else bool(dataset == "bua" and any(h.get("isActive") and h.get("openingTime") and h.get("closingTime") for h in (hours or [])))
                county = str(r.get("county") or "").strip()
                if county.casefold() == "troms": county = "Troms"
                if county.casefold() == "finnmark": county = "Finnmark"
                values = (key, r["id"], dataset, r["category"], r["name"], (r.get("town") or ""), county, (r.get("municipality") or ""), lat, lon, (r.get("website") or ""), r.get("source") or (r.get("website") or ""), (r.get("checked") or ""), json.dumps(hours, ensure_ascii=False), int(verified))
                db.execute("INSERT INTO places VALUES (" + ",".join("?" for _ in values) + ")", values)
                descriptions = []
                for language in LANGUAGES:
                    description, note = localized(r.get("description"), language), localized(r.get("hoursNote"), language)
                    if description or note:
                        db.execute("INSERT INTO translations VALUES (?,?,?,?)", (key, language, description, note))
                        descriptions.append(description)
                for i, p in enumerate(r.get("gallery") or []):
                    db.execute("INSERT INTO photos VALUES (?,?,?,?,?,?,?)", (key, i, (p.get("src") or ""), (p.get("credit") or ""), (p.get("license") or ""), (p.get("licenseUrl") or ""), (p.get("source") or "")))
                for shop in r.get("stores") or []:
                    db.execute("INSERT INTO shops VALUES (?,?,?)", (key, shop["name"], shop["url"]))
                location = " ".join(str(r.get(k) or "") for k in ("town", "region", "county", "municipality", "address"))
                search_description = " ".join(descriptions + [s["name"] for s in r.get("stores") or []])
                db.execute("INSERT INTO place_search VALUES (?,?,?,?)", (key, fold(r["name"]), fold(location), fold(search_description)))
                reasons = []
                if lat is None: reasons.append("missing_coordinates")
                if dataset == "catalogue" and r["category"] in ("cafe", "sauna") and not verified: reasons.append("hours_not_verified")
                if dataset == "catalogue" and len(r.get("gallery") or []) < 2: reasons.append("single_photo_gallery")
                if not r.get("checked"): reasons.append("missing_review_date")
                db.executemany("INSERT INTO review_queue VALUES (?,?)", [(key, reason) for reason in reasons])
        assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert not db.execute("PRAGMA foreign_key_check").fetchall()
    finally:
        db.close()
    staged.replace(DB_PATH)
    report = verify()
    (ROOT / "data" / "public-data-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report

def verify():
    with connect() as db:
        if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok": raise ValueError("SQLite integrity check failed")
        if db.execute("PRAGMA foreign_key_check").fetchall(): raise ValueError("Invalid public relationships")
        stored = json.loads(db.execute("SELECT value FROM metadata WHERE key='source_hashes'").fetchone()[0])
        if stored != fingerprint(): raise ValueError("Public database is stale; rebuild from the reviewed JSON files")
        expected = {(dataset + ":" + row["id"]) for dataset, row in records()}
        actual = {row[0] for row in db.execute("SELECT key FROM places")}
        if actual != expected: raise ValueError("Missing or unexpected public records")
        tables = {r[0] for r in db.execute("SELECT name FROM sqlite_schema WHERE type='table'")}
        if tables.intersection({"tickets", "ticket_replies", "visitor_stats", "users", "counters", "answer_cache"}): raise ValueError("Private tables in public export")
        return {"schema_version": 1, "total": len(actual), "datasets": dict(db.execute("SELECT dataset,COUNT(*) FROM places GROUP BY dataset")), "photos": db.execute("SELECT COUNT(*) FROM photos").fetchone()[0], "shops": db.execute("SELECT COUNT(*) FROM shops").fetchone()[0], "review_queue": dict(db.execute("SELECT reason,COUNT(*) FROM review_queue GROUP BY reason")), "review_items": [dict(r) for r in db.execute("SELECT p.key,p.name,q.reason,p.checked,p.source FROM review_queue q JOIN places p ON p.key=q.place_key ORDER BY q.reason,p.name")], "unmapped": [dict(r) for r in db.execute("SELECT key,name FROM places WHERE latitude IS NULL")], "private_data_included": False, "source_hashes": stored}

def search(query, limit=10):
    tokens = re.findall(r"[^\W_]+", fold(query), flags=re.UNICODE)
    if not tokens: return []
    # FTS operators are never taken from input; every token is a quoted literal.
    expression = " AND ".join('"' + token + '"*' for token in tokens[:12])
    with connect() as db:
        return [dict(r) for r in db.execute("SELECT p.key,p.name,p.category,p.town,p.county,p.website FROM place_search f JOIN places p ON p.key=f.key WHERE place_search MATCH ? ORDER BY rank LIMIT ?", (expression, max(1, min(limit, 50))))]

def nearby(lat, lon, radius=20, category=None):
    if not (math.isfinite(lat) and math.isfinite(lon) and -90 <= lat <= 90 and -180 <= lon <= 180 and 0 < radius <= 1000): raise ValueError("Invalid public location or radius")
    if category not in (None, "cafe", "cabin", "sauna", "rest", "equipment", "shopping"): raise ValueError("Unknown category")
    delta = radius / 110.0
    with connect() as db:
        candidates = db.execute("SELECT key,name,category,town,latitude,longitude,website FROM places WHERE latitude BETWEEN ? AND ? AND (? IS NULL OR category=?)", (lat-delta, lat+delta, category, category))
        result = []
        for row in candidates:
            if row["longitude"] is None: continue
            a = math.sin(math.radians(row["latitude"]-lat)/2)**2 + math.cos(math.radians(lat))*math.cos(math.radians(row["latitude"]))*math.sin(math.radians(row["longitude"]-lon)/2)**2
            distance = 6371 * 2 * math.asin(min(1, math.sqrt(a)))
            if distance <= radius: result.append({**dict(row), "distance_km": round(distance, 3)})
        return sorted(result, key=lambda r: (r["distance_km"], r["key"]))

def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("build"); commands.add_parser("verify")
    p = commands.add_parser("search"); p.add_argument("query"); p.add_argument("--limit", type=int, default=10)
    p = commands.add_parser("nearby"); p.add_argument("latitude", type=float); p.add_argument("longitude", type=float); p.add_argument("--radius", type=float, default=20); p.add_argument("--category")
    args = parser.parse_args()
    result = build() if args.command == "build" else verify() if args.command == "verify" else search(args.query,args.limit) if args.command == "search" else nearby(args.latitude,args.longitude,args.radius,args.category)
    print(json.dumps(result, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
