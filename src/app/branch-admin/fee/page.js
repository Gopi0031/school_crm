'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Bell, Search } from 'lucide-react';

export default function BranchAdminFee() {
  const { user }   = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cls, setCls]       = useState('');
  const [section, setSection]   = useState('');
  const [feeStatus, setFeeStatus] = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [editFee, setEditFee] = useState(null);
  const [feeForm, setFeeForm] = useState({ term1:'', term2:'', term3:'' });
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const perPage = 10;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({ branch: user?.branch || '' });
    if (cls)     params.set('class', cls);
    if (section) params.set('section', section);
    const r = await fetch(`/api/fee?${params}`);
    const d = await r.json();
    if (d.success) setStudents(d.data);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, cls, section]);

  const filtered = useMemo(() => {
    let list = students;
    if (feeStatus === 'paid')    list = list.filter(s => s.paidFee >= s.totalFee);
    if (feeStatus === 'pending') list = list.filter(s => s.paidFee === 0);
    if (feeStatus === 'partial') list = list.filter(s => s.paidFee > 0 && s.paidFee < s.totalFee);
    if (search) list = list.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.rollNo?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [students, feeStatus, search]);

  const paginated = filtered.slice((page-1)*perPage, page*perPage);

  const totalFee  = filtered.reduce((a,s) => a+s.totalFee, 0);
  const paidFee   = filtered.reduce((a,s) => a+s.paidFee,  0);
  const dueFee    = totalFee - paidFee;

  const saveFee = async () => {
    setSaving(true);
    const r = await fetch('/api/fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: editFee._id, ...feeForm }),
    });
    const d = await r.json();
    if (d.success) {
      showToast('✓ Fee updated successfully');
      setEditFee(null); load();
    }
    setSaving(false);
  };

  const notifyStudent = (s) => {
    const due = s.totalFee - s.paidFee;
    const msg = encodeURIComponent(`Dear Parent of ${s.name},\nFee due: ₹${due.toLocaleString()}\nPlease contact school. Thank you.`);
    window.open(`https://wa.me/91${s.phone}?text=${msg}`, '_blank');
  };

  return (
    <AppLayout requiredRole="branch-admin">
      {toast && <div style={{ position:'fixed', top:20, right:20, background:'#10b981', color:'white', padding:'12px 20px', borderRadius:10, fontWeight:600, zIndex:9999 }}>{toast}</div>}

      <PageHeader title="Fee Management" subtitle={`${user?.branch}`} />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:20 }}>
        {[
          { l:'Total Fee',  v:`₹${(totalFee/100000).toFixed(2)}L`,  c:'#4f46e5' },
          { l:'Collected',  v:`₹${(paidFee/100000).toFixed(2)}L`,   c:'#10b981' },
          { l:'Due',        v:`₹${(dueFee/100000).toFixed(2)}L`,    c:'#ef4444' },
          { l:'Paid %',     v:`${totalFee ? Math.round(paidFee/totalFee*100) : 0}%`, c:'#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign:'center', borderTop:`3px solid ${c}` }}>
            <div style={{ fontSize:'1.25rem', fontWeight:700, color:c }}>{v}</div>
            <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:4 }}>{l}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <select className="select" value={cls} onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select" value={section} onChange={e => { setSection(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {['A','B','C','D'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" value={feeStatus} onChange={e => { setFeeStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, maxWidth:240 }}>
            <Search size={15} color="#94a3b8" />
            <input className="input" placeholder="Search name or roll no..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      <div className="card">
        <TableWrapper>
          <thead>
            <tr><th>S.No</th><th>Status</th><th>Roll No</th><th>Student</th><th>Parent</th><th>Phone</th><th>Total Fee</th><th>Term 1</th><th>Term 2</th><th>Term 3</th><th>Due</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={12}><EmptyState message="No students found" /></td></tr>
            ) : paginated.map((s, i) => {
              const due = s.totalFee - s.paidFee;
              const feePct = s.totalFee ? Math.round(s.paidFee/s.totalFee*100) : 0;
              const fColor = feePct >= 100 ? '#10b981' : feePct > 0 ? '#f59e0b' : '#ef4444';
              const fLabel = feePct >= 100 ? 'Paid' : feePct > 0 ? 'Partial' : 'Pending';
              return (
                <tr key={s._id}>
                  <td style={{ color:'#94a3b8' }}>{(page-1)*perPage+i+1}</td>
                  <td><span style={{ padding:'3px 8px', borderRadius:20, background:`${fColor}20`, color:fColor, fontSize:'0.7rem', fontWeight:600 }}>{fLabel}</span></td>
                  <td style={{ fontWeight:600, color:'#4f46e5' }}>{s.rollNo}</td>
                  <td style={{ fontWeight:600 }}>{s.name}</td>
                  <td>{s.parentName}</td>
                  <td>{s.phone}</td>
                  <td>₹{(s.totalFee||0).toLocaleString()}</td>
                  <td style={{ color: s.term1>0 ? '#10b981':'#94a3b8' }}>₹{(s.term1||0).toLocaleString()}</td>
                  <td style={{ color: s.term2>0 ? '#10b981':'#94a3b8' }}>₹{(s.term2||0).toLocaleString()}</td>
                  <td style={{ color: s.term3>0 ? '#10b981':'#94a3b8' }}>₹{(s.term3||0).toLocaleString()}</td>
                  <td style={{ fontWeight:700, color: due>0?'#ef4444':'#10b981' }}>₹{due.toLocaleString()}</td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      <button className="btn btn-primary" style={{ padding:'4px 8px', fontSize:'0.7rem' }} onClick={() => { setEditFee(s); setFeeForm({ term1: s.term1||0, term2: s.term2||0, term3: s.term3||0 }); }}>
                        <Eye size={11} /> Update
                      </button>
                      <button className="btn btn-outline" style={{ padding:'4px 8px', fontSize:'0.7rem', color:'#10b981', borderColor:'#10b981' }} onClick={() => notifyStudent(s)}>
                        <Bell size={11} />
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

      {editFee && (
        <Modal open onClose={() => setEditFee(null)} title={`Update Fee — ${editFee.name}`} size="sm">
          <div style={{ background:'#f8fafc', borderRadius:8, padding:12, marginBottom:16, fontSize:'0.875rem' }}>
            <div>Total Fee: <strong>₹{editFee.totalFee?.toLocaleString()}</strong></div>
            <div style={{ marginTop:4, color:'#94a3b8' }}>Enter amount paid per term</div>
          </div>
          <FormField label="Term 1 Amount (₹)"><input className="input" type="number" value={feeForm.term1} onChange={e => setFeeForm({ ...feeForm, term1: Number(e.target.value) })} /></FormField>
          <FormField label="Term 2 Amount (₹)"><input className="input" type="number" value={feeForm.term2} onChange={e => setFeeForm({ ...feeForm, term2: Number(e.target.value) })} /></FormField>
          <FormField label="Term 3 Amount (₹)"><input className="input" type="number" value={feeForm.term3} onChange={e => setFeeForm({ ...feeForm, term3: Number(e.target.value) })} /></FormField>
          <div style={{ background:'#eff6ff', borderRadius:8, padding:'10px 14px', fontSize:'0.875rem', marginTop:8 }}>
            Total Paid: <strong>₹{(Number(feeForm.term1)+Number(feeForm.term2)+Number(feeForm.term3)).toLocaleString()}</strong>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:12 }}>
            <button className="btn btn-outline" onClick={() => setEditFee(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveFee} disabled={saving}>{saving ? 'Saving...' : 'Update Fee'}</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
