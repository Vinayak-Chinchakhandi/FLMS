import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarPlus, Activity, Building, Settings, LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard',  path: '/',            icon: LayoutDashboard },
  { name: 'Apply Leave', path: '/apply',        icon: CalendarPlus },
  { name: 'Simulation', path: '/simulation',   icon: Activity },
  { name: 'Departments', path: '/departments', icon: Building },
  { name: 'Settings',   path: '/settings',     icon: Settings },
];

function NavItem({ item, collapsed = false }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <item.icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span>{item.name}</span>}
    </NavLink>
  );
}

/* ── Desktop Sidebar ─────────────────────────────────────────────────────── */
export default function Sidebar() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('iflo_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('iflo_user');
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

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} />
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {user.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name || 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role || 'faculty'}</p>
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
  const mobileItems = NAV_ITEMS.slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-stretch">
      {mobileItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
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
