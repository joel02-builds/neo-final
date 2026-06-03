"""POST /api/upload — receive file, store in /tmp on Vercel"""
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
            ct = self.headers.get('Content-Type', '')
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)

            boundary = None
            for part in ct.split(';'):
                part = part.strip()
                if part.startswith('boundary='):
                    boundary = part[9:].strip('"').encode()
                    break

            if not boundary:
                self.send_json(400, {'error': 'No boundary'})
                return

            filename, filedata = self._parse(body, boundary)
            if not filename:
                self.send_json(400, {'error': 'No file'})
                return

            safe = os.path.basename(filename)
            with open(os.path.join(TMP, safe), 'wb') as f:
                f.write(filedata)

            self.send_json(200, {'filename': safe, 'path': f'/uploads/{safe}'})

        except Exception as e:
            self.send_json(500, {'error': str(e)})

    def _parse(self, body, boundary):
        delim = b'--' + boundary
        for part in body.split(delim)[1:]:
            if part.strip() in (b'', b'--', b'--\r\n'):
                continue
            sep = b'\r\n\r\n' if b'\r\n\r\n' in part else b'\n\n'
            if sep not in part:
                continue
            headers_raw, content = part.split(sep, 1)
            if content.endswith(b'\r\n'):
                content = content[:-2]
            headers = headers_raw.decode('utf-8', errors='replace')
            if 'filename=' in headers:
                fn = ''
                for seg in headers.split(';'):
                    seg = seg.strip()
                    if seg.startswith('filename='):
                        fn = seg[9:].strip('"\'')
                        break
                if fn:
                    return fn, content
        return None, None
