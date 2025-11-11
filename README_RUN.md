Quick dev run instructions

Backend (server):

1. Build TypeScript

   PowerShell:

   $env:NODE_ENV='development'; cd server; npm run build

2. Start server on an available port (example: 3003)

   PowerShell:

   $env:PORT='3003'; cd server; npm start

Frontend (mev-detector):

1. Install deps (if not done)

   cd mev-detector; npm install --legacy-peer-deps

2. Start dev server (default port set in mev-detector/.env)

   cd mev-detector; npm start

Smoke tests (backend):

1. Build (if not already)

   cd server; npm run build

2. Run smoke script (adjust PORT to match running server)

   PowerShell:

   $env:PORT='3003'; cd server; npm run smoke

Notes:
- If ports 3000/3001 are already used on your machine, the frontend will use the port in `mev-detector/.env` (default: 3004 in this repo). The backend reads `PORT` from environment variables.
- For real mempool monitoring you need Alchemy API keys; otherwise run with `DISABLE_MEMPOOL=true` in the environment.
