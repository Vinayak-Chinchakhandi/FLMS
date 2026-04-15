import React, { useEffect, useState } from 'react';
import { getLeaderboard, getHeatmap } from '../services/api';
import {
  Building2, Users, AlertTriangle, CheckCircle, TrendingUp, ChevronDown, ChevronUp,
} from 'lucide-react';

/* ─── Mock faculty breakdown per dept (extends API data) ──────────────────── */
const DEPT_FACULTY = {
  1: [
    { name: 'Dr. Arjun Mehta',  load: 3, leaves: 2, status: 'approved' },
    { name: 'Prof. Sunita Rao', load: 3, leaves: 1, status: 'pending'  },
    { name: 'Dr. Rajan Pillai', load: 2, leaves: 0, status: 'clear'    },
    { name: 'Prof. Priya Kumar',load: 2, leaves: 0, status: 'clear'    },
  ],
  2: [
    { name: 'Dr. Kiran Desai',  load: 2, leaves: 1, status: 'approved' },
    { name: 'Prof. Divya Nair', load: 2, leaves: 0, status: 'clear'    },
  ],
  3: [
    { name: 'Prof. Meena Iyer', load: 2, leaves: 0, status: 'clear'    },
  ],
  4: [
    { name: 'Dr. Sanjay Gupta', load: 2, leaves: 0, status: 'clear'    },
  ],
};

function StatusPill({ status }) {
  const map = {
    approved: 'bg-blue-100 text-blue-700',
    pending:  'bg-amber-100 text-amber-700',
    clear:    'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function ScoreBar({ value, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right">{value}</span>
    </div>
  );
}

function DeptCard({ dept, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const faculty = DEPT_FACULTY[dept.departmentId] || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate">{dept.departmentName}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {dept.facultyCount} faculty</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {dept.totalLeaves} leaves</span>
            {dept.pending > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                {dept.pending} pending
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-lg font-black text-indigo-600">{dept.responsibilityScore}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Score</p>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100">
          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50">
            {[
              { label: 'Approved', value: dept.approved,  color: 'text-blue-600' },
              { label: 'Pending',  value: dept.pending,   color: 'text-amber-600' },
              { label: 'Avg Load', value: dept.avgFacultyLoad, color: 'text-violet-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 text-center">
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Performance Score bar */}
          <div className="px-5 py-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500" /> Performance Score
              </span>
            </div>
            <ScoreBar value={dept.performanceScore} max={100} />
          </div>

          {/* Responsibility Score bar */}
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-500" /> Responsibility Score
              </span>
            </div>
            <ScoreBar value={dept.responsibilityScore} max={100} />
          </div>

          {/* Faculty table */}
          {faculty.length > 0 && (
            <div className="border-t border-slate-100">
              <p className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Faculty Breakdown
              </p>
              <div className="divide-y divide-slate-50">
                {faculty.map((f) => (
                  <div key={f.name} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0">
                      {f.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{f.load} classes/week &nbsp;·&nbsp; {f.leaves} leave(s)</p>
                    </div>
                    <StatusPill status={f.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DepartmentDetail() {
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getLeaderboard();
        setDepartments(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md">
        <h1 className="text-2xl font-black tracking-tight">Departments</h1>
        <p className="text-indigo-200 mt-0.5 text-sm">Faculty performance and leave trends per department</p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Depts',   value: departments.length,                         bg: 'bg-indigo-50',  tc: 'text-indigo-600' },
          { label: 'Total Faculty', value: departments.reduce((s, d) => s + d.facultyCount, 0),  bg: 'bg-violet-50',  tc: 'text-violet-600' },
          { label: 'Total Leaves',  value: departments.reduce((s, d) => s + d.totalLeaves, 0),   bg: 'bg-amber-50',   tc: 'text-amber-600' },
          { label: 'Avg Score',     value: departments.length
              ? Math.round(departments.reduce((s, d) => s + d.responsibilityScore, 0) / departments.length)
              : 0,                                                                      bg: 'bg-emerald-50', tc: 'text-emerald-600' },
        ].map(({ label, value, bg, tc }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border border-slate-200 shadow-sm`}>
            <p className={`text-3xl font-black ${tc}`}>{value}</p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Dept Cards */}
      <div className="space-y-3">
        {departments.map((dept, i) => (
          <DeptCard key={dept.departmentId} dept={dept} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}
