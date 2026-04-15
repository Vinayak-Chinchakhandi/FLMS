import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';

// Routes
import leaveRoutes         from './routes/leave.js';
import smartEvaluateRoutes from './routes/smartEvaluate.js';
import simulateRoutes      from './routes/simulate.js';
import dashboardRoutes     from './routes/dashboard.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────────────────────
// Allow any origin in dev; in production scope to your Netlify/Vercel URL.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, Capacitor)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(null, true); // Open CORS for hackathon demo — lock down in real prod
    },
    credentials: true,
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    project: 'Intelligent Faculty Leave Orchestrator (IFLO)',
    version: '1.0.0',
    status:  'running',
    mode:    process.env.DATABASE_URL ? 'postgresql' : 'mock-data',
    env:     process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/leave',          leaveRoutes);
app.use('/api/smart-evaluate', smartEvaluateRoutes);
app.use('/api/simulate',       simulateRoutes);
app.use('/api/dashboard',      dashboardRoutes);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 IFLO Backend → http://0.0.0.0:${PORT}`);
  console.log(`📋 Mode: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'In-memory mock data'}`);
  console.log(`🌍 Env:  ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
