'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Clock, Save, CheckCircle, Calendar } from 'lucide-react';


const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const PERIODS = [1,2,3,4,5,6,7,8];

const makeEmptyDays = () =>
  DAYS.map(day => ({
    day,
    periods: PERIODS.map(p => ({ periodNo:p, subject:'', teacher:'', startTime:'', endTime:'' })),
  }));

// ✅ Merge DB data into full DAYS structure — ensures all 6 days always exist
const mergeDays = (dbDays) =>
  DAYS.map(day => {
    const found = dbDays?.find(d => d.day === day);
    if (!found) return { day, periods: PERIODS.map(p => ({ periodNo:p, subject:'', teacher:'', startTime:'', endTime:'' })) };
    // Ensure all 8 periods exist
    const periods = PERIODS.map(p => {
      const per = found.periods?.find(x => x.periodNo === p);
      return per || { periodNo:p, subject:'', teacher:'', startTime:'', endTime:'' };
    });
    return { ...found, periods };
  });

export default function TeacherTimetable() {
  const { user } = useAuth();
  const [days,     setDays]     = useState(makeEmptyDays());
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');

  useEffect(() => {
    if (!user?.branch || !user?.class || !user?.section) {
      setLoading(false);
      return;
    }
    fetch(`/api/timetable?branch=${encodeURIComponent(user.branch)}&class=${encodeURIComponent(user.class)}&section=${encodeURIComponent(user.section)}`)
      .then(r => r.json())
      .then(d => {
        if (d.data?.days?.length) {
          setDays(mergeDays(d.data.days)); // ✅ always full 6-day structure
        } else {
          setDays(makeEmptyDays());
        }
        setLoading(false);
      })
      .catch(() => { setDays(makeEmptyDays()); setLoading(false); });
  }, [user]);

  // ✅ Update by day NAME not index — safe even after DB load
  const updatePeriod = (dayName, pIdx, field, value) => {
    setDays(prev =>
      prev.map(d => d.day !== dayName ? d : {
        ...d,
        periods: d.periods.map((p, pi) => pi !== pIdx ? p : { ...p, [field]: value }),
      })
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const res  = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: user.branch, class: user.class, section: user.section,
          days, updatedBy: user.name,
        }),
      });
      const data = await res.json();
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally { setSaving(false); }
  };

  // ✅ Always find by name — never by index
  const activeDayData = days.find(d => d.day === activeDay)
    || { day: activeDay, periods: PERIODS.map(p => ({ periodNo:p, subject:'', teacher:'', startTime:'', endTime:'' })) };

  const filledCount = (day) => days.find(d => d.day === day)?.periods?.filter(p => p.subject).length || 0;

  return (
    <AppLayout requiredRole="teacher-admin">
      <style jsx global>{`
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .period-row { animation: fadeUp 0.25s ease forwards; opacity:0; }
        .day-tab { transition: all 0.2s ease !important; }
        .day-tab:hover { transform: translateY(-2px) !important; }
        .period-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; background: white !important; }
      `}</style>

      <PageHeader
        title="Timetable Manager"
        subtitle={`${user?.class} — Section ${user?.section} • ${user?.branch}`}
      />

      <div style={{ maxWidth:960, display:'flex', flexDirection:'column', gap:20 }}>

        {/* ── Hero Card ── */}
        <div className="card" style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, background:'rgba(255,255,255,0.15)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Calendar size={22} color="white" />
            </div>
            <div>
              <div style={{ color:'white', fontWeight:800, fontSize:'1.05rem' }}>Weekly Timetable</div>
              <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.75rem' }}>Select a day tab → edit periods → Save</div>
            </div>
          </div>
          <button className="btn" onClick={save} disabled={saving}
            style={{ background:'rgba(255,255,255,0.18)', color:'white', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', gap:7 }}>
            {saving
              ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Saving...</>
              : saved
              ? <><CheckCircle size={14} /> Saved!</>
              : <><Save size={14} /> Save Timetable</>}
          </button>
        </div>

        {/* ── Day Tabs ── */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {DAYS.map(day => {
            const isActive = activeDay === day;
            const done     = filledCount(day);
            return (
              <button key={day} className="day-tab"
                onClick={() => setActiveDay(day)}
                style={{
                  padding:'9px 18px', borderRadius:12, border:'none', cursor:'pointer',
                  background: isActive ? '#4f46e5' : 'white',
                  color: isActive ? 'white' : '#64748b',
                  fontWeight:700, fontSize:'0.83rem',
                  boxShadow: isActive ? '0 4px 16px rgba(79,70,229,0.45)' : '0 1px 4px rgba(0,0,0,0.08)',
                  display:'flex', alignItems:'center', gap:7,
                }}>
                {day.slice(0,3)}
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : (done ? '#eff6ff' : '#f1f5f9'),
                  color: isActive ? 'white' : (done ? '#4f46e5' : '#94a3b8'),
                  fontSize:'0.65rem', fontWeight:800, padding:'1px 7px', borderRadius:99,
                }}>
                  {done}/{PERIODS.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Period Editor ── */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ padding:'14px 20px', background:'#f8faff', borderBottom:'1px solid #e8edff', display:'flex', alignItems:'center', gap:10 }}>
            <Clock size={16} color="#4f46e5" />
            <span style={{ fontWeight:800, color:'#1e293b', fontSize:'0.9rem' }}>{activeDay}</span>
            <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>— fill in subjects, teacher and timings</span>
          </div>

          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'36px 1fr 1fr 100px 100px', gap:8, padding:'8px 16px', background:'#fafbff', borderBottom:'1px solid #f1f5f9' }}>
            {['#','Subject','Teacher','Start','End'].map(h => (
              <div key={h} style={{ fontSize:'0.68rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', textAlign: h==='#' ? 'center' : 'left' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>
              <div style={{ width:24, height:24, border:'3px solid #e0e7ff', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
              Loading timetable...
            </div>
          ) : (
            <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:6 }}>
              {activeDayData.periods.map((period, pIdx) => (
                <div key={period.periodNo} className="period-row"
                  style={{
                    display:'grid', gridTemplateColumns:'36px 1fr 1fr 100px 100px', gap:8, alignItems:'center',
                    background: period.subject ? '#f5f3ff' : '#fafafa',
                    border:`1.5px solid ${period.subject ? '#ddd6fe' : '#f1f5f9'}`,
                    borderRadius:10, padding:'9px 12px', transition:'border-color 0.2s, background 0.2s',
                    animationDelay:`${pIdx * 0.04}s`,
                  }}>

                  {/* Period badge */}
                  <div style={{ width:28, height:28, borderRadius:8, background: period.subject ? '#4f46e5' : '#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', color: period.subject ? 'white' : '#94a3b8', fontSize:'0.72rem', fontWeight:800, flexShrink:0 }}>
                    {period.periodNo}
                  </div>

                  {/* Subject */}
                  <input
                    className="input period-input"
                    placeholder="e.g. Mathematics"
                    value={period.subject}
                    onChange={e => updatePeriod(activeDay, pIdx, 'subject', e.target.value)} // ✅ activeDay name
                    style={{ fontSize:'0.84rem', padding:'7px 10px' }}
                  />

                  {/* Teacher */}
                  <input
                    className="input period-input"
                    placeholder="Teacher name"
                    value={period.teacher}
                    onChange={e => updatePeriod(activeDay, pIdx, 'teacher', e.target.value)} // ✅ activeDay name
                    style={{ fontSize:'0.84rem', padding:'7px 10px' }}
                  />

                  {/* Start time */}
                  <input
                    className="input period-input"
                    type="time"
                    value={period.startTime}
                    onChange={e => updatePeriod(activeDay, pIdx, 'startTime', e.target.value)} // ✅ activeDay name
                    style={{ fontSize:'0.82rem', padding:'7px 8px' }}
                  />

                  {/* End time */}
                  <input
                    className="input period-input"
                    type="time"
                    value={period.endTime}
                    onChange={e => updatePeriod(activeDay, pIdx, 'endTime', e.target.value)} // ✅ activeDay name
                    style={{ fontSize:'0.82rem', padding:'7px 8px' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Weekly Overview Table ── */}
        <div className="card">
          <div style={{ fontWeight:800, color:'#1e293b', marginBottom:14, fontSize:'0.9rem', display:'flex', alignItems:'center', gap:8 }}>
            📅 Weekly Overview
            <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:500 }}>Read-only summary</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.73rem' }}>
              <thead>
                <tr>
                  <th style={{ padding:'8px 10px', background:'#f8faff', color:'#64748b', fontWeight:700, textAlign:'left', borderRadius:'8px 0 0 8px' }}>Period</th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding:'8px 8px', background:'#f8faff', color: d===activeDay?'#4f46e5':'#94a3b8', fontWeight: d===activeDay?800:600, textAlign:'center', fontSize: d===activeDay?'0.75rem':'0.72rem' }}>
                      {d.slice(0,3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(p => (
                  <tr key={p} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'7px 10px', fontWeight:700, color:'#94a3b8', fontSize:'0.72rem' }}>P{p}</td>
                    {DAYS.map(day => {
                      const d   = days.find(x => x.day === day);
                      const per = d?.periods?.find(x => x.periodNo === p);
                      return (
                        <td key={day} style={{ padding:'7px 6px', textAlign:'center' }}>
                          {per?.subject
                            ? <span style={{ background: day===activeDay?'#eff6ff':'#f8faff', color: day===activeDay?'#4f46e5':'#475569', padding:'2px 8px', borderRadius:6, fontWeight:600, display:'inline-block' }}>
                                {per.subject}
                              </span>
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

      </div>
    </AppLayout>
  );
}
