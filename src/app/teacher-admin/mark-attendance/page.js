'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Save, Users } from 'lucide-react';

export default function MarkAttendance() {
  const { user } = useAuth();
  const today    = new Date().toISOString().split('T')[0];

  const [cls,       setCls]       = useState(user?.class   || '');
  const [section,   setSection]   = useState(user?.section || '');
  const [date,      setDate]      = useState(today);
  const [students,  setStudents]  = useState([]);
  const [attendance,setAttendance]= useState({});
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadStudents = async () => {
    if (!cls || !section) return;
    setLoading(true);
    const params = new URLSearchParams({ branch: user?.branch || '', class: cls, section });
    const r = await fetch(`/api/students?${params}`);
    const d = await r.json();
    if (d.success) {
      setStudents(d.data);
      const init = {};
      d.data.forEach(s => { init[s._id] = 'Present'; });
      setAttendance(init);
    }
    setLoading(false);
  };

  const loadExisting = async () => {
    if (!cls || !section || !date) return;
    const params = new URLSearchParams({ entityType: 'student', date, class: cls, section, branch: user?.branch || '' });
    const r = await fetch(`/api/attendance?${params}`);
    const d = await r.json();
    if (d.success && d.data.length > 0) {
      const map = {};
      d.data.forEach(a => { map[a.entityId] = a.status; });
      setAttendance(prev => ({ ...prev, ...map }));
      setSubmitted(true);
    } else {
      setSubmitted(false);
    }
  };

  useEffect(() => { loadStudents(); }, [cls, section]);
  useEffect(() => { if (students.length > 0) loadExisting(); }, [date, students]);

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s._id] = status; });
    setAttendance(updated);
  };

  const submit = async () => {
    if (!students.length) return;
    setSaving(true);
    const records = students.map(s => ({
      entityId: s._id, entityType: 'student', date,
      status: attendance[s._id] || 'Absent',
      branch: user?.branch || s.branch,
      class: cls, section, markedBy: user?.id,
    }));
    const r = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    const d = await r.json();
    if (d.success) setSubmitted(true);
    else alert(d.error || 'Failed to submit');
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(v => v === 'Present').length;
  const absentCount  = students.length - presentCount;
  const attPct       = students.length ? Math.round(presentCount / students.length * 100) : 0;

  return (
    <AppLayout requiredRole="teacher-admin">
      <PageHeader title="Mark Attendance" subtitle="Submit daily student attendance" />

      {/* ── Success Banner ──────────────────────────────── */}
      {submitted && (
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: 12, padding: '13px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, color: '#15803d', fontWeight: 600, fontSize: '0.875rem' }}>
          <CheckCircle size={18} />
          Attendance submitted for <b>{date}</b>. You can still update it.
        </div>
      )}

      {/* ── Controls ────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Class</label>
            <select className="select" value={cls} onChange={e => { setCls(e.target.value); setSubmitted(false); }}>
              <option value="">Select Class</option>
              {['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Section</label>
            <select className="select" value={section} onChange={e => { setSection(e.target.value); setSubmitted(false); }}>
              <option value="">Select Section</option>
              {['A','B','C','D','E'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Date</label>
            <input className="input" type="date" value={date} max={today} onChange={e => setDate(e.target.value)} />
          </div>

          {students.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button className="btn btn-outline" style={{ color: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => markAll('Present')}>
                <CheckCircle size={14} /> All Present
              </button>
              <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => markAll('Absent')}>
                <XCircle size={14} /> All Absent
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────── */}
      {students.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { l: 'Total',   v: students.length, c: '#4f46e5' },
            { l: 'Present', v: presentCount,    c: '#10b981' },
            { l: 'Absent',  v: absentCount,     c: '#ef4444' },
            { l: 'Rate',    v: `${attPct}%`,    c: '#f59e0b' },
          ].map(({ l, v, c }) => (
            <div key={l} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}`, padding: 14 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Student List ────────────────────────────────── */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 52 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading students...</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 52, color: '#94a3b8' }}>
            <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {cls && section ? 'No students found for this class/section' : 'Select class and section to load students'}
            </div>
            <div style={{ fontSize: '0.8rem' }}>Students will appear here once loaded</div>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['S.No', 'Roll No', 'Student Name', 'Present', 'Absent', 'Status'].map((h, idx) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: idx >= 3 ? 'center' : 'left', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', borderBottom: '2px solid #e2e8f0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const isPresent = attendance[s._id] === 'Present';
                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9', background: isPresent ? '#f0fdf4' : '#fff5f5', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.8rem' }}>{i + 1}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#4f46e5', fontSize: '0.875rem' }}>{s.rollNo}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{s.gender}</div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <input type="radio" name={`att-${s._id}`} checked={isPresent}
                            onChange={() => setAttendance(p => ({ ...p, [s._id]: 'Present' }))}
                            style={{ accentColor: '#10b981', width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>P</span>
                        </label>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <input type="radio" name={`att-${s._id}`} checked={!isPresent}
                            onChange={() => setAttendance(p => ({ ...p, [s._id]: 'Absent' }))}
                            style={{ accentColor: '#ef4444', width: 18, height: 18, cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>A</span>
                        </label>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ padding: '4px 14px', borderRadius: 20, fontSize: '0.73rem', fontWeight: 700, background: isPresent ? '#dcfce7' : '#fee2e2', color: isPresent ? '#16a34a' : '#dc2626' }}>
                          {isPresent ? '✓ Present' : '✗ Absent'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Progress + Submit */}
            <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 0 0', marginTop: 12 }}>
              {/* Progress bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>
                    {presentCount} Present / {absentCount} Absent
                  </span>
                  <span style={{ fontWeight: 800, color: attPct >= 75 ? '#10b981' : '#f59e0b' }}>{attPct}%</span>
                </div>
                <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${attPct}%`, background: attPct >= 75 ? 'linear-gradient(90deg,#10b981,#4f46e5)' : '#f59e0b', borderRadius: 99, transition: 'width 0.5s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-primary"
                  onClick={submit}
                  disabled={saving}
                  style={{ minWidth: 170, display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}
                >
                  {saving ? (
                    <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Submitting...</>
                  ) : (
                    <><Save size={15} /> {submitted ? 'Update Attendance' : 'Submit Attendance'}</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
