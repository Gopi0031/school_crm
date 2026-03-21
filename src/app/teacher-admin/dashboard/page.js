'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, UserCheck, TrendingUp, CreditCard, BookOpen, Calendar } from 'lucide-react';

function StatCard({ title, value, sub, color, icon }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}`, padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function TeacherAdminDashboard() {
  const { user }    = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (user.branch)  params.set('branch',  user.branch);
    if (user.class)   params.set('class',   user.class);
    if (user.section) params.set('section', user.section);
    fetch(`/api/stats/teacher-admin?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <AppLayout requiredRole="teacher-admin">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 14 }} />
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading dashboard...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  );

  const s      = stats || {};
  const attPct = s.totalStudents ? Math.round((s.presentToday || 0) / s.totalStudents * 100) : 0;
  const feePct = s.totalFee      ? Math.round((s.paidFee      || 0) / s.totalFee      * 100) : 0;
  const today  = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AppLayout requiredRole="teacher-admin">

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 16, padding: '22px 28px', marginBottom: 22, color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
              👋 Welcome, {user?.name?.split(' ')[0]}!
            </h1>
            <p style={{ opacity: 0.85, marginTop: 5, fontSize: '0.875rem' }}>
              {user?.class} — Section {user?.section} &nbsp;•&nbsp; {user?.branch}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.85 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} /> {today}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
        <StatCard title="Total Students"  value={s.totalStudents  || 0}                              color="#4f46e5" icon={<Users     size={20} />} />
        <StatCard title="Male"            value={s.maleStudents   || 0}                              color="#3b82f6" icon={<Users     size={20} />} />
        <StatCard title="Female"          value={s.femaleStudents || 0}                              color="#ec4899" icon={<Users     size={20} />} />
        <StatCard title="Present Today"   value={s.presentToday   || 0} sub={`${attPct}% rate`}     color="#10b981" icon={<UserCheck size={20} />} />
        <StatCard title="Pass %"          value={`${s.passPercentage || 0}%`} sub="Academic year"   color="#f59e0b" icon={<TrendingUp size={20} />} />
        <StatCard title="Fee Collected"   value={`₹${((s.paidFee||0)/1000).toFixed(1)}K`}
                                          sub={`of ₹${((s.totalFee||0)/1000).toFixed(1)}K`}         color="#8b5cf6" icon={<CreditCard size={20} />} />
      </div>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>Monthly Attendance — Last 6 Months</h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
              {user?.class} — {user?.section}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.sixMonths || []} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 }}
              />
              <Bar dataKey="present" name="Present Days" fill="#4f46e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>Today's Summary</h3>

          {[
            { l: 'Total Students', v: s.totalStudents || 0, c: '#4f46e5' },
            { l: 'Present',        v: s.presentToday  || 0, c: '#10b981' },
            { l: 'Absent',         v: s.absentToday   || 0, c: '#ef4444' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${c}10`, padding: '11px 14px', borderRadius: 10, border: `1px solid ${c}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                <span style={{ color: '#374151', fontSize: '0.875rem', fontWeight: 600 }}>{l}</span>
              </div>
              <span style={{ fontWeight: 800, color: c, fontSize: '1.1rem' }}>{v}</span>
            </div>
          ))}

          {/* Attendance progress */}
          <div style={{ marginTop: 4, background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: '0.78rem' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Attendance Rate</span>
              <span style={{ fontWeight: 800, color: attPct >= 75 ? '#10b981' : '#f59e0b' }}>{attPct}%</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${attPct}%`, background: attPct >= 75 ? 'linear-gradient(90deg,#10b981,#4f46e5)' : '#f59e0b', borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>
          </div>

          {/* Fee progress */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: '0.78rem' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Fee Collection</span>
              <span style={{ fontWeight: 800, color: '#8b5cf6' }}>{feePct}%</span>
            </div>
            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${feePct}%`, background: 'linear-gradient(90deg,#8b5cf6,#ec4899)', borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: '0.68rem', color: '#94a3b8' }}>
              <span>Paid: <b style={{ color: '#8b5cf6' }}>₹{((s.paidFee || 0) / 1000).toFixed(1)}K</b></span>
              <span>Total: <b style={{ color: '#1e293b' }}>₹{((s.totalFee || 0) / 1000).toFixed(1)}K</b></span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
