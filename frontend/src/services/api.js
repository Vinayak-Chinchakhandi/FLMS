import axios from 'axios';

// VITE_API_BASE_URL is set in .env (dev) or .env.production (prod build).
// Capacitor / mobile uses the deployed Railway URL automatically.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://flms-production.up.railway.app/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s — generous for mobile networks
});

// Global response interceptor: log errors in dev
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      console.error('[API Error]', err.config?.url, err.response?.status, err.message);
    }
    return Promise.reject(err);
  }
);

// ─── Leave ────────────────────────────────────────────────────────────────────
export const applyLeave = (data) => api.post('/leave/apply', data);
export const getLeaves = () => api.get('/leave');

// ─── Smart / Simulation ───────────────────────────────────────────────────────
export const evaluateLeave = (data) => api.post('/smart-evaluate', data);
export const runSimulation = (data) => api.post('/simulate', data);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getHeatmap = () => api.get('/dashboard/heatmap');
export const getLeaderboard = () => api.get('/dashboard/leaderboard');
