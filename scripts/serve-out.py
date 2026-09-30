"""Serve the static export (`out/`) under the GH Pages basePath, exactly as it ships.

    py scripts/serve-out.py [port]   ->  http://127.0.0.1:<port>/wuwa-dashboard-next/

Visual QA for a production build: raw `next dev` is off-limits on the Windows studio box
(Turbopack node-worker fork-storm, vercel/next.js #92978). Build first — ideally under
safe-next.ps1 — then serve what it wrote. Ported from zzz-dashboard-next 2026-09-29.
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out")
BASE = "/wuwa-dashboard-next"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=OUT, **kw)

    def translate_path(self, path):
        if path.startswith(BASE):
            path = path[len(BASE):] or "/"
        return super().translate_path(path)

    def end_headers(self):
        # Assets share URLs across rebuilds and SimpleHTTP sends no Cache-Control,
        # so a plain refresh can show stale art without this.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s\n" % (fmt % args))
        sys.stdout.flush()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4375
print(f"serving {os.path.normpath(OUT)} at http://127.0.0.1:{port}{BASE}/", flush=True)
ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
