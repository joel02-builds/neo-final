"""
Neo Final — All-in-One Python Server
Port 3337  ·  Static Files + Claude Proxy + Upload
Starten: python server.py
"""

import http.server
import urllib.request
import urllib.error
import urllib.parse
import json
import os
import sys
import io
import mimetypes

PORT    = 3337
API_KEY = os.environ.get('CLAUDE_API_KEY', '')
MODEL   = 'claude-sonnet-4-6'
PUBLIC  = os.path.join(os.path.dirname(__file__), 'public')
UPLOADS = os.path.join(os.path.dirname(__file__), 'uploads')

os.makedirs(UPLOADS, exist_ok=True)


class NeoHandler(http.server.BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        print(f'  [{self.command}] {self.path}  {args[1] if len(args) > 1 else ""}')

    def send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    # ── GET ─────────────────────────────────────────────────
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path

        # API: list uploads
        if path == '/api/uploads':
            try:
                files = [f for f in os.listdir(UPLOADS) if not f.startswith('.')]
                self.send_json(200, files)
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        # Serve uploaded files
        if path.startswith('/uploads/'):
            fname  = urllib.parse.unquote(path[9:])
            fpath  = os.path.join(UPLOADS, os.path.basename(fname))
            self._serve_file(fpath)
            return

        # Static files
        if path == '/':
            path = '/index.html'

        fpath = os.path.join(PUBLIC, path.lstrip('/'))
        # Prevent directory traversal
        fpath = os.path.realpath(fpath)
        if not fpath.startswith(os.path.realpath(PUBLIC)):
            self.send_response(403)
            self.end_headers()
            return

        if os.path.isdir(fpath):
            fpath = os.path.join(fpath, 'index.html')

        if not os.path.exists(fpath):
            # SPA fallback
            fpath = os.path.join(PUBLIC, 'index.html')

        self._serve_file(fpath)

    def _serve_file(self, fpath):
        if not os.path.isfile(fpath):
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not found')
            return
        mime, _ = mimetypes.guess_type(fpath)
        mime = mime or 'application/octet-stream'
        with open(fpath, 'rb') as f:
            data = f.read()
        self.send_response(200)
        self._cors()
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        # SVG needs proper type for icons
        if fpath.endswith('.svg'):
            self.send_header('Content-Type', 'image/svg+xml')
        self.end_headers()
        self.wfile.write(data)

    # ── POST ────────────────────────────────────────────────
    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path

        if path == '/api/chat':
            self._handle_chat()
        elif path == '/api/upload':
            self._handle_upload()
        elif path == '/api/save-file':
            self._handle_save_file()
        elif path.startswith('/api/delete/'):
            fname = urllib.parse.unquote(path[12:])
            fpath = os.path.join(UPLOADS, os.path.basename(fname))
            if os.path.isfile(fpath):
                os.remove(fpath)
                self.send_json(200, {'ok': True})
            else:
                self.send_json(404, {'error': 'File not found'})
        else:
            self.send_json(404, {'error': 'Not found'})

    def _handle_chat(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            data   = json.loads(body)

            messages   = data.get('messages', [])
            system_msg = data.get('system', '')
            max_tokens = data.get('max_tokens', 900)

            payload = json.dumps({
                'model':      MODEL,
                'max_tokens': max_tokens,
                'system':     system_msg,
                'messages':   messages,
            }).encode()

            req = urllib.request.Request(
                'https://api.anthropic.com/v1/messages',
                data    = payload,
                headers = {
                    'Content-Type':      'application/json',
                    'x-api-key':         API_KEY,
                    'anthropic-version': '2023-06-01',
                    'Content-Length':    str(len(payload)),
                },
                method = 'POST',
            )

            with urllib.request.urlopen(req, timeout=60) as resp:
                result = resp.read()
                self.send_response(resp.status)
                self._cors()
                self.send_header('Content-Type',   'application/json')
                self.send_header('Content-Length', str(len(result)))
                self.end_headers()
                self.wfile.write(result)

        except urllib.error.HTTPError as e:
            result = e.read()
            self.send_response(e.code)
            self._cors()
            self.send_header('Content-Type',   'application/json')
            self.send_header('Content-Length', str(len(result)))
            self.end_headers()
            self.wfile.write(result)

        except Exception as e:
            print(f'  [Chat] ERROR: {e}')
            self.send_json(500, {'error': str(e)})

    def _handle_chat_stream(self):
        # Streaming via SSE — simplified: collect full then send
        self._handle_chat()

    def _handle_upload(self):
        try:
            ct = self.headers.get('Content-Type', '')
            if 'multipart/form-data' not in ct:
                self.send_json(400, {'error': 'Multipart required'})
                return

            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)

            # Parse boundary
            boundary = None
            for part in ct.split(';'):
                part = part.strip()
                if part.startswith('boundary='):
                    boundary = part[9:].strip('"').encode()
                    break

            if not boundary:
                self.send_json(400, {'error': 'No boundary'})
                return

            filename, filedata = self._parse_multipart(body, boundary)
            if not filename or filedata is None:
                self.send_json(400, {'error': 'No file'})
                return

            # Save
            safe_name = os.path.basename(filename)
            dest = os.path.join(UPLOADS, safe_name)
            with open(dest, 'wb') as f:
                f.write(filedata)

            self.send_json(200, {'filename': safe_name, 'path': f'/uploads/{safe_name}'})

        except Exception as e:
            print(f'  [Upload] ERROR: {e}')
            self.send_json(500, {'error': str(e)})

    def _handle_save_file(self):
        """Save plain-text content as a file in /uploads."""
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            data   = json.loads(body)
            fname  = os.path.basename(data.get('filename', 'extracted.md'))
            content = data.get('content', '')
            dest = os.path.join(UPLOADS, fname)
            with open(dest, 'w', encoding='utf-8') as f:
                f.write(content)
            self.send_json(200, {'filename': fname, 'path': f'/uploads/{fname}'})
        except Exception as e:
            self.send_json(500, {'error': str(e)})

    def _parse_multipart(self, body, boundary):
        """Simple multipart parser."""
        delim = b'--' + boundary
        parts = body.split(delim)
        for part in parts[1:]:
            if part.strip() in (b'', b'--', b'--\r\n'):
                continue
            # Split headers from body
            if b'\r\n\r\n' in part:
                header_raw, content = part.split(b'\r\n\r\n', 1)
            elif b'\n\n' in part:
                header_raw, content = part.split(b'\n\n', 1)
            else:
                continue

            headers = header_raw.decode('utf-8', errors='replace')
            # Strip trailing boundary
            if content.endswith(b'\r\n'):
                content = content[:-2]

            if 'filename=' in headers:
                # Extract filename
                fn = ''
                for seg in headers.split(';'):
                    seg = seg.strip()
                    if seg.startswith('filename='):
                        fn = seg[9:].strip('"\'')
                        break
                if fn:
                    return fn, content

        return None, None


def run():
    mimetypes.add_type('image/svg+xml', '.svg')
    mimetypes.add_type('application/javascript', '.js')
    mimetypes.add_type('text/css', '.css')
    mimetypes.add_type('application/manifest+json', '.webmanifest')

    server = http.server.ThreadingHTTPServer(('', PORT), NeoHandler)

    print()
    print('  NEO - Coach Terminal')
    print('  ====================')
    print()
    print(f'  Neo läuft auf  http://localhost:{PORT}')
    print(f'  Claude:        {MODEL}')
    print(f'  Uploads:       {UPLOADS}')
    print()
    print('  Stoppen: Ctrl+C')
    print()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  [Neo] Gestoppt.')
        sys.exit(0)


if __name__ == '__main__':
    run()
