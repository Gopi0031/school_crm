'use client';
import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader, Modal } from '@/components/ui';
import { RefreshCw, Eye, AlertTriangle, CheckCircle, ArrowRight, GraduationCap } from 'lucide-react';

const YEAR_OPTIONS = ['2023-24', '2024-25', '2025-26', '2026-27'];

export default function AcademicYearRollover() {
  const [currentYear, setCurrentYear]   = useState('2025-26');
  const [branch,      setBranch]        = useState('');
  const [preview,     setPreview]       = useState(null);
  const [loading,     setLoading]       = useState(false);
  const [rolling,     setRolling]       = useState(false);
  const [result,      setResult]        = useState(null);
  const [confirm,     setConfirm]       = useState(false);
  const [toast,       setToast]         = useState('');

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchPreview = async () => {
    if (!currentYear) return showToast('❌ Select academic year');
    setLoading(true); setPreview(null); setResult(null);
    try {
      const params = new URLSearchParams({ academicYear: currentYear });
      if (branch) params.set('branch', branch);
      const res  = await fetch(`/api/academic-year/rollover?${params}`);
      const data = await res.json();
      if (data.success) { setPreview(data); showToast('✅ Preview loaded'); }
      else showToast('❌ ' + data.error);
    } catch { showToast('❌ Failed to load preview'); }
    setLoading(false);
  };

  const doRollover = async () => {
    setRolling(true); setConfirm(false);
    try {
      const res  = await fetch('/api/academic-year/rollover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, currentYear, confirm: true }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data); setPreview(null);
        showToast(`✅ Rollover complete! ${data.promoted} promoted, ${data.graduated} graduated`);
      } else showToast('❌ ' + data.error);
    } catch { showToast('❌ Rollover failed'); }
    setRolling(false);
  };

  return (
    <AppLayout requiredRole="super-admin">
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:9999, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', padding:'12px 22px', borderRadius:14, fontWeight:700, fontSize:'0.875rem', boxShadow:'0 8px 28px rgba(99,102,241,0.4)' }}>
          {toast}
        </div>
      )}

      <PageHeader title="Academic Year Rollover" subtitle="Promote all students to next class and update academic year"/>

      {/* Config Card */}
      <div className="card" style={{ marginBottom:20 }}>
        <h3 style={{ fontWeight:800, marginBottom:16, color:'#1e293b', display:'flex', alignItems:'center', gap:8 }}>
          <RefreshCw size={16} color="#6366f1"/> Configure Rollover
        </h3>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:14, marginBottom:18 }}>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', display:'block', marginBottom:6 }}>Current Academic Year *</label>
            <select className="select" value={currentYear} onChange={e => { setCurrentYear(e.target.value); setPreview(null); }}>
              {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:'0.78rem', fontWeight:700, color:'#64748b', display:'block', marginBottom:6 }}>Branch (optional — leave blank for all)</label>
            <input className="input" placeholder="e.g. Main Branch" value={branch} onChange={e => { setBranch(e.target.value); setPreview(null); }}/>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:10 }}>
            <button className="btn btn-outline" onClick={fetchPreview} disabled={loading} style={{ flex:1 }}>
              <Eye size={14}/> {loading ? 'Loading...' : 'Preview'}
            </button>
          </div>
        </div>

        {/* Next year badge */}
        {currentYear && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'#f0f9ff', borderRadius:10, border:'1.5px solid #bae6fd', fontSize:'0.82rem', fontWeight:700, color:'#0369a1' }}>
            <span>{currentYear}</span>
            <ArrowRight size={14}/>
            <span style={{ color:'#6366f1' }}>
              {(() => {
                const m = currentYear.match(/^(\d{4})-/);
                const s = m ? parseInt(m[1]) + 1 : new Date().getFullYear();
                return `${s}-${String(s+1).slice(-2)}`;
              })()}
            </span>
            <span style={{ color:'#64748b', fontWeight:400, marginLeft:4 }}>← new academic year</span>
          </div>
        )}
      </div>

      {/* Preview Table */}
      {preview && (
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontWeight:800, color:'#1e293b', display:'flex', alignItems:'center', gap:8, margin:0 }}>
              <Eye size={16} color="#6366f1"/> Preview — {preview.total} students
            </h3>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <span style={{ fontSize:'0.78rem', background:'#dcfce7', color:'#15803d', padding:'4px 10px', borderRadius:99, fontWeight:700 }}>↑ {preview.willPromote} promote</span>
              <span style={{ fontSize:'0.78rem', background:'#fef9c3', color:'#854d0e', padding:'4px 10px', borderRadius:99, fontWeight:700 }}>🎓 {preview.willGraduate} graduate</span>
              <button className="btn btn-primary" onClick={() => setConfirm(true)} disabled={rolling}>
                <RefreshCw size={14}/> Run Rollover
              </button>
            </div>
          </div>

          {/* Warning */}
          <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', gap:10, alignItems:'center', fontSize:'0.82rem', color:'#9a3412' }}>
            <AlertTriangle size={15}/>
            <span>This will <strong>promote all active students</strong> to the next class, reset their fee records, and update the academic year. This action cannot be undone.</span>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['#','Name','Roll No','Branch','Current Class','→ Next Class','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', color:'#64748b', fontWeight:700, borderBottom:'1px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.data.slice(0, 50).map((s, i) => (
                  <tr key={s.id} style={{ borderBottom:'1px solid #f1f5f9' }}>
                    <td style={{ padding:'9px 12px', color:'#94a3b8' }}>{i+1}</td>
                    <td style={{ padding:'9px 12px', fontWeight:700 }}>{s.name}</td>
                    <td style={{ padding:'9px 12px', color:'#6366f1', fontWeight:600 }}>{s.rollNo}</td>
                    <td style={{ padding:'9px 12px', color:'#64748b' }}>{s.branch}</td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ background:'#f0f2ff', color:'#4338ca', padding:'3px 8px', borderRadius:99, fontSize:'0.72rem', fontWeight:700 }}>{s.currentClass}</span>
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      {s.nextClass
                        ? <span style={{ background:'#dcfce7', color:'#15803d', padding:'3px 8px', borderRadius:99, fontSize:'0.72rem', fontWeight:700 }}>{s.nextClass}</span>
                        : <span style={{ background:'#fef9c3', color:'#854d0e', padding:'3px 8px', borderRadius:99, fontSize:'0.72rem', fontWeight:700 }}>🎓 Graduate</span>}
                    </td>
                    <td style={{ padding:'9px 12px' }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color: s.status === 'Active' ? '#15803d' : '#854d0e' }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
                {preview.data.length > 50 && (
                  <tr><td colSpan={7} style={{ padding:'10px 12px', textAlign:'center', color:'#94a3b8', fontSize:'0.78rem' }}>… and {preview.data.length - 50} more students</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="card" style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1.5px solid #86efac' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CheckCircle size={24} color="#16a34a"/>
            </div>
            <div>
              <h3 style={{ fontWeight:800, color:'#15803d', margin:0 }}>Rollover Complete!</h3>
              <p style={{ color:'#166534', fontSize:'0.82rem', margin:0 }}>{result.message}</p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
            {[
              { label:'Promoted', value:result.promoted, color:'#15803d', bg:'#f0fdf4' },
              { label:'Graduated', value:result.graduated, color:'#854d0e', bg:'#fef9c3' },
              { label:'Errors', value:result.errors, color:'#dc2626', bg:'#fee2e2' },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, borderRadius:10, padding:'12px 16px', textAlign:'center' }}>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:'0.72rem', color:'#64748b', fontWeight:600, marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirm Rollover?" size="sm">
        <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
          <div style={{ width:56, height:56, background:'#fff7ed', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <AlertTriangle size={26} color="#f59e0b"/>
          </div>
          <p style={{ color:'#374151', fontSize:'0.9rem', marginBottom:8 }}>
            You are about to roll over <strong>{currentYear}</strong> → <strong>{preview?.nextYear}</strong>
          </p>
          <p style={{ color:'#64748b', fontSize:'0.82rem' }}>
            <strong>{preview?.willPromote}</strong> students will be promoted and <strong>{preview?.willGraduate}</strong> will graduate. Fee records will be reset.
          </p>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setConfirm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={doRollover} disabled={rolling}>
            <GraduationCap size={14}/> {rolling ? 'Running...' : 'Confirm Rollover'}
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}