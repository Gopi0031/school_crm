'use client';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useStudentProfile } from '@/hooks/useStudentData';
import { CheckCircle, Clock, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function StudentFee() {
  const { student, loading, error, refetch } = useStudentProfile();

  // Loading state
  if (loading) {
    return (
      <AppLayout requiredRole="student">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: 360, 
          gap: 14 
        }}>
          <div style={{ 
            width: 40, 
            height: 40, 
            border: '3px solid #ede9fe', 
            borderTopColor: '#7c3aed', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} />
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading fee details...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error || !student) {
    return (
      <AppLayout requiredRole="student">
        <PageHeader title="Fee Details" subtitle="Your fee payment status" />
        <div className="card" style={{ textAlign: 'center', padding: 40, maxWidth: 500, margin: '0 auto' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ color: '#ef4444', marginBottom: 8 }}>{error || 'Unable to load fee details'}</h3>
          <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.875rem' }}>
            Your profile may not be linked correctly. Please contact your branch admin.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={refetch} 
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <Link href="/login">
              <button className="btn btn-outline">Re-Login</button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Fee calculations
  const s = student;
  const total = Number(s.totalFee) || 0;
  const paid  = Number(s.paidFee)  || 0;
  const due   = Math.max(0, total - paid);
  const pct   = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Term values
  const t1Paid = Number(s.term1) || 0;
  const t2Paid = Number(s.term2) || 0;
  const t3Paid = Number(s.term3) || 0;

  // Expected per term
  const base       = total > 0 ? Math.floor(total / 3) : 0;
  const extra      = total > 0 ? total - base * 3 : 0;
  const t1Expected = base + extra;
  const t2Expected = base;
  const t3Expected = base;

  // Term dues
  const t1Due = Number(s.term1Due) || Math.max(0, t1Expected - t1Paid);
  const t2Due = Number(s.term2Due) || Math.max(0, t2Expected - t2Paid);
  const t3Due = Number(s.term3Due) || Math.max(0, t3Expected - t3Paid);

  const terms = [
    { label: 'Term 1', paid: t1Paid, due: t1Due, expected: t1Expected },
    { label: 'Term 2', paid: t2Paid, due: t2Due, expected: t2Expected },
    { label: 'Term 3', paid: t3Paid, due: t3Due, expected: t3Expected },
  ];

  return (
    <AppLayout requiredRole="student">
      <PageHeader title="Fee Details" subtitle="Your fee payment status" />

      <div style={{ maxWidth: 700 }}>

        {/* No Fee Set State */}
        {total === 0 && (
          <div style={{ 
            padding: '24px 20px', 
            background: '#fffbeb', 
            border: '1.5px solid #fde68a', 
            borderRadius: 14, 
            marginBottom: 20, 
            textAlign: 'center', 
            color: '#92400e' 
          }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px' }} color="#d97706" />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              Fee Not Assigned Yet
            </div>
            <div style={{ fontSize: '0.82rem', color: '#b45309' }}>
              Your total fee has not been set by the school admin.<br />
              Please contact your branch office.
            </div>
          </div>
        )}

        {/* Summary Hero */}
        <div style={{
          background: due > 0
            ? 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)'
            : total === 0
              ? 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)'
              : 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
          borderRadius: 18, 
          padding: '26px 28px', 
          marginBottom: 20,
          animation: 'fadeSlideUp 0.4s ease both',
          boxShadow: due > 0 
            ? '0 8px 32px rgba(239,68,68,0.25)' 
            : '0 8px 32px rgba(16,185,129,0.25)',
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 16 
          }}>
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.7)', 
                fontWeight: 600, 
                marginBottom: 4 
              }}>
                {total === 0 
                  ? '⏳ Fee Not Assigned' 
                  : due > 0 
                    ? '⚠️ Outstanding Balance' 
                    : '✅ Payment Complete'}
              </div>
              <div style={{ 
                fontSize: '2.4rem', 
                fontWeight: 900, 
                color: 'white', 
                lineHeight: 1 
              }}>
                ₹{due.toLocaleString()}
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255,255,255,0.7)', 
                marginTop: 4 
              }}>
                {total === 0 
                  ? 'Contact branch office' 
                  : due > 0 
                    ? 'Amount remaining to be paid' 
                    : 'All dues cleared! 🎉'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ 
                fontSize: '0.72rem', 
                color: 'rgba(255,255,255,0.65)', 
                marginBottom: 6 
              }}>
                {s.academicYear || '2025-26'}
              </div>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 800, 
                color: 'white' 
              }}>
                ₹{paid.toLocaleString()} paid
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.65)', 
                marginTop: 2 
              }}>
                of ₹{total.toLocaleString()} total
              </div>
              <div style={{ 
                marginTop: 8, 
                height: 8, 
                width: 120, 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: 99, 
                overflow: 'hidden' 
              }}>
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(pct, 100)}%`, 
                  background: 'white', 
                  borderRadius: 99, 
                  transition: 'width 1s ease' 
                }} />
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: 'rgba(255,255,255,0.65)', 
                marginTop: 4 
              }}>
                {pct}% complete
              </div>
            </div>
          </div>
        </div>

        {/* Term Cards */}
        <div className="card" style={{ 
          marginBottom: 18, 
          animation: 'fadeSlideUp 0.4s ease both', 
          animationDelay: '120ms' 
        }}>
          <h3 style={{ 
            fontWeight: 700, 
            marginBottom: 18, 
            color: '#1e293b', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8 
          }}>
            <CreditCard size={16} color="#7c3aed" /> Term-wise Payments
          </h3>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3,1fr)', 
              gap: 14 
            }} 
            className="term-grid"
          >
            {terms.map(({ label, paid: tPaid, due: tDue, expected }, i) => {
              const isDone    = expected > 0 && tPaid >= expected;
              const isPartial = tPaid > 0 && tDue > 0;
              const isPending = tPaid === 0 && expected > 0;
              const termPct   = expected > 0 
                ? Math.min(Math.round((tPaid / expected) * 100), 100) 
                : 0;

              return (
                <div key={label} style={{
                  border: `1.5px solid ${isDone ? '#bbf7d0' : isPartial ? '#fde68a' : '#e2e8f0'}`,
                  borderRadius: 14, 
                  padding: '18px 14px',
                  background: isDone 
                    ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' 
                    : isPartial 
                      ? 'linear-gradient(135deg,#fffbeb,#fef9c3)' 
                      : '#f8fafc',
                  textAlign: 'center',
                  animation: 'fadeSlideUp 0.4s ease both', 
                  animationDelay: `${160 + i * 80}ms`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                    {isDone ? (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#dcfce7', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <CheckCircle size={22} color="#16a34a" />
                      </div>
                    ) : isPartial ? (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#fef9c3', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <AlertCircle size={22} color="#d97706" />
                      </div>
                    ) : (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#f1f5f9', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Clock size={22} color="#94a3b8" />
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    fontWeight: 700, 
                    fontSize: '0.875rem', 
                    color: '#374151', 
                    marginBottom: 6 
                  }}>
                    {label}
                  </div>

                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 900, 
                    color: isDone ? '#16a34a' : isPartial ? '#d97706' : '#94a3b8' 
                  }}>
                    ₹{tPaid.toLocaleString()}
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 500, 
                      color: '#94a3b8', 
                      marginLeft: 4 
                    }}>
                      paid
                    </span>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                    of ₹{expected.toLocaleString()}
                  </div>

                  {tDue > 0 && (
                    <div style={{ 
                      fontSize: '0.78rem', 
                      color: '#ef4444', 
                      fontWeight: 700, 
                      marginTop: 6, 
                      padding: '4px 8px', 
                      background: '#fee2e2', 
                      borderRadius: 8 
                    }}>
                      ₹{tDue.toLocaleString()} due
                    </div>
                  )}

                  <div style={{ 
                    height: 5, 
                    background: '#e2e8f0', 
                    borderRadius: 99, 
                    marginTop: 10, 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${termPct}%`, 
                      background: isDone ? '#10b981' : isPartial ? '#f59e0b' : '#e2e8f0', 
                      borderRadius: 99, 
                      transition: 'width 1s ease' 
                    }} />
                  </div>
                  <div style={{ 
                    fontSize: '0.68rem', 
                    color: isDone ? '#16a34a' : isPartial ? '#d97706' : '#94a3b8', 
                    marginTop: 6, 
                    fontWeight: 700 
                  }}>
                    {total === 0 ? '—' : isDone ? '✅ Paid' : isPartial ? `${termPct}% Paid` : 'Pending'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Detail */}
        <div className="card" style={{ 
          marginBottom: 18, 
          animation: 'fadeSlideUp 0.4s ease both', 
          animationDelay: '320ms' 
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14, color: '#1e293b' }}>
            Payment Progress
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '0.8rem', 
            color: '#64748b', 
            marginBottom: 8 
          }}>
            <span>
              Paid: <strong style={{ color: '#10b981' }}>₹{paid.toLocaleString()}</strong>
            </span>
            <span style={{ fontWeight: 700, color: pct >= 100 ? '#10b981' : '#4f46e5' }}>
              {pct}%
            </span>
            <span>
              Total: <strong>₹{total.toLocaleString()}</strong>
            </span>
          </div>
          <div style={{ 
            height: 14, 
            background: '#f1f5f9', 
            borderRadius: 99, 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              height: '100%', 
              width: `${Math.min(pct, 100)}%`, 
              background: pct >= 100 
                ? 'linear-gradient(90deg,#10b981,#34d399)' 
                : 'linear-gradient(90deg,#7c3aed,#a78bfa)', 
              borderRadius: 99, 
              transition: 'width 1.2s ease' 
            }} />
          </div>

          {total === 0 ? (
            <div style={{ 
              marginTop: 10, 
              padding: '10px 14px', 
              background: '#fffbeb', 
              border: '1px solid #fde68a', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: '0.8rem', 
              color: '#92400e' 
            }}>
              <AlertCircle size={14} />
              <span>Fee not assigned. Please contact your branch office.</span>
            </div>
          ) : due > 0 ? (
            <div style={{ 
              marginTop: 10, 
              padding: '10px 14px', 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: '0.8rem', 
              color: '#dc2626' 
            }}>
              <AlertCircle size={14} />
              <span>₹{due.toLocaleString()} pending. Please contact the branch office.</span>
            </div>
          ) : (
            <div style={{ 
              marginTop: 10, 
              padding: '10px 14px', 
              background: '#f0fdf4', 
              border: '1px solid #bbf7d0', 
              borderRadius: 10, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: '0.8rem', 
              color: '#16a34a' 
            }}>
              <CheckCircle size={14} />
              <span>All fees cleared for {s.academicYear}. Thank you!</span>
            </div>
          )}
        </div>

        {/* Student Details */}
        <div className="card" style={{ animation: 'fadeSlideUp 0.4s ease both', animationDelay: '400ms' }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>
            Student Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Name', s.name],
              ['Roll No', s.rollNo],
              ['Class', s.class ? `${s.class} — ${s.section}` : '—'],
              ['Branch', s.branch],
              ['Parent', s.parentName],
              ['Phone', s.phone],
              ['Academic Yr', s.academicYear],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ 
                  fontSize: '0.68rem', 
                  color: '#94a3b8', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em' 
                }}>
                  {l}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginTop: 3, color: '#1e293b' }}>
                  {v || '—'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Refresh Button */}
          <button 
            className="btn btn-outline" 
            style={{ 
              marginTop: 14, 
              width: '100%', 
              fontSize: '0.8rem', 
              color: '#7c3aed', 
              borderColor: '#7c3aed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }} 
            onClick={refetch}
          >
            <RefreshCw size={14} /> Refresh Fee Data
          </button>
        </div>

      </div>

      <style>{`
        @keyframes fadeSlideUp { 
          from { opacity: 0; transform: translateY(14px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 500px) { 
          .term-grid { grid-template-columns: 1fr !important; } 
        }
      `}</style>
    </AppLayout>
  );
}