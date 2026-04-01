'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';         // ✅ ADD
import { PageHeader, Modal, EmptyState } from '@/components/ui';
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Sparkles, Eye, Globe } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TYPE_COLORS = {
  General:'#6366f1', Academic:'#3b82f6', Sports:'#10b981',
  Cultural:'#ec4899', Holiday:'#f59e0b', Exam:'#ef4444',
  Meeting:'#8b5cf6', Competition:'#06b6d4',
};
const colorFor    = (t = 'General') => TYPE_COLORS[t] || '#6366f1';
const isSchoolWide = ev => !ev.branch || ev.branch === 'All';

export default function StudentEvents() {
  const { user } = useAuth();                            // ✅ USE CONTEXT

  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [currentDate,  setCurrentDate]  = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [search,       setSearch]       = useState('');
  const [showPoster,   setShowPoster]   = useState(null);

  const year        = currentDate.getFullYear();
  const month       = currentDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date();

  useEffect(() => {
    if (user?.branch) loadEvents();
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // No visibility filter — all published events for this branch are visible
      const params = new URLSearchParams({ branch: user.branch, published: 'true' });
      const res  = await fetch(`/api/events?${params}`);
      const data = await res.json();
      if (data.success) setEvents(data.data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const filtered = useMemo(() =>
    events.filter(e => !search || e.name?.toLowerCase().includes(search.toLowerCase())),
    [events, search]
  );

  const eventsOnDay = day => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return filtered.filter(e => e.date === d);
  };

  const upcoming = [...filtered]
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  const isToday = day =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="School Events" subtitle="Stay updated with upcoming events"/>

      <div style={{ marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, background:'white', borderRadius:13, padding:'9px 14px', border:'1.5px solid #e0e7ff', maxWidth:320 }}>
          <CalendarDays size={15} color="#a5b4fc"/>
          <input style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.84rem', flex:1 }} placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20 }} className="events-grid">

        {/* Calendar */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'18px 22px 14px', background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderBottom:'1.5px solid #e0e7ff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button className="btn btn-outline" style={{ padding:'7px 11px' }} onClick={() => setCurrentDate(new Date(year,month-1,1))}><ChevronLeft size={15}/></button>
            <div style={{ textAlign:'center' }}>
              <h3 style={{ fontWeight:900, fontSize:'1.05rem', background:'linear-gradient(135deg,#4338ca,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:0 }}>{MONTHS[month]}</h3>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:600 }}>{year}</div>
            </div>
            <button className="btn btn-outline" style={{ padding:'7px 11px' }} onClick={() => setCurrentDate(new Date(year,month+1,1))}><ChevronRight size={15}/></button>
          </div>

          <div style={{ padding:'16px 18px 20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:6 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign:'center', padding:'5px 0', fontSize:'0.68rem', fontWeight:800, color:'#a5b4fc', textTransform:'uppercase' }}>{d}</div>)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {Array.from({ length:firstDay }, (_,i) => <div key={`e-${i}`}/>)}
              {Array.from({ length:daysInMonth }, (_,i) => {
                const day=i+1, dayEvs=eventsOnDay(day), isSel=selectedDate===day, isTod=isToday(day);
                return (
                  <div key={`d-${day}`} onClick={() => setSelectedDate(isSel?null:day)}
                    style={{ minHeight:60, borderRadius:11, padding:'6px', cursor:'pointer', border:`1.5px solid ${isSel?'#6366f1':isTod?'#c4b5fd':'#f0f2ff'}`, background:isSel?'linear-gradient(135deg,#eef2ff,#e0e7ff)':isTod?'#faf8ff':'white' }}>
                    <div style={{ fontWeight:isTod?900:500, fontSize:'0.8rem', color:isTod?'#6366f1':'#374151', marginBottom:3, textAlign:'right' }}>{day}</div>
                    {dayEvs.slice(0,2).map(ev => (
                      <div key={ev.id} style={{ fontSize:'0.55rem', background:colorFor(ev.eventType), color:'white', borderRadius:4, padding:'1px 4px', marginBottom:1, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', fontWeight:600 }}>
                        {isSchoolWide(ev)?'🌐 ':''}{ev.name}
                      </div>
                    ))}
                    {dayEvs.length > 2 && <div style={{ fontSize:'0.55rem', color:'#8b5cf6', fontWeight:800 }}>+{dayEvs.length-2}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day — view only */}
          {selectedDate && (
            <div style={{ padding:'14px 18px', borderTop:'1.5px solid #f0f2ff', background:'linear-gradient(135deg,#fafbff,#f5f3ff)' }}>
              <h4 style={{ fontWeight:700, marginBottom:10, fontSize:'0.9rem' }}>{selectedDate} {MONTHS[month]} {year}</h4>
              {eventsOnDay(selectedDate).length === 0
                ? <p style={{ color:'#94a3b8', fontSize:'0.84rem', textAlign:'center' }}>No events</p>
                : eventsOnDay(selectedDate).map(ev => (
                  <div key={ev.id} style={{ padding:'10px 12px', borderRadius:10, background:'white', marginBottom:8, border:`1.5px solid ${colorFor(ev.eventType)}20` }}>
                    {ev.posterImage && <div onClick={() => setShowPoster(ev)} style={{ width:'100%', height:80, borderRadius:8, background:`url(${ev.posterImage}) center/cover`, marginBottom:8, cursor:'pointer' }}/>}
                    <div style={{ fontWeight:700, fontSize:'0.84rem', color:'#1e293b' }}>{ev.name}</div>
                    <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{ev.startTime && `${ev.startTime} – ${ev.endTime}`}</div>
                    {isSchoolWide(ev) && (
                      <span style={{ fontSize:'0.6rem', background:'#f0fdf4', color:'#16a34a', padding:'2px 6px', borderRadius:99, fontWeight:700, display:'inline-flex', alignItems:'center', gap:3, marginTop:4 }}>
                        <Globe size={8}/> School-wide
                      </span>
                    )}
                    {ev.description && <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:4 }}>{ev.description}</div>}
                    {ev.posterImage && (
                      <button onClick={() => setShowPoster(ev)} className="btn btn-outline" style={{ marginTop:8, padding:'4px 10px', fontSize:'0.72rem' }}>
                        <Eye size={11}/> View Poster
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="card" style={{ padding:0, overflow:'hidden', height:'fit-content' }}>
          <div style={{ padding:'14px 16px', background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderBottom:'1.5px solid #e0e7ff', display:'flex', alignItems:'center', gap:8 }}>
            <Sparkles size={15} color="#8b5cf6"/>
            <h3 style={{ fontWeight:800, margin:0, fontSize:'0.9rem' }}>Upcoming</h3>
            {upcoming.length > 0 && <span style={{ marginLeft:'auto', fontSize:'0.65rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', padding:'2px 8px', borderRadius:99, fontWeight:700 }}>{upcoming.length}</span>}
          </div>
          <div style={{ padding:'10px 12px', maxHeight:500, overflowY:'auto' }}>
            {loading
              ? <p style={{ textAlign:'center', color:'#94a3b8', padding:'20px 0', fontSize:'0.84rem' }}>Loading...</p>
              : upcoming.length === 0 ? <EmptyState message="No upcoming events"/>
              : upcoming.map((ev, i) => {
                const c = colorFor(ev.eventType);
                const daysLeft = Math.ceil((new Date(ev.date) - today) / 86400000);
                return (
                  <div key={ev.id||`up-${i}`} style={{ padding:'10px', borderRadius:10, marginBottom:8, background:'white', borderLeft:`3px solid ${c}`, animation:`fadeSlideUp 0.3s ease ${i*30}ms both` }}>
                    {ev.posterImage && <div onClick={() => setShowPoster(ev)} style={{ width:'100%', height:60, borderRadius:6, background:`url(${ev.posterImage}) center/cover`, marginBottom:6, cursor:'pointer' }}/>}
                    <div style={{ fontWeight:700, fontSize:'0.8rem', marginBottom:2 }}>{ev.name}</div>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}><CalendarDays size={9} style={{ display:'inline', marginRight:3 }}/>{ev.date}</div>
                    {ev.startTime && <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:2 }}><Clock size={9} style={{ display:'inline', marginRight:3 }}/>{ev.startTime} – {ev.endTime}</div>}
                    {isSchoolWide(ev) && (
                      <div style={{ fontSize:'0.62rem', color:'#16a34a', fontWeight:700, marginTop:3, display:'flex', alignItems:'center', gap:3 }}>
                        <Globe size={8}/> School-wide
                      </div>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                      <span style={{ fontSize:'0.6rem', padding:'2px 6px', borderRadius:99, background:`${c}18`, color:c, fontWeight:700 }}>
                        {daysLeft===0?'Today':daysLeft===1?'Tomorrow':`${daysLeft}d`}
                      </span>
                      {ev.posterImage && (
                        <button onClick={() => setShowPoster(ev)} style={{ background:`${c}15`, border:'none', cursor:'pointer', color:c, width:22, height:22, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <Eye size={9}/>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Poster Viewer */}
      {showPoster && (
        <Modal open onClose={() => setShowPoster(null)} title={showPoster.name} size="lg">
          <div style={{ textAlign:'center' }}>
            {showPoster.posterImage && <img src={showPoster.posterImage} alt={showPoster.name} style={{ maxWidth:'100%', maxHeight:'60vh', borderRadius:12 }}/>}
            <div style={{ marginTop:16, padding:'12px 16px', background:'#f8fafc', borderRadius:10, textAlign:'left' }}>
              <p><strong>Date:</strong> {showPoster.date}</p>
              <p><strong>Time:</strong> {showPoster.startTime} – {showPoster.endTime}</p>
              <p><strong>Class:</strong> {showPoster.class} / {showPoster.section}</p>
              {isSchoolWide(showPoster) && <p>🌐 <strong>School-wide event</strong></p>}
              {showPoster.description && <p><strong>Details:</strong> {showPoster.description}</p>}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
            <button className="btn btn-outline" onClick={() => setShowPoster(null)}>Close</button>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 800px) { .events-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}