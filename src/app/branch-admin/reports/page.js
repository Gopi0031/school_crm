// src/app/branch-admin/reports/page.js
'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Plus, Upload, Eye, Trash2, Search, FileDown,
  X, Edit2, CheckSquare, Square, Loader
} from 'lucide-react';

const BLANK = {
  studentId: '', subject: '', marksObtained: '', totalMarks: 100,
  exam: 'Annual', academicYear: '2025-26',
};
const EXAMS    = ['Annual', 'Unit Test 1', 'Unit Test 2', 'Mid Term', 'Half Yearly'];
const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

function F({ label, req, children }) {
  return <FormField label={label} required={req}>{children}</FormField>;
}

// Helper to get ID safely
const getId = (item) => item?._id || item?.id || '';

// ── PDF Builder ────────────────────────────────────────────────────────────────
function buildReportPDF({ studentReports, title, user, cls, section, exam }) {
  const grouped = studentReports.reduce((acc, r) => {
    const key = r.studentName + '|' + r.rollNo;
    if (!acc[key]) acc[key] = { name: r.studentName, rollNo: r.rollNo, cls: r.class, section: r.section, subjects: [] };
    acc[key].subjects.push(r);
    return acc;
  }, {});

  const blocks = Object.values(grouped).map(st => {
    const totalObt = st.subjects.reduce((s, r) => s + Number(r.marksObtained), 0);
    const totalMax = st.subjects.reduce((s, r) => s + Number(r.totalMarks), 0);
    const pct      = totalMax ? Math.round(totalObt / totalMax * 100) : 0;
    const pass     = pct >= 35;
    const rows = st.subjects.map((r, i) => {
      const p  = r.percentage;
      const pc = p >= 75 ? '#16a34a' : p >= 35 ? '#f59e0b' : '#ef4444';
      return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0">${r.subject}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${r.marksObtained}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b">${r.totalMarks}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;color:${pc}">${p}%</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:center">
          <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${r.status==='Pass'?'#dcfce7':'#fee2e2'};color:${r.status==='Pass'?'#16a34a':'#dc2626'}">${r.status}</span>
        </td>
      </tr>`;
    }).join('');
    return `
      <div style="margin-bottom:24px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border-left:4px solid #4f46e5;padding:10px 14px;border-radius:0 8px 8px 0;margin-bottom:10px">
          <div>
            <div style="font-weight:800;font-size:14px;color:#1e293b">${st.name}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px">Roll No: ${st.rollNo} &nbsp;•&nbsp; ${st.cls} — Section ${st.section}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:800;color:${pct>=75?'#10b981':pct>=35?'#f59e0b':'#ef4444'}">${pct}%</div>
            <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${pass?'#dcfce7':'#fee2e2'};color:${pass?'#16a34a':'#dc2626'}">${pass?'PASS':'FAIL'}</span>
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
            <td style="padding:8px 10px;font-weight:800">TOTAL</td>
            <td style="padding:8px 10px;text-align:center;font-weight:800;color:#4f46e5">${totalObt}</td>
            <td style="padding:8px 10px;text-align:center;color:#64748b">${totalMax}</td>
            <td style="padding:8px 10px;text-align:center;font-weight:800;color:${pct>=75?'#10b981':pct>=35?'#f59e0b':'#ef4444'}">${pct}%</td>
            <td style="padding:8px 10px;text-align:center">
              <span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${pass?'#dcfce7':'#fee2e2'};color:${pass?'#16a34a':'#dc2626'}">${pass?'PASS':'FAIL'}</span>
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
      <div style="font-size:20px;font-weight:800">📊 SchoolERP — Academic Report</div>
      <div style="font-size:12px;opacity:0.85;margin-top:4px">${user?.branch} &nbsp;•&nbsp; ${cls||'All Classes'} ${section?'— Section '+section:''} ${exam?'• '+exam:''}</div>
    </div>
    <div style="text-align:right;font-size:12px;opacity:0.9">
      <div>Branch Admin: <b>${user?.name}</b></div>
      <div>Generated: ${new Date().toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
    </div>
  </div>
  ${blocks}
  <div class="footer">
    <span>SchoolERP &nbsp;•&nbsp; ${user?.branch}</span>
    <span>Total Students: ${Object.keys(grouped).length} &nbsp;•&nbsp; Printed on ${new Date().toLocaleString('en-IN')}</span>
  </div>
  </body></html>`;
}

export default function BranchAdminReports() {
  const { user } = useAuth();
  const fileRef  = useRef();

  const [reports, setReports]       = useState([]);
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cls, setCls]               = useState('');
  const [section, setSection]       = useState('');
  const [exam, setExam]             = useState('');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [showAdd, setShowAdd]       = useState(false);
  const [showBulk, setShowBulk]     = useState(false);
  const [editReport, setEditReport] = useState(null);
  const [form, setForm]             = useState(BLANK);
  const [selected, setSelected]     = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [checkedIds, setCheckedIds] = useState([]);
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

  // ── Load ──────────────────────────────────────────────────
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

  const filtered = useMemo(() => reports.filter(r =>
    !search ||
    r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    r.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [reports, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Checkbox helpers ──────────────────────────────────────
  const allPageChecked = paginated.length > 0 && paginated.every(r => checkedIds.includes(getId(r)));
  const toggleAll = () => {
    const pageIds = paginated.map(r => getId(r));
    if (allPageChecked) setCheckedIds(prev => prev.filter(id => !pageIds.includes(id)));
    else setCheckedIds(prev => [...new Set([...prev, ...pageIds])]);
  };
  const toggleOne = (id) =>
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // ── PDF exports ───────────────────────────────────────────
  const exportAllPDF = () => {
    if (!filtered.length) return;
    setExportingAll(true);
    const html = buildReportPDF({ studentReports: filtered, title: 'All Reports', user, cls, section, exam });
    const win = window.open('', '_blank');
    win.document.write(html); win.document.close();
    setTimeout(() => { win.print(); setExportingAll(false); }, 600);
  };

  const exportSelectedPDF = () => {
    if (!checkedIds.length) return;
    setExportingSel(true);
    const sel  = reports.filter(r => checkedIds.includes(getId(r)));
    const html = buildReportPDF({ studentReports: sel, title: 'Selected Reports', user, cls, section, exam });
    const win  = window.open('', '_blank');
    win.document.write(html); win.document.close();
    setTimeout(() => { win.print(); setExportingSel(false); }, 600);
  };

  // ── Save / Update ─────────────────────────────────────────
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
      const url    = editReport ? `/api/reports/${getId(editReport)}` : '/api/reports';
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, branch: user?.branch }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Something went wrong'); return; }
      showToast(`Report ${editReport ? 'updated' : 'saved'} successfully`);
      setShowAdd(false); setEditReport(null); setForm(BLANK); load();
    } finally { setSaving(false); }
  };

  const openEdit = (r) => {
    setEditReport(r);
    setForm({ 
      studentId: r.studentId, 
      subject: r.subject, 
      marksObtained: r.marksObtained, 
      totalMarks: r.totalMarks, 
      exam: r.exam, 
      academicYear: r.academicYear 
    });
    setError(''); 
    setShowAdd(true);
  };

  // ── Delete single ─────────────────────────────────────────
  const deleteReport = async () => {
    try {
      const r = await fetch(`/api/reports/${deleteId}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) { showToast(d.error || 'Delete failed', 'error'); return; }
      showToast('Report deleted');
      setCheckedIds(prev => prev.filter(id => id !== deleteId));
    } finally { setDeleteId(null); load(); }
  };

  // ── Delete multiple ───────────────────────────────────────
  const deleteMultiple = async () => {
    setMultiDeleting(true);
    try {
      const r = await fetch('/api/reports/bulk-delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: checkedIds }),
      });
      const d = await r.json();
      if (d.success) { showToast(`${checkedIds.length} report(s) deleted`); setCheckedIds([]); setShowMultiDel(false); load(); }
      else showToast(d.error || 'Delete failed', 'error');
    } finally { setMultiDeleting(false); }
  };

  // ── Bulk upload ───────────────────────────────────────────
  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    const fd = new FormData();
    fd.append('file', bulkFile);
    fd.append('branch', user?.branch || '');
    fd.append('exam', bulkExam);
    fd.append('academicYear', bulkYear);
    try {
      const r    = await fetch('/api/reports/bulk-upload', { method: 'POST', body: fd });
      const text = await r.text();
      let d;
      try { d = JSON.parse(text); }
      catch { setBulkResult({ success: false, message: `Server error: ${text.slice(0,100)}` }); return; }
      setBulkResult(d);
      if (d.success) { load(); showToast(`${d.inserted} report(s) uploaded`); }
    } catch (err) {
      setBulkResult({ success: false, message: `Network error: ${err.message}` });
    } finally { setBulkLoading(false); }
  };

  const downloadTemplate = () => {
    const csv = ['rollno,subject,marks,totalmarks,exam,academicyear','2025001,Mathematics,85,100,Annual,2025-26','2025002,Science,72,100,Annual,2025-26'].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'reports_template.csv'; a.click();
  };

  const pct = form.marksObtained && form.totalMarks
    ? Math.round(Number(form.marksObtained) / Number(form.totalMarks) * 100)
    : null;

  const passCount = reports.filter(r => r.status === 'Pass').length;
  const failCount = reports.length - passCount;
  const avgPct    = reports.length
    ? Math.round(reports.reduce((s, r) => s + (r.percentage || 0), 0) / reports.length)
    : 0;

  return (
    <AppLayout requiredRole="branch-admin">
      <style jsx global>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast.msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type==='error'?'#ef4444':'#10b981', color:'white', padding:'12px 20px', borderRadius:12, fontWeight:600, fontSize:'0.875rem', boxShadow:'0 8px 28px rgba(0,0,0,0.18)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.msg}
          <button onClick={() => setToast({ msg:'' })} style={{ background:'transparent', border:'none', cursor:'pointer', color:'white', padding:0, display:'flex' }}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Reports" subtitle="Student academic results">
        <button className="btn btn-outline" onClick={exportAllPDF} disabled={exportingAll || !filtered.length}
          style={{ display:'flex', alignItems:'center', gap:6 }}>
          {exportingAll
            ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Preparing...</>
            : <><FileDown size={13} /> Export All PDF</>}
        </button>

        {checkedIds.length > 0 && (
          <>
            <button className="btn btn-outline" onClick={exportSelectedPDF} disabled={exportingSel}
              style={{ display:'flex', alignItems:'center', gap:6, color:'#4f46e5', borderColor:'#4f46e5' }}>
              {exportingSel
                ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Preparing...</>
                : <><FileDown size={13} /> Export Selected ({checkedIds.length})</>}
            </button>
            <button className="btn btn-danger" onClick={() => setShowMultiDel(true)}
              style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Trash2 size={13} /> Delete ({checkedIds.length})
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

      {/* ── Summary Cards ─────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { l:'Total Records', v: reports.length, c:'#4f46e5' },
          { l:'Pass',          v: passCount,       c:'#10b981' },
          { l:'Fail',          v: failCount,       c:'#ef4444' },
          { l:'Avg Score',     v: `${avgPct}%`,    c:'#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign:'center', borderTop:`3px solid ${c}`, padding:14 }}>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────── */}
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
            {filtered.length} records
          </span>
        </div>
      </div>

      {/* ── Selection bar ─────────────────────────────────── */}
      {checkedIds.length > 0 && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:10, padding:'10px 16px', marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.83rem' }}>
          <span style={{ color:'#1d4ed8', fontWeight:600 }}>✓ {checkedIds.length} report(s) selected — Export or Delete</span>
          <button onClick={() => setCheckedIds([])} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.78rem' }}>Clear</button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th style={{ width:36 }}>
                <div onClick={toggleAll} style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {allPageChecked ? <CheckSquare size={16} color="#4f46e5" /> : <Square size={16} color="#94a3b8" />}
                </div>
              </th>
              <th>S.No</th><th>Roll No</th><th>Student</th><th>Class</th>
              <th>Subject</th><th>Marks</th><th>Total</th><th>Score</th>
              <th>Result</th><th>Exam</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ textAlign:'center', padding:52 }}>
                <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#4f46e5', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
                <span style={{ color:'#94a3b8', fontSize:'0.83rem' }}>Loading reports...</span>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={12}><EmptyState message="No reports found. Add reports or adjust filters." /></td></tr>
            ) : paginated.map((r, i) => {
              const reportId = getId(r);
              const isChecked = checkedIds.includes(reportId);
              return (
                <tr key={reportId || `report-${i}`} style={{ borderBottom:'1px solid #f1f5f9', background: isChecked ? '#f5f3ff' : 'white', transition:'background 0.15s' }}>
                  <td>
                    <div onClick={() => toggleOne(reportId)} style={{ cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {isChecked ? <CheckSquare size={15} color="#4f46e5" /> : <Square size={15} color="#94a3b8" />}
                    </div>
                  </td>
                  <td style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{(page-1)*perPage+i+1}</td>
                  <td style={{ fontWeight:700, color:'#4f46e5', fontSize:'0.8rem' }}>{r.rollNo}</td>
                  <td>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.84rem' }}>{r.studentName}</div>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8' }}>{r.academicYear}</div>
                  </td>
                  <td style={{ fontSize:'0.83rem', color:'#64748b' }}>{r.class}–{r.section}</td>
                  <td style={{ fontSize:'0.83rem', fontWeight:600 }}>{r.subject}</td>
                  <td style={{ fontWeight:800, color:'#1e293b' }}>{r.marksObtained}</td>
                  <td style={{ color:'#64748b' }}>{r.totalMarks}</td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:42, height:5, background:'#f1f5f9', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.min(100,r.percentage)}%`, background: r.percentage>=75?'#10b981':r.percentage>=35?'#f59e0b':'#ef4444', borderRadius:3 }} />
                      </div>
                      <span style={{ fontSize:'0.75rem', fontWeight:700, color: r.percentage>=75?'#10b981':r.percentage>=35?'#f59e0b':'#ef4444' }}>{r.percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background: r.status==='Pass'?'#dcfce7':'#fee2e2', color: r.status==='Pass'?'#16a34a':'#dc2626' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize:'0.78rem', color:'#64748b' }}>{r.exam}</td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button title="View"   className="btn btn-primary" style={{ padding:'4px 7px' }} onClick={() => setSelected(r)}><Eye size={11} /></button>
                      <button title="Edit"   className="btn btn-outline" style={{ padding:'4px 7px' }} onClick={() => openEdit(r)}><Edit2 size={11} /></button>
                      <button title="Delete" className="btn btn-danger"  style={{ padding:'4px 7px' }} onClick={() => setDeleteId(reportId)}><Trash2 size={11} /></button>
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

      {/* ── Add / Edit Modal ──────────────────────────────── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditReport(null); setError(''); }}
        title={editReport ? `Edit Report — ${editReport.studentName}` : 'Add Student Report'} size="md">
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
          <F label="Exam Type">
            <select className="select" style={{ width:'100%' }} value={form.exam} onChange={e => setForm(p => ({ ...p, exam: e.target.value }))}>
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
          <div style={{ background: pct>=35?'#f0fdf4':'#fef2f2', border:`1px solid ${pct>=35?'#bbf7d0':'#fecaca'}`, borderRadius:10, padding:'10px 16px', marginTop:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
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
          <button className="btn btn-primary" onClick={saveReport} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6 }}>
            {saving
              ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Saving...</>
              : editReport ? 'Update Report' : 'Save Report'}
          </button>
        </div>
      </Modal>

      {/* ── Bulk Upload Modal ─────────────────────────────── */}
      <Modal open={showBulk} onClose={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }} title="Bulk Upload Reports" size="sm">
        <div style={{ textAlign:'center', padding:'4px 0 12px' }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'#f0f9ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Upload size={22} color="#0891b2" />
          </div>
          <p style={{ fontSize:'0.82rem', color:'#64748b', marginBottom:10 }}>Upload CSV with columns:</p>
          <code style={{ background:'#f1f5f9', padding:'4px 10px', borderRadius:6, fontSize:'0.73rem' }}>
            rollno, subject, marks, totalmarks, exam, academicyear
          </code>
          <div style={{ marginTop:12 }}>
            <button onClick={downloadTemplate}
              style={{ background:'#f0f9ff', color:'#0891b2', border:'none', borderRadius:8, padding:'7px 14px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}>
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
          style={{ border:`2px dashed ${bulkFile?'#10b981':'#e2e8f0'}`, borderRadius:12, padding:20, cursor:'pointer', background: bulkFile?'#f0fdf4':'#fafbff', marginBottom:12, textAlign:'center', transition:'all 0.2s' }}
          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#0891b2'; }}
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
          <div style={{ background: bulkResult.success?'#f0fdf4':'#fef2f2', border:`1px solid ${bulkResult.success?'#bbf7d0':'#fecaca'}`, borderRadius:10, padding:12, marginBottom:12, fontSize:'0.82rem' }}>
            <p style={{ fontWeight:700, color: bulkResult.success?'#15803d':'#dc2626', marginBottom:6 }}>{bulkResult.message}</p>
            {bulkResult.inserted > 0 && <p style={{ color:'#64748b', margin:'2px 0' }}>✅ Saved: {bulkResult.inserted}</p>}
            {bulkResult.skipped  > 0 && <p style={{ color:'#64748b', margin:'2px 0' }}>⚠️ Skipped: {bulkResult.skipped}</p>}
            {bulkResult.errors?.slice(0,4).map((e,i) => (
              <p key={`bulk-error-${i}`} style={{ color:'#ef4444', fontSize:'0.75rem', margin:'2px 0' }}>• Row {e.row}: {e.reason}</p>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }}>Close</button>
          <button className="btn btn-primary" onClick={handleBulkUpload} disabled={!bulkFile || bulkLoading}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            {bulkLoading
              ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Uploading...</>
              : 'Upload'}
          </button>
        </div>
      </Modal>

      {/* ── View Modal ────────────────────────────────────── */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title={`Report — ${selected.studentName}`} size="sm">
          <div style={{ display:'flex', alignItems:'center', gap:12, background:'linear-gradient(135deg,#eff6ff,#e0f2fe)', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.1rem', flexShrink:0 }}>
              {selected.studentName?.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{selected.studentName}</div>
              <div style={{ fontSize:'0.72rem', color:'#64748b' }}>{selected.rollNo} • {selected.class}–{selected.section}</div>
            </div>
            <span style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:20, fontSize:'0.73rem', fontWeight:700, background: selected.status==='Pass'?'#dcfce7':'#fee2e2', color: selected.status==='Pass'?'#16a34a':'#dc2626' }}>
              {selected.status}
            </span>
          </div>

          <div style={{ background:'#f8fafc', borderRadius:10, padding:'14px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>Score</div>
              <div style={{ fontWeight:800, fontSize:'1.4rem', color:'#1e293b' }}>
                {selected.marksObtained} <span style={{ fontSize:'0.9rem', color:'#64748b', fontWeight:400 }}>/ {selected.totalMarks}</span>
              </div>
            </div>
            <div style={{ fontWeight:800, fontSize:'2rem', color: selected.percentage>=75?'#10b981':selected.percentage>=35?'#f59e0b':'#ef4444' }}>
              {selected.percentage}%
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
            {[['Subject',selected.subject],['Exam',selected.exam],['Year',selected.academicYear],['Class',`${selected.class}–${selected.section}`]].map(([l,v]) => (
              <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{l}</div>
                <div style={{ fontWeight:600, fontSize:'0.84rem', marginTop:2 }}>{v||'—'}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between' }}>
            <button className="btn btn-outline" style={{ fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }} onClick={() => { setSelected(null); openEdit(selected); }}>
              <Edit2 size={12} /> Edit
            </button>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Single Delete Confirm ─────────────────────────── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Report?" size="sm">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Trash2 size={20} color="#ef4444" />
          </div>
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>This will permanently delete the report. This cannot be undone.</p>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteReport}>Delete</button>
        </div>
      </Modal>

      {/* ── Multi Delete Confirm ──────────────────────────── */}
      <Modal open={showMultiDel} onClose={() => setShowMultiDel(false)} title="Delete Selected Reports?" size="sm">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
            <Trash2 size={20} color="#ef4444" />
          </div>
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>
            You are about to delete <strong style={{ color:'#1e293b' }}>{checkedIds.length} report(s)</strong>. This cannot be undone.
          </p>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setShowMultiDel(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteMultiple} disabled={multiDeleting}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            {multiDeleting
              ? <><div style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block' }} /> Deleting...</>
              : `Delete ${checkedIds.length} Reports`}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}