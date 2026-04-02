// src/app/super-admin/reports/page.js
'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import {
  PageHeader, Badge, TableWrapper, Pagination,
  EmptyState, Modal, InfoRow, StatCard, LoadingSpinner,
} from '@/components/ui';
import { Printer, Download, Eye, BookOpen, Award, FileDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, PieChart, Pie, Cell,
} from 'recharts';

const EXAMS    = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Half Yearly', 'Annual'];
const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6',
                  'Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

const getId = (item) => item?._id || item?.id || '';

// ── Group reports by Student + Exam ──────────────────────────────────────────
function groupByStudentExam(reports) {
  const grouped = {};
  reports.forEach(r => {
    const key = `${r.studentId}-${r.exam}`;
    if (!grouped[key]) {
      grouped[key] = {
        key,
        studentId: r.studentId,
        studentName: r.studentName,
        rollNo: r.rollNo,
        class: r.class,
        section: r.section,
        branch: r.branch,
        exam: r.exam,
        academicYear: r.academicYear,
        subjects: [],
        totalObtained: 0,
        totalMax: 0,
      };
    }
    grouped[key].subjects.push(r);
    grouped[key].totalObtained += Number(r.marksObtained) || 0;
    grouped[key].totalMax += Number(r.totalMarks) || 0;
  });

  return Object.values(grouped).map(g => ({
    ...g,
    subjectCount: g.subjects.length,
    percentage: g.totalMax > 0 ? Math.round((g.totalObtained / g.totalMax) * 100) : 0,
    status: g.totalMax > 0 && (g.totalObtained / g.totalMax) >= 0.35 ? 'Pass' : 'Fail',
  }));
}

