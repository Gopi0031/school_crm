'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, EmptyState, Modal, FormField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { UserCheck, AlertTriangle, Search, Edit2, X, Users, GraduationCap, RefreshCw } from 'lucide-react';

const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

export default function ClassTeacherPage() {
  const { user } = useAuth();
  
  const [teachers, setTeachers]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('all'); // 'all', 'assigned', 'unassigned'
  const [showAssign, setShowAssign]       = useState(null);
  const [showReassign, setShowReassign]   = useState(null);
  const [assignForm, setAssignForm]       = useState({ assignedClass:'', section:'' });
  const [error, setError]                 = useState('');
  const [toast, setToast]                 = useState({ msg:'', type:'success' });
  const [saving, setSaving]               = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg, type = 'success') => { 
    setToast({ msg, type }); 
    setTimeout(() => setToast({ msg:'', type:'success' }), 3500); 
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/class-teacher?branch=${user?.branch || ''}`);
      const d = await r.json();
      if (d.success) setTeachers(d.data);
    } catch (err) {
      showToast('Failed to load teachers', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  // ── Filtered teachers ──
  const filtered = useMemo(() => {
    let arr = teachers;
    
    // Search filter
    if (search) {
      const s = search.toLowerCase();
      arr = arr.filter(t => 
        t.name?.toLowerCase().includes(s) ||
        t.employeeId?.toLowerCase().includes(s) ||
        t.subject?.toLowerCase().includes(s)
      );
    }
    
    // Status filter
    if (filterStatus === 'assigned') {
      arr = arr.filter(t => t.classTeacher);
    } else if (filterStatus === 'unassigned') {
      arr = arr.filter(t => !t.classTeacher);
    }
    
    return arr;
  }, [teachers, search, filterStatus]);

  // ── Stats ──
  const stats = useMemo(() => ({
    total: teachers.length,
    assigned: teachers.filter(t => t.classTeacher).length,
    unassigned: teachers.filter(t => !t.classTeacher).length,
  }), [teachers]);

  // ── Get assigned classes (to show which are taken) ──
  const assignedClasses = useMemo(() => {
    const map = {};
    teachers.forEach(t => {
      if (t.classTeacher && t.assignedClass && t.section) {
        map[`${t.assignedClass}-${t.section}`] = t.name;
      }
    });
    return map;
  }, [teachers]);

  // ── Assign new class teacher ──
  const assign = async () => {
    setError('');
    if (!assignForm.assignedClass || !assignForm.section) { 
      setError('Select both class and section'); 
      return; 
    }
    
    // Check if already assigned
    const key = `${assignForm.assignedClass}-${assignForm.section}`;
    if (assignedClasses[key]) {
      setError(`${assignForm.assignedClass}-${assignForm.section} already has class teacher: ${assignedClasses[key]}`);
      return;
    }
    
    setSaving(true);
    try {
      const r = await fetch('/api/class-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: showAssign._id, ...assignForm }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to assign'); return; }
      showToast(`✓ ${showAssign.name} assigned as class teacher for ${assignForm.assignedClass}-${assignForm.section}`);
      setShowAssign(null); 
      setAssignForm({ assignedClass:'', section:'' });
      load();
    } catch (err) {
      setError('Network error');
    } finally { 
      setSaving(false); 
    }
  };

  // ── Reassign class teacher ──
  const reassign = async () => {
    setError('');
    if (!assignForm.assignedClass || !assignForm.section) { 
      setError('Select both class and section'); 
      return; 
    }
    
    // Check if already assigned to another teacher
    const key = `${assignForm.assignedClass}-${assignForm.section}`;
    if (assignedClasses[key] && assignedClasses[key] !== showReassign.name) {
      setError(`${assignForm.assignedClass}-${assignForm.section} already has class teacher: ${assignedClasses[key]}`);
      return;
    }
    
    setSaving(true);
    try {
      const r = await fetch('/api/class-teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: showReassign._id, ...assignForm }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to reassign'); return; }
      showToast(`✓ ${showReassign.name} reassigned to ${assignForm.assignedClass}-${assignForm.section}`);
      setShowReassign(null); 
      setAssignForm({ assignedClass:'', section:'' });
      load();
    } catch (err) {
      setError('Network error');
    } finally { 
      setSaving(false); 
    }
  };

  // ── Remove assignment ──
  const removeAssignment = async () => {
    setSaving(true);
    try {
      await fetch(`/api/class-teacher?teacherId=${deleteConfirm._id}`, { method: 'DELETE' });
      showToast(`Assignment removed from ${deleteConfirm.name}`);
      setDeleteConfirm(null);
      load();
    } catch (err) {
      showToast('Failed to remove assignment', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Open reassign modal ──
  const openReassign = (t) => {
    setShowReassign(t);
    setAssignForm({ 
      assignedClass: t.assignedClass || '', 
      section: t.section || '' 
    });
    setError('');
  };

  return (
    <AppLayout requiredRole="branch-admin">

      {/* Toast */}
      {toast.msg && (
        <div style={{ 
          position:'fixed', top:20, right:20, zIndex:9999, 
          background: toast.type === 'error' ? '#ef4444' : '#10b981', 
          color:'white', padding:'12px 20px', borderRadius:12, 
          fontWeight:600, fontSize:'0.875rem', 
          boxShadow:'0 8px 24px rgba(0,0,0,0.15)', 
          display:'flex', alignItems:'center', gap:8,
          animation:'slideIn 0.3s ease'
        }}>
          {toast.msg}
          <button onClick={() => setToast({ msg:'' })} style={{ background:'transparent', border:'none', cursor:'pointer', color:'white', padding:0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      <PageHeader title="Class Teacher Assignment" subtitle={`Manage class teachers — ${user?.branch}`}>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </PageHeader>

      {/* Stats Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:20 }}>
        <div style={{ 
          background:'linear-gradient(135deg, #f0f9ff, #e0f2fe)', 
          borderRadius:12, padding:'16px 20px', 
          borderLeft:'4px solid #0891b2' 
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Users size={20} color="#0891b2" />
            <div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#0891b2' }}>{stats.total}</div>
              <div style={{ fontSize:'0.75rem', color:'#64748b', fontWeight:600 }}>Total Teachers</div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          background:'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
          borderRadius:12, padding:'16px 20px', 
          borderLeft:'4px solid #10b981' 
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <GraduationCap size={20} color="#10b981" />
            <div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#10b981' }}>{stats.assigned}</div>
              <div style={{ fontSize:'0.75rem', color:'#64748b', fontWeight:600 }}>Class Teachers</div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          background:'linear-gradient(135deg, #fffbeb, #fef3c7)', 
          borderRadius:12, padding:'16px 20px', 
          borderLeft:'4px solid #f59e0b' 
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:'#f59e0b' }}>{stats.unassigned}</div>
              <div style={{ fontSize:'0.75rem', color:'#64748b', fontWeight:600 }}>Not Assigned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {stats.unassigned > 0 && (
        <div style={{ 
          background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, 
          padding:'12px 16px', marginBottom:20, 
          display:'flex', alignItems:'center', gap:10, 
          color:'#92400e', fontSize:'0.875rem' 
        }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <span>
            <strong>{stats.unassigned} teacher{stats.unassigned > 1 ? 's' : ''}</strong> not yet assigned as class teacher.
            Assign them using the "Assign Class" button.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          
          {/* Search */}
          <div style={{ 
            display:'flex', alignItems:'center', gap:7, 
            background:'#f8fafc', borderRadius:9, 
            padding:'7px 12px', border:'1.5px solid #e2e8f0', 
            flex:1, minWidth:200, maxWidth:300 
          }}>
            <Search size={14} color="#94a3b8" />
            <input 
              style={{ border:'none', background:'transparent', outline:'none', fontSize:'0.83rem', flex:1 }}
              placeholder="Search name, ID, or subject..." 
              value={search}
              onChange={e => setSearch(e.target.value)} 
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                <X size={12} color="#94a3b8" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ display:'flex', gap:4, background:'#f1f5f9', borderRadius:8, padding:3 }}>
            {[
              { value:'all', label:'All' },
              { value:'assigned', label:'Assigned' },
              { value:'unassigned', label:'Not Assigned' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                style={{
                  padding:'6px 12px', borderRadius:6, border:'none', cursor:'pointer',
                  fontSize:'0.78rem', fontWeight: filterStatus === opt.value ? 700 : 500,
                  background: filterStatus === opt.value ? 'white' : 'transparent',
                  color: filterStatus === opt.value ? '#0891b2' : '#64748b',
                  boxShadow: filterStatus === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize:'0.78rem', color:'#94a3b8', marginLeft:'auto' }}>
            Showing {filtered.length} of {teachers.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <TableWrapper>
          <thead>
            <tr>
              <th style={{ width:50 }}>S.No</th>
              <th>Teacher Name</th>
              <th>Employee ID</th>
              <th>Subject</th>
              <th>Teaching Class</th>
              <th>Class Teacher For</th>
              <th>Status</th>
              <th style={{ width:180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign:'center', padding:48 }}>
                  <div style={{ 
                    width:32, height:32, 
                    border:'3px solid #e2e8f0', borderTopColor:'#0891b2', 
                    borderRadius:'50%', animation:'spin 0.7s linear infinite', 
                    margin:'0 auto 10px' 
                  }} />
                  <span style={{ color:'#94a3b8', fontSize:'0.83rem' }}>Loading teachers...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message={search ? "No teachers match your search" : "No teachers found"} />
                </td>
              </tr>
            ) : filtered.map((t, i) => (
              <tr key={t._id} style={{ background: t.classTeacher ? '#f0fdf4' : undefined }}>
                <td style={{ color:'#94a3b8', fontSize:'0.78rem' }}>{i + 1}</td>
                <td>
                  <div style={{ fontWeight:600, color:'#1e293b' }}>{t.name}</div>
                  <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{t.phone || t.email || ''}</div>
                </td>
                <td style={{ color:'#4f46e5', fontWeight:700, fontSize:'0.8rem', fontFamily:'monospace' }}>
                  {t.employeeId}
                </td>
                <td style={{ fontSize:'0.83rem' }}>
                  {t.subject ? (
                    <span style={{ 
                      background:'#eef2ff', color:'#4f46e5', 
                      padding:'3px 10px', borderRadius:6, 
                      fontSize:'0.75rem', fontWeight:600 
                    }}>
                      {t.subject}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ fontSize:'0.83rem', color:'#64748b' }}>
                  {t.class ? `${t.class}–${t.section || ''}` : '—'}
                </td>
                <td>
                  {t.classTeacher && t.assignedClass ? (
                    <span style={{ 
                      background:'#dcfce7', color:'#16a34a', 
                      padding:'4px 12px', borderRadius:20, 
                      fontSize:'0.75rem', fontWeight:700,
                      display:'inline-flex', alignItems:'center', gap:4
                    }}>
                      <GraduationCap size={12} />
                      {t.assignedClass}–{t.section}
                    </span>
                  ) : (
                    <span style={{ color:'#94a3b8', fontSize:'0.8rem' }}>Not Assigned</span>
                  )}
                </td>
                <td>
                  {t.classTeacher ? (
                    <Badge style={{ background:'#dcfce7', color:'#16a34a' }}>
                      ✓ Assigned
                    </Badge>
                  ) : (
                    <Badge style={{ background:'#fef9c3', color:'#854d0e' }}>
                      Pending
                    </Badge>
                  )}
                </td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    {t.classTeacher ? (
                      <>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding:'5px 10px', fontSize:'0.72rem', borderColor:'#0891b2', color:'#0891b2' }} 
                          onClick={() => openReassign(t)}
                          title="Reassign to different class"
                        >
                          <Edit2 size={11} /> Reassign
                        </button>
                        <button 
                          className="btn btn-outline" 
                          style={{ padding:'5px 10px', fontSize:'0.72rem', color:'#ef4444', borderColor:'#ef4444' }} 
                          onClick={() => setDeleteConfirm(t)}
                          title="Remove assignment"
                        >
                          <X size={11} /> Remove
                        </button>
                      </>
                    ) : (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding:'5px 12px', fontSize:'0.75rem' }} 
                        onClick={() => { setShowAssign(t); setAssignForm({ assignedClass:'', section:'' }); setError(''); }}
                      >
                        <UserCheck size={12} /> Assign Class
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </div>

      {/* Assigned Classes Overview */}
      {Object.keys(assignedClasses).length > 0 && (
        <div className="card" style={{ marginTop:20, padding:'16px 20px' }}>
          <h3 style={{ fontSize:'0.9rem', fontWeight:700, color:'#374151', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <GraduationCap size={16} color="#10b981" />
            Class Teacher Assignments Overview
          </h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {Object.entries(assignedClasses).map(([classSection, teacherName]) => (
              <div 
                key={classSection}
                style={{ 
                  background:'#f0fdf4', border:'1px solid #bbf7d0', 
                  borderRadius:8, padding:'8px 12px',
                  fontSize:'0.78rem'
                }}
              >
                <div style={{ fontWeight:700, color:'#16a34a' }}>{classSection}</div>
                <div style={{ color:'#64748b', marginTop:2 }}>{teacherName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Assign Modal ── */}
      <Modal 
        open={!!showAssign} 
        onClose={() => { setShowAssign(null); setError(''); }} 
        title={`Assign Class Teacher — ${showAssign?.name}`} 
        size="sm"
      >
        <div style={{ 
          display:'flex', alignItems:'center', gap:12, 
          background:'#f8fafc', borderRadius:10, padding:'12px 16px', 
          marginBottom:16 
        }}>
          <div style={{ 
            width:40, height:40, borderRadius:'50%', 
            background:'linear-gradient(135deg, #4f46e5, #7c3aed)', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            color:'white', fontWeight:700, fontSize:'1rem' 
          }}>
            {showAssign?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:600, color:'#1e293b' }}>{showAssign?.name}</div>
            <div style={{ fontSize:'0.75rem', color:'#64748b' }}>
              {showAssign?.employeeId} • {showAssign?.subject || 'No subject'}
            </div>
          </div>
        </div>

        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:16 }}>
          Select the class and section to assign this teacher as class teacher.
        </p>

        <FormField label="Class" required>
          <select 
            className="select" 
            style={{ width:'100%' }} 
            value={assignForm.assignedClass} 
            onChange={e => setAssignForm({ ...assignForm, assignedClass: e.target.value })}
          >
            <option value="">Select Class</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Section" required>
          <select 
            className="select" 
            style={{ width:'100%' }} 
            value={assignForm.section} 
            onChange={e => setAssignForm({ ...assignForm, section: e.target.value })}
          >
            <option value="">Select Section</option>
            {SECTIONS.map(s => {
              const key = `${assignForm.assignedClass}-${s}`;
              const taken = assignedClasses[key];
              return (
                <option key={s} value={s} disabled={!!taken}>
                  Section {s} {taken ? `(${taken})` : ''}
                </option>
              );
            })}
          </select>
        </FormField>

        {/* Show which classes are already taken */}
        {assignForm.assignedClass && (
          <div style={{ 
            background:'#f0f9ff', border:'1px solid #bae6fd', 
            borderRadius:8, padding:'10px 12px', marginBottom:12,
            fontSize:'0.78rem', color:'#0369a1'
          }}>
            <strong>Available sections for {assignForm.assignedClass}:</strong>
            <div style={{ marginTop:4, display:'flex', gap:6, flexWrap:'wrap' }}>
              {SECTIONS.map(s => {
                const key = `${assignForm.assignedClass}-${s}`;
                const taken = assignedClasses[key];
                return (
                  <span 
                    key={s} 
                    style={{ 
                      padding:'2px 8px', borderRadius:4,
                      background: taken ? '#fee2e2' : '#dcfce7',
                      color: taken ? '#991b1b' : '#16a34a',
                      fontSize:'0.72rem', fontWeight:600
                    }}
                  >
                    {s} {taken ? '✗' : '✓'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div style={{ 
            background:'#fee2e2', color:'#991b1b', 
            padding:'10px 14px', borderRadius:8, 
            fontSize:'0.83rem', marginBottom:12 
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
          <button className="btn btn-outline" onClick={() => setShowAssign(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={assign} disabled={saving}>
            {saving ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </Modal>

      {/* ── Reassign Modal ── */}
      <Modal 
        open={!!showReassign} 
        onClose={() => { setShowReassign(null); setError(''); }} 
        title={`Reassign Class — ${showReassign?.name}`} 
        size="sm"
      >
        <div style={{ 
          display:'flex', alignItems:'center', gap:12, 
          background:'#fffbeb', borderRadius:10, padding:'12px 16px', 
          marginBottom:16 
        }}>
          <div style={{ 
            width:40, height:40, borderRadius:'50%', 
            background:'linear-gradient(135deg, #f59e0b, #d97706)', 
            display:'flex', alignItems:'center', justifyContent:'center', 
            color:'white', fontWeight:700, fontSize:'1rem' 
          }}>
            <Edit2 size={18} />
          </div>
          <div>
            <div style={{ fontWeight:600, color:'#1e293b' }}>{showReassign?.name}</div>
            <div style={{ fontSize:'0.75rem', color:'#64748b' }}>
              Currently: <strong>{showReassign?.assignedClass}–{showReassign?.section}</strong>
            </div>
          </div>
        </div>

        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:16 }}>
          Change the class and section for this teacher's class teacher assignment.
        </p>

        <FormField label="New Class" required>
          <select 
            className="select" 
            style={{ width:'100%' }} 
            value={assignForm.assignedClass} 
            onChange={e => setAssignForm({ ...assignForm, assignedClass: e.target.value })}
          >
            <option value="">Select Class</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </FormField>

        <FormField label="New Section" required>
          <select 
            className="select" 
            style={{ width:'100%' }} 
            value={assignForm.section} 
            onChange={e => setAssignForm({ ...assignForm, section: e.target.value })}
          >
            <option value="">Select Section</option>
            {SECTIONS.map(s => {
              const key = `${assignForm.assignedClass}-${s}`;
              const taken = assignedClasses[key];
              const isCurrent = showReassign?.assignedClass === assignForm.assignedClass && showReassign?.section === s;
              return (
                <option key={s} value={s} disabled={taken && !isCurrent}>
                  Section {s} {isCurrent ? '(current)' : taken ? `(${taken})` : ''}
                </option>
              );
            })}
          </select>
        </FormField>

        {error && (
          <div style={{ 
            background:'#fee2e2', color:'#991b1b', 
            padding:'10px 14px', borderRadius:8, 
            fontSize:'0.83rem', marginBottom:12 
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
          <button className="btn btn-outline" onClick={() => setShowReassign(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={reassign} disabled={saving}>
            {saving ? 'Reassigning...' : 'Confirm Reassignment'}
          </button>
        </div>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal 
        open={!!deleteConfirm} 
        onClose={() => setDeleteConfirm(null)} 
        title="Remove Class Teacher Assignment?" 
        size="sm"
      >
        <div style={{ 
          display:'flex', alignItems:'center', gap:12, 
          background:'#fef2f2', borderRadius:10, padding:'12px 16px', 
          marginBottom:16 
        }}>
          <div style={{ 
            width:40, height:40, borderRadius:'50%', 
            background:'#fee2e2', 
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <AlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ fontWeight:600, color:'#1e293b' }}>{deleteConfirm?.name}</div>
            <div style={{ fontSize:'0.75rem', color:'#64748b' }}>
              Class Teacher for: <strong>{deleteConfirm?.assignedClass}–{deleteConfirm?.section}</strong>
            </div>
          </div>
        </div>

        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:20 }}>
          This will remove the class teacher assignment. The teacher will remain in the system 
          but will no longer be assigned as class teacher for {deleteConfirm?.assignedClass}–{deleteConfirm?.section}.
        </p>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={removeAssignment} disabled={saving}>
            {saving ? 'Removing...' : 'Remove Assignment'}
          </button>
        </div>
      </Modal>

      {/* Animations */}
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AppLayout>
  );
}