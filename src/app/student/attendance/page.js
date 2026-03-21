'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function StudentAttendance() {
  const { user }   = useAuth();
  const now        = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [attMap,  setAttMap]  = useState({});
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);

  const year        = currentDate.getFullYear();
  const month       = currentDate.getMonth();
  const monthStr    = `${year}-${String(month + 1).padStart(2, '0')}`;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    if (!user) return;
    const id = user.studentId || user.id;
    fetch(`/api/students/${id}`).then(r => r.json()).then(d => { if (d.data) setStudent(d.data); });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const id = user.studentId || user.id;
    setLoading(true);
    setAttMap({});
    fetch(`/api/attendance/monthly?entityId=${id}&month=${monthStr}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const map = {};
          d.data.forEach(a => { map[a.date] = a.status; });
          setAttMap(map);
        }
      })
      .finally(() => setLoading(false));
  }, [user, monthStr]);

  const presentCount = Object.values(attMap).filter(v => v === 'Present').length;
  const absentCount  = Object.values(attMap).filter(v => v === 'Absent').length;
  const attPct       = presentCount + absentCount > 0 ? Math.round(presentCount / (presentCount + absentCount) * 100) : 0;
  const overallPct   = student?.totalWorkingDays ? Math.round((student.presentDays || 0) / student.totalWorkingDays * 100) : 0;

  const todayStr = now.toISOString().split('T')[0];
  const canGoNext = !(year === now.getFullYear() && month >= now.getMonth());

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="My Attendance" subtitle="Monthly attendance calendar" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}
        className="att-stats">
        {[
          { l: 'Overall %',         v: `${overallPct}%`, c: '#7c3aed',  bg: '#f5f3ff' },
          { l: 'This Month Present', v: presentCount,     c: '#10b981',  bg: '#f0fdf4' },
          { l: 'This Month Absent',  v: absentCount,      c: '#ef4444',  bg: '#fef2f2' },
          { l: 'This Month %',       v: `${attPct}%`,     c: attPct >= 75 ? '#10b981' : attPct >= 50 ? '#f59e0b' : '#ef4444', bg: attPct >= 75 ? '#f0fdf4' : '#fffbeb' },
        ].map(({ l, v, c, bg }, i) => (
          <div key={l} className="card" style={{
            textAlign: 'center', borderTop: `3px solid ${c}`, background: bg,
            animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${i * 70}ms`,
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {overallPct > 0 && (
        <div className="card" style={{ marginBottom: 20, animation: 'fadeSlideUp 0.4s ease both', animationDelay: '200ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="#7c3aed" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>Annual Attendance Progress</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: overallPct >= 75 ? '#10b981' : '#ef4444' }}>{overallPct}%</span>
          </div>
          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${Math.min(overallPct, 100)}%`, background: overallPct >= 75 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)', borderRadius: 99, transition: 'width 1s ease' }} />
          </div>
          {overallPct < 75 && (
            <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 6, fontWeight: 600 }}>
              ⚠️ Below 75% threshold. Need {Math.max(0, Math.ceil((75 * (student?.totalWorkingDays || 0) / 100) - (student?.presentDays || 0)))} more present days.
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="card" style={{ maxWidth: 700, animation: 'fadeSlideUp 0.5s ease both', animationDelay: '260ms' }}>
        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <button
            className="btn btn-outline" style={{ padding: '7px 12px', borderRadius: 10 }}
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          ><ChevronLeft size={16} /></button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{MONTHS[month]}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{year}</div>
          </div>
          <button
            className="btn btn-outline" style={{ padding: '7px 12px', borderRadius: 10 }}
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            disabled={!canGoNext}
          ><ChevronRight size={16} /></button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} style={{ height: 48, borderRadius: 10, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
            <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', padding: '6px 2px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>{d}</div>
            ))}
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day     = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status  = attMap[dateStr];
              const isToday  = dateStr === todayStr;
              const isFuture = new Date(dateStr) > now;
              const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6;

              let bg     = isFuture ? '#f8fafc' : isWeekend ? '#fafafa' : status === 'Present' ? '#dcfce7' : status === 'Absent' ? '#fee2e2' : '#f1f5f9';
              let border = isToday ? '#7c3aed' : isFuture ? '#e2e8f0' : status === 'Present' ? '#86efac' : status === 'Absent' ? '#fca5a5' : '#e2e8f0';

              return (
                <div key={day} style={{
                  height: 50, borderRadius: 10, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', background: bg,
                  border: `1.5px solid ${border}`,
                  boxShadow: isToday ? '0 0 0 2px #7c3aed30' : 'none',
                  transition: 'transform 0.15s ease',
                  cursor: status ? 'default' : 'default',
                }}
                  onMouseEnter={e => { if (status) e.currentTarget.style.transform = 'scale(1.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: isToday ? 800 : 500, color: isToday ? '#7c3aed' : isWeekend ? '#94a3b8' : '#374151', lineHeight: 1 }}>{day}</span>
                  {!isFuture && status && (
                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: status === 'Present' ? '#16a34a' : '#dc2626', marginTop: 2, letterSpacing: '0.02em' }}>
                      {status === 'Present' ? '✓' : '✗'}
                    </span>
                  )}
                  {isWeekend && !status && !isFuture && (
                    <span style={{ fontSize: '0.55rem', color: '#cbd5e1', marginTop: 1 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, marginTop: 16, paddingTop: 14, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
          {[
            { label: 'Present',  bg: '#dcfce7', border: '#86efac', c: '#16a34a' },
            { label: 'Absent',   bg: '#fee2e2', border: '#fca5a5', c: '#dc2626' },
            { label: 'Weekend',  bg: '#fafafa', border: '#e2e8f0', c: '#94a3b8' },
            { label: 'No Data',  bg: '#f1f5f9', border: '#e2e8f0', c: '#94a3b8' },
          ].map(({ label, bg, border, c }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: bg, border: `1.5px solid ${border}` }} />
              <span style={{ fontSize: '0.75rem', color: c, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Month summary */}
        {!loading && (presentCount + absentCount > 0) && (
          <div style={{ marginTop: 14, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#10b981', fontSize: '1.2rem' }}>{presentCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Present Days</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '1.2rem' }}>{absentCount}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Absent Days</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, color: attPct >= 75 ? '#10b981' : '#f59e0b', fontSize: '1.2rem' }}>{attPct}%</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>This Month</div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 600px) { .att-stats { grid-template-columns: repeat(2, 1fr) !important; } }
      `}</style>
    </AppLayout>
  );
}
