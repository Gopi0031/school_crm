'use client';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useStudentProfile } from '@/hooks/useStudentData';
import { CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';

export default function StudentFee() {
  const { student, loading } = useStudentProfile();

  if (loading) return (
    <AppLayout requiredRole="student">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 14 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #ede9fe', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading fee details...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </AppLayout>
  );

  const s     = student || {};
  const due   = (s.totalFee || 0) - (s.paidFee || 0);
  const paid  = s.paidFee  || 0;
  const total = s.totalFee || 0;
  const pct   = total ? Math.round(paid / total * 100) : 0;
  const terms = [
    { label: 'Term 1', paid: s.term1 || 0, expected: total ? Math.round(total / 3) : 0 },
    { label: 'Term 2', paid: s.term2 || 0, expected: total ? Math.round(total / 3) : 0 },
    { label: 'Term 3', paid: s.term3 || 0, expected: total ? Math.round(total / 3) : 0 },
  ];

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="Fee Details" subtitle="Your fee payment status" />

      <div style={{ maxWidth: 700 }}>
        {/* Summary Hero */}
        <div style={{
          background: due > 0
            ? 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)'
            : 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
          borderRadius: 18, padding: '26px 28px', marginBottom: 20,
          animation: 'fadeSlideUp 0.4s ease both',
          boxShadow: due > 0 ? '0 8px 32px rgba(239,68,68,0.25)' : '0 8px 32px rgba(16,185,129,0.25)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>
                {due > 0 ? '⚠️ Outstanding Balance' : '✅ Payment Complete'}
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>
                ₹{due.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                {due > 0 ? 'Amount remaining to be paid' : 'All dues cleared!'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>{s.academicYear}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>₹{paid.toLocaleString()} paid</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>of ₹{total.toLocaleString()} total</div>
              <div style={{ marginTop: 8, height: 8, width: 120, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: 'white', borderRadius: 99, transition: 'width 1s ease' }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{pct}% complete</div>
            </div>
          </div>
        </div>

        {/* Term Cards */}
        <div className="card" style={{ marginBottom: 18, animation: 'fadeSlideUp 0.4s ease both', animationDelay: '120ms' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 18, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CreditCard size={16} color="#7c3aed" /> Term-wise Payments
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }} className="term-grid">
            {terms.map(({ label, paid: tPaid, expected }, i) => {
              const done     = tPaid > 0;
              const termPct  = expected ? Math.min(Math.round(tPaid / expected * 100), 100) : 0;
              return (
                <div key={label} style={{
                  border: `1.5px solid ${done ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: 14, padding: '18px 14px',
                  background: done ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : '#f8fafc',
                  textAlign: 'center',
                  animation: 'fadeSlideUp 0.4s ease both', animationDelay: `${160 + i * 80}ms`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    {done
                      ? <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={22} color="#16a34a" /></div>
                      : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={22} color="#94a3b8" /></div>
                    }
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: done ? '#16a34a' : '#94a3b8' }}>
                    ₹{tPaid.toLocaleString()}
                  </div>
                  <div style={{ height: 5, background: '#e2e8f0', borderRadius: 99, marginTop: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${termPct}%`, background: done ? '#10b981' : '#e2e8f0', borderRadius: 99, transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: done ? '#16a34a' : '#94a3b8', marginTop: 6, fontWeight: 700 }}>
                    {done ? '✓ Paid' : 'Pending'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress detail */}
        <div className="card" style={{ marginBottom: 18, animation: 'fadeSlideUp 0.4s ease both', animationDelay: '320ms' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14, color: '#1e293b' }}>Payment Progress</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
            <span>Paid: <strong style={{ color: '#10b981' }}>₹{paid.toLocaleString()}</strong></span>
            <span style={{ fontWeight: 700, color: pct >= 100 ? '#10b981' : '#4f46e5' }}>{pct}%</span>
            <span>Total: <strong>₹{total.toLocaleString()}</strong></span>
          </div>
          <div style={{ height: 14, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#7c3aed,#a78bfa)', borderRadius: 99, transition: 'width 1.2s ease' }} />
          </div>
          {due > 0 && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#dc2626' }}>
              <AlertCircle size={14} />
              <span>₹{due.toLocaleString()} pending. Please contact the branch office.</span>
            </div>
          )}
        </div>

        {/* Student Details */}
        <div className="card" style={{ animation: 'fadeSlideUp 0.4s ease both', animationDelay: '400ms' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>Student Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Name',     s.name],
              ['Roll No',  s.rollNo],
              ['Class',    s.class ? `${s.class} — ${s.section}` : '—'],
              ['Branch',   s.branch],
              ['Parent',   s.parentName],
              ['Phone',    s.phone],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 3, color: '#1e293b' }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 500px) { .term-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </AppLayout>
  );
}
