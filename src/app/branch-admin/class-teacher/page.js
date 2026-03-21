'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, AlertTriangle,Search } from 'lucide-react';


export default function ClassTeacherPage() {
  const { user }   = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showAssign, setShowAssign] = useState(null);
  const [assignForm, setAssignForm] = useState({ assignedClass:'', section:'' });
  const [error, setError]       = useState('');
  const [toast, setToast]       = useState('');
  const [saving, setSaving]     = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    const r = await fetch(`/api/class-teacher?branch=${user?.branch || ''}`);
    const d = await r.json();
    if (d.success) setTeachers(d.data);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const assign = async () => {
    setError('');
    if (!assignForm.assignedClass || !assignForm.section) { setError('Select both class and section'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/class-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: showAssign._id, ...assignForm }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error); return; }
      showToast(`✓ ${showAssign.name} assigned as class teacher`);
      setShowAssign(null); setAssignForm({ assignedClass:'', section:'' });
      load();
    } finally { setSaving(false); }
  };

  const removeAssignment = async (teacherId) => {
    await fetch(`/api/class-teacher?teacherId=${teacherId}`, { method: 'DELETE' });
    showToast('Assignment removed'); load();
  };

  const unassigned = teachers.filter(t => !t.classTeacher);

  return (
    <AppLayout requiredRole="branch-admin">
      {toast && <div style={{ position:'fixed', top:20, right:20, background:'#10b981', color:'white', padding:'12px 20px', borderRadius:10, fontWeight:600, zIndex:9999 }}>{toast}</div>}

      <PageHeader title="Class Teacher Assignment" subtitle={`Manage class teachers — ${user?.branch}`} />

      {unassigned.length > 0 && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:10, color:'#92400e', fontSize:'0.875rem' }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <strong>{unassigned.length} teacher{unassigned.length>1?'s':''}</strong> not yet assigned as class teacher.
        </div>
      )}
      

      <div className="card">
        <TableWrapper>
          <thead>
            <tr><th>S.No</th><th>Teacher Name</th><th>Employee ID</th><th>Subject</th><th>Assigned Class</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40, color:'#94a3b8' }}>Loading...</td></tr>
            ) : teachers.length === 0 ? (
              <tr><td colSpan={7}><EmptyState message="No teachers found" /></td></tr>
            ) : teachers.map((t, i) => (
              <tr key={t._id}>
                <td style={{ color:'#94a3b8' }}>{i+1}</td>
                <td style={{ fontWeight:600 }}>{t.name}</td>
                <td style={{ color:'#4f46e5', fontWeight:600 }}>{t.employeeId}</td>
                <td>{t.subject || '—'}</td>
                <td>{t.assignedClass ? `${t.assignedClass} — ${t.section}` : <span style={{ color:'#94a3b8' }}>Not Assigned</span>}</td>
                <td>
                  {t.classTeacher
                    ? <span style={{ padding:'3px 10px', borderRadius:20, background:'#dcfce7', color:'#16a34a', fontSize:'0.75rem', fontWeight:600 }}>Assigned</span>
                    : <span style={{ padding:'3px 10px', borderRadius:20, background:'#fef9c3', color:'#854d0e', fontSize:'0.75rem', fontWeight:600 }}>Not Assigned</span>
                  }
                </td>
                <td>
                  {t.classTeacher ? (
                    <button className="btn btn-outline" style={{ padding:'4px 10px', fontSize:'0.75rem', color:'#ef4444', borderColor:'#ef4444' }} onClick={() => removeAssignment(t._id)}>
                      Remove
                    </button>
                  ) : (
                    <button className="btn btn-primary" style={{ padding:'4px 10px', fontSize:'0.75rem' }} onClick={() => { setShowAssign(t); setAssignForm({ assignedClass:'', section:'' }); setError(''); }}>
                      <UserCheck size={12} /> Assign Class
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      <Modal open={!!showAssign} onClose={() => { setShowAssign(null); setError(''); }} title={`Assign Class — ${showAssign?.name}`} size="sm">
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:16 }}>Select the class and section for this teacher.</p>
        <FormField label="Class" required>
          <select className="select" style={{ width:'100%' }} value={assignForm.assignedClass} onChange={e => setAssignForm({ ...assignForm, assignedClass: e.target.value })}>
            <option value="">Select Class</option>
            {['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'].map(c => <option key={c}>{c}</option>)}
          </select>
        </FormField>
        <FormField label="Section" required>
          <select className="select" style={{ width:'100%' }} value={assignForm.section} onChange={e => setAssignForm({ ...assignForm, section: e.target.value })}>
            <option value="">Select Section</option>
            {['A','B','C','D'].map(s => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'8px 12px', borderRadius:8, fontSize:'0.875rem', marginBottom:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:12 }}>
          <button className="btn btn-outline" onClick={() => setShowAssign(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={assign} disabled={saving}>{saving ? 'Assigning...' : 'Confirm Assignment'}</button>
        </div>
      </Modal>
    </AppLayout>
  );
}
