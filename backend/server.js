import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Routes — imported AFTER dotenv so env vars are available during module init
import leaveRoutes from './routes/leave.js';
import smartEvaluateRoutes from './routes/smartEvaluate.js';
import simulateRoutes from './routes/simulate.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Fully open for hackathon demo (Capacitor mobile + browser + Railway)
app.use(cors({ origin: true, credentials: true }));

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    project: 'Intelligent Faculty Leave Orchestrator (IFLO)',
    version: '1.0.0',
    status: 'running',
    mode: process.env.DATABASE_URL ? 'postgresql' : 'mock-data',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
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
  console.error('[uncaughtException]', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 IFLO Backend → http://0.0.0.0:${PORT}`);
  console.log(`📋 Mode: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory mock data'}`);
  console.log(`🌍 Env:  ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
