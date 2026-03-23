'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Clock, Calendar, BookOpen } from 'lucide-react';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const DAY_COLORS = {
  Monday:    { bg:'#eff6ff', accent:'#3b82f6' },
  Tuesday:   { bg:'#f5f3ff', accent:'#8b5cf6' },
  Wednesday: { bg:'#f0fdf4', accent:'#10b981' },
  Thursday:  { bg:'#fff7ed', accent:'#f59e0b' },
  Friday:    { bg:'#fdf2f8', accent:'#ec4899' },
  Saturday:  { bg:'#f0f9ff', accent:'#06b6d4' },
};

const SUBJECT_COLORS = ['#eff6ff','#f5f3ff','#f0fdf4','#fff7ed','#fdf4ff','#f0f9ff','#fef9c3','#fff5f5'];

export default function StudentTimetable() {
  const { user }   = useAuth();
  const [tt,       setTt]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() - 1] || 'Monday');

  useEffect(() => {
    if (!user) return;
    fetch(`/api/timetable?branch=${user.branch}&class=${user.class}&section=${user.section}`)
      .then(r => r.json())
      .then(d => { setTt(d.data); setLoading(false); });
  }, [user]);

  const todayData = tt?.days?.find(d => d.day === activeDay);

  return (
    <AppLayout requiredRole="student">
      <style jsx global>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .period-card { animation: fadeSlide 0.35s ease forwards; }
      `}</style>

      <PageHeader title="My Timetable" subtitle={`${user?.class} — Section ${user?.section}`} />

      <div style={{ maxWidth: 780, display:'flex', flexDirection:'column', gap:18 }}>

        {/* ── Day selector ── */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {DAYS.map(day => {
            const c      = DAY_COLORS[day];
            const isToday = day === (DAYS[new Date().getDay()-1]);
            const isAct  = activeDay === day;
            return (
              <button key={day}
                onClick={() => setActiveDay(day)}
                style={{ padding:'10px 16px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', position:'relative',
                  background: isAct ? c.accent : 'white',
                  color: isAct ? 'white' : c.accent,
                  boxShadow: isAct ? `0 4px 14px ${c.accent}44` : '0 1px 4px rgba(0,0,0,0.08)',
                  transition:'all 0.25s',
                }}>
                {day.slice(0,3)}
                {isToday && !isAct && (
                  <span style={{ position:'absolute', top:4, right:4, width:6, height:6, borderRadius:'50%', background:c.accent }} />
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ textAlign:'center', padding:'50px 0', color:'#94a3b8' }}>
            <div style={{ width:28, height:28, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
            Loading timetable...
          </div>
        )}

        {!loading && !tt && (
          <div style={{ textAlign:'center', padding:'50px 0', color:'#94a3b8' }}>
            <Calendar size={40} style={{ margin:'0 auto 12px', opacity:0.3 }} />
            <div style={{ fontWeight:600 }}>Timetable not set yet</div>
            <div style={{ fontSize:'0.8rem', marginTop:4 }}>Your teacher will update it soon</div>
          </div>
        )}

        {!loading && tt && (
          <>
            {/* ── Period cards ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(todayData?.periods || []).filter(p => p.subject).map((period, idx) => {
                const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
                const accent = DAY_COLORS[activeDay].accent;
                return (
                  <div key={idx} className="period-card"
                    style={{ display:'flex', alignItems:'center', gap:14, background:color, borderRadius:14, padding:'14px 18px',
                      border:`1px solid ${accent}20`, boxShadow:`0 2px 8px ${accent}10`,
                      animationDelay:`${idx*0.06}s`,
                    }}>
                    {/* Period badge */}
                    <div style={{ width:40, height:40, borderRadius:10, background:accent, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:900, fontSize:'0.85rem', flexShrink:0 }}>
                      P{period.periodNo}
                    </div>
                    {/* Subject info */}
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, color:'#1e293b', fontSize:'0.95rem' }}>{period.subject}</div>
                      {period.teacher && <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>👤 {period.teacher}</div>}
                    </div>
                    {/* Time */}
                    {(period.startTime || period.endTime) && (
                      <div style={{ display:'flex', alignItems:'center', gap:5, color:accent, fontWeight:700, fontSize:'0.78rem', background:'white', padding:'5px 10px', borderRadius:20, flexShrink:0 }}>
                        <Clock size={12} />
                        {period.startTime} – {period.endTime}
                      </div>
                    )}
                  </div>
                );
              })}
              {!todayData?.periods?.filter(p=>p.subject).length && (
                <div style={{ textAlign:'center', padding:'30px 0', color:'#94a3b8', fontSize:'0.85rem' }}>No classes on {activeDay}</div>
              )}
            </div>

            {/* ── Full week mini table ── */}
            <div className="card" style={{ marginTop:4 }}>
              <div style={{ fontWeight:800, color:'#1e293b', marginBottom:12, fontSize:'0.9rem' }}>📅 Full Week Overview</div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.72rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'7px 8px', background:'#f8faff', color:'#64748b', textAlign:'left' }}>P#</th>
                      {DAYS.map(d => (
                        <th key={d} style={{ padding:'7px 8px', background:'#f8faff', color: d===activeDay?'#4f46e5':'#64748b', fontWeight: d===activeDay?800:600, textAlign:'center' }}>{d.slice(0,3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4,5,6,7,8].map(p => (
                      <tr key={p} style={{ borderBottom:'1px solid #f1f5f9' }}>
                        <td style={{ padding:'7px 8px', fontWeight:700, color:'#94a3b8' }}>P{p}</td>
                        {DAYS.map(day => {
                          const d   = tt.days?.find(x=>x.day===day);
                          const per = d?.periods?.find(x=>x.periodNo===p);
                          return (
                            <td key={day} style={{ padding:'7px 6px', textAlign:'center' }}>
                              {per?.subject
                                ? <span style={{ background: day===activeDay?'#eff6ff':'#f8faff', color: day===activeDay?'#4f46e5':'#475569', padding:'2px 7px', borderRadius:5, fontWeight:600 }}>{per.subject}</span>
                                : <span style={{ color:'#e2e8f0' }}>—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
