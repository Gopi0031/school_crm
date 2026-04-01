'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { PageHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Save, RefreshCw, GraduationCap, CheckCircle } from 'lucide-react';

const ACADEMIC_YEARS = [
  '2023-24','2024-25','2025-26','2026-27','2027-28','2028-29','2029-30'
];

export default function BranchSettings() {
  const { user } = useAuth();
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [saving, setSaving]             = useState(false);
  const [result, setResult]             = useState(null);
  const [loading, setLoading]           = useState(true);

  // Load current settings
  useEffect(() => {
    if (!user?.branch) return;
    fetch(`/api/settings?branch=${encodeURIComponent(user.branch)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.academicYear) setAcademicYear(d.data.academicYear);
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: user?.branch, academicYear }),
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout requiredRole="branch-admin">
      <PageHeader title="School Settings" subtitle="Manage academic year and branch configuration" />

      <div style={{ maxWidth: 520 }}>
        <div className="card" style={{ padding: '28px 30px' }}>

          {/* Academic Year */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={20} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>Academic Year</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Changing this will auto-update all active teachers
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#64748b', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Select Academic Year
            </label>
            <select
              className="select"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              style={{ maxWidth: 200 }}
              disabled={loading}
            >
              {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Result message */}
          {result && (
            <div style={{
              background: result.success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: 10, padding: '12px 16px', marginBottom: 18,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              {result.success && <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />}
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: result.success ? '#166534' : '#991b1b' }}>
                  {result.message}
                </div>
                {result.teachersUpdated !== undefined && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 3 }}>
                    ✅ {result.teachersUpdated} teacher(s) promoted to <strong>{academicYear}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving
              ? <><RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving...</>
              : <><Save size={15} /> Save Settings</>
            }
          </button>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
}
