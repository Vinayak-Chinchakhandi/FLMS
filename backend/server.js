import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

// ─── Runtime DB Mode Check (FIXED) ────────────────────────────────────────────
const isUsingMock = () => pool === null;

// ─── Startup Diagnostics ─────────────────────────────────────────────────────
console.log('[BOOT] IFLO Backend starting...');
console.log('[BOOT] Node version:', process.version);
console.log('[BOOT] NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('[BOOT] PORT env:', process.env.PORT || '(not set, defaulting to 3000)');
console.log('[BOOT] DATABASE_URL:', process.env.DATABASE_URL ? '✅ present' : '❌ absent → mock mode');

// ─── Routes (after dotenv) ───────────────────────────────────────────────────
import leaveRoutes from './routes/leave.js';
import smartEvaluateRoutes from './routes/smartEvaluate.js';
import simulateRoutes from './routes/simulate.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import facultyRoutes from './routes/faculty.js';
import hodRoutes from './routes/hod.js';
import substitutionRoutes from './routes/substitutions.js';
import userRoutes from './routes/users.js';
import { requireAuth } from './middleware/authMiddleware.js';

console.log('[BOOT] All route modules loaded successfully');

const app = express();
const PORT = process.env.PORT || 3000;
console.log('[BOOT] Final PORT used:', PORT);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Health / Status ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    project: 'Intelligent Faculty Leave Orchestrator (IFLO)',
    version: '1.0.0',
    status: 'running',
    mode: isUsingMock() ? 'mock-data' : 'postgresql',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/status', (_req, res) => {
  res.json({
    server: 'running',
    mode: isUsingMock() ? 'mock-data' : 'postgresql',
    port: PORT,
    timestamp: new Date().toISOString(),
    routes: [
      '/api/leave',
      '/api/smart-evaluate',
      '/api/simulate',
      '/api/dashboard',
    ],
  });
});

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/faculty', requireAuth, facultyRoutes);
app.use('/api/hod', requireAuth, hodRoutes);
app.use('/api/substitutions', requireAuth, substitutionRoutes);
app.use('/api/leave', requireAuth, leaveRoutes);
app.use('/api/smart-evaluate', requireAuth, smartEvaluateRoutes);
app.use('/api/simulate', requireAuth, simulateRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/users', requireAuth, userRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[GlobalError]', err.stack || err.message);
  if (res.headersSent) return;

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Unknown error',
  });
});

// ─── Crash Guards (Railway safe) ──────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL uncaughtException]', err.stack || err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL unhandledRejection]', reason?.stack || reason);
});

// ─── Start Server (WAIT FOR DB) ───────────────────────────────────────────────
const startServer = async () => {
  try {
    if (pool) {
      await pool.query('SELECT 1');
      console.log('✅ DB connected before server start');
    } else {
      console.warn('⚠️ No DB pool — starting in MOCK mode');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 IFLO Backend LISTENING on 0.0.0.0:${PORT}`);
      console.log(`📋 Mode: ${isUsingMock() ? 'In-memory mock data' : 'PostgreSQL'}`);
      console.log(`🌍 Env: ${process.env.NODE_ENV || 'development'}\n`);
    });

    server.on('error', (err) => {
      console.error('[SERVER ERROR]', err.message);
      if (err.code === 'EADDRINUSE') {
        console.error(`[SERVER ERROR] Port ${PORT} already in use`);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    console.warn('⚠️ Starting server in MOCK mode');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Running in MOCK mode on port ${PORT}`);
    });
  }
};

startServer();

export default app;