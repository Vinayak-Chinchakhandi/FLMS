import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Clock, Activity, CheckCircle, AlertTriangle, TrendingUp,
  XCircle, Play, BookOpen, Calendar,
} from 'lucide-react';
import {
  getHeatmap, getLeaderboard, getFacultyDashboard, getHodDashboard,
  acceptSubstitution, updateLeaveStatus, runSimulation,
} from '../services/api';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function PageHeader({ title, subtitle }) {
  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-md mb-6">
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      <p className="text-indigo-200 mt-0.5 text-sm">{subtitle}</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, badge, badgeColor }) {
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
                            'bg-rose-100 text-rose-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {status}
    </span>
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
              {error}
            </div>
          )}

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
  const [heatmapData,  setHeatmapData]  = useState([]);
  const [summary,      setSummary]      = useState({ totalLeaves: 0, pendingLeaves: 0, avgImpact: 0 });
  const [leaderboard,  setLeaderboard]  = useState([]);
  const [facultyData,  setFacultyData]  = useState(null);
  const [hodData,      setHodData]      = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [simLeave,     setSimLeave]     = useState(null); // for simulation modal

  const user   = JSON.parse(localStorage.getItem('iflo_user') || '{}');
  const role   = user.role || 'guest';
  const isFaculty = role === 'faculty';
  const isHod     = role === 'hod';
  const showGlobal = !isFaculty && !isHod;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (role === 'faculty' && user.id) {
        const res = await getFacultyDashboard(user.id);
        setFacultyData(res.data.data);
      } else if (role === 'hod' && user.department_id) {
        const res = await getHodDashboard(user.department_id);
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
  }, [role, user.id, user.department_id]);

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
      // Re-fetch HOD data to show updated state
      const res = await getHodDashboard(user.department_id);
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

  const headerTitle    = isFaculty ? 'Faculty Dashboard' : isHod ? 'HOD Dashboard' : 'Dashboard Overview';
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
      <PageHeader title={headerTitle} subtitle={headerSubtitle} />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ═══ FACULTY VIEW ═══ */}
      {isFaculty && facultyData ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Your Leaves"            value={facultyData.summary.totalLeaves}          icon={Users}       iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
            <StatCard title="Pending"                value={facultyData.summary.pending}              icon={Clock}       iconBg="bg-amber-50"   iconColor="text-amber-600"
              badge={facultyData.summary.pending > 0 ? 'Action' : 'Clear'} badgeColor={facultyData.summary.pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} />
            <StatCard title="Assigned Substitutions" value={facultyData.summary.assignedSubstitutions} icon={Activity}    iconBg="bg-violet-50"  iconColor="text-violet-600" />
            <StatCard title="Accepted Substitutions" value={facultyData.summary.acceptedSubstitutions} icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
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

          {/* Timetable */}
          {facultyData.timetable?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Your Timetable</h2>
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Leave requests table */}
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
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{leave.reason}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {leave.from_date} → {leave.to_date}
                              </span>
                              <span>Impact: <strong>{leave.impact_score || 'N/A'}</strong></span>
                            </div>
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
                {hodData.members.filter(m => m.role === 'faculty').map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                      {member.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{member.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation modal */}
          {simLeave && <SimulationModal leave={simLeave} onClose={() => setSimLeave(null)} />}
        </>

      /* ═══ GLOBAL / ADMIN VIEW ═══ */
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Leaves"  value={summary.totalLeaves}          icon={Users}       iconBg="bg-indigo-50"  iconColor="text-indigo-600" badge="+12%" badgeColor="bg-emerald-100 text-emerald-700" />
            <StatCard title="Pending"       value={summary.pendingLeaves}        icon={Clock}       iconBg="bg-amber-50"   iconColor="text-amber-600"
              badge={summary.pendingLeaves > 0 ? 'Review' : 'Clear'} badgeColor={summary.pendingLeaves > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'} />
            <StatCard title="Avg Impact"    value={Number(summary.avgImpact).toFixed(1)} icon={Activity}    iconBg="bg-violet-50"  iconColor="text-violet-600" />
            <StatCard title="Success Rate"  value="92%"                          icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-600" badge="↑ 4%" badgeColor="bg-emerald-100 text-emerald-700" />
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
