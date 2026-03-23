'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Search, Calendar, FileDown, Loader, Lock } from 'lucide-react';

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
  const [exporting, setExporting] = useState(false);
  const perPage = 10;

  // ✅ Get teacher's assigned class and section
  const teacherClass = user?.assignedClass || user?.class || '';
  const teacherSection = user?.section || '';

  const load = async () => {
    if (!teacherClass || !teacherSection) {
      console.log('[Attendance] Teacher class/section not found:', { teacherClass, teacherSection });
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ 
      branch: user?.branch || '',
      class: teacherClass,
      section: teacherSection
    });

    console.log('[Attendance] Loading students for:', { 
      branch: user?.branch, 
      class: teacherClass, 
      section: teacherSection 
    });

    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`/api/students?${params}`),
        fetch(`/api/attendance?entityType=student&date=${date}&branch=${user?.branch||''}&class=${teacherClass}&section=${teacherSection}`),
      ]);
      const [sData, aData] = await Promise.all([sRes.json(), aRes.json()]);

      if (sData.success) {
        console.log('[Attendance] Loaded students:', sData.data.length);
        setStudents(sData.data);
      }
      if (aData.success) {
        const map = {};
        aData.data.forEach(a => { map[String(a.entityId)] = a.status; });
        setAttMap(map);
      }
    } catch (err) {
      console.error('[Attendance] Load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { 
    if (user && (teacherClass || teacherSection)) {
      load(); 
    }
  }, [user, teacherClass, teacherSection, date]);

  const loadMonthly = async (studentId) => {
    setLoadingMonthly(true);
    const month = date.slice(0, 7);
    const r = await fetch(`/api/attendance/monthly?entityId=${studentId}&month=${month}`);
    const d = await r.json();
    if (d.success) setMonthlyAtt(d.data);
    setLoadingMonthly(false);
  };

  const filtered = useMemo(() => students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const getStudentAttPct = (s) =>
    s.totalWorkingDays ? Math.round(s.presentDays / s.totalWorkingDays * 100) : 0;

  const presentCount = Object.values(attMap).filter(v => v === 'Present').length;
  const absentCount = students.length - presentCount;
  const attPct = students.length ? Math.round(presentCount / students.length * 100) : 0;

  const exportPDF = () => {
    setExporting(true);
    const rows = filtered.map((s, i) => {
      const status = attMap[String(s._id)] || 'N/A';
      const pct = getStudentAttPct(s);
      const statusColor = status === 'Present' ? '#16a34a' : status === 'Absent' ? '#dc2626' : '#94a3b8';
      const pctColor = pct >= 75 ? '#16a34a' : '#f59e0b';
      return `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#94a3b8">${i + 1}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#4f46e5">${s.rollNo}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:600">${s.name}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">${s.parentName || '—'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#64748b">${s.phone || '—'}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0">
            <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${status === 'Present' ? '#dcfce7' : status === 'Absent' ? '#fee2e2' : '#f1f5f9'};color:${statusColor}">${status}</span>
          </td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#10b981">${s.presentDays || 0}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;color:${pctColor}">${pct}%</td>
        </tr>`;
    }).join('');

    const html = `
      <!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Attendance Report — ${teacherClass} ${teacherSection} — ${date}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background:#fff; color:#1e293b; padding:32px; }
        .top-bar { background: linear-gradient(135deg, #4f46e5, #7c3aed); color:white; padding:20px 28px; border-radius:12px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; }
        .school-name { font-size:20px; font-weight:800; letter-spacing:-0.3px; }
        .report-title { font-size:13px; opacity:0.85; margin-top:4px; }
        .top-right { text-align:right; font-size:12px; opacity:0.9; line-height:1.8; }
        .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
        .stat { padding:14px 16px; border-radius:10px; text-align:center; }
        .stat-val { font-size:22px; font-weight:800; }
        .stat-lbl { font-size:11px; margin-top:3px; opacity:0.75; }
        table { width:100%; border-collapse:collapse; font-size:12.5px; }
        thead tr { background:#4f46e5; }
        thead th { padding:10px 10px; text-align:left; color:white; font-size:11px; font-weight:700; letter-spacing:0.03em; }
        .footer { margin-top:24px; padding-top:14px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:10.5px; color:#94a3b8; }
        @media print {
          body { padding:16px; }
          .top-bar { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          thead tr { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          .stat { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        }
      </style></head>
      <body>
        <div class="top-bar">
          <div>
            <div class="school-name">📚 SchoolERP — Attendance Report</div>
            <div class="report-title">${user?.branch} &nbsp;•&nbsp; ${teacherClass} — Section ${teacherSection} &nbsp;•&nbsp; Date: ${date}</div>
          </div>
          <div class="top-right">
            <div>Teacher: <b>${user?.name}</b></div>
            <div>Generated: ${new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}</div>
          </div>
        </div>
        <div class="stats">
          <div class="stat" style="background:#eff6ff;border-left:4px solid #4f46e5">
            <div class="stat-val" style="color:#4f46e5">${students.length}</div>
            <div class="stat-lbl" style="color:#4f46e5">Total Students</div>
          </div>
          <div class="stat" style="background:#f0fdf4;border-left:4px solid #10b981">
            <div class="stat-val" style="color:#10b981">${presentCount}</div>
            <div class="stat-lbl" style="color:#10b981">Present Today</div>
          </div>
          <div class="stat" style="background:#fff5f5;border-left:4px solid #ef4444">
            <div class="stat-val" style="color:#ef4444">${absentCount}</div>
            <div class="stat-lbl" style="color:#ef4444">Absent Today</div>
          </div>
          <div class="stat" style="background:#fffbeb;border-left:4px solid #f59e0b">
            <div class="stat-val" style="color:#f59e0b">${attPct}%</div>
            <div class="stat-lbl" style="color:#f59e0b">Attendance %</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:40px">S.No</th><th>Roll No</th><th>Student Name</th>
              <th>Parent Name</th><th>Phone</th><th>Today</th><th>Present Days</th><th>Overall %</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          <span>SchoolERP &nbsp;•&nbsp; ${user?.branch} &nbsp;•&nbsp; ${teacherClass} — Section ${teacherSection}</span>
          <span>Total Records: ${filtered.length} &nbsp;•&nbsp; Printed on ${new Date().toLocaleString('en-IN')}</span>
        </div>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); setExporting(false); }, 500);
  };

  // ✅ Show message if teacher has no assigned class
  if (!loading && (!teacherClass || !teacherSection)) {
    return (
      <AppLayout requiredRole="teacher-admin">
        <PageHeader title="Attendance" subtitle="View and manage student attendance" />
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={28} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
            No Class Assigned
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto' }}>
            You are not assigned as a class teacher yet. Please contact your branch administrator to assign you a class.
          </p>
          <div style={{ marginTop: 16, padding: '12px 20px', background: '#f8fafc', borderRadius: 10, display: 'inline-block' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Your Account</div>
            <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 4 }}>{user?.name}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user?.branch}</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout requiredRole="teacher-admin">
      <PageHeader title="Attendance" subtitle={`${teacherClass} — Section ${teacherSection}`}>
        <button
          className="btn btn-primary"
          onClick={exportPDF}
          disabled={exporting || students.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 130, justifyContent: 'center' }}
        >
          {exporting
            ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Preparing...</>
            : <><FileDown size={14} /> Export PDF</>}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
      </PageHeader>

      {/* ── Class Info Banner ─────────────────────────────── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
        borderRadius: 12, 
        padding: '14px 20px', 
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Class Teacher For</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{teacherClass} — Section {teacherSection}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>{user?.branch}</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name}</div>
        </div>
      </div>

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'Total Students', v: students.length, c: '#4f46e5' },
          { l: 'Present Today', v: presentCount, c: '#10b981' },
          { l: 'Absent Today', v: absentCount, c: '#ef4444' },
          { l: 'Attendance %', v: `${attPct}%`, c: '#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}`, padding: 14 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── Filters (Date and Search only - no class/section) ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input" type="date" value={date} max={today}
            onChange={e => setDate(e.target.value)}
            style={{ maxWidth: 160 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, maxWidth: 260, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 12px' }}>
            <Search size={14} color="#94a3b8" />
            <input
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.83rem', flex: 1 }}
              placeholder="Search name or roll no..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {filtered.length} students
          </span>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="card">
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Roll No</th>
              <th>Status</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Today</th>
              <th>Overall %</th>
              <th>Monthly</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan={9} style={{ textAlign: 'center', padding: 52 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>Loading students...</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={9}><EmptyState message="No students found" /></td>
              </tr>
            ) : paginated.map((s, i) => {
              const todayStatus = attMap[String(s._id)] || attMap[String(s.id)] || 'N/A';
              const pct = getStudentAttPct(s);
              return (
                <tr key={s._id || s.id || `student-${i}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{(page - 1) * perPage + i + 1}</td>
                  <td style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.83rem' }}>{s.rollNo}</td>
                  <td><Badge>{s.status || 'Active'}</Badge></td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{s.gender}</div>
                  </td>
                  <td style={{ fontSize: '0.83rem', color: '#64748b' }}>{s.class} — {s.section}</td>
                  <td>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700,
                      background: todayStatus === 'Present' ? '#dcfce7' : todayStatus === 'Absent' ? '#fee2e2' : '#f1f5f9',
                      color: todayStatus === 'Present' ? '#16a34a' : todayStatus === 'Absent' ? '#dc2626' : '#94a3b8',
                    }}>
                      {todayStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 52, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct >= 75 ? '#10b981' : '#f59e0b' }}>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={async () => { setViewStudent({ ...s, showMonthly: true }); await loadMonthly(s._id || s.id); }}>
                      <Calendar size={11} /> Monthly
                    </button>
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => setViewStudent({ ...s, showMonthly: false })}>
                      <Eye size={11} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
      </div>

      {/* ── Student Detail Modal ──────────────────────────── */}
      {viewStudent && !viewStudent.showMonthly && (
        <Modal open onClose={() => setViewStudent(null)} title={viewStudent.name} size="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg,#eff6ff,#e0f2fe)', borderRadius: 10, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>
              {viewStudent.name?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{viewStudent.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{viewStudent.rollNo} • {viewStudent.class} — {viewStudent.section}</div>
            </div>
            <span style={{
              marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700,
              background: attMap[String(viewStudent._id)] === 'Present' ? '#dcfce7' : '#fee2e2',
              color: attMap[String(viewStudent._id)] === 'Present' ? '#16a34a' : '#dc2626',
            }}>
              {attMap[String(viewStudent._id)] || 'N/A'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { l: 'Present Days', v: viewStudent.presentDays || 0, c: '#10b981' },
              { l: 'Absent Days', v: (viewStudent.totalWorkingDays || 0) - (viewStudent.presentDays || 0), c: '#ef4444' },
              { l: 'Attendance %', v: `${getStudentAttPct(viewStudent)}%`, c: '#4f46e5' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: `${c}12`, borderRadius: 10, padding: 14, textAlign: 'center', borderTop: `3px solid ${c}` }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {[
              ['Total Days', viewStudent.totalWorkingDays || 220],
              ['Today', attMap[String(viewStudent._id)] || 'N/A'],
              ['Parent', viewStudent.parentName],
              ['Phone', viewStudent.phone],
              ['Total Fee', `₹${(viewStudent.totalFee || 0).toLocaleString()}`],
              ['Due Fee', `₹${((viewStudent.totalFee || 0) - (viewStudent.paidFee || 0)).toLocaleString()}`],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 2 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setViewStudent(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Monthly Attendance Modal ──────────────────────── */}
      {viewStudent?.showMonthly && (
        <Modal open onClose={() => setViewStudent(null)} title={`Monthly Attendance — ${viewStudent.name}`} size="md">
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{date.slice(0, 7)} &nbsp;•&nbsp; {viewStudent.class} — {viewStudent.section}</span>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                <span style={{ width: 11, height: 11, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 3, display: 'inline-block' }} />
                Present ({monthlyAtt.filter(a => a.status === 'Present').length})
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}>
                <span style={{ width: 11, height: 11, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 3, display: 'inline-block' }} />
                Absent ({monthlyAtt.filter(a => a.status === 'Absent').length})
              </span>
            </div>
          </div>

          {loadingMonthly ? (
            <div style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
              <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>Loading...</span>
            </div>
          ) : monthlyAtt.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, color: '#94a3b8', fontSize: '0.875rem' }}>
              No attendance records found for this month
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 6 }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, paddingBottom: 3 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>
                {monthlyAtt.map((a, idx) => (
                  <div key={a._id || `att-${idx}`} style={{
                    textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                    background: a.status === 'Present' ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${a.status === 'Present' ? '#bbf7d0' : '#fecaca'}`,
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{a.date?.slice(8)}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: a.status === 'Present' ? '#16a34a' : '#dc2626', marginTop: 2 }}>
                      {a.status === 'Present' ? 'P' : 'A'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => setViewStudent(null)}>Close</button>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}