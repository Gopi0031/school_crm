// src/app/branch-admin/attendance/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Download, Printer, Eye, FileDown, Loader, RefreshCw, Calendar } from 'lucide-react';
import { CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

function buildCalendar(monthlyAtt, dateStr) {
  const [y, m] = dateStr.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0).getDate();
  const startDow = firstDay.getDay();
  const attMap = {};
  monthlyAtt.forEach(a => { attMap[parseInt(a.date.split('-')[2])] = a.status; });
  const weeks = [];
  let week = Array(startDow).fill(null);
  for (let d = 1; d <= lastDay; d++) {
    week.push({ day: d, status: attMap[d] || null });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }
  return { weeks, present: monthlyAtt.filter(a => a.status === 'Present').length, absent: monthlyAtt.filter(a => a.status === 'Absent').length, total: monthlyAtt.length };
}

export default function BranchAdminAttendance() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [students, setStudents]   = useState([]);
  const [attMap, setAttMap]       = useState({});
  const [loading, setLoading]     = useState(true);
  const [cls, setCls]             = useState('');
  const [sec, setSec]             = useState('');
  const [date, setDate]           = useState(today);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [selected, setSelected]   = useState(null);
  const [monthlyAtt, setMonthlyAtt] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [exporting, setExporting] = useState(false);
  const perPage = 10;

  const load = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const params = new URLSearchParams({ branch: user.branch || '' });
      if (cls) params.set('class', cls);
      if (sec) params.set('section', sec);

      const attParams = new URLSearchParams({
        entityType: 'student',
        date,
        branch: user.branch || '',
      });
      if (cls) attParams.set('class', cls);
      if (sec) attParams.set('section', sec);

      const [sRes, aRes] = await Promise.all([
        fetch(`/api/students?${params}`),
        fetch(`/api/attendance?${attParams}`),
      ]);
      const [sData, aData] = await Promise.all([sRes.json(), aRes.json()]);

      if (sData.success) setStudents(sData.data);
      if (aData.success) {
        const map = {};
        aData.data.forEach(a => { map[String(a.entityId)] = a.status; });
        setAttMap(map);
      }
    } catch (err) {
      console.error('❌ Load error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, cls, sec, date]);

  const loadMonthly = async (studentId) => {
    setLoadingMonthly(true);
    const month = date.slice(0, 7);
    try {
      const res = await fetch(`/api/attendance/monthly?entityId=${studentId}&month=${month}`);
      const data = await res.json();
      if (data.success) setMonthlyAtt(data.data);
    } catch (err) {
      console.error('❌ Monthly load error:', err);
    }
    setLoadingMonthly(false);
  };

  const filtered = useMemo(() => students.filter(st =>
    !search || st.name?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPresent = filtered.filter(st => attMap[String(st._id || st.id)] === 'Present').length;
  const totalAbsent = filtered.length - totalPresent;
  const attPct = filtered.length ? Math.round(totalPresent / filtered.length * 100) : 0;

  const chartData = useMemo(() => {
    const map = {};
    students.forEach(st => {
      if (!map[st.class]) map[st.class] = { class: st.class, present: 0, absent: 0 };
      const status = attMap[String(st._id || st.id)];
      if (status === 'Present') map[st.class].present++;
      else map[st.class].absent++;
    });
    return Object.values(map).sort((a, b) => {
      const n = x => parseInt(x.class?.replace('Class ', '') || 0);
      return n(a) - n(b);
    });
  }, [students, attMap]);

  const exportPDF = () => {
    setExporting(true);
    const rows = filtered.map((st, i) => {
      const status = attMap[String(st._id || st.id)] || 'N/A';
      return `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
          <td>${i + 1}</td>
          <td style="font-weight:700;color:#4f46e5">${st.rollNo}</td>
          <td style="font-weight:600">${st.name}</td>
          <td>${st.class} — ${st.section}</td>
          <td>${st.parentName || '—'}</td>
          <td>${st.phone || '—'}</td>
          <td><span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;
            background:${status === 'Present' ? '#dcfce7' : status === 'Absent' ? '#fee2e2' : '#f1f5f9'};
            color:${status === 'Present' ? '#16a34a' : status === 'Absent' ? '#dc2626' : '#94a3b8'}">${status}</span></td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Attendance — ${user?.branch} — ${date}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;color:#1e293b}
        .top{background:linear-gradient(135deg,#1e40af,#4f46e5);color:white;padding:20px 28px;border-radius:12px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center}
        .school{font-size:20px;font-weight:800}.sub{font-size:12px;opacity:0.85;margin-top:4px}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
        .stat{padding:14px;border-radius:10px;text-align:center}
        .sv{font-size:22px;font-weight:800}.sl{font-size:11px;margin-top:3px;opacity:0.75}
        table{width:100%;border-collapse:collapse;font-size:12px}
        thead tr{background:#1e40af}
        th{padding:9px 10px;text-align:left;color:white;font-size:11px;font-weight:700}
        td{padding:8px 10px;border-bottom:1px solid #e2e8f0}
        @media print{.top,.stat{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body>
      <div class="top">
        <div>
          <div class="school">📚 SchoolERP — Attendance Report</div>
          <div class="sub">${user?.branch} • ${cls || 'All Classes'} ${sec ? '— Sec ' + sec : ''} • Date: ${date}</div>
        </div>
        <div style="text-align:right;font-size:12px;opacity:0.9">
          <div>Generated: ${new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}</div>
        </div>
      </div>
      <div class="stats">
        <div class="stat" style="background:#eff6ff;border-left:4px solid #4f46e5"><div class="sv" style="color:#4f46e5">${filtered.length}</div><div class="sl" style="color:#4f46e5">Total Students</div></div>
        <div class="stat" style="background:#f0fdf4;border-left:4px solid #10b981"><div class="sv" style="color:#10b981">${totalPresent}</div><div class="sl" style="color:#10b981">Present</div></div>
        <div class="stat" style="background:#fff5f5;border-left:4px solid #ef4444"><div class="sv" style="color:#ef4444">${totalAbsent}</div><div class="sl" style="color:#ef4444">Absent</div></div>
        <div class="stat" style="background:#fffbeb;border-left:4px solid #f59e0b"><div class="sv" style="color:#f59e0b">${attPct}%</div><div class="sl" style="color:#f59e0b">Today's Rate</div></div>
      </div>
      <table><thead><tr><th>S.No</th><th>Roll No</th><th>Student Name</th><th>Class</th><th>Parent</th><th>Phone</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); setExporting(false); }, 500);
  };

  return (
    <AppLayout requiredRole="branch-admin">
      <PageHeader title="Attendance" subtitle={`${user?.branch} — ${date}`}>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button className="btn btn-outline" onClick={exportPDF} disabled={exporting || students.length === 0}>
          {exporting ? <Loader size={14} className="animate-spin" /> : <FileDown size={14} />}
          {exporting ? 'Preparing...' : 'Export PDF'}
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { title: 'Total Students', value: filtered.length, color: '#4f46e5' },
          { title: 'Present', value: totalPresent, color: '#10b981' },
          { title: 'Absent', value: totalAbsent, color: '#ef4444' },
          { title: "Today's Rate", value: `${attPct}%`, color: '#f59e0b' },
        ].map(({ title, value, color }) => (
          <div key={title} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${color}`, padding: 16 }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>{title}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Class-wise Attendance</h3>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} onClick={e => e?.activePayload && setCls(e.activePayload[0]?.payload?.class)}>
              <XAxis dataKey="class" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[3,3,0,0]} />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" value={cls} onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select" value={sec} onChange={e => { setSec(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input className="input" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} style={{ maxWidth: 160 }} />
          <input className="input" placeholder="Search student name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, maxWidth: 260 }} />
          <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#94a3b8' }}>
            {filtered.length} students
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Student Name</th>
              <th>Class</th>
              <th>Section</th>
              <th>Phone</th>
              <th>Today ({date})</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>Loading...</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={7}><EmptyState message="No records found" /></td>
              </tr>
            ) : paginated.map((st, i) => {
              const studentId = String(st._id || st.id);
              const status = attMap[studentId] || 'N/A';
              
              return (
                <tr key={studentId}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{(page - 1) * perPage + i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        flexShrink: 0, 
                        background: status === 'Present' ? '#10b981' : status === 'Absent' ? '#ef4444' : '#cbd5e1' 
                      }} />
                      <span style={{ fontWeight: 600 }}>{st.name}</span>
                    </div>
                  </td>
                  <td>{st.class}</td>
                  <td>{st.section}</td>
                  <td style={{ color: '#64748b' }}>{st.phone}</td>
                  <td>
                    <span style={{ 
                      padding: '3px 10px', 
                      borderRadius: 20, 
                      fontSize: '0.73rem', 
                      fontWeight: 700,
                      background: status === 'Present' ? '#dcfce7' : status === 'Absent' ? '#fee2e2' : '#f1f5f9',
                      color: status === 'Present' ? '#16a34a' : status === 'Absent' ? '#dc2626' : '#94a3b8' 
                    }}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        onClick={async () => { setSelected({ ...st, showMonthly: true }); await loadMonthly(studentId); }}>
                        <Calendar size={11} />
                      </button>
                      <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        onClick={() => setSelected({ ...st, showMonthly: false })}>
                        <Eye size={11} />
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
      {selected && !selected.showMonthly && (
        <Modal open onClose={() => setSelected(null)} title={selected.name} size="md">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 16 }}>
            {[
              ['Roll No', selected.rollNo],
              ['Class', `${selected.class} — ${selected.section}`],
              ['Parent', selected.parentName],
              ['Phone', selected.phone],
              ['Today', attMap[String(selected._id || selected.id)] || 'N/A'],
              ['Academic Yr', selected.academicYear || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Monthly Calendar Modal */}
      {selected?.showMonthly && (() => {
        const calData = buildCalendar(monthlyAtt, `${date.slice(0, 7)}-01`);
        const [mYear, mMonth] = date.slice(0, 7).split('-').map(Number);
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        return (
          <Modal open onClose={() => { setSelected(null); setMonthlyAtt([]); }}
            title={`Monthly — ${selected.name}`} size="md">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                  {months[mMonth - 1]} {mYear}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {selected.rollNo} • {selected.class} — {selected.section}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <CheckCircle size={14} color="#16a34a" />
                <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.85rem' }}>{calData.present} Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                <XCircle size={14} color="#dc2626" />
                <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.85rem' }}>{calData.absent} Absent</span>
              </div>
            </div>

            {loadingMonthly ? (
              <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
            ) : calData.total === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No records for this month</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                  {weekDays.map((d, i) => (
                    <div key={d} style={{ textAlign: 'center', padding: '6px 0', fontSize: '0.7rem', fontWeight: 700, color: i === 0 || i === 6 ? '#ef4444' : '#64748b' }}>{d}</div>
                  ))}
                </div>
                {calData.weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
                    {week.map((cell, ci) => {
                      if (!cell) return <div key={ci} style={{ aspectRatio: '1', minHeight: 44 }} />;
                      const { day, status } = cell;
                      let bg = '#f8fafc', border = '#e2e8f0', color = '#94a3b8', label = '';
                      if (status === 'Present') { bg = '#dcfce7'; border = '#86efac'; color = '#16a34a'; label = 'P'; }
                      else if (status === 'Absent') { bg = '#fee2e2'; border = '#fca5a5'; color = '#dc2626'; label = 'A'; }
                      return (
                        <div key={ci} style={{ aspectRatio: '1', minHeight: 44, background: bg, border: `2px solid ${border}`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color, lineHeight: 1 }}>{day}</div>
                          {label && <div style={{ fontSize: '0.6rem', fontWeight: 800, color, marginTop: 2 }}>{label}</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button className="btn btn-outline" onClick={() => { setSelected(null); setMonthlyAtt([]); }}>Close</button>
            </div>
          </Modal>
        );
      })()}

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AppLayout>
  );
}