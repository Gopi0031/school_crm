'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal, FormField, Badge, EmptyState } from '@/components/ui';
import { 
  Plus, Edit2, Trash2, ChevronLeft, ChevronRight, CalendarDays, 
  Clock, MapPin, Sparkles, Image, X, Upload, Eye, Users, Send,
  ImagePlus, Share2
} from 'lucide-react';

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS     = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CLASSES  = ['All','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['All','A','B','C','D','E'];
const VISIBILITY_OPTIONS = ['All', 'Teachers', 'Students', 'Parents', 'Branch Admins'];
const EVENT_TYPES = ['General', 'Academic', 'Sports', 'Cultural', 'Holiday', 'Exam', 'Meeting', 'Competition'];

const BLANK = { 
  name: '', 
  class: 'All', 
  section: 'All', 
  branch: 'All', 
  date: '', 
  startTime: '', 
  endTime: '', 
  description: '', 
  academicYear: '2025-26',
  eventType: 'General',
  visibility: ['All'],
  posterImage: null,
  posterPublicId: null,
  isPublished: false,
  notifyUsers: false
};

const EVENT_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#06b6d4','#8b5cf6','#f43f5e','#84cc16'];
const TYPE_COLORS = {
  'General': '#6366f1',
  'Academic': '#3b82f6',
  'Sports': '#10b981',
  'Cultural': '#ec4899',
  'Holiday': '#f59e0b',
  'Exam': '#ef4444',
  'Meeting': '#8b5cf6',
  'Competition': '#06b6d4'
};

const colorFor = (name = '', type = 'General') => TYPE_COLORS[type] || EVENT_COLORS[name.charCodeAt(0) % EVENT_COLORS.length];

export default function SuperAdminEvents() {
  const [events, setEvents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPoster, setShowPoster] = useState(null);
  const fileInputRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    const [eRes, bRes] = await Promise.all([fetch('/api/events'), fetch('/api/branches')]);
    const [eData, bData] = await Promise.all([eRes.json(), bRes.json()]);
    if (eData.success) setEvents(eData.data);
    if (bData.success) setBranches(bData.data);
    setLoading(false);
  };
  
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => events.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || e.eventType === filterType;
    const matchBranch = !filterBranch || e.branch === filterBranch || e.branch === 'All';
    return matchSearch && matchType && matchBranch;
  }), [events, search, filterType, filterBranch]);

  const eventsOnDay = day => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filtered.filter(e => e.date === d);
  };

  const upcoming = [...filtered]
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 12);

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showToast('❌ Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('❌ Image must be less than 5MB');
      return;
    }

    setUploading(true);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'event-posters');
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success) {
        setForm(prev => ({
          ...prev,
          posterImage: data.url,
          posterPublicId: data.publicId
        }));
        showToast('✅ Image uploaded!');
      } else {
        showToast('❌ Upload failed');
        setImagePreview(null);
      }
    } catch (err) {
      showToast('❌ Upload failed');
      setImagePreview(null);
    }
    setUploading(false);
  };

  const removeImage = async () => {
    if (form.posterPublicId) {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: form.posterPublicId })
      });
    }
    setForm(prev => ({ ...prev, posterImage: null, posterPublicId: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVisibilityChange = (option) => {
    setForm(prev => {
      const current = prev.visibility || [];
      if (option === 'All') {
        return { ...prev, visibility: ['All'] };
      }
      const filtered = current.filter(v => v !== 'All');
      if (filtered.includes(option)) {
        const newVis = filtered.filter(v => v !== option);
        return { ...prev, visibility: newVis.length ? newVis : ['All'] };
      }
      return { ...prev, visibility: [...filtered, option] };
    });
  };

  const save = async () => {
    if (!form.name || !form.date) {
      showToast('❌ Please fill required fields');
      return;
    }
    setSaving(true);
    const method = editEvent ? 'PUT' : 'POST';
    const url = editEvent ? `/api/events/${editEvent.id || editEvent._id}` : '/api/events';
    
    try {
      const r = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(form) 
      });
      const d = await r.json();
      
      if (d.success) {
        load();
        setShowAdd(false);
        setEditEvent(null);
        setForm(BLANK);
        setImagePreview(null);
        showToast(editEvent ? '✅ Event updated!' : '✅ Event created!');
        
        // Send notifications if enabled
        if (form.notifyUsers && form.isPublished) {
          await fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'event',
              eventId: d.data.id || d.data._id,
              title: form.name,
              message: `New event: ${form.name} on ${form.date}`,
              visibility: form.visibility,
              branch: form.branch,
              class: form.class
            })
          });
        }
      }
    } catch (err) {
      showToast('❌ Failed to save');
    }
    setSaving(false);
  };

  const del = async () => {
    const event = events.find(e => (e.id || e._id) === deleteId);
    if (event?.posterPublicId) {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: event.posterPublicId })
      });
    }
    await fetch(`/api/events/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
    showToast('🗑️ Event deleted');
  };

  const openEdit = ev => {
    setEditEvent(ev);
    setForm({
      name: ev.name,
      class: ev.class,
      section: ev.section,
      branch: ev.branch,
      date: ev.date,
      startTime: ev.startTime,
      endTime: ev.endTime,
      description: ev.description,
      academicYear: ev.academicYear,
      eventType: ev.eventType || 'General',
      visibility: ev.visibility || ['All'],
      posterImage: ev.posterImage,
      posterPublicId: ev.posterPublicId,
      isPublished: ev.isPublished ?? true,
      notifyUsers: false
    });
    setImagePreview(ev.posterImage);
    setShowAdd(true);
  };

  const togglePublish = async (ev) => {
    const newStatus = !ev.isPublished;
    await fetch(`/api/events/${ev.id || ev._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: newStatus })
    });
    load();
    showToast(newStatus ? '✅ Event published!' : '📝 Event unpublished');
  };

  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <AppLayout requiredRole="super-admin">
      {/* Toast */}
      {toast && (
        <div style={{ 
          position: 'fixed', top: 20, right: 20, zIndex: 9999, 
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
          color: 'white', padding: '12px 22px', borderRadius: 14, 
          fontWeight: 700, fontSize: '0.875rem', 
          boxShadow: '0 8px 28px rgba(99,102,241,0.4)', 
          animation: 'slideInRight 0.3s ease' 
        }}>
          {toast}
        </div>
      )}

      <PageHeader title="Events Calendar" subtitle="Schedule and manage events with image posts">
        <button className="btn btn-primary" onClick={() => { setEditEvent(null); setForm(BLANK); setImagePreview(null); setShowAdd(true); }}>
          <Plus size={15} /> New Event
        </button>
      </PageHeader>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 9, 
          background: 'white', borderRadius: 13, padding: '9px 14px', 
          border: '1.5px solid #e0e7ff', flex: 1, minWidth: 200, maxWidth: 320,
          boxShadow: '0 2px 8px rgba(99,102,241,0.06)'
        }}>
          <CalendarDays size={15} color="#a5b4fc" />
          <input 
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.84rem', flex: 1, color: '#374151' }}
            placeholder="Search events..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <select 
          className="select" 
          style={{ minWidth: 140 }}
          value={filterType} 
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select 
          className="select" 
          style={{ minWidth: 150 }}
          value={filterBranch} 
          onChange={e => setFilterBranch(e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map((b, i) => (
            <option key={b.id || b._id || `branch-${i}`} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }} className="events-grid">
        {/* Calendar */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Calendar Header */}
          <div style={{ 
            padding: '18px 22px 14px', 
            background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', 
            borderBottom: '1.5px solid #e0e7ff', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
          }}>
            <button className="btn btn-outline" style={{ padding: '7px 11px', borderColor: '#e0e7ff' }}
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <ChevronLeft size={15} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ 
                fontWeight: 900, fontSize: '1.05rem', 
                background: 'linear-gradient(135deg,#4338ca,#7c3aed)', 
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 
              }}>
                {MONTHS[month]}
              </h3>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{year}</div>
            </div>
            <button className="btn btn-outline" style={{ padding: '7px 11px', borderColor: '#e0e7ff' }}
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ padding: '16px 18px 20px' }}>
            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
              {DAYS.map(d => (
                <div key={d} style={{ 
                  textAlign: 'center', padding: '5px 0', fontSize: '0.68rem', 
                  fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.06em' 
                }}>{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayEvs = eventsOnDay(day);
                const isSel = selectedDate === day;
                const isTod = isToday(day);
                return (
                  <div 
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(isSel ? null : day)}
                    style={{
                      minHeight: 62, borderRadius: 11, padding: '7px 6px',
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      border: `1.5px solid ${isSel ? '#6366f1' : isTod ? '#c4b5fd' : '#f0f2ff'}`,
                      background: isSel ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : isTod ? '#faf8ff' : 'white',
                      boxShadow: isSel ? '0 4px 16px rgba(99,102,241,0.2)' : 'none',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ 
                      fontWeight: isTod ? 900 : 500, fontSize: '0.8rem', 
                      color: isTod ? '#6366f1' : '#374151', marginBottom: 3, textAlign: 'right' 
                    }}>{day}</div>
                    {isTod && (
                      <div style={{ 
                        position: 'absolute', top: 5, left: 5, width: 5, height: 5, 
                        borderRadius: '50%', background: '#6366f1', 
                        boxShadow: '0 0 6px rgba(99,102,241,0.6)' 
                      }} />
                    )}
                    {dayEvs.slice(0, 2).map(ev => (
                      <div 
                        key={ev.id || ev._id}
                        style={{ 
                          fontSize: '0.58rem', 
                          background: colorFor(ev.name, ev.eventType), 
                          color: 'white', borderRadius: 4, padding: '1.5px 5px', 
                          marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', 
                          textOverflow: 'ellipsis', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 2
                        }}
                      >
                        {ev.posterImage && <Image size={8} />}
                        {ev.name}
                      </div>
                    ))}
                    {dayEvs.length > 2 && (
                      <div style={{ fontSize: '0.58rem', color: '#8b5cf6', fontWeight: 800 }}>
                        +{dayEvs.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {selectedDate && (
            <div style={{ 
              padding: '16px 20px 20px', 
              borderTop: '1.5px solid #f0f2ff', 
              background: 'linear-gradient(135deg,#fafbff,#f5f3ff)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 10, 
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <CalendarDays size={15} color="white" />
                </div>
                <h4 style={{ fontWeight: 800, color: '#1e293b', margin: 0, fontSize: '0.92rem' }}>
                  {selectedDate} {MONTHS[month]} {year}
                </h4>
              </div>
              {eventsOnDay(selectedDate).length === 0 ? (
                <p style={{ color: '#a5b4fc', fontSize: '0.84rem', fontWeight: 500, textAlign: 'center', padding: '12px 0' }}>
                  No events scheduled
                </p>
              ) : eventsOnDay(selectedDate).map(ev => {
                const c = colorFor(ev.name, ev.eventType);
                return (
                  <div 
                    key={ev.id || ev._id}
                    style={{ 
                      display: 'flex', flexDirection: 'column', 
                      padding: '12px 14px', borderRadius: 12, background: 'white', 
                      marginBottom: 8, border: `1.5px solid ${c}22`, 
                      boxShadow: `0 2px 8px ${c}14` 
                    }}
                  >
                    {/* Event poster thumbnail */}
                    {ev.posterImage && (
                      <div 
                        onClick={() => setShowPoster(ev)}
                        style={{ 
                          width: '100%', height: 100, borderRadius: 8, 
                          background: `url(${ev.posterImage}) center/cover`, 
                          marginBottom: 10, cursor: 'pointer',
                          position: 'relative'
                        }}
                      >
                        <div style={{
                          position: 'absolute', bottom: 6, right: 6,
                          background: 'rgba(0,0,0,0.6)', borderRadius: 6,
                          padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          <Eye size={10} color="white" />
                          <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 600 }}>View</span>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ 
                            fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, 
                            background: `${c}20`, color: c, fontWeight: 700 
                          }}>
                            {ev.eventType || 'General'}
                          </span>
                          {!ev.isPublished && (
                            <span style={{ 
                              fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, 
                              background: '#fef3c7', color: '#d97706', fontWeight: 700 
                            }}>
                              Draft
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                          {ev.name}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {ev.startTime && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Clock size={10} />{ev.startTime}–{ev.endTime}
                            </span>
                          )}
                          {ev.branch && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <MapPin size={10} />{ev.branch}
                            </span>
                          )}
                        </div>
                        {ev.visibility && ev.visibility.length > 0 && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Users size={10} color="#94a3b8" />
                            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                              {ev.visibility.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                          onClick={() => openEdit(ev)}
                        >
                          <Edit2 size={11} />
                        </button>
                        <button 
                          className="btn btn-danger"  
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }} 
                          onClick={() => setDeleteId(ev.id || ev._id)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ 
            padding: '16px 18px 12px', 
            background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', 
            borderBottom: '1.5px solid #e0e7ff', 
            display: 'flex', alignItems: 'center', gap: 8 
          }}>
            <Sparkles size={15} color="#8b5cf6" />
            <h3 style={{ fontWeight: 800, color: '#1e293b', margin: 0, fontSize: '0.92rem' }}>Upcoming Events</h3>
            {upcoming.length > 0 && (
              <span style={{ 
                marginLeft: 'auto', fontSize: '0.65rem', 
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
                color: 'white', padding: '2px 8px', borderRadius: 99, fontWeight: 700 
              }}>
                {upcoming.length}
              </span>
            )}
          </div>
          <div style={{ padding: '12px 14px', maxHeight: 600, overflowY: 'auto' }}>
            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming events" icon={<CalendarDays size={28} color="#a5b4fc" />} />
            ) : upcoming.map((ev, i) => {
              const c = colorFor(ev.name, ev.eventType);
              const evDate = new Date(ev.date);
              const daysLeft = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));
              return (
                <div 
                  key={ev.id || ev._id || `upcoming-${i}`}
                  style={{ 
                    padding: '11px 12px', borderRadius: 12, marginBottom: 8, 
                    background: 'white', border: `1.5px solid ${c}18`, borderLeft: `3px solid ${c}`, 
                    animation: `fadeSlideUp 0.35s ease ${i * 40}ms both`, 
                    position: 'relative', overflow: 'hidden' 
                  }}
                >
                  {/* Mini poster preview */}
                  {ev.posterImage && (
                    <div 
                      onClick={() => setShowPoster(ev)}
                      style={{ 
                        width: '100%', height: 70, borderRadius: 8, 
                        background: `url(${ev.posterImage}) center/cover`, 
                        marginBottom: 8, cursor: 'pointer' 
                      }} 
                    />
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        <span style={{ 
                          fontSize: '0.58rem', padding: '1px 5px', borderRadius: 3, 
                          background: `${c}15`, color: c, fontWeight: 700 
                        }}>
                          {ev.eventType || 'General'}
                        </span>
                        {ev.posterImage && <Image size={10} color={c} />}
                      </div>
                      <div style={{ 
                        fontWeight: 700, fontSize: '0.81rem', color: '#1e293b', 
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                      }}>
                        {ev.name}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarDays size={9} /> {ev.date}
                        </span>
                        {ev.startTime && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={9} /> {ev.startTime}–{ev.endTime}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={9} /> {ev.branch} • {ev.class}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ 
                        fontSize: '0.62rem', padding: '2px 7px', borderRadius: 99, 
                        background: `${c}18`, color: c, fontWeight: 800 
                      }}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                      </span>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {ev.posterImage && (
                          <button 
                            onClick={() => setShowPoster(ev)}
                            style={{ 
                              background: `${c}15`, border: 'none', cursor: 'pointer', 
                              color: c, width: 24, height: 24, borderRadius: 7, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center' 
                            }}
                          >
                            <Eye size={10} />
                          </button>
                        )}
                        <button 
                          onClick={() => openEdit(ev)}    
                          style={{ 
                            background: `${c}15`, border: 'none', cursor: 'pointer', 
                            color: c, width: 24, height: 24, borderRadius: 7, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                          }}
                        >
                          <Edit2 size={10} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(ev.id || ev._id)} 
                          style={{ 
                            background: '#fee2e220', border: 'none', cursor: 'pointer', 
                            color: '#f43f5e', width: 24, height: 24, borderRadius: 7, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center' 
                          }}
                        >
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

      {/* Add/Edit Modal */}
      <Modal 
        open={showAdd} 
        onClose={() => { setShowAdd(false); setEditEvent(null); setImagePreview(null); }} 
        title={editEvent ? 'Edit Event' : 'Add New Event'} 
        subtitle={editEvent ? 'Update event details' : 'Create event with image poster'} 
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Event Name */}
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Event Name" required>
              <input 
                className="input" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g. Annual Sports Day" 
              />
            </FormField>
          </div>

          {/* Event Type */}
          <FormField label="Event Type">
            <select 
              className="select" 
              value={form.eventType} 
              onChange={e => setForm({ ...form, eventType: e.target.value })}
            >
              {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>

          {/* Branch */}
          <FormField label="Branch">
            <select 
              className="select" 
              value={form.branch} 
              onChange={e => setForm({ ...form, branch: e.target.value })}
            >
              <option value="All">All Branches</option>
              {branches.map((b, i) => (
                <option key={b.id || b._id || `branch-modal-${i}`} value={b.name}>{b.name}</option>
              ))}
            </select>
          </FormField>

          {/* Class */}
          <FormField label="Class">
            <select 
              className="select" 
              value={form.class} 
              onChange={e => setForm({ ...form, class: e.target.value })}
            >
              {CLASSES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
            </select>
          </FormField>

          {/* Section */}
          <FormField label="Section">
            <select 
              className="select" 
              value={form.section} 
              onChange={e => setForm({ ...form, section: e.target.value })}
            >
              {SECTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sections' : s}</option>)}
            </select>
          </FormField>

          {/* Date */}
          <FormField label="Date" required>
            <input 
              className="input" 
              type="date" 
              value={form.date} 
              onChange={e => setForm({ ...form, date: e.target.value })} 
            />
          </FormField>

          {/* Start Time */}
          <FormField label="Start Time">
            <input 
              className="input" 
              type="time" 
              value={form.startTime} 
              onChange={e => setForm({ ...form, startTime: e.target.value })} 
            />
          </FormField>

          {/* End Time */}
          <FormField label="End Time">
            <input 
              className="input" 
              type="time" 
              value={form.endTime} 
              onChange={e => setForm({ ...form, endTime: e.target.value })} 
            />
          </FormField>

          {/* Visibility */}
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Visible To">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {VISIBILITY_OPTIONS.map(opt => (
                  <label 
                    key={opt}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, 
                      padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                      background: form.visibility?.includes(opt) ? '#6366f115' : '#f8fafc',
                      border: `1.5px solid ${form.visibility?.includes(opt) ? '#6366f1' : '#e2e8f0'}`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={form.visibility?.includes(opt)} 
                      onChange={() => handleVisibilityChange(opt)}
                      style={{ accentColor: '#6366f1' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#374151' }}>{opt}</span>
                  </label>
                ))}
              </div>
            </FormField>
          </div>

          {/* Event Poster Image */}
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Event Poster Image">
              <div style={{ 
                border: '2px dashed #e0e7ff', borderRadius: 12, padding: 16, 
                background: '#fafbff', textAlign: 'center', position: 'relative' 
              }}>
                {imagePreview || form.posterImage ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={imagePreview || form.posterImage} 
                      alt="Event poster" 
                      style={{ 
                        maxWidth: '100%', maxHeight: 250, borderRadius: 10, 
                        objectFit: 'contain' 
                      }} 
                    />
                    <button 
                      onClick={removeImage}
                      style={{ 
                        position: 'absolute', top: 8, right: 8, 
                        width: 28, height: 28, borderRadius: '50%', 
                        background: '#ef4444', color: 'white', border: 'none', 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      style={{ display: 'none' }} 
                      id="poster-upload"
                    />
                    <label 
                      htmlFor="poster-upload"
                      style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', 
                        gap: 8, cursor: 'pointer', padding: 20 
                      }}
                    >
                      <div style={{ 
                        width: 56, height: 56, borderRadius: 14, 
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)'
                      }}>
                        {uploading ? (
                          <span style={{ 
                            width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', 
                            borderTopColor: 'white', borderRadius: '50%', 
                            animation: 'spin 0.7s linear infinite' 
                          }} />
                        ) : (
                          <ImagePlus size={24} color="white" />
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '0.875rem' }}>
                          {uploading ? 'Uploading...' : 'Click to upload poster'}
                        </span>
                        <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 4 }}>
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            </FormField>
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Description">
              <textarea 
                className="input" 
                rows={3} 
                value={form.description} 
                onChange={e => setForm({ ...form, description: e.target.value })} 
                placeholder="Event details..." 
                style={{ resize: 'vertical', minHeight: 80 }} 
              />
            </FormField>
          </div>

          {/* Options */}
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.isPublished} 
                onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                style={{ accentColor: '#10b981', width: 18, height: 18 }}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>Publish immediately</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.notifyUsers} 
                onChange={e => setForm({ ...form, notifyUsers: e.target.checked })}
                style={{ accentColor: '#6366f1', width: 18, height: 18 }}
              />
              <span style={{ fontSize: '0.84rem', fontWeight: 500 }}>
                <Send size={12} style={{ display: 'inline', marginRight: 4 }} />
                Send notification
              </span>
            </label>
          </div>
        </div>

        <div style={{ 
          display: 'flex', gap: 10, justifyContent: 'flex-end', 
          marginTop: 18, paddingTop: 14, borderTop: '1px solid #f0f2ff' 
        }}>
          <button 
            className="btn btn-outline" 
            onClick={() => { setShowAdd(false); setEditEvent(null); setImagePreview(null); }}
          >
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
            {saving ? (
              <>
                <span style={{ 
                  width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', 
                  borderTopColor: 'white', borderRadius: '50%', 
                  animation: 'spin 0.7s linear infinite', display: 'inline-block' 
                }} /> 
                Saving...
              </>
            ) : editEvent ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </Modal>

      {/* Poster Viewer Modal */}
      {showPoster && (
        <Modal 
          open={!!showPoster} 
          onClose={() => setShowPoster(null)} 
          title={showPoster.name}
          subtitle={`${showPoster.date} • ${showPoster.eventType || 'General'}`}
          size="lg"
        >
          <div style={{ textAlign: 'center' }}>
            {showPoster.posterImage && (
              <img 
                src={showPoster.posterImage} 
                alt={showPoster.name} 
                style={{ 
                  maxWidth: '100%', maxHeight: '60vh', borderRadius: 12, 
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)' 
                }} 
              />
            )}
            
            <div style={{ 
              marginTop: 20, padding: '16px 20px', background: '#f8fafc', 
              borderRadius: 12, textAlign: 'left' 
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Date & Time</div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                    {showPoster.date} {showPoster.startTime && `• ${showPoster.startTime} - ${showPoster.endTime}`}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Branch</div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>{showPoster.branch}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Class/Section</div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>{showPoster.class} / {showPoster.section}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>Visible To</div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>
                    {showPoster.visibility?.join(', ') || 'All'}
                  </div>
                </div>
              </div>
              {showPoster.description && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>Description</div>
                  <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>{showPoster.description}</p>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setShowPoster(null)}>Close</button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (showPoster.posterImage) {
                  window.open(showPoster.posterImage, '_blank');
                }
              }}
            >
              <Share2 size={14} /> Open Full Image
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Event?" size="sm">
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ 
            width: 52, height: 52, borderRadius: '50%', 
            background: 'linear-gradient(135deg,#fee2e2,#fecaca)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(239,68,68,0.2)' 
          }}>
            <Trash2 size={22} color="#ef4444" />
          </div>
          <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
            This action <strong>cannot be undone</strong>. The event and its poster will be permanently removed.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={del}>Yes, Delete</button>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 900px) { .events-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}