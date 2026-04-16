import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar, { BottomNav } from './components/Sidebar';
import Dashboard        from './pages/Dashboard';
import ApplyLeave       from './pages/ApplyLeave';
import Simulation       from './pages/Simulation';
import DepartmentDetail from './pages/DepartmentDetail';
import Settings         from './pages/Settings';
import Login            from './pages/Login';

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

function RequireRole({ role, children }) {
  const user = getUser();
  if (!user?.role) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    // Redirect to their own home instead of forbidding
    return <Navigate to={user.role === 'hod' ? '/hod' : '/faculty'} replace />;
  }
  return children;
}

// ─── App shell with sidebar ────────────────────────────────────────────────────
function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-50">
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
            <Route path="/apply" element={
              <RequireRole role="faculty"><ApplyLeave /></RequireRole>
            } />

            {/* HOD routes */}
            <Route path="/hod" element={
              <RequireRole role="hod"><Dashboard /></RequireRole>
            } />
            <Route path="/simulation" element={<Simulation />} />

            {/* Shared */}
            <Route path="/departments" element={<DepartmentDetail />} />
            <Route path="/settings"    element={<Settings />} />

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
  if (user.role === 'hod') return <Navigate to="/hod" replace />;
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
