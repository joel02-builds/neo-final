"""
Neo — Claude API Proxy (Vercel Serverless)
POST /api/chat
"""
from http.server import BaseHTTPRequestHandler
import json, os, urllib.request, urllib.error

MODEL   = 'claude-sonnet-4-6'
API_KEY = os.environ.get('CLAUDE_API_KEY', '')


class handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        pass  # suppress access logs on Vercel

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
        if not API_KEY:
            self.send_json(500, {'error': 'CLAUDE_API_KEY not configured'})
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            body   = self.rfile.read(length)
            data   = json.loads(body)

            payload = json.dumps({
                'model':      MODEL,
                'max_tokens': data.get('max_tokens', 900),
                'system':     data.get('system', ''),
                'messages':   data.get('messages', []),
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
                method='POST',
            )

            with urllib.request.urlopen(req, timeout=60) as resp:
                result = resp.read()
                self.send_response(resp.status)
                self._cors()
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(result)))
                self.end_headers()
                self.wfile.write(result)

        except urllib.error.HTTPError as e:
            result = e.read()
            self.send_response(e.code)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(result)))
            self.end_headers()
            self.wfile.write(result)

        except Exception as e:
            self.send_json(500, {'error': str(e)})
