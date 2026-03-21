'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Plus, Trash2, Edit2, Upload, Search, Printer, FileDown, X } from 'lucide-react';

const BLANK = {
  name:'', phone:'', email:'', role:'', qualification:'',
  aadhaar:'', pan:'', joinYear:'', salary:'', status:'Active',
  username:'', password:'', confirmPassword:'',
};

const STAFF_ROLES = ['Accountant','Librarian','Lab Assistant','Sports Coach','Peon','Security','Driver','Cook','Receptionist','Other'];
const TABS = ['Details','Attendance','Salary'];

export default function BranchAdminStaff() {
  const { user } = useAuth();
  const [staff, setStaff]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('');
  const [sortField, setSortField]       = useState('name');
  const [sortDir, setSortDir]           = useState('asc');
  const [page, setPage]                 = useState(1);
  const [showAdd, setShowAdd]           = useState(false);
  const [editStaff, setEditStaff]       = useState(null);
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
  const fileRef = useRef();
  const perPage = 10;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3500);
  };

  const load = async () => {
    setLoading(true);
    const q = new URLSearchParams({ branch: user?.branch || '' });
    if (filterRole) q.set('role', filterRole);
    const r = await fetch(`/api/staff?${q}`);
    const d = await r.json();
    if (d.success) setStaff(d.data);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, filterRole]);

  const filtered = useMemo(() => {
    let arr = staff.filter(s =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId?.toLowerCase().includes(search.toLowerCase())
    );
    arr = [...arr].sort((a, b) => {
      const va = a[sortField] || '';
      const vb = b[sortField] || '';
      return sortDir === 'asc'
        ? va.toString().localeCompare(vb.toString())
        : vb.toString().localeCompare(va.toString());
    });
    return arr;
  }, [staff, search, sortField, sortDir]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  function SortTh({ field, children }) {
    const active = sortField === field;
    return (
      <th onClick={() => toggleSort(field)} style={{ cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          {children}
          <span style={{ fontSize:10, opacity: active ? 1 : 0.3 }}>{active && sortDir === 'asc' ? '↑' : '↓'}</span>
        </span>
      </th>
    );
  }

  const autoUsername = (name) =>
    name ? `staff.${name.toLowerCase().replace(/\s+/g,'.')}.${user?.branch?.toLowerCase().replace(/\s+/g,'') || 'school'}` : '';

  // ── Save ────────────────────────────────────────────────────
  const saveStaff = async () => {
    setError('');
    if (!form.name) { setError('Name is required'); return; }
    if (!form.role) { setError('Role is required'); return; }
    if (!editStaff) {
      if (!form.username || !form.password) { setError('Username and password are required'); return; }
      if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    }
    setSaving(true);
    try {
      const payload = { ...form, branch: user?.branch, branchId: user?.branchId };
      const method  = editStaff ? 'PUT' : 'POST';
      const url     = editStaff ? `/api/staff/${editStaff._id}` : '/api/staff';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Something went wrong'); return; }
      if (!editStaff) {
        setCreatedCreds({ username: form.username, password: form.password, employeeId: d.data?.employeeId });
      }
      showToast(`✓ Staff ${editStaff ? 'updated' : 'added'} successfully`);
      setShowAdd(false); setEditStaff(null); setForm(BLANK); load();
    } finally { setSaving(false); }
  };

  // ── Delete ──────────────────────────────────────────────────
  const deleteStaffMember = async () => {
    await fetch(`/api/staff/${deleteId}`, { method: 'DELETE' });
    showToast('Staff member removed'); setDeleteId(null); load();
  };

  // ── Edit ────────────────────────────────────────────────────
  const openEdit = (s) => {
    setEditStaff(s);
    setForm({ name:s.name, phone:s.phone||'', email:s.email||'', role:s.role||'', qualification:s.qualification||'', aadhaar:s.aadhaar||'', pan:s.pan||'', joinYear:s.joinYear||'', salary:s.salary||'', status:s.status||'Active', username:'', password:'', confirmPassword:'' });
    setShowAdd(true); setError('');
  };

  // ── Print ───────────────────────────────────────────────────
  const handlePrint = () => {
    const rows = filtered.map((s, i) => `
      <tr>
        <td>${i+1}</td><td>${s.employeeId||'—'}</td><td>${s.name}</td>
        <td>${s.role||'—'}</td><td>${s.qualification||'—'}</td>
        <td>₹${(s.salary||0).toLocaleString()}</td><td>${s.status||'Active'}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Staff — ${user?.branch}</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:12px;margin:20px}
        h2{color:#1e293b} table{width:100%;border-collapse:collapse;margin-top:14px}
        th{background:#f1f5f9;padding:8px 10px;text-align:left;border:1px solid #e2e8f0;font-size:11px}
        td{padding:7px 10px;border:1px solid #e2e8f0}
        tr:nth-child(even){background:#f8fafc}
      </style></head><body>
      <h2>Staff Details — ${user?.branch}</h2>
      <p style="color:#64748b;font-size:11px">Total: ${filtered.length} staff members</p>
      <table>
        <thead><tr><th>S.No</th><th>Emp ID</th><th>Name</th><th>Role</th><th>Qualification</th><th>Salary</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`);
    win.document.close(); win.print();
  };

  // ── Export CSV ──────────────────────────────────────────────
  const handleExport = () => {
    const header = ['S.No','Emp ID','Name','Role','Qualification','Phone','Email','Salary','Status','Join Year'];
    const rows   = filtered.map((s, i) => [
      i+1, s.employeeId||'', s.name, s.role||'', s.qualification||'',
      s.phone||'', s.email||'', s.salary||'', s.status||'Active', s.joinYear||'',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `staff_${user?.branch}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // ── Bulk Upload ─────────────────────────────────────────────
  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);
    formData.append('branch', user?.branch);
    formData.append('branchId', user?.branchId || '');
    try {
      const r = await fetch('/api/staff/bulk-upload', { method:'POST', body: formData });
      const d = await r.json();
      setBulkResult(d);
      if (d.success) load();
    } finally { setBulkLoading(false); }
  };

  const F = ({ label, req, children }) => (
    <FormField label={label} required={req}>{children}</FormField>
  );

  return (
    <AppLayout requiredRole="branch-admin">

      {/* Toast */}
      {toast.msg && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background: toast.type === 'error' ? '#ef4444' : '#10b981', color:'white', padding:'12px 20px', borderRadius:12, fontWeight:600, fontSize:'0.875rem', boxShadow:'0 8px 24px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', gap:8, animation:'scaleIn 0.2s ease' }}>
          {toast.msg}
          <button onClick={() => setToast({ msg:'' })} style={{ background:'transparent', border:'none', cursor:'pointer', color:'white', padding:0 }}><X size={14} /></button>
        </div>
      )}

      <PageHeader title="Staff Details" subtitle={`${filtered.length} staff members — ${user?.branch}`}>
        <button className="btn btn-outline" onClick={handlePrint}>        <Printer  size={14} /> Print</button>
        <button className="btn btn-outline" onClick={handleExport}>       <FileDown size={14} /> Export</button>
        <button className="btn btn-outline" onClick={() => setShowBulk(true)}><Upload size={14} /> Bulk Upload</button>
        <button className="btn btn-primary" onClick={() => { setEditStaff(null); setForm(BLANK); setError(''); setShowAdd(true); }}>
          <Plus size={14} /> Add Staff
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="card" style={{ marginBottom:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" style={{ maxWidth:180 }} value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            {STAFF_ROLES.map(r => <option key={r}>{r}</option>)}
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:7, background:'#f8fafc', borderRadius:9, padding:'7px 12px', border:'1.5px solid #e2e8f0', flex:1, minWidth:180, maxWidth:300 }}>
            <Search size={14} color="#94a3b8" />
            <input style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.83rem', flex:1 }}
              placeholder="Search name or employee ID..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <span style={{ fontSize:'0.78rem', color:'#94a3b8', marginLeft:'auto' }}>
            Showing {paginated.length} of {filtered.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Status</th>
              <th>Emp ID</th>
              <SortTh field="name">Name</SortTh>
              <SortTh field="role">Role</SortTh>
              <SortTh field="qualification">Qualification</SortTh>
              <th>Phone</th>
              <SortTh field="salary">Salary</SortTh>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:48 }}>
                <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#10b981', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
                <span style={{ color:'#94a3b8', fontSize:'0.83rem' }}>Loading staff...</span>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={9}><EmptyState message="No staff members found." /></td></tr>
            ) : paginated.map((s, i) => (
              <tr key={s._id}>
                <td style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{(page-1)*perPage+i+1}</td>
                <td><Badge>{s.status || 'Active'}</Badge></td>
                <td style={{ fontWeight:700, color:'#10b981', fontSize:'0.8rem' }}>{s.employeeId}</td>
                <td>
                  <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.84rem' }}>{s.name}</div>
                  <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{s.email}</div>
                </td>
                <td>
                  <span style={{ background:'#f0fdf4', color:'#10b981', padding:'3px 10px', borderRadius:20, fontSize:'0.73rem', fontWeight:600 }}>
                    {s.role || '—'}
                  </span>
                </td>
                <td style={{ fontSize:'0.83rem' }}>{s.qualification || '—'}</td>
                <td style={{ fontSize:'0.83rem' }}>{s.phone || '—'}</td>
                <td>
                  <button style={{ background:'#f0fdf4', color:'#10b981', border:'none', borderRadius:6, padding:'3px 10px', fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}
                    onClick={() => { setSelected(s); setSelectedTab('salary'); }}>
                    ₹{(s.salary||0).toLocaleString()}
                  </button>
                </td>
                <td>
                  <div style={{ display:'flex', gap:5 }}>
                    <button title="View" className="btn btn-primary" style={{ padding:'4px 9px', fontSize:'0.72rem' }}
                      onClick={() => { setSelected(s); setSelectedTab('details'); }}><Eye size={12} /></button>
                    <button title="Edit" className="btn btn-outline" style={{ padding:'4px 9px', fontSize:'0.72rem' }}
                      onClick={() => openEdit(s)}><Edit2 size={12} /></button>
                    <button title="Delete" className="btn btn-danger" style={{ padding:'4px 9px', fontSize:'0.72rem' }}
                      onClick={() => setDeleteId(s._id)}><Trash2 size={12} /></button>
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
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditStaff(null); setError(''); }}
        title={editStaff ? `Edit — ${editStaff.name}` : 'Add New Staff Member'} size="lg">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <F label="Full Name" req>
            <input className="input" value={form.name}
              onChange={e => {
                const name = e.target.value;
                setForm(f => ({ ...f, name, ...(!editStaff && !f._usernameTouched ? { username: autoUsername(name) } : {}) }));
              }} placeholder="Staff full name" />
          </F>
          <F label="Role" req>
            <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="">Select role</option>
              {STAFF_ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </F>
          <F label="Phone"><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" /></F>
          <F label="Email"><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></F>
          <F label="Qualification"><input className="input" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. 12th Pass, Graduate" /></F>
          <F label="Join Year"><input className="input" value={form.joinYear} onChange={e => setForm({ ...form, joinYear: e.target.value })} placeholder="e.g. 2022" /></F>
          <F label="Salary (₹)"><input className="input" type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></F>
          <F label="Status">
            <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option>Active</option><option>Inactive</option>
            </select>
          </F>
          <F label="Aadhaar"><input className="input" value={form.aadhaar} onChange={e => setForm({ ...form, aadhaar: e.target.value })} maxLength={12} /></F>
          <F label="PAN"><input className="input" value={form.pan} onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })} placeholder="e.g. ABCDE1234F" /></F>

          {!editStaff && (<>
            <div style={{ gridColumn:'1/-1', borderTop:'1px solid #f1f5f9', paddingTop:12, marginTop:4 }}>
              <p style={{ fontWeight:700, fontSize:'0.875rem', color:'#374151', marginBottom:4 }}>🔐 Login Credentials <span style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:400 }}>(Required)</span></p>
            </div>
            <F label="Username" req>
              <input className="input" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g,''), _usernameTouched: true })}
                placeholder="Auto-suggested from name" />
            </F>
            <div />
            <F label="Password" req><input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" /></F>
            <F label="Confirm Password" req><input className="input" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} /></F>
          </>)}
        </div>
        {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'9px 14px', borderRadius:9, fontSize:'0.83rem', marginTop:10 }}>⚠️ {error}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditStaff(null); setError(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={saveStaff} disabled={saving}>
            {saving ? 'Saving...' : editStaff ? 'Update Staff' : 'Add Staff Member'}
          </button>
        </div>
      </Modal>

      {/* ── Staff Detail Modal with Tabs ─────────────────────── */}
      {selected && (
        <Modal open onClose={() => setSelected(null)} title="" size="md">
          {/* Profile strip */}
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:18, padding:'16px 20px', borderRadius:12, background:'linear-gradient(135deg, #f0fdf4, #dcfce7)', margin:'-24px -28px 18px' }}>
            <div style={{ width:54, height:54, borderRadius:'50%', background:'linear-gradient(135deg, #10b981, #059669)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.4rem', fontWeight:800, flexShrink:0 }}>
              {selected.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:'1.1rem', color:'#1e293b' }}>{selected.name}</div>
              <div style={{ fontSize:'0.78rem', color:'#64748b', marginTop:2 }}>{selected.employeeId} • {selected.role} • {selected.branch}</div>
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <Badge>{selected.status || 'Active'}</Badge>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:3, marginBottom:18, background:'#f1f5f9', borderRadius:10, padding:3 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setSelectedTab(t.toLowerCase())}
                style={{ flex:1, padding:'7px 4px', borderRadius:8, border:'none', cursor:'pointer', fontSize:'0.78rem', fontWeight: selectedTab === t.toLowerCase() ? 700 : 500, background: selectedTab === t.toLowerCase() ? 'white' : 'transparent', color: selectedTab === t.toLowerCase() ? '#10b981' : '#64748b', boxShadow: selectedTab === t.toLowerCase() ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition:'all 0.2s' }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ animation:'fadeSlideUp 0.25s ease' }}>
            {selectedTab === 'details' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                {[
                  ['Employee ID', selected.employeeId],['Role', selected.role],
                  ['Phone', selected.phone],['Email', selected.email],
                  ['Qualification', selected.qualification],['Join Year', selected.joinYear],
                  ['Aadhaar', selected.aadhaar],['PAN', selected.pan],
                ].map(([l,v]) => (
                  <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</div>
                    <div style={{ fontWeight:600, fontSize:'0.84rem', color:'#1e293b', marginTop:2 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedTab === 'attendance' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                {[
                  { l:'Present Days', v: selected.presentDays || 0, c:'#10b981' },
                  { l:'Absent Days',  v: selected.absentDays  || 0, c:'#f87171' },
                  { l:'Total Days',   v: selected.totalDays   || 0, c:'#0891b2' },
                ].map(d => (
                  <div key={d.l} style={{ textAlign:'center', background:`${d.c}10`, borderRadius:12, padding:'16px 8px', borderTop:`3px solid ${d.c}` }}>
                    <div style={{ fontSize:'1.5rem', fontWeight:800, color:d.c }}>{d.v}</div>
                    <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{d.l}</div>
                  </div>
                ))}
              </div>
            )}
            {selectedTab === 'salary' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:16 }}>
                  {[
                    { l:'Monthly Salary', v:`₹${(selected.salary||0).toLocaleString()}`,       c:'#10b981' },
                    { l:'Annual Salary',  v:`₹${((selected.salary||0)*12).toLocaleString()}`,   c:'#4f46e5' },
                  ].map(d => (
                    <div key={d.l} style={{ textAlign:'center', background:`${d.c}10`, borderRadius:12, padding:'16px 8px', borderTop:`3px solid ${d.c}` }}>
                      <div style={{ fontSize:'1.3rem', fontWeight:800, color:d.c }}>{d.v}</div>
                      <div style={{ fontSize:'0.7rem', color:'#94a3b8', marginTop:3 }}>{d.l}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:'0.78rem', color:'#94a3b8', textAlign:'center' }}>Monthly payment history available in reports.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop:20, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
          </div>
        </Modal>
      )}

      {/* ── Bulk Upload Modal ─────────────────────────────────── */}
      <Modal open={showBulk} onClose={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }} title="Bulk Upload Staff" size="sm">
        <div style={{ textAlign:'center', padding:'10px 0' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'#f0fdf4', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Upload size={24} color="#10b981" />
          </div>
          <p style={{ fontSize:'0.83rem', color:'#64748b', marginBottom:14 }}>Upload an Excel (.xlsx) or CSV file.</p>
          <a href="/templates/staff_template.csv" download style={{ fontSize:'0.78rem', color:'#10b981', textDecoration:'underline', display:'block', marginBottom:14 }}>
            📥 Download template file
          </a>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" style={{ display:'none' }} onChange={e => setBulkFile(e.target.files[0])} />
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border:'2px dashed #e2e8f0', borderRadius:12, padding:'20px', cursor:'pointer', background: bulkFile ? '#f0fdf4' : '#fafbff', marginBottom:14 }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#10b981'; }}
            onDragLeave={e => { e.currentTarget.style.borderColor='#e2e8f0'; }}
            onDrop={e => { e.preventDefault(); setBulkFile(e.dataTransfer.files[0]); e.currentTarget.style.borderColor='#e2e8f0'; }}
          >
            {bulkFile
              ? <p style={{ color:'#10b981', fontWeight:600, fontSize:'0.84rem' }}>✓ {bulkFile.name}</p>
              : <p style={{ color:'#94a3b8', fontSize:'0.82rem' }}>Click or drag & drop file here</p>}
          </div>
          {bulkResult && (
            <div style={{ background: bulkResult.success ? '#f0fdf4' : '#fef2f2', border:`1px solid ${bulkResult.success ? '#bbf7d0' : '#fecaca'}`, borderRadius:10, padding:'12px', marginBottom:14, textAlign:'left', fontSize:'0.82rem' }}>
              <p style={{ fontWeight:700, color: bulkResult.success ? '#15803d' : '#dc2626', marginBottom:6 }}>{bulkResult.message}</p>
              {bulkResult.inserted > 0 && <p style={{ color:'#64748b' }}>✅ Inserted: {bulkResult.inserted}</p>}
              {bulkResult.skipped  > 0 && <p style={{ color:'#64748b' }}>⚠️ Skipped: {bulkResult.skipped}</p>}
              {bulkResult.errors?.slice(0,3).map((e,i) => <p key={i} style={{ color:'#ef4444', fontSize:'0.75rem' }}>• Row {e.row}: {e.reason}</p>)}
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => { setShowBulk(false); setBulkFile(null); setBulkResult(null); }}>Close</button>
          <button className="btn btn-primary" onClick={handleBulkUpload} disabled={!bulkFile || bulkLoading}>
            {bulkLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </Modal>

      {/* ── Credentials Modal ─────────────────────────────────── */}
      <Modal open={!!createdCreds} onClose={() => setCreatedCreds(null)} title="✅ Staff Created — Login Credentials" size="sm">
        <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:18, marginBottom:16 }}>
          {[['Employee ID', createdCreds?.employeeId],['Username', createdCreds?.username],['Password', createdCreds?.password]].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #dcfce7', fontSize:'0.84rem' }}>
              <span style={{ color:'#64748b', fontWeight:600 }}>{l}</span>
              <span style={{ fontWeight:700, color:'#1e293b' }}>{v}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginBottom:14 }}>Share these credentials with the staff member. Password cannot be retrieved later.</p>
        <button className="btn btn-primary" style={{ width:'100%' }} onClick={() => setCreatedCreds(null)}>Done</button>
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────────── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Staff Member?" size="sm">
        <p style={{ color:'#64748b', marginBottom:20, fontSize:'0.875rem' }}>This will permanently remove the staff member and deactivate their login.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger"  onClick={deleteStaffMember}>Remove</button>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes scaleIn     { from { opacity:0; transform:scale(0.9); } to { opacity:1; transform:scale(1); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </AppLayout>
  );
}
