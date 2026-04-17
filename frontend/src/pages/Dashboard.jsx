import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Clock, Activity, CheckCircle, AlertTriangle, TrendingUp,
  XCircle, Play, BookOpen, Calendar, Zap, Award,
} from 'lucide-react';
import {
  getHeatmap, getLeaderboard, getFacultyDashboard, getHodDashboard,
  acceptSubstitution, updateLeaveStatus, runSimulation, getSubstitutionStatus,
} from '../services/api';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function PageHeader({ title, subtitle, badge }) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-md mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {badge && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900">
            {badge}
          </span>
        )}
      </div>
      <p className="text-indigo-200 mt-0.5 text-sm">{subtitle}</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, badge, badgeColor, subtext }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900">{value}</span>
        {badge && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}

/* ─── Leave Balance Card ──────────────────────────────────────────────────── */
function LeaveBalanceCard({ taken, max }) {
  const remaining = Math.max(0, max - taken);
  const pct       = Math.min(100, Math.round((taken / max) * 100));
  const barColor  = pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';
  const textColor = pct >= 100 ? 'text-red-600' : pct >= 75 ? 'text-amber-600' : 'text-emerald-700';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leave Balance</p>
        <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
          <Award className="w-4 h-4 text-teal-600" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-black ${textColor}`}>{remaining}</span>
        <span className="text-sm text-slate-400 font-medium">/ {max} remaining</span>
      </div>
      <div className="space-y-1">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-400">{taken} used this year</p>
      </div>
    </div>
  );
}

/* ─── Heatmap cell colour ─────────────────────────────────────────────────── */
function heatColor(count, avgImpact) {
  if (count === 0) return 'bg-slate-100 text-slate-400';
  if (avgImpact > 2.5) return 'bg-red-500 text-white';
  if (count > 1)       return 'bg-amber-400 text-white';
  return 'bg-emerald-400 text-white';
}

/* ─── Status badge ────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cls =
    status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
    status === 'pending'  ? 'bg-amber-100 text-amber-700' :
    status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
    status === 'assigned' ? 'bg-blue-100 text-blue-700' :
                            'bg-rose-100 text-rose-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

/* ─── Substitution Progress Bar ─────────────────────────────────────────── */
function SubProgress({ leaveId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getSubstitutionStatus(leaveId)
      .then((r) => setData(r.data.data))
      .catch(() => {});
  }, [leaveId]);

  if (!data || data.total === 0) return null;

  const pct = data.progress;
  const barColor = pct === 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-amber-400' : 'bg-blue-500';

  return (
    <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        <span>Substitution Progress</span>
        <span className="text-slate-700">{data.accepted}/{data.total} accepted</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-3 text-[10px] text-slate-400">
        <span className="text-emerald-600 font-semibold">✓ {data.accepted} accepted</span>
        <span className="text-blue-600 font-semibold">⏳ {data.pending} pending</span>
        {data.rejected > 0 && <span className="text-red-500 font-semibold">✗ {data.rejected} rejected</span>}
      </div>
    </div>
  );
}

/* ─── Chart tooltip ────────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-indigo-600">{payload[0].value} classes / faculty</p>
    </div>
  );
}

const RANK_STYLE = [
  'bg-amber-100 text-amber-700',
  'bg-slate-200 text-slate-700',
  'bg-orange-100 text-orange-800',
];

/* ─── HOD: SimulationModal ─────────────────────────────────────────────────── */
function SimulationModal({ leave, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await runSimulation({
          faculty_id: leave.faculty_id,
          from_date:  leave.from_date,
          to_date:    leave.to_date,
        });
        setResult(res.data.data);
      } catch (e) {
        setError(e.response?.data?.message || 'Simulation failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [leave]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Leave Impact Simulation</h3>
            <p className="text-xs text-slate-500 mt-0.5">{leave.faculty_name} · {leave.from_date} → {leave.to_date}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <XCircle className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">{error}</div>}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-violet-700">{result.affectedClasses.length}</p>
                  <p className="text-xs text-violet-600 font-medium">Affected</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-emerald-700">{result.resolvedCount}</p>
                  <p className="text-xs text-emerald-600 font-medium">Resolved</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-red-700">{result.unresolvedCount}</p>
                  <p className="text-xs text-red-600 font-medium">Unresolved</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{result.summary}</p>
              {result.substitutions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proposed Substitutions</p>
                  {result.substitutions.map((s, i) => (
                    <div key={i} className={`rounded-xl border p-3 flex items-center justify-between ${
                      s.status === 'ASSIGNED' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.subject} <span className="text-slate-400 font-normal">({s.classId})</span></p>
                        <p className="text-xs text-slate-500">{s.day} · {s.timeSlot}</p>
                      </div>
                      <div className="text-right">
                        {s.status === 'ASSIGNED' ? (
                          <>
                            <p className="text-xs font-bold text-emerald-700">{s.substitute?.name}</p>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">Assigned</span>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 uppercase">No Sub</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Component ────────────────────────────────────────────── */
export default function Dashboard() {
  const [heatmapData,   setHeatmapData]   = useState([]);
  const [summary,       setSummary]       = useState({ totalLeaves: 0, pendingLeaves: 0, avgImpact: 0 });
  const [leaderboard,   setLeaderboard]   = useState([]);
  const [facultyData,   setFacultyData]   = useState(null);
  const [hodData,       setHodData]       = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [simLeave,      setSimLeave]      = useState(null);

  const rawUser   = JSON.parse(localStorage.getItem('iflo_user') || '{}');
  const isActingHod = rawUser.role !== 'hod' && rawUser.acting_role === 'hod';
  const role      = (rawUser.role === 'hod' || rawUser.acting_role === 'hod') ? 'hod' : rawUser.role || 'guest';
  const isFaculty = role === 'faculty';
  const isHod     = role === 'hod';
  const showGlobal = !isFaculty && !isHod;
  const user = { ...rawUser, role };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isFaculty && rawUser.id) {
        const res = await getFacultyDashboard(rawUser.id);
        setFacultyData(res.data.data);
      } else if (isHod && rawUser.department_id) {
        const res = await getHodDashboard(rawUser.department_id);
        setHodData(res.data.data);
      } else {
        const [hRes, lRes] = await Promise.all([getHeatmap(), getLeaderboard()]);
        setHeatmapData(hRes.data.data.heatmap);
        setSummary(hRes.data.data.summary);
        setLeaderboard(lRes.data.data);
      }
    } catch (e) {
      console.error('Dashboard fetch error', e);
      setError('Unable to load dashboard data. Please check the backend or login again.');
    } finally {
      setLoading(false);
    }
  }, [isFaculty, isHod, rawUser.id, rawUser.department_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Faculty: accept substitution ─── */
  const handleAcceptSubstitution = async (substitutionId) => {
    setActionLoading((p) => ({ ...p, [substitutionId]: true }));
    try {
      await acceptSubstitution(substitutionId);
      setFacultyData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          substitutions: prev.substitutions.map((item) =>
            item.id === substitutionId ? { ...item, status: 'accepted' } : item
          ),
          // Move to extraClasses
          extraClasses: [
            ...(prev.extraClasses || []),
            prev.substitutions.find((s) => s.id === substitutionId) || {},
          ],
          summary: {
            ...prev.summary,
            assignedSubstitutions: prev.summary.assignedSubstitutions - 1,
            acceptedSubstitutions: prev.summary.acceptedSubstitutions + 1,
            extraLoad: (prev.summary.extraLoad || 0) + 1,
          },
        };
      });
    } catch (err) {
      console.error('Substitution accept failed', err);
      alert('Unable to accept substitution. Please try again.');
    } finally {
      setActionLoading((p) => ({ ...p, [substitutionId]: false }));
    }
  };

  /* ── HOD: approve / reject ─── */
  const handleHodAction = async (leaveId, status) => {
    setActionLoading((p) => ({ ...p, [leaveId]: status }));
    try {
      await updateLeaveStatus(leaveId, status);
      const res = await getHodDashboard(rawUser.department_id);
      setHodData(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert(`Action failed: ${msg}`);
    } finally {
      setActionLoading((p) => {
        const copy = { ...p };
        delete copy[leaveId];
        return copy;
      });
    }
  };

  const chartData = showGlobal
    ? leaderboard.map((d) => ({
        name: d.departmentName.substring(0, 4),
        load: d.avgFacultyLoad,
      }))
    : [];

  const headerTitle    = isFaculty ? 'Faculty Dashboard' : isHod ? (isActingHod ? 'Acting HOD Dashboard' : 'HOD Dashboard') : 'Dashboard Overview';
  const headerSubtitle = isFaculty
    ? 'Track your leave requests, substitutions, and timetable'
    : isHod
      ? 'Review and manage departmental leave requests'
      : 'Real-time leave intelligence across all departments';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        badge={isActingHod ? 'Acting HOD' : null}
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ═══ FACULTY VIEW ═══ */}
      {isFaculty && facultyData ? (
        <>
          {/* Stats row — 5 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <LeaveBalanceCard
              taken={facultyData.summary.leavesTaken ?? 0}
              max={facultyData.summary.maxLeaves ?? 12}
            />
            <StatCard title="Your Leaves"    value={facultyData.summary.totalLeaves}          icon={Users}       iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
            <StatCard title="Pending"         value={facultyData.summary.pending}              icon={Clock}       iconBg="bg-amber-50"   iconColor="text-amber-600"
              badge={facultyData.summary.pending > 0 ? 'Action' : 'Clear'} badgeColor={facultyData.summary.pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} />
            <StatCard title="Normal Load"     value={facultyData.summary.normalLoad ?? '—'}   icon={BookOpen}    iconBg="bg-slate-50"   iconColor="text-slate-500"  subtext="classes/week" />
            <StatCard title="Extra Load"      value={facultyData.summary.extraLoad ?? 0}      icon={Zap}         iconBg="bg-orange-50"  iconColor="text-orange-500" subtext="substitution classes" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Leave history */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leave Requests</h2>
                <span className="text-xs text-slate-400">{facultyData.leaves.length} records</span>
              </div>
              {facultyData.leaves.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No leave requests yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                        <th className="px-5 py-3 text-left font-semibold">Reason</th>
                        <th className="px-5 py-3 text-right font-semibold">Dates</th>
                        <th className="px-5 py-3 text-right font-semibold">Impact</th>
                        <th className="px-5 py-3 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {facultyData.leaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-semibold text-slate-900">{leave.reason}</td>
                          <td className="px-5 py-3.5 text-slate-500 text-right text-xs">{leave.from_date} → {leave.to_date}</td>
                          <td className="px-5 py-3.5 text-slate-500 text-right">{leave.impact_score || '—'}</td>
                          <td className="px-5 py-3.5 text-right"><StatusBadge status={leave.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Substitution tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Substitution Tasks</h2>
              </div>
              {facultyData.substitutions.length > 0 ? (
                <div className="space-y-3">
                  {facultyData.substitutions.map((sub) => (
                    <div key={sub.id} className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
                      <p className="text-sm font-semibold text-slate-900">
                        For {sub.originalFaculty?.name || 'colleague'}
                      </p>
                      <p className="text-xs text-slate-500">Class: {sub.class_id} · {sub.date}</p>
                      {sub.subject && <p className="text-xs text-indigo-600 mt-0.5">{sub.subject} — {sub.day} {sub.start_time}</p>}
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <StatusBadge status={sub.status} />
                        {sub.status === 'assigned' && (
                          <button
                            type="button"
                            disabled={actionLoading[sub.id]}
                            onClick={() => handleAcceptSubstitution(sub.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-70 transition-colors"
                          >
                            {actionLoading[sub.id] ? 'Saving…' : 'Accept'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-400 text-sm">
                  No substitute assignments.
                </div>
              )}
            </div>
          </div>

          {/* Extra Classes (accepted substitutions) */}
          {facultyData.extraClasses?.length > 0 && (
            <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-orange-100 bg-orange-50 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <h2 className="text-sm font-bold text-orange-800 uppercase tracking-wider">Extra Classes (Substitutions)</h2>
                <span className="ml-auto text-xs text-orange-500 font-semibold">TEMPORARY — Not in your permanent schedule</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-left font-semibold">Covering For</th>
                      <th className="px-5 py-3 text-left font-semibold">Subject</th>
                      <th className="px-5 py-3 text-left font-semibold">Class</th>
                      <th className="px-5 py-3 text-left font-semibold">Day</th>
                      <th className="px-5 py-3 text-left font-semibold">Time</th>
                      <th className="px-5 py-3 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {facultyData.extraClasses.map((ec, i) => (
                      <tr key={ec.id || i} className="hover:bg-orange-50/50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900">{ec.originalFaculty?.name || 'Colleague'}</td>
                        <td className="px-5 py-3 text-slate-700">{ec.subject || '—'}</td>
                        <td className="px-5 py-3 text-indigo-600 font-mono text-xs">{ec.class_id}</td>
                        <td className="px-5 py-3 text-slate-600">{ec.day || '—'}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{ec.start_time} – {ec.end_time}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{ec.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Original Timetable */}
          {facultyData.timetable?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Permanent Timetable</h2>
                <span className="ml-auto text-xs text-slate-400">{facultyData.timetable.length} slots</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-left font-semibold">Subject</th>
                      <th className="px-5 py-3 text-left font-semibold">Class</th>
                      <th className="px-5 py-3 text-left font-semibold">Day</th>
                      <th className="px-5 py-3 text-left font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {facultyData.timetable.map((slot) => (
                      <tr key={slot.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3 font-semibold text-slate-900">{slot.subject}</td>
                        <td className="px-5 py-3 text-indigo-600 font-mono text-xs">{slot.class_id}</td>
                        <td className="px-5 py-3 text-slate-600">{slot.day}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs">{slot.start_time} – {slot.end_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>

      /* ═══ HOD VIEW ═══ */
      ) : isHod && hodData ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Team Leaves"    value={hodData.summary.totalLeaves}  icon={Users}       iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
            <StatCard title="Pending Review" value={hodData.summary.pending}      icon={Clock}       iconBg="bg-amber-50"   iconColor="text-amber-600"
              badge={hodData.summary.pending > 0 ? 'Action' : 'Clear'} badgeColor={hodData.summary.pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} />
            <StatCard title="Approved"       value={hodData.summary.approved}     icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            <StatCard title="Avg Impact"     value={hodData.summary.averageImpact?.toFixed?.(1) ?? hodData.summary.averageImpact} icon={Activity} iconBg="bg-violet-50" iconColor="text-violet-600" />
          </div>

          {/* Acting HOD notice */}
          {hodData.actingHod && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Active Acting HOD Assignment</p>
                <p className="text-xs text-amber-700">
                  Acting HOD from {hodData.actingHod.from_date} to {hodData.actingHod.to_date}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Leave requests with substitution progress */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Department Leave Requests</h2>
                <span className="text-xs text-slate-400">{hodData.leaves.length} requests</span>
              </div>
              {hodData.leaves.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No leave requests in your department.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {hodData.leaves.map((leave) => {
                    const pending = actionLoading[leave.id];
                    return (
                      <div key={leave.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-slate-900 text-sm">{leave.faculty_name || 'Faculty'}</p>
                              <StatusBadge status={leave.status} />
                              {leave.is_hod_leave && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                                  HOD Leave
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{leave.reason}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{leave.from_date} → {leave.to_date}
                              </span>
                              <span>Impact: <strong>{leave.impact_score || 'N/A'}</strong></span>
                            </div>
                            {/* Substitution progress for approved leaves */}
                            {leave.status === 'approved' && (
                              <SubProgress leaveId={leave.id} />
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              title="Run Simulation"
                              onClick={() => setSimLeave(leave)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                            {leave.status === 'pending' && (
                              <>
                                <button
                                  disabled={!!pending}
                                  onClick={() => handleHodAction(leave.id, 'approved')}
                                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                                >
                                  {pending === 'approved' ? 'Saving…' : 'Approve'}
                                </button>
                                <button
                                  disabled={!!pending}
                                  onClick={() => handleHodAction(leave.id, 'rejected')}
                                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 transition-colors"
                                >
                                  {pending === 'rejected' ? 'Saving…' : 'Reject'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team members */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Department Team</h2>
              </div>
              <div className="space-y-2">
                {hodData.members.filter(m => m.role === 'faculty').map((member) => {
                  const isActingHodMember = member.acting_role === 'hod';
                  return (
                    <div key={member.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isActingHodMember ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${isActingHodMember ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'}`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{member.name}</p>
                        <p className="text-xs text-slate-500 capitalize">
                          {isActingHodMember ? '⭐ Acting HOD' : member.role}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {simLeave && <SimulationModal leave={simLeave} onClose={() => setSimLeave(null)} />}
        </>

      /* ═══ GLOBAL / ADMIN VIEW ═══ */
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Leaves"  value={summary.totalLeaves}                    icon={Users}       iconBg="bg-indigo-50"  iconColor="text-indigo-600" badge="+12%" badgeColor="bg-emerald-100 text-emerald-700" />
            <StatCard title="Pending"       value={summary.pendingLeaves}                  icon={Clock}       iconBg="bg-amber-50"   iconColor="text-amber-600"
              badge={summary.pendingLeaves > 0 ? 'Review' : 'Clear'} badgeColor={summary.pendingLeaves > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} />
            <StatCard title="Avg Impact"    value={Number(summary.avgImpact).toFixed(1)}   icon={Activity}    iconBg="bg-violet-50"  iconColor="text-violet-600" />
            <StatCard title="Success Rate"  value="92%"                                    icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" badge="↑ 4%" badgeColor="bg-emerald-100 text-emerald-700" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Heatmap */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leave Activity Heatmap</h2>
              </div>
              <div className="flex items-center gap-4 mb-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Low</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Medium</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> High</span>
              </div>
              <div className="space-y-3">
                {heatmapData.map((dept) => (
                  <div key={dept.departmentId} className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-slate-600 w-28 shrink-0 truncate" title={dept.departmentName}>
                      {dept.departmentName}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {dept.leaveActivity.length > 0 ? (
                        dept.leaveActivity.map((a, i) => (
                          <div key={i} title={`${a.date}: ${a.count} leave(s), Impact: ${a.avgImpact}`}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${heatColor(a.count, a.avgImpact)}`}>
                            {a.count}
                          </div>
                        ))
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs shrink-0">—</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Avg Faculty Load</h2>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="load" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Department Leaderboard</h2>
              <span className="text-xs text-slate-400 font-medium">Responsibility Score ↓</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-3 text-left font-semibold">Rank</th>
                    <th className="px-5 py-3 text-left font-semibold">Department</th>
                    <th className="px-5 py-3 text-right font-semibold">Faculty</th>
                    <th className="px-5 py-3 text-right font-semibold">Leaves</th>
                    <th className="px-5 py-3 text-right font-semibold">Pending</th>
                    <th className="px-5 py-3 text-right font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {leaderboard.map((dept, i) => (
                    <tr key={dept.departmentId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${RANK_STYLE[i] || 'bg-slate-100 text-slate-600'}`}>
                          {dept.rank}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{dept.departmentName}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-right">{dept.facultyCount}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-right">{dept.totalLeaves}</td>
                      <td className="px-5 py-3.5 text-right">
                        {dept.pending > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">{dept.pending}</span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-black text-indigo-600">{dept.responsibilityScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
