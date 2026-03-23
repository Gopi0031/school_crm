'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, EmptyState, Modal, FormField } from '@/components/ui';
import { Plus, Key, Search, ShieldCheck, Trash2, Eye, EyeOff, X } from 'lucide-react';

export default function SuperAdminBranchCreation() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(null);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({
    branchName: '', adminName: '', username: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  // ── Load branches ─────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/branches');
      const d = await r.json();
      if (d.success) {
        console.log('Loaded branches:', d.data.length);
        setBranches(d.data);
      }
    } catch (err) {
      console.error('Load branches error:', err);
      showToast('Failed to load branches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => branches.filter(b =>
    !search ||
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.adminId?.username?.toLowerCase().includes(search.toLowerCase()) ||
    b.adminId?.name?.toLowerCase().includes(search.toLowerCase())
  ), [branches, search]);

  // ── Create branch ─────────────────────────────────────────
  const createBranch = async () => {
    setFormError('');
    if (!form.branchName || !form.adminName || !form.username || !form.password) {
      setFormError('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setCreating(true);
    try {
      const r = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchName: form.branchName,
          adminName: form.adminName,
          username: form.username.toLowerCase().trim(),
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const d = await r.json();

      if (!r.ok) {
        setFormError(d.error || 'Failed to create branch');
        return;
      }

      showToast('✓ Branch created successfully');
      setShowAdd(false);
      setForm({ branchName: '', adminName: '', username: '', email: '', phone: '', password: '', confirmPassword: '' });
      load();
    } catch (err) {
      setFormError('Network error: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // ── Change password ── ✅ FIXED: Use branch.id instead of branch._id
  const changePassword = async () => {
    setPwdError('');

    if (!newPwd || newPwd.length < 8) {
      setPwdError('Password must be at least 8 characters');
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Passwords do not match');
      return;
    }

    setPwdSaving(true);
    try {
      console.log('Resetting password for branch:', showPwdModal.id);

      const r = await fetch(`/api/branches/${showPwdModal.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPwd }),
      });

      const d = await r.json();

      if (!r.ok) {
        setPwdError(d.error || 'Update failed');
        return;
      }

      console.log('Password reset response:', d);

      setPwdSuccess(true);
      showToast(d.message || '✓ Password updated successfully');

      setTimeout(() => {
        setShowPwdModal(null);
        setNewPwd('');
        setConfirmPwd('');
        setPwdSuccess(false);
      }, 2500);

    } catch (err) {
      console.error('Password reset error:', err);
      setPwdError('Network error: ' + err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  // ── Delete branch ─────────────────────────────────────────
  const deleteBranch = async () => {
    try {
      const r = await fetch(`/api/branches/${deleteId}`, { method: 'DELETE' });
      const d = await r.json();

      if (d.success) {
        showToast('✓ Branch deleted');
        load();
      } else {
        showToast(d.error || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <AppLayout requiredRole="super-admin">
      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 20px', borderRadius: 12,
          fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.msg}
          <button onClick={() => setToast({ msg: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      <PageHeader title="Branch Creation" subtitle="Manage branches and admin accounts">
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setFormError(''); }}>
          <Plus size={16} /> New Branch
        </button>
      </PageHeader>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by branch or username..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {filtered.length} branch{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>
      </div>

      {/* Branch Table */}
      <div className="card" style={{ marginBottom: 28 }}>
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
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Loading branches...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message={search ? `No branches matching "${search}"` : "No branches found. Create one!"} />
                </td>
              </tr>
            ) : (
              filtered.map((b, i) => (
                <tr key={b.id || i}>
                  <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{i + 1}</td>
                  <td>
                    <strong style={{ color: '#1e293b', fontWeight: 700 }}>{b.name}</strong>
                  </td>
                  <td style={{ color: '#475569' }}>{b.adminId?.name || '—'}</td>
                  <td>
                    <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600 }}>
                      @{b.adminId?.username || '—'}
                    </code>
                  </td>
                  <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{b.adminId?.email || b.email || '—'}</td>
                  <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{b.adminId?.phone || b.phone || '—'}</td>
                  <td>
                    <Badge status={b.isActive !== false ? 'active' : 'inactive'}>
                      {b.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}
                        onClick={() => {
                          console.log('Opening password modal for:', b);
                          setShowPwdModal(b);
                          setPwdError('');
                          setNewPwd('');
                          setConfirmPwd('');
                          setPwdSuccess(false);
                        }}
                      >
                        <Key size={13} /> Password
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        onClick={() => setDeleteId(b.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrapper>
      </div>

      {/* ── Create Branch Modal ───────────────────────────── */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setFormError(''); }} title="Create New Branch" size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField label="Branch Name" required>
              <input
                className="input"
                value={form.branchName}
                onChange={e => setForm({ ...form, branchName: e.target.value })}
                placeholder="e.g. Main Branch"
              />
            </FormField>
          </div>
          <FormField label="Admin Full Name" required>
            <input
              className="input"
              value={form.adminName}
              onChange={e => setForm({ ...form, adminName: e.target.value })}
              placeholder="Admin full name"
            />
          </FormField>
          <FormField label="Username" required>
            <input
              className="input"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
              placeholder="Login username"
            />
          </FormField>
          <FormField label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="admin@school.com"
            />
          </FormField>
          <FormField label="Phone">
            <input
              className="input"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="10-digit phone"
            />
          </FormField>
          <FormField label="Password" required>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Min 8 characters"
            />
          </FormField>
          <FormField label="Confirm Password" required>
            <input
              className="input"
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter password"
            />
          </FormField>
        </div>

        {formError && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: '0.875rem', marginTop: 10 }}>
            ⚠️ {formError}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={createBranch} disabled={creating}>
            {creating ? 'Creating...' : 'Create Branch'}
          </button>
        </div>
      </Modal>

      {/* ── Change Password Modal ─────────────────────────── */}
      <Modal
        open={!!showPwdModal}
        onClose={() => {
          setShowPwdModal(null);
          setPwdError('');
          setPwdSuccess(false);
          setNewPwd('');
          setConfirmPwd('');
        }}
        title={`Reset Password — ${showPwdModal?.name}`}
        size="sm"
      >
        {pwdSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <ShieldCheck size={52} color="#10b981" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 700, color: '#10b981', fontSize: '1rem' }}>
              Password updated successfully!
            </p>
            {showPwdModal?.adminId?.email && (
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
                New credentials sent to <strong>{showPwdModal.adminId.email}</strong>
              </p>
            )}
          </div>
        ) : (
          <>
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: '0.83rem' }}>
              <span style={{ color: '#64748b' }}>Admin: </span>
              <strong style={{ color: '#1e293b' }}>{showPwdModal?.adminId?.name}</strong>
              <span style={{ display: 'block', color: '#94a3b8', fontSize: '0.76rem', marginTop: 2 }}>
                @{showPwdModal?.adminId?.username}
              </span>
            </div>

            <FormField label="New Password" required>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Min 8 characters"
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                >
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm New Password" required>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showConfPwd ? 'text' : 'password'}
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfPwd(p => !p)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                >
                  {showConfPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FormField>

            {/* Live match indicator */}
            {newPwd && confirmPwd && (
              <p style={{ fontSize: '0.76rem', marginTop: 4, color: newPwd === confirmPwd ? '#10b981' : '#ef4444' }}>
                {newPwd === confirmPwd ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}

            {pwdError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 8, fontSize: '0.83rem', marginTop: 10 }}>
                ⚠️ {pwdError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-outline" onClick={() => setShowPwdModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={changePassword} disabled={pwdSaving}>
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Delete Confirm ────────────────────────────────── */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Branch?" size="sm">
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>
          This will permanently delete the branch and its admin account. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={deleteBranch}>Delete</button>
        </div>
      </Modal>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </AppLayout>
  );
}