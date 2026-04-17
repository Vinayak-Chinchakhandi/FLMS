import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar, { BottomNav } from './components/Sidebar';
import Dashboard        from './pages/Dashboard';
import ApplyLeave       from './pages/ApplyLeave';
import Simulation       from './pages/Simulation';
import DepartmentDetail from './pages/DepartmentDetail';
import Settings         from './pages/Settings';
import Login            from './pages/Login';
import { getMe }        from './services/api';
import { Building, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── More Page ───────────────────────────────────────────────────────────────
function MorePage() {
  const navigate = useNavigate();
  const user = getUser();
  const isActingHod = user.acting_role === 'hod';

  const items = [
    { name: 'Departments', path: '/departments', icon: Building },
    { name: 'Settings',    path: '/settings',    icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">More</h1>
        <p className="text-slate-500 text-sm mt-1">Additional options</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="font-medium text-slate-900">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('iflo_user') || '{}');
  } catch {
    return {};
  }
}

function RequireAuth({ children }) {
  const user  = localStorage.getItem('iflo_user');
  const token = localStorage.getItem('iflo_token');
  if (!user || !token) {
    localStorage.removeItem('iflo_user');
    localStorage.removeItem('iflo_token');
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Check if user can access HOD routes (actual hod OR acting hod)
function canAccessHod(user) {
  return user?.role === 'hod' || user?.acting_role === 'hod';
}

function RequireRole({ role, children }) {
  const user = getUser();
  if (!user?.role) return <Navigate to="/login" replace />;

  const isRealHod = user.role === 'hod';
  const isActingHod = user.acting_role === 'hod';
  const isFaculty = user.role === 'faculty';
  const canAccessHod = isRealHod || isActingHod;
  const canAccessFaculty = isFaculty || isActingHod;

  // HOD route check: accept actual hod OR acting hod
  if (role === 'hod' && canAccessHod) return children;

  // Faculty route check: accept actual faculty OR acting hod
  if (role === 'faculty' && canAccessFaculty) return children;

  // Mismatch — redirect to own home
  if (canAccessHod) return <Navigate to="/hod" replace />;
  return <Navigate to="/faculty" replace />;
}

// ─── App shell with sidebar ────────────────────────────────────────────────────
function AppShell() {
  // Auto-refresh user state from backend on mount.
  // This ensures acting_role changes are detected without re-login.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getMe();
        const liveUser = res.data.data;
        if (cancelled) return;

        // Merge live fields into stored user — preserve id/name/role but update acting_role
        const stored = JSON.parse(localStorage.getItem('iflo_user') || '{}');
        const merged = {
          ...stored,
          email:         liveUser.email || stored.email || null,
          acting_role:   liveUser.acting_role ?? null,
          department_id: liveUser.department_id ?? stored.department_id,
        };

        // Only re-render if acting_role actually changed
        if (stored.acting_role !== merged.acting_role) {
          localStorage.setItem('iflo_user', JSON.stringify(merged));
          setRefreshKey((k) => k + 1);
          console.log('[AppShell] User state refreshed — acting_role:', merged.acting_role);
        }
      } catch (e) {
        console.warn('[AppShell] Could not refresh user state:', e.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50" key={refreshKey}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Routes>
            {/* Common entry — redirect by role */}
            <Route path="/" element={<RoleRedirect />} />

            {/* Faculty routes */}
            <Route path="/faculty" element={
              <RequireRole role="faculty"><Dashboard /></RequireRole>
            } />
            {/* Faculty + HOD Apply Leave */}
            <Route path="/apply" element={<ApplyLeave />} />

            {/* HOD routes — actual HOD or acting HOD */}
            <Route path="/hod" element={
              <RequireRole role="hod"><Dashboard /></RequireRole>
            } />
            <Route path="/simulation" element={<Simulation />} />

            {/* Shared */}
            <Route path="/departments" element={<DepartmentDetail />} />
            <Route path="/settings"    element={<Settings />} />
            <Route path="/more"        element={<MorePage />} />

            {/* Fallback */}
            <Route path="*" element={<RoleRedirect />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function RoleRedirect() {
  const user = getUser();
  if (!user?.role) return <Navigate to="/login" replace />;

  const isRealHod = user.role === 'hod';
  const isActingHod = user.acting_role === 'hod';

  // Acting HOD defaults to faculty view, real HOD to hod view, faculty to faculty
  if (isActingHod) return <Navigate to="/faculty" replace />;
  if (isRealHod) return <Navigate to="/hod" replace />;

  return <Navigate to="/faculty" replace />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}
