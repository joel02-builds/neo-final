"""POST /api/delete/:file — remove file from /tmp"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.parse

TMP = '/tmp/neo_uploads'


class handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args): pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        try:
            # Extract filename from path: /api/delete/filename.md
            path  = urllib.parse.urlparse(self.path).path
            fname = os.path.basename(urllib.parse.unquote(path))
            fpath = os.path.join(TMP, fname)
            if os.path.isfile(fpath):
                os.remove(fpath)
            self.send_json(200, {'ok': True})
        except Exception as e:
            self.send_json(500, {'error': str(e)})