// ── Exam Badge Color ─────────────────────────────────────────────────────────
function getExamColor(exam) {
  const colors = {
    'Unit Test 1': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
    'Unit Test 2': { bg: '#fed7aa', text: '#9a3412', border: '#fb923c' },
    'Mid Term':    { bg: '#dbeafe', text: '#1e40af', border: '#60a5fa' },
    'Half Yearly': { bg: '#e0e7ff', text: '#3730a3', border: '#818cf8' },
    'Annual':      { bg: '#dcfce7', text: '#166534', border: '#4ade80' },
  };
  return colors[exam] || { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' };
}

// ── PDF Builder ──────────────────────────────────────────────────────────────
function buildReportPDF({ groupedReports, title, branch, cls, section, exam }) {
  const blocks = groupedReports.map(g => {
    const rows = g.subjects.map((r, i) => {
      const pc = r.percentage >= 75 ? '#16a34a' : r.percentage >= 35 ? '#f59e0b' : '#ef4444';
      return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0">${r.subject}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${r.marksObtained}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b">${r.totalMarks}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:${pc}">${r.percentage}%</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center">
          <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${r.status==='Pass'?'#dcfce7':'#fee2e2'};color:${r.status==='Pass'?'#16a34a':'#dc2626'}">${r.status}</span>
        </td>
      </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:24px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border-left:4px solid #4f46e5;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:10px">
          <div>
            <div style="font-weight:800;font-size:14px;color:#1e293b">${g.studentName}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">Roll No: ${g.rollNo} • ${g.class} — Section ${g.section} • Branch: ${g.branch} • <b>${g.exam}</b></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:800;color:${g.percentage>=75?'#10b981':g.percentage>=35?'#f59e0b':'#ef4444'}">${g.percentage}%</div>
            <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${g.status==='Pass'?'#dcfce7':'#fee2e2'};color:${g.status==='Pass'?'#16a34a':'#dc2626'}">${g.status}</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#4f46e5">
            <th style="padding:8px 10px;text-align:left;color:white">Subject</th>
            <th style="padding:8px 10px;text-align:center;color:white">Marks</th>
            <th style="padding:8px 10px;text-align:center;color:white">Total</th>
            <th style="padding:8px 10px;text-align:center;color:white">%</th>
            <th style="padding:8px 10px;text-align:center;color:white">Result</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr style="background:#f1f5f9">
            <td style="padding:8px 10px;font-weight:800">GRAND TOTAL</td>
            <td style="padding:8px 10px;text-align:center;font-weight:800;color:#4f46e5">${g.totalObtained}</td>
            <td style="padding:8px 10px;text-align:center;color:#64748b">${g.totalMax}</td>
            <td style="padding:8px 10px;text-align:center;font-weight:800;color:${g.percentage>=75?'#10b981':g.percentage>=35?'#f59e0b':'#ef4444'}">${g.percentage}%</td>
            <td style="padding:8px 10px;text-align:center">
              <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${g.status==='Pass'?'#dcfce7':'#fee2e2'};color:${g.status==='Pass'?'#16a34a':'#dc2626'}">${g.status}</span>
            </td>
          </tr></tfoot>
        </table>
      </div>`;
  }).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;padding:28px;color:#1e293b;background:#fff}
    .top{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:20px 28px;border-radius:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
    .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}
    @media print{body{padding:14px}.top{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="top">
    <div>
      <div style="font-size:20px;font-weight:800">📊 SchoolERP — Academic Report Card</div>
      <div style="font-size:12px;opacity:0.85;margin-top:4px">${branch||'All Branches'} • ${cls||'All Classes'} ${section?'— Section '+section:''} ${exam?'• '+exam:''}</div>
    </div>
    <div style="text-align:right;font-size:12px;opacity:0.9">
      <div>Super Admin Report</div>
      <div>Generated: ${new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
    </div>
  </div>
  ${blocks}
  <div class="footer">
    <span>SchoolERP</span>
    <span>Total Records: ${groupedReports.length} • Printed on ${new Date().toLocaleString('en-IN')}</span>
  </div>
  </body></html>`;
}

export default function SuperAdminReports() {
  const [reports,  setReports]  = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [branch, setBranch] = useState('');
  const [cls,    setCls]    = useState('');
  const [sec,    setSec]    = useState('');
  const [exam,   setExam]   = useState('');
  const [search, setSearch] = useState('');
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

  // Group by student + exam
  const groupedReports = useMemo(() => groupByStudentExam(reports), [reports]);

  const filtered = useMemo(() => {
    let data = groupedReports;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(g =>
        g.studentName?.toLowerCase().includes(q) ||
        g.rollNo?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [groupedReports, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const passCount = filtered.filter(g => g.status === 'Pass').length;
  const failCount = filtered.filter(g => g.status === 'Fail').length;
  const avgPct = filtered.length
    ? Math.round(filtered.reduce((a, g) => a + g.percentage, 0) / filtered.length)
    : 0;

  // Chart data - by exam type
  const examChartData = useMemo(() => {
    const map = {};
    groupedReports.forEach(g => {
      const key = g.exam || 'Unknown';
      if (!map[key]) map[key] = { exam: key, pass: 0, fail: 0, count: 0 };
      if (g.status === 'Pass') map[key].pass++;
      else map[key].fail++;
      map[key].count++;
    });
    return Object.values(map);
  }, [groupedReports]);

  // Chart data - by class
  const classChartData = useMemo(() => {
    const map = {};
    groupedReports.forEach(g => {
      const key = g.class || 'Unknown';
      if (!map[key]) map[key] = { class: key, pass: 0, fail: 0 };
      if (g.status === 'Pass') map[key].pass++;
      else map[key].fail++;
    });
    return Object.values(map).sort((a, b) => a.class.localeCompare(b.class));
  }, [groupedReports]);

  const handleReset = () => {
    setBranch(''); setCls(''); setSec(''); setExam('');
    setSearch(''); setPage(1);
  };

  const exportAllPDF = () => {
    if (!filtered.length) return;
    const html = buildReportPDF({ groupedReports: filtered, title: 'All Reports', branch, cls, section: sec, exam });
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close();
    setTimeout(() => win.print(), 600);
  };

  return (
    <AppLayout requiredRole="super-admin">
      <PageHeader title="Reports" subtitle="Term-wise Academic Performance Overview">
        {(branch || cls || sec || exam || search) && (
          <button className="btn btn-outline" onClick={handleReset}>✕ Reset</button>
        )}
        <button className="btn btn-outline" onClick={exportAllPDF} disabled={!filtered.length}>
          <Download size={15} /> Export PDF
        </button>
        <button className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </button>
      </PageHeader>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14, marginBottom:20 }}>
        <StatCard title="Total Results" value={loading ? '…' : filtered.length} color="#4f46e5" delay={0} />
        <StatCard title="Pass" value={loading ? '…' : passCount} color="#10b981" delay={80} />
        <StatCard title="Fail" value={loading ? '…' : failCount} color="#ef4444" delay={160} />
        <StatCard title="Avg Score" value={loading ? '…' : `${avgPct}%`} color="#f59e0b" delay={240} />
        <StatCard
          title="Pass %"
          value={loading ? '…' : `${filtered.length ? Math.round(passCount / filtered.length * 100) : 0}%`}
          color="#8b5cf6"
          delay={320}
        />
      </div>

      {/* Charts */}
      {!loading && groupedReports.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:20 }} className="reports-charts">
          {/* Exam-wise Chart */}
          <div className="card" style={{ animation:'fadeSlideUp 0.4s ease both' }}>
            <h3 style={{ fontWeight:700, marginBottom:16, fontSize:'0.95rem' }}>Exam-wise Pass / Fail</h3>
            {examChartData.length === 0 ? (
              <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:'0.875rem' }}>No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={examChartData} barSize={20} barCategoryGap="25%">
                  <XAxis dataKey="exam" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius:10, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', fontSize:'0.8rem' }} />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="pass" name="Pass" fill="#10b981" radius={[5,5,0,0]} />
                  <Bar dataKey="fail" name="Fail" fill="#ef4444" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Class-wise Chart */}
          <div className="card" style={{ animation:'fadeSlideUp 0.4s ease both', animationDelay:'80ms' }}>
            <h3 style={{ fontWeight:700, marginBottom:16, fontSize:'0.95rem' }}>Class-wise Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[{ name:'Pass', value: passCount }, { name:'Fail', value: failCount }]}
                  dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={35}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  labelLine={false}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius:10, border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', fontSize:'0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" style={{ maxWidth:170 }} value={branch}
            onChange={e => { setBranch(e.target.value); setPage(1); }}>
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id || b._id} value={b.name}>{b.name}</option>
            ))}
          </select>

          <select className="select" style={{ maxWidth:140 }} value={cls}
            onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="select" style={{ maxWidth:130 }} value={sec}
            onChange={e => { setSec(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select className="select" style={{ maxWidth:150 }} value={exam}
            onChange={e => { setExam(e.target.value); setPage(1); }}>
            <option value="">All Exams</option>
            {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f8fafc', borderRadius:10, padding:'7px 12px', border:'1.5px solid #e2e8f0', flex:1, minWidth:200 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.84rem', flex:1, color:'#374151' }}
              placeholder="Search student or roll no..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <span style={{ fontSize:'0.78rem', color:'#94a3b8', whiteSpace:'nowrap', fontWeight:500 }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <LoadingSpinner text="Loading reports..." />
        ) : (
          <>
            <TableWrapper>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Roll No</th>
                  <th>Student</th>
                  <th>Class / Section</th>
                  <th>Branch</th>
                  <th>Exam / Term</th>
                  <th>Subjects</th>
                  <th>Total Marks</th>
                  <th>%</th>
                  <th>Result</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={11}>
                    <EmptyState message={search ? `No results for "${search}"` : 'No reports found. Adjust filters.'} />
                  </td></tr>
                ) : paginated.map((g, i) => {
                  const examColor = getExamColor(g.exam);
                  return (
                    <tr key={g.key || `report-${(page - 1) * perPage + i}`}>
                      <td style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{(page - 1) * perPage + i + 1}</td>
                      <td style={{ fontWeight:700, color:'#4f46e5', fontFamily:'monospace' }}>{g.rollNo}</td>
                      <td>
                        <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.84rem' }}>{g.studentName}</div>
                        <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{g.academicYear}</div>
                      </td>
                      <td style={{ color:'#64748b' }}>{g.class} / {g.section}</td>
                      <td>
                        <span style={{ padding:'2px 8px', background:'#f1f5f9', color:'#475569', borderRadius:6, fontSize:'0.72rem', fontWeight:600 }}>
                          {g.branch}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          padding:'4px 12px', borderRadius:20, fontSize:'0.75rem', fontWeight:700,
                          background: examColor.bg, color: examColor.text, border:`1px solid ${examColor.border}`
                        }}>
                          {g.exam}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <BookOpen size={13} color="#64748b" />
                          <span style={{ fontWeight:600 }}>{g.subjectCount}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight:700 }}>
                        {g.totalObtained} <span style={{ color:'#94a3b8', fontWeight:400 }}>/ {g.totalMax}</span>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:40, height:5, background:'#f1f5f9', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.min(100, g.percentage)}%`, background: g.percentage >= 75 ? '#10b981' : g.percentage >= 35 ? '#f59e0b' : '#ef4444', borderRadius:99 }} />
                          </div>
                          <span style={{ fontSize:'0.78rem', fontWeight:700, color: g.percentage >= 75 ? '#10b981' : g.percentage >= 35 ? '#f59e0b' : '#ef4444' }}>
                            {g.percentage}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background: g.status==='Pass'?'#dcfce7':'#fee2e2', color: g.status==='Pass'?'#16a34a':'#dc2626' }}>
                          {g.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:'0.75rem' }} onClick={() => setSelected(g)}>
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrapper>
            <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
          </>
        )}
      </div>

      {/* Detail Modal - Subject-wise */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={`${selected.exam} — ${selected.studentName}`} size="lg">
          {/* Student Info Header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, background:'linear-gradient(135deg,#eff6ff,#e0f2fe)', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
            <div style={{ width:50, height:50, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.3rem', flexShrink:0 }}>
              {selected.studentName?.charAt(0)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'1rem', color:'#1e293b' }}>{selected.studentName}</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2 }}>
                Roll No: {selected.rollNo} • {selected.class}–{selected.section} • {selected.branch} • {selected.academicYear}
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'1.8rem', fontWeight:900, color: selected.percentage>=75?'#10b981':selected.percentage>=35?'#f59e0b':'#ef4444' }}>
                {selected.percentage}%
              </div>
              <span style={{ padding:'4px 14px', borderRadius:20, fontSize:'0.78rem', fontWeight:700, background: selected.status==='Pass'?'#dcfce7':'#fee2e2', color: selected.status==='Pass'?'#16a34a':'#dc2626' }}>
                {selected.status}
              </span>
            </div>
          </div>

          {/* Exam Badge */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Award size={18} color="#4f46e5" />
            <span style={{ fontWeight:700, color:'#1e293b' }}>Exam:</span>
            <span style={{
              padding:'5px 14px', borderRadius:20, fontSize:'0.82rem', fontWeight:700,
              background: getExamColor(selected.exam).bg,
              color: getExamColor(selected.exam).text,
              border: `1px solid ${getExamColor(selected.exam).border}`
            }}>
              {selected.exam}
            </span>
          </div>

          {/* Subject-wise Table */}
          <div style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#4f46e5' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Subject</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Marks</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Total</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>%</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Result</th>
                </tr>
              </thead>
              <tbody>
                {selected.subjects.map((s, i) => {
                  const pctColor = s.percentage >= 75 ? '#10b981' : s.percentage >= 35 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={getId(s) || `subject-${i}`} style={{ background: i%2===0?'#fff':'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                      <td style={{ padding:'12px 14px', fontWeight:600, color:'#1e293b' }}>{s.subject}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center', fontWeight:800, color:'#4f46e5', fontSize:'1rem' }}>{s.marksObtained}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center', color:'#64748b' }}>{s.totalMarks}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                          <div style={{ width:40, height:5, background:'#e2e8f0', borderRadius:3, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.min(100,s.percentage)}%`, background:pctColor, borderRadius:3 }} />
                          </div>
                          <span style={{ fontWeight:700, color:pctColor, fontSize:'0.82rem' }}>{s.percentage}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px', textAlign:'center' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background: s.status==='Pass'?'#dcfce7':'#fee2e2', color: s.status==='Pass'?'#16a34a':'#dc2626' }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:'#f1f5f9' }}>
                  <td style={{ padding:'12px 14px', fontWeight:800, color:'#1e293b' }}>GRAND TOTAL</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', fontWeight:900, color:'#4f46e5', fontSize:'1.1rem' }}>{selected.totalObtained}</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', color:'#64748b', fontWeight:600 }}>{selected.totalMax}</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', fontWeight:900, fontSize:'1rem', color: selected.percentage>=75?'#10b981':selected.percentage>=35?'#f59e0b':'#ef4444' }}>
                    {selected.percentage}%
                  </td>
                  <td style={{ padding:'12px 14px', textAlign:'center' }}>
                    <span style={{ padding:'4px 14px', borderRadius:20, fontSize:'0.78rem', fontWeight:700, background: selected.status==='Pass'?'#dcfce7':'#fee2e2', color: selected.status==='Pass'?'#16a34a':'#dc2626' }}>
                      {selected.status}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Performance Summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:16 }}>
            {[
              { label: 'Subjects', value: selected.subjectCount, color: '#4f46e5' },
              { label: 'Passed', value: selected.subjects.filter(s => s.status === 'Pass').length, color: '#10b981' },
              { label: 'Failed', value: selected.subjects.filter(s => s.status === 'Fail').length, color: '#ef4444' },
              { label: 'Highest', value: Math.max(...selected.subjects.map(s => s.percentage)) + '%', color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color }}>{value}</div>
                <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button className="btn btn-outline" onClick={() => {
              const html = buildReportPDF({ groupedReports: [selected], title: `${selected.studentName} - ${selected.exam}`, branch: selected.branch, cls: selected.class, section: selected.section, exam: selected.exam });
              const win = window.open('', '_blank');
              win.document.write(html); win.document.close();
              setTimeout(() => win.print(), 600);
            }} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <FileDown size={13} /> Print Report
            </button>
            <button className="btn btn-primary" onClick={() => setSelected(null)}>Close</button>
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