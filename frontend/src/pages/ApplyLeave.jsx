import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateLeave, applyLeave, getLeaveSummary } from '../services/api';
import {
  Calendar, FileText, CheckCircle, AlertTriangle, ShieldAlert,
  Loader2, Sparkles, Users,
} from 'lucide-react';

/* ── Leave Quota Bar ─────────────────────────────────────────────────────── */
function LeaveQuotaBar({ taken, max }) {
  const pct = Math.min(100, Math.round((taken / max) * 100));
  const color =
    pct >= 100 ? 'bg-red-500' :
    pct >= 75  ? 'bg-amber-500' :
                 'bg-emerald-500';
  const textColor =
    pct >= 100 ? 'text-red-600' :
    pct >= 75  ? 'text-amber-600' :
                 'text-emerald-600';

  return (
    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Leave Balance</span>
        <span className={`text-xs font-black ${textColor}`}>
          {taken}/{max} used
          {pct >= 100 && ' — QUOTA FULL'}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-400">
        {Math.max(0, max - taken)} leave days remaining this year
      </p>
    </div>
  );
}

/* ── Score Meter ─────────────────────────────────────────────────────────── */
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
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
      </div>
      <span className="text-xs font-bold text-indigo-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */
export default function ApplyLeave() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('iflo_user') || '{}');
  const role     = user.role;
  // Acting HOD uses their PERMANENT role (faculty) for leave applications —
  // they go through the normal pending → HOD-approval flow
  const isHod    = role === 'hod';

  const [deptMembers, setDeptMembers] = useState([]);
  const [quota,       setQuota]       = useState(null);
  const [formData,    setFormData]    = useState({
    from_date: '', to_date: '', reason: '',
    acting_hod_id: '',
  });
  const [loading,    setLoading]    = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitResponse, setSubmitResponse] = useState(null); // full server response after submit
  const [quotaError, setQuotaError] = useState('');

  // Load quota and dept members on mount
  useEffect(() => {
    (async () => {
      try {
        const qRes = await getLeaveSummary(user.id);
        setQuota(qRes.data.data);
      } catch (e) {
        console.warn('Could not load leave summary', e);
      }

      if (isHod) {
        // Fetch dept members to populate acting HOD dropdown
        try {
          const { getHodDashboard } = await import('../services/api');
          const dRes = await getHodDashboard(user.department_id);
          const faculty = (dRes.data.data.members || []).filter(
            (m) => m.role === 'faculty'
          );
          setDeptMembers(faculty);
        } catch (e) {
          console.warn('Could not load dept members', e);
        }
      }
    })();
  }, [user.id, user.department_id, isHod]);

  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));

  const handleEvaluate = async (e) => {
    e.preventDefault();
    setQuotaError('');

    // Client-side quota check
    if (quota && quota.remaining <= 0) {
      setQuotaError(`Leave quota exceeded. You have used all ${quota.max} allowed leaves.`);
      return;
    }

    // HOD requires acting HOD to be selected
    if (isHod && !formData.acting_hod_id) {
      setQuotaError('Please select an Acting HOD to manage leaves during your absence.');
      return;
    }

    setLoading(true);
    setResult(null);
    setSubmitted(false);
    try {
      const res = await evaluateLeave({ ...formData, faculty_id: user.id });
      setResult(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error calling evaluate API. Is the backend running?';
      setQuotaError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        faculty_id: user.id,
        // acting_hod_id only sent for HOD; backend uses faculty.role to determine is_hod_leave
      };
      const res = await applyLeave(payload);
      setSubmitResponse(res.data);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error submitting leave request.';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const recColor =
    result?.recommendation === 'APPROVE' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    result?.recommendation === 'REVIEW'  ? 'text-amber-600 bg-amber-50 border-amber-200' :
                                           'text-red-600 bg-red-50 border-red-200';

  const quotaFull = quota && quota.remaining <= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-2xl p-6 text-white shadow-md ${isHod ? 'bg-gradient-to-r from-violet-600 to-purple-600' : 'bg-gradient-to-r from-indigo-600 to-violet-600'}`}>
        <h1 className="text-2xl font-black tracking-tight">
          {isHod ? 'HOD Leave Application' : 'Apply for Leave'}
        </h1>
        <p className="text-indigo-200 mt-0.5 text-sm">
          {isHod
            ? 'Select an acting HOD before submitting · ' + user.name
            : 'AI-powered evaluation before submission · ' + user.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Form ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-slate-900">Leave Details</h2>

          <form onSubmit={handleEvaluate} className="space-y-4">
            {/* Faculty / HOD info — read-only */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isHod ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {user.name?.charAt(0) || 'F'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role} · ID: {user.id}</p>
              </div>
            </div>

            {/* Leave quota bar */}
            {quota && <LeaveQuotaBar taken={quota.taken} max={quota.max} />}

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

            {/* HOD: Acting HOD selector */}
            {isHod && (
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Acting HOD (required)
                </label>
                <select
                  id="acting-hod-select"
                  required
                  value={formData.acting_hod_id}
                  onChange={set('acting_hod_id')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                >
                  <option value="">-- Select a faculty member --</option>
                  {deptMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Selected faculty will be automatically granted HOD access on approval — no confirmation needed.
                </p>
              </div>
            )}

            {quotaError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {quotaError}
              </div>
            )}

            <button
              id="evaluate-btn"
              type="submit"
              disabled={loading || quotaFull}
              className={`w-full py-3 px-4 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md
                ${isHod
                  ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-200 disabled:opacity-50'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 disabled:opacity-50'
                }`}
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

              {/* HOD leave notice */}
              {isHod && formData.acting_hod_id && (
                <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
                  <p className="text-sm font-bold text-violet-800 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Acting HOD Assignment
                  </p>
                  <p className="text-sm text-violet-700 mt-1">
                    {deptMembers.find(m => String(m.id) === String(formData.acting_hod_id))?.name || 'Selected faculty'} will be automatically granted HOD access when your leave is approved.
                  </p>
                </div>
              )}

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
              {!isHod && result.suggestedSubstitutes?.length > 0 && (
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
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
                <div className={`border rounded-2xl p-5 text-center ${
                  isHod
                    ? 'bg-violet-50 border-violet-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${isHod ? 'text-violet-500' : 'text-emerald-500'}`} />
                  <p className={`font-bold ${isHod ? 'text-violet-700' : 'text-emerald-700'}`}>
                    {isHod ? 'Leave approved and Acting HOD assigned' : 'Leave request sent for approval'}
                  </p>
                  {isHod ? (
                    <>
                      <p className="text-sm text-violet-600 mt-1">
                        Acting HOD <strong>{submitResponse?.data?.actingHodName || 'Selected faculty'}</strong> has been granted HOD access immediately.
                      </p>
                      <p className="text-xs text-violet-500 mt-1">No manual approval required for HOD leaves.</p>
                    </>
                  ) : (
                    <p className="text-sm text-emerald-600 mt-1">
                      Your leave is now <strong>pending HOD review</strong>. You will be notified when approved.
                    </p>
                  )}
                  <button
                    onClick={() => navigate(isHod ? '/hod' : '/faculty')}
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
