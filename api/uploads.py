"""GET /api/uploads — list uploaded files (stored in /tmp on Vercel)"""
from http.server import BaseHTTPRequestHandler
import json, os

TMP = '/tmp/neo_uploads'


class handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args): pass

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
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

    def do_GET(self):
        try:
            os.makedirs(TMP, exist_ok=True)
            files = [f for f in os.listdir(TMP) if not f.startswith('.')]
            self.send_json(200, files)
        except Exception as e:
            self.send_json(200, [])
