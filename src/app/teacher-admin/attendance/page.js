// src/app/teacher-admin/attendance/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Search, Calendar, FileDown, Loader, Lock, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

function buildCalendar(monthlyAtt, dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0).getDate();
  const startDow = firstDay.getDay();

  const attMap = {};
  monthlyAtt.forEach(a => {
    const day = parseInt(a.date.split('-')[2]);
    attMap[day] = a.status;
  });

  const weeks = [];
  let week = Array(startDow).fill(null);

  for (let d = 1; d <= lastDay; d++) {
    week.push({ day: d, status: attMap[d] || null });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return { weeks, present: monthlyAtt.filter(a => a.status === 'Present').length, absent: monthlyAtt.filter(a => a.status === 'Absent').length, total: monthlyAtt.length };
}

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [students, setStudents] = useState([]);
  const [attMap, setAttMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewStudent, setViewStudent] = useState(null);
  const [monthlyAtt, setMonthlyAtt] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [monthlyMonth, setMonthlyMonth] = useState(date.slice(0, 7));
  const perPage = 10;

  const teacherClass = user?.assignedClass || user?.class || '';
  const teacherSection = user?.section || '';

  const load = async () => {
    if (!teacherClass || !teacherSection) { setLoading(false); return; }
    setLoading(true);

    try {
      const params = new URLSearchParams({
        branch: user?.branch || '',
        class: teacherClass,
        section: teacherSection,
      });

      const [sRes, aRes] = await Promise.all([
        fetch(`/api/students?${params}`),
        fetch(`/api/attendance?entityType=student&date=${date}&branch=${user?.branch || ''}&class=${teacherClass}&section=${teacherSection}`),
      ]);
      const [sData, aData] = await Promise.all([sRes.json(), aRes.json()]);

      if (sData.success) setStudents(sData.data);
      if (aData.success) {
        const map = {};
        aData.data.forEach(a => { map[String(a.entityId)] = a.status; });
        setAttMap(map);
      }
    } catch (err) {
      console.error('Load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { if (user && teacherClass) load(); }, [user, teacherClass, teacherSection, date]);

  const loadMonthly = async (studentId, month) => {
    setLoadingMonthly(true);
    try {
      const res = await fetch(`/api/attendance/monthly?entityId=${studentId}&month=${month}`);
      const data = await res.json();
      if (data.success) setMonthlyAtt(data.data);
      else setMonthlyAtt([]);
    } catch { setMonthlyAtt([]); }
    setLoadingMonthly(false);
  };

  const openMonthly = async (student) => {
    const id = student._id || student.id;
    const m = date.slice(0, 7);
    setViewStudent({ ...student, showMonthly: true });
    setMonthlyMonth(m);
    await loadMonthly(id, m);
  };

  const changeMonthlyMonth = async (direction) => {
    const [y, m] = monthlyMonth.split('-').map(Number);
    let newY = y, newM = m + direction;
    if (newM < 1) { newM = 12; newY--; }
    if (newM > 12) { newM = 1; newY++; }
    const newMonth = `${newY}-${String(newM).padStart(2, '0')}`;

    const todayMonth = today.slice(0, 7);
    if (newMonth > todayMonth) return;

    setMonthlyMonth(newMonth);
    const id = viewStudent._id || viewStudent.id;
    await loadMonthly(id, newMonth);
  };

  const filtered = useMemo(() => students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const presentCount = Object.values(attMap).filter(v => v === 'Present').length;
  const absentCount = students.length - presentCount;
  const attPct = students.length ? Math.round(presentCount / students.length * 100) : 0;

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const calData = viewStudent?.showMonthly ? buildCalendar(monthlyAtt, `${monthlyMonth}-01`) : null;
  const [mYear, mMonth] = monthlyMonth.split('-').map(Number);

  if (!loading && (!teacherClass || !teacherSection)) {
    return (
      <AppLayout requiredRole="teacher-admin">
        <PageHeader title="Attendance" subtitle="View student attendance" />
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Lock size={28} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#1e293b', marginBottom: 8 }}>No Class Assigned</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Contact your branch admin.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout requiredRole="teacher-admin">
      <PageHeader title="Attendance" subtitle={`${teacherClass} — Section ${teacherSection}`}>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </PageHeader>

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius: 12, padding: '14px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Class Teacher For</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{teacherClass} — Section {teacherSection}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{user?.branch}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'Total', v: students.length, c: '#4f46e5' },
          { l: 'Present', v: presentCount, c: '#10b981' },
          { l: 'Absent', v: absentCount, c: '#ef4444' },
          { l: "Today's Rate", v: `${attPct}%`, c: '#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}`, padding: 14 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="input" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} style={{ maxWidth: 160 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, maxWidth: 260, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 12px' }}>
            <Search size={14} color="#94a3b8" />
            <input style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.83rem', flex: 1 }}
              placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto' }}>{filtered.length} students</span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Today ({date})</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="l"><td colSpan={5} style={{ textAlign: 'center', padding: 52 }}>
                <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
                Loading...
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr key="e"><td colSpan={5}><EmptyState message="No students found" /></td></tr>
            ) : paginated.map((s, i) => {
              const sid = String(s._id || s.id);
              const todayStatus = attMap[sid] || 'N/A';
              return (
                <tr key={sid}>
                  <td style={{ color: '#94a3b8' }}>{(page - 1) * perPage + i + 1}</td>
                  <td style={{ fontWeight: 700, color: '#4f46e5' }}>{s.rollNo}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{s.gender}</div>
                  </td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700,
                      background: todayStatus === 'Present' ? '#dcfce7' : todayStatus === 'Absent' ? '#fee2e2' : '#f1f5f9',
                      color: todayStatus === 'Present' ? '#16a34a' : todayStatus === 'Absent' ? '#dc2626' : '#94a3b8',
                    }}>{todayStatus}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        onClick={() => openMonthly(s)}>
                        <Calendar size={11} /> Monthly
                      </button>
                      <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        onClick={() => setViewStudent({ ...s, showMonthly: false })}>
                        <Eye size={11} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
      </div>

      {/* Detail Modal */}
      {viewStudent && !viewStudent.showMonthly && (
        <Modal open onClose={() => setViewStudent(null)} title={viewStudent.name} size="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg,#eff6ff,#e0f2fe)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
              {viewStudent.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{viewStudent.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{viewStudent.rollNo} • {viewStudent.class} — {viewStudent.section}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              ['Roll No', viewStudent.rollNo],
              ['Class', `${viewStudent.class} — ${viewStudent.section}`],
              ['Gender', viewStudent.gender || '—'],
              ['Phone', viewStudent.phone || '—'],
              ['Today\'s Status', attMap[String(viewStudent._id || viewStudent.id)] || 'N/A'],
              ['Parent', viewStudent.parentName || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setViewStudent(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Monthly Calendar Modal */}
      {viewStudent?.showMonthly && (
        <Modal open onClose={() => { setViewStudent(null); setMonthlyAtt([]); }}
          title={`Monthly Attendance — ${viewStudent.name}`} size="md">

          {/* Month navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => changeMonthlyMonth(-1)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} color="#64748b" />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                {months[mMonth - 1]} {mYear}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {viewStudent.rollNo} • {viewStudent.class} — {viewStudent.section}
              </div>
            </div>
            <button onClick={() => changeMonthlyMonth(1)}
              disabled={monthlyMonth >= today.slice(0, 7)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', cursor: monthlyMonth >= today.slice(0, 7) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: monthlyMonth >= today.slice(0, 7) ? 0.4 : 1 }}>
              <ChevronRight size={18} color="#64748b" />
            </button>
          </div>

          {/* Stats row */}
          {calData && (
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <CheckCircle size={14} color="#16a34a" />
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>{calData.present} Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <XCircle size={14} color="#dc2626" />
                <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.85rem' }}>{calData.absent} Absent</span>
              </div>
              <div style={{ padding: '6px 14px', background: '#f1f5f9', borderRadius: 8 }}>
                <span style={{ fontWeight: 700, color: '#6366f1', fontSize: '0.85rem' }}>{calData.total} Days</span>
              </div>
            </div>
          )}

          {loadingMonthly ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
              Loading...
            </div>
          ) : !calData || calData.total === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              <Calendar size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              No attendance records for {months[mMonth - 1]} {mYear}
            </div>
          ) : (
            <>
              {/* Weekday headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                {weekDays.map((d, i) => (
                  <div key={d} style={{ textAlign: 'center', padding: '6px 0', fontSize: '0.7rem', fontWeight: 700, color: i === 0 || i === 6 ? '#ef4444' : '#64748b' }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              {calData.weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                  {week.map((cell, ci) => {
                    if (!cell) return <div key={ci} style={{ aspectRatio: '1', minHeight: 44 }} />;

                    const { day, status } = cell;
                    const todayNum = new Date().getDate();
                    const isToday = monthlyMonth === today.slice(0, 7) && day === todayNum;

                    let bg = '#f8fafc', border = '#e2e8f0', color = '#94a3b8', label = '';
                    if (status === 'Present') { bg = '#dcfce7'; border = '#86efac'; color = '#16a34a'; label = 'P'; }
                    else if (status === 'Absent') { bg = '#fee2e2'; border = '#fca5a5'; color = '#dc2626'; label = 'A'; }

                    return (
                      <div key={ci} style={{
                        aspectRatio: '1', minHeight: 44,
                        background: bg,
                        border: `2px solid ${isToday ? '#4f46e5' : border}`,
                        borderRadius: 8,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        boxShadow: isToday ? '0 0 0 2px #4f46e520' : 'none',
                      }}>
                        {isToday && (
                          <div style={{ position: 'absolute', top: 3, right: 3, width: 5, height: 5, background: '#4f46e5', borderRadius: '50%' }} />
                        )}
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color, lineHeight: 1 }}>{day}</div>
                        {label && (
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, color, marginTop: 2 }}>{label}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Attendance bar */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Monthly Rate</span>
                  <span style={{ fontWeight: 700, color: calData.total > 0 && Math.round(calData.present / calData.total * 100) >= 75 ? '#16a34a' : '#f59e0b' }}>
                    {calData.total > 0 ? Math.round(calData.present / calData.total * 100) : 0}%
                  </span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${calData.total > 0 ? Math.round(calData.present / calData.total * 100) : 0}%`,
                    background: calData.total > 0 && Math.round(calData.present / calData.total * 100) >= 75 ? '#10b981' : '#f59e0b',
                    borderRadius: 99, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
                {[
                  { l: 'Present', bg: '#dcfce7', b: '#86efac', c: '#16a34a' },
                  { l: 'Absent', bg: '#fee2e2', b: '#fca5a5', c: '#dc2626' },
                  { l: 'Not Marked', bg: '#f8fafc', b: '#e2e8f0', c: '#94a3b8' },
                  { l: 'Today', bg: 'white', b: '#4f46e5', c: '#4f46e5' },
                ].map(({ l, bg, b, c }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem' }}>
                    <div style={{ width: 14, height: 14, background: bg, border: `2px solid ${b}`, borderRadius: 3 }} />
                    <span style={{ color: c, fontWeight: 600 }}>{l}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => { setViewStudent(null); setMonthlyAtt([]); }}>Close</button>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AppLayout>
  );
}