const express = require('express');
const multer  = require('multer');
const fetch   = require('node-fetch');
const path    = require('path');
const fs      = require('fs');
const config  = require('./config');

const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads') });

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Claude API Proxy ──────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.MODEL,
        max_tokens: max_tokens || config.MAX_TOKENS,
        system: system || '',
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error('API error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ─── Streaming Proxy ───────────────────────────────────────────────────────
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.MODEL,
        max_tokens: max_tokens || config.MAX_TOKENS,
        system: system || '',
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: err })}\n\n`);
      return res.end();
    }

    response.body.on('data', chunk => res.write(chunk));
    response.body.on('end', () => res.end());
    response.body.on('error', () => res.end());
  } catch (e) {
    console.error('Stream error:', e);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
});

// ─── File Upload ───────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei' });

  const original = req.file.originalname;
  const dest     = path.join(__dirname, 'uploads', original);

  fs.rename(req.file.path, dest, err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ filename: original, path: `/uploads/${original}` });
  });
});

app.get('/api/uploads', (req, res) => {
  const dir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  res.json(files);
});

// ─── Serve uploads ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── SPA Fallback ──────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(config.PORT, () => {
  console.log(`\n  ██╗   ██╗███████╗ ██████╗`);
  console.log(`  ███╗  ██║██╔════╝██╔═══██╗`);
  console.log(`  ████╗ ██║█████╗  ██║   ██║`);
  console.log(`  ██╔██╗██║██╔══╝  ██║   ██║`);
  console.log(`  ██║╚████║███████╗╚██████╔╝`);
  console.log(`  ╚═╝ ╚═══╝╚══════╝ ╚═════╝ \n`);
  console.log(`  Neo läuft auf http://localhost:${config.PORT}`);
  console.log(`  Claude: ${config.MODEL}\n`);
});
