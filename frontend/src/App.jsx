import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar, { BottomNav } from './components/Sidebar';
import Dashboard        from './pages/Dashboard';
import ApplyLeave       from './pages/ApplyLeave';
import Simulation       from './pages/Simulation';
import DepartmentDetail from './pages/DepartmentDetail';
import Settings         from './pages/Settings';
import Login            from './pages/Login';

function RequireAuth({ children }) {
  const user = localStorage.getItem('iflo_user');
  return user ? children : <Navigate to="/login" replace />;
}

function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/apply"       element={<ApplyLeave />} />
            <Route path="/simulation"  element={<Simulation />} />
            <Route path="/departments" element={<DepartmentDetail />} />
            <Route path="/settings"    element={<Settings />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

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
