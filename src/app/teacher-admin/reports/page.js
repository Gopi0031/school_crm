// src/app/teacher-admin/reports/page.js
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Plus, Upload, Eye, Trash2, Search, FileDown,
  X, Edit2, CheckSquare, Square, Loader, BookOpen, Award
} from 'lucide-react';

const BLANK = {
  studentId: '', subject: '', marksObtained: '', totalMarks: 100,
  exam: 'Annual', academicYear: '2025-26',
};
const EXAMS    = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Half Yearly', 'Annual'];
const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

function F({ label, req, children }) {
  return <FormField label={label} required={req}>{children}</FormField>;
}

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
function buildReportPDF({ groupedReports, title, user, cls, section, exam }) {
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
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border-left:4px solid #10b981;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:10px">
          <div>
            <div style="font-weight:800;font-size:14px;color:#1e293b">${g.studentName}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">Roll No: ${g.rollNo} • ${g.class} — Section ${g.section} • <b>${g.exam}</b></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:800;color:${g.percentage>=75?'#10b981':g.percentage>=35?'#f59e0b':'#ef4444'}">${g.percentage}%</div>
            <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${g.status==='Pass'?'#dcfce7':'#fee2e2'};color:${g.status==='Pass'?'#16a34a':'#dc2626'}">${g.status}</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead><tr style="background:#10b981">
            <th style="padding:8px 10px;text-align:left;color:white">Subject</th>
            <th style="padding:8px 10px;text-align:center;color:white">Marks</th>
            <th style="padding:8px 10px;text-align:center;color:white">Total</th>
            <th style="padding:8px 10px;text-align:center;color:white">%</th>
            <th style="padding:8px 10px;text-align:center;color:white">Result</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr style="background:#f1f5f9">
            <td style="padding:8px 10px;font-weight:800">GRAND TOTAL</td>
            <td style="padding:8px 10px;text-align:center;font-weight:800;color:#10b981">${g.totalObtained}</td>
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
    .top{background:linear-gradient(135deg,#10b981,#059669);color:white;padding:20px 28px;border-radius:12px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
    .footer{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8}
    @media print{body{padding:14px}.top{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="top">
    <div>
      <div style="font-size:20px;font-weight:800">📊 SchoolERP — Academic Report Card</div>
      <div style="font-size:12px;opacity:0.85;margin-top:4px">${user?.branch} • ${cls||'All Classes'} ${section?'— Section '+section:''} ${exam?'• '+exam:''}</div>
    </div>
    <div style="text-align:right;font-size:12px;opacity:0.9">
      <div>Teacher: <b>${user?.name}</b></div>
      <div>Generated: ${new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
    </div>
  </div>
  ${blocks}
  <div class="footer">
    <span>SchoolERP • ${user?.branch}</span>
    <span>Total Records: ${groupedReports.length} • Printed on ${new Date().toLocaleString('en-IN')}</span>
  </div>
  </body></html>`;
}

export default function TeacherReports() {
  const { user } = useAuth();
  const fileRef  = useRef();

  const [reports, setReports]       = useState([]);
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cls, setCls]               = useState(user?.class || '');
  const [section, setSection]       = useState(user?.section || '');
  const [exam, setExam]             = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [showAdd, setShowAdd]       = useState(false);
  const [showBulk, setShowBulk]     = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [selected, setSelected]     = useState(null);
  const [deleteGroup, setDeleteGroup] = useState(null);
  const [checkedKeys, setCheckedKeys] = useState([]);
  const [showMultiDel, setShowMultiDel] = useState(false);
  const [error, setError]           = useState('');
  const [toast, setToast]           = useState({ msg: '', type: 'success' });
  const [saving, setSaving]         = useState(false);
  const [bulkFile, setBulkFile]     = useState(null);
  const [bulkExam, setBulkExam]     = useState('Annual');
  const [bulkYear, setBulkYear]     = useState('2025-26');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [multiDeleting, setMultiDeleting] = useState(false);
  const [exportingAll, setExportingAll]   = useState(false);
  const [exportingSel, setExportingSel]   = useState(false);
  const perPage = 10;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ branch: user?.branch || '' });
    if (cls)     params.set('class',   cls);
    if (section) params.set('section', section);
    if (exam)    params.set('exam',    exam);
    const [rRes, sRes] = await Promise.all([
      fetch(`/api/reports?${params}`),
      fetch(`/api/students?branch=${user?.branch || ''}`),
    ]);
    const [rData, sData] = await Promise.all([rRes.json(), sRes.json()]);
    if (rData.success) setReports(rData.data || []);
    if (sData.success) setStudents(sData.data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, cls, section, exam]);

  const groupedReports = useMemo(() => groupByStudentExam(reports), [reports]);

  const filtered = useMemo(() => groupedReports.filter(g =>
    !search ||
    g.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    g.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [groupedReports, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const allPageChecked = paginated.length > 0 && paginated.every(g => checkedKeys.includes(g.key));
  const toggleAll = () => {
    const pageKeys = paginated.map(g => g.key);
    if (allPageChecked) setCheckedKeys(prev => prev.filter(k => !pageKeys.includes(k)));
    else setCheckedKeys(prev => [...new Set([...prev, ...pageKeys])]);
  };
  const toggleOne = (key) =>
    setCheckedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const exportAllPDF = () => {
    if (!filtered.length) return;
    setExportingAll(true);
    const html = buildReportPDF({ groupedReports: filtered, title: 'All Reports', user, cls, section, exam });
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close();
    setTimeout(() => { win.print(); setExportingAll(false); }, 600);
  };

  const exportSelectedPDF = () => {
    if (!checkedKeys.length) return;
    setExportingSel(true);
    const sel = filtered.filter(g => checkedKeys.includes(g.key));
    const html = buildReportPDF({ groupedReports: sel, title: 'Selected Reports', user, cls, section, exam });
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close();
    setTimeout(() => { win.print(); setExportingSel(false); }, 600);
  };

  const saveReport = async () => {
    setError('');
    if (!form.studentId || !form.subject || !form.marksObtained) {
      setError('Student, subject and marks are required'); return;
    }
    if (Number(form.marksObtained) > Number(form.totalMarks)) {
      setError('Marks obtained cannot exceed total marks'); return;
    }
    setSaving(true);
    try {
      const method = editReport ? 'PUT' : 'POST';
      const url = editReport ? `/api/reports/${getId(editReport)}` : '/api/reports';
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch: user?.branch }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Something went wrong'); return; }
      showToast(`✓ Report ${editReport ? 'updated' : 'saved'} successfully`);
      setShowAdd(false); setEditReport(null); setForm(BLANK); load();
    } finally { setSaving(false); }
  };

  const openEditSubject = (subjectReport) => {
    setEditReport(subjectReport);
    setForm({
      studentId: subjectReport.studentId,
      subject: subjectReport.subject,
      marksObtained: subjectReport.marksObtained,
      totalMarks: subjectReport.totalMarks,
      exam: subjectReport.exam,
      academicYear: subjectReport.academicYear
    });
    setError('');
    setSelected(null);
    setShowAdd(true);
  };

  const deleteGroupReports = async () => {
    if (!deleteGroup) return;
    const ids = deleteGroup.subjects.map(s => getId(s));
    try {
      const r = await fetch('/api/reports/bulk-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(`✓ ${ids.length} subject report(s) deleted`);
        setCheckedKeys(prev => prev.filter(k => k !== deleteGroup.key));
      } else {
        showToast(d.error || 'Delete failed', 'error');
      }
    } finally { setDeleteGroup(null); load(); }
  };

  const deleteMultiple = async () => {
    setMultiDeleting(true);
    const selectedGroups = filtered.filter(g => checkedKeys.includes(g.key));
    const allIds = selectedGroups.flatMap(g => g.subjects.map(s => getId(s)));
    try {
      const r = await fetch('/api/reports/bulk-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds }),
      });
      const d = await r.json();
      if (d.success) {
        showToast(`✓ ${allIds.length} report(s) deleted`);
        setCheckedKeys([]);
        setShowMultiDel(false);
        load();
      } else {
        showToast(d.error || 'Delete failed', 'error');
      }
    } finally { setMultiDeleting(false); }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    const fd = new FormData();
    fd.append('file', bulkFile);
    fd.append('branch', user?.branch || '');
    fd.append('exam', bulkExam);
    fd.append('academicYear', bulkYear);
    try {
      const r = await fetch('/api/reports/bulk-upload', { method: 'POST', body: fd });
      const text = await r.text();
      let d;
      try { d = JSON.parse(text); }
      catch { setBulkResult({ success: false, message: `Server error: ${text.slice(0,100)}` }); return; }
      setBulkResult(d);
      if (d.success) { load(); showToast(`✓ ${d.inserted} report(s) uploaded`); }
    } catch (err) {
      setBulkResult({ success: false, message: `Network error: ${err.message}` });
    } finally { setBulkLoading(false); }
  };

  const downloadTemplate = () => {
    const csv = ['rollno,subject,marks,totalmarks,exam,academicyear','2025001,Mathematics,85,100,Annual,2025-26','2025001,Science,78,100,Annual,2025-26'].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'reports_template.csv'; a.click();
  };

  const pct = form.marksObtained && form.totalMarks
    ? Math.round(Number(form.marksObtained) / Number(form.totalMarks) * 100)
    : null;

  const totalStudentExams = groupedReports.length;
  const passCount = groupedReports.filter(g => g.status === 'Pass').length;
  const failCount = totalStudentExams - passCount;
  const avgPct = totalStudentExams
    ? Math.round(groupedReports.reduce((s, g) => s + g.percentage, 0) / totalStudentExams)
    : 0;

  return (
    <AppLayout requiredRole="teacher-admin">
      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {toast.msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type==='error'?'#ef4444':'#10b981', color:'white', padding:'12px 20px', borderRadius:12, fontWeight:600, fontSize:'0.875rem', boxShadow:'0 8px 28px rgba(0,0,0,0.18)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.msg}
          <button onClick={() => setToast({ msg:'' })} style={{ background:'transparent', border:'none', cursor:'pointer', color:'white', padding:0, display:'flex' }}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Reports" subtitle="Term-wise Student Results">
        <button className="btn btn-outline" onClick={exportAllPDF} disabled={exportingAll || !filtered.length}
          style={{ display:'flex', alignItems:'center', gap:6 }}>
          {exportingAll
            ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Preparing...</>
            : <><FileDown size={13} /> Export All PDF</>}
        </button>

        {checkedKeys.length > 0 && (
          <>
            <button className="btn btn-outline" onClick={exportSelectedPDF} disabled={exportingSel}
              style={{ display:'flex', alignItems:'center', gap:6, color:'#10b981', borderColor:'#10b981' }}>
              {exportingSel
                ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Preparing...</>
                : <><FileDown size={13} /> Export Selected ({checkedKeys.length})</>}
            </button>
            <button className="btn btn-danger" onClick={() => setShowMultiDel(true)}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Trash2 size={13} /> Delete ({checkedKeys.length})
            </button>
          </>
        )}

        <button className="btn btn-outline" onClick={() => { setBulkFile(null); setBulkResult(null); setShowBulk(true); }}
          style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Upload size={13} /> Bulk Upload
        </button>
        <button className="btn btn-primary" onClick={() => { setForm(BLANK); setEditReport(null); setError(''); setShowAdd(true); }}
          style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={13} /> Add Report
        </button>
      </PageHeader>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { l:'Total Results', v: totalStudentExams, c:'#10b981', icon: '📊' },
          { l:'Pass',          v: passCount,          c:'#10b981', icon: '✅' },
          { l:'Fail',          v: failCount,          c:'#ef4444', icon: '❌' },
          { l:'Avg Score',     v: `${avgPct}%`,       c:'#f59e0b', icon: '📈' },
        ].map(({ l, v, c, icon }) => (
          <div key={l} className="card" style={{ textAlign:'center', borderTop:`3px solid ${c}`, padding:14 }}>
            <div style={{ fontSize:'1.2rem', marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" style={{ maxWidth:150 }} value={cls} onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" style={{ maxWidth:130 }} value={section} onChange={e => { setSection(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="select" style={{ maxWidth:155 }} value={exam} onChange={e => { setExam(e.target.value); setPage(1); }}>
            <option value="">All Exams</option>
            {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f8fafc', borderRadius:9, padding:'7px 12px', border:'1.5px solid #e2e8f0', flex:1, minWidth:180, maxWidth:300 }}>
            <Search size={14} color="#94a3b8" />
            <input style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.83rem', flex:1 }}
              placeholder="Search name or roll no..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0, display:'flex' }}><X size={13} /></button>
            )}
          </div>
          <span style={{ fontSize:'0.78rem', color:'#94a3b8', marginLeft:'auto', whiteSpace:'nowrap' }}>
            {filtered.length} results
          </span>
        </div>
      </div>

      {checkedKeys.length > 0 && (
        <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', borderRadius:10, padding:'10px 16px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.83rem' }}>
          <span style={{ color:'#059669', fontWeight:600 }}>✓ {checkedKeys.length} result(s) selected</span>
          <button onClick={() => setCheckedKeys([])} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.78rem' }}>Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th style={{ width:36 }}>
                <div onClick={toggleAll} style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {allPageChecked ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="#94a3b8" />}
                </div>
              </th>
              <th>S.No</th>
              <th>Roll No</th>
              <th>Student</th>
              <th>Class</th>
              <th>Exam / Term</th>
              <th>Subjects</th>
              <th>Total Marks</th>
              <th>Percentage</th>
              <th>Result</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11} style={{ textAlign:'center', padding:52 }}>
                <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
                <span style={{ color:'#94a3b8', fontSize:'0.83rem' }}>Loading reports...</span>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={11}><EmptyState message="No results found. Add reports or adjust filters." /></td></tr>
            ) : paginated.map((g, i) => {
              const isChecked = checkedKeys.includes(g.key);
              const examColor = getExamColor(g.exam);
              return (
                <tr key={g.key} style={{ borderBottom:'1px solid #f1f5f9', background: isChecked ? '#ecfdf5' : 'white' }}>
                  <td>
                    <div onClick={() => toggleOne(g.key)} style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {isChecked ? <CheckSquare size={15} color="#10b981" /> : <Square size={15} color="#94a3b8" />}
                    </div>
                  </td>
                  <td style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{(page-1)*perPage+i+1}</td>
                  <td style={{ fontWeight:700, color:'#10b981', fontSize:'0.8rem', fontFamily:'monospace' }}>{g.rollNo}</td>
                  <td>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.84rem' }}>{g.studentName}</div>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{g.academicYear}</div>
                  </td>
                  <td style={{ fontSize:'0.83rem', color:'#64748b' }}>{g.class}–{g.section}</td>
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
                      <div style={{ width:50, height:6, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(100,g.percentage)}%`, background: g.percentage>=75?'#10b981':g.percentage>=35?'#f59e0b':'#ef4444', borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:'0.8rem', fontWeight:700, color: g.percentage>=75?'#10b981':g.percentage>=35?'#f59e0b':'#ef4444' }}>{g.percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background: g.status==='Pass'?'#dcfce7':'#fee2e2', color: g.status==='Pass'?'#16a34a':'#dc2626' }}>
                      {g.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button title="View Subjects" className="btn btn-primary" style={{ padding:'5px 10px', background:'linear-gradient(135deg,#10b981,#059669)' }} onClick={() => setSelected(g)}>
                        <Eye size={12} /> View
                      </button>
                      <button title="Delete" className="btn btn-danger" style={{ padding:'5px 8px' }} onClick={() => setDeleteGroup(g)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <div style={{ padding:'10px 20px', borderTop:'1px solid #f1f5f9' }}>
          <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
        </div>
      </div>

      {/* View Modal - same structure as branch-admin */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={`${selected.exam} — ${selected.studentName}`} size="lg">
          <div style={{ display:'flex', alignItems:'center', gap:14, background:'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
            <div style={{ width:50, height:50, borderRadius:'50%', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.3rem', flexShrink:0 }}>
              {selected.studentName?.charAt(0)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'1rem' }}>{selected.studentName}</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2 }}>
                Roll No: {selected.rollNo} • {selected.class}–{selected.section} • {selected.academicYear}
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

          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Award size={18} color="#10b981" />
            <span style={{ fontWeight:700 }}>Exam:</span>
            <span style={{
              padding:'5px 14px', borderRadius:20, fontSize:'0.82rem', fontWeight:700,
              background: getExamColor(selected.exam).bg,
              color: getExamColor(selected.exam).text,
              border: `1px solid ${getExamColor(selected.exam).border}`
            }}>
              {selected.exam}
            </span>
          </div>

          <div style={{ border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#10b981' }}>
                  <th style={{ padding:'10px 14px', textAlign:'left', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Subject</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Marks</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Total</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>%</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Result</th>
                  <th style={{ padding:'10px 14px', textAlign:'center', color:'white', fontWeight:700, fontSize:'0.8rem' }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {selected.subjects.map((s, i) => {
                  const pctColor = s.percentage >= 75 ? '#10b981' : s.percentage >= 35 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={getId(s) || `subject-${i}`} style={{ background: i%2===0?'#fff':'#f8fafc' }}>
                      <td style={{ padding:'12px 14px', fontWeight:600 }}>{s.subject}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center', fontWeight:800, color:'#10b981', fontSize:'1rem' }}>{s.marksObtained}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center', color:'#64748b' }}>{s.totalMarks}</td>
                      <td style={{ padding:'12px 14px', textAlign:'center' }}>
                        <span style={{ fontWeight:700, color:pctColor }}>{s.percentage}%</span>
                      </td>
                      <td style={{ padding:'12px 14px', textAlign:'center' }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background: s.status==='Pass'?'#dcfce7':'#fee2e2', color: s.status==='Pass'?'#16a34a':'#dc2626' }}>
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding:'12px 14px', textAlign:'center' }}>
                        <button className="btn btn-outline" style={{ padding:'4px 8px', fontSize:'0.72rem' }} onClick={() => openEditSubject(s)}>
                          <Edit2 size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background:'#f1f5f9' }}>
                  <td style={{ padding:'12px 14px', fontWeight:800 }}>GRAND TOTAL</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', fontWeight:900, color:'#10b981', fontSize:'1.1rem' }}>{selected.totalObtained}</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', color:'#64748b', fontWeight:600 }}>{selected.totalMax}</td>
                  <td style={{ padding:'12px 14px', textAlign:'center', fontWeight:900, color: selected.percentage>=75?'#10b981':selected.percentage>=35?'#f59e0b':'#ef4444' }}>
                    {selected.percentage}%
                  </td>
                  <td style={{ padding:'12px 14px', textAlign:'center' }}>
                    <span style={{ padding:'4px 14px', borderRadius:20, fontSize:'0.78rem', fontWeight:700, background: selected.status==='Pass'?'#dcfce7':'#fee2e2', color: selected.status==='Pass'?'#16a34a':'#dc2626' }}>
                      {selected.status}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginTop:16 }}>
            {[
              { label: 'Subjects Passed', value: selected.subjects.filter(s => s.status === 'Pass').length, color: '#10b981' },
              { label: 'Subjects Failed', value: selected.subjects.filter(s => s.status === 'Fail').length, color: '#ef4444' },
              { label: 'Highest Score', value: Math.max(...selected.subjects.map(s => s.percentage)) + '%', color: '#10b981' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color }}>{value}</div>
                <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button className="btn btn-outline" onClick={() => {
              const html = buildReportPDF({ groupedReports: [selected], title: `${selected.studentName} - ${selected.exam}`, user, cls, section, exam: selected.exam });
              const win = window.open('', '_blank');
              win.document.write(html); win.document.close();
              setTimeout(() => win.print(), 600);
            }} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <FileDown size={13} /> Print Report
            </button>
            <button className="btn btn-primary" style={{ background:'linear-gradient(135deg,#10b981,#059669)' }} onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditReport(null); setError(''); }}
        title={editReport ? `Edit Report — ${editReport.subject}` : 'Add Subject Report'} size="md">
        <F label="Student" req>
          <select className="select" style={{ width:'100%' }} value={form.studentId}
            onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))} disabled={!!editReport}>
            <option value="">Select Student</option>
            {students.map((s, index) => (
              <option key={getId(s) || `student-${index}`} value={getId(s)}>
                {s.name} — {s.rollNo} ({s.class}–{s.section})
              </option>
            ))}
          </select>
        </F>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12 }}>
          <F label="Subject" req>
            <input className="input" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Mathematics" />
          </F>
          <F label="Exam Type" req>
            <select className="select" style={{ width:'100%' }} value={form.exam} onChange={e => setForm(p => ({ ...p, exam: e.target.value }))} disabled={!!editReport}>
              {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </F>
          <F label="Marks Obtained" req>
            <input className="input" type="number" min={0} value={form.marksObtained} onChange={e => setForm(p => ({ ...p, marksObtained: e.target.value }))} placeholder="e.g. 85" />
          </F>
          <F label="Total Marks">
            <input className="input" type="number" min={1} value={form.totalMarks} onChange={e => setForm(p => ({ ...p, totalMarks: e.target.value }))} />
          </F>
          <F label="Academic Year">
            <input className="input" value={form.academicYear} onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))} placeholder="e.g. 2025-26" />
          </F>
        </div>

        {pct !== null && (
          <div style={{ background: pct>=35?'#ecfdf5':'#fef2f2', border:`1px solid ${pct>=35?'#a7f3d0':'#fecaca'}`, borderRadius:10, padding:'10px 16px', marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:600, textTransform:'uppercase' }}>Live Preview</div>
              <div style={{ height:5, width:120, background:'#e2e8f0', borderRadius:3, marginTop:5, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background: pct>=75?'#10b981':pct>=35?'#f59e0b':'#ef4444', borderRadius:3 }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <span style={{ fontWeight:800, fontSize:'1.2rem', color: pct>=75?'#10b981':pct>=35?'#f59e0b':'#ef4444' }}>{pct}%</span>
              <span style={{ padding:'3px 12px', borderRadius:20, fontSize:'0.78rem', fontWeight:700, background: pct>=35?'#dcfce7':'#fee2e2', color: pct>=35?'#16a34a':'#dc2626' }}>
                {pct >= 35 ? 'Pass' : 'Fail'}
              </span>
            </div>
          </div>
        )}

        {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'9px 14px', borderRadius:9, fontSize:'0.83rem', marginTop:10 }}>⚠️ {error}</div>}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditReport(null); setError(''); }}>Cancel</button>
          <button className="btn btn-primary" style={{ background:'linear-gradient(135deg,#10b981,#059669)' }} onClick={saveReport} disabled={saving}>
            {saving ? 'Saving...' : editReport ? 'Update Report' : 'Save Report'}
          </button>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={showBulk} onClose={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }} title="Bulk Upload Reports" size="sm">
        <div style={{ textAlign:'center', padding:'4px 0 12px' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'#ecfdf5', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Upload size={22} color="#10b981" />
          </div>
          <p style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:10 }}>Upload CSV with columns:</p>
          <code style={{ background:'#f1f5f9', padding:'4px 10px', borderRadius:6, fontSize:'0.73rem' }}>
            rollno, subject, marks, totalmarks, exam, academicyear
          </code>
          <div style={{ marginTop:12 }}>
            <button onClick={downloadTemplate}
              style={{ background:'#ecfdf5', color:'#10b981', border:'none', borderRadius:8, padding:'7px 14px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
              <FileDown size={13} /> Download Template
            </button>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
          <F label="Default Exam Type">
            <select className="select" style={{ width:'100%' }} value={bulkExam} onChange={e => setBulkExam(e.target.value)}>
              {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </F>
          <F label="Default Academic Year">
            <input className="input" value={bulkYear} onChange={e => setBulkYear(e.target.value)} placeholder="2025-26" />
          </F>
        </div>

        <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display:'none' }} onChange={e => setBulkFile(e.target.files[0])} />
        <div onClick={() => fileRef.current?.click()}
          style={{ border:`2px dashed ${bulkFile?'#10b981':'#e2e8f0'}`, borderRadius:12, padding:20, cursor:'pointer', background: bulkFile?'#ecfdf5':'#fafbff', marginBottom:12, textAlign:'center' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#10b981'; }}
          onDragLeave={e => { e.currentTarget.style.borderColor = bulkFile?'#10b981':'#e2e8f0'; }}
          onDrop={e => { e.preventDefault(); setBulkFile(e.dataTransfer.files[0]); }}>
          {bulkFile
            ? <p style={{ color:'#10b981', fontWeight:700, fontSize:'0.84rem', margin:0 }}>✓ {bulkFile.name}</p>
            : <>
                <Upload size={20} color="#94a3b8" style={{ margin:'0 auto 6px', display:'block' }} />
                <p style={{ color:'#94a3b8', fontSize:'0.82rem', margin:0 }}>Click or drag & drop CSV / Excel</p>
              </>}
        </div>

        {bulkResult && (
          <div style={{ background: bulkResult.success?'#ecfdf5':'#fef2f2', border:`1px solid ${bulkResult.success?'#a7f3d0':'#fecaca'}`, borderRadius:10, padding:12, marginBottom:12, fontSize:'0.82rem' }}>
            <p style={{ fontWeight:700, color: bulkResult.success?'#059669':'#dc2626', marginBottom:6 }}>{bulkResult.message}</p>
            {bulkResult.inserted > 0 && <p style={{ color:'#64748b', margin:'2px 0' }}>✅ Saved: {bulkResult.inserted}</p>}
            {bulkResult.skipped  > 0 && <p style={{ color:'#64748b', margin:'2px 0' }}>⚠️ Skipped: {bulkResult.skipped}</p>}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }}>Close</button>
          <button className="btn btn-primary" style={{ background:'linear-gradient(135deg,#10b981,#059669)' }} onClick={handleBulkUpload} disabled={!bulkFile || bulkLoading}>
            {bulkLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </Modal>

      {/* Delete Modals */}
      <Modal open={!!deleteGroup} onClose={() => setDeleteGroup(null)} title="Delete All Subject Reports?" size="sm">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Trash2 size={20} color="#ef4444" />
          </div>
          {deleteGroup && (
            <div style={{ marginBottom:12 }}>
              <p style={{ fontWeight:700, marginBottom:4 }}>{deleteGroup.studentName}</p>
              <p style={{ color:'#64748b', fontSize:'0.82rem' }}>{deleteGroup.exam} — {deleteGroup.subjectCount} subject(s)</p>
            </div>
          )}
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>This will permanently delete all subject reports for this exam.</p>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteGroup(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteGroupReports}>Delete All</button>
        </div>
      </Modal>

      <Modal open={showMultiDel} onClose={() => setShowMultiDel(false)} title="Delete Selected Results?" size="sm">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Trash2 size={20} color="#ef4444" />
          </div>
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>
            Delete <strong>{checkedKeys.length} result(s)</strong> and all their subject reports?
          </p>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setShowMultiDel(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteMultiple} disabled={multiDeleting}>
            {multiDeleting ? 'Deleting...' : `Delete ${checkedKeys.length} Results`}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}