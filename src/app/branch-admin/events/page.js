'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Search, Calendar, Clock, X } from 'lucide-react';

const MONTHS  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];
const BLANK   = { name:'', class:'All', section:'All', date:'', startTime:'', endTime:'', description:'', academicYear:'2025-26' };
const EVENT_COLORS = ['#0891b2','#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
const getColor = (name = '') => EVENT_COLORS[name.charCodeAt(0) % EVENT_COLORS.length];

export default function BranchAdminEvents() {
  const { user } = useAuth();

  const [events, setEvents]             = useState([]);
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [cls, setCls]                   = useState('');
  const [section, setSection]           = useState('');
  const [search, setSearch]             = useState('');
  const [showAdd, setShowAdd]           = useState(false);
  const [editEvent, setEditEvent]       = useState(null);
  const [deleteId, setDeleteId]         = useState(null);
  const [deleteEvent, setDeleteEvent]   = useState(null);
  const [form, setForm]                 = useState(BLANK);
  const [saving, setSaving]             = useState(false);

  const year        = currentDate.getFullYear();
  const month       = currentDate.getMonth();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr    = new Date().toISOString().split('T');

  // ── Load from real API ─────────────────────────────────────
  const load = async () => {
    const params = new URLSearchParams();
    if (user?.branch)  params.set('branch',  user.branch);
    if (cls)           params.set('class',   cls);
    if (section)       params.set('section', section);
    const r = await fetch(`/api/events?${params}`);
    const d = await r.json();
    if (d.success) setEvents(d.data);
  };

  useEffect(() => { if (user) load(); }, [user, cls, section]);

  const filtered = useMemo(() => events.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase())
  ), [events, search]);

  const eventsOnDay = (day) => {
    const d = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return filtered.filter(e => e.date === d);
  };

  const upcoming = [...filtered]
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  const totalThisMonth = filtered.filter(e =>
    e.date?.startsWith(`${year}-${String(month + 1).padStart(2,'0')}`)
  ).length;

  // ── Save / Update ──────────────────────────────────────────
  const save = async () => {
    if (!form.name || !form.date) return;
    setSaving(true);
    const method = editEvent ? 'PUT' : 'POST';
    const url    = editEvent ? `/api/events/${editEvent._id}` : '/api/events';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, branch: user?.branch || 'All', createdBy: user?.id }),
    });
    const d = await r.json();
    if (d.success) {
      load(); setShowAdd(false); setEditEvent(null); setForm(BLANK);
    }
    setSaving(false);
  };

  // ── Delete ─────────────────────────────────────────────────
  const del = async () => {
    await fetch(`/api/events/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null); setDeleteEvent(null); load();
  };

  return (
    <AppLayout requiredRole="branch-admin">
      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <PageHeader title="Events Calendar" subtitle={`${user?.branch} events`}>
        <button className="btn btn-primary"
          style={{ display:'flex', alignItems:'center', gap:6 }}
          onClick={() => { setEditEvent(null); setForm(BLANK); setShowAdd(true); }}>
          <Plus size={14} /> New Event
        </button>
      </PageHeader>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
        {[
          { l:'Total Events', v: filtered.length,   c:'#0891b2' },
          { l:'This Month',   v: totalThisMonth,     c:'#4f46e5' },
          { l:'Upcoming',     v: upcoming.length,    c:'#10b981' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign:'center', borderTop:`3px solid ${c}`, padding:14 }}>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom:14, padding:'12px 16px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" style={{ maxWidth:150 }} value={cls}
            onChange={e => { setCls(e.target.value); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select" style={{ maxWidth:130 }} value={section}
            onChange={e => { setSection(e.target.value); }}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:9, padding:'7px 12px', flex:1, maxWidth:280 }}>
            <Search size={14} color="#94a3b8" />
            <input
              style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.83rem', flex:1 }}
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', padding:0 }}>
                <X size={13} />
              </button>
            )}
          </div>
          <span style={{ fontSize:'0.78rem', color:'#94a3b8', marginLeft:'auto' }}>
            {filtered.length} events
          </span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 290px', gap:18 }}>

        {/* ── Calendar ──────────────────────────────────── */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <button className="btn btn-outline" style={{ padding:'6px 10px', display:'flex', alignItems:'center' }}
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <ChevronLeft size={16} />
            </button>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontWeight:800, fontSize:'1rem', color:'#1e293b' }}>{MONTHS[month]}</div>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{year}</div>
            </div>
            <button className="btn btn-outline" style={{ padding:'6px 10px', display:'flex', alignItems:'center' }}
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ textAlign:'center', padding:'5px 0', fontSize:'0.7rem', fontWeight:700,
                color: i === 0 || i === 6 ? '#ef4444' : '#94a3b8' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day     = i + 1;
              const dayEvs  = eventsOnDay(day);
              const isSel   = selectedDate === day;
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const isToday = dateStr === todayStr;
              return (
                <div key={day} onClick={() => setSelectedDate(isSel ? null : day)}
                  style={{
                    minHeight:58, border:`1.5px solid ${isSel?'#0891b2':isToday?'#bae6fd':'#e2e8f0'}`,
                    borderRadius:9, padding:'5px 6px', cursor:'pointer',
                    background: isSel?'#e0f2fe':isToday?'#f0f9ff':'white',
                    transition:'all 0.15s',
                  }}>
                  <div style={{
                    fontWeight: isToday?800:500, fontSize:'0.78rem',
                    width:20, height:20, borderRadius:'50%',
                    background: isToday?'#0891b2':'transparent',
                    color: isToday?'white':'#1e293b',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {day}
                  </div>
                  {dayEvs.slice(0, 2).map(ev => (
                    <div key={ev._id} style={{ fontSize:'0.55rem', background: getColor(ev.name), color:'white', borderRadius:3, padding:'1px 4px', marginTop:2, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', fontWeight:600 }}>
                      {ev.name}
                    </div>
                  ))}
                  {dayEvs.length > 2 && (
                    <div style={{ fontSize:'0.5rem', color:'#94a3b8', marginTop:1 }}>+{dayEvs.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day panel */}
          {selectedDate && (
            <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #f1f5f9' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <h4 style={{ fontWeight:700, fontSize:'0.9rem', color:'#1e293b', display:'flex', alignItems:'center', gap:6, margin:0 }}>
                  <Calendar size={15} color="#0891b2" /> {selectedDate} {MONTHS[month]}
                </h4>
                <button onClick={() => setSelectedDate(null)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                  <X size={14} />
                </button>
              </div>
              {eventsOnDay(selectedDate).length === 0 ? (
                <div style={{ textAlign:'center', padding:'16px 0', color:'#94a3b8', fontSize:'0.83rem' }}>
                  No events this day
                  <div style={{ marginTop:8 }}>
                    <button className="btn btn-outline" style={{ fontSize:'0.75rem', padding:'4px 10px', display:'inline-flex', alignItems:'center', gap:4 }}
                      onClick={() => {
                        const d = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}`;
                        setForm({ ...BLANK, date: d });
                        setShowAdd(true);
                      }}>
                      <Plus size={11} /> Add Event
                    </button>
                  </div>
                </div>
              ) : eventsOnDay(selectedDate).map(ev => (
                <div key={ev._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 12px', borderRadius:9, background:'#f8fafc', marginBottom:6, borderLeft:`3px solid ${getColor(ev.name)}` }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.84rem', color:'#1e293b' }}>{ev.name}</div>
                    {(ev.startTime || ev.endTime) && (
                      <div style={{ color:'#64748b', fontSize:'0.72rem', marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={10} /> {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                      </div>
                    )}
                    {ev.class !== 'All' && (
                      <div style={{ fontSize:'0.68rem', color:'#94a3b8', marginTop:2 }}>{ev.class} — {ev.section}</div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button className="btn btn-outline" style={{ padding:'3px 7px' }}
                      onClick={() => {
                        setEditEvent(ev);
                        setForm({ name:ev.name, class:ev.class, section:ev.section, date:ev.date, startTime:ev.startTime, endTime:ev.endTime, description:ev.description, academicYear:ev.academicYear });
                        setShowAdd(true);
                      }}>
                      <Edit2 size={11} />
                    </button>
                    <button className="btn btn-danger" style={{ padding:'3px 7px' }}
                      onClick={() => { setDeleteId(ev._id); setDeleteEvent(ev); }}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Upcoming Sidebar ───────────────────────────── */}
        <div className="card" style={{ height:'fit-content' }}>
          <h3 style={{ fontWeight:800, marginBottom:12, fontSize:'0.9rem', color:'#1e293b', display:'flex', alignItems:'center', gap:7 }}>
            <Calendar size={15} color="#0891b2" /> Upcoming Events
          </h3>
          {upcoming.length === 0 ? (
            <div style={{ textAlign:'center', padding:'20px 0', color:'#94a3b8', fontSize:'0.8rem' }}>No upcoming events</div>
          ) : upcoming.map((ev, i) => (
            <div key={ev._id} style={{ padding:'9px 0', borderBottom: i < upcoming.length-1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                <div style={{ width:4, height:36, borderRadius:3, background: getColor(ev.name), flexShrink:0, marginTop:2 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'0.79rem', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.name}</div>
                  <div style={{ fontSize:'0.68rem', color:'#64748b', marginTop:2 }}>
                    {ev.date}{ev.startTime ? ` • ${ev.startTime}` : ''}
                  </div>
                  <div style={{ fontSize:'0.65rem', color:'#94a3b8' }}>
                    {ev.class !== 'All' ? `${ev.class} — ${ev.section}` : 'All classes'}
                  </div>
                </div>
                <div style={{ display:'flex', gap:3, flexShrink:0 }}>
                  <button onClick={() => {
                    setEditEvent(ev);
                    setForm({ name:ev.name, class:ev.class, section:ev.section, date:ev.date, startTime:ev.startTime, endTime:ev.endTime, description:ev.description, academicYear:ev.academicYear });
                    setShowAdd(true);
                  }} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', padding:2, display:'flex' }}>
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => { setDeleteId(ev._id); setDeleteEvent(ev); }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:2, display:'flex' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditEvent(null); }}
        title={editEvent ? 'Edit Event' : 'Add New Event'} size="md">

        {form.name && (
          <div style={{ background: getColor(form.name), borderRadius:8, padding:'8px 14px', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <Calendar size={14} color="white" />
            <span style={{ color:'white', fontWeight:700, fontSize:'0.84rem' }}>{form.name}</span>
            {form.date && <span style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.75rem', marginLeft:'auto' }}>{form.date}</span>}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div style={{ gridColumn:'1/-1' }}>
            <FormField label="Event Name" required>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Annual Sports Day" />
            </FormField>
          </div>
          <FormField label="Class">
            <select className="select" style={{ width:'100%' }} value={form.class} onChange={e => setForm({ ...form, class: e.target.value })}>
              <option value="All">All Classes</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Section">
            <select className="select" style={{ width:'100%' }} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
              <option value="All">All Sections</option>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Date" required>
            <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </FormField>
          <div />
          <FormField label="Start Time">
            <input className="input" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
          </FormField>
          <FormField label="End Time">
            <input className="input" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
          </FormField>
          <div style={{ gridColumn:'1/-1' }}>
            <FormField label="Description">
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize:'vertical' }} placeholder="Optional details..." />
            </FormField>
          </div>
        </div>

        {!form.name && (
          <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 12px', fontSize:'0.78rem', color:'#92400e', marginTop:4 }}>
            ⚠️ Event name and date are required
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditEvent(null); }}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.name || !form.date}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            {saving
              ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Saving...</>
              : <><Calendar size={13} /> {editEvent ? 'Update Event' : 'Save Event'}</>}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────── */}
      <Modal open={!!deleteId} onClose={() => { setDeleteId(null); setDeleteEvent(null); }} title="Delete Event?" size="sm">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Trash2 size={20} color="#ef4444" />
          </div>
          {deleteEvent && (
            <div style={{ background:'#f8fafc', borderRadius:8, padding:'8px 14px', marginBottom:10, borderLeft:`3px solid ${getColor(deleteEvent.name)}` }}>
              <div style={{ fontWeight:700, fontSize:'0.84rem' }}>{deleteEvent.name}</div>
              <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{deleteEvent.date}</div>
            </div>
          )}
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>This cannot be undone.</p>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => { setDeleteId(null); setDeleteEvent(null); }}>Cancel</button>
          <button className="btn btn-danger" onClick={del}>Delete</button>
        </div>
      </Modal>
    </AppLayout>
  );
}
