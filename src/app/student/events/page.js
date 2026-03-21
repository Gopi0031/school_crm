'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Lock, Calendar, Clock, MapPin } from 'lucide-react';

export default function StudentEvents() {
  const { user }   = useAuth();
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    if (!user) return;
    const branch = user.branch ? `?branch=${encodeURIComponent(user.branch)}` : '';
    fetch(`/api/events${branch}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.data || []); })
      .finally(() => setLoading(false));
  }, [user]);

  const now     = new Date(); now.setHours(0,0,0,0);
  const sorted  = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
  const filtered = sorted.filter(ev => {
    const d = new Date(ev.date);
    if (filter === 'upcoming') return d >= now;
    if (filter === 'past')     return d < now;
    return true;
  });

  const upCount = sorted.filter(e => new Date(e.date) >= now).length;
  const paCount = sorted.filter(e => new Date(e.date) < now).length;
  const nextEvent = sorted.find(e => new Date(e.date) >= now);

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="Events & Posts" subtitle="School events and announcements" />

      {/* Banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#1d4ed8' }}>
        <Lock size={14} /> Events are posted by your branch admin or teacher. Read-only.
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total',    v: sorted.length, c: '#4f46e5', bg: '#ede9fe' },
          { l: 'Upcoming', v: upCount,       c: '#7c3aed', bg: '#f5f3ff' },
          { l: 'Past',     v: paCount,       c: '#94a3b8', bg: '#f1f5f9' },
        ].map(({ l, v, c, bg }, i) => (
          <div key={l} className="card" style={{ textAlign: 'center', background: bg, borderTop: `3px solid ${c}`, animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${i * 70}ms` }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Next event banner */}
      {nextEvent && (
        <div style={{ background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)', border: '1px solid #c4b5fd', borderRadius: 14, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, animation: 'fadeSlideUp 0.4s ease both', animationDelay: '180ms' }}>
          <div style={{ fontSize: '2rem' }}>🎯</div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Next Event</div>
            <div style={{ fontWeight: 800, color: '#3b0764', fontSize: '0.95rem', marginTop: 2 }}>{nextEvent.name}</div>
            <div style={{ fontSize: '0.78rem', color: '#6d28d9', marginTop: 2 }}>📅 {new Date(nextEvent.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}{nextEvent.startTime ? ` • 🕐 ${nextEvent.startTime}` : ''}</div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ k: 'all', l: `All (${sorted.length})` }, { k: 'upcoming', l: `Upcoming (${upCount})` }, { k: 'past', l: `Past (${paCount})` }].map(({ k, l }) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: '7px 16px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, border: filter === k ? '2px solid #7c3aed' : '1.5px solid #e2e8f0', background: filter === k ? '#7c3aed' : 'white', color: filter === k ? 'white' : '#64748b', cursor: 'pointer', transition: 'all 0.18s ease' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Events list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1,2,3].map(i => <div key={i} className="card" style={{ height: 90, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📭</div>
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>No {filter !== 'all' ? filter : ''} events found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((ev, i) => {
            const isPast   = new Date(ev.date) < now;
            const isToday  = new Date(ev.date).toDateString() === now.toDateString();
            return (
              <div key={ev._id} className="card" style={{
                display: 'flex', gap: 16, alignItems: 'flex-start',
                borderLeft: `4px solid ${isToday ? '#7c3aed' : isPast ? '#cbd5e1' : '#a78bfa'}`,
                opacity: isPast ? 0.75 : 1,
                animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${i * 60}ms`,
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
              >
                {/* Date box */}
                <div style={{ width: 54, height: 54, borderRadius: 14, background: isPast ? '#f1f5f9' : 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: isPast ? 'none' : '0 4px 14px rgba(124,58,237,0.3)' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: isPast ? '#94a3b8' : 'white', lineHeight: 1 }}>
                    {new Date(ev.date).getDate()}
                  </span>
                  <span style={{ fontSize: '0.6rem', color: isPast ? '#94a3b8' : 'rgba(255,255,255,0.85)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {new Date(ev.date).toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{ev.name}</h3>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: isToday ? '#ede9fe' : isPast ? '#f1f5f9' : '#f5f3ff', color: isToday ? '#7c3aed' : isPast ? '#94a3b8' : '#5b21b6' }}>
                      {isToday ? 'Today' : isPast ? 'Past' : 'Upcoming'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.78rem', color: '#64748b' }}>
                    {ev.startTime && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>}
                    {ev.branch    && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {ev.branch}</span>}
                    {ev.class     && <span>📚 {ev.class}{ev.section ? ` • ${ev.section}` : ''}</span>}
                  </div>
                  {ev.description && (
                    <p style={{ color: '#475569', fontSize: '0.82rem', marginTop: 8, lineHeight: 1.6 }}>{ev.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </AppLayout>
  );
}
