FJORD FLOW — PUBLIC DATA WORKSPACE

fjord-public.sqlite contains only the reviewed public catalogue, BUA directory
and shopping centres. Visitor accounts, email addresses, messages, API keys,
private Afonya skills, moderation and usage records are NOT source inputs.

The live website continues to read its fast static JSON. SQLite is the local
editing/review/search workspace; it does not add a per-visitor cloud query.
The existing private Cloudflare D1 remains the chat's separate backend.

Standard-library tools (no package installation or API key):
  python scripts/public_catalogue_db.py build
  python scripts/public_catalogue_db.py verify
  python scripts/public_catalogue_db.py search "Tromso"
  python scripts/public_catalogue_db.py nearby 60.3592 10.5728 --radius 20 --category cafe
  python scripts/test_public_catalogue_db.py

After modifying any of the three public JSON source files, rebuild this snapshot
and commit both the database and report. CI rejects a stale snapshot. Query
commands open SQLite read-only; search input is parameterized and FTS operators
are treated as text. Nearby lookup uses real coordinates and a kilometre radius.

public-data-report.json lists structure/coverage gaps. It is NOT a live check
of opening hours, website availability, webcams or business operation.
Unknown hours remain JSON null; they do not mean a place is closed.

Photos stay in their existing local files, retaining source and licence fields.
Build uses a temporary SQLite file and replaces the final file only after
integrity and relationship checks. Source hashes use canonical JSON, so Windows
and Linux line endings do not cause a false stale-data failure.
