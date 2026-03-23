'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Badge, TableWrapper, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Check, X, Search, Save, RefreshCw, CheckCircle, XCircle, Lock } from 'lucide-react';

export default function MarkAttendancePage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  const [students, setStudents] = useState([]);
  const [attMap, setAttMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  // ✅ Get teacher's assigned class
  const teacherClass = user?.assignedClass || user?.class || '';
  const teacherSection = user?.section || '';

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const load = async () => {
    if (!teacherClass || !teacherSection) {
      console.log('[Mark Attendance] No class assigned');
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      branch: user?.branch || '',
      class: teacherClass,
      section: teacherSection
    });

    console.log('[Mark Attendance] Loading:', { 
      branch: user?.branch, 
      class: teacherClass, 
      section: teacherSection 
    });

    try {
      const [sRes, aRes] = await Promise.all([
        fetch(`/api/students?${params}`),
        fetch(`/api/attendance?entityType=student&date=${date}&class=${teacherClass}&section=${teacherSection}&branch=${user?.branch || ''}`),
      ]);
      const [sData, aData] = await Promise.all([sRes.json(), aRes.json()]);

      if (sData.success) {
        console.log('[Mark Attendance] Students loaded:', sData.data.length);
        setStudents(sData.data);
      }
      
      if (aData.success) {
        const map = {};
        aData.data.forEach(a => { 
          // Handle both _id and id
          const key = String(a.entityId);
          map[key] = a.status; 
        });
        console.log('[Mark Attendance] Existing attendance:', Object.keys(map).length);
        setAttMap(map);
      }
    } catch (err) {
      console.error('[Mark Attendance] Load error:', err);
      showToast('Failed to load data', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { 
    if (user && teacherClass && teacherSection) {
      load(); 
    } else if (user && !teacherClass) {
      setLoading(false);
    }
  }, [user, teacherClass, teacherSection, date]);

  const filtered = useMemo(() => students.filter(s =>
    !search ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNo?.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const toggleStatus = (studentId) => {
    const key = String(studentId);
    setAttMap(prev => ({
      ...prev,
      [key]: prev[key] === 'Present' ? 'Absent' : 'Present'
    }));
  };

  const markAll = (status) => {
    const newMap = {};
    students.forEach(s => {
      const key = String(s._id || s.id);
      newMap[key] = status;
    });
    setAttMap(newMap);
  };

  const saveAttendance = async () => {
    setSaving(true);
    
    // ✅ Build records with entityId from student _id or id
    const records = students.map(s => {
      const studentId = String(s._id || s.id);
      return {
        entityId: studentId,  // ✅ This is the critical field
        entityType: 'student',
        date,
        status: attMap[studentId] || 'Absent',
        branch: user?.branch || '',
        class: teacherClass,
        section: teacherSection,
        markedBy: user?.id || user?._id || '',
      };
    });

    console.log('[Mark Attendance] Saving records:', records.length);
    console.log('[Mark Attendance] Sample record:', records[0]);

    try {
      const r = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const d = await r.json();
      
      if (r.ok && d.success) {
        showToast(`✓ Attendance saved for ${records.length} students`);
      } else {
        showToast(d.error || 'Failed to save', 'error');
      }
    } catch (err) {
      console.error('[Mark Attendance] Save error:', err);
      showToast('Network error', 'error');
    }
    setSaving(false);
  };

  const presentCount = Object.values(attMap).filter(v => v === 'Present').length;
  const absentCount = students.length - presentCount;
  const attPct = students.length ? Math.round(presentCount / students.length * 100) : 0;

  // ✅ Show message if no class assigned
  if (!loading && (!teacherClass || !teacherSection)) {
    return (
      <AppLayout requiredRole="teacher-admin">
        <PageHeader title="Mark Attendance" subtitle="Mark daily student attendance" />
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={28} color="#ef4444" />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
            No Class Assigned
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto' }}>
            You need to be assigned as a class teacher to mark attendance.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout requiredRole="teacher-admin">
      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: 'white', padding: '12px 20px', borderRadius: 12,
          fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {toast.msg}
          <button onClick={() => setToast({ msg: '' })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', padding: 0 }}>
            <X size={14} />
          </button>
        </div>
      )}

      <PageHeader title="Mark Attendance" subtitle={`${teacherClass} — Section ${teacherSection}`}>
        <button className="btn btn-outline" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button className="btn btn-primary" onClick={saveAttendance} disabled={saving || students.length === 0}>
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Attendance</>}
        </button>
      </PageHeader>

      {/* Class Info */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        borderRadius: 12, padding: '14px 20px', marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Marking Attendance For</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{teacherClass} — Section {teacherSection}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Date</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{date}</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'Total', v: students.length, c: '#4f46e5' },
          { l: 'Present', v: presentCount, c: '#10b981' },
          { l: 'Absent', v: absentCount, c: '#ef4444' },
          { l: 'Rate', v: `${attPct}%`, c: '#f59e0b' },
        ].map(({ l, v, c }) => (
          <div key={l} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}`, padding: 12 }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters & Quick Actions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input" type="date" value={date} max={today}
            onChange={e => setDate(e.target.value)}
            style={{ maxWidth: 160 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, maxWidth: 260, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 12px' }}>
            <Search size={14} color="#94a3b8" />
            <input
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.83rem', flex: 1 }}
              placeholder="Search name or roll no..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => markAll('Present')}>
              <CheckCircle size={14} /> Mark All Present
            </button>
            <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => markAll('Absent')}>
              <XCircle size={14} /> Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <TableWrapper>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Roll No</th>
              <th>Student Name</th>
              <th>Gender</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Mark</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading-row">
                <td colSpan={6} style={{ textAlign: 'center', padding: 52 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
                  <span style={{ color: '#94a3b8', fontSize: '0.83rem' }}>Loading students...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={6}><EmptyState message="No students found" /></td>
              </tr>
            ) : filtered.map((s, i) => {
              const studentId = String(s._id || s.id);
              const status = attMap[studentId] || 'Absent';
              const isPresent = status === 'Present';
              
              return (
                <tr key={studentId} style={{ background: isPresent ? '#f0fdf4' : '#fef2f2' }}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td style={{ fontWeight: 700, color: '#4f46e5', fontSize: '0.83rem' }}>{s.rollNo}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                  </td>
                  <td style={{ fontSize: '0.83rem', color: '#64748b' }}>{s.gender || '—'}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                      background: isPresent ? '#dcfce7' : '#fee2e2',
                      color: isPresent ? '#16a34a' : '#dc2626',
                    }}>
                      {status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => toggleStatus(studentId)}
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        border: 'none', cursor: 'pointer',
                        background: isPresent ? '#dcfce7' : '#fee2e2',
                        color: isPresent ? '#16a34a' : '#dc2626',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      {isPresent ? <Check size={20} /> : <X size={20} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrapper>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </AppLayout>
  );
}