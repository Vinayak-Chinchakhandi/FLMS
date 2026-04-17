import axios from 'axios';

// VITE_API_BASE_URL is set in .env (dev) or .env.production (prod build).
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iflo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (import.meta.env.DEV) {
    console.log('[API Request]', config.method?.toUpperCase(), config.url, config.data || config.params || '');
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (import.meta.env.DEV) {
      console.log('[API Response]', res.config.url, res.status, res.data);
    }
    return res;
  },
  (err) => {
    if (import.meta.env.DEV) {
      console.error('[API Error]', err.config?.url, err.response?.status, err.message, err.response?.data);
    }
    return Promise.reject(err);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data);

// ─── Leave ───────────────────────────────────────────────────────────────────
export const applyLeave = (data) => api.post('/leave/apply', data);
export const getLeaves  = ()     => api.get('/leave');
export const updateLeaveStatus = (id, status) => api.patch(`/leave/${id}/status`, { status });

// ─── Smart / Simulation ───────────────────────────────────────────────────────
export const evaluateLeave = (data) => api.post('/smart-evaluate', data);
export const runSimulation = (data) => api.post('/simulate', data);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getHeatmap       = ()           => api.get('/dashboard/heatmap');
export const getLeaderboard   = ()           => api.get('/dashboard/leaderboard');
export const getFacultyDashboard = (id)      => api.get(`/faculty/dashboard/${id}`);
export const getHodDashboard  = (deptId)     => api.get(`/hod/dashboard/${deptId}`);

// ─── Substitutions ───────────────────────────────────────────────────────────
export const getSubstitutions     = (facultyId) => api.get(`/substitutions/${facultyId}`);
export const acceptSubstitution   = (id)        => api.patch(`/substitutions/${id}`, { status: 'accepted' });
export const getSubstitutionStatus = (leaveId)  => api.get(`/hod/substitution-status/${leaveId}`);

// ─── HOD Acting ──────────────────────────────────────────────────────────────
export const getActingHod = (deptId) => api.get(`/hod/acting/${deptId}`);

// ─── Users / Profile ─────────────────────────────────────────────────────────
export const getMe         = ()          => api.get('/users/me');
export const updateSkills  = (skills)    => api.patch('/users/me/skills', { skills });
export const getLeaveSummary = (userId)  => api.get(`/users/leave-summary/${userId}`);
