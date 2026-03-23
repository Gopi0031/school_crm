'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Download, Printer, Eye, FileDown, Loader } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

export default function BranchAdminAttendance() {
  const { user } = useAuth();
  const today    = new Date().toISOString().split('T')[0];

  const [students,  setStudents]  = useState([]);
  const [attMap,    setAttMap]    = useState({});   // { studentId: 'Present'|'Absent' }
  const [loading,   setLoading]   = useState(true);
  const [cls,       setCls]       = useState('');
  const [sec,       setSec]       = useState('');
  const [date,      setDate]      = useState(today);
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [selected,  setSelected]  = useState(null);
  const [exporting, setExporting] = useState(false);
  const perPage = 10;

  // ── Load students + today's attendance ──────────────────
  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ branch: user.branch || '' });
      if (cls) params.set('class',   cls);
      if (sec) params.set('section', sec);

      const attParams = new URLSearchParams({
        entityType: 'student',
        date,
        branch: user.branch || '',
      });
      if (cls) attParams.set('class',   cls);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user, cls, sec, date]);

  // ── Filter + paginate ────────────────────────────────────
  const filtered = useMemo(() => students.filter(st =>
    !search || st.name?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated   = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPresent = filtered.filter(st => attMap[String(st._id)] === 'Present').length;
  const totalAbsent  = filtered.length - totalPresent;
  const attPct       = filtered.length ? Math.round(totalPresent / filtered.length * 100) : 0;

  // ── Class-wise chart data ────────────────────────────────
  const chartData = useMemo(() => {
    const map = {};
    students.forEach(st => {
      if (!map[st.class]) map[st.class] = { class: st.class, present: 0, absent: 0 };
      const status = attMap[String(st._id)];
      if (status === 'Present') map[st.class].present++;
      else map[st.class].absent++;
    });
    return Object.values(map).sort((a, b) => {
      const n = x => parseInt(x.class?.replace('Class ', '') || 0);
      return n(a) - n(b);
    });
  }, [students, attMap]);

  const getPct = (st) =>
    st.totalWorkingDays ? Math.round((st.presentDays || 0) / st.totalWorkingDays * 100) : 0;

  // ── Export PDF ────────────────────────────────────────────
  const exportPDF = () => {
    setExporting(true);
    const rows = filtered.map((st, i) => {
      const status = attMap[String(st._id)] || 'N/A';
      const pct    = getPct(st);
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
          <td style="font-weight:600;color:#10b981">${st.presentDays || 0}</td>
          <td style="font-weight:700;color:${pct >= 75 ? '#16a34a' : '#f59e0b'}">${pct}%</td>
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
        .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}
        @media print{.top,.stat{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body>
      <div class="top">
        <div>
          <div class="school">📚 SchoolERP — Attendance Report</div>
          <div class="sub">${user?.branch} &nbsp;•&nbsp; ${cls || 'All Classes'} ${sec ? '— Sec ' + sec : ''} &nbsp;•&nbsp; Date: ${date}</div>
        </div>
        <div style="text-align:right;font-size:12px;opacity:0.9">
          <div>Generated: ${new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}</div>
        </div>
      </div>
      <div class="stats">
        <div class="stat" style="background:#eff6ff;border-left:4px solid #4f46e5"><div class="sv" style="color:#4f46e5">${filtered.length}</div><div class="sl" style="color:#4f46e5">Total Students</div></div>
        <div class="stat" style="background:#f0fdf4;border-left:4px solid #10b981"><div class="sv" style="color:#10b981">${totalPresent}</div><div class="sl" style="color:#10b981">Present</div></div>
        <div class="stat" style="background:#fff5f5;border-left:4px solid #ef4444"><div class="sv" style="color:#ef4444">${totalAbsent}</div><div class="sl" style="color:#ef4444">Absent</div></div>
        <div class="stat" style="background:#fffbeb;border-left:4px solid #f59e0b"><div class="sv" style="color:#f59e0b">${attPct}%</div><div class="sl" style="color:#f59e0b">Attendance %</div></div>
      </div>
      <table><thead><tr><th>S.No</th><th>Roll No</th><th>Student Name</th><th>Class</th><th>Parent</th><th>Phone</th><th>Today</th><th>Present Days</th><th>Overall %</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer"><span>SchoolERP • ${user?.branch}</span><span>Total: ${filtered.length} • Printed on ${new Date().toLocaleString('en-IN')}</span></div>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); setExporting(false); }, 500);
  };

  // ── Print ─────────────────────────────────────────────────
  const handlePrint = () => {
    const rows = filtered.map((st, i) => {
      const status = attMap[String(st._id)] || 'N/A';
      return `<tr><td>${i+1}</td><td>${st.rollNo}</td><td>${st.name}</td><td>${st.class}—${st.section}</td><td>${st.parentName||'—'}</td><td>${status}</td><td>${st.presentDays||0}</td><td>${getPct(st)}%</td></tr>`;
    }).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Attendance</title><style>body{font-family:Arial;padding:20px;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #e2e8f0;padding:6px 10px;text-align:left}th{background:#f1f5f9}</style></head><body><h2>Attendance — ${user?.branch} — ${date}</h2><br><table><thead><tr><th>S.No</th><th>Roll No</th><th>Name</th><th>Class</th><th>Parent</th><th>Today</th><th>Present Days</th><th>Overall %</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <AppLayout requiredRole="branch-admin">
      <PageHeader title="Attendance" subtitle={`${user?.branch} — Class-wise overview`}>
        <button
          className="btn btn-outline"
          onClick={exportPDF}
          disabled={exporting || students.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {exporting ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={14} />}
          {exporting ? 'Preparing...' : 'Export PDF'}
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </button>
        <button className="btn btn-outline" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Printer size={14} /> Print
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { title: 'Total Students', value: filtered.length, color: '#4f46e5' },
          { title: 'Present',        value: totalPresent,    color: '#10b981' },
          { title: 'Absent',         value: totalAbsent,     color: '#ef4444' },
          { title: 'Attendance %',   value: `${attPct}%`,    color: '#f59e0b' },
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
              <Bar dataKey="present" name="Present" fill="#10b981" radius={[3,3,0,0]} style={{ cursor: 'pointer' }} />
              <Bar dataKey="absent"  name="Absent"  fill="#ef4444" radius={[3,3,0,0]} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
        )}
        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 8 }}>💡 Click a bar to filter by class</p>
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
              <th>S.No</th><th>Student Name</th><th>Class</th><th>Section</th>
              <th>Parent Phone</th><th>Today</th><th>Present</th><th>Absent</th><th>Overall %</th><th>View</th>
            </tr>
          </thead>
          <tbody>
            // With this:
{loading ? (
  <tr key="loading-row"><td colSpan={10} style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
                <span style={{ color: '#94a3b8' }}>Loading attendance...</span>
              </td></tr>
           // With this:
) : paginated.length === 0 ? (
  <tr key="empty-row"><td colSpan={10}><EmptyState message="No students found" /></td></tr>
            ) : paginated.map((st, i) => {
              const status = attMap[String(st._id)] || 'N/A';
              const pct    = getPct(st);
              return (
                <tr key={st._id}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{(page - 1) * perPage + i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: status === 'Present' ? '#10b981' : status === 'Absent' ? '#ef4444' : '#cbd5e1' }} />
                      <span style={{ fontWeight: 600 }}>{st.name}</span>
                    </div>
                  </td>
                  <td>{st.class}</td>
                  <td>{st.section}</td>
                  <td style={{ color: '#64748b' }}>{st.phone}</td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700,
                      background: status === 'Present' ? '#dcfce7' : status === 'Absent' ? '#fee2e2' : '#f1f5f9',
                      color:      status === 'Present' ? '#16a34a' : status === 'Absent' ? '#dc2626' : '#94a3b8' }}>
                      {status}
                    </span>
                  </td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{st.presentDays || 0}</td>
                  <td style={{ color: '#ef4444', fontWeight: 600 }}>{(st.totalWorkingDays || 0) - (st.presentDays || 0)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 54, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? '#10b981' : '#f59e0b', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct >= 75 ? '#10b981' : '#f59e0b' }}>{pct}%</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setSelected(st)}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
      </div>

      {/* Detail Modal */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.name} size="md">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 16 }}>
            {[
              ['Roll No',    selected.rollNo],
              ['Class',      `${selected.class} — ${selected.section}`],
              ['Parent',     selected.parentName],
              ['Phone',      selected.phone],
              ['Today',      attMap[String(selected._id)] || 'N/A'],
              ['Academic Yr',selected.academicYear || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '8px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[
              { l: 'Present Days', v: selected.presentDays || 0,                                           c: '#10b981' },
              { l: 'Absent Days',  v: (selected.totalWorkingDays || 0) - (selected.presentDays || 0),      c: '#ef4444' },
              { l: 'Attendance %', v: `${getPct(selected)}%`,                                              c: '#4f46e5' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ background: `${c}12`, borderRadius: 10, padding: 14, textAlign: 'center', borderTop: `3px solid ${c}` }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: c }}>{v}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
