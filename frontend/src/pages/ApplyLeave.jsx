import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateLeave, applyLeave } from '../services/api';
import {
  Calendar, FileText, CheckCircle, AlertTriangle, ShieldAlert,
  Loader2, Sparkles, Lock,
} from 'lucide-react';

function ScoreMeter({ score }) {
  const color =
    score >= 75 ? '#10b981' :
    score >= 50 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="40" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-900">{score}</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

function SubstituteBar({ score }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
        />
      </div>
      <span className="text-xs font-bold text-indigo-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function ApplyLeave() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('iflo_user') || '{}');
  const role      = user.role;

  // Guard: faculty only
  if (role !== 'faculty') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-500">Faculty only</p>
          <p className="text-sm text-slate-400">Only faculty members can apply for leave.</p>
        </div>
      </div>
    );
  }

  const [formData, setFormData]   = useState({ from_date: '', to_date: '', reason: '' });
  const [loading,   setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result,    setResult]    = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSubmitted(false);
    try {
      const res = await evaluateLeave({ ...formData, faculty_id: user.id });
      setResult(res.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error calling evaluate API. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await applyLeave({ ...formData, faculty_id: user.id });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const recColor =
    result?.recommendation === 'APPROVE' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    result?.recommendation === 'REVIEW'  ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                           'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-black tracking-tight">Apply for Leave</h1>
        <p className="text-indigo-200 mt-0.5 text-sm">AI-powered evaluation before submission · {user.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Form ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-slate-900">Leave Details</h2>

          <form onSubmit={handleEvaluate} className="space-y-4">
            {/* Faculty info — read-only */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                {user.name?.charAt(0) || 'F'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role} · ID: {user.id}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> From
                </label>
                <input
                  id="leave-from-date"
                  type="date" required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.from_date}
                  onChange={set('from_date')}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> To
                </label>
                <input
                  id="leave-to-date"
                  type="date" required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formData.to_date}
                  onChange={set('to_date')}
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Reason
              </label>
              <textarea
                id="leave-reason"
                rows={3}
                required
                placeholder="Describe the reason for leave..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                value={formData.reason}
                onChange={set('reason')}
              />
            </div>

            <button
              id="evaluate-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Sparkles className="w-4 h-4" /> Evaluate with AI</>
              )}
            </button>
          </form>
        </div>

        {/* ── Right: Result ────────────────────────────────────────────── */}
        <div>
          {result ? (
            <div className="space-y-4">
              {/* Score + Recommendation */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-5">
                <ScoreMeter score={result.approvalScore} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">AI Recommendation</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black border ${recColor}`}>
                    {result.recommendation === 'APPROVE' && <CheckCircle className="w-4 h-4" />}
                    {result.recommendation === 'REVIEW'  && <AlertTriangle className="w-4 h-4" />}
                    {result.recommendation === 'REJECT'  && <ShieldAlert className="w-4 h-4" />}
                    {result.recommendation}
                  </span>
                  <p className="text-slate-500 text-sm mt-2">
                    {result.affectedClassesCount} class(es) affected over {result.leaveDuration} day(s)
                  </p>
                </div>
              </div>

              {/* Conflicts */}
              {result.conflicts.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
                  <h4 className="flex items-center gap-2 font-bold text-red-700 text-sm">
                    <ShieldAlert className="w-4 h-4" /> Conflicts Detected
                  </h4>
                  <ul className="space-y-1.5">
                    {result.conflicts.map((c, i) => (
                      <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {c.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Substitutes */}
              {result.suggestedSubstitutes?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-sm font-bold text-slate-800">Suggested Substitutes</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {result.suggestedSubstitutes.map((sub, idx) => (
                      <div key={idx} className="px-5 py-3.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-semibold text-slate-900 text-sm">{sub.name}</p>
                          <span className="text-xs text-slate-500">{sub.currentLoad} cls/wk</span>
                        </div>
                        <SubstituteBar score={sub.score} />
                        <p className="text-xs text-slate-400 mt-1">
                          Subject match: {Math.round(sub.subjectMatch * 100)}% &nbsp;·&nbsp; Available: {sub.available ? 'Yes' : 'No'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit button */}
              {!submitted ? (
                <button
                  id="submit-leave-btn"
                  onClick={handleSubmit}
                  disabled={submitting || result.recommendation === 'REJECT'}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Submit Leave Request</>}
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="font-bold text-emerald-700">Request Submitted!</p>
                  <p className="text-sm text-emerald-600">Your leave is pending HOD review.</p>
                  <button
                    onClick={() => navigate('/faculty')}
                    className="mt-3 text-xs text-indigo-600 underline"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-64 bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Sparkles className="w-10 h-10 mb-3 text-slate-300" />
              <p className="font-semibold">Fill the form and click</p>
              <p className="text-sm text-slate-400">"Evaluate with AI" to see results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
