"""Build the permanent version archive under versions/<id>/ from exact historical commits.

Each snapshot is the web-served content of the repository at one commit (git archive), unchanged except for:
  * an "archived version" notice inserted after <body>,
  * <meta name="robots" content="noindex">,
  * an inline favicon link when the page has none (avoids a /favicon.ico 404),
  * root-absolute site links and the demo's "/article/" link re-pointed inside the snapshot (so navigation stays in the archived version),
  * canonical / og:url / JSON-LD-free metadata lines that point at the live host are removed
    (so an archived page is not declared a duplicate of the current one).
Nothing else is rewritten: figures, numbers, claims and limitations stay as they were.

Usage:  python build_version_archive.py            (rebuilds every snapshot listed in VERSIONS)
Adding a release: append an entry to VERSIONS, run, commit versions/<id>/, and update the homepage list.
"""
import io, re, shutil, subprocess, sys, tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VERSIONS = [
    # id, commit, one-line identity of the snapshot, what the notice says
    dict(id="1.0", commit="9f4f42d", date="2026-10-08",
         what="the site as it stood immediately before the 2026-10 corrections (last commit before the correction work began)",
         notice="Its results use the previous model version (superseded rain-coefficient table; the pre-escalation window counts the layer's first WAIT as a lead) and its VERIFY stage did not reliably resolve."),
    dict(id="0.1.0", commit="036498b", date="2026-08-18",
         what="the first commit that contains the article, method and demo pages (the initial public artifact release is commit c9f4517)",
         notice="Its results use the previous model version and predate the data-quality gate and the evidence-based VERIFY stage."),
]
SKIP = re.compile(r"(\.py$|\.md$|^LICENSE|^CITATION\.cff$|^\.gitignore$|^_headers$|^robots\.txt$|^sitemap\.xml$|^404\.html$)")

def banner(v):
    return ('<div role="note" style="margin:0;padding:10px 16px;font:14px/1.45 system-ui,sans-serif;background:#1b1608;color:#f0e4c0;border-bottom:1px solid #8a7335">'
            f'<strong>Archived version {v["id"]}</strong> &mdash; a preserved copy of {v["what"]} ({v["commit"]}, {v["date"]}). '
            f'{v["notice"]} Kept unchanged as historical record. '
            '<a style="color:#ffd76a" href="/">Current version</a> &middot; '
            '<a style="color:#ffd76a" href="https://github.com/AIDEdgeInc-Lab/pre-escalation-window-paper/blob/main/CORRECTIONS.md">What was corrected</a></div>\n')

def rebase(text, v):
    """Root-absolute site links (/method/, /article/#x, /fonts/...) would leave the archive for the CURRENT site; point them at the same path inside the snapshot."""
    pre = f"/versions/{v['id']}"
    return re.sub(r'(href|src)="/(?!/)([^"]*)"', lambda m: f'{m.group(1)}="{pre}/{m.group(2)}"', text)

def process_html(text, v):
    text = rebase(text, v)
    text = re.sub(r'\s*<link[^>]+rel="canonical"[^>]*>', "", text)
    text = re.sub(r'\s*<meta[^>]+property="og:url"[^>]*>', "", text)
    text = re.sub(r"(<head[^>]*>)", r'\1\n<meta name="robots" content="noindex">', text, count=1)
    if 'rel="icon"' not in text:
        text = text.replace("</title>", '</title>\n<link rel="icon" href="data:,">', 1)
    return re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + "\n" + banner(v), text, count=1)

def build(v):
    out = ROOT / "versions" / v["id"]
    if out.exists():
        shutil.rmtree(out)
    raw = subprocess.run(["git", "archive", v["commit"]], cwd=ROOT, check=True, capture_output=True).stdout
    n = 0
    with tarfile.open(fileobj=io.BytesIO(raw)) as tf:
        for m in tf.getmembers():
            if not m.isfile() or SKIP.search(m.name):
                continue
            data = tf.extractfile(m).read()
            dest = out / m.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            if m.name.endswith(".js"):
                data = data.decode("utf8").replace('"/article/"', '"/versions/%s/article/"' % v["id"]).replace('"/method/"', '"/versions/%s/method/"' % v["id"]).replace('href="/method"', 'href="/versions/%s/method/"' % v["id"]).encode("utf8")
            if m.name.endswith(".html"):
                data = process_html(data.decode("utf8"), v).encode("utf8")
            dest.write_bytes(data); n += 1
    print(f"versions/{v['id']}: {n} files from {v['commit']}")

if __name__ == "__main__":
    for v in VERSIONS:
        build(v)
