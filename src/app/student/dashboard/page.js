'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { 
  User, BookOpen, Calendar, IndianRupee, 
  CheckCircle, Clock, AlertCircle, TrendingUp 
} from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({
    student: null,
    reports: [],
    attendance: [],
    events: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const studentId = user.studentId || user.id;

        if (!studentId) {
          setError('Student ID not found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch student profile
        const params = new URLSearchParams();
        if (user.username)  params.set('username', user.username);
        if (studentId)      params.set('userId', studentId);
        if (user.rollNo)    params.set('rollNo', user.rollNo);

        const studentRes = await fetch(`/api/students/profile?${params}`);
        const studentData = await studentRes.json();

        if (!studentRes.ok || !studentData.success) {
          setError(studentData.error || 'Failed to load profile');
          setLoading(false);
          return;
        }

        // Fetch other data in parallel
        const [reportsRes, eventsRes] = await Promise.all([
          fetch(`/api/reports?studentId=${studentData.data.id}`).catch(() => ({ ok: false })),
          fetch(`/api/events?branch=${user.branch || ''}`).catch(() => ({ ok: false })),
        ]);

        let reports = [];
        let events = [];

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json().catch(() => ({}));
          reports = reportsData.data || [];
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json().catch(() => ({}));
          events = (eventsData.data || []).slice(0, 5);
        }

        setData({
          student: studentData.data,
          reports,
          attendance: [],
          events,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <AppLayout requiredRole="student">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: 400 
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '3px solid #ede9fe', 
            borderTopColor: '#7c3aed', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Loading dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout requiredRole="student">
        <PageHeader title="Dashboard" subtitle="Welcome back!" />
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#ef4444', marginBottom: 8 }}>{error}</h3>
          <p style={{ color: '#64748b', marginBottom: 16 }}>
            Please contact your branch admin or try logging in again.
          </p>
          <Link href="/login">
            <button className="btn btn-primary">Go to Login</button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Safe destructuring with defaults
  const { student, reports, attendance, events } = data || {};
  const s = student || {};
  
  const attPct = s.totalWorkingDays 
    ? Math.round((s.presentDays || 0) / s.totalWorkingDays * 100) 
    : 0;
  const feePct = s.totalFee 
    ? Math.round((s.paidFee || 0) / s.totalFee * 100) 
    : 0;
  const feeDue = Math.max(0, (Number(s.totalFee) || 0) - (Number(s.paidFee) || 0));

  return (
    <AppLayout requiredRole="student">
      <PageHeader 
        title={`Welcome, ${s.name || user?.name || 'Student'}!`} 
        subtitle={`${s.class || ''} ${s.section ? `— ${s.section}` : ''} | ${s.branch || ''}`} 
      />

      {/* Profile Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white', 
        marginBottom: 20 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ 
            width: 70, 
            height: 70, 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <User size={32} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{s.name || 'Student'}</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.875rem' }}>
              Roll No: {s.rollNo || '—'} | {s.class || '—'} — {s.section || '—'}
            </p>
            <p style={{ margin: '2px 0 0', opacity: 0.8, fontSize: '0.8rem' }}>
              {s.branch || '—'} | {s.academicYear || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 14, 
        marginBottom: 20 
      }}>
        {/* Attendance Card */}
        <Link href="/student/attendance" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ 
            borderLeft: '4px solid #10b981', 
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar size={24} color="#10b981" />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
                  {attPct}%
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Attendance</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Fee Card */}
        <Link href="/student/fee" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ 
            borderLeft: `4px solid ${feeDue > 0 ? '#ef4444' : '#10b981'}`, 
            cursor: 'pointer' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <IndianRupee size={24} color={feeDue > 0 ? '#ef4444' : '#10b981'} />
              <div>
                <div style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 700, 
                  color: feeDue > 0 ? '#ef4444' : '#10b981' 
                }}>
                  ₹{feeDue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {feeDue > 0 ? 'Fee Due' : 'All Paid ✓'}
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Reports Card */}
        <Link href="/student/reports" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ borderLeft: '4px solid #6366f1', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BookOpen size={24} color="#6366f1" />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6366f1' }}>
                  {reports?.length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Reports</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Events Card */}
        <Link href="/student/events" style={{ textDecoration: 'none' }}>
          <div className="card" style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TrendingUp size={24} color="#f59e0b" />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
                  {events?.length || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Events</div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Fee Progress */}
      {s.totalFee > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
            <IndianRupee size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Fee Payment Progress
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.85rem', 
            marginBottom: 8 
          }}>
            <span>Paid: ₹{(Number(s.paidFee) || 0).toLocaleString()}</span>
            <span>{feePct}%</span>
            <span>Total: ₹{(Number(s.totalFee) || 0).toLocaleString()}</span>
          </div>
          <div style={{ 
            height: 12, 
            background: '#f1f5f9', 
            borderRadius: 99, 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              height: '100%', 
              width: `${Math.min(feePct, 100)}%`, 
              background: feePct === 100 
                ? 'linear-gradient(90deg, #10b981, #34d399)' 
                : 'linear-gradient(90deg, #6366f1, #a78bfa)', 
              borderRadius: 99, 
              transition: 'width 1s ease' 
            }} />
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {events && events.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>
            <Calendar size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Upcoming Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.slice(0, 3).map((e, i) => (
              <div 
                key={e.id || i} 
                style={{ 
                  padding: '12px 14px', 
                  background: '#f8fafc', 
                  borderRadius: 10,
                  borderLeft: '3px solid #6366f1'
                }}
              >
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{e.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  {e.date} {e.startTime && `• ${e.startTime}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Quick Links</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: 10 
        }}>
          {[
            { href: '/student/profile', label: 'My Profile', icon: User, color: '#6366f1' },
            { href: '/student/attendance', label: 'Attendance', icon: Calendar, color: '#10b981' },
            { href: '/student/fee', label: 'Fee Details', icon: IndianRupee, color: '#f59e0b' },
            { href: '/student/reports', label: 'Reports', icon: BookOpen, color: '#ec4899' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div style={{ 
                padding: '16px 12px', 
                background: '#f8fafc', 
                borderRadius: 10, 
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid #e2e8f0'
              }}>
                <Icon size={24} color={color} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                  {label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}