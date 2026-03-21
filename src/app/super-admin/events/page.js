'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal, FormField, Badge, EmptyState } from '@/components/ui';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, CalendarDays, Clock, MapPin, Sparkles } from 'lucide-react';

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CLASSES  = ['All','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
const SECTIONS = ['All','A','B','C','D','E'];
const BLANK    = { name:'', class:'All', section:'All', branch:'All', date:'', startTime:'', endTime:'', description:'', academicYear:'2025-26' };

/* Event type → color palette */
const EVENT_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#06b6d4','#8b5cf6','#f43f5e','#84cc16'];
const colorFor = (name='') => EVENT_COLORS[name.charCodeAt(0) % EVENT_COLORS.length];

export default function SuperAdminEvents() {
  const [events,   setEvents]   = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [currentDate, setCurrentDate]  = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [search,   setSearch]   = useState('');
  const [showAdd,  setShowAdd]  = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteId,  setDeleteId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState('');

  const year      = currentDate.getFullYear();
  const month     = currentDate.getMonth();
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const today     = new Date();

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    const [eRes, bRes] = await Promise.all([fetch('/api/events'), fetch('/api/branches')]);
    const [eData, bData] = await Promise.all([eRes.json(), bRes.json()]);
    if (eData.success) setEvents(eData.data);
    if (bData.success) setBranches(bData.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => events.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase())
  ), [events, search]);

  const eventsOnDay = day => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return filtered.filter(e => e.date === d);
  };

  const upcoming = [...filtered]
    .filter(e => new Date(e.date) >= today)
    .sort((a,b) => new Date(a.date)-new Date(b.date))
    .slice(0,12);

  const save = async () => {
    if (!form.name || !form.date) return;
    setSaving(true);
    const method = editEvent ? 'PUT' : 'POST';
    const url    = editEvent ? `/api/events/${editEvent._id}` : '/api/events';
    const r = await fetch(url, { method, headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(form) });
    const d = await r.json();
    if (d.success) { load(); setShowAdd(false); setEditEvent(null); setForm(BLANK); showToast(editEvent ? '✅ Event updated!' : '✅ Event created!'); }
    setSaving(false);
  };

  const del = async () => {
    await fetch(`/api/events/${deleteId}`, { method:'DELETE' });
    setDeleteId(null); load(); showToast('🗑️ Event deleted');
  };

  const openEdit = ev => {
    setEditEvent(ev);
    setForm({ name:ev.name, class:ev.class, section:ev.section, branch:ev.branch, date:ev.date, startTime:ev.startTime, endTime:ev.endTime, description:ev.description, academicYear:ev.academicYear });
    setShowAdd(true);
  };

  const isToday = (day) => today.getFullYear()===year && today.getMonth()===month && today.getDate()===day;

  return (
    <AppLayout requiredRole="super-admin">

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:'0.875rem', boxShadow:'0 8px 28px rgba(99,102,241,0.4)', animation:'slideInRight 0.3s ease' }}>
          {toast}
        </div>
      )}

      <PageHeader title="Events Calendar" subtitle="Schedule and manage branch events">
        <button className="btn btn-primary" onClick={() => { setEditEvent(null); setForm(BLANK); setShowAdd(true); }}>
          <Plus size={15} /> New Event
        </button>
      </PageHeader>

      {/* Search */}
      <div style={{ marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9, background:'white', borderRadius:13, padding:'9px 14px', border:'1.5px solid #e0e7ff', maxWidth:320, boxShadow:'0 2px 8px rgba(99,102,241,0.06)', transition:'border-color 0.2s, box-shadow 0.2s' }}
          onFocusCapture={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.12)'; }}
          onBlurCapture={e => { e.currentTarget.style.borderColor='#e0e7ff'; e.currentTarget.style.boxShadow='0 2px 8px rgba(99,102,241,0.06)'; }}>
          <CalendarDays size={15} color="#a5b4fc" />
          <input style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.84rem', flex:1, color:'#374151' }}
            placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:20 }} className="events-grid">

        {/* ── Calendar ── */}
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {/* Calendar Header */}
          <div style={{ padding:'18px 22px 14px', background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderBottom:'1.5px solid #e0e7ff', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button className="btn btn-outline" style={{ padding:'7px 11px', borderColor:'#e0e7ff' }}
              onClick={() => setCurrentDate(new Date(year, month-1, 1))}>
              <ChevronLeft size={15} />
            </button>
            <div style={{ textAlign:'center' }}>
              <h3 style={{ fontWeight:900, fontSize:'1.05rem', background:'linear-gradient(135deg,#4338ca,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:0 }}>
                {MONTHS[month]}
              </h3>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:600 }}>{year}</div>
            </div>
            <button className="btn btn-outline" style={{ padding:'7px 11px', borderColor:'#e0e7ff' }}
              onClick={() => setCurrentDate(new Date(year, month+1, 1))}>
              <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ padding:'16px 18px 20px' }}>
            {/* Day labels */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:6 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign:'center', padding:'5px 0', fontSize:'0.68rem', fontWeight:800, color:'#a5b4fc', textTransform:'uppercase', letterSpacing:'0.06em' }}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
              {Array.from({ length:firstDay }, (_,i) => <div key={`e${i}`} />)}
              {Array.from({ length:daysInMonth }, (_,i) => {
                const day    = i + 1;
                const dayEvs = eventsOnDay(day);
                const isSel  = selectedDate === day;
                const isTod  = isToday(day);
                return (
                  <div key={day} onClick={() => setSelectedDate(isSel ? null : day)}
                    style={{
                      minHeight:62, borderRadius:11, padding:'7px 6px',
                      cursor:'pointer', position:'relative', overflow:'hidden',
                      border:`1.5px solid ${isSel ? '#6366f1' : isTod ? '#c4b5fd' : '#f0f2ff'}`,
                      background: isSel ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : isTod ? '#faf8ff' : 'white',
                      boxShadow: isSel ? '0 4px 16px rgba(99,102,241,0.2)' : 'none',
                      transition:'all 0.18s ease',
                    }}
                    onMouseEnter={e => { if (!isSel) e.currentTarget.style.background='#faf8ff'; if (!isSel) e.currentTarget.style.borderColor='#c4b5fd'; }}
                    onMouseLeave={e => { if (!isSel && !isTod) { e.currentTarget.style.background='white'; e.currentTarget.style.borderColor='#f0f2ff'; } }}
                  >
                    <div style={{ fontWeight: isTod ? 900 : 500, fontSize:'0.8rem', color: isTod ? '#6366f1' : '#374151', marginBottom:3, textAlign:'right' }}>{day}</div>
                    {isTod && <div style={{ position:'absolute', top:5, left:5, width:5, height:5, borderRadius:'50%', background:'#6366f1', boxShadow:'0 0 6px rgba(99,102,241,0.6)' }} />}
                    {dayEvs.slice(0,2).map(ev => (
                      <div key={ev._id} style={{ fontSize:'0.58rem', background:colorFor(ev.name), color:'white', borderRadius:4, padding:'1.5px 5px', marginBottom:2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', fontWeight:600 }}>
                        {ev.name}
                      </div>
                    ))}
                    {dayEvs.length > 2 && (
                      <div style={{ fontSize:'0.58rem', color:'#8b5cf6', fontWeight:800 }}>+{dayEvs.length-2} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDate && (
            <div style={{ padding:'16px 20px 20px', borderTop:'1.5px solid #f0f2ff', background:'linear-gradient(135deg,#fafbff,#f5f3ff)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CalendarDays size={15} color="white" />
                </div>
                <h4 style={{ fontWeight:800, color:'#1e293b', margin:0, fontSize:'0.92rem' }}>
                  {selectedDate} {MONTHS[month]} {year}
                </h4>
              </div>
              {eventsOnDay(selectedDate).length === 0 ? (
                <p style={{ color:'#a5b4fc', fontSize:'0.84rem', fontWeight:500, textAlign:'center', padding:'12px 0' }}>No events scheduled</p>
              ) : eventsOnDay(selectedDate).map(ev => (
                <div key={ev._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 12px', borderRadius:12, background:'white', marginBottom:8, border:`1.5px solid ${colorFor(ev.name)}22`, boxShadow:`0 2px 8px ${colorFor(ev.name)}14` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.84rem', color:'#1e293b', display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:colorFor(ev.name), flexShrink:0 }} />
                      {ev.name}
                    </div>
                    <div style={{ color:'#94a3b8', fontSize:'0.72rem', marginTop:3, display:'flex', alignItems:'center', gap:8 }}>
                      {ev.startTime && <span style={{ display:'flex', alignItems:'center', gap:3 }}><Clock size={10} />{ev.startTime}–{ev.endTime}</span>}
                      {ev.branch && <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={10} />{ev.branch}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:5, flexShrink:0, marginLeft:8 }}>
                    <button className="btn btn-outline" style={{ padding:'4px 8px', fontSize:'0.7rem' }} onClick={() => openEdit(ev)}><Edit2 size={11} /></button>
                    <button className="btn btn-danger"  style={{ padding:'4px 8px', fontSize:'0.7rem' }} onClick={() => setDeleteId(ev._id)}><Trash2 size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Upcoming Panel ── */}
        <div className="card" style={{ padding:0, overflow:'hidden', height:'fit-content' }}>
          <div style={{ padding:'16px 18px 12px', background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderBottom:'1.5px solid #e0e7ff', display:'flex', alignItems:'center', gap:8 }}>
            <Sparkles size={15} color="#8b5cf6" />
            <h3 style={{ fontWeight:800, color:'#1e293b', margin:0, fontSize:'0.92rem' }}>Upcoming Events</h3>
            {upcoming.length > 0 && (
              <span style={{ marginLeft:'auto', fontSize:'0.65rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', padding:'2px 8px', borderRadius:99, fontWeight:700 }}>
                {upcoming.length}
              </span>
            )}
          </div>
          <div style={{ padding:'12px 14px' }}>
            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming events" icon={<CalendarDays size={28} color="#a5b4fc" />} />
            ) : upcoming.map((ev, i) => {
              const c = colorFor(ev.name);
              const evDate = new Date(ev.date);
              const daysLeft = Math.ceil((evDate - today) / (1000*60*60*24));
              return (
                <div key={ev._id} style={{ padding:'11px 12px', borderRadius:12, marginBottom:8, background:'white', border:`1.5px solid ${c}18`, borderLeft:`3px solid ${c}`, animation:`fadeSlideUp 0.35s ease ${i*40}ms both`, position:'relative', overflow:'hidden' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.81rem', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.name}</div>
                      <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:3, display:'flex', flexDirection:'column', gap:1 }}>
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><CalendarDays size={9} /> {ev.date}</span>
                        {ev.startTime && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={9} /> {ev.startTime}–{ev.endTime}</span>}
                        <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={9} /> {ev.branch} • {ev.class}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0, marginLeft:8 }}>
                      <span style={{ fontSize:'0.62rem', padding:'2px 7px', borderRadius:99, background:`${c}18`, color:c, fontWeight:800 }}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                      </span>
                      <div style={{ display:'flex', gap:3 }}>
                        <button onClick={() => openEdit(ev)}    style={{ background:`${c}15`, border:'none', cursor:'pointer', color:c, width:24, height:24, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background=`${c}30`}
                          onMouseLeave={e => e.currentTarget.style.background=`${c}15`}>
                          <Edit2 size={10} />
                        </button>
                        <button onClick={() => setDeleteId(ev._id)} style={{ background:'#fee2e220', border:'none', cursor:'pointer', color:'#f43f5e', width:24, height:24, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#fee2e240'}
                          onMouseLeave={e => e.currentTarget.style.background='#fee2e220'}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditEvent(null); }} title={editEvent ? 'Edit Event' : 'Add New Event'} subtitle={editEvent ? 'Update event details' : 'Fill in the details below'} size="md">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <FormField label="Event Name" required>
              <input className="input" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Annual Sports Day" />
            </FormField>
          </div>
          <FormField label="Branch">
            <select className="select" value={form.branch} onChange={e => setForm({...form, branch:e.target.value})}>
              <option value="All">All Branches</option>
              {branches.map(b => <option key={b._id}>{b.name}</option>)}
            </select>
          </FormField>
          <FormField label="Class">
            <select className="select" value={form.class} onChange={e => setForm({...form, class:e.target.value})}>
              {CLASSES.map(c => <option key={c} value={c}>{c==='All'?'All Classes':c}</option>)}
            </select>
          </FormField>
          <FormField label="Date" required>
            <input className="input" type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} />
          </FormField>
          <FormField label="Section">
            <select className="select" value={form.section} onChange={e => setForm({...form, section:e.target.value})}>
              {SECTIONS.map(s => <option key={s} value={s}>{s==='All'?'All Sections':s}</option>)}
            </select>
          </FormField>
          <FormField label="Start Time">
            <input className="input" type="time" value={form.startTime} onChange={e => setForm({...form, startTime:e.target.value})} />
          </FormField>
          <FormField label="End Time">
            <input className="input" type="time" value={form.endTime} onChange={e => setForm({...form, endTime:e.target.value})} />
          </FormField>
          <div style={{ gridColumn:'1/-1' }}>
            <FormField label="Description">
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description:e.target.value})} placeholder="Event details..." style={{ resize:'vertical', minHeight:80 }} />
            </FormField>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18, paddingTop:14, borderTop:'1px solid #f0f2ff' }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditEvent(null); }}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Saving...</> : editEvent ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Event?" size="sm">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#fee2e2,#fecaca)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 4px 16px rgba(239,68,68,0.2)' }}>
            <Trash2 size={22} color="#ef4444" />
          </div>
          <p style={{ color:'#64748b', fontSize:'0.875rem', lineHeight:1.6 }}>
            This action <strong>cannot be undone</strong>. The event will be permanently removed.
          </p>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={del}>Yes, Delete</button>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes spin         { to { transform:rotate(360deg); } }
        @keyframes fadeSlideUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
        @media (max-width:900px) { .events-grid { grid-template-columns:1fr !important; } }
      `}</style>
    </AppLayout>
  );
}
