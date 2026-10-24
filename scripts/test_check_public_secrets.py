"""Synthetic fixtures; no real credentials or external requests."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch


spec = importlib.util.spec_from_file_location("secret_check", Path(__file__).with_name("check-public-secrets.py"))
scanner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner)


class SecretCheckTests(unittest.TestCase):
    def setUp(self):
        self.google = "AI" + "za" + "Z" * 35
        self.fixtures = {
            "google-api-key": self.google,
            "openai-key": "sk-" + "proj-" + "z" * 40,
            "github-token": "gh" + "p_" + "z" * 36,
            "aws-access-key-id": "AK" + "IA" + "Z" * 16,
            "private-key-pem": "-----BEGIN " + "RSA PRIVATE KEY-----",
        }

    def test_each_credential_format_and_line(self):
        for kind, value in self.fixtures.items():
            with self.subTest(kind=kind):
                self.assertEqual(scanner.scan_text("source.txt", "hello\n" + value), [("source.txt", 2, kind)])

    def test_additional_token_formats(self):
        for value, kind in [
            ("github_" + "pat_" + "x" * 30, "github-token"),
            ("gh" + "o_" + "x" * 30, "github-token"),
            ("AS" + "IA" + "Z" * 16, "aws-access-key-id"),
            ("-----BEGIN " + "OPENSSH PRIVATE KEY-----", "private-key-pem"),
            ("-----BEGIN " + "ENCRYPTED PRIVATE KEY-----", "private-key-pem"),
            ("sk-" + "svcacct-" + "x" * 30, "openai-key"),
        ]:
            with self.subTest(kind=kind):
                self.assertEqual(scanner.scan_text("fixture", value)[0][2], kind)

    def test_only_root_firebase_property_is_allowed(self):
        content = json.dumps({"enabled": True, "firebaseApiKey": self.google})
        self.assertEqual(scanner.scan_text("chat-config.json", content), [])
        for path in ["sub/chat-config.json", "chat-config.json.bak", "other.json"]:
            self.assertEqual(len(scanner.scan_text(path, content)), 1)

    def test_other_values_in_config_still_fail(self):
        content = json.dumps({"firebaseApiKey": self.google, "apiKey": self.google})
        self.assertEqual(len(scanner.scan_text("chat-config.json", content)), 1)
        content = json.dumps({"nested": {"firebaseApiKey": self.google}})
        self.assertEqual(len(scanner.scan_text("chat-config.json", content)), 1)

    def test_review_firebase_exception_keeps_exact_path_and_property(self):
        content = json.dumps({"enabled": True, "firebaseApiKey": self.google})
        self.assertEqual(scanner.scan_text("review-rc4/chat-config.json", content), [])
        for path in ["review-rc3/chat-config.json", "review-rc4/sub/chat-config.json", "review-rc4/chat-config.json.bak"]:
            self.assertEqual(len(scanner.scan_text(path, content)), 1)
        extra = json.dumps({"firebaseApiKey": self.google, "secret": self.fixtures["openai-key"]})
        self.assertEqual(scanner.scan_text("review-rc4/chat-config.json", extra)[0][2], "openai-key")
        duplicate = '{"firebaseApiKey":"' + self.google + '","firebaseApiKey":"' + self.google + '"}'
        self.assertEqual(len(scanner.scan_text("review-rc4/chat-config.json", duplicate)), 1)

    def test_review_maps_exception_keeps_exact_path_and_shape(self):
        config = "window.FjordGoogleMapConfig = Object.freeze({enabled:true, provider:'google', apiKey:'" + self.google + "'});\n"
        self.assertEqual(scanner.scan_text("review-rc4/google-maps-config.js", config), [])
        for path in ["review-rc3/google-maps-config.js", "review-rc4/sub/google-maps-config.js", "review-rc4/other.js"]:
            self.assertEqual(len(scanner.scan_text(path, config)), 1)
        self.assertEqual(len(scanner.scan_text("review-rc4/google-maps-config.js", config + self.google)), 2)
        self.assertEqual(len(scanner.scan_text("review-rc4/google-maps-config.js", config.replace("provider:'google'", "provider:'other'"))), 1)
    def test_maps_browser_key_exception_is_narrow(self):
        config = "window.FjordGoogleMapConfig = Object.freeze({enabled:true, apiKey:'" + self.google + "'});\n"
        self.assertEqual(scanner.scan_text("google-maps-config.js", config), [])
        google_only = config.replace("enabled:true, ", "enabled:true, provider:'google', ")
        self.assertEqual(scanner.scan_text("google-maps-config.js", google_only), [])
        self.assertEqual(len(scanner.scan_text("google-maps-config.js", google_only.replace("provider:'google'", "provider:'other'"))), 1)
        self.assertEqual(len(scanner.scan_text("other.js", config)), 1)
        self.assertEqual(len(scanner.scan_text("google-maps-config.js", config + self.google)), 2)
        self.assertEqual(len(scanner.scan_text("google-maps-config.js", "/* " + self.google + " */\n" + config)), 1)

    def test_invalid_or_duplicate_json_has_no_exception(self):
        duplicate = '{"firebaseApiKey":"' + self.google + '","firebaseApiKey":"' + self.google + '"}'
        self.assertEqual(len(scanner.scan_text("chat-config.json", duplicate)), 1)
        self.assertEqual(len(scanner.scan_text("chat-config.json", '{"firebaseApiKey":"' + self.google + '"')), 1)

    def test_ordinary_text_and_short_placeholders_pass(self):
        self.assertEqual(scanner.scan_text("readme", "API_KEY=example; firebaseApiKey=fixture-public-key; sk-example"), [])

    def test_only_git_tracked_files_are_scanned(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q", directory], check=True)
            (root / "tracked.txt").write_text(self.google, encoding="utf-8")
            (root / "untracked.txt").write_text(self.fixtures["openai-key"], encoding="utf-8")
            subprocess.run(["git", "-C", directory, "add", "tracked.txt"], check=True)
            self.assertEqual(scanner.scan_repository(root), [("tracked.txt", 1, "google-api-key")])

    def test_output_contains_metadata_only(self):
        output = io.StringIO()
        with patch.object(scanner, "scan_repository", return_value=[("config.json", 8, "google-api-key")]), contextlib.redirect_stdout(output):
            self.assertEqual(scanner.main(), 1)
        self.assertEqual(output.getvalue(), '"config.json":8:google-api-key\n')
        for value in self.fixtures.values():
            self.assertNotIn(value, output.getvalue())


if __name__ == "__main__":
    unittest.main()
