'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
// ✅ correct — Badge is NOT needed in this file
import { PageHeader, TableWrapper, EmptyState, Modal, FormField } from '@/components/ui';

import { Plus, Trash2, KeyRound, Search, Edit2, CheckCircle } from 'lucide-react';

const BLANK = { branchName: '', adminName: '', username: '', email: '', phone: '', password: '', confirmPassword: '' };
const EDIT_BLANK = { branchName: '', adminName: '', email: '', phone: '' };

export default function SuperAdminBranches() {
  const [branches,   setBranches]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [showEdit,   setShowEdit]   = useState(null); // branch object
  const [showReset,  setShowReset]  = useState(null); // branch object
  const [deleteId,   setDeleteId]   = useState(null);
  const [form,       setForm]       = useState(BLANK);
  const [editForm,   setEditForm]   = useState(EDIT_BLANK);
  const [pwdForm,    setPwdForm]    = useState({ newPassword: '', confirm: '' });
  const [error,      setError]      = useState('');
  const [toast,      setToast]      = useState('');
  const [saving,     setSaving]     = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

const load = async () => {
  setLoading(true);
  try {
    const r = await fetch('/api/branches');
    const d = await r.json();
    if (d.success) {
      console.log('branch sample:', d.data[0]); // ← check id vs _id here
      setBranches(d.data);
    }
  } finally { setLoading(false); }
};


  useEffect(() => { load(); }, []);

  const filtered = branches.filter(b =>
    !search ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.adminId?.username?.toLowerCase().includes(search.toLowerCase()) ||
    b.adminId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Create ──────────────────────────────────────
  const createBranch = async () => {
    setError('');
    if (!form.branchName || !form.adminName || !form.username || !form.password) {
      setError('Please fill all required fields'); return;
    }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to create branch'); return; }
      showToast(`✓ Branch "${form.branchName}" created successfully`);
      setShowAdd(false); setForm(BLANK); load();
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  // ── Edit ────────────────────────────────────────
  const openEdit = (branch) => {
    setEditForm({
      branchName: branch.name          || '',
      adminName:  branch.adminId?.name || '',
      email:      branch.adminId?.email || branch.email || '',
      phone:      branch.adminId?.phone || branch.phone || '',
    });
    setShowEdit(branch);
    setError('');
  };

  const savEdit = async () => {
    setError('');
    if (!editForm.branchName || !editForm.adminName) {
      setError('Branch name and admin name are required'); return;
    }
    setSaving(true);
    try {
      const r = await fetch(`/api/branches/${showEdit._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Update failed'); return; }
      showToast('✓ Branch updated successfully');
      setShowEdit(null); load();
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  // ── Delete ──────────────────────────────────────
  const deleteBranch = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/branches/${deleteId}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) { showToast('❌ ' + (d.error || 'Delete failed')); return; }
      showToast('✓ Branch deactivated successfully');
      setDeleteId(null); load();
    } catch { showToast('❌ Network error'); }
    finally { setSaving(false); }
  };

  // ── Reset Password ──────────────────────────────
  // In the resetPassword function, use showReset.id (not showReset._id)
const resetPassword = async () => {
  setError('');
  if (!pwdForm.newPassword || pwdForm.newPassword.length < 8) {
    setError('Min 8 characters');
    return;
  }
  if (pwdForm.newPassword !== pwdForm.confirm) {
    setError('Passwords do not match');
    return;
  }

  setSaving(true);
  try {
    // ✅ Use showReset.id (Prisma uses "id", not "_id")
    const r = await fetch(`/api/branches/${showReset.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: pwdForm.newPassword }),
    });

    const d = await r.json();
    if (!r.ok) {
      setError(d.error || 'Reset failed');
      return;
    }

    showToast('✓ Password reset successfully');
    setShowReset(null);
    setPwdForm({ newPassword: '', confirm: '' });
  } catch {
    setError('Network error');
  } finally {
    setSaving(false);
  }
};

  return (
    <AppLayout requiredRole="super-admin">

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.startsWith('❌') ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 20px', borderRadius: 10,
          fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn 0.3s ease',
        }}>
          {!toast.startsWith('❌') && <CheckCircle size={16} />}
          {toast}
        </div>
      )}

      <PageHeader title="Branch Management" subtitle="Create and manage school branches">
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError(''); setForm(BLANK); }}>
          <Plus size={16} /> New Branch
        </button>
      </PageHeader>

      {/* Search bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="#94a3b8" />
          <input
            className="input"
            placeholder="Search branch name or admin..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <span style={{ color: '#64748b', fontSize: '0.875rem', marginLeft: 'auto' }}>
            {filtered.length} branch{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Branch Name</th>
              <th>Admin Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
       <tbody>
  {loading ? (
    <tr key="loading">
      <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</td>
    </tr>
  ) : filtered.length === 0 ? (
    <tr key="empty">
      <td colSpan={8}><EmptyState message="No branches found. Create one!" /></td>
    </tr>
  ) : filtered.map((b, i) => (
    <tr key={b._id || b.id || i}>
      <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{i + 1}</td>
      <td><strong style={{ color: '#1e293b' }}>{b.name}</strong></td>
      <td>{b.adminId?.name || '—'}</td>
      <td>
        <code style={{ background: '#f1f5f9', padding: '2px 7px', borderRadius: 4, fontSize: '0.8rem', color: '#475569' }}>
          @{b.adminId?.username || '—'}
        </code>
      </td>
      <td style={{ color: '#64748b' }}>{b.adminId?.email || b.email || '—'}</td>
      <td style={{ color: '#64748b' }}>{b.adminId?.phone || b.phone || '—'}</td>
      <td>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
          background: b.isActive !== false ? '#dcfce7' : '#fee2e2',
          color:      b.isActive !== false ? '#15803d' : '#991b1b',
        }}>
          {b.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => openEdit(b)}
          >
            <Edit2 size={13} /> Edit
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => { setShowReset(b); setError(''); setPwdForm({ newPassword: '', confirm: '' }); }}
          >
            <KeyRound size={13} /> Password
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
onClick={() => setDeleteId(b.id)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>


        </TableWrapper>
      </div>

      {/* ── Create Modal ── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError(''); }} title="Create New Branch" size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Branch Name" required>
              <input className="input" value={form.branchName} onChange={e => setForm({ ...form, branchName: e.target.value })} placeholder="e.g. Main Branch" />
            </FormField>
          </div>
          <FormField label="Admin Full Name" required>
            <input className="input" value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })} placeholder="Admin's full name" />
          </FormField>
          <FormField label="Username" required>
            <input className="input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })} placeholder="Login username" />
          </FormField>
          <FormField label="Email">
            <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@school.com" />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
          </FormField>
          <FormField label="Password" required>
            <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
          </FormField>
          <FormField label="Confirm Password" required>
            <input className="input" type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter password" />
          </FormField>
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: '0.875rem', marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setError(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={createBranch} disabled={saving}>
            {saving ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!showEdit} onClose={() => { setShowEdit(null); setError(''); }} title={`Edit Branch — ${showEdit?.name}`} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <FormField label="Branch Name" required>
              <input className="input" value={editForm.branchName} onChange={e => setEditForm({ ...editForm, branchName: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Admin Full Name" required>
            <input className="input" value={editForm.adminName} onChange={e => setEditForm({ ...editForm, adminName: e.target.value })} />
          </FormField>
          <FormField label="Email">
            <input className="input" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
          </FormField>
          <FormField label="Phone">
            <input className="input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
          </FormField>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: '0.8rem', color: '#92400e' }}>
          ⚠ Username cannot be changed after creation. To change username, delete and recreate the branch.
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: '0.875rem', marginTop: 10 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-outline" onClick={() => { setShowEdit(null); setError(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={savEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal open={!!showReset} onClose={() => { setShowReset(null); setError(''); }} title={`Reset Password — ${showReset?.name}`} size="sm">
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 16 }}>
          A notification email will be sent to <strong>{showReset?.adminId?.email || 'the admin'}</strong>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <FormField label="New Password" required>
            <input className="input" type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} placeholder="Min 8 characters" />
          </FormField>
          <FormField label="Confirm Password" required>
            <input className="input" type="password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Re-enter new password" />
          </FormField>
        </div>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: '0.875rem', marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn btn-outline" onClick={() => { setShowReset(null); setError(''); }}>Cancel</button>
          <button className="btn btn-primary" onClick={resetPassword} disabled={saving}>
            {saving ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Branch?" size="sm">
        <p style={{ color: '#64748b', marginBottom: 8 }}>
          This will <strong>deactivate</strong> the branch and its admin account.
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: 20 }}>
          The data will be preserved but the admin will no longer be able to log in.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteBranch} disabled={saving}>
            {saving ? 'Deleting...' : 'Yes, Delete Branch'}
          </button>
        </div>
      </Modal>

      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </AppLayout>
  );
}
