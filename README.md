# 🎧 Silent Disco

Stream audio from one device to **unlimited listeners** over WebRTC.  
One laptop plays a video — everyone hears it through their own earbuds.

---

## How it works

```
Host (laptop) ──► Signaling Server ──► Listener 1 (phone)
                                   ──► Listener 2 (phone)
                                   ──► Listener 3 (laptop)
                                   ──► ... up to 10, 20, 50+
```

- Host uploads a video/audio file (or shares mic/tab audio)
- Server creates a room with a 6-character code (e.g. `XK92PF`)
- Listeners open the same URL, enter the code, and hear the audio live
- Audio flows peer-to-peer via WebRTC — server only does the handshake

---

## Run locally

```bash
npm install
npm start
# Open http://localhost:3000
```

---

## Deploy to Railway (easiest — free tier)

1. Push this folder to a GitHub repo
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Select your repo — Railway auto-detects Node.js
4. Done. Railway gives you a public HTTPS URL like `https://silent-disco-production.up.railway.app`

> WebRTC requires HTTPS in production. Railway handles SSL automatically.

---

## Deploy to Render (also free)

1. Push to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your repo
4. Build command: `npm install`
5. Start command: `npm start`
6. Done — gets a free `*.onrender.com` HTTPS URL

---

## Deploy to Fly.io

```bash
npm install -g flyctl
fly auth login
fly launch        # auto-detects Node, creates fly.toml
fly deploy
```

---

## Deploy to VPS (DigitalOcean / any Linux server)

```bash
# On the server:
git clone <your-repo>
cd silent-disco
npm install

# Install PM2 to keep it alive:
npm install -g pm2
pm2 start server/index.js --name silent-disco
pm2 save

# Then use Nginx + Certbot for HTTPS:
# https://certbot.eff.org/
```

---

## Project structure

```
silent-disco/
├── package.json
├── server/
│   └── index.js      ← Node.js WebSocket signaling server + static file server
└── public/
    └── index.html    ← Full frontend (Host + Listener UI)
```

---

## Tips

- **HTTPS is required** in production for microphone and tab audio capture
- Works across Wi-Fi and the open internet (WebRTC uses STUN to punch through NAT)
- For very large audiences (50+ listeners), add a TURN server (e.g. Metered.ca free tier)
- The host's video plays locally on their screen; only audio is streamed to listeners
