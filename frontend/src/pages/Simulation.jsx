import React, { useState } from 'react';
import { runSimulation } from '../services/api';
import {
  Activity, Calendar, ArrowRight, ShieldAlert, CheckCircle,
  Users, Clock, Loader2, BarChart2,
} from 'lucide-react';

const FACULTY_OPTIONS = [
  { id: 1, label: 'Dr. Arjun Mehta',  dept: 'Computer Science' },
  { id: 2, label: 'Prof. Sunita Rao', dept: 'Computer Science' },
  { id: 3, label: 'Dr. Kiran Desai',  dept: 'Mathematics' },
  { id: 7, label: 'Dr. Sanjay Gupta', dept: 'Mechanical' },
];

function ImpactBadge({ score }) {
  const cls =
    score > 3  ? 'bg-red-100 text-red-700 border-red-200' :
    score > 1.5 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-emerald-100 text-emerald-700 border-emerald-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${cls}`}>
      {score > 3 ? '⚠ High' : score > 1.5 ? '~ Medium' : '✓ Low'} ({score})
    </span>
  );
}

export default function Simulation() {
  const [formData, setFormData] = useState({ faculty_id: 1, from_date: '', to_date: '' });
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);

  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await runSimulation({ ...formData, faculty_id: Number(formData.faculty_id) });
      setResult(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Error running simulation. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-black tracking-tight">Leave Impact Simulation</h1>
        <p className="text-indigo-200 mt-0.5 text-sm">Predict schedule disruption before approving leave</p>
      </div>

      {/* Simulation Form */}
      <form
        onSubmit={handleSimulate}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
      >
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-4">
          <div className="flex-1 min-w-[160px] space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty</label>
            <select
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.faculty_id}
              onChange={set('faculty_id')}
            >
              {FACULTY_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">From Date</label>
            <input
              type="date" required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.from_date}
              onChange={set('from_date')}
            />
          </div>
          <div className="flex-1 min-w-[140px] space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">To Date</label>
            <input
              type="date" required
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.to_date}
              onChange={set('to_date')}
            />
          </div>
          <div className="w-full lg:w-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-100"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Activity className="w-4 h-4" /> Run Simulation</>
              }
            </button>
          </div>
        </div>
      </form>

      {/* Result */}
      {result ? (
        <div className="space-y-4">

          {/* Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Affected',   value: result.affectedClasses.length, icon: Calendar,     color: 'text-violet-600',  bg: 'bg-violet-50' },
              { label: 'Resolved',   value: result.resolvedCount,           icon: CheckCircle,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Unresolved', value: result.unresolvedCount,         icon: ShieldAlert,  color: 'text-red-500',     bg: 'bg-red-50' },
              { label: 'Impact Score', value: <ImpactBadge score={result.impactScore} />, icon: BarChart2, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <div className="text-xl font-black text-slate-900">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Overload Warnings */}
          {result.overloadWarnings?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
              <h4 className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                <ShieldAlert className="w-4 h-4" /> Overload Warnings ({result.overloadWarnings.length})
              </h4>
              {result.overloadWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span><strong>{w.facultyName}</strong> — {w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Substitution Cards: Before / After */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Class Replacements</h3>
            </div>

            {result.substitutions.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-sm">No classes affected during this period.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {result.substitutions.map((sub, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row items-stretch gap-3">
                    {/* Before */}
                    <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-4 relative">
                      <span className="absolute top-2 right-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">BEFORE</span>
                      <p className="font-bold text-slate-900 text-sm pr-10">{sub.subject}</p>
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">{sub.classId}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {sub.day}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {sub.timeSlot}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-center px-1">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>

                    {/* After */}
                    <div className={`flex-1 rounded-xl border p-4 relative ${
                      sub.status === 'ASSIGNED'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <span className="absolute top-2 right-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">AFTER</span>
                      {sub.status === 'ASSIGNED' ? (
                        <>
                          <p className="font-bold text-emerald-800 text-sm flex items-center gap-1.5 pr-10">
                            <Users className="w-3.5 h-3.5" /> {sub.substitute?.name}
                          </p>
                          <span className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            ✓ ASSIGNED
                          </span>
                          {sub.substituteScore != null && (
                            <p className="text-xs text-emerald-600 mt-1">Score: {Math.round(sub.substituteScore * 100)}%</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-red-700 text-sm flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" /> Unresolved
                          </p>
                          <span className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            ✗ NO SUBSTITUTE
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary text */}
          <p className="text-sm text-slate-500 text-center pb-4">{result.summary}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-20 flex flex-col items-center justify-center text-slate-400">
          <Activity className="w-12 h-12 mb-3 text-slate-300" />
          <p className="font-semibold">Configure parameters above and run simulation</p>
        </div>
      )}
    </div>
  );
}
