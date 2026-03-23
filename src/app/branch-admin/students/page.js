'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Plus, Trash2, Edit2, Search, Printer, FileDown, Upload, ClipboardList, X } from 'lucide-react';

const BLANK = {
  name:'', rollNo:'', class:'', section:'', gender:'Male', bloodGroup:'',
  caste:'', aadhaar:'', address:'', parentName:'', phone:'', email:'',
  academicYear:'2025-26', yearOfJoining:'', dateOfJoining:'', totalFee:'',
  username:'', password:'', confirmPassword:'',
};

const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];
const TABS     = ['Details','Attendance','Fee','Reports','Parent'];

function F({ label, req, children }) {
  return <FormField label={label} required={req}>{children}</FormField>;
}

function SortTh({ field, sortField, sortDir, onToggle, children }) {
  const active = sortField === field;
  return (
    <th onClick={() => onToggle(field)} style={{ cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
      <span style={{ display:'flex', alignItems:'center', gap:4 }}>
        {children}
        <span style={{ fontSize:10, opacity: active ? 1 : 0.3 }}>{active && sortDir === 'asc' ? '↑' : '↓'}</span>
      </span>
    </th>
  );
}

export default function BranchAdminStudents() {
  const { user } = useAuth();

  const [students, setStudents]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cls, setCls]                   = useState('');
  const [section, setSection]           = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);
  const [showAdd, setShowAdd]           = useState(false);
  const [editStudent, setEditStudent]   = useState(null);
  const [selected, setSelected]         = useState(null);
  const [selectedTab, setSelectedTab]   = useState('details');
  const [deleteId, setDeleteId]         = useState(null);
  const [form, setForm]                 = useState(BLANK);
  const [error, setError]               = useState('');
  const [toast, setToast]               = useState({ msg:'', type:'success' });
  const [saving, setSaving]             = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [showBulk, setShowBulk]         = useState(false);
  const [bulkFile, setBulkFile]         = useState(null);
  const [bulkResult, setBulkResult]     = useState(null);
  const [bulkLoading, setBulkLoading]   = useState(false);
  const [sortField, setSortField]       = useState('name');
  const [sortDir, setSortDir]           = useState('asc');

  // ── Multi-edit state ──
  const [checkedIds, setCheckedIds]     = useState(new Set());
  const [multiEdit, setMultiEdit]       = useState(false);
  const [multiForm, setMultiForm]       = useState({ class:'', section:'', academicYear:'', status:'' });
  const [multiSaving, setMultiSaving]   = useState(false);

  const fileRef = useRef();
  const perPage = 10;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3500);
  };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('branch', user?.branch || '');
    if (cls)     params.set('class', cls);
    if (section) params.set('section', section);   // ✅ sends "A" not "Section A"
    const r = await fetch(`/api/students?${params}`);
    const d = await r.json();
    if (d.success) setStudents(d.data);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, cls, section]);

  const filtered = useMemo(() => {
    let arr = students.filter(s =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(search.toLowerCase())
    );
    arr = [...arr].sort((a, b) => {
      const va = a[sortField] || '';
      const vb = b[sortField] || '';
      return sortDir === 'asc'
        ? va.toString().localeCompare(vb.toString())
        : vb.toString().localeCompare(va.toString());
    });
    return arr;
  }, [students, search, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const saveStudent = async () => {
    setError('');
    if (!form.name || !form.rollNo || !form.class || !form.section) {
      setError('Name, Roll No, Class and Section are required'); return;
    }
    if (!editStudent && form.password && form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (editStudent && form.password) {
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    }
    setSaving(true);
    try {
      const payload = { ...form, branch: user?.branch, branchId: user?.branchId };
      const method  = editStudent ? 'PUT' : 'POST';
      const url     = editStudent ? `/api/students/${editStudent.id}` : '/api/students';
      const r = await fetch(url, { method, headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Something went wrong'); return; }
      if (!editStudent && form.username && form.password) {
        setCreatedCreds({ username: form.username, password: form.password, rollNo: form.rollNo });
      }
      showToast(`✓ Student ${editStudent ? 'updated' : 'added'} successfully`);
      setShowAdd(false); setEditStudent(null); setForm(BLANK); load();
    } finally { setSaving(false); }
  };

  const deleteStudent = async () => {
    await fetch(`/api/students/${deleteId}`, { method:'DELETE' });
    showToast('Student removed'); setDeleteId(null); load();
  };

 const openEdit = async (s) => {
  // ✅ Fetch full student data
  const res = await fetch(`/api/students/${s.id}`);
  const data = await res.json();
  const student = data.success ? data.data : s;
  
  setEditStudent(student);
  setForm({
    name: student.name,
    rollNo: student.rollNo,
    class: student.class,
    section: student.section,
    gender: student.gender || 'Male',
    bloodGroup: student.bloodGroup || '',
    caste: student.caste || '',
    aadhaar: student.aadhaar || '',
    address: student.address || '',
    parentName: student.parentName || '',
    phone: student.phone || '',
    email: student.email || '',
    academicYear: student.academicYear || '2025-26',
    yearOfJoining: student.yearOfJoining || '',
    dateOfJoining: student.dateOfJoining || '',
    totalFee: student.totalFee || '',
    username: student.username || '', // ✅ Username is directly on student
    password: '',
    confirmPassword: '',
  });
  setShowAdd(true);
  setError('');
};
  // ── Multi-edit save ──
  const saveMultiEdit = async () => {
    if (!checkedIds.size) return;
    const updates = Object.fromEntries(Object.entries(multiForm).filter(([, v]) => v !== ''));
    if (!Object.keys(updates).length) { showToast('Select at least one field to update', 'error'); return; }
    setMultiSaving(true);
    await Promise.all([...checkedIds].map(id =>
      fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
    ));
    showToast(`✓ ${checkedIds.size} student(s) updated`);
    setCheckedIds(new Set());
    setMultiEdit(false);
    setMultiForm({ class:'', section:'', academicYear:'', status:'' });
    setMultiSaving(false);
    load();
  };

  const handlePrint = () => {
    const rows = filtered.map((s, i) => `
      <tr><td>${i+1}</td><td>${s.rollNo}</td><td>${s.name}</td>
      <td>${s.class} – ${s.section}</td><td>${s.parentName}</td>
      <td>${s.phone}</td><td>${s.yearOfJoining||''}</td><td>${s.status||'Active'}</td></tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Students — ${user?.branch}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}
      table{width:100%;border-collapse:collapse;margin-top:14px}
      th{background:#f1f5f9;padding:8px 10px;text-align:left;border:1px solid #e2e8f0}
      td{padding:7px 10px;border:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}</style>
      </head><body><h2>Student Details — ${user?.branch}</h2>
      <p>Class: ${cls||'All'} | Section: ${section||'All'} | Total: ${filtered.length}</p>
      <table><thead><tr><th>S.No</th><th>Roll No</th><th>Name</th><th>Class</th>
      <th>Parent</th><th>Phone</th><th>Joining</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    win.document.close(); win.print();
  };

  const handleExport = () => {
    const header = ['S.No','Roll No','Name','Class','Section','Parent Name','Phone','Email','Year of Joining','Total Fee','Status'];
    const rows   = filtered.map((s, i) => [i+1, s.rollNo, s.name, s.class, s.section, s.parentName, s.phone, s.email||'', s.yearOfJoining||'', s.totalFee||'', s.status||'Active']);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `students_${user?.branch}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);
    formData.append('branch', user.branch);
    formData.append('branchId', user.branchId);
    try {
      const r    = await fetch('/api/students/bulk-upload', { method:'POST', body: formData });
      const text = await r.text();
      if (!text) { setBulkResult({ success:false, message:'Server returned empty response.' }); return; }
      let d;
      try { d = JSON.parse(text); } catch { setBulkResult({ success:false, message:`Invalid response: ${text.slice(0,100)}` }); return; }
      setBulkResult(d);
      if (d.success) { load(); showToast(`✓ ${d.inserted} student(s) uploaded`); }
    } catch (err) {
      setBulkResult({ success:false, message:`Network error: ${err.message}` });
    } finally { setBulkLoading(false); }
  };

  const getFeeStatus = (s) => {
    const pct = s.totalFee ? Math.round((s.paidFee||0) / s.totalFee * 100) : 0;
    if (pct >= 100) return { label:'Paid',    color:'#10b981' };
    if (pct > 0)    return { label:'Partial', color:'#f59e0b' };
    return              { label:'Pending', color:'#ef4444' };
  };

  return (
    <AppLayout requiredRole="branch-admin">

      {toast.msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type==='error'?'#ef4444':'#10b981', color:'white', padding:'12px 20px', borderRadius:12, fontWeight:600, fontSize:'0.875rem', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:8 }}>
          {toast.msg}
          <button onClick={() => setToast({ msg:'' })} style={{ background:'transparent', border:'none', cursor:'pointer', color:'white', padding:0, marginLeft:4 }}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Student Details" subtitle={`${filtered.length} students — ${user?.branch}`}>
        <button className="btn btn-outline" onClick={handlePrint}><Printer size={14} /> Print</button>
        <button className="btn btn-outline" onClick={handleExport}><FileDown size={14} /> Export</button>
        <button className="btn btn-outline" onClick={() => setShowBulk(true)}><Upload size={14} /> Bulk Upload</button>
        <button className="btn btn-primary" onClick={() => { setEditStudent(null); setForm(BLANK); setError(''); setShowAdd(true); }}>
          <Plus size={14} /> Add Student
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="card" style={{ marginBottom:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" style={{ maxWidth:150 }} value={cls} onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* ✅ value="A" not "Section A" — fixes section filter bug */}
          <select className="select" style={{ maxWidth:140 }} value={section} onChange={e => { setSection(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>

          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f8fafc', borderRadius:9, padding:'7px 12px', border:'1.5px solid #e2e8f0', flex:1, minWidth:180, maxWidth:300 }}>
            <Search size={14} color="#94a3b8" />
            <input style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.83rem', flex:1 }}
              placeholder="Search name or roll no..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <span style={{ fontSize:'0.78rem', color:'#94a3b8', marginLeft:'auto' }}>Showing {paginated.length} of {filtered.length}</span>
        </div>
      </div>

      {/* ── Multi-edit toolbar ── */}
      {checkedIds.size > 0 && (
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'12px 18px', marginBottom:12, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontWeight:700, color:'#1d4ed8', fontSize:'0.84rem' }}>✏️ {checkedIds.size} selected</span>
          {multiEdit ? (
            <>
              <select className="select" style={{ maxWidth:130 }} value={multiForm.class}
                onChange={e => setMultiForm(p => ({ ...p, class: e.target.value }))}>
                <option value="">Class (no change)</option>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="select" style={{ maxWidth:130 }} value={multiForm.section}
                onChange={e => setMultiForm(p => ({ ...p, section: e.target.value }))}>
                <option value="">Section (no change)</option>
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
              <select className="select" style={{ maxWidth:130 }} value={multiForm.status}
                onChange={e => setMultiForm(p => ({ ...p, status: e.target.value }))}>
                <option value="">Status (no change)</option>
                <option>Active</option><option>Inactive</option>
              </select>
              <input className="input" style={{ maxWidth:120 }} placeholder="Academic Year"
                value={multiForm.academicYear}
                onChange={e => setMultiForm(p => ({ ...p, academicYear: e.target.value }))} />
              <button className="btn btn-primary" onClick={saveMultiEdit} disabled={multiSaving}>
                {multiSaving ? 'Saving...' : `Update ${checkedIds.size} students`}
              </button>
              <button className="btn btn-outline" onClick={() => { setMultiEdit(false); setMultiForm({ class:'', section:'', academicYear:'', status:'' }); }}>Cancel</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" style={{ borderColor:'#3b82f6', color:'#3b82f6' }}
                onClick={() => setMultiEdit(true)}><Edit2 size={13} /> Bulk Edit</button>
              <button className="btn btn-outline" style={{ borderColor:'#ef4444', color:'#ef4444' }}
                onClick={() => setCheckedIds(new Set())}>Clear Selection</button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th>
                <input type="checkbox"
                  checked={checkedIds.size === paginated.length && paginated.length > 0}
                  onChange={e => {
                    if (e.target.checked) setCheckedIds(new Set(paginated.map(s => s.id)));
                    else setCheckedIds(new Set());
                  }} />
              </th>
              <th>S.No</th><th>Status</th>
              <SortTh field="rollNo"        sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Roll No</SortTh>
              <SortTh field="name"          sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Name</SortTh>
              <SortTh field="class"         sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Class</SortTh>
              <th>Parent</th><th>Phone</th>
              <SortTh field="yearOfJoining" sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Joining</SortTh>
              <th>Fee</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading">
                <td colSpan={11} style={{ textAlign:'center', padding:48 }}>
                  <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#0891b2', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
                  <span style={{ color:'#94a3b8', fontSize:'0.83rem' }}>Loading students...</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr key="empty">
                <td colSpan={11}><EmptyState message="No students found. Try adjusting filters." /></td>
              </tr>
            ) : paginated.map((s, i) => {
              const fee = getFeeStatus(s);
              return (
                <tr key={s.id} style={{ background: checkedIds.has(s.id) ? '#eff6ff' : undefined }}>
                  <td>
                    <input type="checkbox"
                      checked={checkedIds.has(s.id)}
                      onChange={e => {
                        const next = new Set(checkedIds);
                        e.target.checked ? next.add(s.id) : next.delete(s.id);
                        setCheckedIds(next);
                      }} />
                  </td>
                  <td style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{(page - 1) * perPage + i + 1}</td>
                  <td><Badge>{s.status || 'Active'}</Badge></td>
                  <td style={{ fontWeight:700, color:'#0891b2', fontSize:'0.8rem' }}>{s.rollNo}</td>
                  <td>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.84rem' }}>{s.name}</div>
                    <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{s.gender}</div>
                  </td>
                  <td style={{ fontSize:'0.83rem' }}>{s.class} — {s.section}</td>
                  <td style={{ fontSize:'0.83rem' }}>{s.parentName}</td>
                  <td style={{ fontSize:'0.83rem' }}>{s.phone}</td>
                  <td style={{ fontSize:'0.83rem' }}>{s.yearOfJoining || '—'}</td>
                  <td>
                    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.73rem', fontWeight:700, background:`${fee.color}18`, color:fee.color }}>
                      {fee.label}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:5 }}>
                      <button title="View" className="btn btn-primary" style={{ padding:'4px 9px', fontSize:'0.72rem' }}
                        onClick={() => { setSelected(s); setSelectedTab('details'); }}>
                        <Eye size={12} />
                      </button>
                      <button title="Attendance" className="btn btn-outline" style={{ padding:'4px 9px', fontSize:'0.72rem', borderColor:'#a5b4fc', color:'#4f46e5' }}
                        onClick={() => { setSelected(s); setSelectedTab('attendance'); }}>
                        <ClipboardList size={12} />
                      </button>
                      <button title="Edit" className="btn btn-outline" style={{ padding:'4px 9px', fontSize:'0.72rem' }}
                        onClick={() => openEdit(s)}>
                        <Edit2 size={12} />
                      </button>
                      <button title="Delete" className="btn btn-danger" style={{ padding:'4px 9px', fontSize:'0.72rem' }}
                        onClick={() => setDeleteId(s.id)}>
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

      {/* ── Add / Edit Modal ── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditStudent(null); setError(''); }}
        title={editStudent ? `Edit — ${editStudent.name}` : 'Add New Student'} size="lg">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <F label="Full Name" req>
            <input className="input" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Student full name" />
          </F>
          <F label="Roll Number" req>
            <input className="input" value={form.rollNo}
              onChange={e => setForm(p => ({ ...p, rollNo: e.target.value }))}
              placeholder="e.g. 2025001" />
          </F>
          <F label="Class" req>
            <select className="select" value={form.class}
              onChange={e => setForm(p => ({ ...p, class: e.target.value }))}>
              <option value="">Select class</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Section" req>
            <select className="select" value={form.section}
              onChange={e => setForm(p => ({ ...p, section: e.target.value }))}>
              <option value="">Select section</option>
              {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </F>
          <F label="Gender">
            <select className="select" value={form.gender}
              onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </F>
          <F label="Blood Group">
            <input className="input" value={form.bloodGroup}
              onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}
              placeholder="e.g. O+" />
          </F>
          <F label="Parent Name">
            <input className="input" value={form.parentName}
              onChange={e => setForm(p => ({ ...p, parentName: e.target.value }))}
              placeholder="Father / Mother name" />
          </F>
          <F label="Phone">
            <input className="input" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="10-digit mobile" />
          </F>
          <F label="Email">
            <input className="input" type="email" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="parent@email.com" />
          </F>
          <F label="Total Fee (₹)">
            <input className="input" type="number" value={form.totalFee}
              onChange={e => setForm(p => ({ ...p, totalFee: e.target.value }))} />
          </F>
          <F label="Year of Joining">
            <input className="input" value={form.yearOfJoining}
              onChange={e => setForm(p => ({ ...p, yearOfJoining: e.target.value }))}
              placeholder="e.g. 2025" />
          </F>
          <F label="Academic Year">
            <input className="input" value={form.academicYear}
              onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))} />
          </F>
          <F label="Caste">
            <input className="input" value={form.caste}
              onChange={e => setForm(p => ({ ...p, caste: e.target.value }))} />
          </F>
          <F label="Aadhaar">
            <input className="input" value={form.aadhaar}
              onChange={e => setForm(p => ({ ...p, aadhaar: e.target.value }))}
              maxLength={12} placeholder="12-digit aadhaar" />
          </F>
          <div style={{ gridColumn:'1/-1' }}>
            <F label="Address">
              <textarea className="input" rows={2} value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                style={{ resize:'vertical' }} />
            </F>
          </div>

          {/* ── Login Credentials ── */}
          <div style={{ gridColumn:'1/-1', borderTop:'1px solid #f1f5f9', paddingTop:12, marginTop:4 }}>
            <p style={{ fontWeight:700, fontSize:'0.875rem', color:'#374151', marginBottom:8 }}>
              🔐 Student Login
            </p>
          </div>

          <F label="Username">
            <input className="input" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g,'') }))}
              placeholder="e.g. student.2025001" />
          </F>

          {/* ✅ Show current username hint when editing */}
          {editStudent && (
            <div style={{ display:'flex', alignItems:'center' }}>
              <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:9, padding:'10px 14px', fontSize:'0.78rem', color:'#0369a1', width:'100%' }}>
                Current: <strong>{editStudent.username || '(not set)'}</strong>
                <div style={{ color:'#94a3b8', fontSize:'0.7rem', marginTop:2 }}>Password is encrypted — use below to change it</div>
              </div>
            </div>
          )}

          {!editStudent && (<>
            <F label="Password">
              <input className="input" type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 6 characters" />
            </F>
            <F label="Confirm Password">
              <input className="input" type="password" value={form.confirmPassword}
                onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
            </F>
          </>)}

          {editStudent && (
            <div style={{ gridColumn:'1/-1' }}>
              <details>
                <summary style={{ cursor:'pointer', color:'#0891b2', fontWeight:600, fontSize:'0.82rem', userSelect:'none', padding:'6px 0' }}>
                  🔑 Change password (leave blank to keep current)
                </summary>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:10 }}>
                  <F label="New Password">
                    <input className="input" type="password" value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min 6 characters" />
                  </F>
                  <F label="Confirm New Password">
                    <input className="input" type="password" value={form.confirmPassword}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} />
                  </F>
                </div>
              </details>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background:'#fee2e2', color:'#991b1b', padding:'9px 14px', borderRadius:9, fontSize:'0.83rem', marginTop:10 }}>
            ⚠️ {error}
          </div>
        )}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditStudent(null); setError(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={saveStudent} disabled={saving}>
            {saving ? 'Saving...' : editStudent ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </Modal>

      {/* ── Student Detail Modal ── */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title="" size="lg">
          <div style={{ display:'flex', gap:16, alignItems:'center', padding:'16px 20px', borderRadius:12, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', margin:'-24px -28px 18px' }}>
            <div style={{ width:54, height:54, borderRadius:'50%', background:'linear-gradient(135deg,#0891b2,#0369a1)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.4rem', fontWeight:800, flexShrink:0 }}>
              {selected.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#1e293b' }}>{selected.name}</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2 }}>Roll #{selected.rollNo} • {selected.class}–{selected.section} • {selected.branch}</div>
              <div style={{ display:'flex', gap:6, marginTop:6 }}><Badge>{selected.status||'Active'}</Badge></div>
            </div>
          </div>

          <div style={{ display:'flex', gap:3, marginBottom:18, background:'#f1f5f9', borderRadius:10, padding:3 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setSelectedTab(t.toLowerCase())}
                style={{ flex:1, padding:'7px 4px', borderRadius:8, border:'none', cursor:'pointer', fontSize:'0.78rem',
                  fontWeight: selectedTab===t.toLowerCase()?700:500,
                  background: selectedTab===t.toLowerCase()?'white':'transparent',
                  color:      selectedTab===t.toLowerCase()?'#0891b2':'#64748b',
                  boxShadow:  selectedTab===t.toLowerCase()?'0 2px 8px rgba(0,0,0,0.08)':'none' }}>{t}</button>
            ))}
          </div>

          <div>
            {selectedTab==='details' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                {[['Roll No',selected.rollNo],['Class',`${selected.class}–${selected.section}`],
                  ['Gender',selected.gender],['Blood Group',selected.bloodGroup],
                  ['Caste',selected.caste],['Aadhaar',selected.aadhaar],
                  ['Year of Joining',selected.yearOfJoining],['Academic Year',selected.academicYear],
                  ['Username',selected.username],['Address',selected.address]].map(([l,v]) => (
                  <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{l}</div>
                    <div style={{ fontWeight:600, fontSize:'0.84rem', color:'#1e293b', marginTop:2 }}>{v||'—'}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedTab==='parent' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                {[['Parent Name',selected.parentName],['Phone',selected.phone],['Email',selected.email]].map(([l,v]) => (
                  <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{l}</div>
                    <div style={{ fontWeight:600, fontSize:'0.84rem', color:'#1e293b', marginTop:2 }}>{v||'—'}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedTab==='attendance' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                  {[{l:'Present',v:selected.presentDays||0,c:'#10b981'},{l:'Absent',v:selected.absentDays||0,c:'#f87171'},
                    {l:'Total',v:selected.totalWorkingDays||0,c:'#0891b2'},
                    {l:'% Rate',v:selected.totalWorkingDays?`${Math.round((selected.presentDays||0)/selected.totalWorkingDays*100)}%`:'—',c:'#8b5cf6'}
                  ].map(d => (
                    <div key={d.l} style={{ textAlign:'center', background:`${d.c}10`, borderRadius:12, padding:'14px 8px', borderTop:`3px solid ${d.c}` }}>
                      <div style={{ fontSize:'1.4rem', fontWeight:800, color:d.c }}>{d.v}</div>
                      <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{d.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedTab==='fee' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[{l:'Total Fee',v:`₹${(selected.totalFee||0).toLocaleString()}`,c:'#0891b2'},
                    {l:'Paid',v:`₹${(selected.paidFee||0).toLocaleString()}`,c:'#10b981'},
                    {l:'Due',v:`₹${((selected.totalFee||0)-(selected.paidFee||0)).toLocaleString()}`,c:'#f59e0b'}
                  ].map(d => (
                    <div key={d.l} style={{ textAlign:'center', background:`${d.c}10`, borderRadius:12, padding:'14px 8px', borderTop:`3px solid ${d.c}` }}>
                      <div style={{ fontSize:'1.2rem', fontWeight:800, color:d.c }}>{d.v}</div>
                      <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{d.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedTab==='reports' && (
              <div style={{ textAlign:'center', padding:'30px 0', color:'#94a3b8' }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
                <p>Academic reports will appear here once marks are entered.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop:20, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button className="btn btn-outline" onClick={() => openEdit(selected)}>
              <Edit2 size={13} /> Edit Student
            </button>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Student?" size="sm">
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:20 }}>This will permanently remove the student and disable their login account.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteStudent}>Yes, Delete</button>
        </div>
      </Modal>

      {/* ── Bulk Upload Modal ── */}
      <Modal open={showBulk} onClose={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }} title="Bulk Upload Students" size="sm">
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'#f0f9ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Upload size={24} color="#0891b2" />
          </div>
          <p style={{ fontSize:'0.83rem', color:'#64748b', marginBottom:16 }}>Upload an Excel (.xlsx) or CSV file with student data.</p>
          <a href="/templates/students_bulk_template.csv" download 
   style={{ fontSize:'0.78rem', color:'#0891b2', textDecoration:'underline', display:'block', marginBottom:16 }}>
  📥 Download template file
</a>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display:'none' }} onChange={e => setBulkFile(e.target.files[0])} />
          <div onClick={() => fileRef.current?.click()}
            style={{ border:'2px dashed #e2e8f0', borderRadius:12, padding:'20px', cursor:'pointer', background: bulkFile?'#f0fdf4':'#fafbff', marginBottom:14 }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#0891b2'; }}
            onDragLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; }}
            onDrop={e => { e.preventDefault(); setBulkFile(e.dataTransfer.files[0]); e.currentTarget.style.borderColor='#e2e8f0'; }}>
            {bulkFile ? <p style={{ color:'#10b981', fontWeight:600, fontSize:'0.84rem' }}>✓ {bulkFile.name}</p>
                      : <p style={{ color:'#94a3b8', fontSize:'0.82rem' }}>Click or drag & drop file here</p>}
          </div>
          {bulkResult && !bulkResult.credentials?.length && (
            <div style={{ background: bulkResult.success?'#f0fdf4':'#fef2f2', border:`1px solid ${bulkResult.success?'#bbf7d0':'#fecaca'}`, borderRadius:10, padding:'12px', marginBottom:14, textAlign:'left', fontSize:'0.82rem' }}>
              <p style={{ fontWeight:700, color: bulkResult.success?'#15803d':'#dc2626', marginBottom:6 }}>{bulkResult.message}</p>
              {bulkResult.inserted>0 && <p>✅ Inserted: {bulkResult.inserted}</p>}
              {bulkResult.updated>0  && <p>🔄 Updated: {bulkResult.updated}</p>}
              {bulkResult.skipped>0  && <p>⚠️ Skipped: {bulkResult.skipped}</p>}
              {bulkResult.errors?.slice(0,3).map((e,i) => <p key={i} style={{ color:'#ef4444', fontSize:'0.75rem' }}>• Row {e.row}: {e.reason}</p>)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }}>Close</button>
          <button className="btn btn-primary" onClick={handleBulkUpload} disabled={!bulkFile||bulkLoading}>
            {bulkLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </Modal>

      {/* ── Credentials Modal ── */}
      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="✅ Student Created — Login Credentials" size="sm">
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:18, marginBottom:16 }}>
          {[['Roll No',createdCreds?.rollNo],['Username',createdCreds?.username],['Password',createdCreds?.password]].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #dcfce7', fontSize:'0.84rem' }}>
              <span style={{ color:'#64748b', fontWeight:600 }}>{l}</span>
              <span style={{ fontWeight:700, color:'#1e293b' }}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:14 }}>Share these credentials with the student. Password cannot be retrieved later.</p>
        <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => setCreatedCreds(null)}>Done</button>
      </Modal>

      {/* ── Bulk Upload Credentials Modal ── */}
      {bulkResult?.credentials?.length > 0 && (
        <Modal open onClose={() => setBulkResult(null)} title="✅ Student Login Credentials Created" size="md">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontSize:'0.78rem', color:'#64748b', margin:0 }}>
              {bulkResult.credentials.length} login(s) created. Save these — passwords shown only once.
            </p>
            <button onClick={() => {
                const csv = ['Name,Roll No,Username,Password',
                  ...bulkResult.credentials.map(c => `"${c.name}","${c.rollNo}","${c.username}","${c.password}"`)
                ].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
                a.download = `student_credentials_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              style={{ background:'#f0f9ff', color:'#0891b2', border:'none', borderRadius:8, padding:'6px 14px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <FileDown size={13} /> Download CSV
            </button>
          </div>
          <div style={{ maxHeight:340, overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:10 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc', position:'sticky', top:0 }}>
                  {['#','Name','Roll No','Username','Password'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#64748b', fontWeight:700, borderBottom:'1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulkResult.credentials.map((c,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0?'white':'#fafbff' }}>
                    <td style={{ padding:'7px 12px', color:'#94a3b8' }}>{i+1}</td>
                    <td style={{ padding:'7px 12px', fontWeight:600 }}>{c.name}</td>
                    <td style={{ padding:'7px 12px', fontWeight:700, color:'#0891b2', fontFamily:'monospace' }}>{c.rollNo}</td>
                    <td style={{ padding:'7px 12px', color:'#0891b2', fontFamily:'monospace' }}>{c.username}</td>
                    <td style={{ padding:'7px 12px', fontWeight:700, color:'#f59e0b', fontFamily:'monospace' }}>{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setBulkResult(null)}>Done</button>
          </div>
        </Modal>
      )}

    </AppLayout>
  );
}
