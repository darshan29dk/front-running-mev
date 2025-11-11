/**
 * MEV Detector Backend Server
 * Express.js server with WebSocket support for real-time updates
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import config from './config';
import { connectDatabase, disconnectDatabase } from './database';
import apiRoutes from './routes/api';
import mempoolMonitor from './services/mempoolMonitor';
import mevDetector from './utils/mevDetector';

// Initialize Express app
const app: Express = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', apiRoutes);

// Root endpoint - serve static HTML frontend (plain HTML/CSS/JS)
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Fallback: serve index.html for non-API routes so static site works with client-side navigation
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Endpoint not found', path: req.path });
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// WebSocket setup
const wss = new WebSocketServer({ server: httpServer });

const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');
  clients.add(ws);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'connected',
      message: 'Connected to MEV Detector WebSocket',
      timestamp: new Date().toISOString(),
    })
  );

  // Handle messages
  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('WebSocket message received:', message);

      if (message.type === 'subscribe') {
        ws.send(
          JSON.stringify({
            type: 'subscribed',
            channel: message.channel,
            timestamp: new Date().toISOString(),
          })
        );
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast attack detection to all connected WebSocket clients
mempoolMonitor.on('attack-detected', (attack) => {
  const message = JSON.stringify({
    type: 'attack-detected',
    data: attack,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// Broadcast mempool updates
mempoolMonitor.on('mempool-updated', (data) => {
  const message = JSON.stringify({
    type: 'mempool-updated',
    data,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

mempoolMonitor.on('mevshare-opportunity', (opportunity) => {
  const message = JSON.stringify({
    type: 'mevshare-opportunity',
    data: opportunity,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

mempoolMonitor.on('mevshare-bundle', (bundle) => {
  const message = JSON.stringify({
    type: 'mevshare-bundle',
    data: bundle,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
});

// Start server
const PORT = config.port || 3001;

httpServer.listen(PORT, async () => {
  console.log(`\n🚀 MEV Detector Backend Server`);
  console.log(`📍 Listening on http://localhost:${PORT}`);
  console.log(`🌍 Network: ${config.network}`);
  console.log(`⛓️  Alchemy Endpoint: ${config.alchemyEndpoint.substring(0, 50)}...`);
  console.log(`\n📊 Endpoints:`);
  console.log(`   - Health: GET http://localhost:${PORT}/api/health`);
  console.log(`   - Attacks: GET http://localhost:${PORT}/api/attacks`);
  console.log(`   - Status: GET http://localhost:${PORT}/api/status`);
  console.log(`   - WebSocket: ws://localhost:${PORT}`);

  try {
    await connectDatabase();
    if (config.databaseUrl) {
      console.log('🗄️  Database connected');
    }
  } catch (dbError) {
    console.error('⚠️ Failed to connect database:', dbError);
  }

  console.log(`\n✅ Server ready! Start monitoring mempool...`);

  if (process.env.DISABLE_MEMPOOL === 'true') {
    console.log('⚪ Mempool monitoring disabled via DISABLE_MEMPOOL=true');
  } else {
    mempoolMonitor.startMonitoring();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n📍 Shutting down server...');
  mempoolMonitor.stopMonitoring();
  await disconnectDatabase();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n\n📍 Terminating server...');
  mempoolMonitor.stopMonitoring();
  await disconnectDatabase();
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
// Log uncaught exceptions and unhandled rejections but avoid forcing an immediate exit
// so the server can stay up during local development and we can investigate issues.
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception (logged, NOT exiting):', error);
  // Optionally: add telemetry/reporting here
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason, '(logged, NOT exiting)');
  // Keep process alive for debugging in dev; in prod you may want to exit or restart.
});

// Keep-alive: print heartbeat so long-running process stays active in some constrained runner environments
// and so logs indicate the process is still alive. This is a harmless interval.
setInterval(() => {
  console.log(`[heartbeat] server alive at ${new Date().toISOString()}`);
}, 60 * 1000);

export default httpServer;