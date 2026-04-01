'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, Clock, MapPin, ChevronLeft, ChevronRight, 
  Search, X, Sparkles, CalendarDays, Users, ArrowRight, Bell, Briefcase
} from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const TYPE_COLORS = {
  'General': { bg: '#6366f1', light: '#eef2ff', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  'Academic': { bg: '#3b82f6', light: '#eff6ff', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)' },
  'Sports': { bg: '#10b981', light: '#ecfdf5', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  'Cultural': { bg: '#ec4899', light: '#fdf2f8', gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
  'Holiday': { bg: '#f59e0b', light: '#fffbeb', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  'Exam': { bg: '#ef4444', light: '#fef2f2', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
  'Meeting': { bg: '#8b5cf6', light: '#f5f3ff', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  'Competition': { bg: '#06b6d4', light: '#ecfeff', gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)' }
};

const getTypeStyle = (type = 'General') => TYPE_COLORS[type] || TYPE_COLORS['General'];

export default function TeacherEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [scrollY, setScrollY] = useState(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Change to:
useEffect(() => {
  if (!user) return;
  const params = new URLSearchParams();
  if (user.branch) params.set('branch', user.branch);
  params.set('published', 'true');
  params.set('visibility', 'Teachers');   // ← add this line

  fetch(`/api/events?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.data || []); })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filtered = useMemo(() => {
    let data = events;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(e => e.name?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    if (filterType) data = data.filter(e => e.eventType === filterType);
    data = data.filter(e => {
      const d = new Date(e.date);
      if (filter === 'upcoming') return d >= today;
      if (filter === 'past') return d < today;
      return true;
    });
    return [...data].sort((a, b) => filter === 'past' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
  }, [events, search, filter, filterType]);

  const eventsOnDay = (day) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === d);
  };

  const upCount = events.filter(e => new Date(e.date) >= today).length;
  const meetingCount = events.filter(e => e.eventType === 'Meeting' && new Date(e.date) >= today).length;
  const nextEvent = events.filter(e => new Date(e.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
  const eventTypes = [...new Set(events.map(e => e.eventType).filter(Boolean))];
  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const openEvent = (ev) => {
    setSelectedEvent(ev);
    document.body.style.overflow = 'hidden';
  };

  const closeEvent = () => {
    setSelectedEvent(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <AppLayout requiredRole="teacher">
      {/* Hero Section */}
      <div style={{
        position: 'relative',
        height: 260,
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 24,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      }}>
        {/* Animated Background */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.6 }}>
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', transform: `translateY(${scrollY * 0.1}px)`, animation: 'pulse 4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-20%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', transform: `translateY(${scrollY * 0.15}px)`, animation: 'pulse 5s ease-in-out infinite 1s' }} />
        </div>

        {/* Floating Elements */}
        <div style={{ position: 'absolute', top: 30, right: 50, animation: 'float 4s ease-in-out infinite' }}>
          <Briefcase size={36} color="rgba(255,255,255,0.15)" />
        </div>
        <div style={{ position: 'absolute', bottom: 40, right: 100, animation: 'float 5s ease-in-out infinite 0.5s' }}>
          <Calendar size={28} color="rgba(255,255,255,0.1)" />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, padding: '36px 32px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: 14, 
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
              }}>
                <CalendarDays size={22} color="white" />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  {user?.branch || 'School'} Events
                </span>
              </div>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>
              Events Dashboard
            </h1>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Total', value: events.length, icon: '📅', color: '#6366f1' },
              { label: 'Upcoming', value: upCount, icon: '🎯', color: '#10b981' },
              { label: 'Meetings', value: meetingCount, icon: '👥', color: '#f59e0b' },
              { label: 'This Month', value: events.filter(e => new Date(e.date).getMonth() === month).length, icon: '📆', color: '#ec4899' }
            ].map((stat, i) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: 16,
                padding: '14px 20px',
                border: '1px solid rgba(255,255,255,0.1)',
                animation: `slideUp 0.5s ease ${i * 0.1}s both`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>{stat.icon}</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>{stat.value}</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meeting Alert */}
      {meetingCount > 0 && (
        <div style={{ 
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
          borderRadius: 18, padding: '16px 22px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 4px 20px rgba(245,158,11,0.2)',
          animation: 'slideUp 0.5s ease 0.2s both'
        }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 14, 
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(245,158,11,0.4)'
          }}>
            <Bell size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem' }}>
              {meetingCount} Upcoming Meeting{meetingCount > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#a16207' }}>Don't forget to check your schedule</div>
          </div>
          <ArrowRight size={20} color="#92400e" />
        </div>
      )}

      {/* Next Event Card */}
      {nextEvent && (
        <div 
          onClick={() => openEvent(nextEvent)}
          style={{
            position: 'relative',
            borderRadius: 24,
            overflow: 'hidden',
            marginBottom: 24,
            cursor: 'pointer',
            boxShadow: '0 10px 50px rgba(0,0,0,0.12)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'slideUp 0.5s ease 0.3s both'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.01)'; e.currentTarget.style.boxShadow = '0 20px 70px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 50px rgba(0,0,0,0.12)'; }}
        >
          <div style={{
            position: 'absolute', inset: -20,
            background: nextEvent.posterImage 
              ? `url(${nextEvent.posterImage}) center/cover` 
              : getTypeStyle(nextEvent.eventType).gradient,
            transform: `scale(1.1) translateY(${scrollY * 0.03}px)`,
          }} />
          <div style={{ position: 'absolute', inset: 0, background: nextEvent.posterImage ? 'linear-gradient(135deg, rgba(0,0,0,0.75), rgba(0,0,0,0.5))' : 'rgba(0,0,0,0.1)' }} />

          <div style={{ position: 'relative', padding: '32px', display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{
              width: 85, height: 85, borderRadius: 22,
              background: 'white',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: getTypeStyle(nextEvent.eventType).bg, lineHeight: 1 }}>
                {new Date(nextEvent.date).getDate()}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {new Date(nextEvent.date).toLocaleDateString('en-IN', { month: 'short' })}
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, padding: '5px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
                  <Sparkles size={12} /> NEXT UP
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '5px 14px', borderRadius: 99, background: getTypeStyle(nextEvent.eventType).bg, color: 'white' }}>
                  {nextEvent.eventType || 'General'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', margin: '0 0 10px', textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>
                {nextEvent.name}
              </h2>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {nextEvent.startTime && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    <Clock size={15} /> {nextEvent.startTime}{nextEvent.endTime ? ` - ${nextEvent.endTime}` : ''}
                  </span>
                )}
                {nextEvent.venue && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    <MapPin size={15} /> {nextEvent.venue}
                  </span>
                )}
              </div>
            </div>

            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowRight size={24} color="white" />
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', animation: 'fadeIn 0.5s ease 0.4s both' }}>
        {/* Search */}
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'white', borderRadius: 14, padding: '10px 16px',
          border: '2px solid #e2e8f0', flex: 1, minWidth: 180, maxWidth: 300,
          transition: 'all 0.3s'
        }}>
          <Search size={18} color="#94a3b8" />
          <input
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', flex: 1, color: '#1e293b' }}
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} color="#64748b" />
            </button>
          )}
        </div>

        {/* Type Filter */}
        <select 
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: 12, border: '2px solid #e2e8f0',
            background: 'white', fontSize: '0.85rem', fontWeight: 600, color: '#374151',
            cursor: 'pointer', outline: 'none', minWidth: 130
          }}
        >
          <option value="">All Types</option>
          {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Time Filter */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 12, padding: 4 }}>
          {['all', 'upcoming', 'past'].map(k => (
            <button 
              key={k}
              onClick={() => setFilter(k)}
              style={{
                padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: filter === k ? 'white' : 'transparent',
                boxShadow: filter === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                color: filter === k ? '#6366f1' : '#64748b',
                fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize'
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3, marginLeft: 'auto' }}>
          {['grid', 'calendar'].map(v => (
            <button 
              key={v}
              onClick={() => setViewMode(v)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: viewMode === v ? 'white' : 'transparent',
                color: viewMode === v ? '#6366f1' : '#94a3b8',
                fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize'
              }}
            >
              {v === 'grid' ? '⊞' : '📅'} {v}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div style={{ background: 'white', borderRadius: 24, padding: 28, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', animation: 'scaleIn 0.4s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <button 
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              style={{ width: 48, height: 48, borderRadius: 14, border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
            >
              <ChevronLeft size={22} color="#64748b" />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>{MONTHS[month]}</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>{year}</div>
            </div>
            <button 
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              style={{ width: 48, height: 48, borderRadius: 14, border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
            >
              <ChevronRight size={22} color="#64748b" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 10 }}>
            {DAYS.map((d, i) => (
              <div key={d} style={{ textAlign: 'center', padding: 10, fontSize: '0.8rem', fontWeight: 800, color: i === 0 || i === 6 ? '#ef4444' : '#94a3b8', textTransform: 'uppercase' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEvs = eventsOnDay(day);
              const isTod = isToday(day);
              return (
                <div 
                  key={`d-${day}`}
                  onClick={() => dayEvs.length && openEvent(dayEvs[0])}
                  style={{
                    minHeight: 90, borderRadius: 16, padding: 10,
                    cursor: dayEvs.length ? 'pointer' : 'default',
                    background: isTod ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : dayEvs.length ? '#f8fafc' : 'white',
                    border: `2px solid ${isTod ? 'transparent' : dayEvs.length ? '#e2e8f0' : '#f1f5f9'}`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { if (dayEvs.length && !isTod) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontWeight: isTod ? 900 : 600, fontSize: '1rem', color: isTod ? 'white' : '#1e293b', marginBottom: 6 }}>
                    {day}
                  </div>
                  {dayEvs.slice(0, 2).map(ev => (
                    <div key={ev.id || ev._id} style={{ 
                      fontSize: '0.65rem', background: isTod ? 'rgba(255,255,255,0.3)' : getTypeStyle(ev.eventType).bg, 
                      color: 'white', borderRadius: 5, padding: '3px 7px', marginTop: 3, 
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 600
                    }}>
                      {ev.name}
                    </div>
                  ))}
                  {dayEvs.length > 2 && (
                    <div style={{ fontSize: '0.65rem', color: isTod ? 'rgba(255,255,255,0.8)' : '#6366f1', fontWeight: 700, marginTop: 3 }}>
                      +{dayEvs.length - 2} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 22 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: 300, borderRadius: 24, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'bounce 2s infinite' }}>📭</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>No Events Found</h3>
            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
              {search ? `No events matching "${search}"` : 'Check back later'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 22 }}>
            {filtered.map((ev, i) => {
              const isPast = new Date(ev.date) < today;
              const evDate = new Date(ev.date);
              const isEventToday = evDate.toDateString() === today.toDateString();
              const typeStyle = getTypeStyle(ev.eventType);
              const daysLeft = Math.ceil((evDate - today) / (1000 * 60 * 60 * 24));

              return (
                <div 
                  key={ev.id || ev._id || `ev-${i}`}
                  onClick={() => openEvent(ev)}
                  style={{
                    borderRadius: 24, overflow: 'hidden', cursor: 'pointer',
                    background: 'white', boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `cardAppear 0.5s ease ${i * 0.07}s both`,
                    opacity: isPast ? 0.7 : 1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
                >
                  <div style={{
                    height: 170,
                    background: ev.posterImage 
                      ? `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85)), url(${ev.posterImage}) center/cover`
                      : typeStyle.gradient,
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: 16, right: 16, width: 64, height: 64, borderRadius: 16, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: typeStyle.bg, lineHeight: 1 }}>{evDate.getDate()}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{evDate.toLocaleDateString('en-IN', { month: 'short' })}</span>
                    </div>

                    <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '5px 12px', borderRadius: 99, background: ev.posterImage ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', color: ev.posterImage ? typeStyle.bg : 'white' }}>
                        {ev.eventType || 'General'}
                      </span>
                    </div>

                    {!isPast && (
                      <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '5px 12px', borderRadius: 99, background: isEventToday ? '#fbbf24' : 'rgba(255,255,255,0.2)', color: isEventToday ? '#1e293b' : 'white' }}>
                          {isEventToday ? '🎯 Today!' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '22px 24px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.name}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#64748b' }}>
                        <CalendarDays size={16} color={typeStyle.bg} />
                        {evDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </div>
                      {ev.startTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#64748b' }}>
                          <Clock size={16} color={typeStyle.bg} />
                          {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''}
                        </div>
                      )}
                      {ev.venue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#64748b' }}>
                          <MapPin size={16} color={typeStyle.bg} />
                          {ev.venue}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Event Detail Modal with Parallax */}
      {selectedEvent && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }}
          onClick={closeEvent}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }} />

          <div 
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 720, maxHeight: '94vh',
              background: 'white', borderRadius: '36px 36px 0 0', overflow: 'hidden',
              animation: 'slideUpModal 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 10px', cursor: 'grab' }} onClick={closeEvent}>
              <div style={{ width: 48, height: 6, borderRadius: 99, background: '#e2e8f0' }} />
            </div>

            <div style={{ position: 'relative', height: selectedEvent.posterImage ? 340 : 220, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: -40,
                background: selectedEvent.posterImage 
                  ? `url(${selectedEvent.posterImage}) center/cover`
                  : getTypeStyle(selectedEvent.eventType).gradient,
                animation: 'parallaxZoom 0.8s ease both'
              }} />
              <div style={{ position: 'absolute', inset: 0, background: selectedEvent.posterImage ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)' : 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }} />

              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 32px 28px', animation: 'slideUp 0.6s ease 0.2s both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '6px 16px', borderRadius: 99, background: getTypeStyle(selectedEvent.eventType).bg, color: 'white' }}>
                    {selectedEvent.eventType || 'General'}
                  </span>
                  {new Date(selectedEvent.date) >= today && (
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '6px 16px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}>
                      {new Date(selectedEvent.date).toDateString() === today.toDateString() ? '🎯 Today' : 'Upcoming'}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
                  {selectedEvent.name}
                </h2>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 36px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28, animation: 'slideUp 0.5s ease 0.3s both' }}>
                <div style={{ background: getTypeStyle(selectedEvent.eventType).light, borderRadius: 18, padding: '18px 22px', borderLeft: `4px solid ${getTypeStyle(selectedEvent.eventType).bg}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <CalendarDays size={20} color={getTypeStyle(selectedEvent.eventType).bg} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</span>
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                    {new Date(selectedEvent.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>

                {selectedEvent.startTime && (
                  <div style={{ background: '#f8fafc', borderRadius: 18, padding: '18px 22px', borderLeft: '4px solid #64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Clock size={20} color="#64748b" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Time</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                      {selectedEvent.startTime}{selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}
                    </div>
                  </div>
                )}

                {selectedEvent.venue && (
                  <div style={{ background: '#f8fafc', borderRadius: 18, padding: '18px 22px', borderLeft: '4px solid #64748b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <MapPin size={20} color="#64748b" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Venue</span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                      {selectedEvent.venue}
                    </div>
                  </div>
                )}
              </div>

              {selectedEvent.description && (
                <div style={{ marginBottom: 28, animation: 'slideUp 0.5s ease 0.4s both' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase' }}>About This Event</h4>
                  <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8, margin: 0 }}>
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '18px 0', borderTop: '1px solid #f1f5f9', animation: 'slideUp 0.5s ease 0.5s both' }}>
                {selectedEvent.class && selectedEvent.class !== 'All' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: '#64748b', background: '#f8fafc', padding: '10px 16px', borderRadius: 12 }}>
                    📚 {selectedEvent.class}{selectedEvent.section && selectedEvent.section !== 'All' ? ` - ${selectedEvent.section}` : ''}
                  </span>
                )}
                {selectedEvent.branch && selectedEvent.branch !== 'All' && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', color: '#64748b', background: '#f8fafc', padding: '10px 16px', borderRadius: 12 }}>
                    🏫 {selectedEvent.branch}
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '18px 32px 28px', borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={closeEvent}
                style={{
                  width: '100%', padding: '18px', borderRadius: 16, border: 'none',
                  background: getTypeStyle(selectedEvent.eventType).gradient,
                  color: 'white', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'transform 0.3s, box-shadow 0.3s'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes cardAppear { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideUpModal { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes parallaxZoom { from { transform: scale(1.2); } to { transform: scale(1.05); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.1); opacity: 0.3; } }
      `}</style>
    </AppLayout>
  );
}