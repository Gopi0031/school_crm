'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, TableWrapper, Pagination, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Bell, Search, IndianRupee, Send, CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

export default function BranchAdminFee() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [feeStatus, setFeeStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editFee, setEditFee] = useState(null);
  const [feeForm, setFeeForm] = useState({ term1: '', term2: '', term3: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // Notification states
  const [notifyAllList, setNotifyAllList] = useState([]);
  const [showNotifyAll, setShowNotifyAll] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifyType, setNotifyType] = useState('all'); // 'all' or 'due'
  const [notifyStats, setNotifyStats] = useState(null);
  
  // Single student notify
  const [notifyingStudent, setNotifyingStudent] = useState(null);
  
  // Set Total Fee states
  const [setFeeModal, setSetFeeModal] = useState(null);
  const [newTotalFee, setNewTotalFee] = useState('');
  
  // Bulk Fee states
  const [showBulkFee, setShowBulkFee] = useState(false);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Notification history
  const [showHistory, setShowHistory] = useState(false);
  const [notifyHistory, setNotifyHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const perPage = 10;

  // Toast helper
  const showToast = (msg, type = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 4000);
  };

  // ── Load students ─────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ branch: user?.branch || '' });
      if (cls) params.set('class', cls);
      if (section) params.set('section', section);
      const r = await fetch(`/api/fee?${params}`);
      const d = await r.json();
      if (d.success) setStudents(d.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load students', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user, cls, section]);

  // ── Fee status helpers ────────────────────────────────────────────────
  const getFeeStatus = (s) => {
    const total = Number(s.totalFee) || 0;
    const paid = Number(s.paidFee) || 0;
    if (total === 0) return { label: 'Not Set', color: '#94a3b8' };
    if (paid >= total) return { label: 'Paid', color: '#10b981' };
    if (paid > 0) return { label: 'Partial', color: '#f59e0b' };
    return { label: 'Pending', color: '#ef4444' };
  };

  // ── Term cell helper ──────────────────────────────────────────────────
  const getTermDisplay = (s, term) => {
    const total = Math.round(Number(s.totalFee) || 0);
    const paid = Math.round(Number(s[term]) || 0);
    const base = total > 0 ? Math.floor(total / 3) : 0;
    const extra = total > 0 ? total - base * 3 : 0;
    const expected = term === 'term1' ? base + extra : base;
    const dueKey = `${term}Due`;
    let due = Math.round(Number(s[dueKey]) || 0);

    if (!due && total > 0) due = Math.max(0, expected - paid);

    if (total === 0) return <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>;
    if (paid >= expected && expected > 0)
      return <span style={{ color: '#10b981', fontWeight: 700 }}>₹{paid.toLocaleString()}</span>;
    if (paid > 0 && due > 0)
      return (
        <div>
          <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem' }}>₹{paid.toLocaleString()}</span>
          <div style={{ fontSize: '0.65rem', color: '#ef4444' }}>₹{due.toLocaleString()} left</div>
        </div>
      );
    return <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.82rem' }}>₹{due.toLocaleString()} due</span>;
  };

  // ── Filtered + paginated ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = students;
    if (feeStatus === 'paid') list = list.filter(s => Number(s.paidFee) >= Number(s.totalFee) && Number(s.totalFee) > 0);
    if (feeStatus === 'pending') list = list.filter(s => !Number(s.paidFee) && Number(s.totalFee) > 0);
    if (feeStatus === 'partial') list = list.filter(s => Number(s.paidFee) > 0 && Number(s.paidFee) < Number(s.totalFee));
    if (feeStatus === 'notset') list = list.filter(s => !Number(s.totalFee));
    if (search) list = list.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [students, feeStatus, search]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalFee = filtered.reduce((a, s) => a + (Number(s.totalFee) || 0), 0);
  const paidFee = filtered.reduce((a, s) => a + (Number(s.paidFee) || 0), 0);
  const dueFee = totalFee - paidFee;

  // ── Save term fee update ──────────────────────────────────────────────
  const saveFee = async () => {
    if (!editFee) return;
    setSaving(true);
    try {
      const r = await fetch('/api/fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: editFee.id, ...feeForm }),
      });
      const d = await r.json();
      if (d.success) {
        showToast('✅ Fee updated successfully');
        setEditFee(null);
        load();
      } else {
        showToast('❌ ' + (d.error || 'Failed to save'), 'error');
      }
    } catch {
      showToast('❌ Failed to save', 'error');
    }
    setSaving(false);
  };

  // ── Save total fee (set/reset) ────────────────────────────────────────
  const saveTotalFee = async () => {
    if (!newTotalFee || isNaN(Number(newTotalFee)) || Number(newTotalFee) < 0) {
      showToast('❌ Enter a valid amount', 'error');
      return;
    }
    setSaving(true);
    try {
      const total = Number(newTotalFee);
      const base = Math.floor(total / 3);
      const extra = total - base * 3;

      const r = await fetch(`/api/students/${setFeeModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalFee: total,
          term1Due: base + extra,
          term2Due: base,
          term3Due: base,
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
        showToast('❌ ' + (d.error || 'Failed'), 'error');
      }
    } catch {
      showToast('❌ Failed to save', 'error');
    }
    setSaving(false);
  };

  // ── Bulk set fee ──────────────────────────────────────────────────────
  const saveBulkFee = async () => {
    if (!bulkAmount || isNaN(Number(bulkAmount)) || Number(bulkAmount) <= 0) {
      showToast('❌ Enter a valid amount', 'error');
      return;
    }
    if (!cls) {
      showToast('❌ Select a class first', 'error');
      return;
    }
    setBulkLoading(true);
    try {
      const total = Number(bulkAmount);
      const base = Math.floor(total / 3);
      const extra = total - base * 3;

      const toUpdate = filtered.filter(s => !Number(s.totalFee));
      if (toUpdate.length === 0) {
        showToast('ℹ️ All students already have fee set', 'info');
        setBulkLoading(false);
        return;
      }

      await Promise.all(toUpdate.map(s =>
        fetch(`/api/students/${s.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
    } catch {
      showToast('❌ Bulk update failed', 'error');
    }
    setBulkLoading(false);
  };

  // ── Notify single student ─────────────────────────────────────────────
  const notifyStudent = async (s) => {
    const due = (Number(s.totalFee) || 0) - (Number(s.paidFee) || 0);
    
    if (!s.phone || s.phone.length < 10) {
      showToast('❌ No valid phone number', 'error');
      return;
    }
    
    if (!Number(s.totalFee)) {
      showToast('❌ Fee not set for this student', 'error');
      return;
    }

    setNotifyingStudent(s.id);
    
    try {
      const res = await fetch('/api/fee/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: s.id }),
      });
      const d = await res.json();
      
      if (d.success) {
        showToast(`✅ WhatsApp sent to ${s.name}`);
      } else {
        showToast(`❌ Failed: ${d.error}`, 'error');
      }
    } catch {
      showToast('❌ Failed to send notification', 'error');
    }
    
    setNotifyingStudent(null);
  };

  // ── Notify all students ───────────────────────────────────────────────
  const handleNotifyAll = async () => {
    const studentsWithDues = filtered.filter(s => {
      const total = Number(s.totalFee) || 0;
      const paid = Number(s.paidFee) || 0;
      return total > 0 && s.phone && s.phone.length >= 10;
    });

    if (studentsWithDues.length === 0) {
      showToast('❌ No students with valid phone and fee to notify', 'error');
      return;
    }

    const confirmMsg = notifyType === 'due'
      ? `Send WhatsApp fee reminders to ${studentsWithDues.filter(s => (Number(s.totalFee) - Number(s.paidFee)) > 0).length} students with pending dues?`
      : `Send WhatsApp fee notifications to all ${studentsWithDues.length} students in ${user?.branch}?`;

    if (!confirm(confirmMsg)) return;

    setNotifyLoading(true);
    setNotifyAllList([]);
    setNotifyStats(null);

    try {
      const res = await fetch('/api/fee/notify-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: user?.branch,
          cls,
          section,
          notifyType,
        }),
      });
      const d = await res.json();

      if (d.success) {
        setNotifyAllList(d.data);
        setNotifyStats(d.stats);
        setShowNotifyAll(true);
        showToast(`✅ ${d.summary}`);
      } else {
        showToast('❌ ' + (d.error || 'Failed to send notifications'), 'error');
      }
    } catch {
      showToast('❌ Failed to send notifications', 'error');
    }
    setNotifyLoading(false);
  };

  // ── Load notification history ─────────────────────────────────────────
  const loadNotifyHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/fee/notify-all?branch=${user?.branch}&limit=50`);
      const d = await res.json();
      if (d.success) {
        setNotifyHistory(d.data);
      }
    } catch (err) {
      console.error(err);
    }
    setHistoryLoading(false);
  };

  // ── Term preview for Set Fee modal ────────────────────────────────────
  const previewSplit = (amt) => {
    const total = Number(amt) || 0;
    if (total === 0) return null;
    const base = Math.floor(total / 3);
    const extra = total - base * 3;
    return { t1: base + extra, t2: base, t3: base };
  };
  const split = previewSplit(newTotalFee);
  const bulkSplit = previewSplit(bulkAmount);

  return (
    <AppLayout requiredRole="branch-admin">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: toastType === 'error' ? '#ef4444' : toastType === 'info' ? '#3b82f6' : '#10b981',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 10,
          fontWeight: 600,
          zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {toastType === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {toast}
        </div>
      )}

      <PageHeader title="Fee Management" subtitle={user?.branch}>
        <button
          className="btn btn-outline"
          style={{ color: '#6366f1', borderColor: '#6366f1' }}
          onClick={() => setShowBulkFee(true)}
        >
          <IndianRupee size={14} /> Bulk Set Fee
        </button>
        
        <button
          className="btn btn-outline"
          style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
          onClick={() => {
            setShowHistory(true);
            loadNotifyHistory();
          }}
        >
          <Clock size={14} /> History
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            className="select"
            value={notifyType}
            onChange={(e) => setNotifyType(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          >
            <option value="all">All Students</option>
            <option value="due">Only Dues</option>
          </select>
          
          <button
            className="btn btn-primary"
            style={{ background: '#25D366', borderColor: '#25D366' }}
            onClick={handleNotifyAll}
            disabled={notifyLoading}
          >
            <Send size={14} />
            {notifyLoading ? 'Sending...' : 'Notify All'}
          </button>
        </div>
      </PageHeader>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { l: 'Total Fee', v: `₹${(totalFee / 100000).toFixed(2)}L`, c: '#4f46e5' },
          { l: 'Collected', v: `₹${(paidFee / 100000).toFixed(2)}L`, c: '#10b981' },
          { l: 'Due', v: `₹${(dueFee / 100000).toFixed(2)}L`, c: '#ef4444' },
          { l: 'Paid %', v: `${totalFee ? Math.round(paidFee / totalFee * 100) : 0}%`, c: '#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}` }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="select" value={cls} onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="select" value={section} onChange={e => { setSection(e.target.value); setPage(1); }}>
            <option value="">All Sections</option>
            {['A', 'B', 'C', 'D'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="select" value={feeStatus} onChange={e => { setFeeStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
            <option value="notset">Not Set</option>
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, maxWidth: 260 }}>
            <Search size={15} color="#94a3b8" />
            <input
              className="input"
              placeholder="Search name or roll no..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Status</th>
              <th>Roll No</th>
              <th>Student</th>
              <th>Parent</th>
              <th>Phone</th>
              <th>Total Fee</th>
              <th>Term 1</th>
              <th>Term 2</th>
              <th>Term 3</th>
              <th>Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan={12} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={12}><EmptyState message="No students found" /></td>
              </tr>
            ) : paginated.map((s, i) => {
              const due = Math.max(0, (Number(s.totalFee) || 0) - (Number(s.paidFee) || 0));
              const { label: fLabel, color: fColor } = getFeeStatus(s);
              const isNotifying = notifyingStudent === s.id;
              
              return (
                <tr key={s.id || `row-${i}`}>
                  <td style={{ color: '#94a3b8' }}>{(page - 1) * perPage + i + 1}</td>
                  <td>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 20,
                      background: `${fColor}20`,
                      color: fColor,
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>
                      {fLabel}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#4f46e5' }}>{s.rollNo}</td>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.parentName}</td>
                  <td>
                    <span style={{ 
                      color: s.phone && s.phone.length >= 10 ? '#1e293b' : '#ef4444',
                      fontSize: '0.82rem'
                    }}>
                      {s.phone || '—'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: Number(s.totalFee) > 0 ? '#1e293b' : '#94a3b8' }}>
                    {Number(s.totalFee) > 0 ? `₹${Number(s.totalFee).toLocaleString()}` : '—'}
                  </td>
                  <td>{getTermDisplay(s, 'term1')}</td>
                  <td>{getTermDisplay(s, 'term2')}</td>
                  <td>{getTermDisplay(s, 'term3')}</td>
                  <td style={{ fontWeight: 700, color: due > 0 ? '#ef4444' : '#10b981' }}>
                    {Number(s.totalFee) > 0 ? `₹${due.toLocaleString()}` : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {/* Set / Edit Total Fee */}
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#6366f1', borderColor: '#6366f1' }}
                        title={Number(s.totalFee) > 0 ? 'Edit Total Fee' : 'Set Total Fee'}
                        onClick={() => {
                          setSetFeeModal(s);
                          setNewTotalFee(s.totalFee ? String(s.totalFee) : '');
                        }}
                      >
                        <IndianRupee size={11} /> {Number(s.totalFee) > 0 ? 'Edit' : 'Set'}
                      </button>
                      
                      {/* Update term payments */}
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        disabled={!Number(s.totalFee)}
                        title={!Number(s.totalFee) ? 'Set total fee first' : 'Update term payments'}
                        onClick={() => {
                          setEditFee(s);
                          setFeeForm({ term1: s.term1 || 0, term2: s.term2 || 0, term3: s.term3 || 0 });
                        }}
                      >
                        <Eye size={11} /> Update
                      </button>
                      
                      {/* WhatsApp notify */}
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          color: '#25D366',
                          borderColor: '#25D366',
                          opacity: isNotifying ? 0.6 : 1,
                        }}
                        onClick={() => notifyStudent(s)}
                        disabled={isNotifying || !s.phone || !Number(s.totalFee)}
                        title={!s.phone ? 'No phone number' : !Number(s.totalFee) ? 'Fee not set' : 'Send WhatsApp'}
                      >
                        {isNotifying ? (
                          <div className="spinner" style={{ width: 11, height: 11 }}></div>
                        ) : (
                          <MessageSquare size={11} />
                        )}
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

      {/* ── Set / Edit Total Fee Modal ── */}
      {setFeeModal && (
        <Modal
          open
          onClose={() => { setSetFeeModal(null); setNewTotalFee(''); }}
          title={Number(setFeeModal.totalFee) > 0 ? `Edit Total Fee — ${setFeeModal.name}` : `Set Total Fee — ${setFeeModal.name}`}
          size="sm"
        >
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.82rem', color: '#64748b' }}>
            <div>Student: <strong style={{ color: '#1e293b' }}>{setFeeModal.name}</strong></div>
            <div>Class: <strong>{setFeeModal.class} — {setFeeModal.section}</strong></div>
            {Number(setFeeModal.totalFee) > 0 && (
              <div style={{ marginTop: 6, color: '#f59e0b', fontWeight: 600 }}>
                ⚠️ Current fee: ₹{Number(setFeeModal.totalFee).toLocaleString()}. Editing will update term dues.
              </div>
            )}
          </div>

          <FormField label="Total Annual Fee (₹)" required>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="e.g. 35000"
              value={newTotalFee}
              onChange={e => setNewTotalFee(e.target.value)}
            />
          </FormField>

          {split && (
            <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 10, padding: '12px 14px', marginTop: 10, border: '1.5px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Auto-split into 3 terms
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[['Term 1', split.t1], ['Term 2', split.t2], ['Term 3', split.t3]].map(([label, amt]) => (
                  <div key={label} style={{ textAlign: 'center', background: 'white', borderRadius: 8, padding: '8px 6px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1d4ed8', marginTop: 2 }}>₹{amt.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => { setSetFeeModal(null); setNewTotalFee(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTotalFee} disabled={saving || !newTotalFee}>
              {saving ? 'Saving...' : Number(setFeeModal.totalFee) > 0 ? 'Update Fee' : 'Set Fee'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Bulk Set Fee Modal ── */}
      {showBulkFee && (
        <Modal
          open
          onClose={() => { setShowBulkFee(false); setBulkAmount(''); }}
          title="Bulk Set Total Fee"
          size="sm"
        >
          <div style={{ background: '#fef9c3', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.82rem', color: '#854d0e', border: '1px solid #fde047' }}>
            ⚠️ This sets the same total fee for <strong>all students without a fee</strong> in the selected class/section.
            Select a class first using the filter above.
          </div>

          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f0f9ff', borderRadius: 8, fontSize: '0.82rem', color: '#0369a1' }}>
            Target: <strong>{cls || 'All classes'}</strong> {section ? `— Section ${section}` : ''} &nbsp;|&nbsp;
            Students without fee: <strong>{filtered.filter(s => !Number(s.totalFee)).length}</strong>
          </div>

          <FormField label="Total Annual Fee per Student (₹)" required>
            <input
              className="input"
              type="number"
              min="0"
              placeholder="e.g. 35000"
              value={bulkAmount}
              onChange={e => setBulkAmount(e.target.value)}
            />
          </FormField>

          {bulkSplit && (
            <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 10, padding: '12px 14px', marginTop: 10, border: '1.5px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Per student auto-split
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[['Term 1', bulkSplit.t1], ['Term 2', bulkSplit.t2], ['Term 3', bulkSplit.t3]].map(([label, amt]) => (
                  <div key={label} style={{ textAlign: 'center', background: 'white', borderRadius: 8, padding: '8px 6px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1d4ed8', marginTop: 2 }}>₹{amt.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => { setShowBulkFee(false); setBulkAmount(''); }}>Cancel</button>
            <button className="btn btn-primary" onClick={saveBulkFee} disabled={bulkLoading || !bulkAmount}>
              {bulkLoading ? 'Setting...' : 'Set for All'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Update Term Payments Modal ── */}
      {editFee && (
        <Modal
          open
          onClose={() => setEditFee(null)}
          title={`Update Term Payments — ${editFee.name}`}
          size="sm"
        >
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.875rem' }}>
            <div>Total Fee: <strong>₹{Number(editFee.totalFee)?.toLocaleString()}</strong></div>
            <div style={{ marginTop: 4, color: '#94a3b8' }}>Enter amount paid per term</div>
          </div>

          {[
            { key: 'term1', label: 'Term 1' },
            { key: 'term2', label: 'Term 2' },
            { key: 'term3', label: 'Term 3' },
          ].map(({ key, label }) => {
            const total = Number(editFee.totalFee) || 0;
            const base = total > 0 ? Math.floor(total / 3) : 0;
            const extra = total > 0 ? total - base * 3 : 0;
            const expected = key === 'term1' ? base + extra : base;
            return (
              <FormField key={key} label={`${label} Amount (₹) — Expected: ₹${expected.toLocaleString()}`}>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max={expected}
                  value={feeForm[key]}
                  onChange={e => setFeeForm({ ...feeForm, [key]: Number(e.target.value) })}
                />
              </FormField>
            );
          })}

          <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 14px', fontSize: '0.875rem', marginTop: 8 }}>
            Total Paid: <strong>₹{(Number(feeForm.term1) + Number(feeForm.term2) + Number(feeForm.term3)).toLocaleString()}</strong>
            &nbsp;/&nbsp;₹{Number(editFee.totalFee)?.toLocaleString()}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn-outline" onClick={() => setEditFee(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveFee} disabled={saving}>
              {saving ? 'Saving...' : 'Update Fee'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Notify All Results Modal ── */}
      {showNotifyAll && (
        <Modal
          open
          onClose={() => setShowNotifyAll(false)}
          title="📲 WhatsApp Notifications Sent"
          size="lg"
        >
          {/* Stats Summary */}
          {notifyStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 10,
              marginBottom: 16,
            }}>
              <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>{notifyStats.total}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Total</div>
              </div>
              <div style={{ background: '#dcfce7', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>{notifyStats.sent}</div>
                <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Sent ✅</div>
              </div>
              <div style={{ background: '#fee2e2', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>{notifyStats.failed}</div>
                <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>Failed ❌</div>
              </div>
              <div style={{ background: '#fef9c3', borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ca8a04' }}>{notifyStats.skipped}</div>
                <div style={{ fontSize: '0.7rem', color: '#ca8a04' }}>Skipped ⏭️</div>
              </div>
            </div>
          )}

          {/* Results List */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {notifyAllList.map((n, i) => (
              <div
                key={n.studentId || i}
                style={{
                  padding: '12px',
                  marginBottom: 8,
                  borderRadius: 8,
                  background: n.status === 'sent' ? '#f0fdf4' : n.status === 'skipped' ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${n.status === 'sent' ? '#86efac' : n.status === 'skipped' ? '#fde047' : '#fecaca'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
                      {n.name}
                      <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8, fontSize: '0.75rem' }}>
                        {n.class} - {n.section} | {n.rollNo}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                      📞 {n.phone}
                      {n.totalFee && (
                        <span style={{ marginLeft: 12 }}>
                          💰 Due: ₹{(n.dueFee || 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    background: n.status === 'sent' ? '#dcfce7' : n.status === 'skipped' ? '#fef9c3' : '#fee2e2',
                    color: n.status === 'sent' ? '#10b981' : n.status === 'skipped' ? '#ca8a04' : '#ef4444',
                  }}>
                    {n.status === 'sent' ? '✅ Sent' : n.status === 'skipped' ? `⏭️ ${n.error}` : `❌ ${n.error || 'Failed'}`}
                  </span>
                </div>

                {n.status === 'sent' && n.message && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{
                      fontSize: '0.7rem',
                      color: '#6366f1',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}>
                      View Message
                    </summary>
                    <div style={{
                      marginTop: 6,
                      padding: 10,
                      background: 'white',
                      borderRadius: 6,
                      fontSize: '0.72rem',
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'monospace',
                      color: '#334155',
                      border: '1px solid #e2e8f0',
                    }}>
                      {n.message}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => setShowNotifyAll(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* ── Notification History Modal ── */}
      {showHistory && (
        <Modal
          open
          onClose={() => setShowHistory(false)}
          title="📜 Notification History"
          size="lg"
        >
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
              Loading history...
            </div>
          ) : notifyHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
              No notifications sent yet.
            </div>
          ) : (
            <div style={{ maxHeight: 450, overflowY: 'auto' }}>
              {notifyHistory.map((n, i) => (
                <div
                  key={n.id || i}
                  style={{
                    padding: '12px',
                    marginBottom: 8,
                    borderRadius: 8,
                    background: n.status === 'sent' ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${n.status === 'sent' ? '#86efac' : '#fecaca'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1e293b' }}>
                        {n.studentName}
                        <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8, fontSize: '0.75rem' }}>
                          {n.class} - {n.section}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                        📞 {n.phone} | 🕐 {new Date(n.sentAt).toLocaleString()}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: n.status === 'sent' ? '#dcfce7' : '#fee2e2',
                      color: n.status === 'sent' ? '#10b981' : '#ef4444',
                    }}>
                      {n.status === 'sent' ? '✅ Sent' : '❌ Failed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setShowHistory(false)}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}