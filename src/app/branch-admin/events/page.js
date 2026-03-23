'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal, FormField, Badge, EmptyState } from '@/components/ui';
import { 
  Plus, Edit2, Trash2, ChevronLeft, ChevronRight, CalendarDays, 
  Clock, MapPin, Sparkles, Image, X, Eye, Users, ImagePlus, Share2
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CLASSES = ['All','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['All','A','B','C','D','E'];
const VISIBILITY_OPTIONS = ['All', 'Teachers', 'Students', 'Parents'];
const EVENT_TYPES = ['General', 'Academic', 'Sports', 'Cultural', 'Holiday', 'Exam', 'Meeting', 'Competition'];

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

export default function BranchAdminEvents() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    name: '', class: 'All', section: 'All', date: '',
    startTime: '', endTime: '', description: '', academicYear: '2025-26',
    eventType: 'General', visibility: ['All'], posterImage: null,
    posterPublicId: null, isPublished: true
  });
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

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
    }
  }, []);

  useEffect(() => {
    if (user?.branch) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?branch=${encodeURIComponent(user.branch)}`);
      const data = await res.json();
      if (data.success) setEvents(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => events.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase())
  ), [events, search]);

  const eventsOnDay = day => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filtered.filter(e => e.date === d);
  };

  const upcoming = [...filtered]
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('❌ Please select an image file');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target.result);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'event-posters');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        setForm(prev => ({ ...prev, posterImage: data.url, posterPublicId: data.publicId }));
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

  const save = async () => {
    if (!form.name || !form.date) {
      showToast('❌ Please fill required fields');
      return;
    }
    setSaving(true);

    const payload = { ...form, branch: user.branch, createdBy: user.id || user._id };
    const method = editEvent ? 'PUT' : 'POST';
    const url = editEvent ? `/api/events/${editEvent.id || editEvent._id}` : '/api/events';

    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const d = await r.json();

      if (d.success) {
        loadEvents();
        setShowAdd(false);
        setEditEvent(null);
        setForm({
          name: '', class: 'All', section: 'All', date: '',
          startTime: '', endTime: '', description: '', academicYear: '2025-26',
          eventType: 'General', visibility: ['All'], posterImage: null,
          posterPublicId: null, isPublished: true
        });
        setImagePreview(null);
        showToast(editEvent ? '✅ Event updated!' : '✅ Event created!');
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
    loadEvents();
    showToast('🗑️ Event deleted');
  };

  const openEdit = ev => {
    setEditEvent(ev);
    setForm({
      name: ev.name, class: ev.class, section: ev.section,
      date: ev.date, startTime: ev.startTime, endTime: ev.endTime,
      description: ev.description, academicYear: ev.academicYear,
      eventType: ev.eventType || 'General', visibility: ev.visibility || ['All'],
      posterImage: ev.posterImage, posterPublicId: ev.posterPublicId,
      isPublished: ev.isPublished ?? true
    });
    setImagePreview(ev.posterImage);
    setShowAdd(true);
  };

  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  const colorFor = (type = 'General') => TYPE_COLORS[type] || '#6366f1';

  return (
    <AppLayout requiredRole="branch-admin">
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

      <PageHeader title="Branch Events" subtitle={`Manage events for ${user?.branch || 'your branch'}`}>
        <button className="btn btn-primary" onClick={() => {
          setEditEvent(null);
          setForm({
            name: '', class: 'All', section: 'All', date: '',
            startTime: '', endTime: '', description: '', academicYear: '2025-26',
            eventType: 'General', visibility: ['All'], posterImage: null,
            posterPublicId: null, isPublished: true
          });
          setImagePreview(null);
          setShowAdd(true);
        }}>
          <Plus size={15} /> New Event
        </button>
      </PageHeader>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          background: 'white', borderRadius: 13, padding: '9px 14px',
          border: '1.5px solid #e0e7ff', maxWidth: 320
        }}>
          <CalendarDays size={15} color="#a5b4fc" />
          <input
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.84rem', flex: 1 }}
            placeholder="Search events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }} className="events-grid">
        {/* Calendar Panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '18px 22px 14px',
            background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
            borderBottom: '1.5px solid #e0e7ff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <button className="btn btn-outline" style={{ padding: '7px 11px' }}
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
            <button className="btn btn-outline" style={{ padding: '7px 11px' }}
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ padding: '16px 18px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 6 }}>
              {DAYS.map(d => (
                <div key={d} style={{
                  textAlign: 'center', padding: '5px 0', fontSize: '0.68rem',
                  fontWeight: 800, color: '#a5b4fc', textTransform: 'uppercase'
                }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayEvs = eventsOnDay(day);
                const isSel = selectedDate === day;
                const isTod = isToday(day);
                return (
                  <div
                    key={`d-${day}`}
                    onClick={() => setSelectedDate(isSel ? null : day)}
                    style={{
                      minHeight: 60, borderRadius: 11, padding: '6px',
                      cursor: 'pointer', position: 'relative',
                      border: `1.5px solid ${isSel ? '#6366f1' : isTod ? '#c4b5fd' : '#f0f2ff'}`,
                      background: isSel ? 'linear-gradient(135deg,#eef2ff,#e0e7ff)' : isTod ? '#faf8ff' : 'white'
                    }}
                  >
                    <div style={{
                      fontWeight: isTod ? 900 : 500, fontSize: '0.8rem',
                      color: isTod ? '#6366f1' : '#374151', marginBottom: 3, textAlign: 'right'
                    }}>{day}</div>
                    {dayEvs.slice(0, 2).map(ev => (
                      <div key={ev.id || ev._id} style={{
                        fontSize: '0.55rem', background: colorFor(ev.eventType),
                        color: 'white', borderRadius: 4, padding: '1px 4px',
                        marginBottom: 1, overflow: 'hidden', whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis', fontWeight: 600
                      }}>
                        {ev.name}
                      </div>
                    ))}
                    {dayEvs.length > 2 && (
                      <div style={{ fontSize: '0.55rem', color: '#8b5cf6', fontWeight: 800 }}>
                        +{dayEvs.length - 2}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Events */}
          {selectedDate && (
            <div style={{
              padding: '14px 18px', borderTop: '1.5px solid #f0f2ff',
              background: 'linear-gradient(135deg,#fafbff,#f5f3ff)'
            }}>
              <h4 style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.9rem' }}>
                {selectedDate} {MONTHS[month]} {year}
              </h4>
              {eventsOnDay(selectedDate).length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.84rem', textAlign: 'center' }}>
                  No events
                </p>
              ) : eventsOnDay(selectedDate).map(ev => (
                <div key={ev.id || ev._id} style={{
                  padding: '10px 12px', borderRadius: 10, background: 'white',
                  marginBottom: 8, border: `1.5px solid ${colorFor(ev.eventType)}20`
                }}>
                  {ev.posterImage && (
                    <div
                      onClick={() => setShowPoster(ev)}
                      style={{
                        width: '100%', height: 80, borderRadius: 8,
                        background: `url(${ev.posterImage}) center/cover`,
                        marginBottom: 8, cursor: 'pointer'
                      }}
                    />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#1e293b' }}>{ev.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {ev.startTime && `${ev.startTime} - ${ev.endTime}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline" style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                        onClick={() => openEdit(ev)}><Edit2 size={10} /></button>
                      <button className="btn btn-danger" style={{ padding: '3px 6px', fontSize: '0.7rem' }}
                        onClick={() => setDeleteId(ev.id || ev._id)}><Trash2 size={10} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{
            padding: '14px 16px', background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)',
            borderBottom: '1.5px solid #e0e7ff', display: 'flex', alignItems: 'center', gap: 8
          }}>
            <Sparkles size={15} color="#8b5cf6" />
            <h3 style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem' }}>Upcoming</h3>
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
          <div style={{ padding: '10px 12px', maxHeight: 500, overflowY: 'auto' }}>
            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming events" />
            ) : upcoming.map((ev, i) => {
              const c = colorFor(ev.eventType);
              const daysLeft = Math.ceil((new Date(ev.date) - today) / (1000 * 60 * 60 * 24));
              return (
                <div key={ev.id || ev._id || `up-${i}`} style={{
                  padding: '10px', borderRadius: 10, marginBottom: 8,
                  background: 'white', borderLeft: `3px solid ${c}`,
                  animation: `fadeSlideUp 0.3s ease ${i * 30}ms both`
                }}>
                  {ev.posterImage && (
                    <div
                      onClick={() => setShowPoster(ev)}
                      style={{
                        width: '100%', height: 60, borderRadius: 6,
                        background: `url(${ev.posterImage}) center/cover`,
                        marginBottom: 6, cursor: 'pointer'
                      }}
                    />
                  )}
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 2 }}>{ev.name}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    <CalendarDays size={9} style={{ display: 'inline', marginRight: 3 }} />{ev.date}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <span style={{
                      fontSize: '0.6rem', padding: '2px 6px', borderRadius: 99,
                      background: `${c}18`, color: c, fontWeight: 700
                    }}>
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`}
                    </span>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button onClick={() => openEdit(ev)} style={{
                        background: `${c}15`, border: 'none', cursor: 'pointer',
                        color: c, width: 22, height: 22, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}><Edit2 size={9} /></button>
                      <button onClick={() => setDeleteId(ev.id || ev._id)} style={{
                        background: '#fee2e220', border: 'none', cursor: 'pointer',
                        color: '#f43f5e', width: 22, height: 22, borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}><Trash2 size={9} /></button>
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
        size="md"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Event Name" required>
              <input className="input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Event name" />
            </FormField>
          </div>
          <FormField label="Event Type">
            <select className="select" value={form.eventType}
              onChange={e => setForm({ ...form, eventType: e.target.value })}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Class">
            <select className="select" value={form.class}
              onChange={e => setForm({ ...form, class: e.target.value })}>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Date" required>
            <input className="input" type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </FormField>
          <FormField label="Section">
            <select className="select" value={form.section}
              onChange={e => setForm({ ...form, section: e.target.value })}>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Start Time">
            <input className="input" type="time" value={form.startTime}
              onChange={e => setForm({ ...form, startTime: e.target.value })} />
          </FormField>
          <FormField label="End Time">
            <input className="input" type="time" value={form.endTime}
              onChange={e => setForm({ ...form, endTime: e.target.value })} />
          </FormField>

          {/* Poster Upload */}
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Event Poster">
              <div style={{
                border: '2px dashed #e0e7ff', borderRadius: 10, padding: 14,
                background: '#fafbff', textAlign: 'center'
              }}>
                {imagePreview || form.posterImage ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview || form.posterImage} alt="Poster"
                      style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8 }} />
                    <button onClick={() => {
                      setForm(prev => ({ ...prev, posterImage: null, posterPublicId: null }));
                      setImagePreview(null);
                    }} style={{
                      position: 'absolute', top: 4, right: 4, width: 24, height: 24,
                      borderRadius: '50%', background: '#ef4444', color: 'white',
                      border: 'none', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}><X size={12} /></button>
                  </div>
                ) : (
                  <>
                    <input ref={fileInputRef} type="file" accept="image/*"
                      onChange={handleImageUpload} style={{ display: 'none' }} id="poster" />
                    <label htmlFor="poster" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {uploading ? (
                          <span style={{
                            width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite'
                          }} />
                        ) : <ImagePlus size={20} color="white" />}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>
                        {uploading ? 'Uploading...' : 'Click to upload'}
                      </span>
                    </label>
                  </>
                )}
              </div>
            </FormField>
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Description">
              <textarea className="input" rows={2} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Details..." style={{ resize: 'vertical' }} />
            </FormField>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16, paddingTop: 12, borderTop: '1px solid #f0f2ff' }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditEvent(null); }}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || uploading}>
            {saving ? 'Saving...' : editEvent ? 'Update' : 'Create'}
          </button>
        </div>
      </Modal>

      {/* Poster Viewer */}
      {showPoster && (
        <Modal open onClose={() => setShowPoster(null)} title={showPoster.name} size="lg">
          <div style={{ textAlign: 'center' }}>
            {showPoster.posterImage && (
              <img src={showPoster.posterImage} alt={showPoster.name}
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 12 }} />
            )}
            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, textAlign: 'left' }}>
              <p><strong>Date:</strong> {showPoster.date}</p>
              <p><strong>Time:</strong> {showPoster.startTime} - {showPoster.endTime}</p>
              <p><strong>Class:</strong> {showPoster.class} / {showPoster.section}</p>
              {showPoster.description && <p><strong>Details:</strong> {showPoster.description}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn-outline" onClick={() => setShowPoster(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Event?" size="sm">
        <p style={{ color: '#64748b', textAlign: 'center', margin: '16px 0' }}>
          This will permanently delete the event and its poster.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={del}>Delete</button>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 800px) { .events-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}