"""POST /api/save-file — save extracted text as .md in /tmp"""
from http.server import BaseHTTPRequestHandler
import json, os

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
            os.makedirs(TMP, exist_ok=True)
            length  = int(self.headers.get('Content-Length', 0))
            body    = self.rfile.read(length)
            data    = json.loads(body)
            fname   = os.path.basename(data.get('filename', 'extracted.md'))
            content = data.get('content', '')
            with open(os.path.join(TMP, fname), 'w', encoding='utf-8') as f:
                f.write(content)
            self.send_json(200, {'filename': fname, 'path': f'/uploads/{fname}'})
        except Exception as e:
            self.send_json(500, {'error': str(e)})
