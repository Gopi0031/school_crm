'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, UserCheck, TrendingUp, CreditCard, Calendar, Lock, GraduationCap } from 'lucide-react';

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
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Get teacher's assigned class
  const teacherClass = user?.assignedClass || user?.class || '';
  const teacherSection = user?.section || '';

  useEffect(() => {
    if (!user) return;
    
    // ✅ Only fetch if teacher has assigned class
    if (!teacherClass || !teacherSection) {
      console.log('[Dashboard] No class assigned:', { teacherClass, teacherSection });
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    params.set('branch', user.branch || '');
    params.set('class', teacherClass);
    params.set('section', teacherSection);

    console.log('[Dashboard] Fetching stats for:', { 
      branch: user.branch, 
      class: teacherClass, 
      section: teacherSection 
    });

    fetch(`/api/stats/teacher-admin?${params}`)
      .then(r => r.json())
      .then(d => { 
        if (d.success) {
          console.log('[Dashboard] Stats loaded:', d.data);
          setStats(d.data); 
        }
      })
      .finally(() => setLoading(false));
  }, [user, teacherClass, teacherSection]);

  if (loading) return (
    <AppLayout requiredRole="teacher-admin">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', marginBottom: 14 }} />
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading dashboard...</span>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  );

  // ✅ Show message if no class assigned
  if (!teacherClass || !teacherSection) {
    return (
      <AppLayout requiredRole="teacher-admin">
        <div style={{ 
          background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', 
          borderRadius: 16, 
          padding: '22px 28px', 
          marginBottom: 22, 
          color: 'white' 
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            👋 Welcome, {user?.name?.split(' ')[0]}!
          </h1>
          <p style={{ opacity: 0.85, marginTop: 5, fontSize: '0.875rem' }}>
            {user?.branch}
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ 
            width: 80, height: 80, 
            background: '#fef3c7', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            <GraduationCap size={36} color="#f59e0b" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
            No Class Assigned Yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: 450, margin: '0 auto 20px' }}>
            You haven't been assigned as a class teacher yet. Once assigned, you'll be able to:
          </p>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: 12, 
            maxWidth: 400, 
            margin: '0 auto 24px' 
          }}>
            {[
              '📊 View student statistics',
              '✅ Mark attendance',
              '📈 Track performance',
              '💰 View fee status',
            ].map((item, i) => (
              <div key={i} style={{ 
                background: '#f8fafc', 
                padding: '10px 14px', 
                borderRadius: 8, 
                fontSize: '0.8rem', 
                color: '#374151',
                textAlign: 'left'
              }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ 
            background: '#eff6ff', 
            border: '1px solid #bfdbfe', 
            borderRadius: 10, 
            padding: '14px 20px', 
            display: 'inline-block' 
          }}>
            <p style={{ color: '#1e40af', fontSize: '0.85rem', margin: 0 }}>
              💡 Contact your branch administrator to get assigned as a class teacher.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const s = stats || {};
  const attPct = s.totalStudents ? Math.round((s.presentToday || 0) / s.totalStudents * 100) : 0;
  const feePct = s.totalFee ? Math.round((s.paidFee || 0) / s.totalFee * 100) : 0;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
              Class Teacher: <strong>{teacherClass} — Section {teacherSection}</strong> &nbsp;•&nbsp; {user?.branch}
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
        <StatCard title="Total Students" value={s.totalStudents || 0} color="#4f46e5" icon={<Users size={20} />} />
        <StatCard title="Male" value={s.maleStudents || 0} color="#3b82f6" icon={<Users size={20} />} />
        <StatCard title="Female" value={s.femaleStudents || 0} color="#ec4899" icon={<Users size={20} />} />
        <StatCard title="Present Today" value={s.presentToday || 0} sub={`${attPct}% rate`} color="#10b981" icon={<UserCheck size={20} />} />
        <StatCard title="Pass %" value={`${s.passPercentage || 0}%`} sub="Academic year" color="#f59e0b" icon={<TrendingUp size={20} />} />
        <StatCard title="Fee Collected" value={`₹${((s.paidFee || 0) / 1000).toFixed(1)}K`}
          sub={`of ₹${((s.totalFee || 0) / 1000).toFixed(1)}K`} color="#8b5cf6" icon={<CreditCard size={20} />} />
      </div>

      {/* ── Main Grid ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>Monthly Attendance — Last 6 Months</h3>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
              {teacherClass} — {teacherSection}
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
            { l: 'Present', v: s.presentToday || 0, c: '#10b981' },
            { l: 'Absent', v: s.absentToday || 0, c: '#ef4444' },
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

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}