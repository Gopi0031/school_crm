'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Plus, Trash2, Edit2, Upload, Search, Printer, FileDown, X } from 'lucide-react';

const BLANK = {
  name:'', phone:'', email:'', qualification:'', experience:'',
  subject:'', aadhaar:'', pan:'', joinYear:'', salary:'',
  class:'', section:'', status:'Active', username:'', password:'', confirmPassword:'',
};

const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];
const TABS     = ['Details','Attendance','Salary','Subjects'];

// ── Moved OUTSIDE the main component ──────────────────────────
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
// ──────────────────────────────────────────────────────────────

export default function BranchAdminTeachers() {
  const { user } = useAuth();
  const [teachers, setTeachers]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterClass, setFilterClass]     = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [sortField, setSortField]         = useState('name');
  const [sortDir, setSortDir]             = useState('asc');
  const [page, setPage]                   = useState(1);
  const [showAdd, setShowAdd]             = useState(false);
  const [editTeacher, setEditTeacher]     = useState(null);
  const [selected, setSelected]           = useState(null);
  const [selectedTab, setSelectedTab]     = useState('details');
  const [deleteId, setDeleteId]           = useState(null);
  const [form, setForm]                   = useState(BLANK);
  const [error, setError]                 = useState('');
  const [toast, setToast]                 = useState({ msg:'', type:'success' });
  const [saving, setSaving]               = useState(false);
  const [createdCreds, setCreatedCreds]   = useState(null);
  const [showBulk, setShowBulk]           = useState(false);
  const [bulkFile, setBulkFile]           = useState(null);
  const [bulkResult, setBulkResult]       = useState(null);
  const [bulkLoading, setBulkLoading]     = useState(false);
  const fileRef = useRef();
  const perPage = 10;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3500);
  };

  const load = async () => {
    setLoading(true);
    const q = new URLSearchParams({ branch: user?.branch || '' });
    if (filterClass)   q.set('class', filterClass);
    if (filterSection) q.set('section', filterSection);
    const r = await fetch(`/api/teachers?${q}`);
    const d = await r.json();
    if (d.success) setTeachers(d.data);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filterClass, filterSection]);

  const filtered = useMemo(() => {
    let arr = teachers.filter(t =>
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(search.toLowerCase())
    );
    arr = [...arr].sort((a, b) => {
      const va = a[sortField] || '';
      const vb = b[sortField] || '';
      return sortDir === 'asc'
        ? va.toString().localeCompare(vb.toString())
        : vb.toString().localeCompare(va.toString());
    });
    return arr;
  }, [teachers, search, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  const autoUsername = (name) =>
    name ? `${name.toLowerCase().replace(/\s+/g,'.')}.${user?.branch?.toLowerCase().replace(/\s+/g,'') || 'school'}` : '';

  const saveTeacher = async () => {
    setError('');
    if (!form.name) { setError('Name is required'); return; }
    if (!editTeacher) {
      if (!form.username || !form.password) { setError('Username and password are required'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    } else {
      if (form.password) {
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
      }
    }
    setSaving(true);
    try {
      const payload = { ...form, branch: user?.branch, branchId: user?.branchId };
      const method  = editTeacher ? 'PUT' : 'POST';
      const url     = editTeacher ? `/api/teachers/${editTeacher._id}` : '/api/teachers';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Something went wrong'); return; }
      if (!editTeacher) {
        setCreatedCreds({ username: form.username, password: form.password, employeeId: d.data?.employeeId });
      }
      showToast(`✓ Teacher ${editTeacher ? 'updated' : 'added'} successfully`);
      setShowAdd(false); setEditTeacher(null); setForm(BLANK); load();
    } finally { setSaving(false); }
  };

  const deleteTeacher = async () => {
    await fetch(`/api/teachers/${deleteId}`, { method: 'DELETE' });
    showToast('Teacher removed'); setDeleteId(null); load();
  };

  const openEdit = (t) => {
    setEditTeacher(t);
    setForm({
      name: t.name || '', phone: t.phone || '', email: t.email || '',
      qualification: t.qualification || '', experience: t.experience || '',
      subject: t.subject || '', aadhaar: t.aadhaar || '', pan: t.pan || '',
      joinYear: t.joinYear || '', salary: t.salary || '',
      class: t.class || '', section: t.section || '',
      status: t.status || 'Active',
      username: t.username || '',
      password: '', confirmPassword: '',
    });
    setShowAdd(true);
    setError('');
  };

  const handlePrint = () => {
    const rows = filtered.map((t, i) => `
      <tr>
        <td>${i+1}</td><td>${t.employeeId||'—'}</td><td>${t.name}</td>
        <td>${t.qualification||'—'}</td><td>${t.subject||'—'}</td>
        <td>${t.class||'—'}${t.section ? '-'+t.section : ''}</td>
        <td>₹${(t.salary||0).toLocaleString()}</td><td>${t.status||'Active'}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Teachers — ${user?.branch}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}h2{color:#1e293b}
      table{width:100%;border-collapse:collapse;margin-top:14px}
      th{background:#f1f5f9;padding:8px 10px;text-align:left;border:1px solid #e2e8f0;font-size:11px}
      td{padding:7px 10px;border:1px solid #e2e8f0}tr:nth-child(even){background:#f8fafc}</style>
      </head><body><h2>Teacher Details — ${user?.branch}</h2>
      <p style="color:#64748b;font-size:11px">Total: ${filtered.length} teachers</p>
      <table><thead><tr><th>S.No</th><th>Emp ID</th><th>Name</th><th>Qualification</th>
      <th>Subject</th><th>Class</th><th>Salary</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`);
    win.document.close(); win.print();
  };

  const handleExport = () => {
    const header = ['S.No','Emp ID','Name','Qualification','Experience','Subject','Class','Section','Salary','Status','Join Year'];
    const rows   = filtered.map((t, i) => [
      i+1, t.employeeId||'', t.name, t.qualification||'', t.experience||'',
      t.subject||'', t.class||'', t.section||'', t.salary||'', t.status||'Active', t.joinYear||'',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `teachers_${user?.branch}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);
    formData.append('branch', user?.branch || '');
    formData.append('branchId', user?.branchId || '');
    try {
      const r    = await fetch('/api/teachers/bulk-upload', { method: 'POST', body: formData });
      const text = await r.text();
      if (!text) { setBulkResult({ success: false, message: 'Server returned empty response.' }); return; }
      let d;
      try { d = JSON.parse(text); }
      catch { setBulkResult({ success: false, message: `Invalid response: ${text.slice(0, 100)}` }); return; }
      setBulkResult(d);
      if (d.success) { load(); showToast(`✓ ${d.inserted} teacher(s) uploaded successfully`); setShowBulk(false); setBulkFile(null); }
    } catch (err) {
      setBulkResult({ success: false, message: `Network error: ${err.message}` });
    } finally { setBulkLoading(false); }
  };

  return (
    <AppLayout requiredRole="branch-admin">

      {toast.msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color:'white', padding:'12px 20px', borderRadius:12, fontWeight:600, fontSize:'0.875rem', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:8, animation:'scaleIn 0.2s ease' }}>
          {toast.msg}
          <button onClick={() => setToast({ msg:'' })} style={{ background:'transparent', border:'none', cursor:'pointer', color:'white', padding:0 }}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Teacher Details" subtitle={`${filtered.length} teachers — ${user?.branch}`}>
        <button className="btn btn-outline" onClick={handlePrint}><Printer size={14} /> Print</button>
        <button className="btn btn-outline" onClick={handleExport}><FileDown size={14} /> Export</button>
        <button className="btn btn-outline" onClick={() => setShowBulk(true)}><Upload size={14} /> Bulk Upload</button>
        <button className="btn btn-primary" onClick={() => { setEditTeacher(null); setForm(BLANK); setError(''); setShowAdd(true); }}>
          <Plus size={14} /> Add Teacher
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="card" style={{ marginBottom:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" style={{ maxWidth:150 }} value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select" style={{ maxWidth:140 }} value={filterSection} onChange={e => { setFilterSection(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s}>Section {s}</option>)}
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f8fafc', borderRadius:9, padding:'7px 12px', border:'1.5px solid #e2e8f0', flex:1, minWidth:180, maxWidth:300 }}>
            <Search size={14} color="#94a3b8" />
            <input style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.83rem', flex:1 }}
              placeholder="Search name or employee ID..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <span style={{ fontSize:'0.78rem', color:'#94a3b8', marginLeft:'auto' }}>Showing {paginated.length} of {filtered.length}</span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th><th>Status</th><th>Emp ID</th>
              <SortTh field="name"          sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Name</SortTh>
              <SortTh field="qualification" sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Qualification</SortTh>
              <SortTh field="experience"    sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Experience</SortTh>
              <th>Subject</th><th>Class</th>
              <SortTh field="salary" sortField={sortField} sortDir={sortDir} onToggle={toggleSort}>Salary</SortTh>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign:'center', padding:48 }}>
                <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#0891b2', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
                <span style={{ color:'#94a3b8', fontSize:'0.83rem' }}>Loading teachers...</span>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={10}><EmptyState message="No teachers found. Try adjusting filters." /></td></tr>
            ) : paginated.map((t, i) => (
              <tr key={t._id}>
                <td style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{(page-1)*perPage+i+1}</td>
                <td><Badge>{t.status || 'Active'}</Badge></td>
                <td style={{ fontWeight:700, color:'#4f46e5', fontSize:'0.8rem' }}>{t.employeeId}</td>
                <td>
                  <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.84rem' }}>{t.name}</div>
                  <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{t.email}</div>
                </td>
                <td style={{ fontSize:'0.83rem' }}>{t.qualification || '—'}</td>
                <td style={{ fontSize:'0.83rem' }}>{t.experience || '—'}</td>
                <td style={{ fontSize:'0.83rem' }}>
                  <button style={{ background:'#eef2ff', color:'#4f46e5', border:'none', borderRadius:6, padding:'3px 10px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}
                    onClick={() => { setSelected(t); setSelectedTab('subjects'); }}>{t.subject || 'View'}</button>
                </td>
                <td style={{ fontSize:'0.83rem' }}>{t.class ? `${t.class}–${t.section}` : '—'}</td>
                <td>
                  <button style={{ background:'#f0fdf4', color:'#10b981', border:'none', borderRadius:6, padding:'3px 10px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}
                    onClick={() => { setSelected(t); setSelectedTab('salary'); }}>
                    ₹{(t.salary||0).toLocaleString()}
                  </button>
                </td>
                <td>
                  <div style={{ display:'flex', gap:5 }}>
                    <button title="View"   className="btn btn-primary" style={{ padding:'4px 9px', fontSize:'0.72rem' }} onClick={() => { setSelected(t); setSelectedTab('details'); }}><Eye size={12} /></button>
                    <button title="Edit"   className="btn btn-outline" style={{ padding:'4px 9px', fontSize:'0.72rem' }} onClick={() => openEdit(t)}><Edit2 size={12} /></button>
                    <button title="Delete" className="btn btn-danger"  style={{ padding:'4px 9px', fontSize:'0.72rem' }} onClick={() => setDeleteId(t._id)}><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
        <div style={{ padding:'10px 20px', borderTop:'1px solid #f1f5f9' }}>
          <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage} />
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditTeacher(null); setError(''); }}
        title={editTeacher ? `Edit — ${editTeacher.name}` : 'Add New Teacher'} size="lg">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>

          <F label="Full Name" req>
            <input className="input" value={form.name}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, name: v, ...(!editTeacher && !p._usernameTouched ? { username: autoUsername(v) } : {}) })); }}
              placeholder="Teacher full name" />
          </F>
          <F label="Phone">
            <input className="input" value={form.phone}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, phone: v })); }}
              placeholder="10-digit mobile" />
          </F>
          <F label="Email">
            <input className="input" type="email" value={form.email}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, email: v })); }} />
          </F>
          <F label="Qualification">
            <input className="input" value={form.qualification}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, qualification: v })); }}
              placeholder="e.g. M.Sc, B.Ed" />
          </F>
          <F label="Experience">
            <input className="input" value={form.experience}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, experience: v })); }}
              placeholder="e.g. 5 years" />
          </F>
          <F label="Subject">
            <input className="input" value={form.subject}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, subject: v })); }}
              placeholder="e.g. Mathematics" />
          </F>
          <F label="Class">
            <select className="select" value={form.class}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, class: v })); }}>
              <option value="">Select Class</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </F>
          <F label="Section">
            <select className="select" value={form.section}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, section: v })); }}>
              <option value="">Select Section</option>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Join Year">
            <input className="input" value={form.joinYear}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, joinYear: v })); }}
              placeholder="e.g. 2022" />
          </F>
          <F label="Salary (₹)">
            <input className="input" type="number" value={form.salary}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, salary: v })); }} />
          </F>
          <F label="Aadhaar">
            <input className="input" value={form.aadhaar}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, aadhaar: v })); }}
              maxLength={12} />
          </F>
          <F label="PAN">
            <input className="input" value={form.pan}
              onChange={e => { const v = e.target.value.toUpperCase(); setForm(p => ({ ...p, pan: v })); }}
              placeholder="e.g. ABCDE1234F" />
          </F>
          <F label="Status">
            <select className="select" value={form.status}
              onChange={e => { const v = e.target.value; setForm(p => ({ ...p, status: v })); }}>
              <option>Active</option><option>Inactive</option>
            </select>
          </F>
          <div />

          {/* ── Login Credentials ── */}
          <div style={{ gridColumn:'1/-1', borderTop:'1px solid #f1f5f9', paddingTop:12, marginTop:4 }}>
            <p style={{ fontWeight:700, fontSize:'0.875rem', color:'#374151', marginBottom:4 }}>
              🔐 Login Credentials
              <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:400, marginLeft:6 }}>
                {editTeacher ? '(Changing username will update login)' : '(Required)'}
              </span>
            </p>
          </div>

          <F label="Username" req={!editTeacher}>
  <input
    className="input"
    value={form.username}
    onChange={e => { const v = e.target.value.toLowerCase().replace(/\s/g,''); setForm(p => ({ ...p, username: v, _usernameTouched: true })); }}
    placeholder="Auto-suggested from name"
  />
</F>

          <div />

          {!editTeacher && (<>
            <F label="Password" req>
              <input className="input" type="password" value={form.password}
                onChange={e => { const v = e.target.value; setForm(p => ({ ...p, password: v })); }}
                placeholder="Min 6 characters" />
            </F>
            <F label="Confirm Password" req>
              <input className="input" type="password" value={form.confirmPassword}
                onChange={e => { const v = e.target.value; setForm(p => ({ ...p, confirmPassword: v })); }} />
            </F>
          </>)}

          {editTeacher && (
            <div style={{ gridColumn:'1/-1' }}>
              <details>
                <summary style={{ cursor:'pointer', color:'#0891b2', fontWeight:600, fontSize:'0.82rem', userSelect:'none', padding:'6px 0' }}>
                  🔑 Change password (optional — leave blank to keep current)
                </summary>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:10 }}>
                  <F label="New Password">
                    <input className="input" type="password" value={form.password}
                      onChange={e => { const v = e.target.value; setForm(p => ({ ...p, password: v })); }}
                      placeholder="Min 6 characters" />
                  </F>
                  <F label="Confirm New Password">
                    <input className="input" type="password" value={form.confirmPassword}
                      onChange={e => { const v = e.target.value; setForm(p => ({ ...p, confirmPassword: v })); }} />
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
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditTeacher(null); setError(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={saveTeacher} disabled={saving}>
            {saving ? 'Saving...' : editTeacher ? 'Update Teacher' : 'Create Teacher'}
          </button>
        </div>
      </Modal>

      {/* ── Teacher Detail Modal ─────────────────────────────── */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title="" size="lg">
          <div style={{ display:'flex', gap:16, alignItems:'center', padding:'16px 20px', borderRadius:12, background:'linear-gradient(135deg,#f0f9ff,#e0f2fe)', margin:'-24px -28px 18px' }}>
            <div style={{ width:54, height:54, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.4rem', fontWeight:800, flexShrink:0 }}>
              {selected.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#1e293b' }}>{selected.name}</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2 }}>{selected.employeeId} • {selected.subject || 'No subject'} • {selected.branch}</div>
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <Badge>{selected.status || 'Active'}</Badge>
                {selected.class && <span style={{ fontSize:'0.73rem', background:'#eef2ff', color:'#4f46e5', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>{selected.class}–{selected.section}</span>}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:3, marginBottom:18, background:'#f1f5f9', borderRadius:10, padding:3 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setSelectedTab(t.toLowerCase())}
                style={{ flex:1, padding:'7px 4px', borderRadius:8, border:'none', cursor:'pointer', fontSize:'0.78rem',
                  fontWeight: selectedTab===t.toLowerCase()?700:500, background: selectedTab===t.toLowerCase()?'white':'transparent',
                  color: selectedTab===t.toLowerCase()?'#4f46e5':'#64748b',
                  boxShadow: selectedTab===t.toLowerCase()?'0 2px 8px rgba(0,0,0,0.08)':'none',
                  transition:'all 0.2s', whiteSpace:'nowrap' }}>{t}</button>
            ))}
          </div>

          <div style={{ animation:'fadeSlideUp 0.25s ease' }}>
            {selectedTab==='details' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                {[['Employee ID',selected.employeeId],['Phone',selected.phone],['Email',selected.email],
                  ['Qualification',selected.qualification],['Experience',selected.experience],['Join Year',selected.joinYear],
                  ['Aadhaar',selected.aadhaar],['PAN',selected.pan]].map(([l,v]) => (
                  <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</div>
                    <div style={{ fontWeight:600, fontSize:'0.84rem', color:'#1e293b', marginTop:2 }}>{v||'—'}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedTab==='subjects' && (
              <div>
                <div style={{ background:'#eef2ff', borderRadius:12, padding:'16px 20px', marginBottom:12 }}>
                  <div style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Primary Subject</div>
                  <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#4f46e5' }}>{selected.subject||'Not assigned'}</div>
                </div>
                <div style={{ background:'#f8fafc', borderRadius:12, padding:'16px 20px' }}>
                  <div style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Assigned Class</div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#1e293b' }}>{selected.class ? `${selected.class} – Section ${selected.section}` : 'Not assigned to any class'}</div>
                </div>
              </div>
            )}
            {selectedTab==='attendance' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[{l:'Present Days',v:selected.presentDays||0,c:'#10b981'},{l:'Absent Days',v:selected.absentDays||0,c:'#f87171'},{l:'Total Days',v:selected.totalDays||0,c:'#0891b2'}].map(d => (
                  <div key={d.l} style={{ textAlign:'center', background:`${d.c}10`, borderRadius:12, padding:'16px 8px', borderTop:`3px solid ${d.c}` }}>
                    <div style={{ fontSize:'1.5rem', fontWeight:800, color:d.c }}>{d.v}</div>
                    <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{d.l}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedTab==='salary' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }}>
                  {[{l:'Monthly Salary',v:`₹${(selected.salary||0).toLocaleString()}`,c:'#4f46e5'},{l:'Annual Salary',v:`₹${((selected.salary||0)*12).toLocaleString()}`,c:'#10b981'}].map(d => (
                    <div key={d.l} style={{ textAlign:'center', background:`${d.c}10`, borderRadius:12, padding:'16px 8px', borderTop:`3px solid ${d.c}` }}>
                      <div style={{ fontSize:'1.3rem', fontWeight:800, color:d.c }}>{d.v}</div>
                      <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{d.l}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:'0.78rem', color:'#94a3b8', textAlign:'center' }}>Monthly payment history available in full reports.</p>
              </div>
            )}
          </div>
          <div style={{ marginTop:20, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Bulk Upload Modal ─────────────────────────────────── */}
      <Modal open={showBulk} onClose={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }} title="Bulk Upload Teachers" size="sm">
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'#eef2ff', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Upload size={24} color="#4f46e5" />
          </div>
          <p style={{ fontSize:'0.83rem', color:'#64748b', marginBottom:14 }}>Upload an Excel (.xlsx) or CSV file.</p>
          <a href="/templates/teachers_template.csv" download style={{ fontSize:'0.78rem', color:'#4f46e5', textDecoration:'underline', display:'block', marginBottom:14 }}>📥 Download template file</a>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display:'none' }} onChange={e => setBulkFile(e.target.files[0])} />
          <div onClick={() => fileRef.current?.click()}
            style={{ border:'2px dashed #e2e8f0', borderRadius:12, padding:'20px', cursor:'pointer', background: bulkFile?'#f0fdf4':'#fafbff', marginBottom:14 }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#4f46e5'; }}
            onDragLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; }}
            onDrop={e => { e.preventDefault(); setBulkFile(e.dataTransfer.files[0]); e.currentTarget.style.borderColor='#e2e8f0'; }}>
            {bulkFile ? <p style={{ color:'#10b981', fontWeight:600, fontSize:'0.84rem' }}>✓ {bulkFile.name}</p>
                      : <p style={{ color:'#94a3b8', fontSize:'0.82rem' }}>Click or drag & drop file here</p>}
          </div>
          {bulkResult && (
            <div style={{ background: bulkResult.success?'#f0fdf4':'#fef2f2', border:`1px solid ${bulkResult.success?'#bbf7d0':'#fecaca'}`, borderRadius:10, padding:'12px', marginBottom:14, textAlign:'left', fontSize:'0.82rem' }}>
              <p style={{ fontWeight:700, color: bulkResult.success?'#15803d':'#dc2626', marginBottom:6 }}>{bulkResult.message}</p>
              {bulkResult.inserted>0 && <p style={{ color:'#64748b' }}>✅ Inserted: {bulkResult.inserted}</p>}
              {bulkResult.skipped>0  && <p style={{ color:'#64748b' }}>⚠️ Skipped: {bulkResult.skipped}</p>}
              {bulkResult.errors?.slice(0,3).map((e,i) => <p key={i} style={{ color:'#ef4444', fontSize:'0.75rem' }}>• Row {e.row}: {e.reason}</p>)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }}>Close</button>
          <button className="btn btn-primary" onClick={handleBulkUpload} disabled={!bulkFile||bulkLoading}>{bulkLoading?'Uploading...':'Upload'}</button>
        </div>
      </Modal>

      {/* ── Credentials Modal ─────────────────────────────────── */}
      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="✅ Teacher Created — Login Credentials" size="sm">
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:18, marginBottom:16 }}>
          {[['Employee ID',createdCreds?.employeeId],['Username',createdCreds?.username],['Password',createdCreds?.password]].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #dcfce7', fontSize:'0.84rem' }}>
              <span style={{ color:'#64748b', fontWeight:600 }}>{l}</span>
              <span style={{ fontWeight:700, color:'#1e293b' }}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:14 }}>Share these credentials with the teacher. Password cannot be retrieved later.</p>
        <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => setCreatedCreds(null)}>Done</button>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Teacher?" size="sm">
        <p style={{ color:'#64748b', marginBottom:20, fontSize:'0.875rem' }}>This will permanently remove the teacher and deactivate their login.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteTeacher}>Remove Teacher</button>
        </div>
      </Modal>

      {/* ── Bulk Credentials Modal ────────────────────────────── */}
      {bulkResult?.credentials?.length > 0 && (
        <Modal open onClose={() => setBulkResult(null)} title="✅ Teacher Login Credentials Created" size="md">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontSize:'0.78rem', color:'#64748b', margin:0 }}>{bulkResult.credentials.length} teacher login(s) created. Save these — passwords shown only once.</p>
            <button onClick={() => {
                const csv = ['Name,Employee ID,Username,Password', ...bulkResult.credentials.map(c => `"${c.name}","${c.employeeId}","${c.username}","${c.password}"`)].join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
                a.download = `teacher_credentials_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }}
              style={{ background:'#eef2ff', color:'#4f46e5', border:'none', borderRadius:8, padding:'6px 14px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
              <FileDown size={13} /> Download CSV
            </button>
          </div>
          <div style={{ maxHeight:340, overflowY:'auto', border:'1px solid #e2e8f0', borderRadius:10 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc', position:'sticky', top:0, zIndex:1 }}>
                  {['#','Name','Emp ID','Username','Password'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#64748b', fontWeight:700, borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulkResult.credentials.map((c,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #f1f5f9', background: i%2===0?'white':'#fafbff' }}>
                    <td style={{ padding:'7px 12px', color:'#94a3b8', fontSize:'0.72rem' }}>{i+1}</td>
                    <td style={{ padding:'7px 12px', fontWeight:600, color:'#1e293b' }}>{c.name}</td>
                    <td style={{ padding:'7px 12px', fontWeight:700, color:'#4f46e5', fontFamily:'monospace' }}>{c.employeeId}</td>
                    <td style={{ padding:'7px 12px', color:'#0891b2', fontFamily:'monospace' }}>{c.username}</td>
                    <td style={{ padding:'7px 12px', fontWeight:700, color:'#f59e0b', fontFamily:'monospace' }}>{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bulkResult.skipped > 0 && (
            <div style={{ marginTop:12, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:9, padding:'10px 14px', fontSize:'0.78rem' }}>
              <p style={{ fontWeight:700, color:'#92400e', marginBottom:4 }}>⚠️ {bulkResult.skipped} row(s) skipped:</p>
              {bulkResult.errors?.slice(0,5).map((e,i) => <p key={i} style={{ color:'#b45309', margin:'2px 0' }}>• Row {e.row}: {e.reason}</p>)}
              {bulkResult.errors?.length > 5 && <p style={{ color:'#94a3b8', marginTop:4 }}>...and {bulkResult.errors.length-5} more</p>}
            </div>
          )}
          <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setBulkResult(null)}>Done</button>
          </div>
        </Modal>
      )}

      <style jsx global>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes scaleIn     { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </AppLayout>
  );
}
