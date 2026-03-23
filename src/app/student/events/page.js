'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, Clock, MapPin, ChevronLeft, ChevronRight, 
  Search, X, Sparkles, CalendarDays, Users, ArrowRight,
  ChevronDown
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

export default function StudentEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    if (user.branch) params.set('branch', user.branch);
    if (user.class) params.set('class', user.class);
    params.set('published', 'true');

    fetch(`/api/events?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.data || []); })
      .finally(() => setLoading(false));
  }, [user]);

  // Parallax scroll effect
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
    data = data.filter(e => {
      const d = new Date(e.date);
      if (filter === 'upcoming') return d >= today;
      if (filter === 'past') return d < today;
      return true;
    });
    return [...data].sort((a, b) => filter === 'past' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
  }, [events, search, filter]);

  const eventsOnDay = (day) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === d);
  };

  const upCount = events.filter(e => new Date(e.date) >= today).length;
  const nextEvent = events.filter(e => new Date(e.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
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
    <AppLayout requiredRole="student">
      <div ref={containerRef}>
        {/* Hero Section with Parallax */}
        <div style={{
          position: 'relative',
          height: 280,
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
          {/* Parallax Background Shapes */}
          <div style={{
            position: 'absolute',
            inset: 0,
            transform: `translateY(${scrollY * 0.3}px)`,
            transition: 'transform 0.1s ease-out'
          }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', transform: `translateY(${scrollY * 0.1}px)` }} />
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', transform: `translateY(${scrollY * 0.15}px)` }} />
            <div style={{ position: 'absolute', top: '30%', left: '20%', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', transform: `translateY(${scrollY * 0.2}px)` }} />
          </div>

          {/* Floating Icons */}
          <div style={{ position: 'absolute', top: 40, right: 60, animation: 'float 4s ease-in-out infinite', opacity: 0.6 }}>
            <Calendar size={40} color="white" />
          </div>
          <div style={{ position: 'absolute', bottom: 50, right: 120, animation: 'float 5s ease-in-out infinite 0.5s', opacity: 0.4 }}>
            <Sparkles size={30} color="white" />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, padding: '40px 32px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarDays size={20} color="white" />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  School Events
                </span>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0, textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
                Events & Activities
              </h1>
              <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
                Stay updated with upcoming events and celebrations
              </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'Total Events', value: events.length, icon: '📅' },
                { label: 'Upcoming', value: upCount, icon: '🎯' },
                { label: 'This Month', value: events.filter(e => new Date(e.date).getMonth() === month).length, icon: '📆' }
              ].map((stat, i) => (
                <div key={stat.label} style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 16,
                  padding: '12px 20px',
                  animation: `slideUp 0.5s ease ${i * 0.1}s both`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>{stat.value}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next Event Spotlight */}
        {nextEvent && (
          <div 
            onClick={() => openEvent(nextEvent)}
            style={{
              position: 'relative',
              borderRadius: 20,
              overflow: 'hidden',
              marginBottom: 24,
              cursor: 'pointer',
              transform: 'translateZ(0)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease',
              boxShadow: '0 10px 40px rgba(102, 126, 234, 0.2)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'; e.currentTarget.style.boxShadow = '0 20px 60px rgba(102, 126, 234, 0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(102, 126, 234, 0.2)'; }}
          >
            {/* Background Image with Parallax */}
            <div style={{
              position: 'absolute',
              inset: -20,
              background: nextEvent.posterImage 
                ? `url(${nextEvent.posterImage}) center/cover` 
                : getTypeStyle(nextEvent.eventType).gradient,
              filter: 'blur(0px)',
              transform: `scale(1.1) translateY(${scrollY * 0.05}px)`,
            }} />
            
            {/* Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: nextEvent.posterImage 
                ? 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)'
                : 'rgba(0,0,0,0.1)'
            }} />

            {/* Content */}
            <div style={{ position: 'relative', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Date Box */}
              <div style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: getTypeStyle(nextEvent.eventType).bg, lineHeight: 1 }}>
                  {new Date(nextEvent.date).getDate()}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  {new Date(nextEvent.date).toLocaleDateString('en-IN', { month: 'short' })}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                    background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)'
                  }}>
                    <Sparkles size={12} /> NEXT EVENT
                  </span>
                  <span style={{ 
                    fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                    background: getTypeStyle(nextEvent.eventType).bg, color: 'white'
                  }}>
                    {nextEvent.eventType || 'General'}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: '0 0 8px', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                  {nextEvent.name}
                </h2>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {nextEvent.startTime && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                      <Clock size={14} /> {nextEvent.startTime}{nextEvent.endTime ? ` - ${nextEvent.endTime}` : ''}
                    </span>
                  )}
                  {nextEvent.venue && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                      <MapPin size={14} /> {nextEvent.venue}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div style={{
                width: 50, height: 50, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.3s ease'
              }}>
                <ArrowRight size={22} color="white" />
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ 
          display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
          animation: 'fadeIn 0.5s ease 0.3s both'
        }}>
          {/* Search */}
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'white', borderRadius: 14, padding: '10px 16px',
            border: '2px solid #e2e8f0', flex: 1, minWidth: 200, maxWidth: 320,
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
            onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(102,126,234,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Search size={18} color="#94a3b8" />
            <input
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', flex: 1, color: '#1e293b' }}
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#64748b" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 12, padding: 4 }}>
            {['all', 'upcoming', 'past'].map(k => (
              <button 
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: filter === k ? 'white' : 'transparent',
                  boxShadow: filter === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  color: filter === k ? '#667eea' : '#64748b',
                  fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize',
                  transition: 'all 0.3s ease'
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
                  boxShadow: viewMode === v ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  color: viewMode === v ? '#667eea' : '#94a3b8',
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
          <div className="card" style={{ marginBottom: 24, padding: 24, animation: 'scaleIn 0.4s ease' }}>
            {/* Month Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                style={{ width: 44, height: 44, borderRadius: 12, border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.background = '#f5f3ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
              >
                <ChevronLeft size={20} color="#64748b" />
              </button>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {MONTHS[month]}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{year}</div>
              </div>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                style={{ width: 44, height: 44, borderRadius: 12, border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.background = '#f5f3ff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
              >
                <ChevronRight size={20} color="#64748b" />
              </button>
            </div>

            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
              {DAYS.map((d, i) => (
                <div key={d} style={{ textAlign: 'center', padding: 8, fontSize: '0.75rem', fontWeight: 800, color: i === 0 || i === 6 ? '#ef4444' : '#94a3b8', textTransform: 'uppercase' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayEvs = eventsOnDay(day);
                const isTod = isToday(day);
                return (
                  <div 
                    key={`d-${day}`}
                    style={{
                      minHeight: 80, borderRadius: 14, padding: 8, cursor: dayEvs.length ? 'pointer' : 'default',
                      background: isTod ? 'linear-gradient(135deg, #667eea, #764ba2)' : dayEvs.length ? '#f8fafc' : 'white',
                      border: `2px solid ${isTod ? 'transparent' : dayEvs.length ? '#e2e8f0' : '#f1f5f9'}`,
                      transition: 'all 0.3s ease',
                      transform: 'translateZ(0)'
                    }}
                    onMouseEnter={e => { if (dayEvs.length && !isTod) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    onClick={() => dayEvs.length && openEvent(dayEvs[0])}
                  >
                    <div style={{ fontWeight: isTod ? 900 : 600, fontSize: '0.9rem', color: isTod ? 'white' : '#1e293b', marginBottom: 4 }}>
                      {day}
                    </div>
                    {dayEvs.slice(0, 2).map(ev => (
                      <div key={ev.id || ev._id} style={{ 
                        fontSize: '0.6rem', background: isTod ? 'rgba(255,255,255,0.3)' : getTypeStyle(ev.eventType).bg, 
                        color: 'white', borderRadius: 4, padding: '2px 6px', marginTop: 2, 
                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontWeight: 600
                      }}>
                        {ev.name}
                      </div>
                    ))}
                    {dayEvs.length > 2 && (
                      <div style={{ fontSize: '0.6rem', color: isTod ? 'rgba(255,255,255,0.8)' : '#667eea', fontWeight: 700, marginTop: 2 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ height: 280, borderRadius: 20, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'bounce 2s infinite' }}>📭</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>No Events Found</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                {search ? `No events matching "${search}"` : 'Check back later for upcoming events'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
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
                      borderRadius: 24,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: `cardAppear 0.5s ease ${i * 0.08}s both`,
                      opacity: isPast ? 0.7 : 1,
                      transform: 'translateY(0) scale(1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 20px 50px rgba(102,126,234,0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
                    }}
                  >
                    {/* Card Header / Image */}
                    <div style={{
                      height: 160,
                      background: ev.posterImage 
                        ? `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.8)), url(${ev.posterImage}) center/cover`
                        : typeStyle.gradient,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Floating Date Badge */}
                      <div style={{
                        position: 'absolute', top: 16, right: 16,
                        width: 60, height: 60, borderRadius: 16,
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                      }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 900, color: typeStyle.bg, lineHeight: 1 }}>
                          {evDate.getDate()}
                        </span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          {evDate.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                      </div>

                      {/* Type Badge */}
                      <div style={{ position: 'absolute', top: 16, left: 16 }}>
                        <span style={{ 
                          fontSize: '0.7rem', fontWeight: 700, padding: '5px 12px', borderRadius: 99,
                          background: ev.posterImage ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                          color: ev.posterImage ? typeStyle.bg : 'white',
                          backdropFilter: 'blur(10px)'
                        }}>
                          {ev.eventType || 'General'}
                        </span>
                      </div>

                      {/* Status Badge */}
                      {!isPast && (
                        <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                          <span style={{ 
                            fontSize: '0.7rem', fontWeight: 800, padding: '5px 12px', borderRadius: 99,
                            background: isEventToday ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                            color: isEventToday ? '#1e293b' : 'white',
                            backdropFilter: 'blur(10px)'
                          }}>
                            {isEventToday ? '🎯 Today!' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft} days`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '20px 22px' }}>
                      <h3 style={{ 
                        fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: 10,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {ev.name}
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' }}>
                          <CalendarDays size={15} color={typeStyle.bg} />
                          {evDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </div>
                        {ev.startTime && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' }}>
                            <Clock size={15} color={typeStyle.bg} />
                            {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''}
                          </div>
                        )}
                        {ev.venue && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' }}>
                            <MapPin size={15} color={typeStyle.bg} />
                            {ev.venue}
                          </div>
                        )}
                      </div>

                      {ev.description && (
                        <p style={{ 
                          fontSize: '0.85rem', color: '#94a3b8', marginTop: 12, lineHeight: 1.6,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                        }}>
                          {ev.description}
                        </p>
                      )}
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
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              animation: 'fadeIn 0.3s ease'
            }}
            onClick={closeEvent}
          >
            {/* Backdrop */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
            }} />

            {/* Modal Content */}
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 700,
                maxHeight: '92vh',
                background: 'white',
                borderRadius: '32px 32px 0 0',
                overflow: 'hidden',
                animation: 'slideUpModal 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Close Handle */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', cursor: 'grab' }} onClick={closeEvent}>
                <div style={{ width: 40, height: 5, borderRadius: 99, background: '#e2e8f0' }} />
              </div>

              {/* Parallax Header Image */}
              <div style={{ 
                position: 'relative', 
                height: selectedEvent.posterImage ? 320 : 200,
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <div style={{
                  position: 'absolute',
                  inset: -30,
                  background: selectedEvent.posterImage 
                    ? `url(${selectedEvent.posterImage}) center/cover`
                    : getTypeStyle(selectedEvent.eventType).gradient,
                  animation: 'parallaxZoom 0.8s ease both'
                }} />
                
                {/* Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: selectedEvent.posterImage 
                    ? 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)'
                }} />

                {/* Event Info on Image */}
                <div style={{ 
                  position: 'absolute', bottom: 0, left: 0, right: 0, 
                  padding: '30px 28px 24px',
                  animation: 'slideUp 0.6s ease 0.2s both'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, padding: '5px 14px', borderRadius: 99,
                      background: getTypeStyle(selectedEvent.eventType).bg, color: 'white'
                    }}>
                      {selectedEvent.eventType || 'General'}
                    </span>
                    {new Date(selectedEvent.date) >= today && (
                      <span style={{ 
                        fontSize: '0.75rem', fontWeight: 700, padding: '5px 14px', borderRadius: 99,
                        background: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)'
                      }}>
                        {new Date(selectedEvent.date).toDateString() === today.toDateString() ? '🎯 Today' : 'Upcoming'}
                      </span>
                    )}
                  </div>
                  <h2 style={{ 
                    fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0,
                    textShadow: '0 2px 20px rgba(0,0,0,0.5)'
                  }}>
                    {selectedEvent.name}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px 32px' }}>
                {/* Date & Time Card */}
                <div style={{ 
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14,
                  marginBottom: 24, animation: 'slideUp 0.5s ease 0.3s both'
                }}>
                  <div style={{ 
                    background: getTypeStyle(selectedEvent.eventType).light, 
                    borderRadius: 16, padding: '16px 20px',
                    borderLeft: `4px solid ${getTypeStyle(selectedEvent.eventType).bg}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <CalendarDays size={18} color={getTypeStyle(selectedEvent.eventType).bg} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date</span>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                      {new Date(selectedEvent.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  {selectedEvent.startTime && (
                    <div style={{ 
                      background: '#f8fafc', borderRadius: 16, padding: '16px 20px',
                      borderLeft: '4px solid #64748b'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Clock size={18} color="#64748b" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Time</span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                        {selectedEvent.startTime}{selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}
                      </div>
                    </div>
                  )}

                  {selectedEvent.venue && (
                    <div style={{ 
                      background: '#f8fafc', borderRadius: 16, padding: '16px 20px',
                      borderLeft: '4px solid #64748b', gridColumn: selectedEvent.startTime ? 'auto' : '1 / -1'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <MapPin size={18} color="#64748b" />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Venue</span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                        {selectedEvent.venue}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                {selectedEvent.description && (
                  <div style={{ marginBottom: 24, animation: 'slideUp 0.5s ease 0.4s both' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase' }}>About This Event</h4>
                    <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.8, margin: 0 }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Additional Info */}
                <div style={{ 
                  display: 'flex', flexWrap: 'wrap', gap: 10, 
                  padding: '16px 0', borderTop: '1px solid #f1f5f9',
                  animation: 'slideUp 0.5s ease 0.5s both'
                }}>
                  {selectedEvent.class && selectedEvent.class !== 'All' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '8px 14px', borderRadius: 10 }}>
                      📚 {selectedEvent.class}{selectedEvent.section && selectedEvent.section !== 'All' ? ` - ${selectedEvent.section}` : ''}
                    </span>
                  )}
                  {selectedEvent.branch && selectedEvent.branch !== 'All' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '8px 14px', borderRadius: 10 }}>
                      🏫 {selectedEvent.branch}
                    </span>
                  )}
                  {selectedEvent.visibility && !selectedEvent.visibility.includes('All') && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#64748b', background: '#f8fafc', padding: '8px 14px', borderRadius: 10 }}>
                      <Users size={14} /> {selectedEvent.visibility.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  onClick={closeEvent}
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                    background: getTypeStyle(selectedEvent.eventType).gradient,
                    color: 'white', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                    transition: 'transform 0.3s, box-shadow 0.3s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(102,126,234,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
        
        .card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
      `}</style>
    </AppLayout>
  );
}