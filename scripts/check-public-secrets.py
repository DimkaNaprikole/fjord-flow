#!/usr/bin/env python3
"""Limited credential-format check of tracked working-tree files, not a security audit.

Never print matched values. Firebase's browser configuration is public by design;
its Google Cloud API restrictions must still be reviewed separately.
"""
import json
from pathlib import Path
import re
import subprocess
import sys


PATTERNS = {
    "google-api-key": re.compile(r"AIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])"),
    "openai-key": re.compile(r"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}"),
    "github-token": re.compile(r"\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}"),
    "aws-access-key-id": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "private-key-pem": re.compile(r"-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----"),
}


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON property")
        result[key] = value
    return result


def firebase_public_span(path, content):
    """Allow only the exact string value of the root configuration property."""
    if path != "chat-config.json":
        return None
    try:
        config = json.loads(content, object_pairs_hook=unique_object)
    except (ValueError, TypeError):
        return None
    if not isinstance(config, dict) or not isinstance(config.get("firebaseApiKey"), str):
        return None
    # Reject nested/lookalike property matches, escapes and multiple occurrences.
    matches = list(re.finditer(r'"firebaseApiKey"\s*:\s*"(AIza[0-9A-Za-z_-]{35})"', content))
    if len(matches) != 1 or matches[0].group(1) != config["firebaseApiKey"]:
        return None
    return matches[0].span(1)


def scan_text(path, content):
    allowed = firebase_public_span(path, content)
    # This browser Maps key is public by design. Google Cloud enforces its
    # HTTP-referrer and Maps-JavaScript-only restrictions, not this scanner.
    # Allow just the single key value in the exact root configuration shape.
    if path == "google-maps-config.js":
        config = re.fullmatch(r"(?:/\*[\s\S]*?\*/\s*)?window\.FjordGoogleMapConfig = Object\.freeze\(\{enabled:(?:true|false), apiKey:'(AIza[0-9A-Za-z_-]{35})'\}\);\s*", content)
        if config:
            allowed = config.span(1)
    findings = set()
    for kind, pattern in PATTERNS.items():
        for match in pattern.finditer(content):
            if kind == "google-api-key" and match.span() == allowed:
                continue
            line = content.count("\n", 0, match.start()) + 1
            findings.add((path, line, kind))
    return sorted(findings)


def scan_repository(root):
    listing = subprocess.run(
        ["git", "-C", str(root), "ls-files", "-z"],
        check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    ).stdout
    findings = []
    for raw_path in listing.split(b"\0"):
        if not raw_path:
            continue
        path = raw_path.decode("utf-8", errors="surrogateescape")
        target = root / path
        if target.is_symlink():
            findings.append((path, 0, "unscanned-symlink"))
            continue
        try:
            content = target.read_bytes().decode("utf-8", errors="replace")
        except OSError:
            findings.append((path, 0, "unreadable-tracked-file"))
            continue
        findings.extend(scan_text(path, content))
    return sorted(findings)


def main():
    root = Path(__file__).resolve().parents[1]
    try:
        findings = scan_repository(root)
    except (OSError, subprocess.CalledProcessError):
        print(".:0:tracked-file-list-unavailable")
        return 2
    for path, line, kind in findings:
        # JSON escaping stops malicious filenames from injecting output lines.
        print(f"{json.dumps(path, ensure_ascii=True)}:{line}:{kind}")
    return int(bool(findings))


if __name__ == "__main__":
    sys.exit(main())
