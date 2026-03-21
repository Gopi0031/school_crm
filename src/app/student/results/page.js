'use client';
import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Eye, Trophy, TrendingUp, X } from 'lucide-react';

export default function StudentResults() {
  const { user }   = useAuth();
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [exam,     setExam]     = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!user) return;
    const id = user.studentId || user.id;
    const params = new URLSearchParams({ studentId: id });
    if (exam) params.set('exam', exam);
    setLoading(true);
    fetch(`/api/reports?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setReports(d.data || []); })
      .finally(() => setLoading(false));
  }, [user, exam]);

  const grouped = useMemo(() => {
    const g = {};
    reports.forEach(r => {
      const key = r.exam || 'General';
      if (!g[key]) g[key] = [];
      g[key].push(r);
    });
    return g;
  }, [reports]);

  const avgPct    = reports.length ? Math.round(reports.reduce((a, r) => a + r.percentage, 0) / reports.length) : 0;
  const pass      = reports.filter(r => r.status === 'Pass').length;
  const topSubject = reports.length ? reports.reduce((a, b) => a.percentage > b.percentage ? a : b, reports[0]) : null;

  const getColor = (pct) => pct >= 75 ? '#10b981' : pct >= 35 ? '#f59e0b' : '#ef4444';

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="My Results" subtitle="Academic performance reports" />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }} className="results-stats">
        {[
          { l: 'Average %', v: `${avgPct}%`,                 c: '#4f46e5', icon: '📊' },
          { l: 'Pass',      v: pass,                         c: '#10b981', icon: '✅' },
          { l: 'Fail',      v: reports.length - pass,        c: '#ef4444', icon: '❌' },
          { l: 'Top Subject', v: topSubject?.subject || '—', c: '#f59e0b', icon: '🏆', small: true },
        ].map(({ l, v, c, icon, small }, i) => (
          <div key={l} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${c}`, animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${i * 70}ms` }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: small ? '0.85rem' : '1.4rem', fontWeight: 800, color: c, lineHeight: 1.2 }}>{v}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4, fontWeight: 600 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      {reports.length > 0 && (
        <div className="card" style={{ marginBottom: 18, animation: 'fadeSlideUp 0.4s ease both', animationDelay: '200ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={15} color="#4f46e5" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Overall Performance</span>
            </div>
            <span style={{ fontWeight: 800, color: getColor(avgPct) }}>{avgPct}%</span>
          </div>
          <div style={{ height: 12, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${avgPct}%`, background: `linear-gradient(90deg, ${getColor(avgPct)}, ${getColor(avgPct)}aa)`, borderRadius: 99, transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.72rem' }}>
            {[['🟢 75%+ Distinction', '#10b981'], ['🟡 35–74% Pass', '#f59e0b'], ['🔴 Below 35% Fail', '#ef4444']].map(([l, c]) => (
              <span key={l} style={{ color: c, fontWeight: 600 }}>{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeSlideUp 0.4s ease both', animationDelay: '240ms' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', flexShrink: 0 }}>Filter by Exam:</label>
        <select className="select" value={exam} onChange={e => setExam(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All Exams</option>
          {['Annual', 'Unit Test 1', 'Unit Test 2', 'Mid Term', 'Half Yearly'].map(e => <option key={e}>{e}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2].map(i => <div key={i} className="card" style={{ height: 180, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />)}
          <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        </div>
      ) : reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <p style={{ color: '#94a3b8', fontWeight: 600 }}>No results found</p>
        </div>
      ) : Object.entries(grouped).map(([examName, reps], gi) => {
        const examAvg  = Math.round(reps.reduce((a, r) => a + r.percentage, 0) / reps.length);
        const examPass = reps.filter(r => r.status === 'Pass').length;
        return (
          <div key={examName} className="card" style={{ marginBottom: 18, animation: 'fadeSlideUp 0.5s ease both', animationDelay: `${gi * 100}ms` }}>
            {/* Exam Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 12, borderBottom: '2px solid #f1f5f9', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={17} color="#7c3aed" />
                </div>
                <h3 style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{examName}</h3>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>Avg: {examAvg}%</span>
                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>Pass: {examPass}/{reps.length}</span>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Subject', 'Marks', 'Total', 'Percentage', 'Result', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reps.map((r, ri) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s', animation: 'fadeSlideUp 0.3s ease both', animationDelay: `${ri * 30}ms` }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafaff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{r.subject}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 900, color: '#7c3aed', fontSize: '1rem' }}>{r.marksObtained}</td>
                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 500 }}>{r.totalMarks}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, maxWidth: 64, height: 7, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${r.percentage}%`, background: getColor(r.percentage), borderRadius: 99, transition: 'width 0.8s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: getColor(r.percentage) }}>{r.percentage}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: r.status === 'Pass' ? '#dcfce7' : '#fee2e2', color: r.status === 'Pass' ? '#16a34a' : '#dc2626' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button
                          onClick={() => setSelected(r)}
                          style={{ width: 30, height: 30, borderRadius: 8, background: '#ede9fe', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ddd6fe'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ede9fe'}
                        >
                          <Eye size={13} color="#7c3aed" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', animation: 'scaleIn 0.25s cubic-bezier(.34,1.2,.64,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.05rem' }}>{selected.subject}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>{selected.exam}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="#64748b" />
              </button>
            </div>

            {/* Big score */}
            <div style={{ textAlign: 'center', marginBottom: 20, padding: '20px 0', background: '#f8fafc', borderRadius: 14 }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: getColor(selected.percentage), lineHeight: 1 }}>
                {selected.percentage}%
              </div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: 4 }}>
                {selected.marksObtained} / {selected.totalMarks} marks
              </div>
            </div>

            <div style={{ height: 12, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ height: '100%', width: `${selected.percentage}%`, background: getColor(selected.percentage), borderRadius: 99, transition: 'width 0.8s ease' }} />
            </div>

            {[['Result', selected.status], ['Exam', selected.exam], ['Academic Year', selected.academicYear]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f8fafc', fontSize: '0.875rem' }}>
                <span style={{ color: '#64748b' }}>{l}</span>
                <span style={{ fontWeight: 700, color: l === 'Result' ? (v === 'Pass' ? '#16a34a' : '#dc2626') : '#1e293b' }}>{v}</span>
              </div>
            ))}

            <button onClick={() => setSelected(null)} className="btn btn-primary" style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}>Close</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn     { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @media (max-width: 600px) { .results-stats { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>
    </AppLayout>
  );
}
