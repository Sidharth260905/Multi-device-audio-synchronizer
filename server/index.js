const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, '../public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });

// rooms[code] = { host: ws, listeners: { id: ws } }
const rooms = {};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

wss.on('connection', (ws) => {
  ws._id = uid();
  ws._room = null;
  ws._role = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'create') {
      const code = msg.room.toUpperCase();
      rooms[code] = { host: ws, listeners: {} };
      ws._room = code;
      ws._role = 'host';
      ws.send(JSON.stringify({ type: 'created', room: code }));
      console.log(`[room] created ${code}`);
    }

    else if (msg.type === 'join') {
      const code = msg.room.toUpperCase();
      const room = rooms[code];
      if (!room) { ws.send(JSON.stringify({ type: 'error', message: 'Room not found' })); return; }
      ws._room = code;
      ws._role = 'listener';
      ws._name = msg.name || 'Listener';
      room.listeners[ws._id] = ws;
      // tell host someone joined
      send(room.host, { type: 'joined', from: ws._id, name: ws._name });
      ws.send(JSON.stringify({ type: 'ready', room: code }));
      console.log(`[room] ${ws._id} joined ${code} (total: ${Object.keys(room.listeners).length})`);
    }

    else if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice') {
      const code = ws._room;
      const room = rooms[code];
      if (!room) return;

      if (ws._role === 'host') {
        const target = room.listeners[msg.to];
        if (target) send(target, { ...msg, from: ws._id });
      } else {
        send(room.host, { ...msg, from: ws._id });
      }
    }
  });

  ws.on('close', () => {
    const code = ws._room;
    const room = rooms[code];
    if (!room) return;

    if (ws._role === 'host') {
      // notify all listeners host is gone
      Object.values(room.listeners).forEach(l => send(l, { type: 'host-left' }));
      delete rooms[code];
      console.log(`[room] closed ${code} (host left)`);
    } else {
      delete room.listeners[ws._id];
      send(room.host, { type: 'left', from: ws._id });
      console.log(`[room] ${ws._id} left ${code}`);
    }
  });
});

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

server.listen(PORT, () => {
  console.log(`Silent Disco running on http://localhost:${PORT}`);
});
