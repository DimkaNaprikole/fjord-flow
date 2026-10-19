"""Offline indexing guardrails; no analytics, external requests or fabricated URLs.

Run: python scripts/test_seo.py
Google only reads /robots.txt at the origin root. Sitemap submission is done
through Search Console; this project does not add an inert subdirectory robots.
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://dimkanaprikole.github.io/fjord-flow/"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class Head(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.meta, self.canonicals, self.title = {}, [], ""
        self.in_title = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta":
            self.meta[(attrs.get("name") or attrs.get("property") or "").lower()] = attrs.get("content", "")
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonicals.append(attrs.get("href", ""))
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


class SearchIndexingTests(unittest.TestCase):
    def test_sitemap_contains_real_crawlable_public_documents(self):
        tree = ET.parse(ROOT / "sitemap.xml")
        self.assertEqual(tree.getroot().tag, "{" + NS["s"] + "}urlset")
        locs = [node.text.strip() for node in tree.findall("s:url/s:loc", NS)]
        self.assertIn(BASE, locs)
        self.assertEqual(len(locs), len(set(locs)), "Duplicate canonical URLs")
        for loc in locs:
            with self.subTest(url=loc):
                self.assertTrue(loc.startswith(BASE), "Only this public GitHub Pages project")
                parts = urlsplit(loc)
                self.assertFalse(parts.query, "No accounts, tracking or ticket query parameters")
                self.assertFalse(parts.fragment, "Hash UI sections are not separate crawlable pages")
                relative = unquote(parts.path[len(urlsplit(BASE).path):])
                self.assertNotRegex(relative.lower(), r"(?:^|/)(?:_|\.|admin|owner|login|auth|geo-diagnostics|catalogue-data-report|norway-expansion-plan|developer-card|lena)")
                local = (ROOT / (relative or "index.html")).resolve()
                self.assertTrue(local.is_relative_to(ROOT), "No escaped source path")
                self.assertTrue(local.is_file(), "Sitemap URL must have an existing static document")
                self.assertEqual(local.suffix, ".html")
                head = Head(local.read_text(encoding="utf-8"))
                self.assertTrue(head.title.strip(), "Discoverable document requires a title")
                self.assertNotRegex(head.meta.get("robots", "").lower(), r"\b(?:noindex|none)\b")
                self.assertNotRegex(head.meta.get("googlebot", "").lower(), r"\b(?:noindex|none)\b")
                if head.canonicals:
                    self.assertEqual(head.canonicals, [loc], "Sitemap must use the document canonical")
        # No invented update dates, per-locale aliases or gallery/event fragments.
        self.assertFalse(tree.findall("s:url/s:lastmod", NS))

    def test_homepage_has_one_stable_canonical_and_search_metadata(self):
        head = Head((ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertEqual(head.canonicals, [BASE])
        self.assertIn("FJORD", head.title.upper())
        self.assertGreaterEqual(len(head.meta.get("description", "").strip()), 40)
        self.assertNotRegex(head.meta.get("robots", "").lower(), r"\b(?:noindex|none)\b")

    def test_existing_owner_and_diagnostic_shells_stay_noindex(self):
        for filename in ("admin.html", "owner-inbox.html", "geo-diagnostics.html"):
            with self.subTest(filename=filename):
                head = Head((ROOT / filename).read_text(encoding="utf-8"))
                self.assertRegex(head.meta.get("robots", "").lower(), r"\bnoindex\b")


if __name__ == "__main__":
    unittest.main()
