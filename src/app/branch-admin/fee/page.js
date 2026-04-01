'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Bell, Search, IndianRupee } from 'lucide-react';

export default function BranchAdminFee() {
  const { user } = useAuth();
  const [students,      setStudents]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [cls,           setCls]           = useState('');
  const [section,       setSection]       = useState('');
  const [feeStatus,     setFeeStatus]     = useState('');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [editFee,       setEditFee]       = useState(null);
  const [feeForm,       setFeeForm]       = useState({ term1:'', term2:'', term3:'' });
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState('');
  const [notifyAllList, setNotifyAllList] = useState([]);
  const [showNotifyAll, setShowNotifyAll] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  // ── Set Total Fee states ──
  const [setFeeModal,   setSetFeeModal]   = useState(null);
  const [newTotalFee,   setNewTotalFee]   = useState('');
  const perPage = 10;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // ── Load students ─────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ branch: user?.branch || '' });
      if (cls)     params.set('class',   cls);
      if (section) params.set('section', section);
      const r = await fetch(`/api/fee?${params}`);
      const d = await r.json();
      if (d.success) setStudents(d.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user, cls, section]);

  // ── Fee status helpers ────────────────────────────────────────────────
  const getFeeStatus = (s) => {
    const total = Number(s.totalFee) || 0;
    const paid  = Number(s.paidFee)  || 0;
    if (total === 0)   return { label:'Not Set', color:'#94a3b8' };
    if (paid >= total) return { label:'Paid',    color:'#10b981' };
    if (paid > 0)      return { label:'Partial', color:'#f59e0b' };
    return                    { label:'Pending', color:'#ef4444' };
  };

  // ── Term cell helper ──────────────────────────────────────────────────
  const getTermDisplay = (s, term) => {
    const total   = Number(s.totalFee) || 0;
    const paid    = Number(s[term])    || 0;
    const base    = total > 0 ? Math.floor(total / 3) : 0;
    const extra   = total > 0 ? total - base * 3 : 0;
    const expected = term === 'term1' ? base + extra : base;
    const dueKey  = `${term}Due`;
    let due       = Number(s[dueKey]) || 0;
    if (!due && total > 0) due = Math.max(0, expected - paid);

    if (total === 0)               return <span style={{ color:'#94a3b8', fontSize:'0.75rem' }}>—</span>;
    if (paid >= expected && expected > 0)
      return <span style={{ color:'#10b981', fontWeight:700 }}>₹{paid.toLocaleString()}</span>;
    if (paid > 0 && due > 0)
      return (
        <div>
          <span style={{ color:'#f59e0b', fontWeight:700, fontSize:'0.82rem' }}>₹{paid.toLocaleString()}</span>
          <div style={{ fontSize:'0.65rem', color:'#ef4444' }}>₹{due.toLocaleString()} left</div>
        </div>
      );
    return <span style={{ color:'#ef4444', fontWeight:600, fontSize:'0.82rem' }}>₹{due.toLocaleString()} due</span>;
  };

  // ── Filtered + paginated ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = students;
    if (feeStatus === 'paid')    list = list.filter(s => Number(s.paidFee) >= Number(s.totalFee) && Number(s.totalFee) > 0);
    if (feeStatus === 'pending') list = list.filter(s => !Number(s.paidFee) && Number(s.totalFee) > 0);
    if (feeStatus === 'partial') list = list.filter(s => Number(s.paidFee) > 0 && Number(s.paidFee) < Number(s.totalFee));
    if (feeStatus === 'notset')  list = list.filter(s => !Number(s.totalFee));
    if (search) list = list.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [students, feeStatus, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalFee  = filtered.reduce((a, s) => a + (Number(s.totalFee) || 0), 0);
  const paidFee   = filtered.reduce((a, s) => a + (Number(s.paidFee)  || 0), 0);
  const dueFee    = totalFee - paidFee;

  // ── Save term fee update ──────────────────────────────────────────────
  const saveFee = async () => {
    if (!editFee) return;
    setSaving(true);
    try {
      const r = await fetch('/api/fee', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ studentId: editFee.id, ...feeForm }),
      });
      const d = await r.json();
      if (d.success) {
        showToast('✅ Fee updated successfully');
        setEditFee(null);
        load();
      } else {
        showToast('❌ ' + (d.error || 'Failed to save'));
      }
    } catch { showToast('❌ Failed to save'); }
    setSaving(false);
  };

  // ── Save total fee (set/reset) ────────────────────────────────────────
  const saveTotalFee = async () => {
    if (!newTotalFee || isNaN(Number(newTotalFee)) || Number(newTotalFee) < 0) {
      showToast('❌ Enter a valid amount'); return;
    }
    setSaving(true);
    try {
      const total = Number(newTotalFee);
      const base  = Math.floor(total / 3);
      const extra = total - base * 3;

      const r = await fetch(`/api/students/${setFeeModal.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          totalFee: total,
          term1Due: base + extra,
          term2Due: base,
          term3Due: base,
          // Reset paid amounts only if fee is being set fresh (not updating)
          ...(Number(setFeeModal.totalFee) === 0 && {
            paidFee: 0, term1: 0, term2: 0, term3: 0,
          }),
        }),
      });
      const d = await r.json();
      if (d.success) {
        showToast('✅ Total fee set successfully!');
        setSetFeeModal(null);
        setNewTotalFee('');
        load();
      } else {
        showToast('❌ ' + (d.error || 'Failed'));
      }
    } catch { showToast('❌ Failed to save'); }
    setSaving(false);
  };

  // ── Bulk set fee for all students in class/section ────────────────────
  const bulkSetFeeModal  = useState(null);
  const [showBulkFee,  setShowBulkFee]  = useState(false);
  const [bulkAmount,   setBulkAmount]   = useState('');
  const [bulkLoading,  setBulkLoading]  = useState(false);

  const saveBulkFee = async () => {
    if (!bulkAmount || isNaN(Number(bulkAmount)) || Number(bulkAmount) <= 0) {
      showToast('❌ Enter a valid amount'); return;
    }
    if (!cls) { showToast('❌ Select a class first'); return; }
    setBulkLoading(true);
    try {
      const total = Number(bulkAmount);
      const base  = Math.floor(total / 3);
      const extra = total - base * 3;

      // Update all students in filtered list who have no totalFee set
      const toUpdate = filtered.filter(s => !Number(s.totalFee));
      if (toUpdate.length === 0) {
        showToast('ℹ️ All students already have fee set'); setBulkLoading(false); return;
      }

      await Promise.all(toUpdate.map(s =>
        fetch(`/api/students/${s.id}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            totalFee: total,
            term1Due: base + extra,
            term2Due: base,
            term3Due: base,
            paidFee: 0, term1: 0, term2: 0, term3: 0,
          }),
        })
      ));

      showToast(`✅ Fee set for ${toUpdate.length} students`);
      setShowBulkFee(false);
      setBulkAmount('');
      load();
    } catch { showToast('❌ Bulk update failed'); }
    setBulkLoading(false);
  };

  // ── Notify all ────────────────────────────────────────────────────────
  const handleNotifyAll = async () => {
    if (!confirm(`Send WhatsApp fee reminders to all students in ${user?.branch}?`)) return;
    setNotifyLoading(true);
    try {
      const res = await fetch('/api/fee/notify-all', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ branch: user?.branch, cls, section }),
      });
      const d = await res.json();
      if (d.success) {
        setNotifyAllList(d.data);
        setShowNotifyAll(true);
        showToast(`✅ ${d.summary}`);
      } else {
        showToast('❌ Failed to send notifications');
      }
    } catch { showToast('❌ Failed to send notifications'); }
    setNotifyLoading(false);
  };

  const notifyStudent = (s) => {
    const due = (Number(s.totalFee) || 0) - (Number(s.paidFee) || 0);
    const msg = encodeURIComponent(
      `Dear Parent of ${s.name},\nFee due: ₹${due.toLocaleString()}\nPlease contact school. Thank you.`
    );
    window.open(`https://wa.me/91${s.phone}?text=${msg}`, '_blank');
  };

  // ── Term preview for Set Fee modal ────────────────────────────────────
  const previewSplit = (amt) => {
    const total = Number(amt) || 0;
    if (total === 0) return null;
    const base  = Math.floor(total / 3);
    const extra = total - base * 3;
    return { t1: base + extra, t2: base, t3: base };
  };
  const split = previewSplit(newTotalFee);
  const bulkSplit = previewSplit(bulkAmount);

  return (
    <AppLayout requiredRole="branch-admin">
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, background:'#10b981', color:'white', padding:'12px 20px', borderRadius:10, fontWeight:600, zIndex:9999, boxShadow:'0 4px 20px rgba(16,185,129,0.4)' }}>
          {toast}
        </div>
      )}

      <PageHeader title="Fee Management" subtitle={user?.branch}>
        <button className="btn btn-outline" style={{ color:'#6366f1', borderColor:'#6366f1' }}
          onClick={() => setShowBulkFee(true)}>
          <IndianRupee size={14}/> Bulk Set Fee
        </button>
        <button className="btn btn-outline" style={{ color:'#10b981', borderColor:'#10b981' }}
          onClick={handleNotifyAll} disabled={notifyLoading}>
          <Bell size={14}/> {notifyLoading ? 'Sending...' : 'Notify All'}
        </button>
      </PageHeader>

      {/* ── Summary Cards ── */}
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

      {/* ── Filters ── */}
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
            <option value="notset">Not Set</option>
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:6, flex:1, maxWidth:260 }}>
            <Search size={15} color="#94a3b8"/>
            <input className="input" placeholder="Search name or roll no..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th><th>Status</th><th>Roll No</th><th>Student</th>
              <th>Parent</th><th>Phone</th><th>Total Fee</th>
              <th>Term 1</th><th>Term 2</th><th>Term 3</th><th>Due</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan={12} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading...</td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={12}><EmptyState message="No students found"/></td>
              </tr>
            ) : paginated.map((s, i) => {
              const due  = Math.max(0, (Number(s.totalFee)||0) - (Number(s.paidFee)||0));
              const { label:fLabel, color:fColor } = getFeeStatus(s);
              return (
                <tr key={s.id || `row-${i}`}>
                  <td style={{ color:'#94a3b8' }}>{(page-1)*perPage+i+1}</td>
                  <td>
                    <span style={{ padding:'3px 8px', borderRadius:20, background:`${fColor}20`, color:fColor, fontSize:'0.7rem', fontWeight:600 }}>
                      {fLabel}
                    </span>
                  </td>
                  <td style={{ fontWeight:600, color:'#4f46e5' }}>{s.rollNo}</td>
                  <td style={{ fontWeight:600 }}>{s.name}</td>
                  <td>{s.parentName}</td>
                  <td>{s.phone}</td>
                  <td style={{ fontWeight:700, color: Number(s.totalFee)>0 ? '#1e293b' : '#94a3b8' }}>
                    {Number(s.totalFee)>0 ? `₹${Number(s.totalFee).toLocaleString()}` : '—'}
                  </td>
                  <td>{getTermDisplay(s, 'term1')}</td>
                  <td>{getTermDisplay(s, 'term2')}</td>
                  <td>{getTermDisplay(s, 'term3')}</td>
                  <td style={{ fontWeight:700, color:due>0?'#ef4444':'#10b981' }}>
                    {Number(s.totalFee)>0 ? `₹${due.toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {/* Set / Edit Total Fee */}
                      <button
                        className="btn btn-outline"
                        style={{ padding:'4px 8px', fontSize:'0.7rem', color:'#6366f1', borderColor:'#6366f1' }}
                        title={Number(s.totalFee)>0 ? 'Edit Total Fee' : 'Set Total Fee'}
                        onClick={() => { setSetFeeModal(s); setNewTotalFee(s.totalFee ? String(s.totalFee) : ''); }}>
                        <IndianRupee size={11}/> {Number(s.totalFee)>0 ? 'Edit' : 'Set'}
                      </button>
                      {/* Update term payments */}
                      <button
                        className="btn btn-primary"
                        style={{ padding:'4px 8px', fontSize:'0.7rem' }}
                        disabled={!Number(s.totalFee)}
                        title={!Number(s.totalFee) ? 'Set total fee first' : 'Update term payments'}
                        onClick={() => {
                          setEditFee(s);
                          setFeeForm({ term1: s.term1||0, term2: s.term2||0, term3: s.term3||0 });
                        }}>
                        <Eye size={11}/> Update
                      </button>
                      {/* WhatsApp notify */}
                      <button
                        className="btn btn-outline"
                        style={{ padding:'4px 8px', fontSize:'0.7rem', color:'#10b981', borderColor:'#10b981' }}
                        onClick={() => notifyStudent(s)}>
                        <Bell size={11}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
        <Pagination total={filtered.length} page={page} perPage={perPage} onChange={setPage}/>
      </div>

      {/* ── Set / Edit Total Fee Modal ── */}
      {setFeeModal && (
        <Modal open onClose={() => { setSetFeeModal(null); setNewTotalFee(''); }}
          title={Number(setFeeModal.totalFee) > 0 ? `Edit Total Fee — ${setFeeModal.name}` : `Set Total Fee — ${setFeeModal.name}`}
          size="sm">

          <div style={{ background:'#f8fafc', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.82rem', color:'#64748b' }}>
            <div>Student: <strong style={{ color:'#1e293b' }}>{setFeeModal.name}</strong></div>
            <div>Class: <strong>{setFeeModal.class} — {setFeeModal.section}</strong></div>
            {Number(setFeeModal.totalFee) > 0 && (
              <div style={{ marginTop:6, color:'#f59e0b', fontWeight:600 }}>
                ⚠️ Current fee: ₹{Number(setFeeModal.totalFee).toLocaleString()}. Editing will update term dues.
              </div>
            )}
          </div>

          <FormField label="Total Annual Fee (₹)" required>
            <input className="input" type="number" min="0"
              placeholder="e.g. 35000"
              value={newTotalFee}
              onChange={e => setNewTotalFee(e.target.value)}/>
          </FormField>

          {/* Live term preview */}
          {split && (
            <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius:10, padding:'12px 14px', marginTop:10, border:'1.5px solid #bfdbfe' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#1d4ed8', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Auto-split into 3 terms
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[['Term 1', split.t1], ['Term 2', split.t2], ['Term 3', split.t3]].map(([label, amt]) => (
                  <div key={label} style={{ textAlign:'center', background:'white', borderRadius:8, padding:'8px 6px', border:'1px solid #bfdbfe' }}>
                    <div style={{ fontSize:'0.65rem', color:'#64748b', fontWeight:600 }}>{label}</div>
                    <div style={{ fontSize:'0.9rem', fontWeight:800, color:'#1d4ed8', marginTop:2 }}>₹{amt.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
            <button className="btn btn-outline" onClick={() => { setSetFeeModal(null); setNewTotalFee(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTotalFee} disabled={saving || !newTotalFee}>
              {saving ? 'Saving...' : Number(setFeeModal.totalFee) > 0 ? 'Update Fee' : 'Set Fee'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Bulk Set Fee Modal ── */}
      {showBulkFee && (
        <Modal open onClose={() => { setShowBulkFee(false); setBulkAmount(''); }}
          title="Bulk Set Total Fee" size="sm">

          <div style={{ background:'#fef9c3', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.82rem', color:'#854d0e', border:'1px solid #fde047' }}>
            ⚠️ This sets the same total fee for <strong>all students without a fee</strong> in the selected class/section.
            Select a class first using the filter above.
          </div>

          <div style={{ marginBottom:12, padding:'8px 12px', background:'#f0f9ff', borderRadius:8, fontSize:'0.82rem', color:'#0369a1' }}>
            Target: <strong>{cls || 'All classes'}</strong> {section ? `— Section ${section}` : ''} &nbsp;|&nbsp;
            Students without fee: <strong>{filtered.filter(s => !Number(s.totalFee)).length}</strong>
          </div>

          <FormField label="Total Annual Fee per Student (₹)" required>
            <input className="input" type="number" min="0"
              placeholder="e.g. 35000"
              value={bulkAmount}
              onChange={e => setBulkAmount(e.target.value)}/>
          </FormField>

          {bulkSplit && (
            <div style={{ background:'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius:10, padding:'12px 14px', marginTop:10, border:'1.5px solid #bfdbfe' }}>
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#1d4ed8', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Per student auto-split
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[['Term 1', bulkSplit.t1], ['Term 2', bulkSplit.t2], ['Term 3', bulkSplit.t3]].map(([label, amt]) => (
                  <div key={label} style={{ textAlign:'center', background:'white', borderRadius:8, padding:'8px 6px', border:'1px solid #bfdbfe' }}>
                    <div style={{ fontSize:'0.65rem', color:'#64748b', fontWeight:600 }}>{label}</div>
                    <div style={{ fontSize:'0.9rem', fontWeight:800, color:'#1d4ed8', marginTop:2 }}>₹{amt.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
            <button className="btn btn-outline" onClick={() => { setShowBulkFee(false); setBulkAmount(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveBulkFee} disabled={bulkLoading || !bulkAmount}>
              {bulkLoading ? 'Setting...' : 'Set for All'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Update Term Payments Modal ── */}
      {editFee && (
        <Modal open onClose={() => setEditFee(null)}
          title={`Update Term Payments — ${editFee.name}`} size="sm">

          <div style={{ background:'#f8fafc', borderRadius:8, padding:12, marginBottom:16, fontSize:'0.875rem' }}>
            <div>Total Fee: <strong>₹{Number(editFee.totalFee)?.toLocaleString()}</strong></div>
            <div style={{ marginTop:4, color:'#94a3b8' }}>Enter amount paid per term</div>
          </div>

          {[
            { key:'term1', label:'Term 1' },
            { key:'term2', label:'Term 2' },
            { key:'term3', label:'Term 3' },
          ].map(({ key, label }) => {
            const total  = Number(editFee.totalFee) || 0;
            const base   = total > 0 ? Math.floor(total / 3) : 0;
            const extra  = total > 0 ? total - base * 3 : 0;
            const expected = key === 'term1' ? base + extra : base;
            return (
              <FormField key={key} label={`${label} Amount (₹) — Expected: ₹${expected.toLocaleString()}`}>
                <input className="input" type="number" min="0" max={expected}
                  value={feeForm[key]}
                  onChange={e => setFeeForm({ ...feeForm, [key]: Number(e.target.value) })}/>
              </FormField>
            );
          })}

          <div style={{ background:'#eff6ff', borderRadius:8, padding:'10px 14px', fontSize:'0.875rem', marginTop:8 }}>
            Total Paid: <strong>₹{(Number(feeForm.term1)+Number(feeForm.term2)+Number(feeForm.term3)).toLocaleString()}</strong>
            &nbsp;/&nbsp;₹{Number(editFee.totalFee)?.toLocaleString()}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:12 }}>
            <button className="btn btn-outline" onClick={() => setEditFee(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveFee} disabled={saving}>
              {saving ? 'Saving...' : 'Update Fee'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Notify All Results Modal ── */}
      {showNotifyAll && (
        <Modal open onClose={() => setShowNotifyAll(false)}
          title="📲 WhatsApp Notifications" size="lg">
          <p style={{ fontSize:'0.8rem', color:'#64748b', marginBottom:14 }}>
            {notifyAllList.filter(n => n.status==='sent').length} sent ✅ &nbsp;|&nbsp;
            {notifyAllList.filter(n => n.status==='failed').length} failed ❌
          </p>
          <div style={{ maxHeight:420, overflowY:'auto' }}>
            {notifyAllList.map((n, i) => (
              <div key={n.studentId || i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.875rem', color:'#1e293b' }}>{n.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{n.phone}</div>
                </div>
                <span style={{ padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, background:n.status==='sent'?'#dcfce7':'#fee2e2', color:n.status==='sent'?'#10b981':'#ef4444' }}>
                  {n.status==='sent' ? '✅ Sent' : `❌ ${n.error || 'Failed'}`}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
            <button className="btn btn-outline" onClick={() => setShowNotifyAll(false)}>Close</button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}