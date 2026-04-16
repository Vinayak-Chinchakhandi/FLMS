import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

console.log('[BOOT] All route modules loaded successfully');

const app = express();
const PORT = Number(process.env.PORT) || 8080;
console.log('[BOOT] Final PORT used:', PORT);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Fully open for hackathon demo (Capacitor mobile + browser + Railway)
app.use(cors({ origin: true, credentials: true }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    project: 'Intelligent Faculty Leave Orchestrator (IFLO)',
    version: '1.0.0',
    status: 'running',
    mode: process.env.DATABASE_URL ? 'postgresql' : 'mock-data',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/leave', leaveRoutes);
app.use('/api/smart-evaluate', smartEvaluateRoutes);
app.use('/api/simulate', simulateRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
  console.log(`📋 Mode: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory mock data'}`);
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
