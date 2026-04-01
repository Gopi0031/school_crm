'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, TableWrapper, Pagination, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Search, X, Lock, Bell } from 'lucide-react';  // ✅ added Bell

export default function TeacherFee() {
  const { user } = useAuth();

  const teacherClass   = user?.assignedClass || user?.class || '';
  const teacherSection = user?.section || '';

  const [students,      setStudents]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [selected,      setSelected]      = useState(null);
  const [notifyLoading, setNotifyLoading] = useState(false);   // ✅ added
  const [notifyAllList, setNotifyAllList] = useState([]);       // ✅ added
  const [showNotifyAll, setShowNotifyAll] = useState(false);    // ✅ added
  const [toast,         setToast]         = useState('');       // ✅ added
  const perPage = 10;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleNotifyAll = async () => {
    if (!confirm(`Send WhatsApp fee reminders to ${teacherClass}-${teacherSection}?`)) return;
    setNotifyLoading(true);
    const res = await fetch('/api/fee/notify-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch: user?.branch, cls: teacherClass, section: teacherSection }),
    });
    const d = await res.json();
    if (d.success) {
      setNotifyAllList(d.data);
      setShowNotifyAll(true);
      showToast(`✅ ${d.summary}`);
    } else {
      showToast('❌ Failed to send notifications');
    }
    setNotifyLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    if (!teacherClass || !teacherSection) { setLoading(false); return; }

    const params = new URLSearchParams({ branch: user.branch || '' });
    params.set('class', teacherClass);
    params.set('section', teacherSection);

    setLoading(true);
    fetch(`/api/fee?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setStudents(d.data); })
      .finally(() => setLoading(false));
  }, [user, teacherClass, teacherSection]);

  const filtered = useMemo(() => students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const totalFeeSum = students.reduce((a, s) => a + (s.totalFee || 0), 0);
  const paidFeeSum  = students.reduce((a, s) => a + (s.paidFee  || 0), 0);
  const dueSum      = totalFeeSum - paidFeeSum;
  const fullyPaid   = students.filter(s => s.totalFee && s.paidFee >= s.totalFee).length;
  const pending     = students.filter(s => !s.paidFee || s.paidFee === 0).length;
  const partial     = students.length - fullyPaid - pending;

  const getFeeStatus = (s) => {
    const pct = s.totalFee ? Math.round((s.paidFee || 0) / s.totalFee * 100) : 0;
    if (pct >= 100) return { label: 'Paid',    color: '#10b981', bg: '#dcfce7' };
    if (pct >    0) return { label: 'Partial', color: '#f59e0b', bg: '#fef9c3' };
    return              { label: 'Pending',  color: '#ef4444', bg: '#fee2e2' };
  };

  const getTerms = (s) => {
    const terms = [];
    if (s.term1 !== undefined) terms.push({ l: 'Term 1', v: s.term1 || 0, due: s.term1Due || 0 });
    if (s.term2 !== undefined) terms.push({ l: 'Term 2', v: s.term2 || 0, due: s.term2Due || 0 });
    if (s.term3 !== undefined) terms.push({ l: 'Term 3', v: s.term3 || 0, due: s.term3Due || 0 });
    if (!terms.length) {
      terms.push(
        { l: 'Term 1', v: 0, due: 0 },
        { l: 'Term 2', v: 0, due: 0 },
        { l: 'Term 3', v: 0, due: 0 },
      );
    }
    return terms;
  };

  // ✅ No class assigned — guard AFTER all hooks
  if (!loading && (!teacherClass || !teacherSection)) {
    return (
      <AppLayout requiredRole="teacher-admin">
        <PageHeader title="Fee Details" subtitle={user?.branch} />
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width:64, height:64, background:'#fee2e2', borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <Lock size={28} color="#ef4444" />
          </div>
          <h3 style={{ fontSize:'1.1rem', fontWeight:700, color:'#1e293b', marginBottom:8 }}>
            No Class Assigned
          </h3>
          <p style={{ color:'#64748b', fontSize:'0.875rem', maxWidth:400, margin:'0 auto' }}>
            You need to be assigned as a class teacher to view fee details.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout requiredRole="teacher-admin">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {toast && (
        <div style={{ position:'fixed', top:20, right:20, background:'#10b981', color:'white',
          padding:'12px 20px', borderRadius:10, fontWeight:600, zIndex:9999 }}>
          {toast}
        </div>
      )}

      <PageHeader title="Fee Details" subtitle={`${teacherClass} — Section ${teacherSection} • ${user?.branch}`}>
        <button className="btn btn-outline" style={{ color:'#10b981', borderColor:'#10b981' }}
          onClick={handleNotifyAll} disabled={notifyLoading}>
          <Bell size={14} /> {notifyLoading ? 'Sending...' : 'Notify All'}
        </button>
      </PageHeader>

      {/* Class Info Banner */}
      <div style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', borderRadius:12,
        padding:'14px 20px', marginBottom:16, display:'flex', justifyContent:'space-between',
        alignItems:'center', color:'white' }}>
        <div>
          <div style={{ fontSize:'0.75rem', opacity:0.85 }}>Class Teacher For</div>
          <div style={{ fontSize:'1.1rem', fontWeight:700 }}>{teacherClass} — Section {teacherSection}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'0.75rem', opacity:0.85 }}>{user?.branch}</div>
          <div style={{ fontSize:'0.9rem', fontWeight:600 }}>{user?.name}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        {[
          { l:'Total Collected', v:`₹${paidFeeSum.toLocaleString()}`, c:'#10b981' },
          { l:'Total Due',       v:`₹${dueSum.toLocaleString()}`,     c:'#ef4444' },
          { l:'Fully Paid',      v: fullyPaid,                         c:'#4f46e5' },
          { l:'Pending',         v: pending,                           c:'#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign:'center', borderTop:`3px solid ${c}`, padding:14 }}>
            <div style={{ fontSize:'1.4rem', fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {totalFeeSum > 0 && (
        <div className="card" style={{ marginBottom:16, padding:'14px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:'0.83rem' }}>
            <span style={{ fontWeight:700, color:'#1e293b' }}>Overall Collection Progress</span>
            <span style={{ fontWeight:800, color:'#4f46e5' }}>
              {Math.round(paidFeeSum / totalFeeSum * 100)}%
            </span>
          </div>
          <div style={{ height:10, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(100, Math.round(paidFeeSum/totalFeeSum*100))}%`,
              background:'linear-gradient(90deg,#10b981,#4f46e5)', borderRadius:99, transition:'width 0.8s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:'0.72rem', color:'#94a3b8' }}>
            <span>Collected: <b style={{ color:'#10b981' }}>₹{paidFeeSum.toLocaleString()}</b></span>
            <span>Total: <b style={{ color:'#1e293b' }}>₹{totalFeeSum.toLocaleString()}</b></span>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:10 }}>
            {[
              { l:`${fullyPaid} Paid`,  c:'#10b981', bg:'#dcfce7' },
              { l:`${partial} Partial`, c:'#f59e0b', bg:'#fef9c3' },
              { l:`${pending} Pending`, c:'#ef4444', bg:'#fee2e2' },
            ].map(({ l, c, bg }) => (
              <span key={l} style={{ padding:'3px 12px', borderRadius:20, fontSize:'0.72rem',
                fontWeight:700, background:bg, color:c }}>{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom:16, padding:'12px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Search size={15} color="#94a3b8" />
          <input style={{ border:'none', outline:'none', flex:1, fontSize:'0.875rem', background:'transparent' }}
            placeholder="Search by student name or roll no..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
              <X size={14} />
            </button>
          )}
          <span style={{ fontSize:'0.75rem', color:'#94a3b8', whiteSpace:'nowrap' }}>
            {filtered.length} students
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th><th>Status</th><th>Student</th><th>Total Fee</th>
              <th>Term 1</th><th>Term 2</th><th>Term 3</th>
              <th>Paid</th><th>Due</th><th>View</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan={10} style={{ textAlign:'center', padding:48 }}>
                  <div style={{ width:32, height:32, border:'3px solid #e2e8f0', borderTopColor:'#4f46e5',
                    borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 10px' }} />
                  <span style={{ color:'#94a3b8', fontSize:'0.83rem' }}>Loading fee records...</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={10}><EmptyState message="No fee records found" /></td>
              </tr>
            ) : paginated.map((s, i) => {
              const due = (s.totalFee || 0) - (s.paidFee || 0);
              const pct = s.totalFee ? Math.round((s.paidFee || 0) / s.totalFee * 100) : 0;
              const { label, color, bg } = getFeeStatus(s);
              return (
                <tr key={s.id || `row-${i}`} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ color:'#94a3b8', fontSize:'0.8rem' }}>{(page-1)*perPage+i+1}</td>
                  <td>
                    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                      <span style={{ padding:'2px 10px', borderRadius:20, fontSize:'0.7rem',
                        fontWeight:700, background:bg, color, width:'fit-content' }}>{label}</span>
                      <div style={{ width:56, height:4, background:'#f1f5f9', borderRadius:99 }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:99 }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight:600, color:'#1e293b', fontSize:'0.875rem' }}>{s.name}</div>
                    <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{s.rollNo}</div>
                  </td>
                  <td style={{ fontWeight:600 }}>₹{(s.totalFee||0).toLocaleString()}</td>
                  {/* ✅ Show termDue if term not paid yet, else show paid amount */}
                  <td style={{ color: s.term1Due===0 && s.term1>0 ? '#10b981' : s.term1Due>0 ? '#ef4444' : '#94a3b8', fontWeight:600 }}>
                    {s.term1Due === 0 && s.term1 > 0 ? `✅ ₹${s.term1.toLocaleString()}` : s.term1Due > 0 ? `⚠️ ₹${s.term1Due.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ color: s.term2Due===0 && s.term2>0 ? '#10b981' : s.term2Due>0 ? '#ef4444' : '#94a3b8', fontWeight:600 }}>
                    {s.term2Due === 0 && s.term2 > 0 ? `✅ ₹${s.term2.toLocaleString()}` : s.term2Due > 0 ? `⚠️ ₹${s.term2Due.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ color: s.term3Due===0 && s.term3>0 ? '#10b981' : s.term3Due>0 ? '#ef4444' : '#94a3b8', fontWeight:600 }}>
                    {s.term3Due === 0 && s.term3 > 0 ? `✅ ₹${s.term3.toLocaleString()}` : s.term3Due > 0 ? `⚠️ ₹${s.term3Due.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ color:'#10b981', fontWeight:700 }}>₹{(s.paidFee||0).toLocaleString()}</td>
                  <td style={{ color: due>0 ? '#ef4444':'#10b981', fontWeight:700 }}>₹{due.toLocaleString()}</td>
                  <td>
                    <button className="btn btn-primary"
                      style={{ padding:'4px 10px', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:4 }}
                      onClick={() => setSelected(s)}>
                      <Eye size={11} /> View
                    </button>
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

      {/* Detail Modal */}
      {selected && (() => {
        const due = (selected.totalFee||0) - (selected.paidFee||0);
        const pct = selected.totalFee ? Math.round((selected.paidFee||0)/selected.totalFee*100) : 0;
        const { label, color, bg } = getFeeStatus(selected);
        const terms = getTerms(selected);
        return (
          <Modal open onClose={() => setSelected(null)} title={selected.name} size="md">
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', borderRadius:10,
              background:'linear-gradient(135deg,#eff6ff,#e0f2fe)', marginBottom:18 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
                display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.2rem' }}>
                {selected.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'1rem', color:'#1e293b' }}>{selected.name}</div>
                <div style={{ fontSize:'0.75rem', color:'#64748b' }}>
                  {selected.rollNo} • {selected.class} — {selected.section}
                </div>
              </div>
              <span style={{ marginLeft:'auto', padding:'3px 12px', borderRadius:20,
                fontSize:'0.73rem', fontWeight:700, background:bg, color }}>{label}</span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
              {[
                { l:'Total Fee', v:`₹${(selected.totalFee||0).toLocaleString()}`, c:'#4f46e5' },
                { l:'Paid',      v:`₹${(selected.paidFee||0).toLocaleString()}`,  c:'#10b981' },
                { l:'Due',       v:`₹${due.toLocaleString()}`, c: due>0?'#ef4444':'#10b981' },
              ].map(({ l, v, c }) => (
                <div key={l} style={{ background:`${c}12`, borderRadius:10, padding:14, textAlign:'center', borderTop:`3px solid ${c}` }}>
                  <div style={{ fontSize:'1.1rem', fontWeight:800, color:c }}>{v}</div>
                  <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:3 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* ✅ Term breakdown with due status */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:'0.72rem', color:'#94a3b8', fontWeight:700,
                textTransform:'uppercase', marginBottom:8 }}>Term Breakdown</div>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${terms.length},1fr)`, gap:8 }}>
                {terms.map(({ l, v, due: tDue }) => (
                  <div key={l} style={{ padding:'10px 12px', background:'#f8fafc', borderRadius:10,
                    textAlign:'center', border:`1px solid ${v>0 && tDue===0 ? '#bbf7d0' : tDue>0 ? '#fecaca' : '#e2e8f0'}` }}>
                    <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, marginBottom:4 }}>{l}</div>
                    <div style={{ fontWeight:800, fontSize:'0.9rem',
                      color: v>0 && tDue===0 ? '#10b981' : tDue>0 ? '#ef4444' : '#94a3b8' }}>
                      ₹{v.toLocaleString()}
                    </div>
                    <div style={{ fontSize:'0.62rem', marginTop:3, fontWeight:600,
                      color: v>0 && tDue===0 ? '#10b981' : tDue>0 ? '#ef4444' : '#94a3b8' }}>
                      {v>0 && tDue===0 ? '✅ Paid' : tDue>0 ? `⚠️ ₹${tDue.toLocaleString()} due` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, marginBottom:16 }}>
              {[['Parent', selected.parentName], ['Phone', selected.phone]].map(([l, v]) => (
                <div key={l} style={{ padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase' }}>{l}</div>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', marginTop:2 }}>{v || '—'}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </Modal>
        );
      })()}

      {/* Notify All Results Modal */}
      {showNotifyAll && (
        <Modal open onClose={() => setShowNotifyAll(false)} title="📲 WhatsApp Notifications Sent" size="lg">
          <p style={{ fontSize:'0.8rem', color:'#64748b', marginBottom:14 }}>
            {notifyAllList.filter(n => n.status==='sent').length} sent ✅ &nbsp;|&nbsp;
            {notifyAllList.filter(n => n.status==='failed').length} failed ❌
          </p>
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {notifyAllList.map((n, i) => (
              <div key={n.studentId || i} style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.875rem' }}>{n.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{n.phone}</div>
                </div>
                <span style={{
                  padding:'4px 12px', borderRadius:20, fontSize:'0.72rem', fontWeight:700,
                  background: n.status==='sent' ? '#dcfce7' : '#fee2e2',
                  color:       n.status==='sent' ? '#10b981' : '#ef4444',
                }}>
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
