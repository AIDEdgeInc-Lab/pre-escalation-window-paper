"""Check internal links/assets of the static site; optionally probe external links.

Usage: python check_links.py            internal only (exit 1 on any broken internal link)
       python check_links.py --external also probe external URLs; reports BROKEN (HTTP 404/410),
                                        INACCESSIBLE (network/403/other) and OK. Never fails the run on external results.
"""
import re, sys, urllib.request, urllib.error
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urldefrag, urlparse, unquote

ROOT = Path(__file__).resolve().parent
SKIP = {"versions"}  # historical archive: kept byte-for-byte, checked separately by build_version_archive.py


class P(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        for k in ("href", "src"):
            if k in a and a[k]:
                self.refs.append(a[k])


def parse(path):
    p = P()
    p.feed(path.read_text(encoding="utf-8", errors="replace"))
    return p


pages = [f for f in ROOT.rglob("*.html") if not (set(f.relative_to(ROOT).parts) & SKIP) and ".git" not in f.parts]
parsed = {f: parse(f) for f in pages}
broken, external = [], set()
for f, p in parsed.items():
    for ref in p.refs:
        if ref.startswith(("mailto:", "tel:", "data:", "javascript:")):
            continue
        if ref.startswith(("http://", "https://")):
            external.add(ref)
            continue
        url, frag = urldefrag(ref)
        target = f if not url else (ROOT / unquote(url.lstrip("/")) if url.startswith("/") else (f.parent / unquote(url)))
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            broken.append((f.relative_to(ROOT), ref, "missing file"))
        elif frag and target.suffix == ".html":
            t = parsed.get(target) or parse(target)
            if frag not in t.ids:
                broken.append((f.relative_to(ROOT), ref, "missing anchor"))
for b in broken:
    print("BROKEN", *b)
print(f"internal: {len(pages)} pages, {len(broken)} broken")

if "--external" in sys.argv:
    for u in sorted(external):
        try:
            req = urllib.request.Request(u, method="HEAD", headers={"User-Agent": "link-check"})
            code = urllib.request.urlopen(req, timeout=15).status
            print("OK", code, u)
        except urllib.error.HTTPError as e:
            print("BROKEN" if e.code in (404, 410) else "INACCESSIBLE", e.code, u)
        except Exception as e:
            print("INACCESSIBLE", type(e).__name__, u)
    print(f"external: {len(external)} urls probed")
sys.exit(1 if broken else 0)
