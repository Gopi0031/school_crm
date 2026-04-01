'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { 
  Calendar, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle,
  ChevronLeft, ChevronRight, CalendarDays
} from 'lucide-react';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  // Format month for API: "2025-01"
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch student data
  useEffect(() => {
    if (!user) return;
    
    const fetchStudent = async () => {
      try {
        const id = user.studentId || user.id || user._id;
        
        if (!id) {
          setError('Student ID not found. Please re-login.');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching student:', id);

        let res = await fetch(`/api/students/${id}`);
        let data = await res.json();
        
        if (!res.ok || !data.success) {
          const params = new URLSearchParams();
          if (user.studentId) params.set('studentId', user.studentId);
          if (user.username)  params.set('username', user.username);
          if (user.id)        params.set('userId', user.id);
          
          res = await fetch(`/api/students/profile?${params}`);
          data = await res.json();
        }
        
        if (data.success && data.data) {
          console.log('✅ Student loaded:', data.data.name);
          setStudent(data.data);
          setError(null);
        } else {
          setError(data.error || 'Student not found');
        }
      } catch (err) {
        console.error('❌ Fetch student error:', err);
        setError('Network error');
      }
      setLoading(false);
    };

    fetchStudent();
  }, [user]);

  // Fetch attendance records
  useEffect(() => {
    const studentId = student?.id || student?._id;
    if (!studentId) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        console.log('📋 Fetching attendance for:', studentId, monthStr);
        
        const res = await fetch(
          `/api/attendance?entityId=${studentId}&month=${monthStr}`
        );
        const data = await res.json();
        
        console.log('📥 Attendance response:', data.success, data.data?.length);
        
        if (data.success && Array.isArray(data.data)) {
          const sorted = data.data.sort((a, b) => 
            new Date(a.date) - new Date(b.date)
          );
          setAttendance(sorted);
        } else {
          setAttendance([]);
        }
      } catch (err) {
        console.error('❌ Fetch attendance error:', err);
        setAttendance([]);
      }
      setLoading(false);
    };

    fetchAttendance();
  }, [student?.id, student?._id, monthStr]);

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    const map = {};
    attendance.forEach(a => {
      // Extract day from date string (e.g., "2025-01-15" -> 15)
      const day = parseInt(a.date.split('-')[2]);
      map[day] = a.status;
    });
    return map;
  }, [attendance]);

  // Generate calendar data
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const currentDay = today.getDate();

    const weeks = [];
    let currentWeek = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push({ day: null, status: null });
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const status = attendanceMap[day] || null;
      const isToday = isCurrentMonth && day === currentDay;
      const isFuture = isCurrentMonth && day > currentDay;
      const dayOfWeek = (startingDayOfWeek + day - 1) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      currentWeek.push({
        day,
        status,
        isToday,
        isFuture,
        isWeekend,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Add empty cells for remaining days
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({ day: null, status: null });
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [year, month, attendanceMap]);

  // Calculate stats
  const present = attendance.filter(a => a.status === 'Present').length;
  const absent = attendance.filter(a => a.status === 'Absent').length;
  const total = attendance.length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  const overallPresent = student?.presentDays || present;
  const overallTotal = student?.totalWorkingDays || total;
  const overallPct = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : percentage;

  // Navigation
  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    const today = new Date();
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    // Don't allow going beyond current month
    if (nextYear > today.getFullYear() || 
        (nextYear === today.getFullYear() && nextMonth > today.getMonth())) {
      return;
    }
    
    setMonth(nextMonth);
    if (month === 11) setYear(year + 1);
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };

  const refetch = () => {
    setLoading(true);
    const studentId = student?.id || student?._id;
    if (studentId) {
      fetch(`/api/attendance?entityId=${studentId}&month=${monthStr}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setAttendance(d.data.sort((a, b) => new Date(a.date) - new Date(b.date)));
          }
        })
        .finally(() => setLoading(false));
    }
  };

  // Check if we can go to next month
  const today = new Date();
  const canGoNext = !(year === today.getFullYear() && month === today.getMonth());
  const isCurrentMonthSelected = year === today.getFullYear() && month === today.getMonth();

  // Error state
  if (error) {
    return (
      <AppLayout requiredRole="student">
        <PageHeader title="Attendance" subtitle="Your attendance records" />
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#ef4444', marginBottom: 8 }}>{error}</h3>
          <p style={{ color: '#64748b', marginBottom: 16 }}>Please contact your branch admin.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="Attendance" subtitle={student?.name || 'Loading...'}>
        <button className="btn btn-outline" onClick={refetch} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      {/* Student Info Banner */}
      {student && (
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: 14,
          padding: '18px 24px',
          marginBottom: 20,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{student.name}</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: 4 }}>
              {student.rollNo} • {student.class} — {student.section}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.75, marginBottom: 4 }}>Overall Attendance</div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 900,
              lineHeight: 1,
              color: overallPct >= 75 ? '#a7f3d0' : '#fcd34d'
            }}>
              {overallPct}%
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.75, marginTop: 4 }}>
              {overallPresent} / {overallTotal} days
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 12, 
        marginBottom: 20 
      }} className="stats-grid">
        {[
          { label: 'Present', value: present, color: '#10b981', bg: '#ecfdf5', icon: CheckCircle },
          { label: 'Absent', value: absent, color: '#ef4444', bg: '#fef2f2', icon: XCircle },
          { label: 'Total Days', value: total, color: '#6366f1', bg: '#eef2ff', icon: CalendarDays },
          { label: 'This Month', value: `${percentage}%`, color: percentage >= 75 ? '#10b981' : '#f59e0b', bg: percentage >= 75 ? '#ecfdf5' : '#fffbeb', icon: Clock },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div 
            key={label} 
            className="card" 
            style={{ 
              textAlign: 'center', 
              padding: '16px 12px',
              background: bg,
              border: `1px solid ${color}20`,
            }}
          >
            <Icon size={22} color={color} style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Calendar Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Calendar Header */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={goToPreviousMonth}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              <ChevronLeft size={18} color="#64748b" />
            </button>
            
            <div style={{ minWidth: 160, textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
                {months[month]} {year}
              </div>
              {isCurrentMonthSelected && (
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, marginTop: 2 }}>
                  Current Month
                </div>
              )}
            </div>
            
            <button
              onClick={goToNextMonth}
              disabled={!canGoNext}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: canGoNext ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canGoNext ? 1 : 0.4,
                transition: 'all 0.2s',
              }}
              onMouseOver={e => canGoNext && (e.currentTarget.style.background = '#f1f5f9')}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              <ChevronRight size={18} color="#64748b" />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isCurrentMonthSelected && (
              <button
                onClick={goToCurrentMonth}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              >
                Today
              </button>
            )}
            <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setViewMode('calendar')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'calendar' ? '#4f46e5' : 'white',
                  color: viewMode === 'calendar' ? 'white' : '#64748b',
                }}
              >
                <Calendar size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  borderLeft: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  background: viewMode === 'list' ? '#4f46e5' : 'white',
                  color: viewMode === 'list' ? 'white' : '#64748b',
                }}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div style={{ padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                border: '3px solid #e2e8f0', 
                borderTopColor: '#7c3aed', 
                borderRadius: '50%', 
                animation: 'spin 0.7s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>Loading attendance...</p>
            </div>
          ) : viewMode === 'calendar' ? (
            <>
              {/* Weekday Headers */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: 4,
                marginBottom: 8,
              }}>
                {weekDays.map((day, i) => (
                  <div 
                    key={day} 
                    style={{ 
                      textAlign: 'center', 
                      padding: '8px 4px',
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: i === 0 || i === 6 ? '#ef4444' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {calendarData.map((week, weekIndex) => (
                  <div 
                    key={weekIndex} 
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, 1fr)', 
                      gap: 4 
                    }}
                  >
                    {week.map((dayData, dayIndex) => {
                      if (dayData.day === null) {
                        return <div key={dayIndex} style={{ aspectRatio: '1', minHeight: 50 }} />;
                      }

                      const { day, status, isToday, isFuture, isWeekend } = dayData;

                      // Determine styles based on status
                      let bgColor = '#f8fafc';
                      let borderColor = '#e2e8f0';
                      let textColor = '#64748b';
                      let statusIcon = null;
                      let statusLabel = '';

                      if (status === 'Present') {
                        bgColor = '#dcfce7';
                        borderColor = '#86efac';
                        textColor = '#16a34a';
                        statusIcon = <CheckCircle size={14} color="#16a34a" />;
                        statusLabel = 'P';
                      } else if (status === 'Absent') {
                        bgColor = '#fee2e2';
                        borderColor = '#fca5a5';
                        textColor = '#dc2626';
                        statusIcon = <XCircle size={14} color="#dc2626" />;
                        statusLabel = 'A';
                      } else if (isFuture) {
                        bgColor = '#f1f5f9';
                        textColor = '#cbd5e1';
                      } else if (isWeekend && !status) {
                        bgColor = '#fef3c7';
                        borderColor = '#fde68a';
                        textColor = '#d97706';
                      }

                      return (
                        <div
                          key={dayIndex}
                          style={{
                            aspectRatio: '1',
                            minHeight: 50,
                            background: bgColor,
                            border: `2px solid ${isToday ? '#4f46e5' : borderColor}`,
                            borderRadius: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.2s',
                            cursor: status ? 'default' : 'default',
                            boxShadow: isToday ? '0 0 0 2px #4f46e520' : 'none',
                          }}
                        >
                          {/* Today indicator */}
                          {isToday && (
                            <div style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 6,
                              height: 6,
                              background: '#4f46e5',
                              borderRadius: '50%',
                            }} />
                          )}

                          {/* Day number */}
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: textColor,
                            lineHeight: 1,
                          }}>
                            {day}
                          </div>

                          {/* Status indicator */}
                          {status && (
                            <div style={{
                              marginTop: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}>
                              {statusIcon}
                            </div>
                          )}

                          {/* Weekend label for days without attendance */}
                          {isWeekend && !status && !isFuture && (
                            <div style={{
                              fontSize: '0.55rem',
                              fontWeight: 600,
                              color: '#d97706',
                              marginTop: 2,
                            }}>
                              OFF
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid #f1f5f9',
                justifyContent: 'center',
              }}>
                {[
                  { label: 'Present', color: '#16a34a', bg: '#dcfce7', border: '#86efac' },
                  { label: 'Absent', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
                  { label: 'Weekend/Holiday', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
                  { label: 'Not Marked', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
                  { label: 'Today', color: '#4f46e5', bg: 'white', border: '#4f46e5' },
                ].map(({ label, color, bg, border }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 18,
                      height: 18,
                      background: bg,
                      border: `2px solid ${border}`,
                      borderRadius: 4,
                    }} />
                    <span style={{ fontSize: '0.75rem', color, fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // List View
            <div>
              {attendance.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p>No attendance records found for {months[month]} {year}</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 8 }}>
                    Attendance will appear here once marked by your teacher.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {attendance.map((a, i) => {
                    const isPresent = a.status === 'Present';
                    const dateObj = new Date(a.date);

                    return (
                      <div
                        key={a.id || a._id || i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: isPresent ? '#f0fdf4' : '#fef2f2',
                          border: `1px solid ${isPresent ? '#bbf7d0' : '#fecaca'}`,
                          borderRadius: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 44,
                            height: 44,
                            background: isPresent ? '#dcfce7' : '#fee2e2',
                            borderRadius: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <div style={{
                              fontSize: '1.1rem',
                              fontWeight: 800,
                              color: isPresent ? '#16a34a' : '#dc2626',
                              lineHeight: 1,
                            }}>
                              {dateObj.getDate()}
                            </div>
                            <div style={{
                              fontSize: '0.55rem',
                              fontWeight: 600,
                              color: isPresent ? '#16a34a' : '#dc2626',
                              textTransform: 'uppercase',
                            }}>
                              {dateObj.toLocaleDateString('en-IN', { weekday: 'short' })}
                            </div>
                          </div>
                          <div>
                            <div style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: '#1e293b',
                            }}>
                              {dateObj.toLocaleDateString('en-IN', { 
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              marginTop: 2,
                            }}>
                              {a.markedBy ? `Marked by teacher` : 'Class attendance'}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 16px',
                          background: isPresent ? '#dcfce7' : '#fee2e2',
                          borderRadius: 20,
                        }}>
                          {isPresent ? (
                            <CheckCircle size={16} color="#16a34a" />
                          ) : (
                            <XCircle size={16} color="#dc2626" />
                          )}
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: isPresent ? '#16a34a' : '#dc2626',
                          }}>
                            {a.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Summary */}
      {!loading && attendance.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem', color: '#1e293b' }}>
            📊 {months[month]} Summary
          </h3>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.85rem', 
                marginBottom: 8 
              }}>
                <span style={{ color: '#64748b' }}>Attendance Rate</span>
                <span style={{ 
                  fontWeight: 700, 
                  color: percentage >= 75 ? '#16a34a' : '#f59e0b' 
                }}>
                  {percentage}%
                </span>
              </div>
              <div style={{ 
                height: 10, 
                background: '#f1f5f9', 
                borderRadius: 99, 
                overflow: 'hidden' 
              }}>
                <div style={{
                  height: '100%',
                  width: `${percentage}%`,
                  background: percentage >= 75 
                    ? 'linear-gradient(90deg, #10b981, #34d399)' 
                    : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  borderRadius: 99,
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: 16,
              alignItems: 'center',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>{present}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Present</div>
              </div>
              <div style={{ width: 1, height: 30, background: '#e2e8f0' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444' }}>{absent}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Absent</div>
              </div>
              <div style={{ width: 1, height: 30, background: '#e2e8f0' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#6366f1' }}>{total}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total Days</div>
              </div>
            </div>
          </div>

          {/* Warning if below 75% */}
          {percentage > 0 && percentage < 75 && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#fef3c7',
              border: '1px solid #fde68a',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <AlertCircle size={18} color="#d97706" />
              <div>
                <div style={{ fontWeight: 600, color: '#92400e', fontSize: '0.85rem' }}>
                  Low Attendance Warning
                </div>
                <div style={{ fontSize: '0.75rem', color: '#a16207' }}>
                  Your attendance is below 75%. Please maintain regular attendance.
                </div>
              </div>
            </div>
          )}

          {/* Congratulations if 100% */}
          {percentage === 100 && (
            <div style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <CheckCircle size={18} color="#10b981" />
              <div>
                <div style={{ fontWeight: 600, color: '#065f46', fontSize: '0.85rem' }}>
                  🎉 Perfect Attendance!
                </div>
                <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                  Congratulations! You have 100% attendance this month.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}