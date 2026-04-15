import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Users, Clock, Activity, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { getHeatmap, getLeaderboard } from '../services/api';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
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

/* ─── Heatmap cell colour ────────────────────────────────────────────────── */
function heatColor(count, avgImpact) {
  if (count === 0) return 'bg-slate-100 text-slate-400';
  if (avgImpact > 2.5) return 'bg-red-500 text-white';
  if (count > 1)       return 'bg-amber-400 text-white';
  return 'bg-emerald-400 text-white';
}

/* ─── Custom Tooltip ─────────────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-indigo-600">{payload[0].value} classes / faculty</p>
    </div>
  );
}

/* ─── Rank badge ─────────────────────────────────────────────────────────── */
const RANK_STYLE = [
  'bg-amber-100 text-amber-700',
  'bg-slate-200 text-slate-700',
  'bg-orange-100 text-orange-800',
];

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [summary,     setSummary]     = useState({ totalLeaves: 0, pendingLeaves: 0, avgImpact: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [hRes, lRes] = await Promise.all([getHeatmap(), getLeaderboard()]);
        setHeatmapData(hRes.data.data.heatmap);
        setSummary(hRes.data.data.summary);
        setLeaderboard(lRes.data.data);
      } catch (e) {
        console.error('Dashboard fetch error', e);
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

  const chartData = leaderboard.map((d) => ({
    name:   d.departmentName.substring(0, 4),
    load:   d.avgFacultyLoad,
    impact: d.avgImpactScore,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Real-time leave intelligence across all departments"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leaves"
          value={summary.totalLeaves}
          icon={Users}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          badge="+12%"
          badgeColor="bg-emerald-100 text-emerald-700"
        />
        <StatCard
          title="Pending"
          value={summary.pendingLeaves}
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          badge={summary.pendingLeaves > 0 ? 'Review' : 'Clear'}
          badgeColor={summary.pendingLeaves > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}
        />
        <StatCard
          title="Avg Impact"
          value={Number(summary.avgImpact).toFixed(1)}
          icon={Activity}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          title="Success Rate"
          value="92%"
          icon={CheckCircle}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          badge="↑ 4%"
          badgeColor="bg-emerald-100 text-emerald-700"
        />
      </div>

      {/* Heatmap + Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Leave Activity Heatmap</h2>
          </div>

          {/* Legend */}
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
                      <div
                        key={i}
                        title={`${a.date}: ${a.count} leave(s), Impact: ${a.avgImpact}`}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${heatColor(a.count, a.avgImpact)}`}
                      >
                        {a.count}
                      </div>
                    ))
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300 text-xs shrink-0">
                      —
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
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
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        {dept.pending}
                      </span>
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
    </div>
  );
}
