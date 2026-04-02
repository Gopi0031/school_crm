'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal, FormField, TableWrapper, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Plus, Edit2, Trash2, Copy, IndianRupee, BookOpen, Calculator, X } from 'lucide-react';

const CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
const ACADEMIC_YEARS = ['2023-24', '2024-25', '2025-26', '2026-27'];

const BLANK_FEE = {
  class: '',
  totalFee: 0,
  term1Fee: 0,
  term2Fee: 0,
  term3Fee: 0,
  tuitionFee: 0,
  admissionFee: 0,
  examFee: 0,
  labFee: 0,
  libraryFee: 0,
  sportsFee: 0,
  transportFee: 0,
  otherFee: 0,
  description: '',
};

export default function FeeStructurePage() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2025-26');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [editFee, setEditFee] = useState(null);
  const [form, setForm] = useState(BLANK_FEE);
  const [copyForm, setCopyForm] = useState({ fromYear: '', toYear: '', percentageIncrease: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Load fee structures
  const loadFees = async () => {
    if (!user?.branch || !selectedYear) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/fee-structure?branch=${encodeURIComponent(user.branch)}&academicYear=${selectedYear}`);
      const data = await res.json();
      console.log('📋 Fee structures loaded:', data);
      
      if (data.success) {
        setFees(data.data || []);
      } else {
        console.error('Failed to load fees:', data.error);
        setFees([]);
      }
    } catch (err) {
      console.error('Load fees error:', err);
      setFees([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.branch) {
      loadFees();
    }
  }, [user, selectedYear]);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(''), 3500);
  };

  // Calculate total from components
  const calculateTotal = (f) => {
    return (
      Number(f.tuitionFee || 0) +
      Number(f.admissionFee || 0) +
      Number(f.examFee || 0) +
      Number(f.labFee || 0) +
      Number(f.libraryFee || 0) +
      Number(f.sportsFee || 0) +
      Number(f.transportFee || 0) +
      Number(f.otherFee || 0)
    );
  };

  // Auto-split total into 3 terms
  const autoSplitTerms = (total) => {
    const t = Number(total) || 0;
    if (t === 0) return { term1Fee: 0, term2Fee: 0, term3Fee: 0 };
    const base = Math.floor(t / 3);
    const extra = t - base * 3;
    return {
      term1Fee: base + extra,
      term2Fee: base,
      term3Fee: base,
    };
  };

  // Save fee structure
  const saveFee = async () => {
    setError('');
    
    if (!form.class) {
      setError('Please select a class');
      return;
    }

    const totalFee = calculateTotal(form);
    
    // Auto-split if terms not set
    let { term1Fee, term2Fee, term3Fee } = form;
    if (totalFee > 0 && !term1Fee && !term2Fee && !term3Fee) {
      const split = autoSplitTerms(totalFee);
      term1Fee = split.term1Fee;
      term2Fee = split.term2Fee;
      term3Fee = split.term3Fee;
    }

    const payload = {
      ...form,
      totalFee,
      term1Fee: Number(term1Fee) || 0,
      term2Fee: Number(term2Fee) || 0,
      term3Fee: Number(term3Fee) || 0,
      academicYear: selectedYear,
      branch: user?.branch,
      branchId: user?.branchId || '',
      createdBy: user?.name || '',
    };

    console.log('💾 Saving fee structure:', payload);
    setSaving(true);

    try {
      const method = editFee ? 'PUT' : 'POST';
      const url = editFee ? `/api/fee-structure/${editFee.id}` : '/api/fee-structure';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('💾 Save response:', data);

      if (data.success) {
        showToast(editFee ? '✓ Fee structure updated!' : '✓ Fee structure created!');
        setShowAdd(false);
        setEditFee(null);
        setForm(BLANK_FEE);
        loadFees();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Network error: ' + err.message);
    }
    setSaving(false);
  };

  // Copy fee structures
  const copyFeeStructure = async () => {
    setError('');
    
    if (!copyForm.fromYear || !copyForm.toYear) {
      setError('Select both source and target years');
      return;
    }

    if (copyForm.fromYear === copyForm.toYear) {
      setError('Source and target years must be different');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/fee-structure/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromYear: copyForm.fromYear,
          toYear: copyForm.toYear,
          percentageIncrease: Number(copyForm.percentageIncrease) || 0,
          branch: user?.branch,
          branchId: user?.branchId || '',
        }),
      });

      const data = await res.json();
      console.log('📋 Copy response:', data);

      if (data.success) {
        showToast(`✓ ${data.created} fee structures copied to ${copyForm.toYear}`);
        setShowCopy(false);
        setCopyForm({ fromYear: '', toYear: '', percentageIncrease: 0 });
        // Switch to target year to see results
        setSelectedYear(copyForm.toYear);
      } else {
        setError(data.error || 'Failed to copy');
      }
    } catch (err) {
      console.error('Copy error:', err);
      setError('Network error: ' + err.message);
    }
    setSaving(false);
  };

  // Delete fee structure
  const deleteFee = async (id) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;

    try {
      const res = await fetch(`/api/fee-structure/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        showToast('✓ Fee structure deleted');
        loadFees();
      } else {
        showToast('Failed to delete: ' + data.error, true);
      }
    } catch (err) {
      showToast('Delete error: ' + err.message, true);
    }
  };

  // Open edit modal
  const openEdit = (fee) => {
    setEditFee(fee);
    setForm({
      class: fee.class,
      totalFee: fee.totalFee || 0,
      term1Fee: fee.term1Fee || 0,
      term2Fee: fee.term2Fee || 0,
      term3Fee: fee.term3Fee || 0,
      tuitionFee: fee.tuitionFee || 0,
      admissionFee: fee.admissionFee || 0,
      examFee: fee.examFee || 0,
      labFee: fee.labFee || 0,
      libraryFee: fee.libraryFee || 0,
      sportsFee: fee.sportsFee || 0,
      transportFee: fee.transportFee || 0,
      otherFee: fee.otherFee || 0,
      description: fee.description || '',
    });
    setError('');
    setShowAdd(true);
  };

  // Open add modal
  const openAdd = () => {
    setEditFee(null);
    setForm(BLANK_FEE);
    setError('');
    setShowAdd(true);
  };

  // Stats
  const totalRevenue = fees.reduce((a, f) => a + (f.totalFee || 0), 0);
  const averageFee = fees.length > 0 ? Math.round(totalRevenue / fees.length) : 0;
  const configuredClasses = fees.length;

  // Available classes for adding (not already configured)
  const availableClasses = CLASSES.filter(c => !fees.find(f => f.class === c) || editFee?.class === c);

  return (
    <AppLayout requiredRole="branch-admin">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.isError ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 20px', borderRadius: 12,
          fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn 0.3s ease',
        }}>
          {toast.msg}
          <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      <PageHeader title="Fee Structure" subtitle={`Manage fee structure for ${user?.branch || 'your branch'}`}>
        <select
          className="select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ minWidth: 130 }}
        >
          {ACADEMIC_YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button className="btn btn-outline" onClick={() => { setShowCopy(true); setError(''); }}>
          <Copy size={14} /> Copy Structure
        </button>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={14} /> Add Fee
        </button>
      </PageHeader>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4f46e5' }}>{configuredClasses}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Classes Configured</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Calculator size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>₹{averageFee.toLocaleString()}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Average Fee</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <IndianRupee size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b' }}>{selectedYear}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}>Academic Year</div>
          </div>
        </div>
      </div>

      {/* Fee Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th>Class</th>
              <th>Tuition</th>
              <th>Term 1</th>
              <th>Term 2</th>
              <th>Term 3</th>
              <th>Other Fees</th>
              <th>Total Fee</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{
                    width: 32, height: 32, border: '3px solid #e2e8f0',
                    borderTopColor: '#4f46e5', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', margin: '0 auto 10px',
                  }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>Loading fee structures...</span>
                </td>
              </tr>
            ) : fees.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message={`No fee structure for ${selectedYear}. Click "Add Fee" or "Copy Structure" from another year.`} />
                </td>
              </tr>
            ) : fees.map((fee, idx) => (
              <tr key={fee.id || idx}>
                <td style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{fee.class}</td>
                <td style={{ color: '#64748b' }}>₹{(fee.tuitionFee || 0).toLocaleString()}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>₹{(fee.term1Fee || 0).toLocaleString()}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>₹{(fee.term2Fee || 0).toLocaleString()}</td>
                <td style={{ color: '#10b981', fontWeight: 600 }}>₹{(fee.term3Fee || 0).toLocaleString()}</td>
                <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {[
                    fee.examFee > 0 && `Exam: ₹${fee.examFee}`,
                    fee.labFee > 0 && `Lab: ₹${fee.labFee}`,
                    fee.transportFee > 0 && `Transport: ₹${fee.transportFee}`,
                  ].filter(Boolean).slice(0, 2).join(', ') || '—'}
                </td>
                <td>
                  <span style={{
                    fontWeight: 800, color: '#059669', fontSize: '1rem',
                    background: '#ecfdf5', padding: '6px 14px', borderRadius: 8,
                    border: '1px solid #a7f3d0',
                  }}>
                    ₹{(fee.totalFee || 0).toLocaleString()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      onClick={() => openEdit(fee)}
                      title="Edit"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                      onClick={() => deleteFee(fee.id)}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setEditFee(null); setError(''); }}
        title={editFee ? `Edit Fee — ${editFee.class}` : 'Add Fee Structure'}
        size="lg"
      >
        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '0.78rem', color: '#0369a1' }}>
            📌 <strong>Year:</strong> {selectedYear} &nbsp;|&nbsp; <strong>Branch:</strong> {user?.branch}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <FormField label="Class" required>
            <select
              className="select"
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
              disabled={!!editFee}
            >
              <option value="">Select Class</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </FormField>

          <div /> {/* Spacer */}

          {/* Fee Components */}
          {[
            ['Tuition Fee', 'tuitionFee'],
            ['Admission Fee', 'admissionFee'],
            ['Exam Fee', 'examFee'],
            ['Lab Fee', 'labFee'],
            ['Library Fee', 'libraryFee'],
            ['Sports Fee', 'sportsFee'],
            ['Transport Fee', 'transportFee'],
            ['Other Fees', 'otherFee'],
          ].map(([label, key]) => (
            <FormField key={key} label={`${label} (₹)`}>
              <input
                className="input"
                type="number"
                min="0"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </FormField>
          ))}
        </div>

        {/* Term-wise breakdown */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
            Term-wise Fee Split (Optional - auto-calculated if left empty)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['Term 1', 'term1Fee'],
              ['Term 2', 'term2Fee'],
              ['Term 3', 'term3Fee'],
            ].map(([label, key]) => (
              <FormField key={key} label={`${label} (₹)`}>
                <input
                  className="input"
                  type="number"
                  min="0"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                  placeholder="Auto"
                />
              </FormField>
            ))}
          </div>
        </div>

        {/* Total Preview */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderRadius: 12, padding: 16, marginTop: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1.5px solid #86efac',
        }}>
          <div>
            <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>Calculated Total Fee:</span>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
              Sum of all fee components
            </div>
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669' }}>
            ₹{calculateTotal(form).toLocaleString()}
          </span>
        </div>

        {/* Auto-split preview */}
        {calculateTotal(form) > 0 && !form.term1Fee && !form.term2Fee && !form.term3Fee && (
          <div style={{
            background: '#eff6ff', borderRadius: 10, padding: '12px 16px', marginTop: 12,
            border: '1px solid #bfdbfe', fontSize: '0.8rem', color: '#1d4ed8',
          }}>
            💡 <strong>Auto-split:</strong> Term 1: ₹{autoSplitTerms(calculateTotal(form)).term1Fee.toLocaleString()} | 
            Term 2: ₹{autoSplitTerms(calculateTotal(form)).term2Fee.toLocaleString()} | 
            Term 3: ₹{autoSplitTerms(calculateTotal(form)).term3Fee.toLocaleString()}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '10px 14px',
            borderRadius: 8, fontSize: '0.83rem', marginTop: 14,
            border: '1px solid #fecaca',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <button className="btn btn-outline" onClick={() => { setShowAdd(false); setEditFee(null); setError(''); }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={saveFee} disabled={saving}>
            {saving ? 'Saving...' : editFee ? 'Update Fee' : 'Create Fee Structure'}
          </button>
        </div>
      </Modal>

      {/* Copy Modal */}
      <Modal
        open={showCopy}
        onClose={() => { setShowCopy(false); setError(''); }}
        title="Copy Fee Structure"
        size="sm"
      >
        <div style={{ marginBottom: 16, padding: '12px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
            ⚠️ This will copy all fee structures from one academic year to another. 
            Existing structures in target year will not be overwritten.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="From Year (Source)" required>
            <select
              className="select"
              value={copyForm.fromYear}
              onChange={(e) => setCopyForm({ ...copyForm, fromYear: e.target.value })}
            >
              <option value="">Select source year</option>
              {ACADEMIC_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </FormField>

          <FormField label="To Year (Target)" required>
            <select
              className="select"
              value={copyForm.toYear}
              onChange={(e) => setCopyForm({ ...copyForm, toYear: e.target.value })}
            >
              <option value="">Select target year</option>
              {ACADEMIC_YEARS.filter(y => y !== copyForm.fromYear).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Percentage Increase (%)">
            <input
              className="input"
              type="number"
              min="0"
              max="100"
              value={copyForm.percentageIncrease}
              onChange={(e) => setCopyForm({ ...copyForm, percentageIncrease: parseFloat(e.target.value) || 0 })}
              placeholder="e.g., 5 for 5% increase"
            />
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
              Enter 0 to copy exact amounts, or a percentage (e.g., 10) to increase all fees by that percentage
            </div>
          </FormField>

          {copyForm.fromYear && copyForm.toYear && copyForm.percentageIncrease > 0 && (
            <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: '0.8rem', color: '#166534' }}>
              📈 Fees will be increased by <strong>{copyForm.percentageIncrease}%</strong> when copied
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.83rem' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <button className="btn btn-outline" onClick={() => { setShowCopy(false); setError(''); }}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={copyFeeStructure} 
            disabled={saving || !copyForm.fromYear || !copyForm.toYear}
          >
            {saving ? 'Copying...' : 'Copy Fee Structure'}
          </button>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </AppLayout>
  );
}