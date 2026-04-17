import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarPlus, Activity, Building, Settings, LogOut,
} from 'lucide-react';

const FACULTY_NAV = [
  { name: 'Dashboard',   path: '/faculty',  icon: LayoutDashboard },
  { name: 'Apply Leave', path: '/apply',    icon: CalendarPlus },
  { name: 'Settings',    path: '/settings', icon: Settings },
];

const HOD_NAV = [
  { name: 'HOD Dashboard', path: '/hod',        icon: LayoutDashboard },
  { name: 'Apply Leave',   path: '/apply',       icon: CalendarPlus },
  { name: 'Simulation',    path: '/simulation',  icon: Activity },
  { name: 'Departments',   path: '/departments', icon: Building },
  { name: 'Settings',      path: '/settings',    icon: Settings },
];

function NavItem({ item }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/faculty' || item.path === '/hod'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <item.icon className="w-5 h-5 shrink-0" />
      <span>{item.name}</span>
    </NavLink>
  );
}

/* ── Desktop Sidebar ─────────────────────────────────────────────────────── */
export default function Sidebar() {
  const navigate    = useNavigate();
  const user        = JSON.parse(localStorage.getItem('iflo_user') || '{}');
  const isActingHod = user.role !== 'hod' && user.acting_role === 'hod';
  const isHod       = user.role === 'hod' || user.acting_role === 'hod';
  const navItems    = isHod ? HOD_NAV : FACULTY_NAV;

  const handleLogout = () => {
    localStorage.removeItem('iflo_user');
    localStorage.removeItem('iflo_token');
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white h-screen sticky top-0 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-black">IF</span>
        </div>
        <div className="leading-tight">
          <p className="font-bold text-slate-900 text-sm">IFLO</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Leave Orchestrator</p>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
          ${isHod ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isActingHod ? 'Acting HOD' : isHod ? 'HOD View' : 'Faculty View'}
        </span>
        {isActingHod && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            TEMPORARY
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
            ${isHod ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}`}>
            {user.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">
              {isActingHod ? 'Acting HOD (Temporary)' : user.role || 'faculty'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

/* ── Mobile Bottom Nav ───────────────────────────────────────────────────── */
export function BottomNav() {
  const user     = JSON.parse(localStorage.getItem('iflo_user') || '{}');
  const isHod    = user.role === 'hod' || user.acting_role === 'hod';
  const navItems = (isHod ? HOD_NAV : FACULTY_NAV);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-stretch">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/faculty' || item.path === '/hod'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-500'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={`w-5 h-5 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
              <span>{item.name.split(' ')[0]}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
