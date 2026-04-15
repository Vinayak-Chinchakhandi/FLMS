import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Shield, Moon, ChevronRight } from 'lucide-react';

export default function Settings() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('iflo_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('iflo_user');
    navigate('/login');
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User,   label: 'Edit Profile',       desc: 'Update your name and email' },
        { icon: Shield, label: 'Change Password',     desc: 'Security & authentication' },
        { icon: Bell,   label: 'Notifications',       desc: 'Email and push alerts' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Moon, label: 'Appearance', desc: 'Light / dark mode' },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage your account preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
            {user.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name || 'User'}</h2>
            <p className="text-indigo-200 text-sm">{user.email || 'No email'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-white/20 rounded-full text-xs font-semibold capitalize">
              {user.role || 'faculty'}
            </span>
          </div>
        </div>
      </div>

      {/* Options */}
      {settingsGroups.map((group) => (
        <div key={group.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{group.title}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {group.items.map((item) => (
              <button
                key={item.label}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-600">Sign Out</p>
            <p className="text-xs text-slate-500">Clear session and return to login</p>
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 pb-6">IFLO v1.0.0 — Hackathon Build</p>
    </div>
  );
}
