'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal, FormField, Badge, TableWrapper, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar, Plus, Play, CheckCircle, AlertTriangle, Users,
  GraduationCap, ArrowRight, RefreshCw, Copy, Settings, Trash2
} from 'lucide-react';

const BLANK_YEAR = { year: '', startDate: '', endDate: '' };

export default function AcademicYearManagement() {
  const { user } = useAuth();
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [form, setForm] = useState(BLANK_YEAR);
  const [transitionForm, setTransitionForm] = useState({ fromYear: '', toYear: '' });
  const [students, setStudents] = useState([]);
  const [detainedIds, setDetainedIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionResult, setTransitionResult] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/academic-year?branch=${user?.branch || 'All'}`);
      const data = await res.json();
      if (data.success) setYears(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Generate year string (e.g., "2025-26")
  const generateYearString = (startYear) => {
    const end = (parseInt(startYear) + 1).toString().slice(-2);
    return `${startYear}-${end}`;
  };

  const saveYear = async () => {
    setError('');
    if (!form.year) { setError('Year is required'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/academic-year', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          branch: user?.branch,
          branchId: user?.branchId,
          createdBy: user?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Academic year created');
        setShowAdd(false);
        setForm(BLANK_YEAR);
        load();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const activateYear = async (yearId) => {
    const res = await fetch('/api/academic-year/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ yearId, branch: user?.branch }),
    });
    const data = await res.json();
    if (data.success) {
      showToast('✓ Academic year activated');
      load();
    }
  };

  const loadStudentsForTransition = async () => {
    if (!transitionForm.fromYear) return;
    const res = await fetch(`/api/students?branch=${user?.branch}&academicYear=${transitionForm.fromYear}`);
    const data = await res.json();
    if (data.success) setStudents(data.data || []);
  };

  useEffect(() => {
    if (showTransition && transitionForm.fromYear) {
      loadStudentsForTransition();
    }
  }, [transitionForm.fromYear, showTransition]);

  const executeTransition = async () => {
    if (!transitionForm.fromYear || !transitionForm.toYear) {
      setError('Select both years');
      return;
    }

    setTransitioning(true);
    setError('');
    setTransitionResult(null);

    try {
      const res = await fetch('/api/academic-year/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromYear: transitionForm.fromYear,
          toYear: transitionForm.toYear,
          branch: user?.branch,
          branchId: user?.branchId,
          promotedBy: user?.name,
          detainedStudents: detainedIds,
          promoteStudents: true,
          updateTeachers: true,
          applyFeeStructure: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTransitionResult(data.results);
        showToast('✓ Transition completed successfully');
        load();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
    setTransitioning(false);
  };

  const currentYear = years.find(y => y.isCurrent);
  const upcomingYears = years.filter(y => y.status === 'upcoming');
  const completedYears = years.filter(y => y.status === 'completed');

  return (
    <AppLayout requiredRole="branch-admin">
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: '#10b981', color: 'white', padding: '12px 20px',
          borderRadius: 12, fontWeight: 600, fontSize: '0.875rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      <PageHeader
        title="Academic Year Management"
        subtitle={`Manage academic years for ${user?.branch}`}
      >
        <button className="btn btn-outline" onClick={() => setShowTransition(true)}>
          <RefreshCw size={14} /> Year Transition
        </button>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Year
        </button>
      </PageHeader>

      {/* Current Year Banner */}
      {currentYear && (
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          borderRadius: 16, padding: '20px 24px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16, color: 'white',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Academic Year
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900 }}>{currentYear.year}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>
              {currentYear.startDate} — {currentYear.endDate}
            </div>
          </div>
          <Badge type="success" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            Active
          </Badge>
        </div>
      )}

      {/* Year Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {years.map(year => (
          <div
            key={year.id}
            className="card"
            style={{
              borderLeft: `4px solid ${year.isCurrent ? '#10b981' : year.status === 'upcoming' ? '#f59e0b' : '#94a3b8'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b' }}>{year.year}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                  {year.startDate || 'No dates set'} {year.endDate && `— ${year.endDate}`}
                </div>
              </div>
              <Badge type={year.isCurrent ? 'success' : year.status === 'upcoming' ? 'warning' : 'secondary'}>
                {year.isCurrent ? 'Current' : year.status}
              </Badge>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {!year.isCurrent && year.status === 'upcoming' && (
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, fontSize: '0.75rem' }}
                  onClick={() => activateYear(year.id)}
                >
                  <Play size={12} /> Activate
                </button>
              )}
              {year.transitionCompleted && (
                <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle size={12} /> Transitioned
                </span>
              )}
            </div>
          </div>
        ))}

        {years.length === 0 && !loading && (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <EmptyState message="No academic years found. Create your first one." />
          </div>
        )}
      </div>

      {/* Add Year Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Create Academic Year" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Academic Year" required>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Start year (e.g., 2025)"
                type="number"
                min="2020"
                max="2099"
                onChange={(e) => setForm({ ...form, year: generateYearString(e.target.value) })}
              />
              <div style={{
                padding: '8px 16px', background: '#f1f5f9', borderRadius: 8,
                fontWeight: 700, color: '#4f46e5', whiteSpace: 'nowrap',
              }}>
                {form.year || '----'}
              </div>
            </div>
          </FormField>

          <FormField label="Start Date">
            <input
              className="input"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </FormField>

          <FormField label="End Date">
            <input
              className="input"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </FormField>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.83rem' }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveYear} disabled={saving}>
            {saving ? 'Creating...' : 'Create Year'}
          </button>
        </div>
      </Modal>

      {/* Transition Modal */}
      <Modal
        open={showTransition}
        onClose={() => { setShowTransition(false); setTransitionResult(null); setDetainedIds([]); }}
        title="Academic Year Transition"
        size="lg"
      >
        {transitionResult ? (
          /* Results View */
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              borderRadius: 12, padding: 20, marginBottom: 20,
              border: '1px solid #bbf7d0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <CheckCircle size={24} color="#10b981" />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#15803d' }}>
                  Transition Completed Successfully
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Promoted', value: transitionResult.studentsPromoted, color: '#10b981', icon: <GraduationCap size={16} /> },
                  { label: 'Passed Out', value: transitionResult.studentsPassedOut, color: '#3b82f6', icon: <Users size={16} /> },
                  { label: 'Detained', value: transitionResult.studentsDetained, color: '#f59e0b', icon: <AlertTriangle size={16} /> },
                  { label: 'Teachers', value: transitionResult.teachersUpdated, color: '#8b5cf6', icon: <Users size={16} /> },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: 12, background: 'white', borderRadius: 10 }}>
                    <div style={{ color: stat.color, marginBottom: 6 }}>{stat.icon}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {transitionResult.errors?.length > 0 && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>⚠️ Errors:</div>
                {transitionResult.errors.slice(0, 5).map((err, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#b91c1c' }}>• {err.error}</div>
                ))}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setShowTransition(false); setTransitionResult(null); }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Configuration View */
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center', marginBottom: 24 }}>
              <FormField label="From Year">
                <select
                  className="select"
                  value={transitionForm.fromYear}
                  onChange={(e) => setTransitionForm({ ...transitionForm, fromYear: e.target.value })}
                >
                  <option value="">Select year</option>
                  {years.filter(y => y.status === 'active').map(y => (
                    <option key={y.id} value={y.year}>{y.year}</option>
                  ))}
                </select>
              </FormField>

              <ArrowRight size={24} color="#94a3b8" style={{ marginTop: 24 }} />

              <FormField label="To Year">
                <select
                  className="select"
                  value={transitionForm.toYear}
                  onChange={(e) => setTransitionForm({ ...transitionForm, toYear: e.target.value })}
                >
                  <option value="">Select year</option>
                  {years.filter(y => y.status === 'upcoming').map(y => (
                    <option key={y.id} value={y.year}>{y.year}</option>
                  ))}
                </select>
              </FormField>
            </div>

            {/* What will happen */}
            <div style={{
              background: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 20,
              border: '1px solid #bfdbfe',
            }}>
              <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 10, fontSize: '0.9rem' }}>
                What will happen:
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#3b82f6', fontSize: '0.83rem', lineHeight: 1.8 }}>
                <li>Students will be promoted to the next class</li>
                <li>Class 10 students will be marked as "Passed Out"</li>
                <li>Fee structure will be applied for new class</li>
                <li>Attendance counters will be reset</li>
                <li>Teachers' academic year will be updated</li>
              </ul>
            </div>

            {/* Detained Students Selection */}
            {students.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 10, fontSize: '0.9rem' }}>
                  Select students to detain (optional):
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8 }}>
                  {students.map(s => (
                    <label
                      key={s.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        cursor: 'pointer', borderRadius: 6,
                        background: detainedIds.includes(s.id) ? '#fef3c7' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={detainedIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) setDetainedIds([...detainedIds, s.id]);
                          else setDetainedIds(detainedIds.filter(id => id !== s.id));
                        }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{s.name}</span>
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.class} - {s.section}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.72rem', marginLeft: 'auto' }}>{s.rollNo}</span>
                    </label>
                  ))}
                </div>
                {detainedIds.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#f59e0b', marginTop: 8 }}>
                    ⚠️ {detainedIds.length} student(s) will be detained in their current class
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.83rem', marginBottom: 16 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowTransition(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={executeTransition}
                disabled={transitioning || !transitionForm.fromYear || !transitionForm.toYear}
              >
                {transitioning ? (
                  <>
                    <div style={{
                      width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                    }} />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} /> Execute Transition
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AppLayout>
  );
}