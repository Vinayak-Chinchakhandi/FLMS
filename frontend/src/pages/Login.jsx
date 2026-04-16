import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/api';

const DEMO_ACCOUNTS = [
  { email: 'arjun@college.edu',   role: 'faculty', label: 'Faculty'  },
  { email: 'sunita@college.edu',  role: 'faculty', label: 'Faculty'  },
  { email: 'rajan@college.edu',   role: 'faculty', label: 'Faculty (sub)' },
  { email: 'nikhil@college.edu',  role: 'hod',     label: 'HOD — CS' },
  { email: 'meera@college.edu',   role: 'hod',     label: 'HOD — Maths' },
];

export default function Login() {
  const navigate  = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginApi({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('iflo_token', token);
      localStorage.setItem('iflo_user', JSON.stringify(user));

      // Role-based redirect
      if (user.role === 'hod') {
        navigate('/hod', { replace: true });
      } else {
        navigate('/faculty', { replace: true });
      }
    } catch (err) {
      console.error('[Login] Error', err);
      setError(
        err.response?.data?.message
          ? err.response.data.message
          : 'Unable to reach backend. Confirm backend is running at localhost:3000.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <span className="text-2xl font-black text-white">IF</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">IFLO</h1>
          <p className="text-indigo-300 mt-1 text-sm">Intelligent Faculty Leave Orchestrator</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to your account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="arjun@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-xs text-indigo-700 font-bold mb-2 uppercase tracking-wider">Quick Access — Demo Accounts</p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fillDemo(u.email)}
                  className="w-full flex items-center justify-between text-xs text-left px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <span className="font-mono text-indigo-800">{u.email}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'hod' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {u.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-indigo-500 mt-2 text-center">All passwords: <span className="font-mono font-bold">password</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
