import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { usingMockData } from './db.js';

dotenv.config();

// ─── Startup Diagnostics ─────────────────────────────────────────────────────
console.log('[BOOT] IFLO Backend starting...');
console.log('[BOOT] Node version:', process.version);
console.log('[BOOT] NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('[BOOT] PORT env:', process.env.PORT || '(not set, defaulting to 3000)');
console.log('[BOOT] DATABASE_URL:', process.env.DATABASE_URL ? '✅ present' : '❌ absent → mock data mode');

// Routes — imported AFTER dotenv so env vars are available during module init
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
const PORT = Number(process.env.PORT) || 3000;
console.log('[BOOT] Final PORT used:', PORT);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], credentials: true }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    project: 'Intelligent Faculty Leave Orchestrator (IFLO)',
    version: '1.0.0',
    status: 'running',
    mode: usingMockData ? 'mock-data' : 'postgresql',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/status', (_req, res) => {
  res.json({
    server: 'running',
    mode: usingMockData ? 'mock-data' : 'postgresql',
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

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must have 4 params so Express treats it as error middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[GlobalError]', err.stack || err.message);
  if (res.headersSent) return;
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err.message || 'Unknown error'),
  });
});

// ─── Uncaught exception guard — prevent Railway container crash ───────────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL uncaughtException]', err.stack || err.message);
  // Do NOT exit — let Railway health check detect and restart
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL unhandledRejection]', reason?.stack || reason);
});

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 IFLO Backend LISTENING on 0.0.0.0:${PORT}`);
  console.log(`📋 Mode: ${usingMockData ? 'In-memory mock data' : 'PostgreSQL'}`);
  if (usingMockData) console.log('⚠️  Running in MOCK DATA mode');
  console.log(`🌍 Env:  ${process.env.NODE_ENV || 'development'}\n`);
});

server.on('error', (err) => {
  console.error('[SERVER ERROR]', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER ERROR] Port ${PORT} is already in use — exiting`);
    process.exit(1);
  }
});

export default app;
