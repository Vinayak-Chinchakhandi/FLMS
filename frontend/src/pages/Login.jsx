import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_USERS = [
  { id: 1, name: 'Dr. Arjun Mehta',   email: 'arjun@college.edu',  role: 'faculty',  faculty_id: 1 },
  { id: 2, name: 'Prof. Sunita Rao',  email: 'sunita@college.edu', role: 'faculty',  faculty_id: 2 },
  { id: 9, name: 'Admin User',        email: 'admin@college.edu',  role: 'admin',    faculty_id: null },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const user = MOCK_USERS.find((u) => u.email === email);
      if (user && password === 'password') {
        localStorage.setItem('iflo_user', JSON.stringify(user));
        navigate('/');
      } else {
        setError('Invalid email or password. Use password: "password"');
      }
      setLoading(false);
    }, 600);
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
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-xs text-indigo-700 font-medium mb-1">Demo Accounts</p>
            {MOCK_USERS.map((u) => (
              <p key={u.id} className="text-xs text-indigo-600 font-mono">
                {u.email} / <span className="text-slate-500">password</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
