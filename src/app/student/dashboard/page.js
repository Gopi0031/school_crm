'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, UserCheck, CreditCard, TrendingUp, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Link from 'next/link';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ title, value, sub, color, icon, delay = 0 }) {
  return (
    <div className="card" style={{
      borderTop: `3px solid ${color}`,
      display: 'flex', gap: 14, alignItems: 'center',
      animation: `fadeSlideUp 0.5s ease both`, animationDelay: `${delay}ms`,
    }}>
      <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginTop: 3 }}>{title}</div>
        {sub && <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user }      = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const id = user.studentId || user.id;
    Promise.all([
      fetch(`/api/students/${id}`).then(r => r.json()),
      fetch(`/api/reports?studentId=${id}`).then(r => r.json()),
      fetch(`/api/attendance/monthly?entityId=${id}&year=${new Date().getFullYear()}`).then(r => r.json()),
      fetch(`/api/events?branch=${encodeURIComponent(user.branch || '')}`).then(r => r.json()),
    ]).then(([sRes, rRes, aRes, eRes]) => {
      setData({
        student:    sRes.data   || {},
        reports:    rRes.data   || [],
        attendance: aRes.data   || [],
        events:     eRes.data   || [],
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <AppLayout requiredRole="student">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 16 }}>
        <div style={{ width: 44, height: 44, border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading your dashboard...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </AppLayout>
  );

  const { student, reports, attendance, events } = data;
  const s         = student || {};
  const attPct    = s.totalWorkingDays ? Math.round((s.presentDays || 0) / s.totalWorkingDays * 100) : 0;
  const feePct    = s.totalFee ? Math.round((s.paidFee || 0) / s.totalFee * 100) : 0;
  const due       = (s.totalFee || 0) - (s.paidFee || 0);
  const passCount = reports.filter(r => r.status === 'Pass').length;
  const avgPct    = reports.length ? Math.round(reports.reduce((a, r) => a + r.percentage, 0) / reports.length) : 0;

  const months = {};
  attendance.forEach(a => {
    const idx = parseInt(a.date.slice(5, 7), 10) - 1;
    const key = MONTH_NAMES[idx] || a.date.slice(5, 7);
    if (!months[key]) months[key] = { month: key, present: 0, absent: 0 };
    if (a.status === 'Present') months[key].present++;
    else months[key].absent++;
  });
  const chartData = Object.values(months);

  const upcoming = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  const firstName = s.name?.split(' ')[0] || 'Student';
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <AppLayout requiredRole="student">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)',
        borderRadius: 18, padding: '24px 28px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 8px 32px rgba(109,40,217,0.25)',
        animation: 'fadeSlideUp 0.4s ease both',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600, marginBottom: 4 }}>{greeting} 👋</div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{firstName}</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginTop: 4 }}>
            {s.class} — Section {s.section} &nbsp;•&nbsp; Roll No: {s.rollNo} &nbsp;•&nbsp; {s.branch}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{attPct}%</div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Overall Attendance</div>
          <div style={{ marginTop: 8, height: 6, width: 120, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${attPct}%`, background: 'white', borderRadius: 99, transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard title="Attendance"  value={`${attPct}%`} sub={`${s.presentDays || 0} / ${s.totalWorkingDays || 0} days`} color="#7c3aed" icon={<UserCheck size={20} />} delay={0} />
        <StatCard title="Subjects"    value={[...new Set(reports.map(r => r.subject))].length || 0} sub="With reports" color="#3b82f6" icon={<BookOpen size={20} />} delay={80} />
        <StatCard title="Avg Marks"   value={`${avgPct}%`} sub={`Pass: ${passCount} / ${reports.length}`} color="#10b981" icon={<TrendingUp size={20} />} delay={160} />
        <StatCard title="Fee Due"     value={`₹${due.toLocaleString()}`} sub={`${feePct}% paid`} color={due > 0 ? '#ef4444' : '#10b981'} icon={<CreditCard size={20} />} delay={240} />
      </div>

      {/* Charts + Events */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 18 }}
          className="dash-grid">
          {/* Attendance Chart */}
          <div className="card" style={{ animation: 'fadeSlideUp 0.5s ease both', animationDelay: '200ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, color: '#1e293b' }}>Monthly Attendance</h3>
              <Link href="/student/attendance" style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                View Full <ChevronRight size={13} />
              </Link>
            </div>
            {chartData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No attendance data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={chartData} barSize={18} barCategoryGap="30%">
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                  <Bar dataKey="present" name="Present" fill="#7c3aed" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="absent"  name="Absent"  fill="#fca5a5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card" style={{ animation: 'fadeSlideUp 0.5s ease both', animationDelay: '280ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Upcoming Events</h3>
              <Link href="/student/events" style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>All</Link>
            </div>
            {upcoming.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', textAlign: 'center', padding: '30px 0' }}>🎉 No upcoming events</div>
            ) : upcoming.map((ev, i) => (
              <div key={ev._id} style={{
                padding: '10px 0', borderBottom: i < upcoming.length - 1 ? '1px solid #f1f5f9' : 'none',
                animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${300 + i * 60}ms`,
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b', marginBottom: 2 }}>{ev.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>📅 {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{ev.startTime ? ` • ${ev.startTime}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fee Progress */}
      <div className="card" style={{ marginBottom: 18, animation: 'fadeSlideUp 0.5s ease both', animationDelay: '320ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 700, color: '#1e293b' }}>Fee Status</h3>
          <Link href="/student/fee" style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>Details <ChevronRight size={13} /></Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
          <span>Paid: <strong style={{ color: '#10b981' }}>₹{(s.paidFee || 0).toLocaleString()}</strong></span>
          <span>{feePct}% complete</span>
          <span>Total: <strong>₹{(s.totalFee || 0).toLocaleString()}</strong></span>
        </div>
        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${Math.min(feePct, 100)}%`, background: feePct >= 100 ? '#10b981' : 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 99, transition: 'width 1s ease' }} />
        </div>
      </div>

      {/* Recent Results */}
      <div className="card" style={{ animation: 'fadeSlideUp 0.5s ease both', animationDelay: '400ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, color: '#1e293b' }}>Recent Results</h3>
          <Link href="/student/results" style={{ fontSize: '0.75rem', color: '#7c3aed', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            View All <ChevronRight size={13} />
          </Link>
        </div>
        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8', fontSize: '0.875rem' }}>📋 No results uploaded yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Subject', 'Marks', 'Total', 'Percentage', 'Result', 'Exam'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 6).map((r, i) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #f8fafc', animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${440 + i * 40}ms` }}>
                    <td style={{ padding: '11px 14px', fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{r.subject}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 800, color: '#7c3aed' }}>{r.marksObtained}</td>
                    <td style={{ padding: '11px 14px', color: '#64748b' }}>{r.totalMarks}</td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.percentage}%`, background: r.percentage >= 75 ? '#10b981' : r.percentage >= 35 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' }}>{r.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, background: r.status === 'Pass' ? '#dcfce7' : '#fee2e2', color: r.status === 'Pass' ? '#16a34a' : '#dc2626' }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '0.78rem', color: '#64748b' }}>{r.exam}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}
