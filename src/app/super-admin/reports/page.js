'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  PageHeader, Badge, TableWrapper, Pagination,
  EmptyState, Modal, InfoRow, StatCard, LoadingSpinner,
} from '@/components/ui';
import { Printer, Download, Eye } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from 'recharts';

const EXAMS    = ['Annual', 'Unit Test 1', 'Unit Test 2', 'Mid Term', 'Half Yearly'];
const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6',
                  'Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

export default function SuperAdminReports() {
  const [reports,  setReports]  = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [branch, setBranch] = useState('');
  const [cls,    setCls]    = useState('');
  const [sec,    setSec]    = useState('');
  const [exam,   setExam]   = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [page,   setPage]   = useState(1);
  const [selected, setSelected] = useState(null);
  const perPage = 10;

  useEffect(() => {
    fetch('/api/branches')
      .then(r => r.json())
      .then(d => { if (d.success) setBranches(d.data || []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (branch) params.set('branch', branch);
    if (cls)    params.set('class',  cls);
    if (sec)    params.set('section', sec);
    if (exam)   params.set('exam',   exam);

    fetch(`/api/reports?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setReports(d.data || []); else setReports([]); })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [branch, cls, sec, exam]);

  const filtered = useMemo(() => {
    let data = reports;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r =>
        r.studentName?.toLowerCase().includes(q) ||
        r.rollNo?.toLowerCase().includes(q) ||
        r.subject?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'pass') data = data.filter(r => r.status === 'Pass');
    if (sortBy === 'fail') data = data.filter(r => r.status === 'Fail');
    if (sortBy === 'high') data = [...data].sort((a, b) => b.marksObtained - a.marksObtained);
    if (sortBy === 'low')  data = [...data].sort((a, b) => a.marksObtained - b.marksObtained);
    return data;
  }, [reports, search, sortBy]);

  const paginated  = filtered.slice((page - 1) * perPage, page * perPage);
  const passCount  = filtered.filter(r => r.status === 'Pass').length;
  const failCount  = filtered.filter(r => r.status === 'Fail').length;
  const avgPct     = filtered.length
    ? Math.round(filtered.reduce((a, r) => a + (r.percentage || 0), 0) / filtered.length)
    : 0;

  const classChartData = useMemo(() => {
    const map = {};
    reports.forEach(r => {
      const key = r.class || 'Unknown';
      if (!map[key]) map[key] = { class: key, pass: 0, fail: 0 };
      if (r.status === 'Pass') map[key].pass++;
      else map[key].fail++;
    });
    return Object.values(map).sort((a, b) => a.class.localeCompare(b.class));
  }, [reports]);

  const handleReset = () => {
    setBranch(''); setCls(''); setSec(''); setExam('');
    setSearch(''); setSortBy(''); setPage(1);
  };

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader title="Reports" subtitle="Academic performance overview">
        <select className="select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
          <option value="">Sort By</option>
          <option value="pass">Pass Only</option>
          <option value="fail">Fail Only</option>
          <option value="high">Marks High → Low</option>
          <option value="low">Marks Low → High</option>
        </select>
        {(branch || cls || sec || exam || search || sortBy) && (
          <button className="btn btn-outline" onClick={handleReset}>✕ Reset</button>
        )}
        <button className="btn btn-outline"><Download size={15} /> Export</button>
        <button className="btn btn-outline"><Printer size={15} /> Print</button>
      </PageHeader>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard title="Total Records" value={loading ? '…' : filtered.length} color="#4f46e5" delay={0} />
        <StatCard title="Pass"          value={loading ? '…' : passCount}        color="#10b981" delay={80} />
        <StatCard title="Fail"          value={loading ? '…' : failCount}        color="#ef4444" delay={160} />
        <StatCard title="Avg Score"     value={loading ? '…' : `${avgPct}%`}     color="#f59e0b" delay={240} />
        <StatCard
          title="Pass %"
          value={loading ? '…' : `${filtered.length ? Math.round(passCount / filtered.length * 100) : 0}%`}
          color="#8b5cf6"
          delay={320}
        />
      </div>

      {/* Charts */}
      {!loading && reports.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }} className="reports-charts">
          <div className="card" style={{ animation: 'fadeSlideUp 0.4s ease both' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Class-wise Pass / Fail</h3>
            {classChartData.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={classChartData} barSize={16} barCategoryGap="35%">
                  <XAxis dataKey="class" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="pass" name="Pass" fill="#10b981" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="fail" name="Fail" fill="#ef4444" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card" style={{ animation: 'fadeSlideUp 0.4s ease both', animationDelay: '80ms' }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '0.95rem' }}>Pass / Fail Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[{ name: 'Pass', value: passCount }, { name: 'Fail', value: failCount }]}
                  dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={35}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  labelLine={false}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters - FIXED KEY PROPS */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Branch - FIXED: Use b.id || b._id || index as fallback */}
          <select className="select" style={{ maxWidth: 170 }} value={branch}
  onChange={e => { setBranch(e.target.value); setPage(1); }}>
  <option value="">All Branches</option>
  {branches.map((b) => (
    <option key={b.id || b._id} value={b.name}>
      {b.name}
    </option>
  ))}
</select>

          {/* Class */}
          <select className="select" style={{ maxWidth: 140 }} value={cls}
            onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Section */}
          <select className="select" style={{ maxWidth: 130 }} value={sec}
            onChange={e => { setSec(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Exam */}
          <select className="select" style={{ maxWidth: 150 }} value={exam}
            onChange={e => { setExam(e.target.value); setPage(1); }}>
            <option value="">All Exams</option>
            {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 10, padding: '7px 12px', border: '1.5px solid #e2e8f0', flex: 1, minWidth: 200 }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.1)'; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.84rem', flex: 1, color: '#374151' }}
              placeholder="Search student or roll no..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <span style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table - FIXED KEY PROPS */}
      <div className="card">
        {loading ? (
          <LoadingSpinner text="Loading reports..." />
        ) : (
          <>
            <TableWrapper>
              <thead>
                <tr>
                  <th>S.No</th><th>Roll No</th><th>Student</th><th>Class / Section</th>
                  <th>Subject</th><th>Result</th><th>Marks</th><th>%</th><th>Exam</th><th>View</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={10}>
                    <EmptyState message={search ? `No results for "${search}"` : 'No reports found. Adjust filters.'} />
                  </td></tr>
                ) : paginated.map((r, i) => (
                  <tr key={r.id || r._id || `report-${(page - 1) * perPage + i}`}>
                    <td style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{(page - 1) * perPage + i + 1}</td>
                    <td style={{ fontWeight: 700, color: '#4f46e5', fontFamily: 'monospace' }}>{r.rollNo}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.84rem' }}>{r.studentName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{r.branch}</div>
                    </td>
                    <td style={{ color: '#64748b' }}>{r.class} / {r.section}</td>
                    <td>
                      <span style={{ padding: '2px 8px', background: '#eff6ff', color: '#2563eb', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                        {r.subject}
                      </span>
                    </td>
                    <td><Badge>{r.status}</Badge></td>
                    <td style={{ fontWeight: 700 }}>{r.marksObtained} / {r.totalMarks}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 40, height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, r.percentage || 0)}%`, background: r.percentage >= 75 ? '#10b981' : r.percentage >= 35 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: r.percentage >= 75 ? '#10b981' : r.percentage >= 35 ? '#f59e0b' : '#ef4444' }}>
                          {r.percentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{r.exam}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setSelected(r)}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
            <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
          </>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={selected.studentName} subtitle={`${selected.rollNo} • ${selected.class} – ${selected.section}`} size="md">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 16 }}>
            <InfoRow label="Roll No"    value={selected.rollNo} />
            <InfoRow label="Branch"     value={selected.branch} />
            <InfoRow label="Class"      value={`${selected.class} / ${selected.section}`} />
            <InfoRow label="Exam"       value={selected.exam} />
            <InfoRow label="Subject"    value={selected.subject} />
            <InfoRow label="Acad Year"  value={selected.academicYear} />
            <InfoRow label="Marks"      value={`${selected.marksObtained} / ${selected.totalMarks}`} />
            <InfoRow label="Percentage" value={`${selected.percentage}%`} />
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem', color: '#64748b' }}>
              <span>Score</span>
              <span style={{ fontWeight: 800, color: selected.percentage >= 75 ? '#10b981' : selected.percentage >= 35 ? '#f59e0b' : '#ef4444' }}>
                {selected.percentage}%
              </span>
            </div>
            <div style={{ height: 10, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${selected.percentage}%`, background: selected.percentage >= 75 ? '#10b981' : selected.percentage >= 35 ? '#f59e0b' : '#ef4444', borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Badge>{selected.status}</Badge>
          </div>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 700px) { .reports-charts { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}